/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@civic/auth/react";
import { useWallet } from "@civic/auth-web3/react";
import { CiUser, CiSettings, CiEdit, CiCamera } from "react-icons/ci";
import { IoSunnyOutline, IoCopyOutline } from "react-icons/io5";
import { FaCheck, FaSave } from "react-icons/fa";
import { FiMoon, FiSend } from "react-icons/fi";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  CreditCard, 
  Activity,
  XCircle,
  Filter
} from 'lucide-react';
import toast from "react-hot-toast";
import {
  getDisplayCredentials,
  getGoogleCredentials,
  getUserPreferences,
  saveUserPreferences,
  saveGoogleCredentials,
  getAvatarOptions,
} from "../utils";
import type { UserPreferences } from "../types";
import { 
  useBalance, 
  useTransactionHistory 
} from "@vidbloq/react";
import { SendModal } from "../components";
import { CustomWalletProvider } from "../components/custom-wallet-provider";

const UserProfilePage = () => {
  // Existing profile state
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [useGoogleAvatar, setUseGoogleAvatar] = useState(true);
  const [username, setUsername] = useState("");
  const [useGoogleName, setUseGoogleName] = useState(true);
  const [theme, setTheme] = useState("light");
  const [status, setStatus] = useState("available");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // New state for tabs and filters
  const [activeTab, setActiveTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'failed'>('all');
  const [tokenFilter, setTokenFilter] = useState<'all' | 'usdc' | 'sol'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Hooks
  const { usdcBalance: balance } = useBalance();
  const userContext = useUser();
  const wallet = useWallet({ type: "solana" });
  
  // Transaction history hook with filters
  const { 
    transactions: allTransactions, 
    loading: transactionsLoading,
    error: transactionsError,
    refresh: refreshTransactions,
    loadMore,
    hasMore,
    pagination
  } = useTransactionHistory({
    filters: {
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(tokenFilter !== 'all' && { tokenName: tokenFilter }),
    },
    limit: 20,
    autoFetch: true,
  });

  const statusOptions = [
    { value: "available", label: "Available", color: "bg-green-500" },
    { value: "busy", label: "Busy", color: "bg-red-500" },
    { value: "away", label: "Away", color: "bg-yellow-500" },
    { value: "invisible", label: "Invisible", color: "bg-gray-500" },
  ];

  // Store Google credentials when user data becomes available
  useEffect(() => {
    if (userContext.user && userContext.user.name && userContext.user.picture) {
      saveGoogleCredentials({
        name: userContext.user.name,
        picture: userContext.user.picture,
        email: userContext.user.email,
      });
    }
  }, [userContext.user]);

  // Load preferences
  useEffect(() => {
    try {
      const savedPreferences = getUserPreferences();

      if (savedPreferences) {
        setSelectedAvatar(savedPreferences.selectedAvatar || 0);
        setUseGoogleAvatar(
          savedPreferences.useGoogleAvatar !== undefined
            ? savedPreferences.useGoogleAvatar
            : true
        );
        setUsername(savedPreferences.username || "");
        setUseGoogleName(
          savedPreferences.useGoogleName !== undefined
            ? savedPreferences.useGoogleName
            : true
        );
        setTheme(savedPreferences.theme || "light");
        setStatus(savedPreferences.status || "available");
      } else {
        const displayCreds = getDisplayCredentials();
        if (
          displayCreds.hasCustomPreferences === false &&
          displayCreds.name !== "User"
        ) {
          setUseGoogleName(true);
          setUseGoogleAvatar(true);
        }
      }
    } catch (error) {
      console.error("Error loading preferences from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUserProfileToBackend = async () => {
    const avatarUrl = getCurrentAvatar();
    const finalUsername = getCurrentUsername();

    const profileData = {
      username: finalUsername,
      avatarUrl: avatarUrl,
    };

    try {
      setIsSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Profile data to be sent to backend:", profileData);
      console.log("✅ Profile saved successfully to backend (mock)");
      return true;
    } catch (error) {
      console.error("Error saving profile to backend:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    const currentPreferences: UserPreferences = {
      selectedAvatar,
      useGoogleAvatar,
      username,
      useGoogleName,
      theme,
      status,
      lastUpdated: new Date().toISOString(),
    };

    saveUserPreferences(currentPreferences);

    const backendSuccess = await saveUserProfileToBackend();

    if (backendSuccess) {
      setIsEditing(false);
      toast.success("Profile saved successfully");
    } else {
      toast.error("Error saving profile. Please try again.");
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Address copied");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const getCurrentAvatar = () => {
    const avatarOptions = getAvatarOptions();

    if (useGoogleAvatar) {
      if (userContext.user?.picture) {
        return userContext.user.picture;
      }
      const displayCreds = getDisplayCredentials();
      if (displayCreds.avatar) {
        return displayCreds.avatar;
      }
    }
    return avatarOptions[selectedAvatar];
  };

  const getCurrentUsername = () => {
    if (useGoogleName) {
      if (userContext.user?.name) {
        return userContext.user.name;
      }
      const displayCreds = getDisplayCredentials();
      return displayCreds.name;
    }
    return username || userContext.user?.name || "Enter username";
  };

  const hasGoogleCredentials = () => {
    const displayCreds = getDisplayCredentials();
    return displayCreds.name !== "User" || displayCreds.avatar !== null;
  };

  const getGoogleDisplayName = () => {
    if (userContext.user?.name) {
      return userContext.user.name;
    }
    const googleCreds = getGoogleCredentials();
    return googleCreds?.name || "No Google name available";
  };

  const handleTransferClick = () => {
    setShowTransferModal(true);
  };

  const handleModalClose = () => {
    setShowTransferModal(false);
  };

  const mockTransferParticipant = {
    id: "transfer-" + Date.now(),
    userName: "Enter Recipient",
    walletAddress: "",
    userType: "guest" as const,
    avatarUrl: "",
  };

  // Calculate statistics from transactions
  const calculateStats = useCallback(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let totalEarnings = 0;
    let totalWithdrawals = 0;
    let monthlyEarnings = 0;
    let pendingAmount = 0;

    if (allTransactions && allTransactions.length > 0) {
      allTransactions.forEach((tx: any) => {
        const amount = Math.abs(parseFloat(tx.amount || 0));
        const txDate = new Date(tx.createdAt || tx.updatedAt);
        
        // Determine if it's a credit (incoming) or debit (outgoing)
        const isCredit = tx.senderAddress !== wallet?.address;
        
        if (isCredit) {
          totalEarnings += amount;
          
          // Calculate monthly earnings
          if (txDate >= firstDayOfMonth) {
            monthlyEarnings += amount;
          }
        } else {
          totalWithdrawals += amount;
        }

        // Track pending amounts
        if (tx.status === 'pending') {
          pendingAmount += amount;
        }
      });
    }

    // Calculate percentage change (comparing monthly to total)
    const monthlyChangePercent = totalEarnings > 0 
      ? ((monthlyEarnings / totalEarnings) * 100).toFixed(1) 
      : "0.0";

    return {
      totalEarnings,
      totalWithdrawals,
      pendingAmount,
      monthlyEarnings,
      monthlyChangePercent,
    };
  }, [allTransactions, wallet?.address]);

  // Format transaction for display
  const formatTransaction = (tx: any) => {
    const amount = Math.abs(parseFloat(tx.amount || 0));
    const isCredit = tx.senderAddress !== wallet?.address;
    
    return {
      id: tx.id || tx.signature || Math.random().toString(),
      type: isCredit ? 'credit' : 'debit',
      amount: amount,
      description: tx.narration || tx.transactionType || (isCredit ? 'Received' : 'Sent'),
      date: tx.createdAt || tx.updatedAt || new Date().toISOString(),
      status: tx.status || 'completed',
      tokenName: tx.tokenName || 'USDC',
      signature: tx.signature,
      stream: tx.stream,
      senderAddress: tx.senderAddress,
      recipientAddress: tx.recipientAddress,
    };
  };

  // Get formatted and sorted transactions
  const formattedTransactions = useCallback(() => {
    if (!allTransactions) return [];
    
    return allTransactions
      .map(formatTransaction)
      .sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [allTransactions, wallet?.address]);

  const stats = calculateStats();
  const displayTransactions = formattedTransactions();

  // Export transactions as CSV
  const handleExportTransactions = () => {
    const csvContent = [
      ['Date', 'Description', 'Type', 'Amount', 'Token', 'Status', 'Signature'],
      ...displayTransactions.map((tx: any) => [
        new Date(tx.date).toLocaleString(),
        tx.description,
        tx.type,
        tx.amount.toFixed(6),
        tx.tokenName,
        tx.status,
        tx.signature || '',
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Transactions exported');
  };

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter('all');
    setTokenFilter('all');
    setShowFilterMenu(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <p className="text-[#36008D] text-2xl lg:text-4xl font-bold my-3 font-poppins">
                StreamLink
              </p>
              <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
                  <div className="w-24 h-6 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded mx-auto animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="w-40 h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
                <div className="space-y-4">
                  <div className="w-full h-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CustomWalletProvider userWallet={wallet}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-[#36008D] text-2xl lg:text-4xl font-bold font-poppins">
                StreamLink
              </p>
              {isEditing ? (
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSave size={16} />
                  <span>{isSaving ? "Saving..." : "Save Profile"}</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <CiEdit size={20} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                {/* Profile Picture */}
                <div className="text-center mb-6">
                  <div className="relative inline-block mb-4">
                    <img
                      src={getCurrentAvatar()}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-purple-200"
                    />
                    <div
                      className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-3 border-white ${
                        statusOptions.find((s) => s.value === status)?.color
                      }`}
                    ></div>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{getCurrentUsername()}</h3>
                  <p className="text-sm text-gray-500">
                    @{(getCurrentUsername() ?? "username").toLowerCase().replace(/\s+/g, "") || "username"}
                  </p>
                  
                  {/* Status */}
                  <div className="flex items-center justify-center space-x-2 mt-3">
                    <div className={`w-2 h-2 rounded-full ${statusOptions.find((s) => s.value === status)?.color}`}></div>
                    <span className="text-xs font-medium text-gray-700">
                      {statusOptions.find((s) => s.value === status)?.label}
                    </span>
                  </div>
                </div>

                {/* Wallet Info */}
                <div className="space-y-3 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">Wallet Address</span>
                      <button
                        onClick={() => copyText(wallet?.address || "")}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Copy wallet address"
                      >
                        <IoCopyOutline size={14} className="text-gray-600" />
                      </button>
                    </div>
                    <div className="text-xs font-mono text-gray-800 break-all">
                      {wallet?.address ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}` : "Not connected"}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                    <span className="text-xs text-purple-100 block mb-1">Balance</span>
                    <div className="text-xl font-bold mb-2">{balance.toFixed(6)} USDC</div>
                    <button 
                      onClick={handleTransferClick}
                      className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-white text-purple-600 text-sm rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <FiSend size={14} />
                      <span>Transfer</span>
                    </button>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                  {[
                    { id: 'overview', icon: Activity, label: 'Overview' },
                    { id: 'transactions', icon: CreditCard, label: 'Transactions' },
                    { id: 'settings', icon: CiSettings, label: 'Settings' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                        activeTab === item.id
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm">Current Balance</span>
                        <DollarSign className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">${balance.toFixed(2)}</div>
                      <div className="mt-2 text-sm text-green-600">+{stats.monthlyChangePercent}% this month</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm">Total Earnings</span>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">${stats.totalEarnings.toFixed(2)}</div>
                      <div className="mt-2 text-sm text-gray-500">All time</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm">Pending</span>
                        <Clock className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">${stats.pendingAmount.toFixed(2)}</div>
                      <div className="mt-2 text-sm text-gray-500">Processing</div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                      <button
                        onClick={refreshTransactions}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Refresh
                      </button>
                    </div>
                    {transactionsLoading && displayTransactions.length === 0 ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1">
                              <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                              <div className="w-20 h-3 bg-gray-200 rounded"></div>
                            </div>
                            <div className="w-20 h-5 bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : displayTransactions.length > 0 ? (
                      <div className="space-y-3">
                        {displayTransactions.slice(0, 5).map((tx: any) => (
                          <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                tx.type === 'credit' ? 'bg-green-50' : 'bg-red-50'
                              }`}>
                                {tx.type === 'credit' ? (
                                  <ArrowDownLeft className="w-5 h-5 text-green-600" />
                                ) : (
                                  <ArrowUpRight className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-sm">{tx.description}</div>
                                <div className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No transactions yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">All Transactions</h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <button 
                          onClick={() => setShowFilterMenu(!showFilterMenu)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <Filter className="w-4 h-4" />
                          Filter
                          {(statusFilter !== 'all' || tokenFilter !== 'all') && (
                            <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                          )}
                        </button>
                        
                        {showFilterMenu && (
                          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                              <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                <option value="all">All Status</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                              </select>
                            </div>
                            
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Token</label>
                              <select 
                                value={tokenFilter}
                                onChange={(e) => setTokenFilter(e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                <option value="all">All Tokens</option>
                                <option value="usdc">USDC</option>
                                <option value="sol">SOL</option>
                              </select>
                            </div>
                            
                            <button
                              onClick={handleResetFilters}
                              className="w-full px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                              Reset Filters
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={handleExportTransactions}
                        disabled={displayTransactions.length === 0}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                  </div>
                  
                  {transactionsError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {transactionsError}
                    </div>
                  )}
                  
                  {transactionsLoading && displayTransactions.length === 0 ? (
                    <div className="space-y-2">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="w-40 h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="w-24 h-3 bg-gray-200 rounded"></div>
                          </div>
                          <div className="w-24 h-5 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : displayTransactions.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {displayTransactions.map((tx: any) => (
                          <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                tx.type === 'credit' ? 'bg-green-50' : 'bg-red-50'
                              }`}>
                                {tx.type === 'credit' ? (
                                  <ArrowDownLeft className="w-5 h-5 text-green-600" />
                                ) : (
                                  <ArrowUpRight className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{tx.description}</div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                  <span>{new Date(tx.date).toLocaleDateString()}</span>
                                  {tx.stream && (
                                    <>
                                      <span>•</span>
                                      <span>{tx.stream.title || tx.stream.name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                              </div>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                {tx.status === 'confirmed' ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : tx.status === 'pending' ? (
                                  <Clock className="w-3 h-3 text-yellow-500" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-500" />
                                )}
                                <span className={`text-xs ${
                                  tx.status === 'confirmed' ? 'text-green-600' : 
                                  tx.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {tx.status}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">• {tx.tokenName}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Load More Button */}
                      {hasMore && (
                        <div className="mt-6 text-center">
                          <button
                            onClick={loadMore}
                            disabled={transactionsLoading}
                            className="px-6 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {transactionsLoading ? 'Loading...' : 'Load More'}
                          </button>
                        </div>
                      )}
                      
                      {/* Pagination Info */}
                      {pagination && (
                        <div className="mt-4 text-center text-sm text-gray-500">
                          Showing {displayTransactions.length} of {pagination.total} transactions
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="mb-2">No transactions found</p>
                      {(statusFilter !== 'all' || tokenFilter !== 'all') && (
                        <button
                          onClick={handleResetFilters}
                          className="text-purple-600 hover:text-purple-700 text-sm"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {/* Profile Picture Settings */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CiCamera size={20} className="mr-2 text-purple-600" />
                      Profile Picture
                    </h3>

                    <div className="mb-6">
                      <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          checked={useGoogleAvatar}
                          onChange={() => setUseGoogleAvatar(true)}
                          className="text-purple-600"
                          disabled={!isEditing}
                        />
                        <img
                          src={getCurrentAvatar()}
                          alt="Google"
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Use Google Profile Picture</div>
                          <div className="text-sm text-gray-600">
                            {userContext.user?.picture ? "From your Google account" : "From saved Google credentials"}
                            {!userContext.user?.picture && hasGoogleCredentials() && (
                              <span className="text-gray-500 ml-1">(saved)</span>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Or choose a custom avatar:
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {getAvatarOptions().map((avatar, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              if (isEditing) {
                                setSelectedAvatar(index);
                                setUseGoogleAvatar(false);
                              }
                            }}
                            disabled={!isEditing}
                            className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                              selectedAvatar === index && !useGoogleAvatar
                                ? "border-purple-500 ring-2 ring-purple-200"
                                : "border-gray-200 hover:border-purple-300"
                            } ${!isEditing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                            {selectedAvatar === index && !useGoogleAvatar && (
                              <div className="absolute inset-0 bg-purple-600 bg-opacity-20 flex items-center justify-center">
                                <FaCheck size={16} className="text-purple-600" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Username Settings */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CiUser size={20} className="mr-2 text-purple-600" />
                      Username
                    </h3>

                    <div className="mb-4">
                      <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          checked={useGoogleName}
                          onChange={() => setUseGoogleName(true)}
                          className="text-purple-600"
                          disabled={!isEditing}
                        />
                        <div>
                          <div className="font-medium text-gray-900">Use Google Name</div>
                          <div className="text-sm text-gray-600">
                            {getGoogleDisplayName()}
                            {!userContext.user?.name && hasGoogleCredentials() && (
                              <span className="text-gray-500 ml-1">(saved)</span>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="radio"
                          checked={!useGoogleName}
                          onChange={() => setUseGoogleName(false)}
                          className="text-purple-600"
                          disabled={!isEditing}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-2">Custom Username</div>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            disabled={!isEditing || useGoogleName}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CiSettings size={20} className="mr-2 text-purple-600" />
                      Preferences
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Availability Status
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {statusOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => isEditing && setStatus(option.value)}
                              disabled={!isEditing}
                              className={`flex items-center space-x-3 p-3 border rounded-lg transition-all ${
                                status === option.value
                                  ? "border-purple-500 bg-purple-50"
                                  : "border-gray-200 hover:border-purple-300"
                              } ${!isEditing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                              <span className="text-sm font-medium">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Theme Preference
                        </label>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => isEditing && setTheme("light")}
                            disabled={!isEditing}
                            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-all ${
                              theme === "light"
                                ? "border-purple-500 bg-purple-50 text-purple-700"
                                : "border-gray-200 text-gray-700 hover:border-purple-300"
                            } ${!isEditing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <IoSunnyOutline size={16} />
                            <span>Light</span>
                          </button>
                          <button
                            onClick={() => isEditing && setTheme("dark")}
                            disabled={!isEditing}
                            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-all ${
                              theme === "dark"
                                ? "border-purple-500 bg-purple-50 text-purple-700"
                                : "border-gray-200 text-gray-700 hover:border-purple-300"
                            } ${!isEditing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <FiMoon size={16} />
                            <span>Dark</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {showTransferModal && (
          <SendModal
            selectedUser={mockTransferParticipant}
            closeFunc={handleModalClose}
          />
        )}
      </div>
    </CustomWalletProvider>
  );
};

export default UserProfilePage;