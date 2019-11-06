import { Injectable } from '@angular/core';

import { ApiService } from '@app/core/http/api/api.service';

export interface ContactUsParameters {
  email: string;
  message?: string;
  name: string;
}

@Injectable()
export class MiscellaneousService {

  public basePath = '/v1/miscellaneous';

  constructor(private apiService: ApiService) {}

  public contactUs(params: ContactUsParameters) {
    const path = this.basePath + '/contact-us';

    return this.apiService.request('post', path, params);
  }

}
