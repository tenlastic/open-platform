import * as nats from '@tenlastic/nats';

export async function getNatsStorage(stream: string) {
  const jsm = await nats.getJetStreamManager();
  const { state } = await jsm.streams.info(stream);
  return state.bytes;
}
