import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Build, BuildService, IBuild } from '@tenlastic/ng-http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class BuildsJsonPageComponent implements OnInit {
  public data: Build;
  public errors: string[] = [];
  public form: FormGroup;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private buildService: BuildService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.buildId !== 'new') {
        this.data = await this.buildService.findOne(params.buildId);
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
    const values = JSON.parse(json) as Build;

    values.namespaceId = this.params.namespaceId;

    try {
      await this.upsert(values);
    } catch (e) {
      this.formService.handleHttpError(e);
    }
  }

  private setupForm(): void {
    this.data ??= new Build({ name: '', platform: IBuild.Platform.Server64 });

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

  private async upsert(data: Partial<Build>) {
    let result: Build;

    if (this.data._id) {
      data._id = this.data._id;
      result = await this.buildService.update(data);
    } else {
      result = await this.buildService.create(data).toPromise();
    }

    this.matSnackBar.open('Build saved successfully.');
    this.router.navigate([`../../${result._id}`], { relativeTo: this.activatedRoute });
  }
}
