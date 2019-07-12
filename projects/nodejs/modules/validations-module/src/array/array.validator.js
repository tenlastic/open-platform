"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrayValidator = (validator) => {
    return {
        msg: validator.msg,
        validator: (values) => {
            for (const value of values) {
                if (!validator.validator(value)) {
                    return false;
                }
            }
            return true;
        },
    };
};
//# sourceMappingURL=array.validator.js.map