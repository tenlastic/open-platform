import * as mongoose from 'mongoose';

import { filterObject } from '../filter-object';
import { getFieldPermissions } from '../get-field-permissions';
import { DocumentToObject, IContext, PermissionError } from '../types';

/**
 * Removes any unauthorized fields from a record.
 * @param context The context for accessing the record.
 * @param record The record to filter attributes from.
 */
export async function read<TDocument extends mongoose.Document>(
  context: IContext<TDocument>,
  record: TDocument,
) {
  if (!record) {
    return null;
  }

  const readPermissions = await getFieldPermissions(context, 'read', record);
  if (readPermissions.length === 0) {
    throw new PermissionError();
  }

  const object: DocumentToObject<TDocument> = record.toJSON({
    flattenMaps: true,
    getters: true,
    virtuals: true,
  });

  return filterObject('read', object, readPermissions);
}
