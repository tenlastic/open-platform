import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import {
  GameServerModel,
  GameServerService,
  GameServerState,
  GroupModel,
  GroupState,
} from '@tenlastic/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ExecutableService, IdentityService, UpdateService } from '../../../../../../core/services';

@Component({
  standalone: false,
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
    private gameServerState: GameServerState,
    private gameServerService: GameServerService,
    private groupState: GroupState,
    private identityService: IdentityService,
    private updateService: UpdateService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      this.$gameServers = this.gameServerState
        .selectMany()
        .pipe(
          map((gss) =>
            gss.filter(
              (gs) =>
                !gs.matchId &&
                gs.namespaceId === params.namespaceId &&
                !gs.queueId &&
                gs.status &&
                gs.status.phase === 'Running',
            ),
          ),
        );
      this.$group = this.groupState
        .selectMany()
        .pipe(
          map((gs) =>
            gs.filter((g) => g.userIds?.some((ui) => this.identityService.user._id === ui)),
          ),
        )
        .pipe(map((gs) => gs[0]));

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
