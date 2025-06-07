import { CivicAuthProvider } from "@civic/auth-web3/react";

const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <CivicAuthProvider clientId="52b8d7c5-1789-43ff-9614-8857ca81d795">
      {children}
    </CivicAuthProvider>
  );
};

export default WalletProvider;