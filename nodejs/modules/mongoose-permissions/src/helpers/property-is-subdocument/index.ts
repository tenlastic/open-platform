/**
 * Returns true if the property is a subdocument.
 */
export function propertyIsSubdocument(json: any, path: string) {
  return path
    .split('.')
    .reduce((previous, current) => previous?.constructor === Array && current.includes('.'), json);
}
