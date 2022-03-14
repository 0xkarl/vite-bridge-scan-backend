import './utils/dotenv';
import cron from 'node-cron';
import syncBsc from '../src/sync/bsc';
import syncVite from '../src/sync/vite';

// every 1 minutes
cron.schedule('*/1 * * * *', async function () {
  console.log('running at', new Date());
  syncBsc();
  syncVite();
});
