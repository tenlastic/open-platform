export const duplicateValidator = {
  msg: 'Array cannot contain duplicate values.',
  validator: (value: any) => {
    if (!Array.isArray(value)) {
      return true;
    }

    const set = new Set();

    return !value.some((v) => {
      const json = JSON.stringify(v);

      if (set.has(json)) {
        return true;
      } else {
        set.add(json);
        return false;
      }
    });
  },
};
