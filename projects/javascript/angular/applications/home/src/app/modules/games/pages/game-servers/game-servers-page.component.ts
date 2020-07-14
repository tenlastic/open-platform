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
    this.$gameServers = this.gameServerQuery.selectAll();
    this.$group = this.groupQuery
      .selectAll({ filterBy: g => g.userIds.includes(this.identityService.user._id) })
      .pipe(map(groups => groups[0]));

    await this.gameServerService.find({ where: { gameId: this.gameQuery.getActiveId() } });
  }

  public getStatus(gameServer: GameServer) {
    if (!gameServer.heartbeatAt) {
      return 'Unavailable';
    }

    const date = new Date();
    date.setMinutes(date.getMinutes() - 1);

    return gameServer.heartbeatAt < date ? 'Unavailable' : 'Available';
  }

  public async joinAsGroup(gameServerId: string) {
    const group = await this.$group.pipe(take(1)).toPromise();
    this.updateService.play(this.gameQuery.getActive() as Game, {
      gameServerId,
      groupId: group._id,
    });
  }

  public joinAsIndividual(gameServerId: string) {
    this.updateService.play(this.gameQuery.getActive() as Game, { gameServerId });
  }
}