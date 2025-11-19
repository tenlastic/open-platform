import { ArticleModel } from '../models';
import { ArticleService } from '../services';
import { BaseState } from './base';

export class ArticleState extends BaseState<ArticleModel, ArticleService> {
  constructor(service: ArticleService) {
    super('_id', service);
  }
}
