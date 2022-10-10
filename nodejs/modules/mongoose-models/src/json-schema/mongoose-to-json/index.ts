import * as mongoose from 'mongoose';

export function mongooseToJson(schema: mongoose.Schema) {
  const properties: any = {};

  for (const [key, value] of Object.entries(schema.paths)) {
    if (key.includes('.$*')) {
      continue;
    }

    const type = getType(value);
    if (type) {
      properties[key] = type;
    }
  }

  return { properties, type: 'object' };
}

function getType(value: mongoose.SchemaType<any>) {
  switch (value.instance) {
    case 'Array':
      return { type: 'array' };

    case 'Boolean':
      return { type: 'boolean' };

    case 'Buffer':
      return null;

    case 'Date':
      return { format: 'date-time', type: 'string' };

    case 'Decimal128':
      return { type: 'number' };

    case 'Map':
      return { type: 'object' };

    case 'Mixed':
      return { type: 'object' };

    case 'Number':
      return { type: 'number' };

    case 'ObjectID':
      return { pattern: '^[0-9A-Fa-f]{24}$', type: 'string' };

    case 'String':
      return { type: 'string' };
  }
}
