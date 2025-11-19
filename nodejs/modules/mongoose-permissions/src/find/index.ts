import * as mongoose from 'mongoose';

import { getReferences } from '../get-references';
import { substituteReferenceValues } from '../substitute-reference-values';
import { IContext, IFindQuery, PermissionError } from '../types';
import { where } from '../where';

/**
 * Allows a user to retrieve records they are allowed to access.
 * Performs query population to provide any related documents for access-level calculations.
 * @param context The credentials for the query.
 * @param baseParameters The user's params.
 * @param overlayParameters The system's params.
 */
export async function find<TDocument extends mongoose.Document>(
  context: IContext<TDocument>,
  baseQuery: IFindQuery<TDocument>,
  overlayQuery: IFindQuery<TDocument>,
): Promise<TDocument[]> {
  const filter = await where(context, { ...baseQuery.where, ...overlayQuery.where });
  if (filter === null) {
    throw new PermissionError();
  }

  const query = context.Model.find(filter)
    .sort(overlayQuery.sort || baseQuery.sort)
    .skip(overlayQuery.skip || baseQuery.skip)
    .limit(overlayQuery.limit || baseQuery.limit || 100)
    .select(overlayQuery.select || baseQuery.select);

  if (context.options.populate) {
    const references = getReferences(context.credentials, null);
    const populate = substituteReferenceValues(context.options.populate, references);
    return query.populate(populate);
  }

  return query.exec();
}
