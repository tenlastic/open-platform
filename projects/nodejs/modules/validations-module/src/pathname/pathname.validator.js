"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathnameValidator = {
    msg: 'Value is limited to: letters, numbers, underscores, hyphens, spaces, and parentheses.',
    validator: (value) => /^[A-Za-z0-9_\-\s\(\)]+$/.test(value),
};
//# sourceMappingURL=pathname.validator.js.map