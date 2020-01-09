import { Injectable } from '@angular/core';
import * as childProcess from 'child_process';
import { webFrame, remote } from 'electron';
import * as fs from 'fs';

export class IpcRendererMock {
  public on = () => {};
}

@Injectable()
export class ElectronServiceMock {
  public childProcess: typeof childProcess;
  public fs: typeof fs;
  public ipcRenderer = new IpcRendererMock();
  public remote: typeof remote;
  public webFrame: typeof webFrame;

  public get isElectron(): boolean {
    const { process } = window as any;
    return process && Boolean(process.type);
  }
}
