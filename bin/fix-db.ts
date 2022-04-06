import './utils/dotenv';
import scan from '../src/sync/fix-db';

scan().then(
  () => {
    process.exit();
  },
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
