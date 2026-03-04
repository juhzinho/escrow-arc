import { FormEvent, memo, useEffect, useState } from "react";
import { isHexString, parseUnits } from "ethers";
import { toast } from "react-toastify";
import { useWallet } from "../hooks/useWallet";
import { useI18n } from "../i18n/I18nProvider";
import { CONTRACT_ADDRESS, getExplorerTxUrl, hasConfiguredAddresses } from "../lib/config";
import {
  getEscrowReadContract,
  getEscrowWriteContract,
  getUsdcReadContract,
  getUsdcWriteContract
} from "../lib/contract";
import { isValidAddress, safeHash } from "../lib/utils";

interface EscrowFormProps {
  onCreated: (escrowId: string) => Promise<void>;
}

export const EscrowForm = memo(({ onCreated }: EscrowFormProps) => {
  const { t } = useI18n();
  const { account, provider, refreshBalance } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [conditionHash, setConditionHash] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAllowance, setHasAllowance] = useState(false);

  const getParsedAmount = () => {
    if (!amount || Number(amount) <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    return parseUnits(amount, 6);
  };

  const validateFields = () => {
    const cleanRecipient = recipient.trim();
    const cleanHash = safeHash(conditionHash);

    if (!isValidAddress(cleanRecipient)) {
      throw new Error("Invalid recipient address");
    }

    if (!isHexString(cleanHash, 32)) {
      throw new Error("Condition hash must be a bytes32 hex value");
    }

    return {
      cleanRecipient,
      cleanHash,
      parsedAmount: getParsedAmount()
    };
  };

  const refreshAllowance = async () => {
    if (!account || !hasConfiguredAddresses || !amount || Number(amount) <= 0) {
      setHasAllowance(false);
      return;
    }

    try {
      const parsedAmount = parseUnits(amount, 6);
      const usdc = getUsdcReadContract();
      const allowance = (await usdc.allowance(account, CONTRACT_ADDRESS)) as bigint;
      setHasAllowance(allowance >= parsedAmount);
    } catch {
      setHasAllowance(false);
    }
  };

  useEffect(() => {
    void refreshAllowance();
  }, [account, amount]);

  useEffect(() => {
    if (!hasConfiguredAddresses) {
      return;
    }

    const escrow = getEscrowReadContract();
    const handler = () => void refreshAllowance();

    escrow.on("Deposit", handler);

    return () => {
      escrow.off("Deposit", handler);
    };
  }, [account, amount]);

  const approveUsdc = async () => {
    if (!provider || !account) {
      toast.error("Connect your wallet first");
      return;
    }

    if (!hasConfiguredAddresses) {
      toast.error("Configure contract and USDC addresses in .env");
      return;
    }

    try {
      const { parsedAmount } = validateFields();
      setIsApproving(true);
      const usdc = await getUsdcWriteContract(provider);
      const approvalTx = await usdc.approve(CONTRACT_ADDRESS, parsedAmount);
      toast.info(
        <a href={getExplorerTxUrl(approvalTx.hash)} target="_blank" rel="noreferrer">
          {t.viewTx}
        </a>
      );
      await approvalTx.wait();
      await refreshAllowance();
      await refreshBalance();
      toast.success("Approval confirmed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!provider || !account) {
      toast.error("Connect your wallet first");
      return;
    }

    if (!hasConfiguredAddresses) {
      toast.error("Configure contract and USDC addresses in .env");
      return;
    }

    setIsSubmitting(true);

    try {
      const { cleanRecipient, cleanHash, parsedAmount } = validateFields();
      const escrowRead = getEscrowReadContract();
      const nextEscrowId = ((await escrowRead.nextEscrowId()) as bigint).toString();
      const escrow = await getEscrowWriteContract(provider);
      const createTx = await escrow.createEscrow(cleanRecipient, parsedAmount, cleanHash);
      toast.info(
        <a href={getExplorerTxUrl(createTx.hash)} target="_blank" rel="noreferrer">
          {t.viewTx}
        </a>
      );
      await createTx.wait();

      setRecipient("");
      setAmount("");
      setConditionHash("");

      await refreshBalance();
      await refreshAllowance();
      await onCreated(nextEscrowId);
      toast.success("Escrow created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel grid gap-4 p-6">
      <h2 className="text-2xl font-semibold text-ink">{t.formTitle}</h2>
      <input
        className="field"
        placeholder={t.recipient}
        value={recipient}
        onChange={(event) => setRecipient(event.target.value)}
      />
      <input
        className="field"
        placeholder={t.amount}
        inputMode="decimal"
        value={amount}
        onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
      />
      <input
        className="field"
        placeholder={t.conditionHash}
        value={conditionHash}
        onChange={(event) => setConditionHash(event.target.value)}
      />
      <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
        {hasAllowance ? t.allowanceReady : t.allowanceMissing}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" disabled={isApproving} onClick={() => void approveUsdc()} className="secondary-btn">
          {isApproving ? "..." : t.approveOnly}
        </button>
        <button type="submit" disabled={isSubmitting || !hasAllowance} className="primary-btn">
          {isSubmitting ? "..." : t.createOnly}
        </button>
      </div>
    </form>
  );
});
