import * as mongoose from 'mongoose';

import { isValidPath } from '../is-valid-path';

/**
 * Removes any unauthorized attributes from a record. This directly modifies the record.
 * @param record The record to remove unauthorized attributes from.
 * @param permissions An array of authorized key names.
 */
export function filterRecord<TDocument extends mongoose.Document>(
  record: TDocument,
  permissions: string[],
  path: string[] = [],
): Partial<TDocument> {
  const object = record.toObject ? record.toObject() : record;

  Object.entries(object).forEach(([key, value]) => {
    const isPathValid = isValidPath(permissions, path, key);

    if (value && value.constructor === Object) {
      const result = filterRecord(value as any, permissions, path.concat(key));

      // Remove empty objects.
      if (!isPathValid && Object.keys(result).length === 0) {
        delete object[key];
      }
    } else if (!isPathValid) {
      delete object[key];
    }
  });

  return object;
}
