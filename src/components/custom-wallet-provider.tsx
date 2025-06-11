import React, { useEffect } from "react";
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

  useEffect(() => {
    // Only proceed if we have both address and wallet
    if (userWallet && userWallet.address && userWallet.wallet) {
      try {
        // Create a PublicKey from the address
        const publicKey = new PublicKey(userWallet.address);
        
        // Create a signer object that wraps the wallet's signTransaction method
        const signer = {
          signTransaction: userWallet.wallet.signTransaction.bind(userWallet.wallet)
        };
        
        // Connect this wallet to the SDK's wallet context
        connectWallet(publicKey, signer);
        
        // Store necessary information in localStorage
        localStorage.setItem("walletPublicKey", publicKey.toBase58());
        localStorage.setItem("walletType", "metakeep");
        
        console.log("Custom wallet connected to SDK:", publicKey.toBase58());
      } catch (error) {
        console.error("Failed to connect custom wallet:", error);
      }
    } else {
      // If we don't have a complete wallet, clean up
      clearWallet();
    }
  }, [userWallet, connectWallet, clearWallet]);

  return (
    <>
      <WalletAdapterBridge />
      {children}
    </>
  );
};