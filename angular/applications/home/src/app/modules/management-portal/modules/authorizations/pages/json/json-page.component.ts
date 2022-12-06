import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthorizationModel, AuthorizationService } from '@tenlastic/http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class AuthorizationsJsonPageComponent implements OnInit {
  public data: AuthorizationModel;
  public errors: string[] = [];
  public form: FormGroup;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationService: AuthorizationService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.authorizationId !== 'new') {
        this.data = await this.authorizationService.findOne(
          params.namespaceId,
          params.authorizationId,
        );
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
    this.errors = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const json = this.form.get('json').value;
    const values = JSON.parse(json) as AuthorizationModel;

    values._id = this.data._id;

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e);
    }
  }

  private setupForm(): void {
    this.data ??= new AuthorizationModel({ apiKey: '', name: '', roles: [], userId: '' });

    const keys = ['apiKey', 'name', 'roles', 'userId'];
    const data = Object.keys(this.data)
      .filter((key) => keys.includes(key))
      .sort()
      .reduce((a, b) => Object.assign(a, { [b]: this.data[b] }), {});

    this.form = this.formBuilder.group({
      json: [JSON.stringify(data, null, 4), [Validators.required, jsonValidator]],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(values: Partial<AuthorizationModel>) {
    const result = values._id
      ? await this.authorizationService.update(this.params.namespaceId, values._id, values)
      : await this.authorizationService.create(this.params.namespaceId, values);

    this.matSnackBar.open(`Authorization saved successfully.`);
    this.router.navigate(['../../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
