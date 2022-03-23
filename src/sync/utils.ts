import * as redis from '../utils/redis';
import * as db from '../utils/db';

export type Token = 'vite' | 'usdv';

export type Chain = 'bsc' | 'vite';

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

export function sanitizeAddress(chain: Chain, address: string): string {
  const addr = address.replace('0x', '').replace('vite_', '');
  if (chain === 'vite') {
    return `vite_${addr}`;
  } else {
    return `0x${addr}`;
  }
}

export async function saveTx({
  id,
  token,
  putType,
  from,
  to,
  fee,
  timestamp,
  amount,
  hash,
  chain,
}: {
  id: string;
  token: Token;
  putType: PutType;
  from?: string;
  to?: string;
  fee: string;
  timestamp: string;
  amount: string;
  hash: string;
  chain: Chain;
}) {
  const dbUpdate: Record<string, any> = {};

  if (from) {
    dbUpdate.from = sanitizeAddress(chain, from);
  }
  if (to) {
    dbUpdate.to = sanitizeAddress(chain === 'vite' ? 'bsc' : 'vite', to);
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
    { oid: id },
    { $set: { ...dbUpdate, token } },
    { upsert: true }
  );
}
