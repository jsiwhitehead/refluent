import * as React from 'react';

import { clearUndef, createCache } from './utils';

export default function(test, pass, fail?) {
  return getComp => () => {
    let C;
    return class Branch extends React.Component<any> {
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
        const which = test(this.props);
        if (!which && !fail) return React.createElement(C, this.props);
        return React.createElement(which ? pass : fail, {
          ...this.props,
          next: this.state.next,
        });
      }
    };
  };
}
