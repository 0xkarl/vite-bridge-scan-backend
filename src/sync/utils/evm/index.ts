import * as ethers from 'ethers';
import Debug from 'debug';
import moment from 'moment';

import { sleep } from '../../../utils/promise';
import {
  getRedisLatestSyncBlockKey,
  saveTx as baseSaveTx,
  sanitizeAddress,
  Token,
  Chain,
  Channel,
} from '../utils';
import * as redis from '../../../utils/redis';

export default function ({
  chain,
  channel,
  provider,
  contracts,
  abiJSON,
  blocksPage,
}: {
  chain: Chain;
  channel: Channel;
  provider: ethers.providers.JsonRpcProvider;
  contracts: {
    vite: {
      address: string;
      creationBlock: number;
    };
    usdv: {
      address: string;
      creationBlock: number;
    };
  };
  abiJSON: any;
  blocksPage: number;
}) {
  const debugs = Object.keys(contracts).reduce((r, t) => {
    r[t] = Debug('backend:b:' + t);
    return r;
  }, {} as Record<string, any>);

  async function sync() {
    for (const t in contracts) {
      const token = t as Token;
      const { address, creationBlock } = contracts[token]!;
      if (!address) return;

      const debug = debugs[token];
      const contract = new ethers.Contract(address, abiJSON, provider);
      const redisLatestSyncBlockKey = getRedisLatestSyncBlockKey(
        channel,
        token
      );
      const currentBlock = await provider.getBlockNumber();

      debug('current block', currentBlock);

      let fromBlock: number, toBlock: number;

      const lastBlockString = await redis.client.get(redisLatestSyncBlockKey);
      const lastBlock = lastBlockString
        ? parseInt(lastBlockString)
        : creationBlock;

      debug('last block', lastBlock);

      fromBlock = lastBlock || creationBlock;
      toBlock = fromBlock + blocksPage;
      if (toBlock > currentBlock) {
        toBlock = currentBlock;
      }

      await saveTxs({ contract, token, fromBlock, toBlock, debug });

      debug('end', toBlock.toString());
      await redis.client.set(redisLatestSyncBlockKey, toBlock.toString());

      if (toBlock !== currentBlock) {
        await sleep(1_000);
        await sync();
      }
    }
  }

  async function sync2(toBlock?: number) {
    for (const t in contracts) {
      const token = t as Token;
      const debug = debugs[token];

      const { address } = contracts[token]!;

      const contract = new ethers.Contract(address, abiJSON, provider);
      if (!toBlock) {
        toBlock = await provider.getBlockNumber();
      }
      const fromBlock = toBlock - blocksPage;

      await saveTxs({ contract, token, fromBlock, toBlock, debug });

      debug('end');

      await sleep(1_000);
      await sync2(fromBlock);
    }
  }

  async function saveTxs({
    contract,
    token,
    fromBlock,
    toBlock,
    debug,
  }: {
    contract: ethers.Contract;
    token: Token;
    fromBlock: number;
    toBlock: number;
    debug: (...args: any) => void;
  }) {
    debug('syncing', fromBlock, toBlock);

    // @ts-ignore
    const events = await contract.queryFilter('*', fromBlock, toBlock);

    for (const event of events) {
      const putType = event.event?.toLocaleLowerCase();
      if (putType === 'input' || putType === 'output') {
        const { timestamp: timestampBN } = await event.getBlock();
        const receipt = await event.getTransactionReceipt();
        const {
          id,
          inputHash,
          outputHash,
          from,
          // dest: to,
          value,
        } = event.args!;
        const ethId = id || inputHash || outputHash;
        const oid = ethId.replace('0x', '');
        const amount = value.toString();
        const timestamp = Number(timestampBN.toString());

        const hash = receipt.transactionHash;
        const gasUsed =
          receipt.cumulativeGasUsed ||
          receipt.gasUsed ||
          ethers.BigNumber.from('0');
        const gasPrice =
          receipt.effectiveGasPrice || ethers.BigNumber.from('0');
        const fee = gasUsed.mul(gasPrice).toString();

        debug(
          'saving',
          putType,
          moment.unix(timestamp).local().toISOString(),
          from
          // to
        );

        console.log({
          oid,
          token,
          putType,
          from: !from ? null : sanitizeAddress(putType !== 'input', from),
          // the to address here is truncated for some reason
          // to, // 00 error   !to ? null : sanitizeAddress(putType !== 'output', to),
          fee,
          timestamp,
          amount,
          hash,
          chain,
          channel,
        });
        await baseSaveTx({
          oid,
          token,
          putType,
          from: !from ? null : sanitizeAddress(putType !== 'input', from),
          // the to address here is truncated for some reason
          // to, // 00 error   !to ? null : sanitizeAddress(putType !== 'output', to),
          fee,
          timestamp,
          amount,
          hash,
          chain,
          channel,
        });
      }
    }
  }

  async function subscribe() {
    for (const t in contracts) {
      const token = t as Token;
      const debug = debugs[token];
      debug('subscribe');
      const { address } = contracts[token]!;
      provider.on({ address }, () => {
        sync();
      });
    }
  }

  return {
    sync,
    sync2,
    subscribe,
  };
}
