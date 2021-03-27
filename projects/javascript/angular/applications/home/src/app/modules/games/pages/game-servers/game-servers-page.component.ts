import { Component, OnInit } from '@angular/core';
import {
  Game,
  GameQuery,
  GameServer,
  GameServerQuery,
  GameServerService,
  Group,
  GroupQuery,
} from '@tenlastic/ng-http';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { IdentityService, UpdateService } from '../../../../core/services';

@Component({
  styleUrls: ['./game-servers-page.component.scss'],
  templateUrl: 'game-servers-page.component.html',
})
export class GameServersPageComponent implements OnInit {
  public $gameServers: Observable<GameServer[]>;
  public $group: Observable<Group>;
  public displayedColumns = ['name', 'description', 'status', 'currentUsers', 'actions'];
  public get status() {
    return this.updateService.getStatus(this.gameQuery.getActiveId());
  }

  constructor(
    private gameQuery: GameQuery,
    private gameServerQuery: GameServerQuery,
    private gameServerService: GameServerService,
    private groupQuery: GroupQuery,
    public identityService: IdentityService,
    private updateService: UpdateService,
  ) {}

  public async ngOnInit() {
    const game = this.gameQuery.getActive() as Game;
    this.$gameServers = this.gameServerQuery.selectAll({
      filterBy: gs =>
        gs.namespaceId === game.namespaceId &&
        !gs.queueId &&
        gs.status &&
        gs.status.phase === 'Running',
    });
    this.$group = this.groupQuery
      .selectAll({ filterBy: g => g.userIds.includes(this.identityService.user._id) })
      .pipe(map(groups => groups[0]));

    await this.gameServerService.find({
      where: {
        namespaceId: game.namespaceId,
        'metadata.matchId': { $exists: false },
      },
    });
  }

  public async joinAsGroup(gameServer: GameServer) {
    const group = await this.$group.pipe(take(1)).toPromise();
    this.updateService.play(this.gameQuery.getActiveId(), {
      gameServer,
      groupId: group._id,
    });
  }

  public joinAsIndividual(gameServer: GameServer) {
    this.updateService.play(this.gameQuery.getActiveId(), { gameServer });
  }
}
