import './utils/dotenv';
import s from '../src/sync/set-confirmed';

s().then(
  () => {
    process.exit();
  },
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
