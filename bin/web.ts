import './utils/dotenv';

import { PORT } from '../src/config';
import app from '../src/web';

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
