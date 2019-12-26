import { Component } from '@angular/core';
import { UserService } from '@tenlastic/ng-http';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  constructor(public userService: UserService) {}
}
