export const entryLengthValidator = (max: number, min?: number) => {
  const maxMsg = max && max !== Infinity ? ` more than ${max}` : '';
  const minMsg = min ? ` less than ${min}` : '';
  const andMsg = maxMsg && minMsg ? ' and' : '';

  const msg = `Value cannot contain${minMsg}${andMsg}${maxMsg} entries.`;

  return {
    msg,
    validator: (value: any) => {
      if (value instanceof Map) {
        return isValid(max, min, Array.from(value.keys()));
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        return isValid(max, min, Object.keys(value));
      } else {
        return true;
      }
    },
  };
};

function isValid(max: number, min: number, value: any) {
  return (!max || value.length <= max) && (!min || value.length >= min);
}
