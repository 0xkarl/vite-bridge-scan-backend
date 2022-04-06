import * as viteHttp from '../../vendor/vitejs-http/dist/index.node';
import * as vite from '../../vendor/vitejs/dist/index.node';
import Debug from 'debug';
import moment from 'moment';

import { VITE_PROVIDER_URL, VITE_CONTRACTS } from '../../config';
import {
  getRedisLatestSyncBlockKey,
  saveTx,
  sanitizeAddress,
  Token,
} from '../../sync/utils';
import * as redis from '../../utils/redis';
import ABI from './channel.json';

const provider = new vite.ViteAPI(
  new viteHttp.HTTP_RPC(VITE_PROVIDER_URL),
  () => {}
);

export default scan;

async function scan(fromZero?: boolean) {
  for (const t in VITE_CONTRACTS) {
    const token = t as Token;
    const debug = Debug('vite:v:sync:' + token);

    const { address } = VITE_CONTRACTS[token]!;

    const currentBlock = await provider.request(
      'ledger_getLatestAccountBlock',
      address
    );
    const currentHeight = currentBlock.height;
    debug('current height', currentHeight);

    const redisLatestSyncBlockKey = getRedisLatestSyncBlockKey('vite', token);
    let lastHeight = 0;
    if (!fromZero) {
      lastHeight = parseInt(
        (await redis.client.get(redisLatestSyncBlockKey)) ?? '0'
      );
    }
    debug('last height', lastHeight);

    const logs = await provider.request('ledger_getVmLogsByFilter', {
      addressHeightRange: {
        [address]: {
          fromHeight: lastHeight.toString(),
          toHeight: currentHeight.toString(),
        },
      },
    });

    if (!logs.length) return;

    const events = ABI.filter(
      (a) => !a.anonymous && a.name && a.type === 'event'
    ).map((abi) => ({
      abi,
      putType: abi.name?.toLocaleLowerCase()!,
      logSignature: vite.abi.encodeLogSignature(abi),
    }));

    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      const {
        accountBlockHash,
        vmlog: { topics, data },
      } = log;

      for (const event of events) {
        const { putType, logSignature, abi } = event;
        if (
          (putType === 'input' || putType === 'output') &&
          logSignature === topics[0]
        ) {
          const { timestamp, fee } = await provider.request(
            'ledger_getAccountBlockByHash',
            accountBlockHash
          );

          const {
            from,
            dest: to,
            id,
            value,
          } = vite.abi.decodeLog(
            abi,
            !data
              ? undefined
              : vite.utils._Buffer.from(data, 'base64').toString('hex'),
            topics
          ) as {
            dest: string;
            from: string;
            id: string;
            value: any;
          };
          const hash = accountBlockHash;
          const chain = 'vite';
          const amount = value.toString();

          debug(
            'saving',
            putType,
            moment.unix(timestamp).local().toISOString(),
            from,
            to,
            hash
          );

          await saveTx({
            id,
            token,
            putType,
            from: !from
              ? null
              : sanitizeAddress(putType === 'input' ? 'vite' : 'bsc', from),
            to: !to
              ? null
              : sanitizeAddress(putType === 'output' ? 'vite' : 'bsc', to),
            fee,
            timestamp: Number(timestamp),
            amount,
            hash,
            chain,
          });

          break;
        }
      }
    }

    debug('end');
    await redis.client.set(redisLatestSyncBlockKey, currentHeight);
  }
}
