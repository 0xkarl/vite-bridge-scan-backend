import './utils/dotenv';
import s from '../src/sync/bsc-vite';

s.sync().then(
  () => {
    process.exit();
  },
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
