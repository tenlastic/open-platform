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
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  public dataSource = new MatTableDataSource<WorkflowModel>();
  public displayedColumns = ['name', 'status', 'createdAt', 'updatedAt', 'actions'];
  public hasWriteAuthorization: boolean;
  public message: string;

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
    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';

      const roles = [IAuthorization.Role.CollectionsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      await this.fetchWorkflows(params);

      this.message = null;
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getTooltip(record: WorkflowModel) {
    if (!record.status.nodes.length) {
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
  }
}
