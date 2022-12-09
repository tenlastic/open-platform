import * as mongoose from 'mongoose';

import { isPathValid } from '../is-path-valid';

/**
 * Removes any unauthorized attributes from an object.
 */
export function filterObject<T>(object: T, permissions: string[], schema?: mongoose.Schema) {
  return filterObjectRecursively(object, permissions, [], schema);
}

/**
 * Removes any unauthorized attributes from an object recursively.
 */
function filterObjectRecursively<T>(
  object: T,
  permissions: string[],
  paths: string[] = [],
  schema?: mongoose.Schema,
): Partial<T> {
  return Object.entries<any>(object).reduce((agg, [key, value]) => {
    let result = value;

    if (value?.constructor === Object) {
      result = filterObjectRecursively(value, permissions, paths.concat(key), schema);
    } else if (value?.constructor === Array) {
      result = value
        .map((v) => {
          if (v?.constructor === Object) {
            return filterObjectRecursively(v, permissions, paths.concat(key), schema);
          } else {
            return v;
          }
        })
        .filter((v) => {
          if (v?.constructor === Object && Object.keys(v).length) {
            return true;
          } else {
            return !v || v.constructor !== Object;
          }
        });
    }

    const pathIsValid = isPathValid(key, paths, permissions);
    const pathIsWritable = isPathWritable(key, paths, schema);
    if (pathIsValid && pathIsWritable) {
      agg[key] = result;
    }

    return agg;
  }, {});
}

function isPathWritable(key: string, paths: string[], schema: mongoose.Schema) {
  if (!schema) {
    return true;
  }

  const path = paths.concat(key).join('.');
  const type = schema.path(path);

  return type?.options.writable !== false;
}
