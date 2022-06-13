import './utils/dotenv';
import s from '../src/sync/vite-eth';

s.sync(true).then(
  () => {
    process.exit();
  },
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
