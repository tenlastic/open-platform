export function split(value: string) {
  return value
    .split(/^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+Z .*)$/m)
    .map(line => line.replace(/\n/g, ''))
    .filter(line => line);
}
