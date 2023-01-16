import {
  DocumentType,
  getModelForClass,
  modelOptions,
  pre,
  prop,
  PropType,
} from '@typegoose/typegoose';

import {
  GameServerStatusComponentDocument,
  GameServerStatusComponentModel,
  GameServerStatusComponentSchema,
} from './component';
import { GameServerStatusEndpointDocument, GameServerStatusEndpointSchema } from './endpoint';
import { GameServerStatusNodeDocument, GameServerStatusNodeSchema } from './node';

export enum GameServerStatusComponentName {
  Application = 'Application',
  Sidecar = 'Sidecar',
}

export enum GameServerStatusPhase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}

@modelOptions({ schemaOptions: { _id: false } })
@pre('save', function (this: GameServerStatusDocument) {
  if (this.isModified('components') || this.isNew) {
    this.setComponents();
    this.setPhase();
  }
})
export class GameServerStatusSchema {
  @prop({ type: GameServerStatusComponentSchema, unset: false }, PropType.ARRAY)
  public components: GameServerStatusComponentDocument[];

  @prop({ type: GameServerStatusEndpointSchema }, PropType.ARRAY)
  public endpoints: GameServerStatusEndpointDocument[];

  @prop({ type: String })
  public message: string;

  @prop({ type: GameServerStatusNodeSchema }, PropType.ARRAY)
  public nodes: GameServerStatusNodeDocument[];

  @prop({ default: () => GameServerStatusPhase.Pending, enum: GameServerStatusPhase, type: String })
  public phase: GameServerStatusPhase;

  @prop({ type: String })
  public version: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof GameServerStatusModel,
    values: Partial<GameServerStatusSchema> = {},
  ) {
    const defaults = { phase: GameServerStatusPhase.Running };

    return new this({ ...defaults, ...values });
  }

  /**
   * Sets components, filling in default values if missing.
   */
  private setComponents(this: GameServerStatusDocument) {
    const components: GameServerStatusComponentDocument[] = [
      new GameServerStatusComponentModel({
        current: 0,
        name: GameServerStatusComponentName.Application,
        phase: GameServerStatusPhase.Pending,
        total: 1,
      }),
      new GameServerStatusComponentModel({
        current: 0,
        name: GameServerStatusComponentName.Sidecar,
        phase: GameServerStatusPhase.Pending,
        total: 1,
      }),
    ];

    for (const component of this.components) {
      const index = components.findIndex((d) => d.name === component.name);
      components[index] = component;
    }

    this.components = components;
  }

  /**
   * Sets the phase.
   */
  private setPhase(this: GameServerStatusDocument) {
    let phase = GameServerStatusPhase.Pending;
    const statuses = [GameServerStatusPhase.Running, GameServerStatusPhase.Succeeded];

    if (this.nodes.some((n) => n.phase === GameServerStatusPhase.Error)) {
      phase = GameServerStatusPhase.Error;
    } else if (this.components.every((c) => statuses.includes(c.phase))) {
      phase = GameServerStatusPhase.Running;
    }

    this.phase = phase;
  }
}

export type GameServerStatusDocument = DocumentType<GameServerStatusSchema>;
export const GameServerStatusModel = getModelForClass(GameServerStatusSchema);
