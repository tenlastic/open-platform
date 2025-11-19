import * as mongoose from 'mongoose';

import { isJsonValid } from '../is-json-valid';
import { IOptions, IReferences } from '../types';

/**
 * Returns the role of the user accessing a record.
 */
export function getRoles<TDocument extends mongoose.Document>(
  options: IOptions<TDocument>,
  references: IReferences<TDocument>,
) {
  if (!options.roles) {
    return [];
  }

  const roles: string[] = [];

  for (const [role, query] of Object.entries(options.roles)) {
    try {
      if (isJsonValid(references, query)) {
        roles.push(role);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return roles;
}
