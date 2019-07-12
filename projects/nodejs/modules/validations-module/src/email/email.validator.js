"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailValidator = {
    msg: 'Value must be a valid email address',
    validator: (value) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/.test(value),
};
//# sourceMappingURL=email.validator.js.map