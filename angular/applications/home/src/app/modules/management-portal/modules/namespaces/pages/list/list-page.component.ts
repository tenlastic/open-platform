import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import {
  AuthorizationQuery,
  IAuthorization,
  NamespaceModel,
  NamespaceQuery,
  NamespaceService,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class NamespacesListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<NamespaceModel>;

  public dataSource = new MatTableDataSource<NamespaceModel>();
  public displayedColumns = ['name', 'createdAt', 'updatedAt', 'actions'];
  public hasWriteAuthorization: boolean;

  private $namespaces: Observable<NamespaceModel[]>;
  private updateDataSource$ = new Subscription();

  constructor(
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private namespaceQuery: NamespaceQuery,
    private namespaceService: NamespaceService,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Namespaces`);

    const roles = [IAuthorization.Role.NamespacesReadWrite];
    const userId = this.identityService.user?._id;
    this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, roles, userId);

    this.fetchNamespaces();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public hasWriteAuthorizationForNamespace(namespaceId: string) {
    const roles = [IAuthorization.Role.NamespacesReadWrite];
    const userId = this.identityService.user?._id;
    return this.authorizationQuery.hasRoles(namespaceId, roles, userId);
  }

  public showDeletePrompt($event: Event, record: NamespaceModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Namespace?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.namespaceService.delete(record._id);
        this.matSnackBar.open('Namespace deleted successfully.');
      }
    });
  }

  private async fetchNamespaces() {
    this.$namespaces = this.namespaceQuery.selectAll();
    await this.namespaceService.find({ sort: 'name' });

    this.updateDataSource$ = this.$namespaces.subscribe(
      (namespaces) => (this.dataSource.data = namespaces),
    );

    this.dataSource.filterPredicate = (data: NamespaceModel, filter: string) => {
      return new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i').test(data.name);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
