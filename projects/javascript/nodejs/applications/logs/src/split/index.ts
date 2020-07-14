export function split(value: string) {
  return value
    .split(/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+Z /m)
    .filter(line => line)
    .map(line => line.replace(/\n/g, ''));
}
