import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-message',
  standalone: false,
  styleUrls: ['./form-message.component.scss'],
  templateUrl: './form-message.component.html',
})
export class FormMessageComponent {
  @Input() public level = 'info';
}
