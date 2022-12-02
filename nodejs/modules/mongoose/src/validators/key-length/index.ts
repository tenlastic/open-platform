export const keyLengthValidator = (max: number, min?: number) => {
  const maxMsg = max ? ` more than ${max}` : '';
  const minMsg = min ? ` less than ${min}` : '';
  const andMsg = maxMsg && minMsg ? ' and' : '';

  const msg = `Keys cannot be${minMsg}${andMsg}${maxMsg} characters.`;

  return {
    msg,
    validator: (value: any) => {
      if (value instanceof Map) {
        return Array.from(value.keys()).every((k) => isValid(k, max, min));
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value).every((k) => isValid(k, max, min));
      } else {
        return true;
      }
    },
  };
};

function isValid(key: string, max: number, min: number) {
  return (!max || key.length <= max) && (!min || key.length >= min);
}
