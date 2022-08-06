import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UserModel, UserService } from '@tenlastic/ng-http';
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
  public users: UserModel[] = [];

  private subject: Subject<string> = new Subject();

  constructor(private userService: UserService) {}

  public ngOnInit() {
    this.findUsers('');

    this.subject.pipe(debounceTime(300)).subscribe(this.findUsers.bind(this));
  }

  public displayWith(user: UserModel) {
    if (user) {
      return user.username;
    }
  }

  public async onFocusOut() {
    // Wait 100ms for autocomplete selection.
    await new Promise((res) => setTimeout(res, 100));

    this.users = [];

    if (!this.form.controls.user.value || !this.form.controls.user.value.username) {
      this.form.controls.user.setValue(null);
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
