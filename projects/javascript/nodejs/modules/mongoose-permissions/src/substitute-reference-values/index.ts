import { getPropertyByDotNotation } from '../get-property-by-dot-notation';

/**
 * Substitute { $ref: 'string' } subdocuments within JSON with values from references.
 */
export function substituteReferenceValues(json: any, references: any) {
  if (json && json.constructor === Array) {
    return json.map(j => substituteReferenceValues(j, references));
  } else if (json && json.constructor === Object) {
    if (json.$ref) {
      if (typeof json.$ref === 'string' || json.$ref instanceof String) {
        return getPropertyByDotNotation(references, json.$ref);
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
