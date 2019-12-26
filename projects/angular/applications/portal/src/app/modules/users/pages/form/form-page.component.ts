import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { User, UserService } from '@tenlastic/ng-http';
import { IdentityService } from '@tenlastic/ng-authentication';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class UsersFormPageComponent implements OnInit {
  public data: User;
  public error: string;
  public form: FormGroup;
  public loadingMessage: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private router: Router,
    private userService: UserService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      this.loadingMessage = 'Loading User...';

      try {
        const _id = params.get('_id');

        if (_id !== 'new') {
          this.data = await this.userService.findOne(_id);
        }

        this.setupForm();
      } catch {
        this.router.navigate(['../new'], { relativeTo: this.activatedRoute });
      }

      this.loadingMessage = null;
    });
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('email').markAsTouched();
      this.form.get('roles').markAsTouched();
      this.form.get('username').markAsTouched();

      return;
    }

    const values: Partial<User> = {
      email: this.form.get('email').value,
      roles: this.form.get('roles').value,
      username: this.form.get('username').value,
    };

    if (this.data._id) {
      this.update(values);
    } else {
      this.create(values);
    }
  }

  private async create(data: Partial<User>) {
    try {
      await this.userService.create(data);
    } catch (e) {
      this.error = 'That email is already taken.';
    }
  }

  private setupForm(): void {
    this.data = this.data || new User();

    this.form = this.formBuilder.group({
      email: [this.data.email, Validators.required],
      roles: [this.data.roles],
      username: [this.data.username, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<User>) {
    data._id = this.data._id;

    try {
      await this.userService.update(data);
    } catch (e) {
      this.error = 'That email is already taken.';
    }
  }
}
