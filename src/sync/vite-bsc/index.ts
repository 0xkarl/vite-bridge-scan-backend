import vite from '../utils/vite';
import { IS_TESTNET } from '../../config';
import ABI_JSON from '../utils/vite/bsc.json';

const contracts = IS_TESTNET
  ? {
      vite: {
        address: 'vite_029b2a33f03a39009f96f141b7e1ae52c73830844f3b9804e8',
      },
      usdv: {
        address: '', // 'vite_9c337fe9a8d4828c80de00d5c3432f62c3dece4ac9062aa008',
      },
    }
  : {
      vite: {
        address: '',
      },
      usdv: {
        address: '',
      },
    };

export default vite({
  channel: 'vite-bsc',
  contracts,
  abiJSON: ABI_JSON,
});
