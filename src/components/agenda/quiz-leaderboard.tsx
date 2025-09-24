import React, { useState, useEffect, type JSX, useCallback } from "react";
import { IoTrophyOutline, IoTrendingUpOutline } from "react-icons/io5";
import { FaAward, FaMedal, FaUser } from "react-icons/fa";
import { VscTarget } from "react-icons/vsc";
import { MdOutlineFileDownload } from "react-icons/md";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import {
  useGetQuizResults,
  useLiveQuizResults,
  useTransaction,
  useNotification,
  useRequirePublicKey,
  getTokenBalance,
} from "@vidbloq/react";

// Types based on your hook interfaces
interface QuestionStat {
  id: string;
  questionText: string;
  totalResponses: number;
  correctResponses: number;
  correctPercentage: number;
}

interface LeaderboardEntry {
  participantId: string;
  userName: string;
  walletAddress: string;
  pointsEarned: number;
  totalPoints: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
}

interface QuizLeaderboardProps {
  agendaId?: string;
  isLive?: boolean;
}

// Reward Modal Component
const RewardModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  winners: LeaderboardEntry[];
  onConfirm: (amount: number, perPerson: boolean) => void;
}> = ({ isOpen, onClose, winners, onConfirm }) => {
  const [rewardAmount, setRewardAmount] = useState<string>("");
  const [isPerPerson, setIsPerPerson] = useState<boolean>(true);
  const [balance, setBalance] = useState<number>(0);
  const { publicKey } = useRequirePublicKey();

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey) {
        const balanceData = await getTokenBalance(publicKey.toString());
        setBalance(balanceData.onChainBalance.usdc);
      }
    };
    if (isOpen) {
      fetchBalance();
    }
  }, [isOpen, publicKey]);

  const totalAmount = isPerPerson
    ? parseFloat(rewardAmount || "0") * winners.length
    : parseFloat(rewardAmount || "0");

  const perPersonAmount = isPerPerson
    ? parseFloat(rewardAmount || "0")
    : parseFloat(rewardAmount || "0") / winners.length;

  const isValidAmount = () => {
    const amount = parseFloat(rewardAmount);
    return !isNaN(amount) && amount > 0 && totalAmount <= balance;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Reward Winners</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all duration-200"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-purple-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-purple-700 mb-2">
              Rewarding {winners.length} winner{winners.length > 1 ? "s" : ""}:
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {winners.slice(0, 5).map((winner, idx) => (
                <div
                  key={winner.participantId}
                  className="text-xs text-gray-600"
                >
                  #{idx + 1} {winner.userName} â€¢{" "}
                  {winner.walletAddress.slice(0, 6)}...
                  {winner.walletAddress.slice(-4)}
                </div>
              ))}
              {winners.length > 5 && (
                <div className="text-xs text-gray-500 italic">
                  ...and {winners.length - 5} more
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Reward Amount (USDC)
              </label>
              <span className="text-xs text-gray-500">
                Balance: {balance.toFixed(2)} USDC
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Distribution Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsPerPerson(true)}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  isPerPerson
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Per Person
              </button>
              <button
                onClick={() => setIsPerPerson(false)}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  !isPerPerson
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Split Total
              </button>
            </div>
          </div>

          {rewardAmount && parseFloat(rewardAmount) > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Per person:</span>
                <span className="font-semibold">
                  {perPersonAmount.toFixed(2)} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total cost:</span>
                <span className="font-semibold">
                  {totalAmount.toFixed(2)} USDC
                </span>
              </div>
              {totalAmount > balance && (
                <div className="text-red-500 text-xs mt-2">
                  Insufficient balance. You need{" "}
                  {(totalAmount - balance).toFixed(2)} more USDC.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(parseFloat(rewardAmount), isPerPerson)}
            disabled={!isValidAmount()}
            className={`flex-1 py-3 px-6 font-semibold rounded-xl transition-all ${
              isValidAmount()
                ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Send Rewards
          </button>
        </div>
      </div>
    </div>
  );
};

const QuizLeaderboard: React.FC<QuizLeaderboardProps> = ({
  agendaId,
  isLive = false,
}) => {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "stats">(
    "leaderboard"
  );
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedWinners, setSelectedWinners] = useState<LeaderboardEntry[]>(
    []
  );
  const [isProcessingRewards, setIsProcessingRewards] = useState(false);
  const [transactionFetched, setTransactionFetched] = useState(false);

  // Hooks
  // const { getQuizResults, isLoading: isLoadingFromHook, results: hookResults } = useGetQuizResults();
  const {
    getQuizResults,
    results: staticResults,
    isLoading: staticLoading,
    error: staticError,
    refresh,
  } = useGetQuizResults();

  // Use live hook for real-time updates
  const {
    results: liveResults,
    isLoading: liveLoading,
    error: liveError,
    pause,
    resume,
    refetch,
  } = useLiveQuizResults(agendaId || "", {
    enabled: isLive && !!agendaId,
    interval: 10000,
    onUpdate: (data) => {
      console.log("Quiz results updated:", data);
    },
  });

  // Use live results if available, otherwise static
  const results = isLive ? liveResults : staticResults;
  const isLoading = isLive ? liveLoading : staticLoading;
  const error = isLive ? liveError : staticError;

  const { addNotification } = useNotification();
  const { publicKey } = useRequirePublicKey();

  // // Use the stream context properly with useStream hook
  // const {
  //   getResponseData,
  //   isResponseDataLoading,
  //   preloadResponseData,
  //   clearResponseCache
  // } = useStream();

  // // Check for cached data
  // const cachedData = agendaId ? getResponseData(agendaId, 'quiz') : null;
  // const isCacheLoading = agendaId ? isResponseDataLoading(agendaId) : false;

  // // Use cached data if available, otherwise use hook results
  // const results = cachedData || hookResults;
  // const isLoading = isCacheLoading || (isLoadingFromHook && !cachedData);

  // // Track if we've fetched for this agenda
  // const [hasFetched, setHasFetched] = useState(false);

  // Transaction hook for rewards
  const [rewardRecipients, setRewardRecipients] = useState<
    Array<{ publicKey: string; amount: number }>
  >([]);
  const {
    fetchTransaction,
    signAndSubmitTransaction,
    transactionBase64,
    transactionSignature,
    error: transactionError,
    loading: transactionLoading,
  } = useTransaction({
    recipients: rewardRecipients,
  });

  // Handle transaction signing
  // useEffect(() => {
  //   const handleTransactionSign = async () => {
  //     if (transactionBase64 && transactionFetched) {
  //       try {
  //         await signAndSubmitTransaction();
  //         if (transactionSignature) {
  //           addNotification({
  //             type: "success",
  //             message: `Successfully rewarded ${selectedWinners.length} winner${selectedWinners.length > 1 ? 's' : ''}!`,
  //             duration: 5000,
  //           });
  //           setShowRewardModal(false);
  //           setSelectedWinners([]);
  //           setRewardRecipients([]);
  //         }
  //       } catch (error) {
  //         console.error("Error in signing transaction:", error);
  //         addNotification({
  //           type: "error",
  //           message: error instanceof Error ? error.message : "Failed to send rewards",
  //           duration: 3000,
  //         });
  //       } finally {
  //         setTransactionFetched(false);
  //         setIsProcessingRewards(false);
  //       }
  //     }
  //   };

  //   handleTransactionSign();
  // }, [transactionBase64, transactionFetched, transactionSignature, selectedWinners.length, addNotification, signAndSubmitTransaction]);

  // Fetch initial data for static mode
  useEffect(() => {
    if (!isLive && agendaId) {
      getQuizResults(agendaId);
    }
  }, [agendaId, isLive, getQuizResults]);

  // Handle visibility change for live polling
  useEffect(() => {
    if (!isLive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pause();
      } else {
        resume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLive, pause, resume]);

  // Handle transaction signing
  useEffect(() => {
    const handleTransactionSign = async () => {
      if (transactionBase64 && transactionFetched) {
        try {
          await signAndSubmitTransaction();
          if (transactionSignature) {
            addNotification({
              type: "success",
              message: `Successfully rewarded ${selectedWinners.length} winner${
                selectedWinners.length > 1 ? "s" : ""
              }!`,
              duration: 5000,
            });
            setShowRewardModal(false);
            setSelectedWinners([]);
            setRewardRecipients([]);
          }
        } catch (error) {
          console.error("Error in signing transaction:", error);
          addNotification({
            type: "error",
            message:
              error instanceof Error ? error.message : "Failed to send rewards",
            duration: 3000,
          });
        } finally {
          setTransactionFetched(false);
          setIsProcessingRewards(false);
        }
      }
    };

    handleTransactionSign();
  }, [
    transactionBase64,
    transactionFetched,
    transactionSignature,
    selectedWinners.length,
    addNotification,
    signAndSubmitTransaction,
  ]);

  // Show transaction error if it occurs
  useEffect(() => {
    if (transactionError) {
      addNotification({
        type: "error",
        message: transactionError,
        duration: 3000,
      });
      setIsProcessingRewards(false);
    }
  }, [transactionError, addNotification]);

  // const fetchQuizResults = async () => {
  //   if (!agendaId) {
  //     console.log("No agendaId provided, skipping fetch");
  //     return;
  //   }

  //   try {
  //     console.log('Fetching fresh quiz results for agenda:', agendaId);
  //     await getQuizResults(agendaId);

  //     // After fetching, update the cache if no cached data exists
  //     if (!cachedData) {
  //       preloadResponseData(agendaId, 'quiz');
  //     }
  //   } catch (error) {
  //     console.error("Error fetching quiz data:", error);
  //   }
  // };

  // const handleRefresh = async () => {
  //   if (!agendaId) return;
  //   clearResponseCache(agendaId);
  //   setHasFetched(false);
  //   await fetchQuizResults();
  // };

  // const handleRewardClick = (count: 1 | 5 | 10) => {
  //   if (!results || !publicKey) {
  //     addNotification({
  //       type: "error",
  //       message: "Please connect your wallet first",
  //       duration: 3000,
  //     });
  //     return;
  //   }

  //   const winners = results.leaderboard.slice(0, count);
  //   setSelectedWinners(winners);
  //   setShowRewardModal(true);
  // };

  // const handleConfirmReward = async (amount: number, isPerPerson: boolean) => {
  //   if (!selectedWinners.length || amount <= 0) return;

  //   const amountPerPerson = isPerPerson ? amount : amount / selectedWinners.length;

  //   const recipients = selectedWinners.map(winner => ({
  //     publicKey: winner.walletAddress,
  //     amount: amountPerPerson,
  //   }));

  //   setRewardRecipients(recipients);
  //   setIsProcessingRewards(true);

  //   try {
  //     await fetchTransaction();
  //     setTransactionFetched(true);
  //   } catch (error) {
  //     console.error("Error fetching transaction:", error);
  //     addNotification({
  //       type: "error",
  //       message: "Failed to prepare reward transaction",
  //       duration: 3000,
  //     });
  //     setIsProcessingRewards(false);
  //   }
  // };

  const handleRefresh = useCallback(async () => {
    if (!agendaId) return;

    if (isLive) {
      await refetch();
    } else {
      await refresh(agendaId);
    }
  }, [isLive, refetch, refresh, agendaId]);

  const handleRewardClick = (count: 1 | 5 | 10) => {
    if (!results || !publicKey) {
      addNotification({
        type: "error",
        message: "Please connect your wallet first",
        duration: 3000,
      });
      return;
    }

    const winners = results.leaderboard.slice(0, count);
    setSelectedWinners(winners);
    setShowRewardModal(true);
  };

  const handleConfirmReward = async (amount: number, isPerPerson: boolean) => {
    if (!selectedWinners.length || amount <= 0) return;

    const amountPerPerson = isPerPerson
      ? amount
      : amount / selectedWinners.length;

    const recipients = selectedWinners.map((winner) => ({
      publicKey: winner.walletAddress,
      amount: amountPerPerson,
    }));

    setRewardRecipients(recipients);
    setIsProcessingRewards(true);

    try {
      await fetchTransaction();
      setTransactionFetched(true);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      addNotification({
        type: "error",
        message: "Failed to prepare reward transaction",
        duration: 3000,
      });
      setIsProcessingRewards(false);
    }
  };

  // const getRankIcon = (position: number): JSX.Element => {
  //   switch (position) {
  //     case 1:
  //       return <IoTrophyOutline className="w-6 h-6 text-yellow-500" />;
  //     case 2:
  //       return <FaMedal className="w-6 h-6 text-gray-400" />;
  //     case 3:
  //       return <FaAward className="w-6 h-6 text-amber-600" />;
  //     default:
  //       return (
  //         <span className="w-6 h-6 flex items-center justify-center text-sm font-semibold text-gray-600">
  //           #{position}
  //         </span>
  //       );
  //   }
  // };

  // const getRankStyle = (position: number): string => {
  //   switch (position) {
  //     case 1:
  //       return "bg-gradient-to-r from-yellow-50 to-transparent";
  //     case 2:
  //       return "bg-gradient-to-r from-gray-50 to-transparent";
  //     case 3:
  //       return "bg-gradient-to-r from-amber-50 to-transparent";
  //     default:
  //       return "bg-white hover:bg-purple-50";
  //   }
  // };

  // const formatWalletAddress = (address: string): string => {
  //   return `${address.slice(0, 6)}...${address.slice(-4)}`;
  // };

  // const downloadLeaderboard = (): void => {
  //   if (!results) return;

  //   const csvHeader = [
  //     "Rank",
  //     "User Name",
  //     "Wallet Address",
  //     "Quiz Points",
  //     "Total Points",
  //     "Correct Answers",
  //     "Total Answers",
  //     "Accuracy (%)",
  //     "Quiz Completion Date",
  //   ].join(",");

  //   const csvData = results.leaderboard.map(
  //     (participant: LeaderboardEntry, index: number) =>
  //       [
  //         index + 1,
  //         `"${participant.userName}"`,
  //         participant.walletAddress,
  //         participant.pointsEarned,
  //         participant.totalPoints,
  //         participant.correctAnswers,
  //         participant.totalAnswers,
  //         participant.accuracy,
  //         new Date().toISOString().split("T")[0],
  //       ].join(",")
  //   );

  //   const csvContent = [csvHeader, ...csvData].join("\n");
  //   const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  //   const link = document.createElement("a");
  //   const url = URL.createObjectURL(blob);

  //   link.setAttribute("href", url);
  //   link.setAttribute(
  //     "download",
  //     `${(results.title || "Quiz").replace(/\s+/g, "_")}_Leaderboard_${
  //       new Date().toISOString().split("T")[0]
  //     }.csv`
  //   );
  //   link.style.visibility = "hidden";
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  const getRankIcon = (position: number): JSX.Element => {
    switch (position) {
      case 1:
        return <IoTrophyOutline className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <FaMedal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <FaAward className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-sm font-semibold text-gray-600">
            #{position}
          </span>
        );
    }
  };

  const getRankStyle = (position: number): string => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-transparent";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-transparent";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-transparent";
      default:
        return "bg-white hover:bg-purple-50";
    }
  };

  const formatWalletAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const downloadLeaderboard = useCallback((): void => {
    if (!results) return;

    const csvHeader = [
      "Rank",
      "User Name",
      "Wallet Address",
      "Quiz Points",
      "Total Points",
      "Correct Answers",
      "Total Answers",
      "Accuracy (%)",
      "Quiz Completion Date",
    ].join(",");

    const csvData = results.leaderboard.map(
      (participant: LeaderboardEntry, index: number) =>
        [
          index + 1,
          `"${participant.userName}"`,
          participant.walletAddress,
          participant.pointsEarned,
          participant.totalPoints,
          participant.correctAnswers,
          participant.totalAnswers,
          participant.accuracy,
          new Date().toISOString().split("T")[0],
        ].join(",")
    );

    const csvContent = [csvHeader, ...csvData].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${(results.title || "Quiz").replace(/\s+/g, "_")}_Leaderboard_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [results]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-purple-200 rounded-lg mb-4"></div>
            <div className="h-24 bg-purple-100 rounded-xl mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-purple-50 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isRateLimited = error.message?.includes("Rate limit exceeded");

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12 bg-white rounded-3xl shadow-xl border border-purple-100">
            <IoTrophyOutline className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              {isRateLimited
                ? "Please wait a moment"
                : "Unable to Load Results"}
            </h2>
            <p className="text-gray-500 mb-4">
              {isRateLimited
                ? "You've made too many requests. The data will refresh automatically."
                : error.message}
            </p>
            {!isRateLimited && agendaId && (
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12 bg-white rounded-3xl shadow-xl border border-purple-100">
            <IoTrophyOutline className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              No Quiz Results Yet
            </h2>
            <p className="text-gray-500">
              Results will appear once participants complete the quiz.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8">
  //       <div className="max-w-6xl mx-auto">
  //         <div className="animate-pulse">
  //           <div className="h-8 bg-purple-200 rounded-lg mb-4"></div>
  //           <div className="h-24 bg-purple-100 rounded-xl mb-6"></div>
  //           <div className="space-y-4">
  //             {[...Array(5)].map((_, i) => (
  //               <div key={i} className="h-16 bg-purple-50 rounded-xl"></div>
  //             ))}
  //           </div>
  //         </div>
  //         {cachedData && (
  //           <div className="mt-4 text-center text-sm text-purple-600">
  //             Loading fresh data...
  //           </div>
  //         )}
  //       </div>
  //     </div>
  //   );
  // }

  // if (!results) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8">
  //       <div className="max-w-6xl mx-auto">
  //         <div className="text-center py-12 bg-white rounded-3xl shadow-xl border border-purple-100">
  //           <IoTrophyOutline className="w-16 h-16 text-purple-300 mx-auto mb-4" />
  //           <h2 className="text-xl font-semibold text-gray-600 mb-2">
  //             No Quiz Results Found
  //           </h2>
  //           <p className="text-gray-500 mb-4">
  //             Unable to load quiz results at this time.
  //           </p>
  //           {agendaId && (
  //             <button
  //               onClick={handleRefresh}
  //               className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
  //             >
  //               Try Again
  //             </button>
  //           )}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-clip-text text-bg-primary mb-2 sm:mb-3">
                {results.title || "Quiz Results"}
              </h1>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FaUser className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                  <span>
                    <span className="font-semibold text-purple-700">
                      {results.participantsAnswered}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-purple-700">
                      {results.totalParticipants}
                    </span>{" "}
                    participated
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <VscTarget className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                  <span>
                    <span className="font-semibold text-purple-700">
                      {results.questionStats.length}
                    </span>{" "}
                    questions
                  </span>
                </div>
                {isLive && (
                  <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse">
                    <span>● LIVE</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 lg:mt-0">
              {/* Reward Dropdown */}
              {publicKey && results.leaderboard.length > 0 && (
                <div className="relative group">
                  <button
                    className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium text-xs sm:text-sm"
                    disabled={isProcessingRewards || transactionLoading}
                  >
                    <RiMoneyDollarCircleLine className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Reward</span>
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="py-2">
                      <button
                        onClick={() => handleRewardClick(1)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 transition-colors flex items-center justify-between"
                      >
                        <span>Top Winner</span>
                        <span className="text-xs text-gray-500">1 person</span>
                      </button>
                      <button
                        onClick={() => handleRewardClick(5)}
                        disabled={results.leaderboard.length < 5}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>Top 5 Winners</span>
                        <span className="text-xs text-gray-500">5 people</span>
                      </button>
                      <button
                        onClick={() => handleRewardClick(10)}
                        disabled={results.leaderboard.length < 10}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>Top 10 Winners</span>
                        <span className="text-xs text-gray-500">10 people</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Actions */}
              <button
                onClick={downloadLeaderboard}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium text-xs sm:text-sm"
              >
                <MdOutlineFileDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Download</span> CSV
              </button>
              {agendaId && (
                <button
                  onClick={handleRefresh}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg sm:rounded-xl hover:bg-purple-50 hover:-translate-y-0.5 transition-all duration-200 font-medium text-xs sm:text-sm"
                >
                  <IoTrendingUpOutline className="w-3 h-3 sm:w-4 sm:h-4" />
                  Refresh
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-purple-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "leaderboard"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Leaderboard
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "stats"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Question Statistics
              </button>
            </nav>
          </div>
        </div>

        {activeTab === "leaderboard" && (
          <div className="space-y-8">
            {/* Top 3 Podium */}
            {results.leaderboard.length >= 3 && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-purple-100 p-4 sm:p-6 lg:p-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-center bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent mb-4 sm:mb-6 lg:mb-8">
                  Top Performers
                </h2>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 max-w-3xl mx-auto">
                  {/* Second Place */}
                  <div className="text-center order-1 transform hover:scale-105 transition-transform duration-200">
                    <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 mb-2 sm:mb-3 shadow-lg">
                      <FaMedal className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-gray-400 mx-auto mb-1 sm:mb-2" />
                      <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-700">
                        #2
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base truncate px-1">
                      {results.leaderboard[1].userName}
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-bold text-purple-600">
                      {results.leaderboard[1].pointsEarned} pts
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {results.leaderboard[1].accuracy}%
                    </div>
                  </div>

                  {/* First Place */}
                  <div className="text-center order-2 transform sm:scale-110 hover:scale-105 sm:hover:scale-115 transition-transform duration-200">
                    <div className="bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 mb-2 sm:mb-3 shadow-xl relative">
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-yellow-400 rounded-full animate-pulse"></div>
                      <IoTrophyOutline className="w-7 h-7 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-yellow-500 mx-auto mb-1 sm:mb-2" />
                      <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-yellow-700">
                        #1
                      </div>
                    </div>
                    <div className="font-bold text-gray-900 text-xs sm:text-base lg:text-lg truncate px-1">
                      {results.leaderboard[0].userName}
                    </div>
                    <div className="text-sm sm:text-lg lg:text-xl font-bold text-purple-600">
                      {results.leaderboard[0].pointsEarned} pts
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {results.leaderboard[0].accuracy}%
                    </div>
                  </div>

                  {/* Third Place */}
                  <div className="text-center order-3 transform hover:scale-105 transition-transform duration-200">
                    <div className="bg-gradient-to-b from-amber-100 to-amber-200 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 mb-2 sm:mb-3 shadow-lg">
                      <FaAward className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-amber-600 mx-auto mb-1 sm:mb-2" />
                      <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-amber-700">
                        #3
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base truncate px-1">
                      {results.leaderboard[2].userName}
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-bold text-purple-600">
                      {results.leaderboard[2].pointsEarned} pts
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {results.leaderboard[2].accuracy}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-purple-100 overflow-hidden">
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-purple-800">
                    Top 10 Rankings
                  </h2>
                  <div className="text-xs sm:text-sm text-purple-600 font-medium">
                    Showing top 10 of {results.leaderboard.length} participants
                  </div>
                </div>
              </div>

              {/* Mobile view - Cards */}
              <div className="block sm:hidden">
                {results.leaderboard
                  .slice(0, 10)
                  .map((participant: LeaderboardEntry, index: number) => {
                    const position = index + 1;
                    return (
                      <div
                        key={participant.participantId}
                        className={`p-4 border-b border-gray-100 ${getRankStyle(
                          position
                        )}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getRankIcon(position)}
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                              <FaUser className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-purple-700">
                              {participant.pointsEarned}
                            </p>
                            <p className="text-xs text-gray-500">Points</p>
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {participant.userName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatWalletAddress(participant.walletAddress)}
                          </p>
                        </div>
                        <div className="flex justify-between text-xs">
                          <div>
                            <span className="text-gray-600">Correct: </span>
                            <span className="font-semibold">
                              {participant.correctAnswers}/
                              {participant.totalAnswers}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Accuracy: </span>
                            <span
                              className={`font-bold ${
                                participant.accuracy >= 80
                                  ? "text-green-600"
                                  : participant.accuracy >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {participant.accuracy}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Desktop/Tablet view - Table */}
              <div className="hidden sm:block divide-y divide-gray-100">
                {results.leaderboard
                  .slice(0, 10)
                  .map((participant: LeaderboardEntry, index: number) => {
                    const position = index + 1;
                    return (
                      <div
                        key={participant.participantId}
                        className={`p-4 sm:p-6 transition-all duration-200 ${getRankStyle(
                          position
                        )}`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="flex-shrink-0">
                              {getRankIcon(position)}
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                                <FaUser className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </div>
                              <div>
                                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
                                  {participant.userName}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  {formatWalletAddress(
                                    participant.walletAddress
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 ml-0 lg:ml-auto">
                            <div className="text-center">
                              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-700">
                                {participant.pointsEarned}
                              </p>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">
                                Quiz Points
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-700">
                                {participant.correctAnswers}/
                                {participant.totalAnswers}
                              </p>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">
                                Correct
                              </p>
                            </div>
                            <div className="text-center">
                              <p
                                className={`text-sm sm:text-base lg:text-lg font-bold ${
                                  participant.accuracy >= 80
                                    ? "text-green-600"
                                    : participant.accuracy >= 60
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}
                              >
                                {participant.accuracy}%
                              </p>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">
                                Accuracy
                              </p>
                            </div>
                            <div className="text-center hidden xl:block">
                              <p className="text-sm font-medium text-gray-600">
                                {participant.totalPoints}
                              </p>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">
                                Total Points
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Show More Info */}
              {results.leaderboard.length > 10 && (
                <div className="px-8 py-4 bg-gradient-to-r from-purple-50 to-purple-100 border-t border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-purple-600">
                      {results.leaderboard.length - 10} more participants not
                      shown
                    </div>
                    <button
                      onClick={downloadLeaderboard}
                      className="text-sm text-purple-700 hover:text-purple-900 font-semibold transition-colors"
                    >
                      Download complete list â†’
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-purple-100 overflow-hidden">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-purple-800">
                Question Performance Analysis
              </h2>
            </div>

            <div className="divide-y divide-gray-100">
              {results.questionStats.map(
                (stat: QuestionStat, index: number) => (
                  <div
                    key={stat.id}
                    className="p-4 sm:p-6 lg:p-8 hover:bg-purple-50 transition-colors duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-xs sm:text-sm font-bold text-purple-600 uppercase tracking-wider mb-2">
                          Question {index + 1}
                        </h3>
                        <p className="text-gray-700 text-sm sm:text-base lg:text-lg">
                          {stat.questionText}
                        </p>
                      </div>
                      <div className="text-center sm:text-right sm:ml-6">
                        <div
                          className={`text-2xl sm:text-3xl font-bold ${
                            stat.correctPercentage >= 80
                              ? "text-green-600"
                              : stat.correctPercentage >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {stat.correctPercentage}%
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">
                          Success Rate
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-600 mb-3 gap-2">
                      <span>
                        <span className="font-semibold text-purple-700">
                          {stat.correctResponses}
                        </span>{" "}
                        correct out of{" "}
                        <span className="font-semibold text-purple-700">
                          {stat.totalResponses}
                        </span>{" "}
                        responses
                      </span>
                      <IoTrendingUpOutline
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          stat.correctPercentage >= 60
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      />
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          stat.correctPercentage >= 80
                            ? "bg-gradient-to-r from-green-400 to-green-600"
                            : stat.correctPercentage >= 60
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                            : "bg-gradient-to-r from-red-400 to-red-600"
                        }`}
                        style={{ width: `${stat.correctPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {isLive && (
          <div className="mt-4 text-center text-sm text-purple-600">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Auto-refreshing every 10 seconds</span>
            </div>
          </div>
        )}
      </div>

      {/* Reward Modal */}
      <RewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        winners={selectedWinners}
        onConfirm={handleConfirmReward}
      />
    </div>
  );
};

export default QuizLeaderboard;
