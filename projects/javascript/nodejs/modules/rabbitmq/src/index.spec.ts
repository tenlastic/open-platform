import { connect } from './connect';

const url = process.env.RABBITMQ_CONNECTION_STRING;

before(async function() {
  this.timeout(60 * 1000);
  await connect({ url });
});
