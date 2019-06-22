import { SES } from "@tenlastic/aws-module";
import * as awsLambda from "aws-lambda";

import { EMAIL_COMPANY } from "../../common";

export function handler(event: awsLambda.SNSEvent) {
  const { email, resetHash } = JSON.parse(event.Records[0].Sns.Message);

  const resetUrl = process.env.PASSWORD_RESET_URL + "/" + resetHash;
  const input = {
    body: `
      You have requested to reset your password. Please click the link below to create a new password:
      <br><br>
      <a href=${resetUrl}>${resetUrl}</a>
      <br><br>
      Thank you,
      <br>
      ${EMAIL_COMPANY}
    `,
    subject: "Password Reset",
    to: [email],
  };

  const ses = new SES();
  return ses.sendEmail(input);
}
