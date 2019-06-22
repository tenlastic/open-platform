export const urlValidator = {
  msg: 'Value is not a valid URL.',
  validator: (value: string) =>
    /^(?:http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/.test(value),
};
