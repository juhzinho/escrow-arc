export const escrowAbi = [
  "event Deposit(uint256 indexed escrowId,address indexed creator,address indexed recipient,uint256 amount,bytes32 conditionHash,uint64 deadline)",
  "event Release(uint256 indexed escrowId,address indexed creator,address indexed recipient,uint256 amount,bool byProof)",
  "event Refund(uint256 indexed escrowId,address indexed caller,uint256 amount)",
  "function createEscrow(address recipient,uint256 amount,bytes32 conditionHash) returns (uint256)",
  "function manualRelease(uint256 escrowId)",
  "function releaseByProof(uint256 escrowId,bytes32 suppliedHash)",
  "function refund(uint256 escrowId)",
  "function getEscrow(uint256 escrowId) view returns ((address creator,address recipient,uint256 amount,bytes32 conditionHash,uint64 createdAt,uint64 deadline,uint8 status))",
  "function getCreatedEscrows(address creator) view returns (uint256[])",
  "function getReceivedEscrows(address recipient) view returns (uint256[])",
  "function nextEscrowId() view returns (uint256)"
] as const;

export const erc20Abi = [
  "function approve(address spender,uint256 amount) returns (bool)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
] as const;
