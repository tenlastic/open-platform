export const stringLengthValidator = (min: number, max: number) => {
  const minMsg = min === 0 ? '' : ` less than ${min}`;
  const maxMsg = max === 0 ? '' : ` more than ${max}`;
  const andMsg = minMsg && maxMsg ? ' and' : '';

  const msg = `Value cannot contain${minMsg}${andMsg}${maxMsg} characters.`;

  return {
    msg,
    validator: (value: string) =>
      (min === 0 || value.length >= min) && (max === 0 || value.length <= max),
  };
};
