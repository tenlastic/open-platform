import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  QueueMember,
  QueueMemberQuery,
  QueueMemberService,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class QueueMembersListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<QueueMember>;

  public $queueMembers: Observable<QueueMember[]>;
  public dataSource = new MatTableDataSource<QueueMember>();
  public displayedColumns: string[] = ['username', 'createdAt', 'actions'];
  public hasWriteAuthorization: boolean;

  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueMemberQuery: QueueMemberQuery,
    private queueMemberService: QueueMemberService,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.titleService.setTitle(`${TITLE} | Queue Members`);

      const roles = [IAuthorization.AuthorizationRole.QueuesReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.fetchQueueMembers(params);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public showDeletePrompt(record: QueueMember) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Queue Member?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.queueMemberService.delete(record._id);
        this.matSnackBar.open('Queue Member deleted successfully.');
      }
    });
  }

  private async fetchQueueMembers(params: Params) {
    const $queueMembers = this.queueMemberQuery.selectAll({
      filterBy: (qm) => qm.queueId === params.queueId,
    });
    this.$queueMembers = this.queueMemberQuery.populate($queueMembers);

    await this.queueMemberService.find({
      sort: 'createdAt',
      where: { queueId: params.queueId },
    });

    this.updateDataSource$ = this.$queueMembers.subscribe(
      (queueMembers) => (this.dataSource.data = queueMembers),
    );

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
