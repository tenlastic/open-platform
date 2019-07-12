"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlValidator = {
    msg: 'Value is not a valid URL.',
    validator: (value) => /^(?:http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/.test(value),
};
//# sourceMappingURL=url.validator.js.map