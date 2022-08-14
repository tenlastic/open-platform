import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BuildModel, BuildService, IBuild } from '@tenlastic/http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class BuildsJsonPageComponent implements OnInit {
  public data: BuildModel;
  public errors: string[] = [];
  public form: UntypedFormGroup;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private buildService: BuildService,
    private formBuilder: UntypedFormBuilder,
    private formService: FormService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.buildId !== 'new') {
        this.data = await this.buildService.findOne(params.namespaceId, params.buildId);
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
    const values = JSON.parse(json) as BuildModel;

    values.namespaceId = this.params.namespaceId;

    try {
      await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e);
    }
  }

  private setupForm(): void {
    this.data ??= new BuildModel({ name: '', platform: IBuild.Platform.Server64 });

    const keys = ['entrypoint', 'name', 'publishedAt'];
    const data = Object.keys(this.data)
      .filter((key) => keys.includes(key))
      .sort()
      .reduce((a, b) => Object.assign(a, { [b]: this.data[b] }), {});

    this.form = this.formBuilder.group({
      json: [JSON.stringify(data, null, 4), [Validators.required, jsonValidator]],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<BuildModel>) {
    let result: BuildModel;

    if (this.data._id) {
      data._id = this.data._id;
      result = await this.buildService.update(this.params.namespaceId, this.data._id, data);
    } else {
      const formData = new FormData();
      formData.append('record', JSON.stringify(data));

      result = await this.buildService.create(this.params.namespaceId, formData);
    }

    this.matSnackBar.open('Build saved successfully.');
    this.router.navigate(['../../', result._id], { relativeTo: this.activatedRoute });
  }
}
