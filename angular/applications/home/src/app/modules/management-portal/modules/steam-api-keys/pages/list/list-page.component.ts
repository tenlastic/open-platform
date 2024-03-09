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
  SteamApiKeyModel,
  SteamApiKeyQuery,
  SteamApiKeyService,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class SteamApiKeysListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  public dataSource = new MatTableDataSource<SteamApiKeyModel>();
  public get displayedColumns() {
    return ['name', 'appId', 'value', 'createdAt', 'updatedAt', 'actions'];
  }
  public hasWriteAuthorization: boolean;
  public message: string;

  private $steamApiKeys: Observable<SteamApiKeyModel[]>;
  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private steamApiKeyQuery: SteamApiKeyQuery,
    private steamApiKeyService: SteamApiKeyService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';

      const roles = [IAuthorization.Role.SteamApiKeysWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      await this.fetchSteamApiKeys(params);

      this.message = null;
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public showDeletePrompt($event: Event, record: SteamApiKeyModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Steam API Key?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.steamApiKeyService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Steam API Key deleted successfully.');
      }
    });
  }

  private async fetchSteamApiKeys(params: Params) {
    this.$steamApiKeys = this.steamApiKeyQuery.selectAll({
      filterBy: (m) => m.namespaceId === params.namespaceId,
    });

    await this.steamApiKeyService.find(params.namespaceId, { sort: 'name' });

    this.updateDataSource$ = this.$steamApiKeys.subscribe(
      (steamApiKeys) => (this.dataSource.data = steamApiKeys),
    );

    this.dataSource.filterPredicate = (data: SteamApiKeyModel, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');

      return regex.test(`${data.appId}`) || regex.test(data.name) || regex.test(data.value);
    };
  }
}
