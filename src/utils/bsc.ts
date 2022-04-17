import * as ethers from 'ethers';

import { BSC_WEB3_PROVIDER, BSC_CONTRACTS } from '../config';

export const provider = new ethers.providers.JsonRpcProvider(BSC_WEB3_PROVIDER);
