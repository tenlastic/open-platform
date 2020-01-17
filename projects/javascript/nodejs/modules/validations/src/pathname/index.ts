export const pathnameValidator = {
  msg: 'Value is limited to: letters, numbers, underscores, hyphens, spaces, and parentheses.',
  validator: (value: string) => /^[A-Za-z0-9_\-\s\(\)]+$/.test(value),
};
