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

  public async create(parameters: Partial<Article>): Promise<Article> {
    const response = await this.apiService.request('post', `${this.basePath}`, parameters);

    const record = new Article(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Article> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Article(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Article[]> {
    const response = await this.apiService.request('get', `${this.basePath}`, parameters);

    return response.records.map(record => new Article(record));
  }

  public async findOne(_id: string): Promise<Article> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    return new Article(response.record);
  }

  public async update(parameters: Partial<Article>): Promise<Article> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Article(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
