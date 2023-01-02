import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  CollectionModel,
  CollectionQuery,
  CollectionService,
  IAuthorization,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class CollectionsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<CollectionModel>;

  public dataSource = new MatTableDataSource<CollectionModel>();
  public displayedColumns = ['name', 'properties', 'roles', 'createdAt', 'updatedAt', 'actions'];
  public hasWriteAuthorization: boolean;

  private $collections: Observable<CollectionModel[]>;
  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private collectionQuery: CollectionQuery,
    private collectionService: CollectionService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const roles = [IAuthorization.Role.CollectionsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.fetchCollections(params);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public showDeletePrompt($event: Event, record: CollectionModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Collection?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.collectionService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Collection deleted successfully.');
      }
    });
  }

  private async fetchCollections(params: Params) {
    this.$collections = this.collectionQuery.selectAll({
      filterBy: (gs) => gs.namespaceId === params.namespaceId,
    });

    await this.collectionService.find(params.namespaceId, { sort: 'name' });

    this.updateDataSource$ = this.$collections.subscribe(
      (collections) => (this.dataSource.data = collections),
    );

    this.dataSource.filterPredicate = (data: CollectionModel, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      return regex.test(data.name);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
