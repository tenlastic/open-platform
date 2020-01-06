import { Injectable } from '@angular/core';
import * as childProcess from 'child_process';
import { ipcRenderer, webFrame, remote } from 'electron';
import * as fs from 'fs';

import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ElectronService {
  public childProcess: typeof childProcess;
  public fs: typeof fs;
  public ipcRenderer: typeof ipcRenderer;
  public remote: typeof remote;
  public webFrame: typeof webFrame;

  public get isElectron(): boolean {
    const { process } = window as any;
    return process && Boolean(process.type);
  }

  constructor() {
    if (!this.isElectron) {
      return;
    }

    const { require } = window as any;

    this.childProcess = require('child_process');
    this.fs = require('fs');
    this.ipcRenderer = require('electron').ipcRenderer;
    this.remote = require('electron').remote;
    this.webFrame = require('electron').webFrame;

    this.inspectElementHandler();
  }

  private inspectElementHandler() {
    const { Menu, MenuItem } = this.remote;

    let rightClickPosition = null;

    const menu = new Menu();
    const menuItem = new MenuItem({
      label: 'Inspect Element',
      click: () => {
        const w = this.remote.getCurrentWebContents() as any;
        w.inspectElement(rightClickPosition.x, rightClickPosition.y);
      },
    });
    menu.append(menuItem);

    window.addEventListener(
      'contextmenu',
      e => {
        e.preventDefault();
        rightClickPosition = { x: e.x, y: e.y };
        menu.popup();
      },
      false,
    );
  }
}
