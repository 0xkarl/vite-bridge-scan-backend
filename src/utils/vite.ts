import * as vite from '../vendor/vitejs/dist/index.node';
import * as viteHttp from '../vendor/vitejs-http/dist/index.node';

import { VITE_PROVIDER_URL } from '../config';

export const provider = new vite.ViteAPI(
  new viteHttp.HTTP_RPC(VITE_PROVIDER_URL),
  () => {}
);
