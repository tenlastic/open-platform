import { HttpContext, HttpEvent, HttpResult, RestController } from "@tenlastic/api-module";

import { User, UserDocument, UserModel, UserPermissions } from "../../models";
import { app } from "../../";

export async function controller(evt: HttpEvent, ctx: HttpContext, res: HttpResult) {
  const restController = new RestController<UserDocument, UserModel, UserPermissions>(User, new UserPermissions());
  const result = await restController.find(evt.queryStringParameters, evt.user);

  res.body = { records: result };
}

app.use(controller);

export const handler = app.listen();
