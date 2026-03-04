import { memo } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { ARC_CHAIN, CONTRACT_ADDRESS, getExplorerAddressUrl, hasConfiguredAddresses } from "../lib/config";
import { shortenAddress } from "../lib/utils";
import { useWallet } from "../hooks/useWallet";

export const WalletConnect = memo(() => {
  const { t } = useI18n();
  const { account, chainId, connectWallet, switchToArc, disconnect, isConnecting, usdcBalance } = useWallet();

  const wrongNetwork = account && chainId !== ARC_CHAIN.chainIdDecimal;

  return (
    <div className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t.usdcBalance}</div>
        <div className="mt-1 text-lg font-semibold">{usdcBalance} USDC</div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {account ? (
          <>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              {shortenAddress(account)}
            </div>
            {wrongNetwork ? (
              <button type="button" onClick={() => void switchToArc()} className="rounded-full bg-coral px-4 py-2 text-sm font-medium text-white">
                {t.switchNow}
              </button>
            ) : null}
            {hasConfiguredAddresses ? (
              <a
                href={getExplorerAddressUrl(CONTRACT_ADDRESS)}
                target="_blank"
                rel="noreferrer"
                className="secondary-btn"
              >
                {t.viewContract}
              </a>
            ) : null}
            <button type="button" onClick={disconnect} className="secondary-btn">
              {t.disconnect}
            </button>
          </>
        ) : (
          <button type="button" onClick={connectWallet} disabled={isConnecting} className="primary-btn">
            {isConnecting ? "..." : t.connect}
          </button>
        )}
      </div>
      {wrongNetwork ? (
        <div className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral">
          {t.wrongNetworkBanner}
        </div>
      ) : null}
    </div>
  );
});
