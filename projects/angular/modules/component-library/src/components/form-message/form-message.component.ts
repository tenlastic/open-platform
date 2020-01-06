import { Component, Input } from '@angular/core';

@Component({
  selector: 'ten-form-message',
  styleUrls: ['./form-message.component.scss'],
  templateUrl: './form-message.component.html',
})
export class FormMessageComponent {
  @Input() public level = 'info';
}
