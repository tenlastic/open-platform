/**
 * Return an object's property with a dot-notation string (Ex: 'property.name.first').
 */
export function getPropertyByDotNotation(json: any, path: string) {
  return path.split('.').reduce(getPropertyByKey, json);
}

/**
 * Return an object's property with a key string (Ex: 'property').
 *
 * If the object is an Array, find all subdocument properties matching the path.
 * Remove any null or undefined values afterward.
 *
 * If the object is an Object, return the object's property. Return null instead
 * of undefined to keep things consistent.
 *
 * If the object is not an Array or Object, return null since it has no subproperties.
 */
function getPropertyByKey(obj: any, key: string) {
  if (obj && obj.constructor === Array) {
    return obj
      .map(o => (o && o.constructor === Object ? o[key] : null))
      .filter(o => o !== null && o !== undefined);
  } else if (obj && obj.constructor === Object) {
    return obj[key] === undefined ? null : obj[key];
  } else {
    return null;
  }
}
