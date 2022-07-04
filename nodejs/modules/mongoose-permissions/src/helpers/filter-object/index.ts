import { isPathValid } from '../is-path-valid';

/**
 * Removes any unauthorized attributes from an object.
 * @param object The object to remove unauthorized attributes from.
 * @param permissions An array of authorized key names.
 * @param path An array of keys that lead to the current object.
 */
export function filterObject(object: any, permissions: string[], path: string[] = []) {
  return Object.entries<any>(object).reduce((agg, [key, value]) => {
    const pathIsValid = isPathValid(permissions, path, key);

    let result = value;
    if (value && value.constructor === Object) {
      result = filterObject(value, permissions, path.concat(key));
    } else if (value && value.constructor === Array) {
      result = value
        .map(v => {
          if (v && v.constructor === Object) {
            return filterObject(v, permissions, path.concat(key));
          } else {
            return v;
          }
        })
        .filter(v => {
          if (v && v.constructor === Object && Object.keys(v).length) {
            return true;
          } else {
            return !v || v.constructor !== Object;
          }
        });
    }

    if (pathIsValid) {
      agg[key] = result;
    }

    return agg;
  }, {});
}
