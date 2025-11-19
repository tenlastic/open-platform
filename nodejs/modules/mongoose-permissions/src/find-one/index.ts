import * as mongoose from 'mongoose';

import { find } from '../find';
import { IContext, IFindQuery } from '../types';

/**
 * Allows a user to retrieve records they are allowed to access.
 * Performs query population to provide any related documents for access-level calculations.
 * @param context The credentials for the query.
 * @param override The system's params.
 * @param params The user's params.
 */
export async function findOne<TDocument extends mongoose.Document>(
  context: IContext<TDocument>,
  baseQuery: IFindQuery<TDocument>,
  overlayQuery: IFindQuery<TDocument>,
) {
  const results = await find(context, baseQuery, { ...overlayQuery, limit: 1 });
  return results[0];
}
