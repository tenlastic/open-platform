import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
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
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<AuthorizationModel>;

  public dataSource = new MatTableDataSource<AuthorizationModel>();
  public displayedColumns = ['name', 'user', 'roles', 'createdAt', 'actions'];
  public hasWriteAuthorization: boolean;

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
    this.activatedRoute.params.subscribe((params) => {
      if (params.namespaceId) {
        this.displayedColumns = ['name', 'user', 'roles', 'createdAt', 'actions'];
      } else {
        this.displayedColumns = ['user', 'roles', 'createdAt', 'actions'];
      }

      const roles = [IAuthorization.Role.AuthorizationsReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, roles, userId);

      this.fetchAuthorizations(params);
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
        await this.authorizationService.delete(record._id);
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

    await this.authorizationService.find({ sort: '-createdAt', where: params });

    this.updateDataSource$ = this.$authorizations.subscribe(
      (authorizations) => (this.dataSource.data = authorizations),
    );

    this.dataSource.filterPredicate = (data: AuthorizationModel, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      const user = this.getUser(data.userId);
      return regex.test(user.username);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
