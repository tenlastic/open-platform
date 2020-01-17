import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-toggle-section',
  styleUrls: ['./toggle-section.component.scss'],
  templateUrl: 'toggle-section.component.html',
})
export class ToggleSectionComponent {
  @Input() public isVisible = true;
  @Input() public title: string;

  public toggle() {
    this.isVisible = !this.isVisible;
  }
}
