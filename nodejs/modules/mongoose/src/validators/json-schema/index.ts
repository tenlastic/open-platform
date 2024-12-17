import Ajv from 'ajv';

const ajv = new Ajv();
const validate = ajv.compile({
  definitions: {
    properties: {
      additionalProperties: false,
      properties: {
        additionalProperties: { type: 'boolean' },
        default: {
          oneOf: [{ type: 'boolean' }, { type: 'number' }, { type: 'string' }],
        },
        format: { enum: ['date-time'], type: 'string' },
        items: { $ref: '#/definitions/properties' },
        properties: {
          additionalProperties: false,
          minProperties: 1,
          patternProperties: {
            '^[A-Za-z0-9]+$': { $ref: '#/definitions/properties' },
          },
          type: 'object',
        },
        required: {
          items: { type: 'string' },
          type: 'array',
        },
        type: {
          enum: ['array', 'boolean', 'integer', 'number', 'object', 'string'],
          type: 'string',
        },
      },
      required: ['type'],
      type: 'object',
    },
  },
  properties: {
    additionalProperties: { type: 'boolean' },
    properties: {
      additionalProperties: false,
      minProperties: 1,
      patternProperties: {
        '^[A-Za-z0-9]+$': { $ref: '#/definitions/properties' },
      },
      type: 'object',
    },
    required: {
      items: { type: 'string' },
      type: 'array',
    },
    type: {
      enum: ['object'],
      type: 'string',
    },
  },
  required: ['properties', 'type'],
  type: 'object',
});

export const jsonSchemaValidator = {
  msg: () => {
    const error = validate.errors[0];
    return `${error.instancePath} ${error.message}`;
  },
  validator: (value: any) => validate(value),
};
