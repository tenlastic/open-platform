import { Component, OnInit } from '@angular/core';
import {
  GameServer,
  GameServerQuery,
  GameServerService,
  Group,
  GroupQuery,
  Storefront,
  StorefrontQuery,
} from '@tenlastic/ng-http';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { IdentityService, UpdateService } from '../../../../core/services';

@Component({
  styleUrls: ['./game-servers-page.component.scss'],
  templateUrl: 'game-servers-page.component.html',
})
export class GameServersPageComponent implements OnInit {
  public $gameServers: Observable<GameServer[]>;
  public $group: Observable<Group>;
  public displayedColumns = ['name', 'description', 'currentUsers', 'actions'];
  public get status() {
    const activeStorefront = this.storefrontQuery.getActive() as Storefront;
    return this.updateService.getStatus(activeStorefront.namespaceId);
  }

  constructor(
    private gameServerQuery: GameServerQuery,
    private gameServerService: GameServerService,
    private groupQuery: GroupQuery,
    private identityService: IdentityService,
    private storefrontQuery: StorefrontQuery,
    private updateService: UpdateService,
  ) {}

  public async ngOnInit() {
    const storefront = this.storefrontQuery.getActive() as Storefront;
    this.$gameServers = this.gameServerQuery.selectAll({
      filterBy: (gs) =>
        gs.namespaceId === storefront.namespaceId &&
        !gs.queueId &&
        gs.status &&
        gs.status.phase === 'Running',
    });
    this.$group = this.groupQuery
      .selectAll({ filterBy: (g) => g.userIds.includes(this.identityService.user._id) })
      .pipe(map((groups) => groups[0]));

    await this.gameServerService.find({
      where: {
        namespaceId: storefront.namespaceId,
        'metadata.matchId': { $exists: false },
      },
    });
  }

  public async joinAsGroup(gameServer: GameServer) {
    const group = await this.$group.pipe(first()).toPromise();
    this.updateService.play(this.storefrontQuery.getActiveId(), {
      gameServer,
      groupId: group._id,
    });
  }

  public joinAsIndividual(gameServer: GameServer) {
    this.updateService.play(this.storefrontQuery.getActiveId(), { gameServer });
  }
}
