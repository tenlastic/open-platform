import { HttpContext, HttpEvent, HttpResult } from "@tenlastic/api-module";
import * as jwt from "jsonwebtoken";

import { logIn } from "../../common";
import { User } from "../../models";
import { app } from "../../";

export async function controller(evt: HttpEvent, ctx: HttpContext, res: HttpResult) {
  const { token } = evt.body;

  if (!token) {
    throw new Error("Please provide a refresh token.");
  }

  const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findOne({ _id: decoded.user._id });

  if (!user) {
    throw new Error("Invalid refresh token.");
  }

  res.body = await logIn(user);
}

app.use(controller);

export const handler = app.listen();
