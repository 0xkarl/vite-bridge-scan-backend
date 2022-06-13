import * as vite from '../../../vendor/vitejs/dist/index.node';
import Debug from 'debug';
import moment from 'moment';

import {
  getRedisLatestSyncBlockKey,
  saveTx,
  sanitizeAddress,
  Token,
  Channel,
} from '../utils';
import * as redis from '../../../utils/redis';
import { provider } from '../../../utils/vite';

type Log = {
  accountBlockHash: string;
  vmlog: { topics: string[]; data: string };
};

export default function ({
  channel,
  abiJSON,
  contracts,
}: {
  abiJSON: any;
  contracts: {
    vite: {
      address: string;
    };
    usdv: {
      address: string;
    };
  };
  channel: Channel;
}) {
  const debugs = Object.keys(contracts).reduce((r, t) => {
    r[t] = Debug(`backend:${channel}:${t}`);
    return r;
  }, {} as Record<string, any>);

  const events = abiJSON
    .filter((a: any) => !a.anonymous && a.name && a.type === 'event')
    .map((abi: any) => ({
      abi,
      putType: abi.name?.toLocaleLowerCase()!,
      logSignature: vite.abi.encodeLogSignature(abi),
    }));

  async function sync(fromZero?: boolean) {
    for (const t in contracts) {
      const token = t as Token;
      const { address } = contracts[token]!;
      if (!address) return;

      const debug = debugs[token];
      debug('sync');
      const currentBlock = await provider.request(
        'ledger_getLatestAccountBlock',
        address
      );
      const currentHeight = Number(currentBlock.height);
      debug('current height', currentHeight);

      const redisLatestSyncBlockKey = getRedisLatestSyncBlockKey(
        channel,
        token
      );
      let lastHeight = 0;
      if (!fromZero) {
        lastHeight = Number(
          (await redis.client.get(redisLatestSyncBlockKey)) ?? '0'
        );
      }
      debug('last height', lastHeight);

      if (currentHeight > lastHeight) {
        const logs: Log[] = await provider.request('ledger_getVmLogsByFilter', {
          addressHeightRange: {
            [address]: {
              fromHeight: lastHeight.toString(),
              toHeight: currentHeight.toString(),
            },
          },
        });

        if (logs.length) {
          await Promise.all(
            logs.reverse().map((log) => processLog(token, log))
          );
        }

        await redis.client.set(redisLatestSyncBlockKey, currentHeight);
      }
      debug('end');
    }
  }

  async function subscribe() {
    for (const t in contracts) {
      const token = t as Token;
      const { address } = contracts[token]!;
      if (!address) return;

      const debug = debugs[token];
      debug('subscribe');
      const redisLatestSyncBlockKey = getRedisLatestSyncBlockKey(
        channel,
        token
      );
      const lastHeight = parseInt(
        (await redis.client.get(redisLatestSyncBlockKey)) ?? '0'
      );
      if (lastHeight) {
        debug('last height', lastHeight);

        const filterParams = {
          addressHeightRange: {
            [address]: {
              fromHeight: lastHeight.toString(),
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

  async function processLog(token: Token, log: Log) {
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
          id,
          inputHash,
          outputHash,
          from,
          dest: to,
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
          inputHash: string;
          outputHash: string;
          value: any;
        };
        const oid = id || inputHash || outputHash;
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

        // console.log({
        //   oid,
        //   token,
        //   putType,
        //   from: !from ? null : sanitizeAddress(putType === 'input', from),
        //   to: !to ? null : sanitizeAddress(putType === 'output', to),
        //   fee,
        //   timestamp: Number(timestamp),
        //   amount,
        //   hash,
        //   chain,
        //   channel,
        // });
        await saveTx({
          oid,
          token,
          putType,
          from: !from ? null : sanitizeAddress(putType === 'input', from),
          to: !to ? null : sanitizeAddress(putType === 'output', to),
          fee,
          timestamp: Number(timestamp),
          amount,
          hash,
          chain,
          channel,
        });

        break;
      }
    }
  }

  return {
    sync,
    subscribe,
  };
}
