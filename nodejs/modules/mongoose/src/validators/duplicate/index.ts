import * as mongoose from 'mongoose';

export const duplicateValidator = {
  msg: 'Array cannot contain duplicate values.',
  validator: (values: any) => {
    if (!Array.isArray(values)) {
      return true;
    }

    const set = new Set();

    for (const value of values) {
      const alphabetized = alphabetizeKeys(value);
      const json = JSON.stringify(alphabetized);

      if (set.has(json)) {
        return false;
      }

      set.add(json);
    }

    return true;
  },
};

function alphabetizeKeys(value: { [key: string]: any }) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  const keys = Object.keys(value).sort();

  return keys.reduce((previous, current) => {
    previous[current] = value[current];
    return previous;
  }, {});
}
