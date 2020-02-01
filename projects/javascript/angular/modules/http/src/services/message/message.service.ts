import { EventEmitter, Injectable } from '@angular/core';

import { Message } from '../../models/message';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

export interface MessageServiceUploadOptions {
  background?: Blob;
  icon?: Blob;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  public basePath: string;

  public onCreate = new EventEmitter<Message>();
  public onDelete = new EventEmitter<Message>();
  public onUpdate = new EventEmitter<Message>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.messageApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<Message>): Promise<Message> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new Message(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Message> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Message(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Message[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    return response.records.map(record => new Message(record));
  }

  public async findOne(_id: string): Promise<Message> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    return new Message(response.record);
  }

  public async update(parameters: Partial<Message>): Promise<Message> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Message(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
