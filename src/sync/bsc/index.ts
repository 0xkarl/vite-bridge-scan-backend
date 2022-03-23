import * as ethers from 'ethers';
import Debug from 'debug';

import { BSC_WEB3_PROVIDER, BSC_CONTRACTS } from '../../config';
import { sleep } from '../../utils/promise';
import {
  getRedisLatestSyncBlockKey,
  saveTx as baseSaveTx,
  Token,
} from '../../sync/utils';
import * as redis from '../../utils/redis';
import ABI from './channel.json';

const provider = new ethers.providers.JsonRpcProvider(BSC_WEB3_PROVIDER);

export default scan;

async function scan() {
  for (const t in BSC_CONTRACTS) {
    const token = t as Token;
    const debug = Debug('vite:b:sync:' + token);

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
      await scan();
    }
  }
}

export async function scan2(toBlock?: number) {
  for (const t in BSC_CONTRACTS) {
    const token = t as Token;
    const debug = Debug('vite:b:sync:' + token);

    const { address } = BSC_CONTRACTS[token]!;

    const contract = new ethers.Contract(address, ABI, provider);
    if (!toBlock) {
      toBlock = await provider.getBlockNumber();
    }
    const fromBlock = toBlock - 5_000;

    await saveTxs({ contract, token, fromBlock, toBlock, debug });

    debug('end');

    await sleep(1_000);
    await scan2(fromBlock);
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
        id: ethId, value 
      } = event.args!;
      const chain = 'bsc';
      const id = ethId.replace('0x', '');
      const amount = value.toString();
      const timestamp = timestampBN.toString();

      const hash = receipt.transactionHash;
      const gasUsed =
        receipt.cumulativeGasUsed ||
        receipt.gasUsed ||
        ethers.BigNumber.from('0');
      const gasPrice = receipt.effectiveGasPrice || ethers.BigNumber.from('0');
      const fee = gasUsed.mul(gasPrice).toString();

      debug('saving', putType, id);

      await baseSaveTx({
        id,
        token,
        putType,
        from,
        // to, // 00 error
        fee,
        timestamp,
        amount,
        hash,
        chain,
      });
    }
  }
}
