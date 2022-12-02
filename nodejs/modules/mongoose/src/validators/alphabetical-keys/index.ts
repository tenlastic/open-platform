export const alphabeticalKeysValidator = {
  msg: 'Keys can contain only letters.',
  validator: (value: any) => {
    const regex = /^[A-Za-z]+$/;

    if (value instanceof Map) {
      return Array.from(value.keys()).every((k) => regex.test(k));
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value).every((k) => regex.test(k));
    } else {
      return true;
    }
  },
};
