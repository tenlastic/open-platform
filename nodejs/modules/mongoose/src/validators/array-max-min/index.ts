export const arrayMaxMinValidator = (max: number, min?: number) => {
  const maxMsg = max && max !== Infinity ? ` more than ${max}` : '';
  const minMsg = min ? ` less than ${min}` : '';
  const andMsg = maxMsg && minMsg ? ' and' : '';

  const message = `Values cannot be${minMsg}${andMsg}${maxMsg}.`;

  return {
    message,
    validator: (values: unknown) => {
      return Array.isArray(values) ? values.every((v) => isValid(max, min, v)) : true;
    },
  };
};

function isValid(max: number, min: number, value: unknown) {
  if (typeof value !== 'number') {
    return false;
  }

  return (!max || value <= max) && (!min || value >= min);
}
