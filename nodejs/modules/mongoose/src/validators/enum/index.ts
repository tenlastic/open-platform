export const enumValidator = (values: unknown[]) => {
  const message = `Value must be one of the following: ${values.join(', ')}.`;

  return { message, validator: (value: unknown) => values.includes(value) };
};
