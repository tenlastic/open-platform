import { Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SideMenuItem =
  | {
      href?: string;
      icon?: string;
      image?: string;
      label?: string;
      target?: '_blank';
      type: 'a';
    }
  | {
      icon?: string;
      iconSet?: 'material-icons-outlined';
      image?: string;
      label?: string;
      routerLink?: string;
      routerLinkOptions?: { exact: boolean };
      type: 'button';
    }
  | {
      type: 'hr';
    };

export type SideMenuItemType = 'a' | 'button' | 'hr';

@Injectable({ providedIn: 'root' })
export class SideMenuService {
  public $items = new BehaviorSubject<TemplateRef<unknown>[]>([]);
  public $visible = new BehaviorSubject(false);
  public items: TemplateRef<unknown>[] = [];
  public visible = false;

  public add(value: TemplateRef<unknown>) {
    this.items.push(value);
    this.$items.next(this.items);
  }

  public hide() {
    this.visible = false;
    this.$visible.next(this.visible);
  }

  public remove(value: TemplateRef<unknown>) {
    const index = this.items.indexOf(value);
    if (index < 0) {
      return;
    }

    this.items.splice(index, 1);
    this.$items.next(this.items);
  }

  public show() {
    this.visible = true;
    this.$visible.next(this.visible);
  }
}
