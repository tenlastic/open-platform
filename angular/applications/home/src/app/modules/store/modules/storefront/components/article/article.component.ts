import { Component, Input } from '@angular/core';
import { ArticleModel } from '@tenlastic/http';

@Component({
  selector: 'app-article',
  styleUrls: ['./article.component.scss'],
  templateUrl: 'article.component.html',
})
export class ArticleComponent {
  @Input() public article: ArticleModel;
}
