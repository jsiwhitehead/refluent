import * as React from 'react';

import { clearUndef, createCache, root } from './utils';

export default function(...args) {
  return (getComp = root) => () => {
    const C = getComp();
    const withCache = args.length > 0 && args[args.length - 1] === true;
    const keys = withCache ? args.slice(0, -1) : args;
    class Pure extends React.PureComponent {
      render() {
        return React.createElement(C, this.props);
      }
    }
    if (!withCache) {
      if (keys.length === 0) return Pure as typeof C;
      return props => React.createElement(Pure, clearUndef(props, keys));
    }
    return class Cache extends React.Component {
      cache = createCache(true);
      render() {
        return React.createElement(
          Pure,
          this.cache(
            keys.length === 0 ? this.props : clearUndef(this.props, keys),
          ),
        );
      }
    };
  };
}
