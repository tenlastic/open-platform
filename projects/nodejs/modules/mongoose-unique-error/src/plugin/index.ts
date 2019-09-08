import { MongoError } from 'mongodb';
import { Schema } from 'mongoose';

export class ValidationError extends Error {
  public errors: { [key: string]: ValidatorError };

  constructor(errors: { [key: string]: ValidatorError }) {
    super('Validation failed');

    this.errors = errors;
    this.name = 'ValidationError';
  }
}

export class ValidatorError extends Error {
  public kind: string;
  public paths: string[];
  public values: any[];

  constructor(value: any) {
    const paths = Object.keys(value);
    const values = Object.values(value);

    const keyString = paths.length > 1 ? 'keys' : 'key';
    const pathString = paths.join(',');
    super(`Record must have unique values for the following ${keyString}: ${pathString}.`);

    this.kind = 'unique';
    this.name = 'ValidatorError';
    this.paths = paths;
    this.values = values;
  }
}

export function plugin(schema: Schema) {
  schema.post('findOneAndUpdate', function(err, doc, next) {
    if (err.name === 'MongoError' && err.code === 11000) {
      const update = this.getUpdate();
      const validationError = getValidationError(err, schema, update);

      return next(validationError);
    }

    return next(err);
  });

  schema.post('save', function(err, doc, next) {
    if (err.name === 'MongoError' && err.code === 11000) {
      const validationError = getValidationError(err, schema, doc);
      return next(validationError);
    }

    return next(err);
  });
}

function getIndexNames(indexes: any[]) {
  return indexes.map(i => {
    const [keys, options] = i;

    // Return the index name if explicitly defined.
    if (options.name) {
      return options.name;
    }

    const names = Object.keys(keys).map(key => `${key}_1`);
    return names.join('_');
  });
}

function getValidationError(err: MongoError, schema: Schema, doc: any) {
  // Get index name from the MongoError.
  const indexName = err.message.match(/index: ([A-Za-z0-9\_]+) dup key/)[1];

  // Get names of unique indexes defined within Mongoose schema.
  const uniqueIndexes = schema.indexes().filter(i => i[1] && i[1].unique);
  const uniqueIndexNames = getIndexNames(uniqueIndexes);

  // Find the Mongoose index that matches the MongoError's index name.
  const index = uniqueIndexNames.findIndex(i => i === indexName);
  const uniqueIndex = uniqueIndexes[index];

  // If the index is not defined, return the MongoError.
  if (index < 0) {
    return err;
  }

  // Map the document's values to the index's keys.
  const values = Object.keys(uniqueIndex[0]).reduce((agg, key) => {
    agg[key] = doc[key];
    return agg;
  }, {});

  const validatorErrors = Object.keys(values).reduce((agg, key) => {
    agg[key] = new ValidatorError(values);
    return agg;
  }, {});
  const validationError = new ValidationError(validatorErrors);

  return validationError;
}
