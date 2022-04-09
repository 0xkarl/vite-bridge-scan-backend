import './utils/dotenv';
import { sync } from '../src/sync/bsc';

sync().then(
  () => {
    process.exit();
  },
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
