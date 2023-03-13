import * as mongoose from 'mongoose';

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

/**
 * Returns true if the action in 'filter' schema option is true.
 * Example: { filter: { create: true, read: true, update: true } }.
 */
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

/**
 * Returns if the permissions allow the property to be accessed.
 */
function isPathValid(key: string, paths: string[], permissions: string[]) {
  const p = permissions.reduce((previous, current) => {
    if (current.includes('.*')) {
      previous.push(current.replace('.*', ''));
    }

    const split = current.split('.');
    for (let i = 1; i <= split.length; i++) {
      const permutation = split.slice(0, i).join('.');
      previous.push(permutation);
    }

    return previous;
  }, []);

  const absolutePath = paths.concat(key).join('.');
  if (p.indexOf(absolutePath) >= 0) {
    return true;
  }

  let isFound = false;
  for (let i = 0; i < paths.length + 1; i++) {
    const pathSlice = paths.slice(0, i);
    const wildcardPath = pathSlice.concat('*').join('.');

    if (p.indexOf(wildcardPath) >= 0) {
      isFound = true;
      break;
    }
  }

  return isFound;
}
