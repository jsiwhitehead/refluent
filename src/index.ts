import * as React from 'react';

import { Comp } from './comp';
import { Root, select } from './utils';

export default Comp;

export const branch = (test, pass, fail: any = Root) => props =>
  React.createElement(select(test, props) ? pass : fail, props);
