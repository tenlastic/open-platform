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
import { map } from 'rxjs/operators';

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
          !gs.matchId &&
          gs.namespaceId === params.namespaceId &&
          !gs.queueId &&
          gs.status &&
          gs.status.phase === 'Running',
      });
      this.$group = this.groupQuery
        .selectAll({
          filterBy: (g) => g.members?.some((m) => m.userId === this.identityService.user._id),
        })
        .pipe(map((groups) => groups[0]));

      await this.gameServerService.find(params.namespaceId, {
        where: { 'metadata.matchId': null },
      });
    });
  }

  public async join(gameServer: GameServerModel, group: GroupModel) {
    const { entrypoint } = this.updateService.getStatus(this.params.namespaceId).build;
    const { namespaceId } = this.params;

    this.executableService.start(entrypoint, namespaceId, { gameServer, groupId: group?._id });
  }
}
