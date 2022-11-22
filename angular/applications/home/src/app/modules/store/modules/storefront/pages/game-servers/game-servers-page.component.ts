import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import {
  GameServerModel,
  GameServerQuery,
  GameServerService,
  GroupModel,
  GroupQuery,
} from '@tenlastic/http';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { ExecutableService, IdentityService, UpdateService } from '../../../../../../core/services';

@Component({
  styleUrls: ['./game-servers-page.component.scss'],
  templateUrl: 'game-servers-page.component.html',
})
export class GameServersPageComponent implements OnInit {
  public $gameServers: Observable<GameServerModel[]>;
  public $group: Observable<GroupModel>;
  public displayedColumns = ['name', 'description', 'currentUsers', 'actions'];
  public get isRunning() {
    return this.executableService.isRunning(this.params.namespaceId);
  }
  public get status() {
    return this.params ? this.updateService.getStatus(this.params.namespaceId) : null;
  }

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private executableService: ExecutableService,
    private gameServerQuery: GameServerQuery,
    private gameServerService: GameServerService,
    private groupQuery: GroupQuery,
    private identityService: IdentityService,
    private updateService: UpdateService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      this.$gameServers = this.gameServerQuery.selectAll({
        filterBy: (gs) =>
          gs.namespaceId === params.namespaceId &&
          !gs.queueId &&
          gs.status &&
          gs.status.phase === 'Running',
      });
      this.$group = this.groupQuery
        .selectAll({ filterBy: (g) => g.userIds.includes(this.identityService.user._id) })
        .pipe(map((groups) => groups[0]));

      await this.gameServerService.find(params.namespaceId, {
        where: { 'metadata.matchId': { $exists: false } },
      });
    });
  }

  public async joinAsGroup(gameServer: GameServerModel) {
    const { entrypoint } = this.updateService.getStatus(this.params.namespaceId).build;
    const group = await this.$group.pipe(first()).toPromise();
    const { namespaceId } = this.params;

    this.executableService.start(entrypoint, namespaceId, { gameServer, groupId: group._id });
  }

  public joinAsIndividual(gameServer: GameServerModel) {
    const { entrypoint } = this.updateService.getStatus(this.params.namespaceId).build;
    this.executableService.start(entrypoint, this.params.namespaceId, { gameServer });
  }
}
