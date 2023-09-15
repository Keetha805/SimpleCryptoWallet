import { sha256 } from "js-sha256";
import { fetchBackend } from "./Functions";
import { useEffect } from "react";

export const LockWallet = ({ showLockWallet, setShowLockWallet }) => {
  const validPassword = async () => {
    const span = document.getElementById("walletPasswordErrorSpan");
    const hashedPassword = sha256(document.getElementById("password").value);
    const hashedHashedPassword = sha256(
      sha256(document.getElementById("password").value)
    );

    const { result } = await fetchBackend("/unlockWallet", "POST", {
      hashedPassword: hashedPassword,
      hashedHashedPassword: hashedHashedPassword,
    });

    if (result) {
      setShowLockWallet(false);
      span.textContent = "";
    } else {
      span.textContent = "Invalid password";
    }
  };

  const changeInputType = (e) => {
    e.target.previousElementSibling.type == "password"
      ? (e.target.previousElementSibling.type = "text")
      : (e.target.previousElementSibling.type = "password");
  };

  useEffect(() => {
    document.getElementById("password").type = "password";
  }, []);

  return (
    <>
      <div id="LockWallet" hidden={!showLockWallet}>
        <h3>Unlock Wallet</h3>
        <label>Wallet password:</label>
        <input id="password"></input>
        <button onClick={changeInputType}>👁️‍🗨️</button>
        <span id="walletPasswordErrorSpan"></span>
        <button onClick={validPassword}>Unlock</button>
      </div>
    </>
  );
};
