import { useState } from "react";
import { EscrowList } from "../components/EscrowList";
import { WalletConnect } from "../components/WalletConnect";

export default function MyEscrowsPage() {
  const [refreshIndex] = useState(0);

  return (
    <div className="grid gap-6">
      <WalletConnect />
      <EscrowList refreshIndex={refreshIndex} />
    </div>
  );
}
