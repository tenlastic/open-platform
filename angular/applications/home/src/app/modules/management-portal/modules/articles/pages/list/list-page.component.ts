import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import {
  ArticleModel,
  ArticleService,
  ArticleState,
  AuthorizationState,
  IArticle,
  IAuthorization,
  WebSocketService,
} from '@tenlastic/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { formatDate } from '@angular/common';
import { IdentityService, OverlayService } from '@home/app/core/services';
import {
  DeletionOverlayComponent,
  DeletionOverlayComponentData,
  ListTableColumn,
  ListTableSubscription,
} from '@home/app/shared/components';
import { environment } from '@home/environments/environment';

@Component({
  standalone: false,
  styleUrls: ['./list-page.component.scss'],
  templateUrl: 'list-page.component.html',
})
export class ArticlesListPageComponent implements OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<ArticleModel[]>;
  public $refresh = new Subject<void>();
  public columns: ListTableColumn<ArticleModel>[] = [
    { header: 'Title', text: (v) => v.title },
    {
      header: 'Published At',
      text: (v) =>
        v.publishedAt ? formatDate(v.publishedAt, "MMM d, y 'at' h:mm a", 'en-US') : '',
    },
    { header: 'Created At', text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US') },
    { header: 'Updated At', text: (v) => formatDate(v.updatedAt, "MMM d, y 'at' h:mm a", 'en-US') },
  ];
  public hasWriteAuthorization = false;
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
  public subscriptions: ListTableSubscription[] = [
    {
      Model: ArticleModel,
      request: { _id: uuid(), path: `/subscriptions/articles` },
      service: this.articleService,
    },
  ];
  public get webSocket() {
    return this.webSocketService.webSockets.find(
      (ws) => `${environment.wssUrl}/namespaces/${this.namespaceId}` === ws.url,
    );
  }

  private namespaceId: string;
  private type: IArticle.Type;
  private get where() {
    const where: any = {
      namespaceId: this.namespaceId,
      type: this.type,
    };

    if (this.$filter.value) {
      where.title = { $regex: this.$filter.value, $options: 'i' };
    }

    return where;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleState: ArticleState,
    private articleService: ArticleService,
    private authorizationState: AuthorizationState,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private overlayService: OverlayService,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    this.$records = this.articleState.selectMany();

    this.activatedRoute.data.subscribe((data) => (this.type = data.type));

    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      const roles = [IAuthorization.Role.ArticlesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(this.namespaceId, roles, userId);

      this.$refresh.next();
    });
  }

  public count = () => {
    return this.articleService.count(this.namespaceId, { where: this.where });
  };

  public filter = (record: ArticleModel) => {
    if (this.namespaceId !== record.namespaceId) {
      return false;
    }

    if (this.type !== record.type) {
      return false;
    }

    if (!this.$filter.value) {
      return true;
    }

    const regex = new RegExp(this.$filter.value, 'i');
    return regex.test(record.title) || regex.test(record.type);
  };

  public find = async (page: number, pageSize: number) => {
    const records = await this.articleService.find(this.namespaceId, {
      limit: pageSize,
      skip: page * pageSize,
      sort: '-createdAt',
      where: this.where,
    });

    const _ids = records.map((r) => r._id);
    this.subscriptions[0].request.body = { where: { _id: { $in: _ids } } };

    return records;
  };

  public navigate = (record: ArticleModel) => {
    return [record._id];
  };

  public async publish($event: Event, article: ArticleModel) {
    $event.stopPropagation();

    await this.articleService.update(article.namespaceId, article._id, {
      ...article,
      publishedAt: new Date(),
    });

    this.matSnackBar.open('Article published successfully.');
  }

  public setFilter(value: string) {
    this.$filter.next(value);
    this.$refresh.next();
  }

  public showDeletePrompt($event: Event, record: ArticleModel) {
    $event.stopPropagation();
    this.overlayService.open<DeletionOverlayComponentData>(DeletionOverlayComponent, {
      delete: () => this.articleService.delete(record.namespaceId, record._id),
      name: 'Article',
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
}
