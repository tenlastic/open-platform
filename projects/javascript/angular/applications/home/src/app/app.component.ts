import { Title } from '@angular/platform-browser';
import { Component } from '@angular/core';

import { TITLE } from './shared/constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor(private titleService: Title) {
    this.titleService.setTitle(TITLE);
  }
}
