export const excludeKeysValidator = (keys: string[]) => {
  const msg = `Value cannot include the following keys: ${keys.join(', ')}.`;

  return {
    msg,
    validator: (value: any) => {
      if (value instanceof Map) {
        return !Array.from(value.keys()).some((k) => keys.includes(k));
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        return !Object.keys(value).some((k) => keys.includes(k));
      } else {
        return true;
      }
    },
  };
};
