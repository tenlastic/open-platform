import { HttpContext, HttpEvent, HttpResult } from "@tenlastic/api-module";

import { logIn } from "../../common";
import { User } from "../../models";
import { app } from "../../";

export async function controller(evt: HttpEvent, ctx: HttpContext, res: HttpResult) {
  const { email, password } = evt.body;

  if (!email || !password) {
    throw new Error("Please provide an email address and password.");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !user.isValidPassword(password)) {
    throw new Error("Invalid email address or password.");
  }

  res.body = await logIn(user);
}

app.use(controller);

export const handler = app.listen();
