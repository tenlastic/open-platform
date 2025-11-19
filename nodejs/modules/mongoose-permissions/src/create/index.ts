import * as deepmerge from 'deepmerge';
import * as mongoose from 'mongoose';

import { filterObject } from '../filter-object';
import { getFieldPermissions } from '../get-field-permissions';
import { getReferences } from '../get-references';
import { substituteReferenceValues } from '../substitute-reference-values';
import { IContext, PermissionError } from '../types';

/**
 * Allows a user to create a record with only the fields they are authorized to set.
 * @param context The credentials for creating the record.
 * @param baseParameters The parameters to initialize on the record.
 * @param overlayParameters Parameters to apply regardless of filtering rules.
 */
export async function create<TDocument extends mongoose.Document>(
  context: IContext<TDocument>,
  baseParameters: Partial<TDocument>,
  overlayParameters: Partial<TDocument> = {},
) {
  let stubRecord = new context.Model({ ...baseParameters, ...overlayParameters });

  if (context.options.populate) {
    const references = getReferences(context.credentials, null);
    const populate = substituteReferenceValues(context.options.populate, references);
    stubRecord = await stubRecord.populate(populate);
  }

  const createPermissions = await getFieldPermissions(context, 'create', stubRecord);
  if (createPermissions.length === 0) {
    throw new PermissionError();
  }

  // Create record with authorized attributes
  const parameters = filterObject(
    'create',
    baseParameters,
    createPermissions,
    context.Model.schema,
  );
  const overwriteMerge = (destinationArray, sourceArray) => sourceArray;
  const mergedParameters = deepmerge(
    JSON.parse(JSON.stringify(parameters)),
    JSON.parse(JSON.stringify(overlayParameters)),
    { arrayMerge: overwriteMerge },
  );

  return context.Model.create(mergedParameters);
}
