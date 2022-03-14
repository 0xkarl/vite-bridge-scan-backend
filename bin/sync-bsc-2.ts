import './utils/dotenv';
import { scan2 as sync } from '../src/sync/bsc';

sync().then(
  () => {
    process.exit();
  },
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
