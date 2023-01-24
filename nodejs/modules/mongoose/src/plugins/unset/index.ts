import { Document, Schema } from 'mongoose';

export function unsetPlugin(schema: Schema) {
  schema.pre('save', function () {
    const json = this.toJSON();
    unset(this, null, json);
  });
}

function join(a: string, b: number | string) {
  return a ? `${a}.${b}` : `${b}`;
}

function skip(document: Document, key: string) {
  if (!key) {
    return false;
  }

  const options = document.schema.path(key);
  if (!options || !options.options) {
    return false;
  }

  if (options.options.unset === false) {
    return true;
  }

  if (!key.includes('.')) {
    return false;
  }

  key = key.substring(0, key.lastIndexOf('.'));
  return skip(document, key);
}

function unset(document: Document, key: string, value: any) {
  if (key === '_id' || key === '__v') {
    return;
  }

  if (skip(document, key)) {
    return;
  }

  const isArrayElement = key?.match(/\.[0-9]$/);
  if (!isArrayElement && (value === false || value === null || value === 0 || value === '')) {
    document.set(key, undefined);
  }

  if (value?.constructor === Object) {
    Object.entries(value).forEach(([k, v]) => unset(document, join(key, k), v));
  } else if (value?.constructor === Array) {
    value.forEach((v, i) => unset(document, join(key, i), v));
  }
}
