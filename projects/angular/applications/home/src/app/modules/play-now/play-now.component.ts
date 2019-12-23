import { Component } from '@angular/core';

import { environment } from '@env';

@Component({
  templateUrl: 'play-now.component.html',
  styleUrls: ['./play-now.component.scss'],
})
export class PlayNowComponent {
  public environment = environment;
}
