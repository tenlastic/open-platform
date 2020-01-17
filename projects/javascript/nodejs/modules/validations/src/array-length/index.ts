export const arrayLengthValidator = (length: number) => ({
  msg: `Array cannot contain more than ${length} elements.`,
  validator: (values: any[]) => values.length <= length,
});
