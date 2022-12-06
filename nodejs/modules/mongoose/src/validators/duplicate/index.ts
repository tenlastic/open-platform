export const duplicateValidator = {
  msg: 'Array cannot contain duplicate values.',
  validator: (value: any) => {
    if (!Array.isArray(value)) {
      return true;
    }

    const set = new Set();

    return !value.some((v) => {
      const alphabetized = alphabetizeKeys(v);
      const json = JSON.stringify(alphabetized);

      if (set.has(json)) {
        return true;
      } else {
        set.add(json);
        return false;
      }
    });
  },
};

function alphabetizeKeys(value: { [key: string]: any }) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const keys = Object.keys(value).sort();

  return keys.reduce((previous, current) => {
    previous[current] = value[current];
    return previous;
  }, {});
}
