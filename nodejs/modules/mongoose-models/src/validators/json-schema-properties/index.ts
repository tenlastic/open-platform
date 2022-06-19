export const jsonSchemaPropertiesValidator = {
  msg:
    'Properties must contain only letters, numbers, and hyphens ' +
    'and consist of only 2-40 characters.',
  validator: (value: any) => {
    if (!value) {
      return true;
    }

    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {
        return false;
      }
    }

    return getInvalidKeys(value).length === 0;
  },
};

function getInvalidKeys(object: any) {
  const arr = [];

  if (!object) {
    return arr;
  }

  Object.keys(object).forEach((key) => {
    const value = object[key];

    if (!/^[0-9A-Za-z\-]{2,40}$/.test(key)) {
      arr.push(key);
    }

    if (value.constructor === Object) {
      arr.push.apply(arr, getInvalidKeys(value));
    }
  });

  return arr;
}
