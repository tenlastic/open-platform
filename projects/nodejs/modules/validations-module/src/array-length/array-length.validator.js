"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrayLengthValidator = (length) => ({
    msg: `Array cannot contain more than ${length} elements.`,
    validator: (values) => values.length <= length,
});
//# sourceMappingURL=array-length.validator.js.map