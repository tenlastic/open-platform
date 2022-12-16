import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  BuildQuery,
  BuildService,
  GameServerTemplateModel,
  GameServerTemplateQuery,
  GameServerTemplateService,
  IAuthorization,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class GameServerTemplatesListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<GameServerTemplateModel>;

  public dataSource = new MatTableDataSource<GameServerTemplateModel>();
  public displayedColumns = ['name', 'description', 'build', 'actions'];
  public hasWriteAuthorization: boolean;
  public get queueId() {
    return this.params?.queueId;
  }

  private $gameServerTemplates: Observable<GameServerTemplateModel[]>;
  private updateDataSource$ = new Subscription();
  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private buildQuery: BuildQuery,
    private buildService: BuildService,
    private gameServerTemplateQuery: GameServerTemplateQuery,
    private gameServerTemplateService: GameServerTemplateService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private router: Router,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.params = params;

      const roles = [IAuthorization.Role.GameServersReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.fetchGameServerTemplates(params);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getBuild(_id: string) {
    return this.buildQuery.getEntity(_id);
  }

  public navigateToGameServerForm($event: Event, record: GameServerTemplateModel) {
    $event.stopPropagation();

    this.router.navigate(['../', 'game-servers', 'new'], {
      relativeTo: this.activatedRoute,
      state: { gameServerTemplate: new GameServerTemplateModel(record) },
    });
  }

  public showDeletePrompt($event: Event, record: GameServerTemplateModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Game Server Template?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.gameServerTemplateService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Game Server Template deleted successfully.');
      }
    });
  }

  private async fetchGameServerTemplates(params: Params) {
    this.$gameServerTemplates = this.gameServerTemplateQuery.selectAll({
      filterBy: (gst) => gst.namespaceId === params.namespaceId,
    });

    this.updateDataSource$ = this.$gameServerTemplates.subscribe(
      (gameServerTemplates) => (this.dataSource.data = gameServerTemplates),
    );

    this.dataSource.filterPredicate = (data: GameServerTemplateModel, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      return regex.test(data.description) || regex.test(data.name);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    const gameServerTemplates = await this.gameServerTemplateService.find(params.namespaceId, {
      sort: 'name',
    });
    await this.buildService.find(params.namespaceId, {
      where: { _id: { $in: gameServerTemplates.map((gs) => gs.buildId) } },
    });
  }
}
