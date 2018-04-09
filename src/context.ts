import * as React from 'react';

import { root } from './utils';

const contexts = {};

export default function(name, getContext) {
  return (getComp = root) => () => {
    const C = getComp();
    const { Provider, Consumer } =
      contexts[name] || (contexts[name] = (React as any).createContext());
    if (getContext) {
      return props =>
        React.createElement(
          Provider,
          { value: getContext(props) },
          React.createElement(C, props),
        );
    }
    return props =>
      React.createElement(Consumer, null, ctx =>
        React.createElement(C, { ...props, [name]: ctx[name] }),
      );
  };
}
