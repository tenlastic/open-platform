export const arrayMaxMinValidator = (max: number, min?: number) => {
  const maxMsg = max && max !== Infinity ? ` more than ${max}` : '';
  const minMsg = min ? ` less than ${min}` : '';
  const andMsg = maxMsg && minMsg ? ' and' : '';

  const msg = `Values cannot be${minMsg}${andMsg}${maxMsg}.`;

  return {
    msg,
    validator: (values: any) => {
      return Array.isArray(values) ? values.every((v) => isValid(max, min, v)) : true;
    },
  };
};

function isValid(max: number, min: number, value: any) {
  return typeof value === 'number' ? (!max || value <= max) && (!min || value >= min) : false;
}
