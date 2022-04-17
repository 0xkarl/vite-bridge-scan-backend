import Debug from 'debug';
import * as db from '../utils/db';
import { provider as viteProvider } from '../utils/vite';
import { provider as bscProvider } from '../utils/bsc';
import { Chain } from '../sync/utils';

const debug = Debug('backend:set-confirmed');
const MAX_VITE_CONFIRMATIONS = 100;
const MAX_BSC_CONFIRMATIONS = 10;
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
  const maxConfirmations =
    chain === 'vite' ? MAX_VITE_CONFIRMATIONS : MAX_BSC_CONFIRMATIONS;

  if (chain && hash) {
    if (chain === 'vite') {
      const x = await viteProvider.request(
        'ledger_getAccountBlockByHash',
        hash
      );
      if (x) {
        confirmations = Number(x.confirmations);
      }
    } else {
      const x = await bscProvider.getTransaction(hash);
      if (x) {
        confirmations = Number(x.confirmations);
      }
    }
  }
  debug(`doc(${oid}): ${put}(${confirmations}/${maxConfirmations})`);
  return confirmations && maxConfirmations
    ? confirmations >= maxConfirmations
    : false;
}
