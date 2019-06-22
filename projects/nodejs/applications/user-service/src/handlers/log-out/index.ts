import { HttpContext, HttpEvent, HttpResult, authenticationMiddleware } from "@tenlastic/api-module";

import { app } from "../../";

export async function controller(evt: HttpEvent, ctx: HttpContext, res: HttpResult) {
  res.statusCode = 204;
}

app.use(authenticationMiddleware);
app.use(controller);

export const handler = app.listen();
