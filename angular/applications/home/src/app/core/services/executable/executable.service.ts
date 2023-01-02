import { Injectable } from '@angular/core';
import { GameServerModel, StorefrontService, TokenService } from '@tenlastic/http';
import { ChildProcess } from 'child_process';

import { ElectronService } from '../../services/electron/electron.service';

export interface ExecutableServicePlayOptions {
  gameServer?: GameServerModel;
  groupId?: string;
}

@Injectable({ providedIn: 'root' })
export class ExecutableService {
  private childProcesses: { [key: string]: ChildProcess } = {};
  private get installPath() {
    return this.electronService.installPath;
  }

  constructor(
    private electronService: ElectronService,
    private storefrontService: StorefrontService,
    private tokenService: TokenService,
  ) {}

  public isRunning(namespaceId: string) {
    return Boolean(this.childProcesses[namespaceId]);
  }

  public async start(
    entrypoint: string,
    namespaceId: string,
    options: ExecutableServicePlayOptions = {},
  ) {
    let childProcess = this.childProcesses[namespaceId];
    if (childProcess) {
      return;
    }

    const accessToken = await this.tokenService.getAccessToken();
    const refreshToken = this.tokenService.getRefreshToken();

    const storefronts = await this.storefrontService.find(namespaceId, {});
    const env = {
      ...process.env,
      ACCESS_TOKEN: accessToken.value,
      GAME_SERVER_JSON: options.gameServer ? JSON.stringify(options.gameServer) : null,
      GROUP_ID: options.groupId,
      REFRESH_TOKEN: refreshToken.value,
      STOREFRONT_JSON: storefronts.length > 0 ? JSON.stringify(storefronts[0]) : null,
    };
    const target = `${this.installPath}/${namespaceId}/${entrypoint}`;

    childProcess = this.electronService.childProcess.execFile(target, null, { env });
    childProcess.on('close', () => delete this.childProcesses[namespaceId]);
    this.childProcesses[namespaceId] = childProcess;
  }

  public stop(namespaceId: string) {
    const childProcess = this.childProcesses[namespaceId];
    childProcess?.kill();
  }
}
