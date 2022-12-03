import * as mongoose from 'mongoose';

export function parseMapValues(value) {
  if (!value) {
    return value;
  }

  const json = value.toJSON ? value.toJSON() : value;

  return Object.entries(json).reduce((previous, [k, v]) => {
    previous.set(k, typeof v === 'string' ? JSON.parse(v) : v);
    return previous;
  }, new mongoose.Types.Map());
}
