import { SES } from "@tenlastic/aws-module";
import * as awsLambda from "aws-lambda";

import { EMAIL_COMPANY } from "../../common";

export function handler(event: awsLambda.SNSEvent) {
  const { email } = JSON.parse(event.Records[0].Sns.Message);

  const input = {
    body: `
      Congratulations! Your account has been activated. You may now log in to Nova at any time.
      <br><br>
      Thank you,
      <br>
      ${EMAIL_COMPANY}
    `,
    subject: "Account Activated",
    to: [email],
  };

  const ses = new SES();
  return ses.sendEmail(input);
}
