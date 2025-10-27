import { Wallet } from "lucide-react";
import { useBalance } from "@vidbloq/react";
import { Tooltip, Spinner } from "../ui";

type WalletButtonProps = {
  handleWalletToggle: () => void;
};

const WalletButton = ({ handleWalletToggle }: WalletButtonProps) => {
  const { usdcBalance: balance, loading } = useBalance();
  
  return (
    <Tooltip content="View wallet">
      <button className="flex z-50 items-center gap-2 h-10 px-3 bg-white backdrop-blur-sm rounded-xl shadow-sm hover:bg-gray-200 transition-all duration-200" onClick={handleWalletToggle}>
        <Wallet className="text-[#8b5cf6] w-5 h-5" />
        {loading ? (
          <Spinner />
        ) : (
          <span className="font-medium text-sm text-gray-700">
            ${balance.toFixed(2)}
          </span>
        )}
      </button>
    </Tooltip>
  );
};

export default WalletButton;