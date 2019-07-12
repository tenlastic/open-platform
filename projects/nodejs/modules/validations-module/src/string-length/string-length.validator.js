"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringLengthValidator = (min, max) => {
    const minMsg = min === 0 ? '' : ` less than ${min}`;
    const maxMsg = max === 0 ? '' : ` more than ${max}`;
    const andMsg = minMsg && maxMsg ? ' and' : '';
    const msg = `Value cannot contain${minMsg}${andMsg}${maxMsg} characters.`;
    return {
        msg,
        validator: (value) => (min === 0 || value.length >= min) && (max === 0 || value.length <= max),
    };
};
//# sourceMappingURL=string-length.validator.js.map