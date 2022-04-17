import * as ethers from 'ethers';
import Debug from 'debug';
import moment from 'moment';

import { BSC_CONTRACTS } from '../../config';
import { sleep } from '../../utils/promise';
import {
  getRedisLatestSyncBlockKey,
  saveTx as baseSaveTx,
  sanitizeAddress,
  Token,
} from '../../sync/utils';
import * as redis from '../../utils/redis';
import { provider } from '../../utils/bsc';
import ABI from './channel.json';

const debugs = Object.keys(BSC_CONTRACTS).reduce((r, t) => {
  r[t] = Debug('backend:b:' + t);
  return r;
}, {} as Record<string, any>);

export async function sync() {
  for (const t in BSC_CONTRACTS) {
    const token = t as Token;
    const debug = debugs[token];

    const { address, creationBlock } = BSC_CONTRACTS[token]!;
    const contract = new ethers.Contract(address, ABI, provider);
    const redisLatestSyncBlockKey = getRedisLatestSyncBlockKey('bsc', token);
    const currentBlock = await provider.getBlockNumber();

    debug('current block', currentBlock);

    let fromBlock: number, toBlock: number;

    const lastBlockString = await redis.client.get(redisLatestSyncBlockKey);
    const lastBlock = lastBlockString
      ? parseInt(lastBlockString)
      : creationBlock;

    debug('last block', lastBlock);

    fromBlock = lastBlock || creationBlock;
    toBlock = fromBlock + 5_000;
    if (toBlock > currentBlock) {
      toBlock = currentBlock;
    }

    await saveTxs({ contract, token, fromBlock, toBlock, debug });

    debug('end');
    await redis.client.set(redisLatestSyncBlockKey, toBlock.toString());

    if (toBlock !== currentBlock) {
      await sleep(1_000);
      await sync();
    }
  }
}

export async function sync2(toBlock?: number) {
  for (const t in BSC_CONTRACTS) {
    const token = t as Token;
    const debug = debugs[token];

    const { address } = BSC_CONTRACTS[token]!;

    const contract = new ethers.Contract(address, ABI, provider);
    if (!toBlock) {
      toBlock = await provider.getBlockNumber();
    }
    const fromBlock = toBlock - 5_000;

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
        from,
        // dest: to,
        id: ethId,
        value,
      } = event.args!;
      const chain = 'bsc';
      const id = ethId.replace('0x', '');
      const amount = value.toString();
      const timestamp = Number(timestampBN.toString());

      const hash = receipt.transactionHash;
      const gasUsed =
        receipt.cumulativeGasUsed ||
        receipt.gasUsed ||
        ethers.BigNumber.from('0');
      const gasPrice = receipt.effectiveGasPrice || ethers.BigNumber.from('0');
      const fee = gasUsed.mul(gasPrice).toString();

      debug(
        'saving',
        putType,
        moment.unix(timestamp).local().toISOString(),
        from
        // to
      );

      await baseSaveTx({
        id,
        token,
        putType,
        from: !from
          ? null
          : sanitizeAddress(putType === 'input' ? 'bsc' : 'vite', from),
        // the to address here is truncated for some reason
        // to, // 00 error   !to ? null : sanitizeAddress(putType === 'output' ? 'bsc' : 'vite', to),
        fee,
        timestamp,
        amount,
        hash,
        chain,
      });
    }
  }
}

export async function subscribe() {
  for (const t in BSC_CONTRACTS) {
    const token = t as Token;
    const debug = debugs[token];
    debug('subscribe');
    const { address } = BSC_CONTRACTS[token]!;
    provider.on({ address }, () => {
      sync();
    });
  }
}
