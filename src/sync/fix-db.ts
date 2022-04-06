import * as db from '../utils/db';

export default scan;

async function scan() {
  const c = await db.collection();
  const docs = await c.find().toArray();
  await c.bulkWrite(
    docs.map((doc) => ({
      updateMany: {
        filter: { oid: doc.oid },
        update: {
          $set: { from: doc.from.toLowerCase(), to: doc.to.toLowerCase() },
        },
        upsert: false,
      },
    }))
  );
}
