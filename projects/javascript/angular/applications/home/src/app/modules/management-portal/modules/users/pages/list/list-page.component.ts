import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTable, MatTableDataSource, MatDialog } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { User, UserService, WebSocketService } from '@tenlastic/ng-http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class UsersListPageComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<User>;

  public dataSource: MatTableDataSource<any>;
  public displayedColumns: string[] = ['webSocket', 'username', 'createdAt', 'updatedAt'];
  public search = '';

  private subject: Subject<string> = new Subject();
  private users: User[] = [];

  constructor(
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private titleService: Title,
    private userService: UserService,
    private webSocketService: WebSocketService,
  ) {}

  ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Users`);

    if (this.identityService.user.roles.includes('Administrator')) {
      this.displayedColumns.push('actions');
    }

    this.fetchUsers();

    this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));

    this.subscribeToServices();
  }

  public clearSearch() {
    this.search = '';
    this.applyFilter('');
  }

  public onKeyUp(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  public showDeletePrompt(user: User) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this User?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.userService.delete(user._id);
        this.deleteUser(user);
      }
    });
  }

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private async fetchUsers() {
    this.users = await this.userService.find({ sort: 'username' });

    const webSockets = await this.webSocketService.find({
      where: { userId: { $in: this.users.map(u => u._id) } },
    });
    webSockets.forEach(c => {
      const user = this.users.find(u => u._id === c.userId) as any;
      user.webSocket = c;
    });

    this.dataSource = new MatTableDataSource<any>(this.users);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private deleteUser(user: User) {
    const index = this.dataSource.data.findIndex(u => u._id === user._id);
    this.dataSource.data.splice(index, 1);

    this.dataSource.data = [].concat(this.dataSource.data);
    this.table.renderRows();
  }

  private subscribeToServices() {
    this.webSocketService.onCreate.subscribe(c => {
      const user = this.users.find(u => u._id === c.userId) as any;
      user.webSocket = c;
    });

    this.webSocketService.onDelete.subscribe(c => {
      const user = this.users.find(u => u._id === c.userId) as any;
      user.webSocket = null;
    });
  }
}
