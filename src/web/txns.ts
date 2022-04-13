import express from 'express';
import * as db from '../utils/db';
import { ResponseError } from '../types';

const DEFAULT_PAGE_COUNT = 10;

export default function () {
  const app = express.Router();

  app.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    const txn = await (
      await db.collection()
    ).findOne({
      oid: id,
    });
    if (!txn?.input) {
      const err = new ResponseError(`unknown txn(${id})`);
      err.status = 404;
      return next();
    }
    res.json(formatTxn(txn));
  });

  app.get('/', async (req, res) => {
    const { query } = req;

    const pageArg = parseNumberQueryParam(query.page as string, 0);
    const countArg = parseNumberQueryParam(
      query.count as string,
      DEFAULT_PAGE_COUNT
    );
    const address = ((query.address as string) || '').trim().toLowerCase();

    const count = countArg > DEFAULT_PAGE_COUNT ? DEFAULT_PAGE_COUNT : countArg;
    const frm = pageArg * count;

    const dbQuery: Record<string, any> = {
      input: { $exists: true },
    };
    if (query.address) {
      dbQuery['$or'] = [
        {
          from: address,
        },
        {
          to: address,
        },
      ];
    }

    const c = await db.collection();
    const [totalCount, txns] = await Promise.all([
      c.count(dbQuery),
      c.find(dbQuery).sort('input.timestamp', -1).skip(frm).limit(count),
    ]);

    res.json({
      totalCount,
      data: (await txns.toArray()).map(formatTxn),
    });
  });

  return app;
}

function formatTxn(txn: any) {
  txn.id = txn.oid;
  delete txn.oid;
  delete txn._id;
  if (!txn.output) {
    txn.output = {
      chain: txn.input.chain === 'bsc' ? 'vite' : 'bsc',
    };
  }
  return txn;
}

function parseNumberQueryParam(s: string, defaultVal: number): number {
  if (s === undefined || s === null) return defaultVal;
  const val = parseInt(s);
  if (isNaN(val)) return defaultVal;
  return val;
}
