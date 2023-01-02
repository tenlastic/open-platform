/**
 * Primarily used to convert ObjectId instances into regular strings.
 */
export function toPlainObject(obj: any, virtuals = false) {
  const json = obj?.toJSON ? obj.toJSON({ virtuals }) : obj;
  return json ? JSON.parse(JSON.stringify(json)) : json;
}
