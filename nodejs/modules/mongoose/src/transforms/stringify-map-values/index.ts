import * as mongoose from 'mongoose';

export function stringifyMapValues(value) {
  if (!value) {
    return value;
  }

  const json = value.toJSON
    ? value.toJSON({ flattenMaps: true, getters: true, virtuals: true })
    : value;

  return Object.entries(json).reduce((previous, [k, v]) => {
    previous.set(k, typeof v === 'string' ? v : JSON.stringify(v));
    return previous;
  }, new mongoose.Types.Map<string>());
}
