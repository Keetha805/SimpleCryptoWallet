import { useEffect, useState } from "react";
import { AccountsModal } from "./Modals/AccountsModal";
import { NetworksModal } from "./Modals/NetworksModal";
import { Wallet } from "./Wallet";
import { CopyAddress } from "./CopyAddress";
import { fetchBackend } from "./Functions";
import { LockWallet } from "./LockWallet";

export const AccountInterface = () => {
  const [accountSelected, setAccountSelected] = useState("");
  const [networkSelected, setNetworkSelected] = useState("");

  const [showLockWallet, setShowLockWallet] = useState(true);

  const maxTimeToLock = 10 * 60 * 1000;

  window.addEventListener("blur", async () => {
    await fetchBackend("/cancelCancel");
    setTimeout(async () => {
      await fetchBackend("/lockWallet");
      setShowLockWallet((await fetchBackend("/isWalletLocked")).isWalletLocked);
    }, maxTimeToLock);
  });

  window.addEventListener("pagehide", async () => {
    await fetchBackend("/cancelCancel");
    setTimeout(async () => {
      await fetchBackend("/lockWallet");
      setShowLockWallet((await fetchBackend("/isWalletLocked")).isWalletLocked);
    }, maxTimeToLock);
  });

  window.addEventListener("focus", async () => {
    await fetchBackend("/deleteTimeout");
  });

  window.addEventListener("pageshow", async () => {
    await fetchBackend("/deleteTimeout");
  });

  const initializeWallet = async () => {
    setShowLockWallet((await fetchBackend("/isWalletLocked")).isWalletLocked);
  };

  useEffect(() => {
    initializeWallet();
  }, []);

  return (
    <>
      {showLockWallet ? (
        <LockWallet
          showLockWallet={showLockWallet}
          setShowLockWallet={setShowLockWallet}
        ></LockWallet>
      ) : (
        <>
          <div id="header">
            <NetworksModal
              setNetworkSelectedExternal={setNetworkSelected}
            ></NetworksModal>
            <AccountsModal
              setAccountSelectedExternal={setAccountSelected}
            ></AccountsModal>

            <CopyAddress
              accountSelectedAddress={accountSelected.address}
            ></CopyAddress>

            <button>...</button>
          </div>
          <div id="body">
            <Wallet
              accountSelected={accountSelected}
              networkSelected={networkSelected}
            ></Wallet>
          </div>
        </>
      )}
    </>
  );
};
