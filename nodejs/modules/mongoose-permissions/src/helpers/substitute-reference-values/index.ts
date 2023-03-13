import { isJsonValid } from '../is-json-valid';

/**
 * Substitute { $ref: 'string' } subdocuments within JSON with values from references.
 */
export function substituteReferenceValues(json: any, references: any) {
  if (json?.constructor === Array) {
    return json.map((j) => substituteReferenceValues(j, references));
  }

  if (json?.constructor === Object) {
    const { $ref } = json;

    if ($ref) {
      if (typeof $ref === 'string') {
        return $ref.split('.').reduce(getPropertyByKey, references) ?? { $type: 'null' };
      } else if (typeof $ref === 'object' && $ref !== null && !Array.isArray($ref)) {
        return isJsonValid(references, $ref);
      } else {
        return null;
      }
    } else {
      return Object.entries(json).reduce((agg, [key, value]) => {
        agg[key] = substituteReferenceValues(value, references);
        return agg;
      }, {});
    }
  }

  return json;
}

/**
 * Return an object's property with a key string (Ex: 'property').
 *
 * If the input is an Array and the key is an integer, find the subdocument at the given index.
 *
 * If the input is an Array and the key is not an integer, find all subdocument properties
 * matching the path. Remove any null or undefined values afterward.
 *
 * If the input is an Object, return the input's property.
 *
 * If the input is not an Array or Object, return undefined since it has no subproperties.
 */
function getPropertyByKey(input: any, key: string) {
  if (input?.constructor === Array) {
    const isInteger = /^\d+$/.test(key);
    if (isInteger) {
      return input[key];
    }

    return input
      .map((o) => (o?.constructor === Object ? o[key] : null))
      .filter((o) => o !== null && o !== undefined);
  }

  if (input?.constructor === Object) {
    return input[key];
  }

  return undefined;
}
