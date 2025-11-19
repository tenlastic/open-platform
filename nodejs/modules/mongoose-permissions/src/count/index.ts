import * as mongoose from 'mongoose';

import { IContext, PermissionError } from '../types';
import { where } from '../where';

/**
 * Allows a user to retrive the count of a query.
 * @param context The context for the query.
 * @param baseFilter The user's where query.
 * @param overlayFilter The system's where query.
 */
export async function count<TDocument extends mongoose.Document>(
  context: IContext<TDocument>,
  baseFilter: mongoose.FilterQuery<TDocument>,
  overlayFilter: mongoose.FilterQuery<TDocument>,
) {
  const filter = await where<TDocument>(context, baseFilter);

  if (filter === null) {
    throw new PermissionError();
  }

  return context.Model.countDocuments({ ...filter, ...overlayFilter }).exec();
}
