import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatchModel, MatchService } from '@tenlastic/http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class MatchesJsonPageComponent implements OnInit {
  public data: MatchModel;
  public errors: string[] = [];
  public form: FormGroup;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private matchService: MatchService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.matchId !== 'new') {
        this.data = await this.matchService.findOne(params.namespaceId, params.matchId);
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
    const values = JSON.parse(json) as MatchModel;

    values._id = this.data._id;
    values.namespaceId = this.params.namespaceId;
    values.queueId = this.params.queueId || values.queueId;

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e);
    }
  }

  private setupForm() {
    this.data ??= new MatchModel({
      queueId: this.params.queueId ?? null,
      teams: [{ userIds: [] }, { userIds: [] }],
    });

    const keys = this.params.queueId ? ['teams'] : ['queueId', 'teams'];

    const data = Object.keys(this.data)
      .filter((key) => keys.includes(key))
      .sort()
      .reduce((a, b) => Object.assign(a, { [b]: this.data[b] }), {});

    this.form = this.formBuilder.group({
      json: [JSON.stringify(data, null, 4), [Validators.required, jsonValidator]],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(values: Partial<MatchModel>) {
    const result = values._id
      ? await this.matchService.update(this.params.namespaceId, values._id, values)
      : await this.matchService.create(this.params.namespaceId, values);

    this.matSnackBar.open(`Match saved successfully.`);
    this.router.navigate(['../../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
