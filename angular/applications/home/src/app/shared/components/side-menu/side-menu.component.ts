import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SideMenuService } from '../../../core/services';

@Component({
  selector: 'app-side-menu',
  standalone: false,
  styleUrls: ['./side-menu.component.scss'],
  templateUrl: './side-menu.component.html',
})
export class SideMenuComponent implements OnDestroy, OnInit {
  public get $items() {
    return this.sideMenuService.$items;
  }
  public get $visible() {
    return this.sideMenuService.$visible;
  }

  private subscription: Subscription;

  constructor(private router: Router, private sideMenuService: SideMenuService) {}

  public ngOnInit() {
    this.subscription = this.router.events.subscribe((e) => {
      this.sideMenuService.hide();
    });
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  public hide() {
    setTimeout(() => this.sideMenuService.hide(), 0);
  }

  public show() {
    setTimeout(() => this.sideMenuService.show(), 0);
  }
}
