import { HttpContextMock, HttpEventMock, HttpResultMock } from "@tenlastic/api-module";
import { expect } from "chai";
import * as Chance from "chance";

import { UserMock, UserDocument } from "../../models";
import { controller } from ".";

const chance = new Chance();

describe("update", function() {
  let record: UserDocument;
  let user: any;

  beforeEach(async function() {
    record = await UserMock.create();
    user = { level: 1 };
  });

  it("updates an existing record", async function() {
    const ctx = new HttpContextMock();
    const evt = new HttpEventMock({
      body: {
        email: chance.email(),
        level: user.level + 1
      },
      pathParameters: { id: record.id },
      user
    });
    const res = new HttpResultMock();

    await controller(evt, ctx, res);

    expect(res.body.record).to.exist;
  });
});
