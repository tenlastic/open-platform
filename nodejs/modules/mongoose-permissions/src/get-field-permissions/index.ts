import * as mongoose from 'mongoose';

import { getReferences } from '../get-references';
import { getRoles } from '../get-roles';
import { populateRecord } from '../populate-record';
import { IContext } from '../types';

/**
 * Returns the fields the user has permission to access.
 * @param credentials The credentials for accessing the record.
 * @param key The key within the permissions configuration.
 * @param record The record being accessed.
 */
export async function getFieldPermissions<TDocument extends mongoose.Document>(
  context: IContext<TDocument>,
  key: 'create' | 'read' | 'update',
  record: TDocument,
): Promise<string[]> {
  record = await populateRecord(context, record);

  const permissions = context.options[key];
  if (!permissions) {
    return [];
  }

  const references = getReferences(context.credentials, record);
  const roles = getRoles(context.options, references);

  return Object.entries(permissions)
    .reduce((previous, [k, v]) => (roles.includes(k) ? [...previous, ...v] : previous), [])
    .filter((a, i, arr) => arr.indexOf(a) === i);
}
