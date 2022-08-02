import { Directive, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';

import { IdentityService } from '../../../core/services';

@Directive({ selector: '[appDownload]' })
export class DownloadDirective implements OnDestroy, OnInit {
  @Input() public appDownload: string;

  @HostBinding('style.background-image')
  public backgroundImage: string;

  @HostBinding('attr.src')
  public src: string;

  constructor(private identityService: IdentityService) {}

  public async ngOnInit() {
    const worker = new Worker(new URL('../../../workers/download.worker', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = ({ data }) => {
      const url = URL.createObjectURL(data.blob);
      this.backgroundImage = `url('${url}')`;
    };

    const accessToken = await this.identityService.getAccessToken();
    worker.postMessage({ accessToken: accessToken.value, url: this.appDownload });
  }

  public ngOnDestroy() {}
}
