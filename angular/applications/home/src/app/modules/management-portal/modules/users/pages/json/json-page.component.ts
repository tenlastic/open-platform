import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { User, UserService } from '@tenlastic/ng-http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class UsersJsonPageComponent implements OnInit {
  public data: User;
  public errors: string[] = [];
  public form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private textareaService: TextareaService,
    private userService: UserService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      if (params.userId !== 'new') {
        this.data = await this.userService.findOne(params.userId);
      }

      this.setupForm();
    });
  }

  public navigateToForm() {
    this.formService.navigateToForm(this.form);
  }

  public onKeyDown(event: any) {
    this.textareaService.onKeyDown(event);
  }

  public onKeyUp(event: any) {
    this.textareaService.onKeyUp(event);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const json = this.form.get('json').value;
    const values = JSON.parse(json) as User;

    values._id = this.data._id;

    try {
      this.data = await this.formService.upsert(this.userService, values, { path: '../../' });
    } catch (e) {
      this.formService.handleHttpError(e);
    }
  }

  private setupForm(): void {
    this.data ??= new User({ username: '' });

    const keys = ['email', 'roles', 'username'];
    const data = Object.keys(this.data)
      .filter((key) => keys.includes(key))
      .sort()
      .reduce((a, b) => Object.assign(a, { [b]: this.data[b] }), {});

    this.form = this.formBuilder.group({
      json: [JSON.stringify(data, null, 4), [Validators.required, jsonValidator]],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }
}
