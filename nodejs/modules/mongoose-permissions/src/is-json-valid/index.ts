import * as mongoose from 'mongoose';
import sift from 'sift';

import { substituteReferenceValues } from '../substitute-reference-values';

/**
 * Determines if the query matches the JSON object.
 */
export function isJsonValid(json: object, query: mongoose.FilterQuery<mongoose.Document>): boolean {
  const substitutedQuery = substituteReferenceValues(query, json);
  return sift(substitutedQuery)(json);
}
