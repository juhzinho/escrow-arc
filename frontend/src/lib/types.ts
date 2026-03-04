export type EscrowStatus = 0 | 1 | 2 | 3 | 4;

export interface Escrow {
  id: bigint;
  creator: string;
  recipient: string;
  amount: bigint;
  conditionHash: string;
  createdAt: bigint;
  deadline: bigint;
  proofSubmittedAt: bigint;
  status: EscrowStatus;
}

export interface WalletState {
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
}
