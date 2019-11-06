import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTable, MatTableDataSource, MatDialog } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { UserService } from '@app/core/http';
import { IdentityService } from '@app/core/services';
import { PromptComponent } from '@app/shared/components';
import { TITLE } from '@app/shared/constants';
import { User } from '@app/shared/models';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class UsersListPageComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<User>;

  public dataSource: MatTableDataSource<User>;
  public displayedColumns: string[] = ['username', 'createdAt', 'updatedAt'];
  public search = '';

  private subject: Subject<string> = new Subject();

  constructor(
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private titleService: Title,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Users`);

    if (this.identityService.user.roles.includes('Admin')) {
      this.displayedColumns.push('actions');
    }

    this.fetchUsers();

    this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));
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
        buttons: [{ background: 'accent', label: 'No' }, { color: 'white', label: 'Yes' }],
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
    const users = await this.userService.find({ sort: 'email' });

    this.dataSource = new MatTableDataSource<User>(users);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private deleteUser(user: User) {
    const index = this.dataSource.data.findIndex(u => u._id === user._id);
    this.dataSource.data.splice(index, 1);

    this.dataSource.data = [].concat(this.dataSource.data);
    this.table.renderRows();
  }
}
