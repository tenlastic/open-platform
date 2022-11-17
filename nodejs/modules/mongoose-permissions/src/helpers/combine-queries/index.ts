/**
 * Combines multiple queries into one, removing invalid queries.
 */
export function combineQueries(...queries: any[]) {
  return { $and: queries.filter(isPlainObject) };
}

/**
 * Returns true if the variable is a plain object.
 */
function isPlainObject(value: any) {
  return value instanceof Object && value.constructor === Object;
}
