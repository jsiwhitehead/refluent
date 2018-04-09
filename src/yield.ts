import * as React from 'react';
import * as memize from 'memize';

import { clearUndef, createCache, isPlain, select } from './utils';

export default function(...selectors) {
  return getComp => () => {
    const map = selectors.pop();

    if (!selectors.length && typeof map !== 'function') return () => map;

    if (map.length === selectors.length) {
      const globalMap = memize(map, { maxSize: 50 });
      return class YieldPure extends React.Component {
        map;
        render() {
          const args = selectors.map(s => select(s, this.props));
          if (!args.every(isPlain)) return globalMap.apply(null, args);
          this.map = this.map || memize(map, { maxSize: 10 });
          return this.map.apply(null, args);
        }
      };
    }

    let C;
    return class Yield extends React.Component<any> {
      state = { cache: createCache(), next: null };
      static getDerivedStateFromProps(props, state) {
        return state.cache({
          next: getComp
            ? (extra: any = props => props) =>
                React.createElement(
                  C || (C = getComp()),
                  clearUndef({
                    ...(typeof extra === 'function' ? extra(props) : extra),
                    next: props.next,
                  }),
                )
            : props.next,
        });
      }
      render() {
        if (!selectors.length) {
          return React.createElement(map, {
            ...this.props,
            next: this.state.next,
          });
        }
        return map.apply(
          null,
          selectors.map(s => select(s, this.props)).concat(this.state.next),
        );
      }
    };
  };
}
