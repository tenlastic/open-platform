interface Validator {
  msg: string;
  validator: (...args: any[]) => boolean;
}

export const arrayValidator = (validator: Validator) => {
  return {
    msg: validator.msg,
    validator: (values: string[]) => {
      for (const value of values) {
        if (!validator.validator(value)) {
          return false;
        }
      }

      return true;
    }
  };
};
