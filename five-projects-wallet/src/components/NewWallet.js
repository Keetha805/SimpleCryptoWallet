import { sha256 } from "js-sha256";
import { fetchBackend } from "./Functions";
import { useEffect } from "react";

export const NewWallet = ({ setIsNewWallet }) => {
  const createWallet = async () => {
    const valid = validatePasswords();

    if (valid) {
      const { result } = await fetchBackend("/setWalletPassword", "POST", {
        hashedPassword: sha256(document.getElementById("password").value),
        hashedHashedPassword: sha256(
          sha256(document.getElementById("password").value)
        ),
      });
      if (result) {
        await fetchBackend("/addAccount", "POST", {
          accountName: "Account 1",
        });
        setIsNewWallet(false);
      }
    }
  };

  const validatePasswords = () => {
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("passwordConfirm").value;
    const inputsErrorSpan = document.getElementById("inputsErrorSpan");
    const button = document.getElementById("inputsErrorSpan");

    if (password === passwordConfirm) {
      inputsErrorSpan.textContent = "";
      button.disabled = false;
      return true;
    } else {
      inputsErrorSpan.textContent = "Both passwords doesn't coincide";
      button.disabled = true;
      return false;
    }
  };

  const changeInputType = (e) => {
    e.target.previousElementSibling.type == "password"
      ? (e.target.previousElementSibling.type = "text")
      : (e.target.previousElementSibling.type = "password");
  };

  useEffect(() => {
    document.getElementById("password").type = "password";
    document.getElementById("passwordConfirm").type = "password";
  }, []);

  return (
    <>
      <div>
        <h3>
          Create new wallet<button>X</button>
        </h3>
        <label>Insert wallet Password</label>
        <input id="password"></input>
        <button onClick={changeInputType}>👁️‍🗨️</button>
        <label>Confirm wallet Password</label>
        <input id="passwordConfirm"></input>
        <button onClick={changeInputType}>👁️‍🗨️</button>
        <span id="inputsErrorSpan"></span>
        <button onClick={createWallet}>Create wallet</button>
      </div>
    </>
  );
};
