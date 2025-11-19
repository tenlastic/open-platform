import * as mongoose from 'mongoose';

import { JsonSchema, JsonSchemaType } from '../types';

export function mongooseToJson(schema: mongoose.Schema): JsonSchema {
  const properties: { [key: string]: JsonSchema } = {};

  for (const [key, value] of Object.entries(schema.paths)) {
    if (key.includes('.$*')) {
      continue;
    }

    const type = getType(value);
    if (type) {
      properties[key] = type;
    }
  }

  return { properties, type: JsonSchemaType.Object };
}

function getType(value: mongoose.SchemaType) {
  switch (value.instance) {
    case 'Array':
      return {
        items: value.schema
          ? mongooseToJson(value.schema)
          : getType((value as mongoose.Schema.Types.Array).caster),
        type: 'array',
      };

    case 'Boolean':
      return { type: 'boolean' };

    case 'Buffer':
      return null;

    case 'Date':
      return { format: 'date-time', type: 'string' };

    case 'Decimal128':
      return { type: 'number' };

    case 'Embedded':
      return mongooseToJson(value.schema);

    case 'Map':
      return { type: 'object' };

    case 'Mixed':
      return { type: 'object' };

    case 'Number':
      return { type: 'number' };

    case 'ObjectId':
      return { pattern: '^[0-9A-Fa-f]{24}$', type: 'string' };

    case 'String':
      return { type: 'string' };
  }
}
