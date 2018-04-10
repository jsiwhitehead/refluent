export { Comp } from './typings';

import * as React from 'react';

import branchMap from './branch';
import doMap from './do';
import pickMap from './pick';
import yieldMap from './yield';

import { Comp } from './typings';
import { root } from './utils';

const wrap = base => {
  const chain = map => wrap(getComp => base(map(getComp)));
  let comp;
  return Object.assign(
    props => React.createElement(comp || (comp = base()()), props),
    {
      apply: hoc => chain(getComp => () => (hoc ? hoc(getComp()) : getComp())),
      branch: (test, pass, fail?) => chain(branchMap(test, pass, fail)),
      do: (...selectors) => chain(doMap(...selectors)),
      pick: (...args) => chain(pickMap(...args)),
      yield: (...selectors) => chain(yieldMap(...selectors)),
    },
  );
};

export default wrap((getComp = root) => getComp) as Comp<any>;
