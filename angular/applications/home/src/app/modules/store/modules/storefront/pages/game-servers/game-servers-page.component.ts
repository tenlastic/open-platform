import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import {
  GameServerModel,
  GameServerQuery,
  GameServerService,
  GroupModel,
  GroupQuery,
} from '@tenlastic/ng-http';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { IdentityService, UpdateService } from '../../../../../../core/services';

@Component({
  styleUrls: ['./game-servers-page.component.scss'],
  templateUrl: 'game-servers-page.component.html',
})
export class GameServersPageComponent implements OnInit {
  public $gameServers: Observable<GameServerModel[]>;
  public $group: Observable<GroupModel>;
  public displayedColumns = ['name', 'description', 'currentUsers', 'actions'];
  public get status() {
    return this.params ? this.updateService.getStatus(this.params.namespaceId) : null;
  }

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
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
    const group = await this.$group.pipe(first()).toPromise();
    this.updateService.play(this.params.namespaceId, { gameServer, groupId: group._id });
  }

  public joinAsIndividual(gameServer: GameServerModel) {
    this.updateService.play(this.params.namespaceId, { gameServer });
  }
}
