import sift from 'sift';

import { substituteReferenceValues } from '../substitute-reference-values';

/**
 * Determines if the query matches the JSON object.
 */
export function isJsonValid(json: any, query: any): boolean {
  const substitutedQuery = substituteReferenceValues(query, json);
  return sift(substitutedQuery)(json);
}
