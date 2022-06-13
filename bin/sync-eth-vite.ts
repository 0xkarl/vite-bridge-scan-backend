import './utils/dotenv';
import s from '../src/sync/eth-vite';

s.sync().then(
  () => {
    process.exit();
  },
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
