import * as ethers from 'ethers';

import { BSC_WEB3_PROVIDER } from '../config';

export const provider = new ethers.providers.JsonRpcProvider(BSC_WEB3_PROVIDER);
