export const decrementalValidator = (field: string) => {
  return {
    msg: `Value cannot be decreased.`,
    validator(value: number) {
      if (this._original && value) {
        const originalValue = this._original[field] || 0;
        return value >= originalValue;
      } else {
        return true;
      }
    },
  };
};
