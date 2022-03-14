export const PORT = process.env.PORT;
export const PRODUCTION = 'production' === process.env.NODE_ENV;

export const IS_TESTNET =
  process.env.IS_TESTNET === 'true' || process.env.IS_TESTNET === '1';

export const BSC_WEB3_PROVIDER = IS_TESTNET
  ? 'https://data-seed-prebsc-1-s1.binance.org:8545'
  : 'https://bsc-dataseed1.binance.org:443';

export const BSC_CONTRACTS = IS_TESTNET
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
  : {};

export const VITE_PROVIDER_URL = IS_TESTNET
  ? 'https://buidl.vite.net/gvite'
  : 'https://node.vite.net/gvite';

export const VITE_CONTRACTS = IS_TESTNET
  ? {
      vite: {
        address: 'vite_029b2a33f03a39009f96f141b7e1ae52c73830844f3b9804e8',
      },
      usdv: {
        address: 'vite_9c337fe9a8d4828c80de00d5c3432f62c3dece4ac9062aa008',
      },
    }
  : {};
