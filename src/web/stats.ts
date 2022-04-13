import express from 'express';
import moment from 'moment';
import range from 'lodash/range';
import * as db from '../utils/db';

export default function () {
  const app = express.Router();

  app.get('/', async (req, res) => {
    const c = await db.collection();
    const [noOfTransactions, uniqFromsCursor, uniqTosCursor, txsCursor] =
      await Promise.all([
        c.estimatedDocumentCount(),
        c.aggregate([
          {
            $group: {
              _id: '$from',
              count: { $sum: 1 },
            },
          },
        ]),
        c.aggregate([
          {
            $group: {
              _id: '$to',
              count: { $sum: 1 },
            },
          },
        ]),
        c.aggregate([
          {
            $match: {
              'input.timestamp': {
                $exists: true,
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

    const uniqFroms = await uniqFromsCursor.toArray();
    const uniqTos = await uniqTosCursor.toArray();
    const uniqAddresses = [...uniqFroms, ...uniqTos].reduce((r, a) => {
      if (a._id) {
        r[a._id.toLowerCase()] = r[a._id.toLowerCase()] || 1;
      }
      return r;
    }, {} as Record<string, number>);

    const series = (await txsCursor.toArray()).reduce((r, s) => {
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
      noOfAddresses: Object.keys(uniqAddresses).length,
      noOfTransactions,
    });
  });

  return app;
}
