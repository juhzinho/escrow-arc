import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EscrowForm } from "../components/EscrowForm";
import { WalletConnect } from "../components/WalletConnect";

export default function CreateEscrowPage() {
  const [, setRefreshIndex] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="grid gap-6">
      <WalletConnect />
      <EscrowForm
        onCreated={async (escrowId) => {
          setRefreshIndex((value) => value + 1);
          if (escrowId) {
            navigate(`/escrows/${escrowId}`, {
              state: { justCreated: true }
            });
          } else {
            navigate("/escrows");
          }
        }}
      />
      <div className="panel p-5 text-sm text-slate-600">
        Use a deterministic bytes32 value for the delivery condition, such as a shared keccak256 hash.
      </div>
    </div>
  );
}
