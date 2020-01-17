import { Component, Input } from '@angular/core';

@Component({
  selector: 'ten-markdown',
  styleUrls: ['./markdown.component.scss'],
  templateUrl: './markdown.component.html',
})
export class MarkdownComponent {
  @Input() public markdown: string;
}
