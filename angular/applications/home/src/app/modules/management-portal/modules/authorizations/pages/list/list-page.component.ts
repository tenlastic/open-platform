import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationModel,
  AuthorizationQuery,
  AuthorizationService,
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
export class AuthorizationsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  public dataSource = new MatTableDataSource<AuthorizationModel>();
  public displayedColumns = ['name', 'user', 'roles', 'createdAt', 'actions'];
  public hasWriteAuthorization: boolean;
  public message: string;

  private $authorizations: Observable<AuthorizationModel[]>;
  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private userQuery: UserQuery,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';

      if (params.namespaceId) {
        this.displayedColumns = ['name', 'user', 'roles', 'createdAt', 'actions'];
      } else {
        this.displayedColumns = ['user', 'roles', 'createdAt', 'actions'];
      }

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

  public getUser(_id: string) {
    return this.userQuery.getEntity(_id);
  }

  public showDeletePrompt($event: Event, record: AuthorizationModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Authorization?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.authorizationService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Authorization deleted successfully.');
      }
    });
  }

  private async fetchAuthorizations(params: Params) {
    this.$authorizations = this.authorizationQuery.selectAll({
      filterBy: (a) => {
        if (params.namespaceId) {
          return a.namespaceId === params.namespaceId;
        } else {
          return !a.namespaceId;
        }
      },
    });

    await this.authorizationService.find(params.namespaceId, { sort: '-createdAt', where: params });

    this.updateDataSource$ = this.$authorizations.subscribe(
      (authorizations) => (this.dataSource.data = authorizations),
    );

    this.dataSource.filterPredicate = (data: AuthorizationModel, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      const user = this.getUser(data.userId);
      return regex.test(user.username);
    };
  }
}
