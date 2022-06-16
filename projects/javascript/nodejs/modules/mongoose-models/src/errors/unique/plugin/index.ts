import { Schema } from 'mongoose';

import { getValidationError } from '../get-validation-error';

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
