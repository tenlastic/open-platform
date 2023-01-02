import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable()
export class DefaultTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  public override updateTitle(routerState: RouterStateSnapshot): void {
    const title = this.buildTitle(routerState);

    if (title !== undefined) {
      this.title.setTitle(`${title} | Tenlastic`);
    } else {
      this.title.setTitle('Tenlastic');
    }
  }
}
