/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useMemo } from "react";
import {
  X,
  Wallet,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownLeft,
  XCircle,
  RefreshCw,
  Send,
  Download,
  ChevronLeft,
  User,
} from "lucide-react";
import { IoCopyOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import {
  //   useTransactionHistory,
  useMyStreamTransactions,
  useAllStreamTransactions,
  useParticipantList,
  useBalance
} from "@vidbloq/react";
import { useWallet } from "@civic/auth-web3/react";
import { SendModal } from "../modals";
// import { useBalanceContext } from "../../hooks";

interface InStreamWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "balance" | "myTransactions" | "streamTransactions";
type ViewType = "main" | "selectRecipient";

const InStreamWalletModal = ({ isOpen, onClose }: InStreamWalletModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("balance");
  const [currentView, setCurrentView] = useState<ViewType>("main");
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const {
    usdcBalance: balance,
    refresh: refreshBalance,
  } = useBalance();

  // Hooks
  // const { usdcBalance: balance } = useBalance();
  const wallet = useWallet({ type: "solana" });
  const { participants } = useParticipantList();

  const {
    transactions: myStreamTransactions,
    loading: myStreamLoading,
    refresh: refreshMyStream,
  } = useMyStreamTransactions();

  const {
    transactions: allStreamTransactions,
    statistics: streamStats,
    loading: streamLoading,
    refresh: refreshAllStream,
  } = useAllStreamTransactions({ limit: 50, autoFetch: true });

  console.log({ myStreamTransactions, allStreamTransactions });

  // Filter out current user from participants list
  const availableRecipients = useMemo(() => {
    if (!participants || !wallet?.address) return [];
    return participants.filter(
      (p: any) =>
        p.walletAddress &&
        wallet?.address &&
        p.walletAddress.toLowerCase() !== wallet.address.toLowerCase()
    );
  }, [participants, wallet?.address]);

  // Format transaction for display
  const formatTransaction = useCallback(
    (tx: any, isStreamSpecific = false) => {
      const amount = Math.abs(parseFloat(tx.amount || 0));
      const isCredit = isStreamSpecific || tx.senderAddress !== wallet?.address;

      return {
        id: tx.id || tx.signature || Math.random().toString(),
        type: isCredit ? "credit" : "debit",
        amount: amount,
        description:
          tx.narration ||
          tx.transactionType ||
          (isCredit ? "Received" : "Sent"),
        date: tx.createdAt || tx.updatedAt || new Date().toISOString(),
        status: tx.status || "completed",
        tokenName: tx.tokenName || "USDC",
        signature: tx.signature,
        stream: tx.stream,
        user: tx.user,
        senderAddress: tx.senderAddress,
        recipientAddress: tx.recipientAddress,
      };
    },
    [wallet?.address]
  );

  // Calculate statistics
  const calculateMyStats = useMemo(() => {
    if (!myStreamTransactions || myStreamTransactions.length === 0) {
      return { totalEarnings: 0, pendingAmount: 0, transactionCount: 0 };
    }

    let totalEarnings = 0;
    let pendingAmount = 0;

    myStreamTransactions.forEach((tx: any) => {
      const amount = Math.abs(parseFloat(tx.amount || 0));
      totalEarnings += amount;

      if (tx.status === "pending") {
        pendingAmount += amount;
      }
    });

    return {
      totalEarnings,
      pendingAmount,
      transactionCount: myStreamTransactions.length,
    };
  }, [myStreamTransactions]);

  // Formatted transactions
  const formattedMyTransactions = useMemo(() => {
    if (!myStreamTransactions) return [];
    return myStreamTransactions
      .map((tx) => formatTransaction(tx, true))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [myStreamTransactions, formatTransaction]);

  const formattedStreamTransactions = useMemo(() => {
    if (!allStreamTransactions) return [];
    return allStreamTransactions
      .map((tx) => formatTransaction(tx, true))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allStreamTransactions, formatTransaction]);

  // Handlers
  const handleCopyAddress = async () => {
    if (!wallet?.address) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      toast.success("Address copied");
    } catch (error) {
      console.log(error);
      toast.error("Failed to copy");
    }
  };

  const handleSendClick = () => {
    if (availableRecipients.length === 0) {
      toast.error("No participants available to send to");
      return;
    }
    setCurrentView("selectRecipient");
  };

  const handleRecipientSelect = (recipient: any) => {
    setSelectedRecipient(recipient);
    setShowTransferModal(true);
    setCurrentView("main");
  };

  const handleBackToMain = () => {
    setCurrentView("main");
  };

  const handleRefresh = () => {
    if (activeTab === "balance" || activeTab === "myTransactions") {
      refreshMyStream();
      //   refreshAllTransactions();
    } else if (activeTab === "streamTransactions") {
      refreshAllStream();
    }
    toast.success("Refreshed");
  };

  const refreshUserBalance = async () => {
    await refreshBalance();
    toast.success("Refreshed");
  };

  const handleExport = () => {
    let transactions: any[] = [];
    if (activeTab === "myTransactions") {
      transactions = formattedMyTransactions;
    } else if (activeTab === "streamTransactions") {
      transactions = formattedStreamTransactions;
    }

    const csvContent = [
      ["Date", "Description", "Type", "Amount", "Token", "Status", "Signature"],
      ...(transactions as any[]).map((tx: any) => [
        new Date(tx.date).toLocaleString(),
        tx.description,
        tx.type,
        tx.amount.toFixed(6),
        tx.tokenName,
        tx.status,
        tx.signature || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stream_transactions_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Transactions exported");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-purple-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentView === "selectRecipient" && (
              <button
                onClick={handleBackToMain}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors mr-1"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <Wallet className="w-5 h-5 text-white" />
            <h3 className="text-white font-bold text-lg">
              {currentView === "selectRecipient"
                ? "Select Recipient"
                : "My Wallet"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {currentView === "main" ? (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 bg-white">
              <button
                onClick={() => setActiveTab("balance")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "balance"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Balance
              </button>
              <button
                onClick={() => setActiveTab("myTransactions")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "myTransactions"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                My Transactions
              </button>
              <button
                onClick={() => setActiveTab("streamTransactions")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "streamTransactions"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Stream Activity
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="p-4 space-y-4">
                {activeTab === "balance" && (
                  <>
                    {/* Balance Card */}
                    <div className="bg-purple-600 rounded-xl p-5 text-white shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-100 text-sm">
                          Available Balance
                        </span>
                        <DollarSign className="w-5 h-5 text-purple-200" />
                      </div>
                      <div className="text-3xl font-bold mb-4">
                        ${balance.toFixed(6)}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSendClick}
                          className="flex-1 bg-white text-purple-600 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-1"
                        >
                          <Send className="w-4 h-4" />
                          Send
                        </button>
                        <button
                          onClick={refreshUserBalance}
                          className="flex-1 bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Refresh
                        </button>
                      </div>
                    </div>

                    {/* Wallet Address */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Wallet Address
                        </span>
                        <button
                          onClick={handleCopyAddress}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        >
                          <IoCopyOutline size={16} className="text-gray-600" />
                        </button>
                      </div>
                      <div className="text-sm font-mono text-gray-800 break-all">
                        {wallet?.address
                          ? `${wallet.address.slice(
                              0,
                              8
                            )}...${wallet.address.slice(-8)}`
                          : "Not connected"}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">
                          Stream Earnings
                        </div>
                        <div className="text-lg font-bold text-purple-600">
                          ${calculateMyStats.totalEarnings.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">
                          Pending
                        </div>
                        <div className="text-lg font-bold text-yellow-600">
                          ${calculateMyStats.pendingAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                        Recent Activity
                      </h4>
                      {myStreamLoading ? (
                        <div className="space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-2 animate-pulse"
                            >
                              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                              <div className="flex-1">
                                <div className="w-24 h-3 bg-gray-200 rounded mb-1"></div>
                                <div className="w-16 h-2 bg-gray-200 rounded"></div>
                              </div>
                              <div className="w-16 h-4 bg-gray-200 rounded"></div>
                            </div>
                          ))}
                        </div>
                      ) : formattedMyTransactions.length > 0 ? (
                        <div className="space-y-2">
                          {formattedMyTransactions
                            .slice(0, 5)
                            .map((tx: any) => (
                              <div
                                key={tx.id}
                                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                      tx.type === "credit"
                                        ? "bg-green-50"
                                        : "bg-red-50"
                                    }`}
                                  >
                                    {tx.type === "credit" ? (
                                      <ArrowDownLeft className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <ArrowUpRight className="w-4 h-4 text-red-600" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-gray-900">
                                      {tx.description}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(tx.date).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className={`text-sm font-bold ${
                                    tx.type === "credit"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {tx.type === "credit" ? "+" : "-"}$
                                  {tx.amount.toFixed(2)}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No transactions yet
                        </p>
                      )}
                    </div>
                  </>
                )}

                {activeTab === "myTransactions" && (
                  <>
                    {/* Header with actions */}
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">
                        My Stream Transactions
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={handleRefresh}
                          disabled={myStreamLoading}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Refresh"
                        >
                          <RefreshCw
                            className={`w-4 h-4 text-gray-600 ${
                              myStreamLoading ? "animate-spin" : ""
                            }`}
                          />
                        </button>
                        <button
                          onClick={handleExport}
                          disabled={formattedMyTransactions.length === 0}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Export CSV"
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Total Earned
                          </div>
                          <div className="text-xl font-bold text-purple-600">
                            ${calculateMyStats.totalEarnings.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Transactions
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {calculateMyStats.transactionCount}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transaction List */}
                    {myStreamLoading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 animate-pulse"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                              <div className="flex-1">
                                <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="w-20 h-3 bg-gray-200 rounded"></div>
                              </div>
                              <div className="w-16 h-5 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : formattedMyTransactions.length > 0 ? (
                      <div className="space-y-3">
                        {formattedMyTransactions.map((tx: any) => (
                          <div
                            key={tx.id}
                            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-purple-300 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    tx.type === "credit"
                                      ? "bg-green-50"
                                      : "bg-red-50"
                                  }`}
                                >
                                  {tx.type === "credit" ? (
                                    <ArrowDownLeft className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <ArrowUpRight className="w-5 h-5 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    {tx.description}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {new Date(tx.date).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`font-bold text-sm ${
                                    tx.type === "credit"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {tx.type === "credit" ? "+" : "-"}$
                                  {tx.amount.toFixed(2)}
                                </div>
                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                  {tx.status === "confirmed" ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : tx.status === "pending" ? (
                                    <Clock className="w-3 h-3 text-yellow-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500" />
                                  )}
                                  <span
                                    className={`text-xs ${
                                      tx.status === "confirmed"
                                        ? "text-green-600"
                                        : tx.status === "pending"
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {tx.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center">
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500">
                          No transactions in this stream yet
                        </p>
                      </div>
                    )}
                  </>
                )}

                {activeTab === "streamTransactions" && (
                  <>
                    {/* Header with actions */}
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">
                        All Stream Activity
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={handleRefresh}
                          disabled={streamLoading}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Refresh"
                        >
                          <RefreshCw
                            className={`w-4 h-4 text-gray-600 ${
                              streamLoading ? "animate-spin" : ""
                            }`}
                          />
                        </button>
                        <button
                          onClick={handleExport}
                          disabled={formattedStreamTransactions.length === 0}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Export CSV"
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Stream Stats */}
                    {streamStats && (
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">
                              Total Volume
                            </div>
                            <div className="text-xl font-bold text-purple-600">
                              $
                              {parseFloat(
                                streamStats.totalVolume || "0"
                              ).toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">
                              Total Transactions
                            </div>
                            <div className="text-xl font-bold text-gray-900">
                              {streamStats.totalTransactions || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Transaction List */}
                    {streamLoading ? (
                      <div className="space-y-3">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 animate-pulse"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                              <div className="flex-1">
                                <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="w-20 h-3 bg-gray-200 rounded"></div>
                              </div>
                              <div className="w-16 h-5 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : formattedStreamTransactions.length > 0 ? (
                      <div className="space-y-3">
                        {formattedStreamTransactions.map((tx: any) => (
                          <div
                            key={tx.id}
                            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-purple-300 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                  <TrendingUp className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    {tx.description}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {new Date(tx.date).toLocaleDateString()}
                                    {tx.user?.name && (
                                      <span className="ml-2">
                                        • {tx.user.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-sm text-purple-600">
                                  ${tx.amount.toFixed(2)}
                                </div>
                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                  {tx.status === "confirmed" ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : tx.status === "pending" ? (
                                    <Clock className="w-3 h-3 text-yellow-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500" />
                                  )}
                                  <span
                                    className={`text-xs ${
                                      tx.status === "confirmed"
                                        ? "text-green-600"
                                        : tx.status === "pending"
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {tx.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center">
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500">No stream activity yet</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Recipient Selection View */
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Select a participant to send funds to
              </h4>
              <p className="text-xs text-gray-500">
                {availableRecipients.length}{" "}
                {availableRecipients.length === 1
                  ? "participant"
                  : "participants"}{" "}
                available
              </p>
            </div>

            {availableRecipients.length > 0 ? (
              <div className="space-y-2">
                {availableRecipients.map((participant: any) => (
                  <button
                    key={participant.id}
                    onClick={() => handleRecipientSelect(participant)}
                    className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      {participant.avatarUrl ? (
                        <img
                          src={participant.avatarUrl}
                          alt={participant.userName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-purple-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {participant.userName || "Anonymous"}
                        </div>
                        <div className="text-xs text-gray-500 font-mono truncate">
                          {participant.walletAddress.slice(0, 8)}...
                          {participant.walletAddress.slice(-8)}
                        </div>
                      </div>
                      <Send className="w-5 h-5 text-purple-600" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 mb-2">No participants available</p>
                <p className="text-xs text-gray-400">
                  Other participants need to join the call first
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && selectedRecipient && (
        <SendModal
          selectedUser={selectedRecipient}
          closeFunc={() => {
            setShowTransferModal(false);
            setSelectedRecipient(null);
          }}
        />
      )}
    </>
  );
};

export default InStreamWalletModal;
