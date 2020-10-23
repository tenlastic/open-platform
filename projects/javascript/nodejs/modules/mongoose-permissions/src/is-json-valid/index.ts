import * as mongoose from 'mongoose';

import { getPropertyByDotNotation } from '../get-property-by-dot-notation';
import { substituteReferenceValues } from '../substitute-reference-values';

/**
 * Determines if the query matches the JSON object.
 */
export function isJsonValid(json: any, query: any, and = true) {
  const substitutedQuery = substituteReferenceValues(query, json);

  const results = Object.keys(substitutedQuery).map(key => {
    const operations = substitutedQuery[key];

    if (key === '$and') {
      return operations.map(o => isJsonValid(json, o)).every(f => f);
    } else if (key === '$or') {
      return operations.map(o => isJsonValid(json, o, false)).includes(true);
    }

    return Object.keys(operations).map(operator => {
      const value = operations[operator];

      switch (operator) {
        case '$elemMatch':
          return $elemMatch(json, key, value);
        case '$eq':
          return $eq(json, key, value);
        case '$exists':
          return $exists(json, key, value);
        case '$in':
          return $in(json, key, value);
        case '$ne':
          return $ne(json, key, value);
        default:
          throw new Error(`Operation not supported: ${operator}.`);
      }
    });
  });

  return and ? flatten(results).every(f => f) : flatten(results).includes(true);
}

/**
 * Determines if the referenced array contains an element matching all criteria.
 */
function $elemMatch(json: any, key: string, value: any) {
  const reference = getPropertyByDotNotation(json, key);

  if (!reference || reference.constructor !== Array) {
    return false;
  }

  for (const r of reference) {
    const result = isJsonValid(r, value);

    if (result) {
      return true;
    }
  }

  return false;
}

/**
 * Determines if the referenced value equals the given value.
 */
function $eq(json: any, key: string, value: any) {
  const reference = getPropertyByDotNotation(json, key);
  if (reference === undefined) {
    return false;
  }

  if (reference.constructor === Array && value.constructor !== Array) {
    return reference.includes(value);
  } else if (reference && reference instanceof mongoose.Types.ObjectId) {
    return reference.equals(value);
  } else {
    return reference === value;
  }
}

/**
 * Determines if the referenced value is defined.
 */
function $exists(json: any, key: string, value: any) {
  const reference = getPropertyByDotNotation(json, key);

  return Boolean(reference !== undefined) === Boolean(value);
}

/**
 * Determines if the referenced value is included within the given array.
 */
function $in(json: any, key: string, value: any[]) {
  const reference = getPropertyByDotNotation(json, key);
  if (reference === undefined) {
    return false;
  }

  if (reference.constructor === Array) {
    return reference.includes(...value);
  } else if (reference instanceof mongoose.Types.ObjectId) {
    return Boolean(value.find(v => reference.equals(v)));
  } else {
    return value.some(v => (v.equals ? v.equals(reference) : v === reference));
  }
}

/**
 * Determines if the referenced value equals the given value.
 */
function $ne(json: any, key: string, value: any) {
  const reference = getPropertyByDotNotation(json, key);
  if (reference === undefined) {
    return false;
  }

  if (reference.constructor === Array && value.constructor !== Array) {
    return !reference.includes(value);
  } else if (reference && reference instanceof mongoose.Types.ObjectId) {
    return !reference.equals(value);
  } else {
    return reference !== value;
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
