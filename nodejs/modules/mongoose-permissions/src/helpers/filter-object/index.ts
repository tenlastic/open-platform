import * as mongoose from 'mongoose';

import { isPathValid } from '../is-path-valid';

export type FilterObjectAction = 'create' | 'read' | 'update';

/**
 * Removes any unauthorized attributes from an object.
 */
export function filterObject<T>(
  action: FilterObjectAction,
  object: T,
  permissions: string[],
  schema?: mongoose.Schema,
) {
  return filterObjectRecursively(action, object, permissions, [], schema);
}

/**
 * Removes any unauthorized attributes from an object recursively.
 */
function filterObjectRecursively<T>(
  action: FilterObjectAction,
  object: T,
  permissions: string[],
  paths: string[] = [],
  schema?: mongoose.Schema,
): Partial<T> {
  return Object.entries<any>(object).reduce((agg, [key, value]) => {
    let result = value;

    if (value?.constructor === Object) {
      result = filterObjectRecursively(action, value, permissions, paths.concat(key), schema);
    } else if (value?.constructor === Array) {
      result = value
        .map((v) => {
          if (v?.constructor === Object) {
            return filterObjectRecursively(action, v, permissions, paths.concat(key), schema);
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

    const pathIsFilteredOut = isPathFilteredOut(action, key, paths, schema);
    const pathIsValid = isPathValid(key, paths, permissions);
    if (!pathIsFilteredOut && pathIsValid) {
      agg[key] = result;
    }

    return agg;
  }, {});
}

function isPathFilteredOut(
  action: FilterObjectAction,
  key: string,
  paths: string[],
  schema: mongoose.Schema,
) {
  if (!schema) {
    return false;
  }

  const path = paths.concat(key).join('.');
  const type = schema.path(path);

  const filter = type?.options.filter;
  if (!filter) {
    return false;
  }

  return filter === true || filter[action] === true;
}
