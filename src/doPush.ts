import * as React from 'react';
import * as memize from 'memize';

import { clearUndef, createCache, shallowEqual, select } from './utils';

let currentProps;
let current;
let captureCurrent;
let watch;

const createWatcher = (selectors, map, extra?) => {
  const memoizedMap = memize(
    args => {
      captureCurrent = { pushed: {}, callbacks: [] };
      const value = map.apply(null, args);
      if (typeof value === 'function') value();
      else if (value) Object.assign(captureCurrent.pushed, value);
      const result = captureCurrent;
      captureCurrent = null;
      return result;
    },
    { maxSize: 50 },
  );
  return {
    getArgs: () =>
      selectors
        .map(s => select(s, currentProps, current.pushed))
        .concat(extra || []),
    run: (args, commit) => {
      if (commit) {
        const value = map.apply(null, args.concat(true));
        if (typeof value === 'function') return value;
        if (value) Object.assign(current.pushed, current.cache(value));
      } else {
        const { pushed, callbacks } = memoizedMap(args);
        Object.assign(current.pushed, current.cache(pushed));
        current.callbacks.push(...callbacks);
      }
    },
  };
};
const runWatcher = (watcher, commit) => {
  const lastArgs = watcher[commit ? 'commitArgs' : 'renderArgs'];
  const args = (commit && watcher.renderArgs) || watcher.getArgs();
  if (!lastArgs || args.some((a, i) => a !== lastArgs[i])) {
    if (commit && watcher.stop) watcher.stop();
    const stop = watcher.run(args, commit);
    if (!commit) {
      if (stop) stop();
      return { ...watcher, renderArgs: args };
    }
    return { ...watcher, commitArgs: args, renderArgs: args, stop };
  }
  return watcher;
};

const runLayer = commit => {
  const prev = { ...current.pushed };
  current.watchers = current.watchers.map(w => runWatcher(w, commit));
  if (!shallowEqual(current.pushed, prev)) runLayer(commit);
};

const run = (props, state, func?, commit?) => {
  currentProps = props;
  current = {
    ...state,
    watchers: state.watchers || [],
    pushed: { ...(state.pushed || {}) },
    callbacks: [...(state.callbacks || [])],
  };
  if (func) func();
  runLayer(commit);
  const result = current;
  currentProps = null;
  current = null;
  ['watchers', 'pushed', 'callbacks'].forEach(k => {
    if (state[k] && shallowEqual(result[k], state[k])) result[k] = state[k];
  });
  if (shallowEqual(result, state)) return null;
  result.callbacks = result.callbacks.filter(c => !c.done);
  return result;
};

export default function(C, selectors, map) {
  return class Do extends React.Component<any, any> {
    mounted = false;
    init;
    unmount;
    constructor(props) {
      super(props);
      const push = (update, callback?) => {
        if (captureCurrent) {
          Object.assign(captureCurrent.pushed, update || {});
          if (callback) captureCurrent.callbacks.push({ call: callback });
        } else if (current) {
          Object.assign(current.pushed, current.cache(update || {}));
          if (callback) current.callbacks.push({ call: callback });
        } else if (this.mounted) {
          this.setState(prev =>
            run(this.props, prev, () => {
              Object.assign(current.pushed, prev.cache(update || {}));
              if (callback) current.callbacks.push({ call: callback });
            }),
          );
        }
      };
      this.init = (prev?) =>
        run(
          this.props,
          { cache: createCache(true) },
          () => {
            watch = (sels, m, extra?) => {
              current.watchers.push(
                runWatcher(createWatcher(sels, m, extra), !!prev),
              );
            };
            if (selectors.length) {
              watch(selectors, map, push);
            } else {
              const value = map(
                (...sels) => {
                  const m = sels.pop();
                  if (!sels.length) {
                    if (captureCurrent) throw new Error('Get called in render');
                    if (current) return m ? current.pushed : currentProps;
                    return m ? this.state.pushed : this.props;
                  }
                  if (!watch) throw new Error('Watch called after init');
                  watch(sels, m);
                },
                push,
                !!prev,
              );
              if (typeof value === 'function') {
                if (prev) this.unmount = value;
                else value();
              } else if (value) {
                Object.assign(current.pushed, current.cache(value));
              }
            }
            watch = null;
          },
          !!prev,
        );
      this.state = this.init();
    }
    static getDerivedStateFromProps(props, state) {
      return run(props, state);
    }
    componentDidMount() {
      this.mounted = true;
      this.setState(this.init(this.state.pushed));
    }
    componentDidUpdate() {
      const next = run(
        this.props,
        this.state,
        () => {
          this.state.callbacks.forEach(c => {
            c.call();
            c.done = true;
          });
        },
        true,
      );
      if (next) this.setState(next);
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
