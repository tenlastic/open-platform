import * as mongoose from 'mongoose';

const bsonTypeToMongoose = {
  bool: Boolean,
  date: Date,
  decimal: mongoose.Schema.Types.Decimal128,
  double: Number,
  objectId: mongoose.Schema.Types.ObjectId,
  string: String,
};

const schemaParamsToMongoose = {
  bsonType: (value: string) => ({ type: bsonTypeToMongoose[value] }),
  default: (value: string) => ({ default: value }),
  enum: (value: any[]) => ({ enum: value }),
  maximum: (value: number) => ({ max: value }),
  maxLength: (value: number) => ({ maxlength: value }),
  minimum: (value: number) => ({ min: value }),
  minLength: (value: number) => ({ minlength: value }),
  pattern: (value: string) => ({ match: RegExp(value) }),
};

function toMongooseParams(acc: any, [key, value]) {
  const constructor = schemaParamsToMongoose[key];

  if (constructor) {
    return Object.assign(acc, constructor(value));
  }

  return acc;
}

export function convert(jsonSchema: any) {
  if (jsonSchema.constructor !== Object) {
    throw new Error(`Unsupported JSON schema bsonType: ${jsonSchema.bsonType}.`);
  }

  let typeIsDefined = 'bsonType' in jsonSchema;

  if (jsonSchema.bsonType in bsonTypeToMongoose) {
    return Object.entries(jsonSchema).reduce(toMongooseParams, {});
  } else if (jsonSchema.bsonType === 'object') {
    return getObjectType(jsonSchema);
  } else if (jsonSchema.bsonType === 'array') {
    return getArrayType(jsonSchema);
  } else if (!typeIsDefined) {
    return mongoose.Schema.Types.Mixed;
  }

  throw new Error(`Unsupported JSON schema bsonType: ${jsonSchema.bsonType}.`);
}

function getArrayType(jsonSchema: any) {
  if (jsonSchema.items && Object.keys(jsonSchema.items).length > 0) {
    return [convert(jsonSchema.items)];
  }

  return [];
}

function getObjectType(jsonSchema: any) {
  if (!jsonSchema.properties || Object.keys(jsonSchema.properties).length === 0) {
    return mongoose.Schema.Types.Mixed;
  }

  const converted = Object.entries(jsonSchema.properties).reduce((previousValue, [key, value]) => {
    previousValue[key] = convert(value);
    return previousValue;
  }, {});

  if (jsonSchema.required) {
    return Object.entries(converted).reduce((previousValue, [key, value]) => {
      previousValue[key] = subSchemaType(jsonSchema, value, key);
      return previousValue;
    }, {});
  }

  return converted;
}

function subSchemaType(parentSchema: any, subschema: any, key: any) {
  if (0 <= parentSchema.required.indexOf(key)) {
    if (subschema.constructor !== Object) {
      return { type: subschema, required: true };
    }

    if (subschema.hasOwnProperty('type')) {
      return Object.assign(subschema, { required: true });
    }
  }

  return subschema;
}
