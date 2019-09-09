import { isValidPath } from '../is-valid-path';

/**
 * Removes any unauthorized attributes from a record. This directly modifies the record.
 * @param record The record to remove unauthorized attributes from.
 * @param permissions An array of authorized key names.
 */
export function filterRecord<TDocument>(
  record: TDocument,
  permissions: string[],
  path: string[] = [],
) {
  const { _doc } = record as any;
  const doc = _doc ? _doc : record;

  Object.entries(doc).forEach(([key, value]) => {
    const isPathValid = isValidPath(permissions, path, key);

    if (value && value.constructor === Object) {
      const result = filterRecord(value as any, permissions, path.concat(key));

      // Remove empty objects.
      if (!isPathValid && Object.keys(result).length === 0) {
        delete doc[key];
      }
    } else if (!isPathValid) {
      delete doc[key];
    }
  });

  return record;
}
