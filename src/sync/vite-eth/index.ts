import vite from '../utils/vite';
import { IS_TESTNET } from '../../config';
import ABI_JSON from '../utils/vite/eth.json';

const contracts = IS_TESTNET
  ? {
      vite: {
        address: 'vite_44949d8b8fde6cd83c816d7f69581f781b68ca46cca72ec92c',
      },
      usdv: {
        address: '',
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
  channel: 'vite-eth',
  contracts,
  abiJSON: ABI_JSON,
});
