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

const debugs = Object.keys(VITE_CONTRACTS).reduce((r, t) => {
  r[t] = Debug('backend:v:' + t);
  return r;
}, {} as Record<string, any>);

const events = ABI.filter(
  (a) => !a.anonymous && a.name && a.type === 'event'
).map((abi) => ({
  abi,
  putType: abi.name?.toLocaleLowerCase()!,
  logSignature: vite.abi.encodeLogSignature(abi),
}));

const provider = new vite.ViteAPI(
  new viteHttp.HTTP_RPC(VITE_PROVIDER_URL),
  () => {}
);

type Log = {
  accountBlockHash: string;
  vmlog: { topics: string[]; data: string };
};

export async function sync(fromZero?: boolean) {
  for (const t in VITE_CONTRACTS) {
    const token = t as Token;
    const debug = debugs[token];

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

    const logs: Log[] = await provider.request('ledger_getVmLogsByFilter', {
      addressHeightRange: {
        [address]: {
          fromHeight: lastHeight.toString(),
          toHeight: currentHeight.toString(),
        },
      },
    });

    if (!logs.length) return;

    await Promise.all(logs.reverse().map((log) => processLog(token, log)));

    debug('end');
    await redis.client.set(redisLatestSyncBlockKey, currentHeight);
  }
}

export async function subscribe() {
  for (const t in VITE_CONTRACTS) {
    const token = t as Token;
    const debug = debugs[token];
    debug('subscribe');
    const { address } = VITE_CONTRACTS[token]!;

    const redisLatestSyncBlockKey = getRedisLatestSyncBlockKey('vite', token);
    const lastHeight = parseInt(
      (await redis.client.get(redisLatestSyncBlockKey)) ?? '0'
    );
    if (lastHeight) {
      debug('last height', lastHeight);

      const filterParams = {
        addressHeightRange: {
          [address]: {
            fromHeight: '0',
            toHeight: '0',
          },
        },
      };

      try {
        const event = await provider.subscribe('createVmLog', filterParams);
        event.on((logs: any[]) => {
          if (logs.length) {
            sync();
          }
        });
      } catch (e) {
        console.log(e);
      }
    }
  }
}

const processLog = async (token: Token, log: Log) => {
  const debug = debugs[token];

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
};
