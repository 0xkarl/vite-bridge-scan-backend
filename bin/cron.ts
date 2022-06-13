import './utils/dotenv';
import cron from 'node-cron';
import Debug from 'debug';
import viteToBsc from '../src/sync/vite-bsc';
import viteToEth from '../src/sync/vite-eth';
import bscToVite from '../src/sync/bsc-vite';
import ethToVite from '../src/sync/eth-vite';
import setConfirmed from '../src/sync/set-confirmed';

const debug = Debug('backend:cron');

// every 1 minutes
cron.schedule('*/1 * * * *', async function () {
  debug('running at', new Date());
  viteToBsc.sync();
  viteToEth.sync();
  bscToVite.sync();
  ethToVite.sync();
  setConfirmed();
});

viteToBsc.subscribe().then(
  () => {},
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
viteToEth.subscribe().then(
  () => {},
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
bscToVite.subscribe().then(
  () => {},
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
ethToVite.subscribe().then(
  () => {},
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
