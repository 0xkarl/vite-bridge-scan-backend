import './utils/dotenv';
import cron from 'node-cron';
import Debug from 'debug';
import { sync as syncBsc, subscribe as subscribeBsc } from '../src/sync/bsc';
import { sync as syncVite, subscribe as subscribeVite } from '../src/sync/vite';
import setConfirmed from '../src/sync/set-confirmed';

const debug = Debug('backend:cron');

// every 1 minutes
cron.schedule('*/1 * * * *', async function () {
  debug('running at', new Date());
  syncBsc();
  syncVite();
  setConfirmed();
});

subscribeVite().then(
  () => {},
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
subscribeBsc().then(
  () => {},
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
