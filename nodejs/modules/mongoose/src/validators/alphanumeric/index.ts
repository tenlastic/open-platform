export const alphanumericValidator = {
  message: 'Value must be alphanumeric.',
  validator: (value: string) => /^[A-Za-z0-9]*$/.test(value),
};
