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
  QueueMemberModel,
  QueueMemberQuery,
  QueueMemberService,
  UserQuery,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class QueueMembersListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  public $queueMembers: Observable<QueueMemberModel[]>;
  public dataSource = new MatTableDataSource<QueueMemberModel>();
  public displayedColumns = ['username', 'steam', 'createdAt', 'actions'];
  public hasWriteAuthorization: boolean;
  public message: string;

  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueMemberQuery: QueueMemberQuery,
    private queueMemberService: QueueMemberService,
    private userQuery: UserQuery,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';

      const roles = [IAuthorization.Role.QueuesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      await this.fetchQueueMembers(params);

      this.message = null;
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getUser(_id: string) {
    return this.userQuery.getEntity(_id);
  }

  public showDeletePrompt($event: Event, record: QueueMemberModel) {
    $event.stopPropagation();

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
        await this.queueMemberService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Queue Member deleted successfully.');
      }
    });
  }

  private async fetchQueueMembers(params: Params) {
    this.$queueMembers = this.queueMemberQuery.selectAll({
      filterBy: (qm) => qm.queueId === params.queueId,
    });

    await this.queueMemberService.find(params.namespaceId, {
      sort: 'createdAt',
      where: { queueId: params.queueId },
    });

    this.updateDataSource$ = this.$queueMembers.subscribe(
      (queueMembers) => (this.dataSource.data = queueMembers),
    );
  }
}
