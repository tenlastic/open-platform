import * as deepmerge from 'deepmerge';
import * as mongoose from 'mongoose';

import { filterObject } from '../filter-object';
import { getFieldPermissions } from '../get-field-permissions';
import { IContext, PermissionError } from '../types';

/**
 * Allows a user to update a record with only the fields they are authorized to set.
 * @param context The context for updating the record.
 * @param baseParameters The parameters to update on the record.
 * @param overlayParameters Parameters to apply regardless of filtering rules.
 * @param record The record to update.
 */
export async function updateOne<TDocument extends mongoose.Document>(
  context: IContext<TDocument>,
  baseParameters: Partial<TDocument>,
  overlayParameters: Partial<TDocument>,
  record: TDocument,
) {
  const updatePermissions = await getFieldPermissions(context, 'update', record);

  if (updatePermissions.length === 0) {
    throw new PermissionError();
  }

  // Update record with authorized fields
  const parameters = filterObject(
    'update',
    baseParameters,
    updatePermissions,
    context.Model.schema,
  );
  const arrayMerge = (destinationArray, sourceArray) => sourceArray;
  const customMerge = (key) => {
    return context.Model.schema.paths[key]?.options.merge
      ? deepmerge
      : (x, y) => (Array.isArray(x) || Array.isArray(y) ? arrayMerge(x, y) : y);
  };
  const mergedParameters = deepmerge.all(
    [
      JSON.parse(JSON.stringify(record)),
      JSON.parse(JSON.stringify(parameters)),
      JSON.parse(JSON.stringify(overlayParameters)),
    ],
    { arrayMerge, customMerge },
  );

  for (const key of Object.keys(mergedParameters)) {
    record[key] = mergedParameters[key];
  }

  return record.save();
}
