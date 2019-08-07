import { connect } from './connect';

const url = process.env.RABBITMQ_CONNECTION_STRING;

before(async function() {
  await connect({ url });
});
