export const arrayNullUndefinedValidator = {
  msg: 'Values cannot be null or undefined.',
  validator: (value: any) => {
    return Array.isArray(value) ? value.every((v) => v !== null && v !== undefined) : true;
  },
};
