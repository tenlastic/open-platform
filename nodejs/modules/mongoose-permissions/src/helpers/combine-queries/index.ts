/**
 * Combines multiple queries into one using $and, removing invalid queries.
 */
export function combineQueriesWithAnd(...queries: any[]) {
  return { $and: queries.filter(isPlainObject) };
}

/**
 * Combines multiple queries into one using $or, removing invalid queries.
 */
export function combineQueriesWithOr(...queries: any[]) {
  return { $or: queries.filter(isPlainObject) };
}

/**
 * Returns true if the variable is a plain object.
 */
function isPlainObject(value: any) {
  return value instanceof Object && value.constructor === Object;
}
