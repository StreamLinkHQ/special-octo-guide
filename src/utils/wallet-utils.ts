import { PublicKey } from "@solana/web3.js";
// import { WalletSigner } from "@solana/wallet-adapter-base";
// import { useWalletContext } from "@vidbloq/react";

/**
 * Prepares the auth provider wallet for integration with the SDK
 * @param userWallet - The wallet object provided by your auth provider
 * @returns An object containing the public key and necessary functions
 */
export const prepareUserWallet = (userWallet: {
  address: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: any; // Your MetakeepSolanaWalletAdapter
}) => {
  try {
    // 1. Create a PublicKey from the address
    const publicKey = new PublicKey(userWallet.address);
    
    // 2. Verify the key is valid
    if (!PublicKey.isOnCurve(publicKey.toBytes())) {
      console.error("Invalid public key: not on curve");
      return null;
    }
    
    // 3. Store the public key in localStorage
    localStorage.setItem("walletPublicKey", publicKey.toBase58());
    
    // 4. Create a custom wallet type identifier
    const walletType = "metakeep";
    localStorage.setItem("walletType", walletType);
    
    console.log("Wallet prepared for SDK:", publicKey.toBase58());
    
    // 5. Return the prepared wallet data
    return {
      publicKey,
      address: userWallet.address,
      signTransaction: userWallet.wallet.signTransaction.bind(userWallet.wallet),
      walletType
    };
  } catch (error) {
    console.error("Failed to prepare wallet:", error);
    return null;
  }
};

/**
 * Clears the wallet data from localStorage
 */
export const clearUserWallet = (): void => {
  localStorage.removeItem("walletPublicKey");
  localStorage.removeItem("walletType");
};