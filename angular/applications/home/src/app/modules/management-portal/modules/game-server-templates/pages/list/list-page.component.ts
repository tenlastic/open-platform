import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationState,
  BuildService,
  BuildState,
  GameServerTemplateModel,
  GameServerTemplateService,
  GameServerTemplateState,
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
export class GameServerTemplatesListPageComponent implements OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<GameServerTemplateModel[]>;
  public $refresh = new Subject<void>();
  public columns: ListTableColumn<GameServerTemplateModel>[] = [
    { header: 'Name', text: (v) => v.name },
    { header: 'Build', text: (v) => this.getBuild(v.buildId)?.name },
    { header: 'Description', text: (v) => v.description },
    { header: 'Created At', text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US') },
    { header: 'Updated At', text: (v) => formatDate(v.updatedAt, "MMM d, y 'at' h:mm a", 'en-US') },
  ];
  public hasWriteAuthorization = false;
  public queueId: string;
  public subscriptions: ListTableSubscription[] = [
    {
      Model: GameServerTemplateModel,
      request: { _id: uuid(), path: `/subscriptions/game-server-templates` },
      service: this.gameServerTemplateService,
    },
  ];
  public get webSocket() {
    return this.webSocketService.webSockets.find(
      (ws) => `${environment.wssUrl}/namespaces/${this.namespaceId}` === ws.url,
    );
  }

  private namespaceId: string;
  private get where() {
    const where: any = { namespaceId: this.namespaceId };

    if (this.$filter.value) {
      where.$or = [
        { description: { $regex: this.$filter.value, $options: 'i' } },
        { name: { $regex: this.$filter.value, $options: 'i' } },
      ];
    }

    return where;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private buildState: BuildState,
    private buildService: BuildService,
    private gameServerTemplateState: GameServerTemplateState,
    private gameServerTemplateService: GameServerTemplateService,
    private identityService: IdentityService,
    private overlayService: OverlayService,
    private router: Router,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this.$records = this.gameServerTemplateState.selectMany();

    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;
      this.queueId = params.queueId;

      const roles = [IAuthorization.Role.GameServersWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(params.namespaceId, roles, userId);

      this.$refresh.next();
    });
  }

  public count = () => {
    return this.gameServerTemplateService.count(this.namespaceId, { where: this.where });
  };

  public filter = (record: GameServerTemplateModel) => {
    if (this.namespaceId !== record.namespaceId) {
      return false;
    }

    if (!this.$filter.value) {
      return true;
    }

    const regex = new RegExp(this.$filter.value, 'i');
    return regex.test(record.description) || regex.test(record.name);
  };

  public find = async (page: number, pageSize: number) => {
    const records = await this.gameServerTemplateService.find(this.namespaceId, {
      limit: pageSize,
      skip: page * pageSize,
      sort: 'name',
      where: this.where,
    });

    await this.buildService.find(this.namespaceId, {
      select: '-files -reference.files',
      where: { _id: { $in: records.map((gs) => gs.buildId) } },
    });

    const _ids = records.map((r) => r._id);
    this.subscriptions[0].request.body = { where: { _id: { $in: _ids } } };

    return records;
  };

  public navigate = (record: GameServerTemplateModel) => {
    return [record._id];
  };

  public navigateToGameServerForm($event: Event, record: GameServerTemplateModel) {
    $event.stopPropagation();

    this.router.navigate(['../', 'game-servers', 'new'], {
      relativeTo: this.activatedRoute,
      state: { gameServerTemplate: record },
    });
  }

  public setFilter(value: string) {
    this.$filter.next(value);
    this.$refresh.next();
  }

  public showDeletePrompt($event: Event, record: GameServerTemplateModel) {
    $event.stopPropagation();
    this.overlayService.open<DeletionOverlayComponentData>(DeletionOverlayComponent, {
      delete: () => this.gameServerTemplateService.delete(record.namespaceId, record._id),
      name: 'Game Server Template',
    });
  }

  private getBuild(_id: string) {
    return this.buildState.getOne(_id);
  }
}
