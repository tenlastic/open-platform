export const arrayLengthValidator = (max: number, min?: number) => {
  const maxMsg = max && max !== Infinity ? ` more than ${max}` : '';
  const minMsg = min ? ` less than ${min}` : '';
  const andMsg = maxMsg && minMsg ? ' and' : '';

  const message = `Value cannot contain${minMsg}${andMsg}${maxMsg} items.`;

  return {
    message,
    validator: (value: unknown) => {
      return Array.isArray(value)
        ? (!max || value.length <= max) && (!min || value.length >= min)
        : true;
    },
  };
};
