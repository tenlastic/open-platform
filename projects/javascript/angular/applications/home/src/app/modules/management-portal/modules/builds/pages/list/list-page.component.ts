import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  MatPaginator,
  MatSort,
  MatTable,
  MatTableDataSource,
  MatDialog,
  MatSnackBar,
} from '@angular/material';
import { Title } from '@angular/platform-browser';
import {
  Build,
  BuildQuery,
  BuildService,
  GameServerService,
  IBuild,
  QueueService,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class BuildsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Build>;

  public $builds: Observable<Build[]>;
  public dataSource = new MatTableDataSource<Build>();
  public displayedColumns: string[] = [
    'game',
    'name',
    'platform',
    'status',
    'publishedAt',
    'actions',
  ];

  private updateDataSource$ = new Subscription();

  constructor(
    private buildQuery: BuildQuery,
    private buildService: BuildService,
    private gameServerService: GameServerService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueService: QueueService,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Builds`);
    this.fetchBuilds();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getPlatform(platform: string) {
    const map = {
      server64: 'Linux Server (x64)',
      windows64: 'Windows Client (x64)',
    };

    return map[platform];
  }

  public async publish(build: Build) {
    await this.buildService.update({ ...build, publishedAt: new Date() });

    if (build.platform === IBuild.Platform.Server64 && build.reference) {
      const referenceBuild = await this.buildService.findOne(build.reference._id);
      const dialogRef = this.matDialog.open(PromptComponent, {
        data: {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message:
            `Would you like to update Game Servers and Queues using the Reference Build ` +
            `(${referenceBuild.name}) to use this Build?`,
        },
      });

      dialogRef.afterClosed().subscribe(async result => {
        if (result === 'Yes') {
          // Update Game Servers.
          const gameServers = await this.gameServerService.find({
            where: { buildId: build.reference._id, isPersistent: true },
          });
          for (const gameServer of gameServers) {
            await this.gameServerService.update({ ...gameServer, buildId: build._id });
          }

          // Update Queues.
          const queues = await this.queueService.find({
            where: { buildId: build.reference._id },
          });
          for (const queue of queues) {
            await this.queueService.update({ _id: queue._id, buildId: build._id });
          }

          // Update Queue Game Server templates.
          const gameServerTemplates = await this.queueService.find({
            where: { 'gameServerTemplate.buildId': build.reference._id },
          });
          for (const queue of gameServerTemplates) {
            await this.queueService.update({
              _id: queue._id,
              gameServerTemplate: { ...queue.gameServerTemplate, buildId: build._id },
            });
          }

          this.matSnackBar.open(
            `${gameServers.length} Game Server(s) and ${queues.length} Queue(s) updated successfully...`,
          );
        }
      });
    }
  }

  public showDeletePrompt(record: Build) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Build?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.buildService.delete(record._id);
        this.matSnackBar.open('Build deleted successfully.');
      }
    });
  }

  public async unpublish(build: Build) {
    return this.buildService.update({ ...build, publishedAt: null });
  }

  private async fetchBuilds() {
    const $builds = this.buildQuery.selectAll({
      filterBy: build => build.namespaceId === this.selectedNamespaceService.namespaceId,
    });
    this.$builds = this.buildQuery.populate($builds);

    await this.buildService.find({
      sort: '-createdAt',
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.updateDataSource$ = this.$builds.subscribe(builds => (this.dataSource.data = builds));

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
