import * as mongoose from 'mongoose';

import { getPropertyByDotNotation } from '../get-property-by-dot-notation';
import { substituteReferenceValues } from '../substitute-reference-values';

/**
 * Determines if the query matches the JSON object.
 */
export function isJsonValid(json: any, query: any) {
  const substitutedQuery = substituteReferenceValues(query, json);

  const results = Object.entries(substitutedQuery).map(([key, operations]) => {
    return Object.entries(operations).map(([operator, value]) => {
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

  return flatten(results).every(f => f);
}

/**
 * Determines if the referenced value equals the given value.
 */
function $eq(json: any, key: string, value: any) {
  const reference = getPropertyByDotNotation(json, key);

  if (reference.constructor === Array && value.constructor !== Array) {
    return reference.includes(value);
  } else if (reference && reference instanceof mongoose.Types.ObjectId) {
    return reference.equals(value);
  } else {
    return reference === value;
  }
}

/**
 * Determines if the referenced value is included within the given array.
 */
function $in(json: any, key: string, value: any[]) {
  const reference = getPropertyByDotNotation(json, key);

  if (reference.constructor === Array) {
    return reference.includes(...value);
  } else if (reference instanceof mongoose.Types.ObjectId) {
    return Boolean(value.find(v => reference.equals(v)));
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
