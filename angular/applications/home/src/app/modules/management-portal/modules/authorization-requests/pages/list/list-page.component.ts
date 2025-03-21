import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  AuthorizationRequestModel,
  AuthorizationRequestQuery,
  AuthorizationRequestService,
  IAuthorization,
  UserQuery,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class AuthorizationRequestsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  public dataSource = new MatTableDataSource<AuthorizationRequestModel>();
  public displayedColumns = ['roles', 'user', 'createdAt', 'deniedAt', 'grantedAt', 'actions'];
  public hasWriteAuthorization: boolean;
  public message: string;

  private $authorizationRequests: Observable<AuthorizationRequestModel[]>;
  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private authorizationRequestQuery: AuthorizationRequestQuery,
    private authorizationRequestService: AuthorizationRequestService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private userQuery: UserQuery,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';

      const roles = [IAuthorization.Role.AuthorizationsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, roles, userId);

      await this.fetchAuthorizations(params);

      this.message = null;
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public async deny($event: Event, record: AuthorizationRequestModel) {
    $event.stopPropagation();

    await this.authorizationRequestService.deny(record.namespaceId, record._id);
    this.matSnackBar.open(`Authorization Request denied successfully.`);
  }

  public getUser(_id: string) {
    return this.userQuery.getEntity(_id);
  }

  public async grant($event: Event, record: AuthorizationRequestModel) {
    $event.stopPropagation();

    await this.authorizationRequestService.grant(record.namespaceId, record._id);
    this.matSnackBar.open(`Authorization Request granted successfully.`);
  }

  public showDeletePrompt($event: Event, record: AuthorizationRequestModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Authorization Request?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.authorizationRequestService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Authorization Request deleted successfully.');
      }
    });
  }

  private async fetchAuthorizations(params: Params) {
    this.$authorizationRequests = this.authorizationRequestQuery.selectAll({
      filterBy: (a) => {
        if (params.namespaceId) {
          return a.namespaceId === params.namespaceId;
        } else {
          return !a.namespaceId;
        }
      },
    });

    await this.authorizationRequestService.find(params.namespaceId, {
      sort: '-createdAt',
      where: params,
    });

    this.updateDataSource$ = this.$authorizationRequests.subscribe(
      (authorizationRequests) => (this.dataSource.data = authorizationRequests),
    );

    this.dataSource.filterPredicate = (data: AuthorizationRequestModel, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      const user = this.getUser(data.userId);
      return regex.test(user.username);
    };
  }
}
