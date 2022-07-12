import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import {
  Authorization,
  AuthorizationQuery,
  AuthorizationService,
  IAuthorization,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class AuthorizationsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Authorization>;

  public dataSource = new MatTableDataSource<Authorization>();
  public displayedColumns: string[] = ['user', 'createdAt', 'actions'];
  public hasWriteAuthorization: boolean;

  private $authorizations: Observable<Authorization[]>;
  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.titleService.setTitle(`${TITLE} | Authorizations`);

      const roles = [IAuthorization.AuthorizationRole.AuthorizationsReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, roles, userId);

      this.fetchAuthorizations(params);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public showDeletePrompt(record: Authorization) {
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
    const $authorizations = this.authorizationQuery.selectAll({
      filterBy: (a) => {
        if (params.namespaceId) {
          return a.namespaceId === params.namespaceId;
        } else {
          return !a.namespaceId;
        }
      },
    });
    this.$authorizations = this.authorizationQuery.populate($authorizations);

    await this.authorizationService.find({ sort: '-createdAt', where: params });

    this.updateDataSource$ = this.$authorizations.subscribe(
      (authorizations) => (this.dataSource.data = authorizations),
    );

    this.dataSource.filterPredicate = (data: Authorization, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      return regex.test(data.user?.username);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
