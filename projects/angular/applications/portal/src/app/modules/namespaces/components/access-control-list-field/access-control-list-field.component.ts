import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { UserService } from '@app/core/http';
import { User } from '@app/shared/models';

@Component({
  selector: 'app-access-control-list-field',
  styleUrls: ['./access-control-list-field.component.scss'],
  templateUrl: 'access-control-list-field.component.html',
})
export class AccessControlListFieldComponent implements OnInit {
  @Input() public form: FormGroup;
  @Output() public remove = new EventEmitter();

  public isLoading = false;
  public users: User[] = [];

  private subject: Subject<string> = new Subject();

  constructor(private userService: UserService) {}

  public ngOnInit() {
    this.findUsers('');

    this.subject.pipe(debounceTime(300)).subscribe(this.findUsers.bind(this));
  }

  public displayWith(user: User) {
    if (user) {
      return user.username;
    }
  }

  public onUsernameChanged(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  private async findUsers(username: string) {
    this.isLoading = true;

    this.users = await this.userService.find({
      sort: 'username',
      where: {
        username: { $regex: `${username}`, $options: 'i' },
      },
    });

    this.isLoading = false;
  }
}
