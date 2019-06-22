import { SES } from "@tenlastic/aws-module";
import { SNSEventMock } from "@tenlastic/api-module";
import { expect } from "chai";
import * as sinon from "sinon";

import { handler } from "./";

describe("handlers/password-reset", function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it("sends an email with expected parameters", async function() {
    const event = new SNSEventMock({ email: "test@example.com" });
    const spy = sandbox.stub(SES.prototype, "sendEmail").resolves();

    await handler(event);

    const args = spy.firstCall.args[0];
    expect(args.body).to.exist;
    expect(args.subject).to.eql("Password Reset");
    expect(args.to).to.eql(["test@example.com"]);
  });
});
