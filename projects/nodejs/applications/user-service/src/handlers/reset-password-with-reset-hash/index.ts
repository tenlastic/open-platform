import { HttpContext, HttpEvent, HttpResult } from "@tenlastic/api-module";

import { User } from "../../models";
import { app } from "../../";

export async function controller(evt: HttpEvent, ctx: HttpContext, res: HttpResult) {
  const { password, resetHash } = evt.body;

  if (!resetHash || !password) {
    throw new Error("Invalid reset hash or password.");
  }

  const user = await User.findOne({ resetHash });

  if (!user) {
    throw new Error("Invalid reset hash.");
  }

  user.password = password;
  user.resetHash = null;
  await user.save();

  if (!user) {
    throw new Error("User not found.");
  }

  res.statusCode = 204;
}

app.use(controller);

export const handler = app.listen();
