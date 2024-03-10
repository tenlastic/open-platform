import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  SteamIntegrationModel,
  SteamIntegrationQuery,
  SteamIntegrationService,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class SteamIntegrationsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  public dataSource = new MatTableDataSource<SteamIntegrationModel>();
  public get displayedColumns() {
    return ['name', 'apiKey', 'applicationId', 'createdAt', 'updatedAt', 'actions'];
  }
  public hasWriteAuthorization: boolean;
  public message: string;

  private $steamIntegrations: Observable<SteamIntegrationModel[]>;
  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private steamIntegrationQuery: SteamIntegrationQuery,
    private steamIntegrationService: SteamIntegrationService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';

      const roles = [IAuthorization.Role.SteamIntegrationsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      await this.fetchSteamIntegrations(params);

      this.message = null;
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public showDeletePrompt($event: Event, record: SteamIntegrationModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Steam Integration?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.steamIntegrationService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Steam Integration deleted successfully.');
      }
    });
  }

  private async fetchSteamIntegrations(params: Params) {
    this.$steamIntegrations = this.steamIntegrationQuery.selectAll({
      filterBy: (m) => m.namespaceId === params.namespaceId,
    });

    await this.steamIntegrationService.find(params.namespaceId, { sort: 'name' });

    this.updateDataSource$ = this.$steamIntegrations.subscribe(
      (steamIntegrations) => (this.dataSource.data = steamIntegrations),
    );

    this.dataSource.filterPredicate = (data: SteamIntegrationModel, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');

      return (
        regex.test(data.apiKey) || regex.test(`${data.applicationId}`) || regex.test(data.name)
      );
    };
  }
}
