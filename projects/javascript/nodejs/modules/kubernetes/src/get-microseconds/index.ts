export function getMicroseconds(value: string) {
  const matches = value.match(
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}([0-9]+)Z/m,
  );

  return parseInt(matches[1], 10);
}
