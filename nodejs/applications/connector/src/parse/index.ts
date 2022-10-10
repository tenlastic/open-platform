import * as mongoose from 'mongoose';

const date = new RegExp('^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]+Z$');
const objectId = new RegExp('^[0-9A-Fa-f]{24}$');

/**
 * Converts strings within MongoDB objects and queries into Dates and ObjectIds.
 */
export function parse(object: { [key: string]: any }): any {
  if (object === null || object === undefined) {
    return object;
  }

  return Object.entries<any>(object).reduce((agg, [key, value]) => {
    let result: any;

    if (value && value.constructor === Object) {
      result = parse(value);
    } else if (value && value.constructor === Array) {
      result = value.map((v) => (v?.constructor === Object ? parse(v) : convert(v)));
    } else {
      result = convert(value);
    }

    agg[key] = result;

    return agg;
  }, {});
}

/**
 * Converts strings to Dates and ObjectIds.
 */
function convert(value: any) {
  if (typeof value !== 'string') {
    return value;
  }

  const isDate = date.test(value);
  if (isDate) {
    return new Date(value);
  }

  const isObjectId = objectId.test(value);
  if (isObjectId) {
    return new mongoose.Types.ObjectId(value);
  }

  return value;
}
