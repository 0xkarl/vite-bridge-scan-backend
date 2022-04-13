import express from 'express';
import moment from 'moment';
import range from 'lodash/range';
import * as db from '../utils/db';

export default function () {
  const app = express.Router();

  app.get('/', async (req, res) => {
    const c = await db.collection();
    const [noOfTransactions, uniqAddresses, txs] = await Promise.all([
      c.estimatedDocumentCount(),
      c.aggregate([
        {
          $group: {
            _id: {
              from: '$from',
              to: '$to',
            },
          },
        },
      ]),
      c.aggregate([
        {
          $match: {
            'input.timestamp': {
              $gte: moment.utc().add(-8, 'days').unix(),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: {
                  $toDate: {
                    $multiply: [1000, '$input.timestamp'],
                  },
                },
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const noOfAddresses = (await uniqAddresses.toArray()).length;
    const series = (await txs.toArray()).reduce((r, s) => {
      r[s._id] = s.count;
      return r;
    }, {} as Record<string, number>);

    res.json({
      chart: {
        series: [
          {
            data: range(0, 7)
              .reverse()
              .map((i: number) => {
                const x = moment.utc().add(-1 * i, 'days');
                return {
                  x: x.unix(),
                  y: series[x.format('YYYY-MM-DD')] || 0,
                };
              }),
          },
        ],
      },
      noOfAddresses,
      noOfTransactions,
    });
  });

  return app;
}
