import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ten-button',
  styleUrls: ['./button.component.scss'],
  templateUrl: './button.component.html',
})
export class ButtonComponent {
  @Input() public color = 'primary';
  @Input() public disabled: boolean;
  @Input() public href: string;
  @Input() public layout = 'horizontal';
  @Input() public target: string;
  @Output() public OnClick = new EventEmitter();
}
