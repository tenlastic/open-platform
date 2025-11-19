import * as mongoose from 'mongoose';

import { getReferences } from '../get-references';
import { substituteReferenceValues } from '../substitute-reference-values';
import { IContext, IPopulate } from '../types';

/**
 * Populates a record if paths have not been populated already.
 */
export async function populateRecord<TDocument extends mongoose.Document>(
  context: IContext<TDocument>,
  record: TDocument,
) {
  if (!context.options.populate) {
    return record;
  }

  const paths = context.options.populate.map((p) => getPaths(p)).flat() || [];

  for (const path of paths) {
    if (!record.populated(path)) {
      const references = getReferences(context.credentials);
      const populate = substituteReferenceValues(context.options.populate, references);
      return record.populate(populate);
    }
  }

  return record;
}

function getPaths<TDocument extends mongoose.Document>(populate: IPopulate<TDocument>) {
  const paths = [populate.path];

  if (populate.populate) {
    const subpaths = populate.populate.map((p) => getPaths(p)).flat();
    paths.push(...subpaths);
  }

  return paths;
}
