import { getPropertyByDotNotation } from '../get-property-by-dot-notation';
import { isJsonValid } from '../is-json-valid';

/**
 * Substitute { $ref: 'string' } subdocuments within JSON with values from references.
 */
export function substituteReferenceValues(json: any, references: any) {
  if (json && json.constructor === Array) {
    return json.map((j) => substituteReferenceValues(j, references));
  } else if (json && json.constructor === Object) {
    const { $ref } = json;

    if ($ref) {
      if (typeof $ref === 'string') {
        return getPropertyByDotNotation(references, $ref) ?? { $eq: null };
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
  } else {
    return json;
  }
}
