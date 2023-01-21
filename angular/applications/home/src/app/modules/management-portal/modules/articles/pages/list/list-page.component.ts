import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import {
  ArticleModel,
  ArticleQuery,
  ArticleService,
  AuthorizationQuery,
  IArticle,
  IAuthorization,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class ArticlesListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  public dataSource = new MatTableDataSource<ArticleModel>();
  public get displayedColumns() {
    return this.type
      ? ['title', 'publishedAt', 'createdAt', 'actions']
      : ['type', 'title', 'publishedAt', 'createdAt', 'actions'];
  }
  public hasWriteAuthorization: boolean;
  public message: string;
  public get plural() {
    switch (this.type) {
      case IArticle.Type.Guide:
        return 'Guides';
      case IArticle.Type.News:
        return 'News';
      case IArticle.Type.PatchNotes:
        return 'Patch Notes';
      default:
        return 'Articles';
    }
  }
  public get singular() {
    switch (this.type) {
      case IArticle.Type.Guide:
        return 'Guide';
      case IArticle.Type.News:
        return 'News';
      case IArticle.Type.PatchNotes:
        return 'Patch Notes';
      default:
        return 'Article';
    }
  }

  private $articles: Observable<ArticleModel[]>;
  private type: IArticle.Type;
  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleQuery: ArticleQuery,
    private articleService: ArticleService,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
  ) {}

  public ngOnInit() {
    this.activatedRoute.data.subscribe((data) => (this.type = data.type));

    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';

      const roles = [IAuthorization.Role.ArticlesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      await this.fetchArticles(params);

      this.message = null;
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public async publish($event: Event, article: ArticleModel) {
    $event.stopPropagation();

    await this.articleService.update(article.namespaceId, article._id, {
      ...article,
      publishedAt: new Date(),
    });

    this.matSnackBar.open('Article published successfully.');
  }

  public showDeletePrompt($event: Event, record: ArticleModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Article?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.articleService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Article deleted successfully.');
      }
    });
  }

  public async unpublish($event: Event, article: ArticleModel) {
    $event.stopPropagation();

    await this.articleService.update(article.namespaceId, article._id, {
      ...article,
      publishedAt: null,
    });

    this.matSnackBar.open('Article unpublished successfully.');
  }

  private async fetchArticles(params: Params) {
    this.$articles = this.articleQuery.selectAll({
      filterBy: (article) =>
        article.namespaceId === params.namespaceId && article.type === this.type,
    });

    await this.articleService.find(params.namespaceId, {
      sort: '-createdAt',
      where: { namespaceId: params.namespaceId, type: this.type },
    });

    this.updateDataSource$ = this.$articles.subscribe(
      (articles) => (this.dataSource.data = articles),
    );

    this.dataSource.filterPredicate = (data: ArticleModel, filter: string) => {
      filter = filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

      const regex = new RegExp(filter, 'i');
      const exactRegex = new RegExp(`^${filter}$`, 'i');

      const published = data.publishedAt ? 'Published' : 'Unpublished';

      return regex.test(data.title) || regex.test(data.type) || exactRegex.test(published);
    };
  }
}
