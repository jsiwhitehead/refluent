import * as React from 'react';
import * as memize from 'memize';

import {
  clearUndef,
  createCache,
  isPlain,
  root,
  shallowEqual,
  select,
} from './utils';

const createWatcher = (selectors, map, extra?) => {
  let lastArgs;
  let cancel;
  let done;
  const memoizedMap = memize(args => capture(() => map.apply(null, args)), {
    maxSize: 50,
  });
  return {
    args: null as any,
    select: (props, pushed) =>
      selectors.map(s => select(s, props, pushed)).concat(extra || []),
    render: (props, pushed, args) => {
      return process(props, pushed, memoizedMap(args));
    },
    commit: args => {
      if (!lastArgs || args.some((a, i) => a !== lastArgs[i])) {
        lastArgs = args;
        if (cancel) cancel();
        const value = map.apply(null, args.concat(true));
        cancel = typeof value === 'function' ? value : null;
      }
    },
    unwatch: () => {
      if (!done) {
        if (cancel) cancel();
        done = true;
      }
    },
    done: () => done,
  };
};
const createCallback = callback => {
  let done;
  return {
    call: () => {
      callback();
      done = true;
    },
    done: () => done,
  };
};

let captureWatch;
let capturePush;
const capture = func => {
  const prevWatch = captureWatch;
  const prevPush = capturePush;
  const actions: [string, any][] = [];
  captureWatch = (sels, m, extra?) => {
    if (!sels.length) {
      throw new Error("Prop getter shouldn't be called during capture");
    }
    actions.push(['watch', () => createWatcher(sels, m, extra)]);
  };
  capturePush = (obj, cb?) => {
    actions.push(['push', obj]);
    if (cb) actions.push(['callback', () => createCallback(cb)]);
  };
  const value = func();
  if (typeof value === 'function') actions.push(['complete', value]);
  else if (value) actions.push(['push', value]);
  captureWatch = prevWatch;
  capturePush = prevPush;
  return actions;
};
const process = (props, pushed, actions: [string, any][]) => {
  const update = {
    watchers: [] as any,
    pushed: {},
    callbacks: [] as any[],
  };
  actions.forEach(([type, action]) => {
    if (type === 'watch') {
      const watcher = action();
      update.watchers.push(watcher);
      watcher.args = watcher.select(props, pushed);
      const res = watcher.render(props, pushed, watcher.args);
      update.watchers.push(...res.watchers);
      Object.assign(update.pushed, res.pushed);
      update.callbacks.push(...res.callbacks);
    } else if (type === 'push') {
      Object.assign(update.pushed, action);
    } else if (type === 'callback') {
      update.callbacks.push(action());
    } else if (type === 'complete') {
      action();
    }
  });
  return update;
};
const renderLayer = (props, state) => {
  const next = { ...state, watchers: [], pushed: {} };
  const watchers = state.watchers.filter(w => !w.done()).map(w => {
    const args = w.select(props, state.pushed);
    if (!w.args || args.some((a, i) => a !== w.args[i])) {
      const res = w.render(props, state.pushed, args);
      next.watchers.push(...res.watchers);
      Object.assign(next.pushed, res.pushed);
      next.callbacks.push(...res.callbacks);
      return { ...w, args };
    }
    return w;
  });
  next.watchers = [...watchers, ...next.watchers];
  if (shallowEqual(next.watchers, state.watchers)) {
    next.watchers = state.watchers;
  }
  next.pushed = { ...state.pushed, ...state.cache(next.pushed) };
  if (shallowEqual(next.pushed, state.pushed)) next.pushed = state.pushed;
  return next.watchers !== state.watchers || next.pushed !== state.pushed
    ? renderLayer(props, next)
    : next;
};
const render = (props, state, prevState = state) => {
  const next = renderLayer(props, {
    ...state,
    callbacks: state.callbacks.filter(c => !c.done()),
  });
  if (shallowEqual(next.callbacks, state.callbacks)) {
    next.callbacks = state.callbacks;
  }
  return shallowEqual(next, prevState) ? null : next;
};

export default function(...selectors) {
  return (getComp = root) => () => {
    const C = getComp();
    const map = selectors.pop();

    if (!selectors.length && typeof map !== 'function') {
      return props => React.createElement(C, { ...props, ...map });
    }

    if (map.length === selectors.length) {
      let globalMap;
      return class DoPure extends React.Component {
        state = { cache: createCache(), pushed: null as {} | null };
        static getDerivedStateFromProps(props, state) {
          const next = {} as any;
          const args = selectors.map(s => select(s, props));
          if (args.every(isPlain)) {
            next.map = state.map || memize(map, { maxSize: 10 });
            next.pushed = state.cache(next.map.apply(null, args) || {});
          } else {
            globalMap = globalMap || memize(map, { maxSize: 50 });
            next.pushed = state.cache(globalMap.apply(null, args) || {});
          }
          return next;
        }
        render() {
          return React.createElement(
            C,
            clearUndef({ ...this.props, ...this.state.pushed }),
          );
        }
      };
    }

    return class Do extends React.Component<any, any> {
      mounted = false;
      state: any = {
        cache: createCache(true),
        watchers: [] as any[],
        pushed: {},
        callbacks: [] as any[],
      };
      watchers;
      init;
      unmount;
      constructor(props) {
        super(props);
        const push = (update, cb?) => {
          if (!update) {
            if (cb) cb();
          } else if (capturePush) {
            capturePush(update, cb);
          } else if (this.mounted) {
            const pushed = {
              ...this.state.pushed,
              ...this.state.cache(update),
            };
            const next = render(
              this.props,
              { ...this.state, pushed },
              this.state,
            );
            if (next || cb) this.setState(next || {}, cb);
          }
        };
        if (!selectors.length) {
          this.init = () =>
            map((...sels) => {
              const m = sels.pop();
              if (captureWatch) {
                return captureWatch(sels, m);
              } else if (this.mounted) {
                if (!sels.length) return m ? this.state.pushed : this.props;
                const watcher = createWatcher(sels, m);
                const next = render(
                  this.props,
                  {
                    ...this.state,
                    watchers: [...this.state.watchers, watcher],
                  },
                  this.state,
                );
                if (next) this.setState(next);
                return watcher.unwatch;
              }
            }, push);
        }
        const update = process(
          this.props,
          this.state.pushed,
          capture(this.init || (() => captureWatch(selectors, map, push))),
        );
        this.state.watchers = update.watchers;
        this.state.pushed = this.state.cache(update.pushed);
        this.state.callbacks = update.callbacks;
      }
      static getDerivedStateFromProps(props, state) {
        return render(props, state);
      }
      componentDidMount() {
        this.mounted = true;
        if (this.init) {
          captureWatch = () => () => {};
          capturePush = () => {};
          const value = this.init();
          if (typeof value === 'function') this.unmount = value;
          captureWatch = null;
          capturePush = null;
        }
        this.watchers = [...this.state.watchers];
        this.watchers.forEach(w => w.commit(w.args));
        this.state.callbacks.forEach(c => c.call());
      }
      componentDidUpdate() {
        this.watchers.forEach(w => {
          if (!this.state.watchers.find(w2 => w2.render === w.render)) {
            w.unwatch();
          }
        });
        this.watchers = [...this.state.watchers];
        this.watchers.forEach(w => w.commit(w.args));
        this.state.callbacks.forEach(c => c.call());
      }
      componentWillUnmount() {
        this.watchers.forEach(w => w.unwatch());
        if (this.unmount) this.unmount();
      }
      render() {
        return React.createElement(
          C,
          clearUndef({ ...this.props, ...this.state.pushed }),
        );
      }
    };
  };
}
