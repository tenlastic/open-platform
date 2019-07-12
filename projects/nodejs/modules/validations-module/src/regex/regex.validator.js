"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regexValidator = (regex) => ({
    msg: `Value must match the following format: ${regex.toString()}.`,
    validator: (value) => regex.test(value),
});
//# sourceMappingURL=regex.validator.js.map