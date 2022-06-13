import Debug from 'debug';
import * as db from '../utils/db';
import { provider as viteProvider } from '../utils/vite';
import { provider as bscProvider } from '../utils/bsc';
import { provider as ethProvider } from '../utils/eth';
import { Chain } from './utils/utils';

const debug = Debug('backend:set-confirmed');
const MAX_VITE_CONFIRMATIONS = 100;
const MAX_BSC_CONFIRMATIONS = 10;
const MAX_ETH_CONFIRMATIONS = 10;
const PUTS = ['input', 'output'];

export default scan;

async function scan() {
  const c = await db.collection();
  const docs = await c
    .find({
      $or: PUTS.map((put) => ({
        [`${put}.confirmed`]: { $ne: true },
      })),
    })
    .toArray();
  debug(`docs: ${docs.length}`);
  if (!docs.length) return;

  const docToUpdate: Record<string, Record<string, boolean>> = {};
  for (const doc of docs) {
    debug(`doc(${doc.oid})`);
    const set: Record<string, boolean> = {};
    for (const put of PUTS) {
      const putVal = doc[put];
      if (putVal && !putVal.confirmed) {
        const confirmed = await getConfirmed(doc.oid, put, putVal);
        if (confirmed) {
          set[`${put}.confirmed`] = true;
        }
      }
    }
    if (Object.keys(set).length) {
      docToUpdate[doc.oid] = set;
    }
  }

  const bulkWriteOpts = Object.entries(docToUpdate).map(([oid, set]) => ({
    updateMany: {
      filter: { oid },
      update: {
        $set: set,
      },
      upsert: false,
    },
  }));
  if (!bulkWriteOpts.length) return;

  await c.bulkWrite(bulkWriteOpts);
}

type Put = {
  chain: Chain;
  hash: string | null;
};

async function getConfirmed(oid: string, put: string, { chain, hash }: Put) {
  let confirmations = 0;
  let maxConfirmations;

  switch (chain) {
    case 'vite': {
      maxConfirmations = MAX_VITE_CONFIRMATIONS;
      break;
    }
    case 'bsc': {
      maxConfirmations = MAX_BSC_CONFIRMATIONS;
      break;
    }
    case 'eth': {
      maxConfirmations = MAX_ETH_CONFIRMATIONS;
      break;
    }
    default:
      throw new Error(`unknown chain (${chain})`);
  }

  if (chain && hash) {
    let x;
    switch (chain) {
      case 'vite': {
        x = await viteProvider.request('ledger_getAccountBlockByHash', hash);
        break;
      }
      case 'bsc': {
        x = await bscProvider.getTransaction(hash);
        break;
      }
      case 'eth': {
        x = await ethProvider.getTransaction(hash);
        break;
      }
      default:
        throw new Error(`unknown chain (${chain})`);
    }

    if (x) {
      confirmations = Number(x.confirmations);
    }
  }
  debug(`doc(${oid}): ${put}(${confirmations}/${maxConfirmations})`);
  return confirmations && maxConfirmations
    ? confirmations >= maxConfirmations
    : false;
}
