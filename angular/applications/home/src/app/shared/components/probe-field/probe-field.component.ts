import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IGameServer } from '@tenlastic/http';

export enum ProbeType {
  Exec,
  Http,
  None,
  Tcp,
}

export interface ProbeFormGroup {
  command?: string;
  failureThreshold?: number;
  initialDelaySeconds?: number;
  path?: string;
  periodSeconds?: number;
  port?: number;
  successThreshold?: number;
  timeoutSeconds?: number;
  type?: ProbeType;
}

@Component({
  selector: 'app-probe-field',
  styleUrls: ['probe-field.component.scss'],
  templateUrl: 'probe-field.component.html',
})
export class ProbeFieldComponent implements OnInit {
  @Input() public form: FormGroup;

  public ProbeType = ProbeType;
  public get type() {
    return this.form.get('type').value;
  }

  public static getFormGroupFromProbe(probe: IGameServer.Probe) {
    return new FormGroup({
      command: new FormControl(probe?.exec?.command.join(' ')),
      failureThreshold: new FormControl(probe?.failureThreshold),
      initialDelaySeconds: new FormControl(probe?.initialDelaySeconds || 0),
      path: new FormControl(probe?.http?.path || '/'),
      periodSeconds: new FormControl(probe?.periodSeconds),
      port: new FormControl(probe?.http?.port || probe?.tcp?.port || 80),
      successThreshold: new FormControl(probe?.successThreshold),
      timeoutSeconds: new FormControl(probe?.timeoutSeconds),
      type: new FormControl(ProbeFieldComponent.getProbeType(probe)),
    });
  }

  public static getJsonFromProbe(probe: ProbeFormGroup) {
    const base: ProbeFormGroup = {
      ...(probe.failureThreshold ? { failureThreshold: probe.failureThreshold } : {}),
      ...(probe.initialDelaySeconds ? { initialDelaySeconds: probe.initialDelaySeconds } : {}),
      ...(probe.periodSeconds ? { periodSeconds: probe.periodSeconds } : {}),
      ...(probe.successThreshold ? { successThreshold: probe.successThreshold } : {}),
      ...(probe.timeoutSeconds ? { timeoutSeconds: probe.timeoutSeconds } : {}),
    };

    if (probe.type === ProbeType.Exec) {
      return { ...base, exec: { command: probe.command.split(' ') } };
    } else if (probe.type === ProbeType.Http) {
      return { ...base, http: { path: probe.path, port: probe.port } };
    } else if (probe.type === ProbeType.None) {
      return null;
    } else if (probe.type === ProbeType.Tcp) {
      return { ...base, tcp: { port: probe.port } };
    }
  }

  private static getProbeType(probe: IGameServer.Probe) {
    if (probe?.exec) {
      return ProbeType.Exec;
    } else if (probe?.http) {
      return ProbeType.Http;
    } else if (probe?.tcp) {
      return ProbeType.Tcp;
    }

    return ProbeType.None;
  }

  public ngOnInit() {
    this.form.get('type').valueChanges.subscribe((type) => this.updateValidators(type));
    this.updateValidators(this.type);
  }

  private updateValidators(type: ProbeType) {
    if (type === ProbeType.Exec) {
      this.form.get('command').addValidators([Validators.required]);
      this.form.get('path').removeValidators([Validators.required]);
      this.form.get('port').removeValidators([Validators.required]);
    } else if (type === ProbeType.Http) {
      this.form.get('command').removeValidators([Validators.required]);
      this.form.get('path').addValidators([Validators.required]);
      this.form.get('port').addValidators([Validators.required]);
    } else if (type === ProbeType.None) {
      this.form.get('command').removeValidators([Validators.required]);
      this.form.get('path').removeValidators([Validators.required]);
      this.form.get('port').removeValidators([Validators.required]);
    } else if (type === ProbeType.Tcp) {
      this.form.get('command').removeValidators([Validators.required]);
      this.form.get('path').removeValidators([Validators.required]);
      this.form.get('port').addValidators([Validators.required]);
    }

    this.form.get('command').updateValueAndValidity({ emitEvent: false });
    this.form.get('path').updateValueAndValidity({ emitEvent: false });
    this.form.get('port').updateValueAndValidity({ emitEvent: false });
  }
}
