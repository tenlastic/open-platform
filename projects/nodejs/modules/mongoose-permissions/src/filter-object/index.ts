import { isValidPath } from '../is-valid-path';

/**
 * Removes any unauthorized attributes from an object.
 * @param object The object to remove unauthorized attributes from.
 * @param permissions An array of authorized key names.
 * @param path An array of keys that lead to the current object.
 */
export function filterObject(object: any, permissions: string[], path: string[] = []) {
  return Object.entries(object).reduce((agg, [key, value]) => {
    const isPathValid = isValidPath(permissions, path, key);

    if (value && value.constructor === Object) {
      const result = filterObject(value, permissions, path.concat(key));

      // Do not include empty objects.
      if (Object.keys(result).length > 0 || isPathValid) {
        agg[key] = result;
      }
    } else if (isPathValid) {
      agg[key] = value;
    }

    return agg;
  }, {});
}
