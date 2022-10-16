import { Schema } from 'mongoose';

export class UniqueError extends Error {
  public paths: string[];

  constructor(value: any) {
    const paths = Object.keys(value);

    const keyString = paths.length > 1 ? 'keys' : 'key';
    const pathString = paths.join(', ');
    super(`Record must have unique values for the following ${keyString}: ${pathString}.`);

    this.name = 'UniqueError';
    this.paths = paths;
  }
}

export function plugin(schema: Schema) {
  schema.post('findOneAndUpdate', function (err, doc, next) {
    if (err.code === 11000) {
      const validationError = new UniqueError(err.keyValue);
      return next(validationError);
    }

    return next(err);
  });

  schema.post('save', function (err, doc, next) {
    if (err.code === 11000) {
      const validationError = new UniqueError(err.keyValue);
      return next(validationError);
    }

    return next(err);
  });
}
