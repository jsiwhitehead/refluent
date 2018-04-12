import * as React from 'react';
import * as memize from 'memize';

import doPush from './doPush';
import { clearUndef, createCache, isPlain, root, select } from './utils';

export default function(...selectors) {
  return (getComp = root) => () => {
    const C = getComp();
    const map = selectors.pop();

    if (!selectors.length && typeof map !== 'function') {
      return props => React.createElement(C, { ...props, ...map });
    }

    if (
      (!selectors.length && map.length === 1) ||
      map.length <= selectors.length
    ) {
      const maps: any[] = [];
      let initial;
      if (!selectors.length) {
        initial = map((...sels) => {
          const m = sels.pop();
          maps.push([sels, m]);
        });
      } else {
        maps.push([selectors, map]);
      }
      const globalMaps = {};
      return class DoPure extends React.Component {
        state = { maps: {}, cache: createCache(), pushed: null as {} | null };
        static getDerivedStateFromProps(props, state) {
          const next = { maps: {}, pushed: {} } as any;
          maps.forEach(([sels, m], i) => {
            const args = sels.map(s => select(s, props));
            if (args.every(isPlain)) {
              next.maps[i] = state.maps[i] || memize(m, { maxSize: 10 });
              Object.assign(next.pushed, next.maps[i].apply(null, args) || {});
            } else {
              globalMaps[i] = globalMaps[i] || memize(m, { maxSize: 50 });
              Object.assign(next.pushed, globalMaps[i].apply(null, args) || {});
            }
          });
          Object.assign(next.pushed, initial || {});
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

    return doPush(C, selectors, map);
  };
}
