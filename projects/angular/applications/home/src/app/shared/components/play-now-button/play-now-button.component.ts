import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-play-now-button',
  styleUrls: ['play-now-button.component.scss'],
  templateUrl: 'play-now-button.component.html',
})
export class PlayNowButtonComponent {
  public environment = environment;

  constructor(private router: Router) {}
}
