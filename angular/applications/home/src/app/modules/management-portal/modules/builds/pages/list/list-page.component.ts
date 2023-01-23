import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
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
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  public dataSource = new MatTableDataSource<BuildModel>();
  public displayedColumns = ['name', 'platform', 'status', 'publishedAt', 'createdAt', 'actions'];
  public hasWriteAuthorization: boolean;
  public message: string;

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
    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';

      const roles = [IAuthorization.Role.BuildsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      await this.fetchBuilds(params);

      this.message = null;
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
            `Publishing this Build will restart and update Game Servers that use its Reference Build ` +
            `(${referenceBuild.name}). Are you sure you want to publish this Build?`,
        },
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (result === 'Yes') {
          await this.buildService.update(build.namespaceId, build._id, { publishedAt: new Date() });

          this.matSnackBar.open('Build published successfully.');
        }
      });
    } else {
      await this.buildService.update(build.namespaceId, build._id, { publishedAt: new Date() });

      this.matSnackBar.open('Build published successfully.');
    }
  }

  public async showDeletePrompt($event: Event, record: BuildModel) {
    $event.stopPropagation();

    let dialogRef: MatDialogRef<PromptComponent>;

    if (record.platform === IBuild.Platform.Server64 && record.reference) {
      const referenceBuild = await this.buildService.findOne(
        record.namespaceId,
        record.reference._id,
      );

      dialogRef = this.matDialog.open(PromptComponent, {
        data: {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message:
            `Deleting this Build will restart and rollback Game Servers to use its Reference Build ` +
            `(${referenceBuild.name}). Are you sure you want to delete this Build?`,
        },
      });
    } else {
      dialogRef = this.matDialog.open(PromptComponent, {
        data: {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: `Are you sure you want to delete this Build?`,
        },
      });
    }

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.buildService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Build deleted successfully.');
      }
    });
  }

  public async unpublish($event: Event, build: BuildModel) {
    $event.stopPropagation();

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
            `Unpublishing this Build will restart and rollback Game Servers to use its Reference Build ` +
            `(${referenceBuild.name}). Are you sure you want to unpublish this Build?`,
        },
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (result === 'Yes') {
          await this.buildService.update(build.namespaceId, build._id, { publishedAt: null });

          this.matSnackBar.open('Build unpublished successfully.');
        }
      });
    } else {
      await this.buildService.update(build.namespaceId, build._id, { publishedAt: null });

      this.matSnackBar.open('Build unpublished successfully.');
    }
  }

  private async fetchBuilds(params: Params) {
    this.$builds = this.buildQuery.selectAll({
      filterBy: (build) => build.namespaceId === params.namespaceId,
    });

    await this.buildService.find(params.namespaceId, {
      select: '-files -reference.files',
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
  }
}
