import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import {
  Authorization,
  AuthorizationQuery,
  AuthorizationService,
  IAuthorization,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { SelectedNamespaceService } from '../../../../../../core/services';
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

  public $authorizations: Observable<Authorization[]>;
  public AuthorizationStatus = IAuthorization.AuthorizationStatus;
  public dataSource = new MatTableDataSource<Authorization>();
  public displayedColumns: string[] = ['user', 'status', 'createdAt', 'actions'];
  public statuses = {
    [IAuthorization.AuthorizationStatus.Granted]: 'Granted',
    [IAuthorization.AuthorizationStatus.Pending]: 'Pending',
    [IAuthorization.AuthorizationStatus.Revoked]: 'Revoked',
  };

  private updateDataSource$ = new Subscription();

  constructor(
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Authorizations`);
    this.fetchAuthorizations();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public async grant(authorization: Authorization) {
    await this.authorizationService.update({
      _id: authorization._id,
      status: IAuthorization.AuthorizationStatus.Granted,
    });
    this.matSnackBar.open('Authorization granted successfully.');
  }

  public async revoke(authorization: Authorization) {
    await this.authorizationService.update({
      _id: authorization._id,
      status: IAuthorization.AuthorizationStatus.Revoked,
    });
    this.matSnackBar.open('Authorization revoked successfully.');
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

  private async fetchAuthorizations() {
    const $authorizations = this.authorizationQuery.selectAll({
      filterBy: (authorization) =>
        authorization.namespaceId === this.selectedNamespaceService.namespaceId,
    });
    this.$authorizations = this.authorizationQuery.populate($authorizations);

    await this.authorizationService.find({
      sort: '-createdAt',
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.updateDataSource$ = this.$authorizations.subscribe(
      (authorizations) => (this.dataSource.data = authorizations),
    );

    this.dataSource.filterPredicate = (data: Authorization, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      return regex.test(data.status) || regex.test(data.user?.username);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
