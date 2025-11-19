import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticleModel, ArticleService, ArticleState } from '@tenlastic/http';
import { Observable } from 'rxjs';

@Component({
  standalone: false,
  styleUrls: ['./view-page.component.scss'],
  templateUrl: 'view-page.component.html',
})
export class ViewPageComponent implements OnInit {
  public $article: Observable<ArticleModel>;
  public loadingMessage: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleState: ArticleState,
    private articleService: ArticleService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.loadingMessage = 'Loading Article...';

      this.$article = this.articleState.selectOne(params.articleId);
      await this.articleService.findOne(params.namespaceId, params.articleId);

      this.loadingMessage = null;
    });
  }
}
