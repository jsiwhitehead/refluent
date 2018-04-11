import * as React from 'react';
import * as memize from 'memize';

import { clearUndef, createCache, shallowEqual, select } from './utils';

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
        throw new Error("Watch shouldn't be called after mount");
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

const runWatchers = (props, cache, prev, commit) => {
  if (commit) commitGetter = (p?) => (p ? prev.pushed : props);
  const update = newUpdate();
  update.watchers = prev.watchers.map(w => {
    const lastArgs = w[commit ? 'commitArgs' : 'renderArgs'];
    const args = (commit && w.renderArgs) || w.getArgs(props, prev.pushed);
    if (!lastArgs || args.some((a, i) => a !== lastArgs[i])) {
      if (commit && w.stop) w.stop();
      const res = w.run(args, commit);
      Object.assign(update.pushed, res.pushed);
      update.callbacks.push(...res.callbacks);
      if (!commit) {
        if (res.stop) res.stop();
        return { ...w, renderArgs: args };
      }
      return { ...w, commitArgs: args, renderArgs: args, stop: res.stop };
    }
    return w;
  });
  update.pushed = { ...prev.pushed, ...cache(update.pushed) };
  update.callbacks = [...prev.callbacks, ...update.callbacks];
  return !shallowEqual(update.pushed, prev.pushed)
    ? runWatchers(props, cache, update, commit)
    : update;
};

const run = (props, state, commit) => {
  const { cache, ...prev } = state;
  const update = runWatchers(props, cache, prev, commit);
  commitGetter = null;
  ['watchers', 'pushed', 'callbacks'].forEach(k => {
    if (shallowEqual(update[k], prev[k])) update[k] = prev[k];
  });
  return { cache, ...update };
};

export default function(C, selectors, map) {
  return class Do extends React.Component<any, any> {
    mounted = false;
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
          this.setState(prev => {
            const pushed = { ...prev.pushed, ...prev.cache(p) };
            const next = !shallowEqual(prev.pushed, pushed)
              ? run(this.props, { ...prev, pushed }, false)
              : prev;
            if (cb) next.callbacks = [...next.callbacks, cb];
            if (!shallowEqual(next, prev)) return next;
          });
        }
      };
      this.init = (prev?) => {
        const { stop, pushed: p, ...update } = capture(
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
                  !!prev,
                ),
          true,
        );
        if (stop) {
          if (prev) this.unmount = stop;
          else stop();
        }
        const cache = createCache(true);
        const pushed = cache({ ...(prev || {}), ...p });
        return run(this.props, { cache, ...update, pushed }, !!prev);
      };
      this.state = this.init();
    }
    static getDerivedStateFromProps(props, state) {
      const next = run(props, state, false);
      next.callbacks = next.callbacks.filter(c => !c.done);
      return next;
    }
    componentDidMount() {
      this.mounted = true;
      this.setState(this.init(this.state.pushed));
    }
    componentDidUpdate() {
      const { pushed: p, callbacks } = capture(() => {
        this.state.callbacks.forEach(c => {
          c.call();
          c.done = true;
        });
      }, false);
      const pushed = { ...this.state.pushed, ...this.state.cache(p) };
      const next = run(this.props, { ...this.state, pushed }, true);
      if (shallowEqual(next.pushed, this.state.pushed)) {
        next.pushed = this.state.pushed;
      }
      if (callbacks.length) next.callbacks = [...next.callbacks, ...callbacks];
      if (!shallowEqual(next, this.state)) {
        next.callbacks = next.callbacks.filter(c => !c.done);
        this.setState(next);
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
