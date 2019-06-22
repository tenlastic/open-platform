export const regexValidator = (regex: RegExp) => ({
  msg: `Value must match the following format: ${regex.toString()}.`,
  validator: (value: string) => regex.test(value),
});
