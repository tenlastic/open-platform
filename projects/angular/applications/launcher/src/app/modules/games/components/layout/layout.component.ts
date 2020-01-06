import { Component } from '@angular/core';

@Component({
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  public games = [{ _id: '1', icon: '/assets/images/logo.png', title: 'Nova' }];
}
