const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowPayments", function () {
  async function deployFixture() {
    const [owner, creator, recipient, outsider] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    const EscrowPayments = await ethers.getContractFactory("EscrowPayments");
    const escrow = await EscrowPayments.deploy(await usdc.getAddress(), owner.address);
    await escrow.waitForDeployment();

    const mintAmount = ethers.parseUnits("1000", 6);
    await usdc.mint(creator.address, mintAmount);

    return { owner, creator, recipient, outsider, usdc, escrow };
  }

  async function createEscrow(fixture, amount = "100") {
    const { creator, recipient, usdc, escrow } = fixture;
    const parsedAmount = ethers.parseUnits(amount, 6);
    const conditionHash = ethers.keccak256(ethers.toUtf8Bytes("delivered"));

    await usdc.connect(creator).approve(await escrow.getAddress(), parsedAmount);
    const tx = await escrow.connect(creator).createEscrow(recipient.address, parsedAmount, conditionHash);
    await tx.wait();

    return { parsedAmount, conditionHash };
  }

  it("creates and stores a funded escrow", async function () {
    const fixture = await deployFixture();
    const { escrow, creator, recipient } = fixture;
    const { parsedAmount, conditionHash } = await createEscrow(fixture);

    const item = await escrow.getEscrow(0n);

    expect(item.creator).to.equal(creator.address);
    expect(item.recipient).to.equal(recipient.address);
    expect(item.amount).to.equal(parsedAmount);
    expect(item.conditionHash).to.equal(conditionHash);
    expect(item.status).to.equal(1n);
    expect(item.proofSubmittedAt).to.equal(0n);
    expect(await escrow.lockedUsdc()).to.equal(parsedAmount);
  });

  it("stores a valid proof and allows recipient release after review period", async function () {
    const fixture = await deployFixture();
    const { escrow, usdc, recipient } = fixture;
    const { parsedAmount, conditionHash } = await createEscrow(fixture);

    await expect(escrow.connect(recipient).submitProof(0n, conditionHash))
      .to.emit(escrow, "ProofSubmitted");

    expect((await escrow.getEscrow(0n)).status).to.equal(2n);
    expect(await usdc.balanceOf(recipient.address)).to.equal(0n);

    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine", []);

    await expect(escrow.connect(recipient).finalizeRelease(0n))
      .to.emit(escrow, "Release")
      .withArgs(0n, fixture.creator.address, recipient.address, parsedAmount, true);

    expect(await usdc.balanceOf(recipient.address)).to.equal(parsedAmount);
    expect((await escrow.getEscrow(0n)).status).to.equal(3n);
  });

  it("allows the creator to manually release after proof submission", async function () {
    const fixture = await deployFixture();
    const { escrow, usdc, recipient, creator } = fixture;
    const { parsedAmount, conditionHash } = await createEscrow(fixture);

    await escrow.connect(recipient).submitProof(0n, conditionHash);

    await expect(escrow.connect(creator).manualRelease(0n))
      .to.emit(escrow, "Release")
      .withArgs(0n, creator.address, recipient.address, parsedAmount, false);

    expect(await usdc.balanceOf(recipient.address)).to.equal(parsedAmount);
    expect((await escrow.getEscrow(0n)).status).to.equal(3n);
  });

  it("prevents refund after proof was submitted", async function () {
    const fixture = await deployFixture();
    const { escrow, recipient, outsider } = fixture;
    const { conditionHash } = await createEscrow(fixture);

    await escrow.connect(recipient).submitProof(0n, conditionHash);
    await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine", []);

    await expect(escrow.connect(outsider).refund(0n)).to.be.revertedWithCustomError(escrow, "InvalidStatus");
  });

  it("refunds after timeout", async function () {
    const fixture = await deployFixture();
    const { escrow, usdc, creator, outsider } = fixture;
    const { parsedAmount } = await createEscrow(fixture);

    await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine", []);

    await expect(escrow.connect(outsider).refund(0n))
      .to.emit(escrow, "Refund")
      .withArgs(0n, outsider.address, parsedAmount);

    expect(await usdc.balanceOf(creator.address)).to.equal(ethers.parseUnits("1000", 6));
    expect((await escrow.getEscrow(0n)).status).to.equal(4n);
  });

  it("prevents emergency withdraw of locked USDC", async function () {
    const fixture = await deployFixture();
    const { escrow, owner, usdc } = fixture;
    const { parsedAmount } = await createEscrow(fixture);

    await expect(
      escrow.connect(owner).emergencyWithdraw(await usdc.getAddress(), owner.address, parsedAmount)
    ).to.be.revertedWithCustomError(escrow, "InsufficientAvailableBalance");
  });
});
