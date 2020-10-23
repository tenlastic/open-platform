import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { User, UserService } from '@tenlastic/ng-http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-namespace-user-field',
  styleUrls: ['./namespace-user-field.component.scss'],
  templateUrl: 'namespace-user-field.component.html',
})
export class NamespaceUserFieldComponent implements OnInit {
  @Input() public form: FormGroup;
  @Input() public roles: any[];
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
