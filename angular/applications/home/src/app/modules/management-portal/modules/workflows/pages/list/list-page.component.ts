import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  WorkflowModel,
  WorkflowQuery,
  WorkflowService,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class WorkflowsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<WorkflowModel>;

  public dataSource = new MatTableDataSource<WorkflowModel>();
  public displayedColumns = ['name', 'status', 'createdAt', 'updatedAt', 'actions'];
  public hasWriteAuthorization: boolean;

  private $workflows: Observable<WorkflowModel[]>;
  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private workflowQuery: WorkflowQuery,
    private workflowService: WorkflowService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const roles = [IAuthorization.Role.CollectionsReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.fetchWorkflows(params);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getTooltip(record: WorkflowModel) {
    if (!record.status?.nodes?.length) {
      return null;
    }

    return record.status.nodes[record.status.nodes.length - 1].message;
  }

  public showDeletePrompt($event: Event, record: WorkflowModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Workflow ?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.workflowService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Workflow  deleted successfully.');
      }
    });
  }

  private async fetchWorkflows(params: Params) {
    this.$workflows = this.workflowQuery.selectAll({
      filterBy: (gs) => gs.namespaceId === params.namespaceId,
    });

    await this.workflowService.find(params.namespaceId, {});

    this.updateDataSource$ = this.$workflows.subscribe(
      (workflows) => (this.dataSource.data = workflows),
    );

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
