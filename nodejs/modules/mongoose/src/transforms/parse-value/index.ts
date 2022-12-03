export function parseValue(value) {
  if (!value) {
    return value;
  }

  return typeof value === 'string' ? JSON.parse(value) : value;
}
