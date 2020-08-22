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
    return this.updateService.getStatus(this.gameQuery.getActive() as Game);
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
    this.$gameServers = this.gameServerQuery.selectAll({
      filterBy: gs => gs.gameId === this.gameQuery.getActiveId() && !gs.queueId,
    });
    this.$group = this.groupQuery
      .selectAll({ filterBy: g => g.userIds.includes(this.identityService.user._id) })
      .pipe(map(groups => groups[0]));

    await this.gameServerService.find({
      where: {
        gameId: this.gameQuery.getActiveId(),
        'metadata.matchId': { $exists: false },
      },
    });
  }

  public async joinAsGroup(gameServer: GameServer) {
    const group = await this.$group.pipe(take(1)).toPromise();
    this.updateService.play(this.gameQuery.getActive() as Game, {
      gameServer,
      groupId: group._id,
    });
  }

  public joinAsIndividual(gameServer: GameServer) {
    this.updateService.play(this.gameQuery.getActive() as Game, { gameServer });
  }
}
