import React, { useEffect, useCallback, useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWalletContext, WalletAdapterBridge } from "@vidbloq/react";

interface CustomWalletProviderProps {
  children: React.ReactNode;
  userWallet: {
    address?: string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wallet?: any;
  } | null | undefined;
}

export const CustomWalletProvider: React.FC<CustomWalletProviderProps> = ({ 
  children, 
  userWallet 
}) => {
  const { connectWallet, clearWallet } = useWalletContext();

  // Memoize wallet connection check to prevent unnecessary re-runs
  const isWalletReady = useMemo(() => {
    return userWallet && userWallet.address && userWallet.wallet;
  }, [userWallet]);

  // Memoize the signer creation to prevent recreation on every render
  const signer = useMemo(() => {
    if (!isWalletReady || !userWallet?.wallet) return undefined;
    
    return {
      signTransaction: userWallet.wallet.signTransaction.bind(userWallet.wallet)
    };
  }, [isWalletReady, userWallet?.wallet]);

  const connectWalletCallback = useCallback(async () => {
    if (!isWalletReady || !userWallet?.address || !signer) return;

    try {
      // Check if already connected to avoid redundant operations
      const storedPublicKey = localStorage.getItem("walletPublicKey");
      const publicKeyString = new PublicKey(userWallet.address).toBase58();
      
      if (storedPublicKey === publicKeyString) {
        console.log("Wallet already connected, skipping reconnection");
        return;
      }

      const publicKey = new PublicKey(userWallet.address);
      
      // Connect this wallet to the SDK's wallet context
      connectWallet(publicKey, signer);
      
      // Store necessary information in localStorage
      localStorage.setItem("walletPublicKey", publicKey.toBase58());
      localStorage.setItem("walletType", "metakeep");
      
      console.log("Custom wallet connected to SDK:", publicKey.toBase58());
    } catch (error) {
      console.error("Failed to connect custom wallet:", error);
    }
  }, [isWalletReady, userWallet?.address, connectWallet, signer]);

  const clearWalletCallback = useCallback(() => {
    // Clear stored wallet info
    localStorage.removeItem("walletPublicKey");
    localStorage.removeItem("walletType");
    clearWallet();
  }, [clearWallet]);

  useEffect(() => {
    if (isWalletReady) {
      connectWalletCallback();
    } else {
      clearWalletCallback();
    }
  }, [isWalletReady, connectWalletCallback, clearWalletCallback]);

  return (
    <>
      <WalletAdapterBridge />
      {children}
    </>
  );
};