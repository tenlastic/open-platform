import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { Article, ArticleService } from '@tenlastic/ng-http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class ArticlesJsonPageComponent implements OnInit {
  public data: Article;
  public errors: string[] = [];
  public form: FormGroup;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleService: ArticleService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.articleId !== 'new') {
        this.data = await this.articleService.findOne(params.articleId);
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
    const values = JSON.parse(json) as Article;

    values._id = this.data._id;
    values.namespaceId = this.params.namespaceId;

    try {
      this.data = await this.formService.upsert(this.articleService, values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e);
    }
  }

  private setupForm(): void {
    this.data ??= new Article({ body: '', caption: '', title: '', type: 'News' });

    const keys = ['body', 'caption', 'title', 'type'];
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
