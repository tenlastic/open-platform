/**
 * Primarily used to convert ObjectId instances into regular strings.
 */
export function toPlainObject(input: any, virtuals = false) {
  const output = input?.toJSON ? input.toJSON({ virtuals }) : input;
  return output ? JSON.parse(JSON.stringify(output)) : output;
}
