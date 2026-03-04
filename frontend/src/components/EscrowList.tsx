import { memo, useDeferredValue, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useWallet } from "../hooks/useWallet";
import { useI18n } from "../i18n/I18nProvider";
import { hasConfiguredAddresses } from "../lib/config";
import { getEscrowReadContract } from "../lib/contract";
import { Escrow } from "../lib/types";
import {
  formatDate,
  formatTimeRemaining,
  formatUsdc,
  shortenAddress,
  shortenHash,
  uniqueBigints
} from "../lib/utils";

interface EscrowListProps {
  refreshIndex: number;
}

export const EscrowList = memo(({ refreshIndex }: EscrowListProps) => {
  const PAGE_SIZE = 4;
  const { t } = useI18n();
  const { account } = useWallet();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "funded" | "proof_submitted" | "released" | "refunded">("all");
  const [idFilter, setIdFilter] = useState("");
  const [createdPage, setCreatedPage] = useState(1);
  const [receivedPage, setReceivedPage] = useState(1);
  const deferredEscrows = useDeferredValue(escrows);

  const loadEscrows = async () => {
    if (!account) {
      setEscrows([]);
      return;
    }

    if (!hasConfiguredAddresses) {
      setEscrows([]);
      return;
    }

    setIsLoading(true);

    try {
      const contract = getEscrowReadContract();
      const createdIds = (await contract.getCreatedEscrows(account)) as bigint[];
      const receivedIds = (await contract.getReceivedEscrows(account)) as bigint[];
      const ids = uniqueBigints([...createdIds, ...receivedIds]);
      const items = await Promise.all(
        ids.map(async (id) => {
          const escrow = await contract.getEscrow(id);
          return {
            id,
            creator: escrow.creator,
            recipient: escrow.recipient,
            amount: escrow.amount,
            conditionHash: escrow.conditionHash,
            createdAt: escrow.createdAt,
            deadline: escrow.deadline,
            proofSubmittedAt: escrow.proofSubmittedAt,
            status: Number(escrow.status) as Escrow["status"]
          };
        })
      );

      items.sort((left, right) => Number(right.id - left.id));
      setEscrows(items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load escrows");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEscrows();
  }, [account, refreshIndex]);

  useEffect(() => {
    setCreatedPage(1);
    setReceivedPage(1);
  }, [statusFilter, idFilter, account]);

  useEffect(() => {
    if (!hasConfiguredAddresses) {
      return;
    }

    const contract = getEscrowReadContract();
    const handler = () => void loadEscrows();

    contract.on("Deposit", handler);
    contract.on("Release", handler);
    contract.on("Refund", handler);

    return () => {
      contract.off("Deposit", handler);
      contract.off("Release", handler);
      contract.off("Refund", handler);
    };
  }, [account]);

  const { created, received } = useMemo(() => {
    const applyFilter = (items: Escrow[]) =>
      items.filter((escrow) => {
        if (idFilter.trim() && !escrow.id.toString().includes(idFilter.trim())) return false;
        if (statusFilter === "all") return true;
        if (statusFilter === "funded") return escrow.status === 1;
        if (statusFilter === "proof_submitted") return escrow.status === 2;
        if (statusFilter === "released") return escrow.status === 3;
        if (statusFilter === "refunded") return escrow.status === 4;
        return true;
      });

    const createdItems = applyFilter(deferredEscrows).filter(
      (escrow) => escrow.creator.toLowerCase() === account?.toLowerCase()
    );
    const receivedItems = applyFilter(deferredEscrows).filter(
      (escrow) => escrow.recipient.toLowerCase() === account?.toLowerCase()
    );

    return { created: createdItems, received: receivedItems };
  }, [account, deferredEscrows, statusFilter, idFilter]);

  const createdTotalPages = Math.max(1, Math.ceil(created.length / PAGE_SIZE));
  const receivedTotalPages = Math.max(1, Math.ceil(received.length / PAGE_SIZE));
  const pagedCreated = created.slice((createdPage - 1) * PAGE_SIZE, createdPage * PAGE_SIZE);
  const pagedReceived = received.slice((receivedPage - 1) * PAGE_SIZE, receivedPage * PAGE_SIZE);

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t.copied);
    } catch {
      toast.error("Copy failed");
    }
  };

  const getStatusLabel = (status: Escrow["status"]) => {
    switch (status) {
      case 1:
        return t.statusFunded;
      case 2:
        return t.statusProofSubmitted;
      case 3:
        return t.statusReleased;
      case 4:
        return t.statusRefunded;
      default:
        return t.statusUnknown;
    }
  };

  const renderCard = (escrow: Escrow) => {
    const remaining = formatTimeRemaining(escrow.deadline);

    return (
    <article key={escrow.id.toString()} className="card-surface rounded-3xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">#{escrow.id.toString()}</div>
          <div className="mt-2 text-xl font-semibold text-ink">{formatUsdc(escrow.amount)} USDC</div>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {t.statusLabel}: {getStatusLabel(escrow.status)}
        </div>
      </div>
      <div className="mt-4">
        <Link to={`/escrows/${escrow.id.toString()}`} className="secondary-btn">
          {t.viewDetails}
        </Link>
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-slate-600">
        <div className="flex items-center justify-between gap-3">
          <span title={escrow.creator}>{t.creatorLabel}: {shortenAddress(escrow.creator)}</span>
          <button type="button" className="secondary-btn" onClick={() => void copyText(escrow.creator)}>
            {t.copy}
          </button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span title={escrow.recipient}>{t.recipientLabel}: {shortenAddress(escrow.recipient)}</span>
          <button type="button" className="secondary-btn" onClick={() => void copyText(escrow.recipient)}>
            {t.copy}
          </button>
        </div>
        <div>{t.deadlineLabel}: {formatDate(escrow.deadline)}</div>
        <div>
          {t.timeRemaining}: {remaining ?? t.refundAvailable}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span title={escrow.conditionHash}>{t.hashLabel}: {shortenHash(escrow.conditionHash)}</span>
          <button type="button" className="secondary-btn" onClick={() => void copyText(escrow.conditionHash)}>
            {t.copy}
          </button>
        </div>
      </dl>
    </article>
    );
  };

  const renderPager = (
    page: number,
    totalPages: number,
    onChange: Dispatch<SetStateAction<number>>
  ) => {
    if (totalPages <= 1) {
      return null;
    }

    return (
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          className="secondary-btn"
          disabled={page <= 1}
          onClick={() => onChange((current) => Math.max(1, current - 1))}
        >
          {t.previous}
        </button>
        <div className="text-sm text-slate-500">
          {t.page} {page}/{totalPages}
        </div>
        <button
          type="button"
          className="secondary-btn"
          disabled={page >= totalPages}
          onClick={() => onChange((current) => Math.min(totalPages, current + 1))}
        >
          {t.next}
        </button>
      </div>
    );
  };

  return (
    <section className="grid gap-6">
      <div className="panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-ink">{t.myEscrows}</h2>
          {isLoading && <span className="text-sm text-slate-500">loading...</span>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            className="field max-w-xs"
            placeholder={t.searchEscrowId}
            inputMode="numeric"
            value={idFilter}
            onChange={(event) => setIdFilter(event.target.value.replace(/[^\d]/g, ""))}
          />
          {[
            ["all", t.filterAll],
            ["funded", t.filterFunded],
            ["proof_submitted", t.filterProofSubmitted],
            ["released", t.filterReleased],
            ["refunded", t.filterRefunded]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value as "all" | "funded" | "proof_submitted" | "released" | "refunded")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                statusFilter === value ? "bg-ink text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel grid gap-4 p-6">
          <h3 className="text-lg font-semibold">{t.created}</h3>
          {created.length ? pagedCreated.map(renderCard) : <div className="text-sm text-slate-500">{t.noEscrows}</div>}
          {renderPager(createdPage, createdTotalPages, setCreatedPage)}
        </div>

        <div className="panel grid gap-4 p-6">
          <h3 className="text-lg font-semibold">{t.received}</h3>
          {received.length ? pagedReceived.map(renderCard) : <div className="text-sm text-slate-500">{t.noEscrows}</div>}
          {renderPager(receivedPage, receivedTotalPages, setReceivedPage)}
        </div>
      </div>
    </section>
  );
});
