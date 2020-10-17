export function getBody(value: string) {
  const matches = value.match(
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}[0-9]+Z (.*)/m,
  );

  return matches[1];
}
