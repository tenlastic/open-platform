import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { Article, ArticleQuery, ArticleService } from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class ArticlesListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Article>;

  public $articles: Observable<Article[]>;
  public dataSource = new MatTableDataSource<Article>();
  public displayedColumns: string[] = [
    'game',
    'type',
    'title',
    'publishedAt',
    'createdAt',
    'actions',
  ];

  private updateDataSource$ = new Subscription();

  constructor(
    private articleQuery: ArticleQuery,
    private articleService: ArticleService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Articles`);
    this.fetchArticles();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public async publish(article: Article) {
    return this.articleService.update({ ...article, publishedAt: new Date() });
  }

  public showDeletePrompt(record: Article) {
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
        await this.articleService.delete(record._id);
        this.matSnackBar.open('Article deleted successfully.');
      }
    });
  }

  public async unpublish(article: Article) {
    return this.articleService.update({ ...article, publishedAt: null });
  }

  private async fetchArticles() {
    const $articles = this.articleQuery.selectAll({
      filterBy: (article) => article.namespaceId === this.selectedNamespaceService.namespaceId,
    });
    this.$articles = this.articleQuery.populate($articles);

    await this.articleService.find({
      sort: '-createdAt',
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.updateDataSource$ = this.$articles.subscribe(
      (articles) => (this.dataSource.data = articles),
    );

    this.dataSource.filterPredicate = (data: Article, filter: string) => {
      filter = filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

      const regex = new RegExp(filter, 'i');
      const exactRegex = new RegExp(`^${filter}$`, 'i');

      const published = data.publishedAt ? 'Published' : 'Unpublished';

      return regex.test(data.title) || regex.test(data.type) || exactRegex.test(published);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
