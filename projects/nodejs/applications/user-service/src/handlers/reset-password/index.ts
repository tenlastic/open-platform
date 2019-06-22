import { HttpContext, HttpEvent, HttpResult } from "@tenlastic/api-module";
import * as mongoose from "mongoose";

import { User } from "../../models";
import { app } from "../../";

export async function controller(evt: HttpEvent, ctx: HttpContext, res: HttpResult) {
  const { email } = evt.body;
  let user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found.");
  }

  user.resetHash = mongoose.Types.ObjectId();
  user = await user.save();

  res.statusCode = 204;
}

app.use(controller);

export const handler = app.listen();
