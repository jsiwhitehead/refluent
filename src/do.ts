import * as React from 'react';
import * as memize from 'memize';

import createCache from './cache';
import { clearUndef, isPlain, Root, shallowEqual, select } from './utils';

class Runner {
  selectors;
  map;
  getState;
  setState;

  cache = createCache();
  mounted = false;
  unmount;

  capture: null | { pushed: any; callbacks: any } = null;
  active: null | {
    props: any;
    state: { watchers: any; pushed: any; callbacks: any };
  } = null;

  constructor(selectors, map, getState, setState) {
    this.selectors = selectors;
    this.map = map;
    this.getState = getState;
    this.setState = setState;
  }

  createWatcher(selectors, map, extra?) {
    const memoizedMap = memize(
      args => {
        this.capture = { pushed: {}, callbacks: [] };
        const value = map.apply(null, args);
        if (typeof value === 'function') value();
        else if (value) Object.assign(this.capture.pushed, value);
        const result = this.capture;
        this.capture = null;
        return result;
      },
      { maxSize: 50 },
    );
    return {
      getArgs: () =>
        selectors
          .map(s => select(s, this.active!.props, this.active!.state.pushed))
          .concat(extra || []),
      run: (args, commit) => {
        if (commit) {
          const value = map.apply(null, args.concat(true));
          if (typeof value === 'function') return value;
          if (value) {
            Object.assign(this.active!.state.pushed, this.cache(value, true));
          }
        } else {
          const { pushed, callbacks } = memoizedMap(args);
          Object.assign(this.active!.state.pushed, this.cache(pushed, true));
          this.active!.state.callbacks.push(...callbacks);
        }
      },
    };
  }

  runWatcher(watcher, commit) {
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
  }

  runLayer(commit) {
    const prev = { ...this.active!.state.pushed };
    this.active!.state.watchers = this.active!.state.watchers.map(w =>
      this.runWatcher(w, commit),
    );
    if (!shallowEqual(this.active!.state.pushed, prev)) this.runLayer(commit);
  }

  run(props, state, func?, commit?) {
    this.active = {
      props,
      state: {
        watchers: state.watchers || [],
        pushed: { ...(state.pushed || {}) },
        callbacks: [...(state.callbacks || [])],
      },
    };
    if (func) func();
    this.runLayer(commit);
    const result = this.active.state;
    this.active = null;
    Object.keys(result).forEach(k => {
      if (state[k] && shallowEqual(result[k], state[k])) result[k] = state[k];
    });
    if (shallowEqual(result, state)) return null;
    result.callbacks = result.callbacks.filter(c => !c.done);
    return result;
  }

  push = (update, callback?) => {
    if (this.capture) {
      Object.assign(this.capture.pushed, update || {});
      if (callback) this.capture.callbacks.push({ call: callback });
    } else if (this.active) {
      Object.assign(this.active.state.pushed, this.cache(update || {}, true));
      if (callback) this.active.state.callbacks.push({ call: callback });
    } else if (this.mounted) {
      this.setState((props, state) =>
        this.run(props, state, () => {
          Object.assign(
            this.active!.state.pushed,
            this.cache(update || {}, true),
          );
          if (callback) this.active!.state.callbacks.push({ call: callback });
        }),
      );
    }
  };

  load(props, state?) {
    if (state) this.mounted = true;
    return this.run(
      props,
      { pushed: state && state.pushed },
      () => {
        let loaded = false;
        const watch: any = (sels, m, extra?) => {
          this.active!.state.watchers.push(
            this.runWatcher(this.createWatcher(sels, m, extra), !!state),
          );
        };
        if (this.selectors.length) {
          watch(this.selectors, this.map, this.push);
        } else {
          const value = this.map(
            (...sels) => {
              const m = sels.pop();
              if (!sels.length) {
                if (this.capture) {
                  throw new Error('Get called in render');
                }
                if (this.active) {
                  return m ? this.active.state.pushed : this.active.props;
                }
                return this.getState(m);
              }
              if (loaded) throw new Error('Watch called after load');
              watch(sels, m);
            },
            this.push,
            !!state,
          );
          if (typeof value === 'function') {
            if (state) this.unmount = value;
            else value();
          } else if (value) {
            Object.assign(this.active!.state.pushed, this.cache(value, true));
          }
        }
        loaded = true;
      },
      !!state,
    );
  }
}

export default function(...selectors) {
  return (C: any = Root) => {
    const map = selectors.pop();

    if (
      (!selectors.length && map.length < 2) ||
      map.length <= selectors.length
    ) {
      let mapResult = selectors.length ? {} : null;
      const maps: any[] = selectors.length ? [[selectors, map]] : [];
      const globalMaps = {};
      return class DoPure extends React.Component {
        state = { maps: {}, cache: createCache(), pushed: null as {} | null };
        static getDerivedStateFromProps(props, state) {
          if (!mapResult) {
            mapResult =
              map((...sels) => {
                const m = sels.pop();
                if (!sels.length) throw new Error('Get called in pure do');
                maps.push([sels, m]);
              }) || {};
          }
          const next = { maps: {}, pushed: {} } as any;
          maps.forEach(([sels, m], i) => {
            const args = sels.map(s => select(s, props));
            if (args.every(isPlain)) {
              globalMaps[i] = globalMaps[i] || memize(m, { maxSize: 50 });
              Object.assign(next.pushed, globalMaps[i].apply(null, args) || {});
            } else {
              next.maps[i] = state.maps[i] || memize(m, { maxSize: 10 });
              Object.assign(next.pushed, next.maps[i].apply(null, args) || {});
            }
          });
          Object.assign(next.pushed, mapResult);
          next.pushed = state.cache(next.pushed);
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
      constructor(props) {
        super(props);
        const runner = new Runner(
          selectors,
          map,
          v => (v ? this.state.state.pushed : this.props),
          func => {
            this.setState(({ state }) => {
              const next = func(this.props, state);
              return next ? { state: next } : null;
            });
          },
        );
        this.state = { runner, state: runner.load(this.props) };
      }
      static getDerivedStateFromProps(props, { runner, state }) {
        const next = runner.run(props, state);
        return next ? { state: next } : null;
      }
      componentDidMount() {
        const { runner, state } = this.state;
        this.setState({ state: runner.load(this.props, state) });
      }
      componentDidUpdate() {
        const { runner, state } = this.state;
        const next = runner.run(
          this.props,
          state,
          () => {
            state.callbacks.forEach(c => {
              c.call();
              c.done = true;
            });
          },
          true,
        );
        if (next) this.setState({ state: next });
      }
      componentWillUnmount() {
        const { runner, state } = this.state;
        state.watchers.forEach(w => w.stop && w.stop());
        if (runner.unmount) runner.unmount();
      }
      render() {
        return React.createElement(
          C,
          clearUndef({ ...this.props, ...this.state.state.pushed }),
        );
      }
    };
  };
}
