export const PORT = process.env.PORT;
export const PRODUCTION = 'production' === process.env.NODE_ENV;

export const IS_TESTNET =
  process.env.IS_TESTNET === 'true' || process.env.IS_TESTNET === '1';

export const VITE_PROVIDER_URL = IS_TESTNET
  ? 'https://buidl.vite.net/gvite'
  : 'https://node.vite.net/gvite';

export const BSC_WEB3_PROVIDER = IS_TESTNET
  ? 'https://data-seed-prebsc-1-s1.binance.org:8545'
  : 'https://bsc-dataseed1.binance.org:443';

export const ETH_WEB3_PROVIDER = IS_TESTNET
  ? 'https://eth-rinkeby.alchemyapi.io/v2/89CBi23LihhBHHA25O4kgog3UzQmbhrg'
  : 'https://eth-mainnet.alchemyapi.io/v2/mURJxPisxCxcQoewUfw7oIQPAwKrx8zB';
