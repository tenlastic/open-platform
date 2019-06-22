import { HttpContext, HttpEvent, HttpResult } from "@tenlastic/api-module";

import { User } from "../../models";
import { app } from "../../";

export async function controller(evt: HttpEvent, ctx: HttpContext, res: HttpResult) {
  const { email, newPassword, password } = evt.body;

  if (!email) {
    throw new Error("Please provide an email address.");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new Error("User not found.");
  }

  if (!newPassword || !password || !user.isValidPassword(password)) {
    throw new Error("Invalid password.");
  }

  user.password = newPassword;
  await user.save();

  res.statusCode = 204;
}

app.use(controller);

export const handler = app.listen();
