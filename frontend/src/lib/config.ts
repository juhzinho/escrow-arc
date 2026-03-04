export const ARC_CHAIN = {
  chainIdHex: "0x4cef52",
  chainIdDecimal: 5042002,
  chainName: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6
  },
  blockExplorerUrl: "https://testnet.arcscan.app"
};

export const CONTRACT_ADDRESS =
  import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS ?? "0x0000000000000000000000000000000000000000";

export const USDC_ADDRESS =
  import.meta.env.VITE_USDC_ADDRESS ?? "0x3600000000000000000000000000000000000000";

export const hasConfiguredAddresses =
  !CONTRACT_ADDRESS.endsWith("0000");

export const getExplorerAddressUrl = (address: string) =>
  `${ARC_CHAIN.blockExplorerUrl}/address/${address}`;

export const getExplorerTxUrl = (txHash: string) =>
  `${ARC_CHAIN.blockExplorerUrl}/tx/${txHash}`;
