import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { Article, ArticleService, AuthorizationQuery, IAuthorization } from '@tenlastic/ng-http';

import { FormService, IdentityService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class ArticlesFormPageComponent implements OnInit {
  public data: Article;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
  public types = [
    { label: 'Guide', value: 'Guide' },
    { label: 'News', value: 'News' },
    { label: 'Patch Notes', value: 'Patch Notes' },
  ];

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleService: ArticleService,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.AuthorizationRole.ArticlesReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      if (params.articleId !== 'new') {
        this.data = await this.articleService.findOne(params.articleId);
      }

      this.setupForm();
    });
  }

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: Partial<Article> = {
      _id: this.data._id,
      body: this.form.get('body').value,
      caption: this.form.get('caption').value,
      namespaceId: this.form.get('namespaceId').value,
      title: this.form.get('title').value,
      type: this.form.get('type').value,
    };

    try {
      this.data = await this.formService.upsert(this.articleService, values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, { name: 'Name' });
    }
  }

  private setupForm(): void {
    this.data = this.data || new Article();

    this.form = this.formBuilder.group({
      body: [this.data.body, Validators.required],
      caption: [this.data.caption],
      namespaceId: [this.params.namespaceId, Validators.required],
      title: [this.data.title, Validators.required],
      type: [this.data.type || this.types[0].value, Validators.required],
    });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }
}
