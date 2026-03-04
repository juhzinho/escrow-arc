import { formatUnits, isAddress } from "ethers";

export const shortenAddress = (value: string | null) =>
  value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "";

export const shortenHash = (value: string | null) =>
  value ? `${value.slice(0, 10)}...${value.slice(-8)}` : "";

export const isValidAddress = (value: string) => isAddress(value.trim());

export const safeHash = (value: string) => value.trim();

export const formatUsdc = (value: bigint) => formatUnits(value, 6);

export const formatDate = (unixSeconds: bigint) =>
  new Date(Number(unixSeconds) * 1000).toLocaleString();

export const uniqueBigints = (items: bigint[]) =>
  Array.from(new Map(items.map((item) => [item.toString(), item])).values());

export const formatTimeRemaining = (deadline: bigint) => {
  const remainingMs = Number(deadline) * 1000 - Date.now();
  if (remainingMs <= 0) {
    return null;
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${Math.max(minutes, 0)}m`;
};
