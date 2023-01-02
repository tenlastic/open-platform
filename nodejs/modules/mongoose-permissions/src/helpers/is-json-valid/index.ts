import * as mongoose from 'mongoose';
import { isDeepStrictEqual } from 'util';

import { getPropertyByDotNotation } from '../get-property-by-dot-notation';
import { substituteReferenceValues } from '../substitute-reference-values';

type Operation = (json: any, key: string, value: any) => boolean;

const operations: { [key: string]: Operation } = {
  $elemMatch,
  $eq,
  $exists,
  $gt,
  $gte,
  $in,
  $lt,
  $lte,
  $ne,
  $nin,
  $regex,
};

/**
 * Determines if the query matches the JSON object.
 */
export function isJsonValid(json: any, query: any): boolean {
  const substitutedQuery = substituteReferenceValues(query, json);

  const results = Object.entries<any>(substitutedQuery).map(([key, value]) => {
    // If key is $and or $or, check if each subquery is valid.
    if (key === '$and') {
      return value.map((o) => isJsonValid(json, o)).every((f) => f);
    } else if (key === '$or') {
      return value.map((o) => isJsonValid(json, o)).includes(true);
    }

    // If the value is null or undefined, default to equality check.
    if (value === null || value === undefined) {
      return $eq(json, key, value);
    }

    // If the key is not an operation and the value does not contain operations,
    // default to equality check.
    const isOperation = key === '$not' || Object.keys(operations).includes(key);
    if (
      !isOperation &&
      !Object.keys(value).some((o) => o === '$not' || Object.keys(operations).includes(o))
    ) {
      return $eq(json, key, value);
    }

    return Object.keys(value).map((operator) => {
      if (operator === '$not') {
        const subquery = value[operator];
        return !isJsonValid(json, { [key]: subquery });
      }

      const operation = operations[operator];
      if (!operation) {
        throw new Error(`Operation not supported: ${operator}.`);
      }

      return operation(json, key, value[operator]);
    });
  });

  if (results.length > 0) {
    return results.flat().every((f) => f);
  } else {
    return true;
  }
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

  if (reference?.constructor === Array) {
    if (isNestedArray(reference) && value?.constructor === Array) {
      return reference.some((r) => isEqual(r, value));
    } else if (!isNestedArray(reference) && value?.constructor === Array) {
      return isDeepStrictEqual(reference, value);
    } else {
      return reference.flat().some((r) => isEqual(r, value));
    }
  } else {
    return isEqual(reference, value);
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
 * Determines if the referenced value is greater than a comparitor.
 */
function $gt(json: any, key: string, value: any) {
  const reference = getPropertyByDotNotation(json, key);
  if (reference === undefined) {
    return false;
  }

  if (reference instanceof Date) {
    const date = value instanceof Date ? value : new Date(value);
    return reference.getTime() > date.getTime();
  } else {
    return reference > value;
  }
}

/**
 * Determines if the referenced value is greater than or equal to a comparitor.
 */
function $gte(json: any, key: string, value: any) {
  const reference = getPropertyByDotNotation(json, key);
  if (reference === undefined) {
    return false;
  }

  if (reference instanceof Date) {
    const date = value instanceof Date ? value : new Date(value);
    return reference.getTime() >= date.getTime();
  } else {
    return reference >= value;
  }
}

/**
 * Determines if the referenced value is included within the given array.
 */
function $in(json: any, key: string, value: any[]) {
  const reference = getPropertyByDotNotation(json, key);
  if (reference === undefined) {
    return false;
  }

  if (reference?.constructor === Array) {
    return reference.some((r) => value.includes(r));
  } else if (reference instanceof mongoose.Types.ObjectId) {
    return Boolean(value.find((v) => reference.equals(v)));
  } else {
    return value.some((v) => (v.equals ? v.equals(reference) : v === reference));
  }
}

/**
 * Determines if the referenced value is greater than a comparitor.
 */
function $lt(json: any, key: string, value: any) {
  const reference = getPropertyByDotNotation(json, key);
  if (reference === undefined) {
    return false;
  }

  if (reference instanceof Date) {
    const date = value instanceof Date ? value : new Date(value);
    return reference.getTime() < date.getTime();
  } else {
    return reference < value;
  }
}

/**
 * Determines if the referenced value is greater than or equal to a comparitor.
 */
function $lte(json: any, key: string, value: any) {
  const reference = getPropertyByDotNotation(json, key);
  if (reference === undefined) {
    return false;
  }

  if (reference instanceof Date) {
    const date = value instanceof Date ? value : new Date(value);
    return reference.getTime() <= date.getTime();
  } else {
    return reference <= value;
  }
}

/**
 * Determines if the referenced value equals the given value.
 */
function $ne(json: any, key: string, value: any) {
  const reference = getPropertyByDotNotation(json, key);

  if (reference?.constructor === Array) {
    if (isNestedArray(reference) && value?.constructor === Array) {
      return !reference.some((r) => isEqual(r, value));
    } else if (!isNestedArray(reference) && value?.constructor === Array) {
      return !isDeepStrictEqual(reference, value);
    } else {
      return !reference.flat().some((r) => isEqual(r, value));
    }
  } else {
    return !isEqual(reference, value);
  }
}

/**
 * Determines if the referenced value is not included within the given array.
 */
function $nin(json: any, key: string, value: any[]) {
  return !$in(json, key, value);
}

/**
 * Determines if the referenced value matches a regular expression.
 */
function $regex(json: any, key: string, value: any) {
  const reference = getPropertyByDotNotation(json, key);
  if (reference === null || reference === undefined || typeof reference !== 'string') {
    return false;
  }

  const regex = new RegExp(value);
  return regex.test(reference);
}

/**
 * Checks if two basic types are equal, accounting for ObjectIDs.
 */
function isEqual(reference: any, value: any) {
  return reference instanceof mongoose.Types.ObjectId
    ? reference.equals(value)
    : isDeepStrictEqual(reference, value);
}

/**
 * Returns true if the reference is a nested array.
 */
function isNestedArray(reference: any) {
  if (reference?.constructor !== Array) {
    return false;
  }

  return reference.every((r) => r?.constructor === Array);
}
