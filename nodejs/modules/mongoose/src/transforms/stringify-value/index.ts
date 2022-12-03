export function stringifyValue(value) {
  if (!value) {
    return value;
  }

  return typeof value === 'string' ? value : JSON.stringify(value);
}
