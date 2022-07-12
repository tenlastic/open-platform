import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Authorization, AuthorizationService } from '@tenlastic/ng-http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class AuthorizationsJsonPageComponent implements OnInit {
  public data: Authorization;
  public errors: string[] = [];
  public form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationService: AuthorizationService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      const _id = params.get('authorizationId');

      if (_id !== 'new') {
        this.data = await this.authorizationService.findOne(_id);
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
    const values = JSON.parse(json) as Authorization;

    try {
      this.data = await this.formService.upsert(this.authorizationService, values, {
        path: '../../',
      });
    } catch (e) {
      this.formService.handleHttpError(e);
    }
  }

  private setupForm(): void {
    this.data ??= new Authorization({ roles: [], userId: '' });

    const keys = ['roles', 'userId'];
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
