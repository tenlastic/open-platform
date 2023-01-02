export const stringLengthValidator = (max: number, min?: number) => {
  const maxMsg = max ? ` more than ${max}` : '';
  const minMsg = min ? ` less than ${min}` : '';
  const andMsg = minMsg && maxMsg ? ' and' : '';

  const msg = `Value cannot be${minMsg}${andMsg}${maxMsg} characters.`;

  return {
    msg,
    validator: (value: string) => (!max || value.length <= max) && (!min || value.length >= min),
  };
};
