import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class FormResolver implements Resolve<string> {
  public resolve(activatedRoute: ActivatedRouteSnapshot) {
    const { param, title } = activatedRoute.data;
    return activatedRoute.params[param] === 'new' ? `New ${title}` : `Edit ${title}`;
  }
}
