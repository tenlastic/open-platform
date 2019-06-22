import { expect } from "chai";

import { stringLengthValidator } from "../";
import { arrayValidator } from "./array.validator";

describe("validators/array", function() {
  describe("validator", function() {
    it("returns true", function() {
      const { validator } = arrayValidator(stringLengthValidator(0, 5));
      const result = validator(["12345"]);

      expect(result).to.eql(true);
    });

    it("returns false", function() {
      const { validator } = arrayValidator(stringLengthValidator(0, 5));
      const result = validator(["12345", "123456"]);

      expect(result).to.eql(false);
    });
  });
});
