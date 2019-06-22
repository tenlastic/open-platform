import { HttpContext, HttpEvent, HttpResult, RestController } from "@tenlastic/api-module";

import { User, UserDocument, UserModel, UserPermissions } from "../../models";
import { app } from "../../";

export async function controller(evt: HttpEvent, ctx: HttpContext, res: HttpResult) {
  const restController = new RestController<UserDocument, UserModel, UserPermissions>(User, new UserPermissions());
  const result = await restController.create(evt.body, {}, evt.user);

  res.body = { record: result };
}

app.use(controller);

export const handler = app.listen();
