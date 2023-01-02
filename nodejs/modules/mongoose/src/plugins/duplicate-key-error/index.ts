import { Schema } from 'mongoose';

export class DuplicateKeyError extends Error {
  public paths: string[];
  public values: any[];

  constructor(value: any) {
    const paths = Object.keys(value);
    const values = Object.values(value);

    const keyString = paths.length > 1 ? 'keys' : 'key';
    const pathString = paths.join(', ');
    super(`Record must have unique values for the following ${keyString}: ${pathString}.`);

    this.name = 'DuplicateKeyError';
    this.paths = paths;
    this.values = values;
  }
}

export class DuplicateKeyIndexError extends Error {
  public paths: string[];
  public values: any[];

  constructor(value: any) {
    const paths = Object.keys(value);
    const values = Object.values(value);

    const keyString = paths.length > 1 ? 'keys' : 'key';
    const pathString = paths.join(', ');
    super(`Records must have unique values for the following ${keyString}: ${pathString}.`);

    this.name = 'DuplicateKeyIndexError';
    this.paths = paths;
    this.values = values;
  }
}

export function duplicateKeyErrorPlugin(schema: Schema) {
  schema.post('findOneAndUpdate', function (err, doc, next) {
    if (err.code === 11000) {
      const validationError = err.message.startsWith('Index')
        ? new DuplicateKeyIndexError(err.keyValue)
        : new DuplicateKeyError(err.keyValue);

      return next(validationError);
    }

    return next(err);
  });

  schema.post('save', function (err, doc, next) {
    if (err.code === 11000) {
      const validationError = err.message.startsWith('Index')
        ? new DuplicateKeyIndexError(err.keyValue)
        : new DuplicateKeyError(err.keyValue);

      return next(validationError);
    }

    return next(err);
  });
}
