import { createClient } from 'redis';
import { IS_TESTNET } from '../config';

export const client = createClient({ url: process.env.REDIS_URL! });

(async () => {
  client.on('error', (err) => console.log('redis client error', err));
  await client.connect();
})();

export function prefix(s: string) {
  return `vite:${IS_TESTNET ? 'testnet' : 'mainnet'}:${s}`;
}
