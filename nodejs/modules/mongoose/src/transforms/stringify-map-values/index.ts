import * as mongoose from 'mongoose';

export function stringifyMapValues(value): mongoose.Types.Map<any> {
  if (!value) {
    return value;
  }

  const json = value.toJSON ? value.toJSON() : value;

  return Object.entries(json).reduce((previous, [k, v]) => {
    previous.set(k, typeof v === 'string' ? v : JSON.stringify(v));
    return previous;
  }, new mongoose.Types.Map());
}
