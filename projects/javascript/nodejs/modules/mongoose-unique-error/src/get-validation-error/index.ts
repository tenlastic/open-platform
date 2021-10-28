import { MongoError } from 'mongodb';
import { Schema } from 'mongoose';

export class UniquenessError extends Error {
  public paths: string[];
  public values: any[];

  constructor(value: any) {
    const paths = Object.keys(value);
    const values = Object.values(value);

    const keyString = paths.length > 1 ? 'keys' : 'key';
    const pathString = paths.join(', ');
    super(`Record must have unique values for the following ${keyString}: ${pathString}.`);

    this.name = 'UniquenessError';
    this.paths = paths;
    this.values = values;
  }
}

export function getValidationError(err: MongoError, schema: Schema, doc: any) {
  // Get index name from the MongoError.
  const indexName = err.message.match(/index: ([A-Za-z0-9\_\.]+) (collation|dup key)/)[1];

  // Get names of unique indexes defined within Mongoose schema.
  const uniqueIndexes = schema.indexes().filter((i) => i[1] && i[1].unique);
  const uniqueIndexNames = getIndexNames(uniqueIndexes);

  // Find the Mongoose index that matches the MongoError's index name.
  const index = uniqueIndexNames.findIndex((i) => i === indexName);
  const uniqueIndex = uniqueIndexes[index];

  // If the index is not defined, return the MongoError.
  if (index < 0) {
    return err;
  }

  let value = doc.toObject ? doc.toObject() : doc;
  if (value.$set || value.$setOnInsert) {
    value = { ...doc.$set, ...doc.$setOnInsert };
  }

  // Map the document's values to the index's keys.
  const values = Object.keys(uniqueIndex[0]).reduce((agg, key) => {
    agg[key] = value[key];
    return agg;
  }, {});

  return new UniquenessError(values);
}

function getIndexNames(indexes: any[]) {
  return indexes.map((i) => {
    const [keys, options] = i;

    // Return the index name if explicitly defined.
    if (options.name) {
      return options.name;
    }

    const names = Object.keys(keys).map((key) => `${key}_1`);
    return names.join('_');
  });
}
