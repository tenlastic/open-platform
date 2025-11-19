import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: false,
  styleUrls: ['./button.component.scss'],
  templateUrl: './button.component.html',
})
export class ButtonComponent {
  @Input() public color = 'primary';
  @Input() public disabled: boolean;
  @Input() public form: string;
  @Input() public href: string;
  @Input() public layout: 'horizontal' | 'vertical' = 'horizontal';
  @Input() public size: string;
  @Input() public target: string;
  @Output() public OnClick = new EventEmitter();
}
