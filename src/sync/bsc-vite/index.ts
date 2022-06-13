import evm from '../utils/evm';
import { IS_TESTNET } from '../../config';
import { provider } from '../../utils/bsc';
import ABI_JSON from '../utils/evm/bsc.json';

const contracts = IS_TESTNET
  ? {
      vite: {
        address: '0xEa52147b9b1d2bf069Da858eFE78bB2aC3dc2EA0',
        creationBlock: 14560344,
      },
      usdv: {
        address: '0x1fF7EFed79585D43FB1c637064480E10c21dB709',
        creationBlock: 14560309,
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
  channel: 'bsc-vite',
  chain: 'bsc',
  provider,
  contracts,
  abiJSON: ABI_JSON,
  blocksPage: 5_000,
});
