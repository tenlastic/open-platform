import { Component } from '@angular/core';

import { environment } from '@env/environment';

@Component({
  templateUrl: 'play-now.component.html',
  styleUrls: ['./play-now.component.scss']
})
export class PlayNowComponent {

  public environment = environment;

}
