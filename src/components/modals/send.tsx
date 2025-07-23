import { useEffect, useState } from "react";
import { type Participant, useNotification, useTransaction, useRequirePublicKey, getTokenBalance } from "@vidbloq/react";

type SendModalProps = {
  selectedUser: Participant | null;
  closeFunc: (val: boolean) => void;
};

const SendModal = ({ selectedUser, closeFunc }: SendModalProps) => {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isTransactionFetched, setIsTransactionFetched] = useState<boolean>(false);
  const [balance, setBalance] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const { publicKey } = useRequirePublicKey();

  const NETWORK_FEE = 0.01;

  // Format wallet address
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };


  console.log({ balance });

  const getUsdcBalance = async () => {
    if (!selectedUser || !publicKey) {
      return;
    }
    const balance = await getTokenBalance(publicKey.toString());
    setBalance(balance.onChainBalance.usdc);
  };

  useEffect(() => {
    getUsdcBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  const recipients = selectedUser
    ? [
        {
          publicKey: selectedUser.walletAddress,
          amount: Number(amount),
        },
      ]
    : [];

  const { addNotification } = useNotification();
  const {
    fetchTransaction,
    signAndSubmitTransaction,
    transactionBase64,
    transactionSignature,
    error: transactionError,
    loading: transactionLoading,
  } = useTransaction({
    recipients,
  });

  useEffect(() => {
    const handleTransactionSign = async () => {
      if (transactionBase64 && isTransactionFetched) {
        try {
          await signAndSubmitTransaction();
          // Only handle success here - errors are handled in the catch block
          if (transactionSignature) {
            addNotification({
              type: "success",
              message: "Transaction completed successfully",
              duration: 3000,
            });
            // Close modal after success
            setTimeout(() => {
              closeFunc(false);
            }, 2000);
          }
        } catch (error) {
          console.error("Error in signing transaction:", error);
          addNotification({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to sign and submit the transaction",
            duration: 3000,
          });
        } finally {
          setIsTransactionFetched(false);
          setLoading(false);
        }
      }
    };

    handleTransactionSign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionBase64, isTransactionFetched]);

  // Validate amount
  const validateAmount = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setError('');
      return false;
    }
    if (numValue > balance) {
      setError('Insufficient balance');
      return false;
    }
    setError('');
    return true;
  };

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      if (value) validateAmount(value);
      else setError('');
    }
  };

  // Handle quick amount selection
  const handleQuickAmount = (quickAmount: number) => {
    const value = quickAmount.toString();
    setAmount(value);
    validateAmount(value);
  };

  // Handle max amount
  const handleMax = () => {
    const maxAmount = Math.max(0, balance - NETWORK_FEE);
    setAmount(maxAmount.toFixed(6));
    validateAmount(maxAmount.toString());
  };

  const sendToken = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      addNotification({
        type: "error",
        message: "Please enter a valid amount",
        duration: 3000,
      });
      return;
    }

    if (parseFloat(amount) > balance) {
      addNotification({
        type: "error",
        message: "Amount exceeds available balance",
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      await fetchTransaction();
      setIsTransactionFetched(true);
    } catch (error) {
      console.error("Error in sendToken:", error);
      addNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch transaction",
        duration: 3000,
      });
      setLoading(false);
    }
  };

  // Get button state
  const getButtonState = () => {
    if (transactionSignature) return { text: 'Sent! ✓', disabled: true, className: 'bg-green-500' };
    if (loading || transactionLoading) return { text: 'Sending...', disabled: true, className: 'bg-gradient-to-r from-purple-600 to-purple-700 opacity-75' };
    if (!amount || parseFloat(amount) <= 0) return { text: 'Send', disabled: true, className: 'bg-gradient-to-r from-purple-600 to-purple-700 opacity-50' };
    if (error || transactionError) return { text: error || transactionError || 'Error', disabled: true, className: 'bg-red-500 opacity-90' };
    return { text: `Send ${parseFloat(amount).toFixed(6)} USDC`, disabled: false, className: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' };
  };

  const buttonState = getButtonState();

  if (!selectedUser) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => closeFunc(true)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 relative">
          <button
            onClick={() => closeFunc(true)}
            className="w-9 h-9 right-0 absolute rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-gray-800 hover:text-black transition-all duration-200 hover:rotate-90"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Recipient */}
        <div className="mb-6">
          <p className="text-sm text-black mb-3 font-medium">SENDING TO</p>
          <div className="bg-black/5 border border-black/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-black/[0.07] hover:border-purple-500/30 transition-all duration-200">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
              {selectedUser?.avatarUrl ? (
                <img 
                  src={selectedUser.avatarUrl} 
                  alt={selectedUser.userName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-lg">
                  {selectedUser.userName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-black font-medium">{selectedUser.userName}</p>
              <p className="text-gray-400 text-sm font-mono">{formatAddress(selectedUser.walletAddress)}</p>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-black font-medium">AMOUNT</p>
            <p className="text-xs text-black">Balance: {balance.toFixed(6)} USDC</p>
          </div>
          
          <div className="relative mb-4">
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="w-full bg-black/5 border-2 border-black/10 rounded-xl px-4 py-4 pr-20 text-2xl font-medium text-black placeholder-black focus:outline-none focus:border-purple-500 focus:bg-black/[0.07] transition-all duration-200"
            />
            <button
              onClick={handleMax}
              className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500 text-purple-400 text-xs font-medium rounded-md transition-all duration-200 hover:scale-105"
            >
              MAX
            </button>
          </div>

          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[1, 5, 10, 20].map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => handleQuickAmount(quickAmount)}
                className="py-2.5 bg-black/5 hover:bg-black/10 border border-black/10 hover:border-bg-primary-500/50 rounded-lg text-gray-800 hover:text-black text-sm font-medium transition-all duration-200"
              >
                {quickAmount}
              </button>
            ))}
          </div>

        </div>


        {/* Send Button */}
        <button
          onClick={sendToken}
          disabled={buttonState.disabled}
          className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-100 disabled:hover:scale-100 disabled:cursor-not-allowed ${buttonState.className}`}
        >
          {buttonState.text}
        </button>

        {/* Transaction Signature Link */}
        {transactionSignature && (
          <div className="text-sm text-wrap w-full mt-4">
            <p className="text-gray-400 mb-2">Transaction Signature:</p>
            <a
              href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 break-all transition-colors duration-200"
            >
              {transactionSignature}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendModal;