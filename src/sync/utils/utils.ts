import * as redis from '../../utils/redis';
import * as db from '../../utils/db';

export type Token = 'vite' | 'usdv';

export type Channel = 'bsc-vite' | 'eth-vite' | 'vite-eth' | 'vite-bsc';

export type Chain = 'bsc' | 'vite' | 'eth';

export type PutType = 'input' | 'output';

export function getRedisLatestSyncBlockKey(
  chain: string,
  token: string
): string {
  return redis.prefix(`latest_sync_block_key:${chain}:${token}`);
}

export function getRedisTxnsKey(): string {
  return redis.prefix(`txns`);
}

export function getRedisTxnKey(id: string): string {
  return redis.prefix(`txn:${id}`);
}

export function sanitizeAddress(isVite: boolean, address: string): string {
  const addr = address.replace('0x', '').replace('vite_', '').toLowerCase();
  if (isVite) {
    return `vite_${addr}`;
  } else {
    return `0x${addr}`;
  }
}

export async function saveTx({
  oid,
  token,
  putType,
  from,
  to,
  fee,
  timestamp,
  amount,
  hash,
  chain,
  channel,
}: {
  oid: string;
  token: Token;
  putType: PutType;
  from?: string;
  to?: string;
  fee: string;
  timestamp: number;
  amount: string;
  hash: string;
  chain: Chain;
  channel: Channel;
}) {
  const dbUpdate: Record<string, any> = {};
  dbUpdate.channel = channel;
  if (from) {
    dbUpdate.from = from;
  }
  if (to) {
    dbUpdate.to = to;
  }
  if (putType === 'input') {
    dbUpdate.fee = fee;
    dbUpdate.input = {
      timestamp,
      amount,
      hash,
      chain,
    };
  } else {
    dbUpdate.output = {
      timestamp,
      amount,
      hash,
      chain,
    };
  }
  (await db.collection()).updateOne(
    { oid: oid },
    { $set: { ...dbUpdate, token } },
    { upsert: true }
  );
}
