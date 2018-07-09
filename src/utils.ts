export const isObject = x =>
  Object.prototype.toString.call(x) === '[object Object]';

export const clearUndef = (obj, keys = Object.keys(obj)) =>
  keys.reduce(
    (res, k) => (obj[k] === undefined ? res : { ...res, [k]: obj[k] }),
    {},
  );

export const shallowEqual = (a: any, b: any): boolean => {
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((x, i) => x === b[i]);
  }
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every(
    k => Object.prototype.hasOwnProperty.call(b, k) && a[k] === b[k],
  );
};

export const isPlain = a =>
  !a ||
  (typeof a !== 'function' &&
    (typeof a !== 'object' ||
      ['[object Date]', '[object Array]', '[object Object]'].includes(
        Object.prototype.toString.call(a),
      )));

export const select = (selector, props, pushed?) => {
  switch (typeof selector) {
    case 'number':
      return props[selector];
    case 'string':
      return selector.split('.').reduce((res, k) => res && res[k], props);
    case 'function':
      return selector(props, pushed);
  }
  return null;
};

export const Root = ({ next, children, ...props }) => {
  if (next) return next({ ...props, children });
  if (typeof children === 'function') return children(props);
  return children || null;
};
