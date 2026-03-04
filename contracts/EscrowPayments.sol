// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EscrowPayments is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum EscrowStatus {
        None,
        Funded,
        Released,
        Refunded
    }

    struct Escrow {
        address creator;
        address recipient;
        uint256 amount;
        bytes32 conditionHash;
        uint64 createdAt;
        uint64 deadline;
        EscrowStatus status;
    }

    uint64 public constant DEFAULT_TIMEOUT = 7 days;

    IERC20 public immutable usdc;
    uint256 public nextEscrowId;
    uint256 public lockedUsdc;

    mapping(uint256 => Escrow) private escrows;
    mapping(address => uint256[]) private createdEscrows;
    mapping(address => uint256[]) private receivedEscrows;

    event Deposit(
        uint256 indexed escrowId,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        bytes32 conditionHash,
        uint64 deadline
    );
    event Release(
        uint256 indexed escrowId,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        bool byProof
    );
    event Refund(uint256 indexed escrowId, address indexed caller, uint256 amount);
    event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount);

    error InvalidRecipient();
    error InvalidAmount();
    error InvalidConditionHash();
    error EscrowNotFound();
    error InvalidStatus();
    error NotCreator();
    error NotRecipient();
    error InvalidProof();
    error TimeoutNotReached();
    error InsufficientAllowance();
    error InsufficientBalance();
    error InsufficientAvailableBalance();

    modifier escrowExists(uint256 escrowId) {
        if (escrows[escrowId].creator == address(0)) revert EscrowNotFound();
        _;
    }

    modifier onlyCreator(uint256 escrowId) {
        if (msg.sender != escrows[escrowId].creator) revert NotCreator();
        _;
    }

    modifier onlyRecipient(uint256 escrowId) {
        if (msg.sender != escrows[escrowId].recipient) revert NotRecipient();
        _;
    }

    modifier inStatus(uint256 escrowId, EscrowStatus expected) {
        if (escrows[escrowId].status != expected) revert InvalidStatus();
        _;
    }

    constructor(address usdcToken, address initialOwner) Ownable(initialOwner) {
        if (usdcToken == address(0)) revert InvalidRecipient();
        usdc = IERC20(usdcToken);
    }

    function createEscrow(
        address recipient,
        uint256 amount,
        bytes32 conditionHash
    ) external nonReentrant returns (uint256 escrowId) {
        if (recipient == address(0) || recipient == msg.sender) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        if (conditionHash == bytes32(0)) revert InvalidConditionHash();
        if (usdc.allowance(msg.sender, address(this)) < amount) revert InsufficientAllowance();
        if (usdc.balanceOf(msg.sender) < amount) revert InsufficientBalance();

        escrowId = nextEscrowId++;
        uint64 createdAt = uint64(block.timestamp);
        uint64 deadline = createdAt + DEFAULT_TIMEOUT;

        escrows[escrowId] = Escrow({
            creator: msg.sender,
            recipient: recipient,
            amount: amount,
            conditionHash: conditionHash,
            createdAt: createdAt,
            deadline: deadline,
            status: EscrowStatus.Funded
        });

        createdEscrows[msg.sender].push(escrowId);
        receivedEscrows[recipient].push(escrowId);

        lockedUsdc += amount;
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposit(escrowId, msg.sender, recipient, amount, conditionHash, deadline);
    }

    function releaseByProof(
        uint256 escrowId,
        bytes32 suppliedHash
    ) external nonReentrant escrowExists(escrowId) onlyRecipient(escrowId) inStatus(escrowId, EscrowStatus.Funded) {
        Escrow storage escrow = escrows[escrowId];
        if (suppliedHash != escrow.conditionHash) revert InvalidProof();

        escrow.status = EscrowStatus.Released;
        lockedUsdc -= escrow.amount;

        usdc.safeTransfer(escrow.recipient, escrow.amount);
        emit Release(escrowId, escrow.creator, escrow.recipient, escrow.amount, true);
    }

    function manualRelease(
        uint256 escrowId
    ) external nonReentrant escrowExists(escrowId) onlyCreator(escrowId) inStatus(escrowId, EscrowStatus.Funded) {
        Escrow storage escrow = escrows[escrowId];

        escrow.status = EscrowStatus.Released;
        lockedUsdc -= escrow.amount;

        usdc.safeTransfer(escrow.recipient, escrow.amount);
        emit Release(escrowId, escrow.creator, escrow.recipient, escrow.amount, false);
    }

    function refund(
        uint256 escrowId
    ) external nonReentrant escrowExists(escrowId) inStatus(escrowId, EscrowStatus.Funded) {
        Escrow storage escrow = escrows[escrowId];
        if (block.timestamp < escrow.deadline) revert TimeoutNotReached();

        escrow.status = EscrowStatus.Refunded;
        lockedUsdc -= escrow.amount;

        usdc.safeTransfer(escrow.creator, escrow.amount);
        emit Refund(escrowId, msg.sender, escrow.amount);
    }

    function getEscrow(uint256 escrowId) external view escrowExists(escrowId) returns (Escrow memory) {
        return escrows[escrowId];
    }

    function getCreatedEscrows(address creator) external view returns (uint256[] memory) {
        return createdEscrows[creator];
    }

    function getReceivedEscrows(address recipient) external view returns (uint256[] memory) {
        return receivedEscrows[recipient];
    }

    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidRecipient();

        IERC20 asset = IERC20(token);
        if (token == address(usdc)) {
            uint256 available = asset.balanceOf(address(this)) - lockedUsdc;
            if (amount > available) revert InsufficientAvailableBalance();
        }

        asset.safeTransfer(to, amount);
        emit EmergencyWithdraw(token, to, amount);
    }
}
