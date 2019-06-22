import { HttpContextMock, HttpEventMock, HttpResultMock } from "@tenlastic/api-module";
import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";

import { UserMock, UserDocument } from "../../models";
import { controller } from ".";

use(chaiAsPromised);

describe("log-in-with-credentials", function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create({ isActive: true, password: "password" });
  });

  context("when credentials are correct", function() {
    it("returns the refresh token, token, and user", async function() {
      const ctx = new HttpContextMock();
      const evt = new HttpEventMock({
        body: {
          email: user.email,
          password: "password"
        }
      });
      const res = new HttpResultMock();

      await controller(evt, ctx, res);

      expect(res.body.accessToken).to.exist;
      expect(res.body.refreshToken).to.exist;
      expect(res.body.user).to.exist;
    });
  });

  context("when credentials are incorrect", function() {
    it("returns an error message", function() {
      const ctx = new HttpContextMock();
      const evt = new HttpEventMock({
        body: {
          email: user.email,
          password: "wrong"
        }
      });
      const res = new HttpResultMock();

      const promise = controller(evt, ctx, res);

      return expect(promise).to.be.rejectedWith("Invalid email address or password.");
    });
  });
});
