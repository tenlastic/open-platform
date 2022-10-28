import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService, IArticle } from '@tenlastic/http';

@Component({
  styleUrls: ['./list-page.component.scss'],
  templateUrl: 'list-page.component.html',
})
export class ListPageComponent implements OnInit {
  public loadingMessage: string;

  private type: IArticle.Type;

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleService: ArticleService,
    private router: Router,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.data.subscribe((data) => (this.type = data.type));
    this.activatedRoute.params.subscribe(async (params) => {
      this.loadingMessage = 'Loading Article...';

      const [article] = await this.articleService.find(params.namespaceId, {
        sort: '-publishedAt',
        where: {
          namespaceId: params.namespaceId,
          publishedAt: { $exists: true, $ne: null },
          type: this.type,
        },
      });
      this.router.navigate([article._id], { relativeTo: this.activatedRoute });

      this.loadingMessage = null;
    });
  }
}
