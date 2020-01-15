import { EventEmitter, Injectable } from '@angular/core';

import { Article } from '../../models/article';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class ArticleService {
  public basePath: string;

  public onCreate = new EventEmitter<Article>();
  public onDelete = new EventEmitter<Article>();
  public onUpdate = new EventEmitter<Article>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.gameApiBaseUrl;
  }

  public async create(gameSlug: string, parameters: Partial<Article>): Promise<Article> {
    const response = await this.apiService.request(
      'post',
      `${this.basePath}/${gameSlug}/articles`,
      parameters,
    );

    const record = new Article(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(gameSlug: string, _id: string): Promise<Article> {
    const response = await this.apiService.request(
      'delete',
      `${this.basePath}/${gameSlug}/articles/${_id}`,
      null,
    );

    const record = new Article(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(gameSlug: string, parameters: RestParameters): Promise<Article[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${gameSlug}/articles`,
      parameters,
    );

    return response.records.map(record => new Article(record));
  }

  public async findOne(gameSlug: string, _id: string): Promise<Article> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${gameSlug}/articles/${_id}`,
      null,
    );

    return new Article(response.record);
  }

  public async update(gameSlug: string, parameters: Partial<Article>): Promise<Article> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${gameSlug}/articles/${parameters._id}`,
      parameters,
    );

    const record = new Article(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
