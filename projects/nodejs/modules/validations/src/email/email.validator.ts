export const emailValidator = {
  msg: 'Value must be a valid email address',
  validator: (value: string) =>
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/.test(value),
};
