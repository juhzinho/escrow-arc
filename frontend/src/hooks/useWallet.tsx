import { BrowserProvider, Eip1193Provider, Network, formatUnits } from "ethers";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ARC_CHAIN, hasConfiguredAddresses } from "../lib/config";
import { getEscrowReadContract, getUsdcReadContract } from "../lib/contract";
import type { WalletState } from "../lib/types";

interface MetaMaskProvider extends Eip1193Provider {
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: MetaMaskProvider;
  }
}

interface WalletContextValue extends WalletState {
  provider: BrowserProvider | null;
  usdcBalance: string;
  connectWallet: () => Promise<void>;
  switchToArc: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: (addressOverride?: string | null) => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [walletState, setWalletState] = useState<WalletState>({
    account: null,
    chainId: null,
    isConnecting: false
  });
  const [usdcBalance, setUsdcBalance] = useState("0.0");

  const refreshBalance = async (addressOverride?: string | null) => {
    const target = addressOverride ?? walletState.account;
    if (!target || !hasConfiguredAddresses) {
      setUsdcBalance("0.0");
      return;
    }

    try {
      const usdc = getUsdcReadContract();
      const balance = (await usdc.balanceOf(target)) as bigint;
      setUsdcBalance(formatUnits(balance, 6));
    } catch {
      setUsdcBalance("0.0");
    }
  };

  const switchToArc = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not found");
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_CHAIN.chainIdHex }]
      });
    } catch {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ARC_CHAIN.chainIdHex,
            chainName: ARC_CHAIN.chainName,
            rpcUrls: [ARC_CHAIN.rpcUrl],
            nativeCurrency: ARC_CHAIN.nativeCurrency,
            blockExplorerUrls: [ARC_CHAIN.blockExplorerUrl]
          }
        ]
      });
    }
  };

  const syncWallet = async (browserProvider: BrowserProvider) => {
    const signer = await browserProvider.getSigner();
    const address = await signer.getAddress();
    const network = (await browserProvider.getNetwork()) as Network;

    setProvider(browserProvider);
    setWalletState({
      account: address,
      chainId: Number(network.chainId),
      isConnecting: false
    });
    await refreshBalance(address);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not found");
      return;
    }

    setWalletState((current) => ({ ...current, isConnecting: true }));

    try {
      await switchToArc();
      const browserProvider = new BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      await syncWallet(browserProvider);
      toast.success("Wallet connected");
    } catch (error) {
      setWalletState((current) => ({ ...current, isConnecting: false }));
      toast.error(error instanceof Error ? error.message : "Connection failed");
    }
  };

  const disconnect = () => {
    setProvider(null);
    setWalletState({
      account: null,
      chainId: null,
      isConnecting: false
    });
    setUsdcBalance("0.0");
  };

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const handleAccountsChanged = async (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : [];
      if (!accounts.length) {
        disconnect();
        return;
      }

      const browserProvider = new BrowserProvider(window.ethereum!);
      await syncWallet(browserProvider);
    };

    const handleChainChanged = () => window.location.reload();

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (!hasConfiguredAddresses) {
      return;
    }

    const contract = getEscrowReadContract();
    const handler = async () => {
      await refreshBalance();
    };

    contract.on("Deposit", handler);
    contract.on("Release", handler);
    contract.on("Refund", handler);

    return () => {
      contract.off("Deposit", handler);
      contract.off("Release", handler);
      contract.off("Refund", handler);
    };
  }, [walletState.account]);

  return (
    <WalletContext.Provider
      value={{
        ...walletState,
        provider,
        usdcBalance,
        connectWallet,
        switchToArc,
        disconnect,
        refreshBalance
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }

  return context;
};
