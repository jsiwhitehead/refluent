import * as React from 'react';

import doMap from './do';
import yieldMap from './yield';
import { Root } from './utils';

const wrap = mapComp => {
  const chain = map => wrap(C => mapComp(map(C)));
  let comp;
  const Refluent = props =>
    React.createElement(comp || (comp = mapComp()), props);
  return Object.assign(Refluent, {
    do: (...selectors) => chain(doMap(...selectors)),
    label: displayName =>
      chain((C = Root) =>
        Object.assign(props => React.createElement(C, props), { displayName }),
      ),
    transform: hoc => chain((C = Root) => (hoc ? hoc(C) : C)),
    yield: YieldComp => chain(yieldMap(YieldComp)),
  });
};
export const Comp = wrap((C = Root) => C).yield(({ next }) =>
  next(props => props, true),
) as Comp<any>;

export type Falsy = false | null | undefined | void;

export type Obj<T = any> = { [key: string]: T; [key: number]: T };

export type Selector<P1 extends Obj = any, P2 = undefined> =
  | ((props: P1, pushed: P2) => any)
  | string
  | number
  | true
  | Falsy;

export type Selected<S = any, P extends Obj = any> = S extends ((
  props: P,
  pushed: any,
) => infer V)
  ? V
  : S extends string
    ? P[S]
    : S extends number ? P[S] : S extends true ? P : null;

export interface Comp<TOuter = Obj, TInner = TOuter>
  extends React.StatelessComponent<TOuter> {
  do<T extends Obj = any>(
    map: ((
      props$: (() => TInner) &
        ((s: true) => T) &
        (<S extends Selector<TInner, T> = any>(
          selector: S,
          map: (
            value: Selected<S, TInner>,
            commit?: true,
          ) => Partial<T> | (() => void) | Falsy,
        ) => () => void) &
        (<
          S1 extends Selector<TInner, T> = any,
          S2 extends Selector<TInner, T> = any
        >(
          selector1: S1,
          selector2: S2,
          map: (
            value1: Selected<S1, TInner>,
            value2: Selected<S2, TInner>,
            commit?: true,
          ) => Partial<T> | (() => void) | Falsy,
        ) => () => void) &
        (<
          S1 extends Selector<TInner, T> = any,
          S2 extends Selector<TInner, T> = any,
          S3 extends Selector<TInner, T> = any
        >(
          selector1: S1,
          selector2: S2,
          selector3: S3,
          map: (
            value1: Selected<S1, TInner>,
            value2: Selected<S2, TInner>,
            value3: Selected<S3, TInner>,
            commit?: true,
          ) => Partial<T> | (() => void) | Falsy,
        ) => () => void) &
        (<
          S1 extends Selector<TInner, T> = any,
          S2 extends Selector<TInner, T> = any,
          S3 extends Selector<TInner, T> = any,
          S4 extends Selector<TInner, T> = any
        >(
          selector1: S1,
          selector2: S2,
          selector3: S3,
          selector4: S4,
          map: (
            value1: Selected<S1, TInner>,
            value2: Selected<S2, TInner>,
            value3: Selected<S3, TInner>,
            value4: Selected<S4, TInner>,
            commit?: true,
          ) => Partial<T> | (() => void) | Falsy,
        ) => () => void) &
        (<
          S1 extends Selector<TInner, T> = any,
          S2 extends Selector<TInner, T> = any,
          S3 extends Selector<TInner, T> = any,
          S4 extends Selector<TInner, T> = any,
          S5 extends Selector<TInner, T> = any
        >(
          selector1: S1,
          selector2: S2,
          selector3: S3,
          selector4: S4,
          selector5: S5,
          map: (
            value1: Selected<S1, TInner>,
            value2: Selected<S2, TInner>,
            value3: Selected<S3, TInner>,
            value4: Selected<S4, TInner>,
            value5: Selected<S5, TInner>,
            commit?: true,
          ) => Partial<T> | (() => void) | Falsy,
        ) => () => void) &
        (<
          S1 extends Selector<TInner, T> = any,
          S2 extends Selector<TInner, T> = any,
          S3 extends Selector<TInner, T> = any,
          S4 extends Selector<TInner, T> = any,
          S5 extends Selector<TInner, T> = any,
          S6 extends Selector<TInner, T> = any
        >(
          selector1: S1,
          selector2: S2,
          selector3: S3,
          selector4: S4,
          selector5: S5,
          selector6: S6,
          map: (
            value1: Selected<S1, TInner>,
            value2: Selected<S2, TInner>,
            value3: Selected<S3, TInner>,
            value4: Selected<S4, TInner>,
            value5: Selected<S5, TInner>,
            value6: Selected<S6, TInner>,
            commit?: true,
          ) => Partial<T> | (() => void) | Falsy,
        ) => () => void) &
        (<
          S1 extends Selector<TInner, T> = any,
          S2 extends Selector<TInner, T> = any,
          S3 extends Selector<TInner, T> = any,
          S4 extends Selector<TInner, T> = any,
          S5 extends Selector<TInner, T> = any,
          S6 extends Selector<TInner, T> = any,
          S7 extends Selector<TInner, T> = any
        >(
          selector1: S1,
          selector2: S2,
          selector3: S3,
          selector4: S4,
          selector5: S5,
          selector6: S6,
          selector7: S7,
          map: (
            value1: Selected<S1, TInner>,
            value2: Selected<S2, TInner>,
            value3: Selected<S3, TInner>,
            value4: Selected<S4, TInner>,
            value5: Selected<S5, TInner>,
            value6: Selected<S6, TInner>,
            value7: Selected<S7, TInner>,
            commit?: true,
          ) => Partial<T> | (() => void) | Falsy,
        ) => () => void) &
        (<
          S1 extends Selector<TInner, T> = any,
          S2 extends Selector<TInner, T> = any,
          S3 extends Selector<TInner, T> = any,
          S4 extends Selector<TInner, T> = any,
          S5 extends Selector<TInner, T> = any,
          S6 extends Selector<TInner, T> = any,
          S7 extends Selector<TInner, T> = any,
          S8 extends Selector<TInner, T> = any
        >(
          selector1: S1,
          selector2: S2,
          selector3: S3,
          selector4: S4,
          selector5: S5,
          selector6: S6,
          selector7: S7,
          selector8: S8,
          map: (
            value1: Selected<S1, TInner>,
            value2: Selected<S2, TInner>,
            value3: Selected<S3, TInner>,
            value4: Selected<S4, TInner>,
            value5: Selected<S5, TInner>,
            value6: Selected<S6, TInner>,
            value7: Selected<S7, TInner>,
            value8: Selected<S8, TInner>,
            commit?: true,
          ) => Partial<T> | (() => void) | Falsy,
        ) => () => void) &
        (<
          S1 extends Selector<TInner, T> = any,
          S2 extends Selector<TInner, T> = any,
          S3 extends Selector<TInner, T> = any,
          S4 extends Selector<TInner, T> = any,
          S5 extends Selector<TInner, T> = any,
          S6 extends Selector<TInner, T> = any,
          S7 extends Selector<TInner, T> = any,
          S8 extends Selector<TInner, T> = any,
          S9 extends Selector<TInner, T> = any
        >(
          selector1: S1,
          selector2: S2,
          selector3: S3,
          selector4: S4,
          selector5: S5,
          selector6: S6,
          selector7: S7,
          selector8: S8,
          selector9: S9,
          map: (
            value1: Selected<S1, TInner>,
            value2: Selected<S2, TInner>,
            value3: Selected<S3, TInner>,
            value4: Selected<S4, TInner>,
            value5: Selected<S5, TInner>,
            value6: Selected<S6, TInner>,
            value7: Selected<S7, TInner>,
            value8: Selected<S8, TInner>,
            value9: Selected<S9, TInner>,
            commit?: true,
          ) => Partial<T> | (() => void) | Falsy,
        ) => () => void) &
        (<
          S1 extends Selector<TInner, T> = any,
          S2 extends Selector<TInner, T> = any,
          S3 extends Selector<TInner, T> = any,
          S4 extends Selector<TInner, T> = any,
          S5 extends Selector<TInner, T> = any,
          S6 extends Selector<TInner, T> = any,
          S7 extends Selector<TInner, T> = any,
          S8 extends Selector<TInner, T> = any,
          S9 extends Selector<TInner, T> = any,
          S10 extends Selector<TInner, T> = any
        >(
          selector1: S1,
          selector2: S2,
          selector3: S3,
          selector4: S4,
          selector5: S5,
          selector6: S6,
          selector7: S7,
          selector8: S8,
          selector9: S9,
          selector10: S10,
          map: (
            value1: Selected<S1, TInner>,
            value2: Selected<S2, TInner>,
            value3: Selected<S3, TInner>,
            value4: Selected<S4, TInner>,
            value5: Selected<S5, TInner>,
            value6: Selected<S6, TInner>,
            value7: Selected<S7, TInner>,
            value8: Selected<S8, TInner>,
            value9: Selected<S9, TInner>,
            value10: Selected<S10, TInner>,
            commit?: true,
          ) => Partial<T> | (() => void) | Falsy,
        ) => () => void),
      push: (update: Partial<T> | Falsy, callback?: () => void) => void,
      commit?: true,
    ) => T | (() => void) | Falsy),
  ): Comp<TOuter, TInner & T>;
  do<T extends Obj = {}, S extends Selector<TInner> = any>(
    selector: S,
    map: (value: Selected<S, TInner>) => T | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner> = any,
    S2 extends Selector<TInner> = any
  >(
    selector1: S1,
    selector2: S2,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
    ) => T | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner> = any,
    S2 extends Selector<TInner> = any,
    S3 extends Selector<TInner> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
    ) => T | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner> = any,
    S2 extends Selector<TInner> = any,
    S3 extends Selector<TInner> = any,
    S4 extends Selector<TInner> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    selector4: S4,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      value4: Selected<S4, TInner>,
    ) => T | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner> = any,
    S2 extends Selector<TInner> = any,
    S3 extends Selector<TInner> = any,
    S4 extends Selector<TInner> = any,
    S5 extends Selector<TInner> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    selector4: S4,
    selector5: S5,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      value4: Selected<S4, TInner>,
      value5: Selected<S5, TInner>,
    ) => T | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner> = any,
    S2 extends Selector<TInner> = any,
    S3 extends Selector<TInner> = any,
    S4 extends Selector<TInner> = any,
    S5 extends Selector<TInner> = any,
    S6 extends Selector<TInner> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    selector4: S4,
    selector5: S5,
    selector6: S6,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      value4: Selected<S4, TInner>,
      value5: Selected<S5, TInner>,
      value6: Selected<S6, TInner>,
    ) => T | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner> = any,
    S2 extends Selector<TInner> = any,
    S3 extends Selector<TInner> = any,
    S4 extends Selector<TInner> = any,
    S5 extends Selector<TInner> = any,
    S6 extends Selector<TInner> = any,
    S7 extends Selector<TInner> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    selector4: S4,
    selector5: S5,
    selector6: S6,
    selector7: S7,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      value4: Selected<S4, TInner>,
      value5: Selected<S5, TInner>,
      value6: Selected<S6, TInner>,
      value7: Selected<S7, TInner>,
    ) => T | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner> = any,
    S2 extends Selector<TInner> = any,
    S3 extends Selector<TInner> = any,
    S4 extends Selector<TInner> = any,
    S5 extends Selector<TInner> = any,
    S6 extends Selector<TInner> = any,
    S7 extends Selector<TInner> = any,
    S8 extends Selector<TInner> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    selector4: S4,
    selector5: S5,
    selector6: S6,
    selector7: S7,
    selector8: S8,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      value4: Selected<S4, TInner>,
      value5: Selected<S5, TInner>,
      value6: Selected<S6, TInner>,
      value7: Selected<S7, TInner>,
      value8: Selected<S8, TInner>,
    ) => T | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner> = any,
    S2 extends Selector<TInner> = any,
    S3 extends Selector<TInner> = any,
    S4 extends Selector<TInner> = any,
    S5 extends Selector<TInner> = any,
    S6 extends Selector<TInner> = any,
    S7 extends Selector<TInner> = any,
    S8 extends Selector<TInner> = any,
    S9 extends Selector<TInner> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    selector4: S4,
    selector5: S5,
    selector6: S6,
    selector7: S7,
    selector8: S8,
    selector9: S9,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      value4: Selected<S4, TInner>,
      value5: Selected<S5, TInner>,
      value6: Selected<S6, TInner>,
      value7: Selected<S7, TInner>,
      value8: Selected<S8, TInner>,
      value9: Selected<S9, TInner>,
    ) => T | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner> = any,
    S2 extends Selector<TInner> = any,
    S3 extends Selector<TInner> = any,
    S4 extends Selector<TInner> = any,
    S5 extends Selector<TInner> = any,
    S6 extends Selector<TInner> = any,
    S7 extends Selector<TInner> = any,
    S8 extends Selector<TInner> = any,
    S9 extends Selector<TInner> = any,
    S10 extends Selector<TInner> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    selector4: S4,
    selector5: S5,
    selector6: S6,
    selector7: S7,
    selector8: S8,
    selector9: S9,
    selector10: S10,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      value4: Selected<S4, TInner>,
      value5: Selected<S5, TInner>,
      value6: Selected<S6, TInner>,
      value7: Selected<S7, TInner>,
      value8: Selected<S8, TInner>,
      value9: Selected<S9, TInner>,
      value10: Selected<S10, TInner>,
    ) => T | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<T extends Obj = {}, S extends Selector<TInner, T> = any>(
    selector: S,
    map: (
      value: Selected<S, TInner>,
      push: (update: Partial<T> | Falsy, callback?: () => void) => void,
      commit?: true,
    ) => Partial<T> | (() => void) | Falsy,
  ): Comp<TOuter, TInner & Partial<T>>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner, T> = any,
    S2 extends Selector<TInner, T> = any
  >(
    selector1: S1,
    selector2: S2,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      push: (update: Partial<T> | Falsy, callback?: () => void) => void,
      commit?: true,
    ) => Partial<T> | (() => void) | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner, T> = any,
    S2 extends Selector<TInner, T> = any,
    S3 extends Selector<TInner, T> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      push: (update: Partial<T> | Falsy, callback?: () => void) => void,
      commit?: true,
    ) => Partial<T> | (() => void) | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner, T> = any,
    S2 extends Selector<TInner, T> = any,
    S3 extends Selector<TInner, T> = any,
    S4 extends Selector<TInner, T> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    selector4: S4,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      value4: Selected<S4, TInner>,
      push: (update: Partial<T> | Falsy, callback?: () => void) => void,
      commit?: true,
    ) => Partial<T> | (() => void) | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner, T> = any,
    S2 extends Selector<TInner, T> = any,
    S3 extends Selector<TInner, T> = any,
    S4 extends Selector<TInner, T> = any,
    S5 extends Selector<TInner, T> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    selector4: S4,
    selector5: S5,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      value4: Selected<S4, TInner>,
      value5: Selected<S5, TInner>,
      push: (update: Partial<T> | Falsy, callback?: () => void) => void,
      commit?: true,
    ) => Partial<T> | (() => void) | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner, T> = any,
    S2 extends Selector<TInner, T> = any,
    S3 extends Selector<TInner, T> = any,
    S4 extends Selector<TInner, T> = any,
    S5 extends Selector<TInner, T> = any,
    S6 extends Selector<TInner, T> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    selector4: S4,
    selector5: S5,
    selector6: S6,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      value4: Selected<S4, TInner>,
      value5: Selected<S5, TInner>,
      value6: Selected<S6, TInner>,
      push: (update: Partial<T> | Falsy, callback?: () => void) => void,
      commit?: true,
    ) => Partial<T> | (() => void) | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner, T> = any,
    S2 extends Selector<TInner, T> = any,
    S3 extends Selector<TInner, T> = any,
    S4 extends Selector<TInner, T> = any,
    S5 extends Selector<TInner, T> = any,
    S6 extends Selector<TInner, T> = any,
    S7 extends Selector<TInner, T> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    selector4: S4,
    selector5: S5,
    selector6: S6,
    selector7: S7,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      value4: Selected<S4, TInner>,
      value5: Selected<S5, TInner>,
      value6: Selected<S6, TInner>,
      value7: Selected<S7, TInner>,
      push: (update: Partial<T> | Falsy, callback?: () => void) => void,
      commit?: true,
    ) => Partial<T> | (() => void) | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner, T> = any,
    S2 extends Selector<TInner, T> = any,
    S3 extends Selector<TInner, T> = any,
    S4 extends Selector<TInner, T> = any,
    S5 extends Selector<TInner, T> = any,
    S6 extends Selector<TInner, T> = any,
    S7 extends Selector<TInner, T> = any,
    S8 extends Selector<TInner, T> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    selector4: S4,
    selector5: S5,
    selector6: S6,
    selector7: S7,
    selector8: S8,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      value4: Selected<S4, TInner>,
      value5: Selected<S5, TInner>,
      value6: Selected<S6, TInner>,
      value7: Selected<S7, TInner>,
      value8: Selected<S8, TInner>,
      push: (update: Partial<T> | Falsy, callback?: () => void) => void,
      commit?: true,
    ) => Partial<T> | (() => void) | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner, T> = any,
    S2 extends Selector<TInner, T> = any,
    S3 extends Selector<TInner, T> = any,
    S4 extends Selector<TInner, T> = any,
    S5 extends Selector<TInner, T> = any,
    S6 extends Selector<TInner, T> = any,
    S7 extends Selector<TInner, T> = any,
    S8 extends Selector<TInner, T> = any,
    S9 extends Selector<TInner, T> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    selector4: S4,
    selector5: S5,
    selector6: S6,
    selector7: S7,
    selector8: S8,
    selector9: S9,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      value4: Selected<S4, TInner>,
      value5: Selected<S5, TInner>,
      value6: Selected<S6, TInner>,
      value7: Selected<S7, TInner>,
      value8: Selected<S8, TInner>,
      value9: Selected<S9, TInner>,
      push: (update: Partial<T> | Falsy, callback?: () => void) => void,
      commit?: true,
    ) => Partial<T> | (() => void) | Falsy,
  ): Comp<TOuter, TInner & T>;
  do<
    T extends Obj = {},
    S1 extends Selector<TInner, T> = any,
    S2 extends Selector<TInner, T> = any,
    S3 extends Selector<TInner, T> = any,
    S4 extends Selector<TInner, T> = any,
    S5 extends Selector<TInner, T> = any,
    S6 extends Selector<TInner, T> = any,
    S7 extends Selector<TInner, T> = any,
    S8 extends Selector<TInner, T> = any,
    S9 extends Selector<TInner, T> = any,
    S10 extends Selector<TInner, T> = any
  >(
    selector1: S1,
    selector2: S2,
    selector3: S3,
    selector4: S4,
    selector5: S5,
    selector6: S6,
    selector7: S7,
    selector8: S8,
    selector9: S9,
    selector10: S10,
    map: (
      value1: Selected<S1, TInner>,
      value2: Selected<S2, TInner>,
      value3: Selected<S3, TInner>,
      value4: Selected<S4, TInner>,
      value5: Selected<S5, TInner>,
      value6: Selected<S6, TInner>,
      value7: Selected<S7, TInner>,
      value8: Selected<S8, TInner>,
      value9: Selected<S9, TInner>,
      value10: Selected<S10, TInner>,
      push: (update: Partial<T> | Falsy, callback?: () => void) => void,
      commit?: true,
    ) => Partial<T> | (() => void) | Falsy,
  ): Comp<TOuter, TInner & T>;
  label(label: string): Comp<TOuter, TInner>;
  transform<T extends Obj = any>(
    map:
      | ((
          comp: React.StatelessComponent<TOuter> | React.ComponentClass<TOuter>,
        ) => React.StatelessComponent<T> | React.ComponentClass<T>)
      | Falsy,
  ): Comp<T, TInner>;
  yield<T extends Obj = {}, N extends Obj | undefined = any>(
    comp:
      | React.StatelessComponent<
          TInner &
            T & {
              next: (
                props?: N | ((props: any) => N),
              ) => React.ReactElement<any> | null;
            }
        >
      | React.ComponentClass<
          TInner &
            T & {
              next: (
                props?: N | ((props: any) => N),
              ) => React.ReactElement<any> | null;
            }
        >,
  ): Comp<TOuter & T, TInner & T & N>;
}
