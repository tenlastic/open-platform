import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'ten-system-toolbar',
  styleUrls: ['./system-toolbar.component.scss'],
  templateUrl: './system-toolbar.component.html',
})
export class SystemToolbarComponent {
  @Output() public OnClose = new EventEmitter();
  @Output() public OnMaximize = new EventEmitter();
  @Output() public OnMinimize = new EventEmitter();
}
