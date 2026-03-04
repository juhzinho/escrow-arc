import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { ARC_CHAIN, CONTRACT_ADDRESS, USDC_ADDRESS } from "./config";
import { erc20Abi, escrowAbi } from "./abi";

export const rpcProvider = new JsonRpcProvider(ARC_CHAIN.rpcUrl);

export const getEscrowReadContract = () => new Contract(CONTRACT_ADDRESS, escrowAbi, rpcProvider);

export const getUsdcReadContract = () => new Contract(USDC_ADDRESS, erc20Abi, rpcProvider);

export const getEscrowWriteContract = async (provider: BrowserProvider) => {
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, escrowAbi, signer);
};

export const getUsdcWriteContract = async (provider: BrowserProvider) => {
  const signer = await provider.getSigner();
  return new Contract(USDC_ADDRESS, erc20Abi, signer);
};
