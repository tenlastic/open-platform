import * as mongoose from 'mongoose';

/**
 * Substitute { $oid: 'string' } subdocuments within JSON with values from references.
 */
export function substituteOidValues(json: any) {
  if (json && json.constructor === Array) {
    return json.map(j => substituteOidValues(j));
  } else if (json && json.constructor === Object) {
    if (json.$oid) {
      if (typeof json.$oid === 'string' || json.$oid instanceof String) {
        return mongoose.Types.ObjectId(json.$oid);
      } else {
        return null;
      }
    } else {
      return Object.entries(json).reduce((agg, [key, value]) => {
        agg[key] = substituteOidValues(value);
        return agg;
      }, {});
    }
  } else {
    return json;
  }
}
