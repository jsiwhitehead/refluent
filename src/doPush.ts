import * as React from 'react';
import * as memize from 'memize';

import { clearUndef, createCache, shallowEqual, select } from './utils';

const replaceIfEqual = (obj1, obj2, ...keys) =>
  keys.forEach(k => {
    if (shallowEqual(obj1[k], obj2[k])) obj1[k] = obj2[k];
  });

const newUpdate = () => ({
  watchers: [] as any[],
  pushed: {},
  callbacks: [] as any[],
});

let temp;
let commitGetter;
const capture = (func, init) => {
  const prevTemp = temp;
  const result = { ...newUpdate(), stop: null as any };
  temp = {
    watch: (selectors, map, extra?) => {
      if (!selectors.length) {
        if (commitGetter) return commitGetter(map);
        throw new Error("Prop getter shouldn't be called during capture");
      }
      if (!init) {
        throw new Error("Watch shouldn't be called outside init");
      }
      const memoizedMap = memize(
        args => capture(() => map.apply(null, args), false),
        { maxSize: 50 },
      );
      result.watchers.push({
        getArgs: (props, pushed) =>
          selectors.map(s => select(s, props, pushed)).concat(extra || []),
        run: (args, commit) =>
          commit
            ? capture(() => map.apply(null, args.concat(true)), false)
            : memoizedMap(args),
      });
    },
    push: (update, callback?) => {
      Object.assign(result.pushed, update);
      if (callback) result.callbacks.push({ call: callback });
    },
  };
  const value = func();
  if (typeof value === 'function') result.stop = value;
  else if (value) Object.assign(result.pushed, value);
  temp = prevTemp;
  return result;
};

const runWatcher = (watcher, update, props, pushed, commit) => {
  const lastArgs = watcher[commit ? 'commitArgs' : 'renderArgs'];
  const args = (commit && watcher.renderArgs) || watcher.getArgs(props, pushed);
  if (!lastArgs || args.some((a, i) => a !== lastArgs[i])) {
    if (commit && watcher.stop) watcher.stop();
    const res = watcher.run(args, commit);
    Object.assign(update.pushed, res.pushed);
    update.callbacks.push(...res.callbacks);
    if (commit) {
      return { ...watcher, commitArgs: args, renderArgs: args, stop: res.stop };
    }
    if (res.stop) res.stop();
    return { ...watcher, renderArgs: args };
  }
  return watcher;
};

const runLayer = (props, cache, prev, commit) => {
  const update = newUpdate();
  update.watchers = prev.watchers.map(w =>
    runWatcher(w, update, props, prev.pushed, commit),
  );
  update.pushed = { ...prev.pushed, ...cache(update.pushed) };
  replaceIfEqual(update, prev, 'pushed');
  return update.pushed !== prev.pushed
    ? runLayer(props, cache, update, commit)
    : update;
};

const run = (props, state, commit) => {
  const { cache, ...prev } = state;
  prev.callbacks = prev.callbacks.filter(c => !c.done);
  const update = runLayer(props, cache, prev, commit);
  replaceIfEqual(update, prev, 'watchers', 'callbacks');
  return update;
};

export default function(C, selectors, map) {
  return class Do extends React.Component<any, any> {
    mounted = false;
    state = { cache: createCache(true), ...newUpdate() };
    init;
    unmount;
    constructor(props) {
      super(props);
      const push = (p, cb?) => {
        if (!p) {
          if (cb) cb();
        } else if (temp) {
          temp.push(p, cb);
        } else if (this.mounted) {
          const pushed = { ...this.state.pushed, ...this.state.cache(p) };
          const next = !shallowEqual(this.state.pushed, pushed)
            ? run(this.props, { ...this.state, pushed }, false)
            : null;
          if (next || cb) this.setState(next || {}, cb);
        }
      };
      this.init = (commit?) =>
        capture(
          () =>
            selectors.length
              ? temp.watch(selectors, map, push)
              : map(
                  (...sels) => {
                    const m = sels.pop();
                    if (temp) return temp.watch(sels, m);
                    if (!sels.length) return m ? this.state.pushed : this.props;
                    throw new Error(
                      "Watch shouldn't be called outside capture",
                    );
                  },
                  push,
                  commit,
                ),
          true,
        );
      const { stop, pushed, ...update } = this.init(false);
      if (stop) stop();
      this.state = {
        ...this.state,
        ...update,
        pushed: this.state.cache(pushed),
      };
      this.state = { ...this.state, ...run(this.props, this.state, false) };
    }
    static getDerivedStateFromProps(props, state) {
      return run(props, state, false);
    }
    componentDidMount() {
      this.mounted = true;
      this.state.callbacks.forEach(c => {
        c.call();
        c.done = true;
      });
      const { stop, pushed, ...update } = this.init(true);
      this.unmount = stop;
      const cache = createCache(true);
      const newState = { cache, ...update, pushed: cache(pushed) };
      commitGetter = (p?) => (p ? newState.pushed : this.props);
      this.setState(run(this.props, newState, true));
      commitGetter = null;
    }
    componentDidUpdate() {
      this.state.callbacks.forEach(c => {
        c.call();
        c.done = true;
      });
      commitGetter = (p?) => (p ? this.state.pushed : this.props);
      const update = run(this.props, this.state, true);
      commitGetter = null;
      replaceIfEqual(update, this.state, 'watchers', 'pushed');
      if (
        update.watchers !== this.state.watchers ||
        update.pushed !== this.state.pushed
      ) {
        this.setState(update);
      }
    }
    componentWillUnmount() {
      this.state.watchers.forEach(w => w.stop && w.stop());
      if (this.unmount) this.unmount();
    }
    render() {
      return React.createElement(
        C,
        clearUndef({ ...this.props, ...this.state.pushed }),
      );
    }
  };
}
