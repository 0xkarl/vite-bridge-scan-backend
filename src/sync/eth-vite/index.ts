import evm from '../utils/evm';
import { IS_TESTNET } from '../../config';
import { provider } from '../../utils/eth';
import ABI_JSON from '../utils/evm/eth.json';

const contracts = IS_TESTNET
  ? {
      vite: {
        address: '0x649a886a441f3f956e6442e064c8958d191466a6',
        creationBlock: 10662680,
      },
      usdv: {
        address: '',
        creationBlock: 0,
      },
    }
  : {
      vite: {
        address: '',
        creationBlock: 0,
      },
      usdv: {
        address: '',
        creationBlock: 0,
      },
    };

export default evm({
  channel: 'eth-vite',
  chain: 'eth',
  provider,
  contracts,
  blocksPage: 100_000,
  abiJSON: ABI_JSON,
});
