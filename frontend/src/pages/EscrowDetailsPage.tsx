import { isHexString } from "ethers";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useWallet } from "../hooks/useWallet";
import { useI18n } from "../i18n/I18nProvider";
import {
  CONTRACT_ADDRESS,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  hasConfiguredAddresses
} from "../lib/config";
import { getEscrowReadContract, getEscrowWriteContract } from "../lib/contract";
import { Escrow } from "../lib/types";
import { formatDate, formatTimeRemaining, formatUsdc, shortenAddress, shortenHash } from "../lib/utils";

export default function EscrowDetailsPage() {
  const { t } = useI18n();
  const { account, provider } = useWallet();
  const { escrowId } = useParams();
  const location = useLocation();
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [proof, setProof] = useState("");

  const load = async () => {
    if (!escrowId || !hasConfiguredAddresses) {
      setIsLoading(false);
      return;
    }

    try {
      const contract = getEscrowReadContract();
      const item = await contract.getEscrow(BigInt(escrowId));
      setEscrow({
        id: BigInt(escrowId),
        creator: item.creator,
        recipient: item.recipient,
        amount: item.amount,
        conditionHash: item.conditionHash,
        createdAt: item.createdAt,
        deadline: item.deadline,
        proofSubmittedAt: item.proofSubmittedAt,
        status: Number(item.status) as Escrow["status"]
      });
    } catch {
      setEscrow(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [escrowId]);

  const sendTx = async (action: () => Promise<{ wait: () => Promise<unknown>; hash?: string }>, label: string) => {
    if (!provider) {
      toast.error("Connect your wallet first");
      return;
    }

    try {
      const tx = await action();
      if (tx.hash) {
        toast.info(
          <a href={getExplorerTxUrl(tx.hash)} target="_blank" rel="noreferrer">
            {t.viewTx}
          </a>
        );
      }
      await tx.wait();
      await load();
      toast.success(`${label} confirmed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${label} failed`);
    }
  };

  if (isLoading) {
    return <div className="panel p-6 text-sm text-slate-500">Loading...</div>;
  }

  if (!escrow) {
    return (
      <div className="panel grid gap-4 p-6">
        <div className="text-lg font-semibold text-ink">{t.escrowNotFound}</div>
        <Link to="/escrows" className="secondary-btn">
          {t.backToEscrows}
        </Link>
      </div>
    );
  }

  const remaining = formatTimeRemaining(escrow.deadline);
  const reviewRemaining =
    escrow.proofSubmittedAt > 0n
      ? formatTimeRemaining(escrow.proofSubmittedAt + 2n * 24n * 60n * 60n)
      : null;
  const canRefund = escrow.status === 1 && remaining === null;
  const canFinalizeRelease = escrow.status === 2 && reviewRemaining === null;
  const isCreator = escrow.creator.toLowerCase() === account?.toLowerCase();
  const isRecipient = escrow.recipient.toLowerCase() === account?.toLowerCase();

  return (
    <div className="grid gap-6">
      <div className="panel grid gap-4 p-6">
        {location.state && (location.state as { justCreated?: boolean }).justCreated ? (
          <div className="rounded-2xl bg-sea/10 px-4 py-3 text-sm font-medium text-sea">
            {t.escrowCreatedBanner}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-ink">
            {t.escrowDetails} #{escrow.id.toString()}
          </h1>
          <Link to="/escrows" className="secondary-btn">
            {t.backToEscrows}
          </Link>
        </div>
        <div className="text-3xl font-semibold text-ink">{formatUsdc(escrow.amount)} USDC</div>
        <div className="grid gap-3 text-sm text-slate-600">
          <div title={escrow.creator}>{t.creatorLabel}: {shortenAddress(escrow.creator)}</div>
          <a href={getExplorerAddressUrl(escrow.creator)} target="_blank" rel="noreferrer" className="text-sea">
            {t.creatorLabel}
          </a>
          <div title={escrow.recipient}>{t.recipientLabel}: {shortenAddress(escrow.recipient)}</div>
          <a href={getExplorerAddressUrl(escrow.recipient)} target="_blank" rel="noreferrer" className="text-sea">
            {t.recipientLabel}
          </a>
          <div>{t.deadlineLabel}: {formatDate(escrow.deadline)}</div>
          <div>{t.timeRemaining}: {remaining ?? t.refundAvailable}</div>
          {escrow.status === 2 ? <div>{t.reviewWindow}: {reviewRemaining ?? t.finalizeRelease}</div> : null}
          <div title={escrow.conditionHash}>{t.hashLabel}: {shortenHash(escrow.conditionHash)}</div>
          <div>
            {t.contractAddress}:{" "}
            <a href={getExplorerAddressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer" className="text-sea">
              {t.viewContract}
            </a>
          </div>
        </div>

        {escrow.status === 1 || escrow.status === 2 ? (
          <div className="grid gap-3 pt-2">
            {isRecipient && escrow.status === 1 ? (
              <>
                <input
                  className="field"
                  placeholder={t.conditionHash}
                  value={proof}
                  onChange={(event) => setProof(event.target.value.trim())}
                />
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    if (!isHexString(proof, 32)) {
                      toast.error(t.invalidProofHash);
                      return;
                    }

                    void sendTx(async () => {
                      const contract = await getEscrowWriteContract(provider!);
                      return contract.submitProof(escrow.id, proof);
                    }, t.releaseProof);
                  }}
                >
                  {t.releaseProof}
                </button>
              </>
            ) : null}

            {isCreator ? (
              <button
                type="button"
                className="secondary-btn"
                onClick={() =>
                  void sendTx(async () => {
                    const contract = await getEscrowWriteContract(provider!);
                    return contract.manualRelease(escrow.id);
                  }, t.manualRelease)
                }
              >
                {t.manualRelease}
              </button>
            ) : null}

            {isRecipient && canFinalizeRelease ? (
              <button
                type="button"
                className="primary-btn"
                onClick={() =>
                  void sendTx(async () => {
                    const contract = await getEscrowWriteContract(provider!);
                    return contract.finalizeRelease(escrow.id);
                  }, t.finalizeRelease)
                }
              >
                {t.finalizeRelease}
              </button>
            ) : null}

            {canRefund ? (
              <button
                type="button"
                className="secondary-btn"
                onClick={() =>
                  void sendTx(async () => {
                    const contract = await getEscrowWriteContract(provider!);
                    return contract.refund(escrow.id);
                  }, t.refund)
                }
              >
                {t.refund}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
