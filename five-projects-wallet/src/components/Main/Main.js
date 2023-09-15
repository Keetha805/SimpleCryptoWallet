import { useEffect, useState } from "react";
import { AccountInterface } from "../AccountInterface";
import { NewWallet } from "../NewWallet";
import { fetchBackend } from "../Functions";

export const Main = () => {
  const [isNewWallet, setIsNewWallet] = useState(undefined);

  const initializeWallet = async () => {
    setIsNewWallet((await fetchBackend("/isNewWallet")).isNewWallet);
  };

  useEffect(() => {
    initializeWallet();
  }, []);

  return (
    <>
      {isNewWallet == undefined ? (
        <></>
      ) : isNewWallet ? (
        <NewWallet setIsNewWallet={setIsNewWallet}></NewWallet>
      ) : (
        <AccountInterface></AccountInterface>
      )}
    </>
  );
};
