import keysToObject from 'keys-to-object';

const dateCache = {};

const stringify = v => {
  const type = Object.prototype.toString.call(v);
  if (type === '[object String]') return `\uFFFF"${v}`;
  if (type === '[object Function]') throw new Error();
  if (v === null || typeof v !== 'object') return `\uFFFF${v}`;
  if (type === '[object Date]') return `\uFFFF@${v.getTime()}`;
  if (type === '[object Array]') {
    return `\uFFFF(${v.map(stringify).join('') || '\uFFFF'})`;
  }
  if (type === '[object Object]') {
    return `\uFFFF(${Object.keys(v)
      .sort()
      .map(k => `${k}${stringify(v[k])}`)
      .join('\uFFFF')})`;
  }
  throw new Error();
};
const objCache = new WeakMap();
const strCache = new Map();

export default (full?: boolean) => {
  const baseMethods = {};
  const methods = {};
  return obj =>
    keysToObject(Object.keys(obj), k => {
      const value = obj[k];
      const type = Object.prototype.toString.call(value);
      if (type === '[object Function]') {
        baseMethods[k] = value;
        return (
          methods[k] || (methods[k] = (...args) => baseMethods[k](...args))
        );
      }
      if (full) {
        if (type === '[object Array]' || type === '[object Object]') {
          if (objCache.has(value)) return objCache.get(value);
          try {
            const str = stringify(value);
            if (strCache.has(str)) {
              const result = strCache.get(str);
              objCache.set(value, result);
              return result;
            }
            strCache.set(str, value);
          } catch (error) {}
          objCache.set(value, value);
          return value;
        }
        if (type === '[object Date]') {
          const time = value.getTime();
          return dateCache[time] || (dateCache[time] = value);
        }
      }
      return value;
    });
};
