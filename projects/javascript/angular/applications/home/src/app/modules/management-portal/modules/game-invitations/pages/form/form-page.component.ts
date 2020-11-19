import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { GameInvitation, GameInvitationService, User, UserService } from '@tenlastic/ng-http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class GameInvitationsFormPageComponent implements OnInit {
  public data: GameInvitation;
  public errors: string[] = [];
  public form: FormGroup;
  public isLoading = false;
  public users: User[] = [];

  private subject: Subject<string> = new Subject();

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private gameInvitationService: GameInvitationService,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
    private userService: UserService,
  ) {}

  public async ngOnInit() {
    this.subject.pipe(debounceTime(300)).subscribe(this.findUsers.bind(this));
    this.setupForm();
  }

  public displayWith(user: User) {
    if (user) {
      return user.username;
    }
  }

  public async onFocusOut() {
    // Wait 100ms for autocomplete selection.
    await new Promise(res => setTimeout(res, 100));

    this.users = [];

    if (!this.form.controls.user.value || !this.form.controls.user.value.username) {
      this.form.controls.user.setValue(null);
    }
  }

  public onUsernameChanged(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const user: User = this.form.get('user').value;

    const values: Partial<GameInvitation> = {
      namespaceId: this.selectedNamespaceService.namespaceId,
      userId: user._id,
    };

    try {
      await this.create(values);
    } catch (e) {
      this.handleHttpError(e, { namespaceId: 'Namespace', userId: 'User' });
    }
  }

  private async handleHttpError(err: HttpErrorResponse, pathMap: any) {
    this.errors = err.error.errors.map(e => {
      if (e.name === 'UniquenessError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        const paths = e.paths.map(p => pathMap[p]);
        return `${paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
  }

  private async create(data: Partial<GameInvitation>) {
    await this.gameInvitationService.create(data);

    this.matSnackBar.open('Game Invitation saved successfully.');
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
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

  private setupForm(): void {
    this.data = this.data || new GameInvitation();

    this.form = this.formBuilder.group({
      user: [null, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }
}
