import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ArticleModel, ArticleService, IArticle } from '@tenlastic/http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class ArticlesJsonPageComponent implements OnInit {
  public data: ArticleModel;
  public errors: string[] = [];
  public form: FormGroup;
  public isSaving: boolean;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleService: ArticleService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.articleId !== 'new') {
        this.data = await this.articleService.findOne(params.namespaceId, params.articleId);
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
    this.isSaving = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.isSaving = false;
      return;
    }

    const json = this.form.get('json').value;
    const values = JSON.parse(json) as ArticleModel;

    values._id = this.data._id;
    values.namespaceId = this.params.namespaceId;

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e);
    }

    this.isSaving = false;
  }

  private setupForm() {
    this.data ??= new ArticleModel({ body: '', subtitle: '', title: '', type: IArticle.Type.News });

    const keys = ['body', 'subtitle', 'title', 'type'];
    const data = Object.keys(this.data)
      .filter((key) => keys.includes(key))
      .sort()
      .reduce((a, b) => Object.assign(a, { [b]: this.data[b] }), {});

    this.form = this.formBuilder.group({
      json: [JSON.stringify(data, null, 4), [Validators.required, jsonValidator]],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(values: Partial<ArticleModel>) {
    const result = values._id
      ? await this.articleService.update(this.params.namespaceId, values._id, values)
      : await this.articleService.create(this.params.namespaceId, values);

    this.matSnackBar.open(`Article saved successfully.`);
    this.router.navigate(['../../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
