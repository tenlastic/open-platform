export const enumValidator = (values: any[]) => {
  const msg = `Value must be one of the following: ${values.join(', ')}.`;

  return { msg, validator: (value: any) => values.includes(value) };
};
