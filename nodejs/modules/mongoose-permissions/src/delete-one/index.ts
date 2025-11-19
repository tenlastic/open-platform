import * as mongoose from 'mongoose';

import { getReferences } from '../get-references';
import { getRoles } from '../get-roles';
import { populateRecord } from '../populate-record';
import { IContext, IReferences, PermissionError } from '../types';

/**
 * Removes a record if the user is authorized to do so.
 * @param credentials The credentials for removing the record.
 * @param record The record to remove.
 */
export async function deleteOne<TDocument extends mongoose.Document>(
  context: IContext<TDocument>,
  record: TDocument,
): Promise<mongoose.DeleteResult> {
  record = await populateRecord(context, record);

  const references = getReferences(context.credentials, record);
  const removePermissions = await canDelete(context, references);
  if (!removePermissions) {
    throw new PermissionError();
  }

  return record.deleteOne();
}

/**
 * Returns whether or not a user may delete a record.
 */
async function canDelete<TDocument extends mongoose.Document>(
  context: IContext<TDocument>,
  references: IReferences<TDocument>,
) {
  if (!context.options.delete) {
    return false;
  }

  const roles = getRoles(context.options, references);
  return roles.some((r) => context.options.delete[r]);
}
