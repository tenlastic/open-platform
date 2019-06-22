import { HttpContextMock, HttpEventMock, HttpResultMock } from "@tenlastic/api-module";
import { expect } from "chai";
import * as Chance from "chance";

import { UserMock, UserDocument } from "../../models";
import { controller } from ".";

const chance = new Chance();

describe("create", function() {
  let record: UserDocument;
  let user: any;

  beforeEach(async function() {
    record = await UserMock.create();
    user = { level: 1 };
  });

  it("creates a new record", async function() {
    const ctx = new HttpContextMock();
    const evt = new HttpEventMock({
      body: {
        email: chance.email(),
        password: chance.hash(),
        username: chance.hash({ length: 20 })
      },
      user
    });
    const res = new HttpResultMock();

    await controller(evt, ctx, res);

    expect(res.body.record).to.exist;
  });
});
