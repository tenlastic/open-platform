import * as mongoose from 'mongoose';

import { getReferences } from '../get-references';
import { getRoles } from '../get-roles';
import { substituteReferenceValues } from '../substitute-reference-values';
import { substituteSubqueryValues } from '../substitute-subquery-values';
import { IContext } from '../types';

/**
 * Creates a where query that filters out unauthorized records.
 * @param credentials The credentials for the query.
 * @param where The where clause for the query.
 */
export async function where<TDocument extends mongoose.Document>(
  context: IContext<TDocument>,
  where: mongoose.FilterQuery<TDocument>,
) {
  if (!context.options.find) {
    return null;
  }

  const references = getReferences(context.credentials, null);
  const roles = getRoles(context.options, references);

  const queries = Object.entries(context.options.find)
    .filter(([k, v]) => roles.includes(k) && v)
    .map(([, v]) => v);
  if (queries.length === 0) {
    return null;
  }

  // Substitute calculated values into default find queries.
  const results = queries.map((q) => substituteReferenceValues(q, references));
  const substitutedQueries = [];
  for (const result of results) {
    const substitutedQuery = await substituteSubqueryValues(context.Model.db, result);
    substitutedQueries.push(substitutedQuery);
  }

  const $or = {
    $or: substitutedQueries.filter((q) => q instanceof Object && q.constructor === Object),
  };
  return { $and: [$or, where].filter((q) => q instanceof Object && q.constructor === Object) };
}
