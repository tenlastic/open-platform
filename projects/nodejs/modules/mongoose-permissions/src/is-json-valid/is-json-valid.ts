/**
 * Determines if the query matches the JSON object.
 */
export function isJsonValid(json: any, query: any) {
  const results = Object.keys(query).map(key => {
    const operations = query[key];

    return Object.keys(operations).map(operator => {
      const value = getEvaluatedValue(json, operations[operator]);

      switch (operator) {
        case '$eq':
          return $eq(json, key, value);
        case '$in':
          return $in(json, key, value);
        default:
          throw new Error(`Operation not supported: ${operator}.`);
      }
    });
  });

  const flattenedResults = flatten(results);

  return flattenedResults.every(f => f);
}

/**
 * Determines if the referenced value equals the given value.
 */
function $eq(json: any, key: string, value: any) {
  const reference = key.split('.').reduce(index, json);

  if (reference.constructor === Array && value.constructor !== Array) {
    return reference.includes(value);
  } else {
    return reference === value;
  }
}

/**
 * Determines if the referenced value is included within the given array.
 */
function $in(json: any, key: string, value: any) {
  const reference = key.split('.').reduce(index, json);

  if (reference.constructor === Array) {
    return reference.includes(...value);
  } else {
    return value.includes(reference);
  }
}

/**
 * Completely flattens an array.
 */
function flatten(arr: any[]): boolean[] {
  return arr.reduce(function(flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

/**
 * If the value is a path reference, return the value at the referenced path.
 * If not, return the value.
 */
function getEvaluatedValue(json: any, value: any) {
  if (value && value.$ref) {
    return value.$ref.split('.').reduce(index, json);
  }

  return value;
}

/**
 * Access an object's property with a string.
 */
function index(obj: any, i: string) {
  return obj[i];
}
