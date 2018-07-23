import * as React from 'react';

import createCache from './cache';
import { clearUndef } from './utils';

export default YieldComp => C => {
  if (!YieldComp.name && !YieldComp.displayName) {
    YieldComp.displayName = 'YieldComp';
  }

  if (!C) return YieldComp;

  class Pure extends React.PureComponent {
    render() {
      return React.createElement(C, this.props);
    }
  }
  return class Yield extends React.Component<any> {
    state = { cache: createCache(), next: null };
    static getDerivedStateFromProps(props, state) {
      return {
        next: Object.assign(
          (extra, doCache) => {
            if (!extra) return React.createElement(C, props);
            return React.createElement(
              Pure,
              state.cache(
                clearUndef({
                  ...(typeof extra === 'function' ? extra(props) : extra),
                  next: props.next,
                }),
                doCache,
              ),
            ) as any;
          },
          { noCache: true },
        ),
      };
    }
    render() {
      return React.createElement(YieldComp, {
        ...this.props,
        next: this.state.next,
      });
    }
  };
};
