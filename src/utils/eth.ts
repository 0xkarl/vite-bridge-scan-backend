import * as ethers from 'ethers';

import { ETH_WEB3_PROVIDER } from '../config';

export const provider = new ethers.providers.JsonRpcProvider(ETH_WEB3_PROVIDER);
