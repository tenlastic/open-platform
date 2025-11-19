import { Component, Output } from '@angular/core';
import { EventEmitter } from 'stream';

@Component({
  selector: 'app-dialog',
  standalone: false,
  styleUrls: ['./dialog.component.scss'],
  templateUrl: './dialog.component.html',
})
export class DialogComponent {
  @Output() public OnClose = new EventEmitter();
}
