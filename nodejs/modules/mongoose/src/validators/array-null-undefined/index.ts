export const arrayNullUndefinedValidator = {
  message: 'Values cannot be null or undefined.',
  validator: (value: unknown) => {
    return Array.isArray(value) ? value.every((v) => v !== null && v !== undefined) : true;
  },
};
