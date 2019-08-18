import * as Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

/**
 * Returns an array of errors if the object is invalid, null otherwise.
 */
export function validate(schema: any, data: any) {
  ajv.validate(schema, data);

  return ajv.errors || [];
}
