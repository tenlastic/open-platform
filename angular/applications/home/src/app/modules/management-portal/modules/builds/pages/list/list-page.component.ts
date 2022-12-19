import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  BuildModel,
  BuildQuery,
  BuildService,
  GameServerService,
  GameServerTemplateService,
  IAuthorization,
  IBuild,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class BuildsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<BuildModel>;

  public dataSource = new MatTableDataSource<BuildModel>();
  public displayedColumns = ['name', 'platform', 'status', 'publishedAt', 'actions'];
  public hasWriteAuthorization: boolean;

  private $builds: Observable<BuildModel[]>;
  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private buildQuery: BuildQuery,
    private buildService: BuildService,
    private gameServerService: GameServerService,
    private gameServerTemplateService: GameServerTemplateService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const roles = [IAuthorization.Role.BuildsReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.fetchBuilds(params);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getPlatform(platform: string) {
    const map = {
      [IBuild.Platform.Server64]: 'Linux Server (x64)',
      [IBuild.Platform.Windows64]: 'Windows Client (x64)',
    };

    return map[platform];
  }

  public getTooltip(record: BuildModel) {
    if (!record.status.nodes.length) {
      return null;
    }

    return record.status.nodes[record.status.nodes.length - 1].message;
  }

  public async publish($event: Event, build: BuildModel) {
    $event.stopPropagation();

    await this.buildService.update(build.namespaceId, build._id, {
      ...build,
      publishedAt: new Date(),
    });

    this.matSnackBar.open('Build published successfully.');

    if (build.platform === IBuild.Platform.Server64 && build.reference) {
      const referenceBuild = await this.buildService.findOne(
        build.namespaceId,
        build.reference._id,
      );
      const dialogRef = this.matDialog.open(PromptComponent, {
        data: {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message:
            `Would you like to update Game Servers and Game Server Templates using the Reference Build ` +
            `(${referenceBuild.name}) to use this Build?`,
        },
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (result === 'Yes') {
          // Update Game Servers.
          const gameServers = await this.gameServerService.find(build.namespaceId, {
            where: { buildId: build.reference._id, matchId: { $exists: false } },
          });
          for (const gameServer of gameServers) {
            await this.gameServerService.update(gameServer.namespaceId, gameServer._id, {
              ...gameServer,
              buildId: build._id,
            });
          }

          // Update Game Server Templates.
          const gameServerTemplates = await this.gameServerTemplateService.find(build.namespaceId, {
            where: { buildId: build.reference._id },
          });
          for (const gameServerTemplate of gameServerTemplates) {
            await this.gameServerTemplateService.update(
              gameServerTemplate.namespaceId,
              gameServerTemplate._id,
              { buildId: build._id },
            );
          }

          this.matSnackBar.open(
            `${gameServers.length} Game Server(s) and ${gameServerTemplates.length} Game Server Template(s) updated successfully.`,
          );
        }
      });
    }
  }

  public showDeletePrompt($event: Event, record: BuildModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Build?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.buildService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Build deleted successfully.');
      }
    });
  }

  public async unpublish($event: Event, build: BuildModel) {
    $event.stopPropagation();

    await this.buildService.update(build.namespaceId, build._id, { ...build, publishedAt: null });

    this.matSnackBar.open('Build unpublished successfully.');
  }

  private async fetchBuilds(params: Params) {
    this.$builds = this.buildQuery.selectAll({
      filterBy: (build) => build.namespaceId === params.namespaceId,
    });

    await this.buildService.find(params.namespaceId, {
      select: '-files -reference',
      sort: '-createdAt',
    });

    this.updateDataSource$ = this.$builds.subscribe((builds) => (this.dataSource.data = builds));

    this.dataSource.filterPredicate = (data: BuildModel, filter: string) => {
      filter = filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

      const regex = new RegExp(filter, 'i');
      const exactRegex = new RegExp(`^${filter}$`, 'i');

      const platform = this.getPlatform(data.platform);
      const published = data.publishedAt ? 'Published' : 'Unpublished';

      return (
        regex.test(data.name) ||
        regex.test(data.status.phase) ||
        regex.test(platform) ||
        exactRegex.test(published)
      );
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
