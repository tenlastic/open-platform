import * as mongoose from 'mongoose';

import { IPopulate, IReferences } from '../types';

/**
 * Substitute { $ref: 'string' } subdocuments within JSON with values from references.
 */
export function substituteReferenceValues<
  TDocument extends mongoose.Document,
  TJson extends IPopulate<TDocument> | IPopulate<TDocument>[] | mongoose.FilterQuery<TDocument>,
>(json: TJson, references: IReferences<TDocument>): TJson {
  return substituteReferenceValuesRecursively(json, references) as TJson;
}

/**
 * Substitute { $ref: 'string' } subdocuments within JSON with values from references.
 */
function substituteReferenceValuesRecursively<TDocument extends mongoose.Document>(
  json: unknown,
  references: IReferences<TDocument>,
): unknown {
  if (Array.isArray(json)) {
    return json.map((j) => substituteReferenceValuesRecursively(j, references));
  }

  if (json?.constructor !== Object) {
    return json;
  }

  const { $ref } = json as { $ref?: string };

  if ($ref) {
    const result = $ref.split('.').reduce<object>(getPropertyByKey, references);
    return result ?? { $type: 'null' };
  }

  return Object.entries(json).reduce<object>((agg, [key, value]) => {
    agg[key] = substituteReferenceValuesRecursively(value, references);
    return agg;
  }, {});
}

/**
 * Return an object's property with a key string (Ex: 'property').
 */
function getPropertyByKey(input: object, key: string) {
  if (Array.isArray(input)) {
    const isInteger = /^\d+$/.test(key);

    if (isInteger) {
      const index = Number(key);
      return input[index];
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
