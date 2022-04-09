import './utils/dotenv';
import { sync } from '../src/sync/vite';

sync(true).then(
  () => {
    process.exit();
  },
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
