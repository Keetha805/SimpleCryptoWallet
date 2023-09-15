import { useEffect, useState } from "react";
import { endsWith, fetchBackend, getAccounts, getTokens } from "../Functions";

export const SendModal = ({
  client,
  ethBalance,
  accountSelected,
  showSendToModal,
  tokenToSend,
  setTokenToSend,
  setShowActivityTab,
  setShowSendToModal,
  setShowTokensTab,
}) => {
  const [showSendModal, setShowSendModal] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [addressToSendTo, setAddressToSendTo] = useState("");

  const calcTokenBalance = async () => {
    if (tokenToSend === "") {
      return 0;
    }

    if (endsWith("ETH", tokenToSend.symbol)) {
      setTokenBalance(ethBalance);
      return ethBalance;
    } else {
      const newTokenBalance = (
        await fetchBackend("/tokenBalance", "POST", {
          tokenAddress: tokenToSend.address,
        })
      ).tokenBalance;

      setTokenBalance(newTokenBalance);
      return newTokenBalance;
    }
  };

  const initializeSendModal = async (token, account) => {
    setAddressToSendTo(account.address);

    document.getElementById("SendToAccountName").textContent = account.name;
    document.getElementById("SendToAccountAddress").textContent =
      account.address;
    document.getElementById("AmountToSend").value = "";
    document.getElementById("AmountCurrencySymbolSpan").textContent =
      token.symbol;

    const tokenList = document.getElementById("SendTokensList");
    tokenList.innerHTML = "";

    const buttonTokenSelected = document.getElementById("SendTokenSelected");
    const spanTokenName = document.createElement("span");
    const spanSaldo = document.createElement("span");
    const spanTokenBalance = document.createElement("span");
    const br = document.createElement("br");

    buttonTokenSelected.onclick = function () {
      if (tokenList.innerHTML === "") {
        buildTokensList(account);
      } else {
        tokenList.innerHTML = "";
      }
    };

    spanTokenName.textContent = token.symbol;
    spanSaldo.textContent = "Saldo: ";

    const tokenBalance = endsWith("ETH", token.symbol)
      ? ethBalance
      : (
          await fetchBackend("/tokenBalance", "POST", {
            tokenAddress: token.address,
          })
        ).tokenBalance;
    spanTokenBalance.textContent = tokenBalance + " " + token.symbol;

    buttonTokenSelected.innerHTML = "";
    buttonTokenSelected.appendChild(spanTokenName);
    buttonTokenSelected.appendChild(br);
    buttonTokenSelected.appendChild(spanSaldo);
    buttonTokenSelected.appendChild(spanTokenBalance);
  };

  const buildTokensList = async (account) => {
    const tokens = await getTokens();
    const tokensList = document.getElementById("SendTokensList");
    const fragment = document.createDocumentFragment();

    for (let index in tokens) {
      const token = tokens[index];

      const div = document.createElement("div");
      const spanName = document.createElement("span");
      const br = document.createElement("br");
      const spanBalance = document.createElement("span");

      div.className = "divContainerHover";
      div.onclick = function () {
        setTokenToSend(token);
        initializeSendModal(token, account);
      };

      spanName.textContent = token.symbol;

      let balance;
      if (endsWith("ETH", token.symbol)) {
        balance = ethBalance;
      } else {
        const { tokenBalance } = await fetchBackend("/tokenBalance", "POST", {
          tokenAddress: token.address,
        });
        balance = tokenBalance;
      }

      spanBalance.textContent = balance + " " + token.symbol;

      div.appendChild(spanName);
      div.appendChild(br);
      div.appendChild(spanBalance);

      fragment.appendChild(div);
    }
    tokensList.innerHTML = "";
    tokensList.appendChild(fragment);
  };

  const buildAccountsList = async () => {
    const accounts = await getAccounts();
    const accountsList = document.getElementById("SendAccountsList");

    if (accounts.length <= 0) {
      accountsList.innerHTML = "No accounts created";
      return;
    }

    const fragment = document.createDocumentFragment();
    for (let index in accounts) {
      const account = accounts[index];

      if (account.address == accountSelected.address) {
        continue;
      }

      const div = document.createElement("div");
      const spanName = document.createElement("span");
      const br = document.createElement("br");
      const spanAddress = document.createElement("span");

      div.className = "divContainerHover";
      div.onclick = function () {
        initializeSendModal(tokenToSend, account);
        setShowSendModal(true);
        setShowSendToModal(false);
      };

      spanName.textContent = account.name;
      spanAddress.textContent = account.address;

      div.appendChild(spanName);
      div.appendChild(br);
      div.appendChild(spanAddress);

      fragment.appendChild(div);
    }

    accountsList.innerHTML = "";
    accountsList.appendChild(fragment);
  };

  const sendTransaction = async () => {
    const amountToSend = document.getElementById("AmountToSend");
    const value = {
      tokenToSend: tokenToSend,
      addressToSendTo: addressToSendTo,
      amountToSend: amountToSend.value,
    };
    client.send(
      JSON.stringify({
        type: "message",
        name: "sendTransaction",
        body: value,
      })
    );

    closeModals();
  };

  const handleAmountChange = (e) => {
    const amountErrorSpan = document.getElementById("AmountToSendErrorSpan");
    const sendButton = document.getElementById("SendButton");
    const newAmount = e.target.value;
    if (newAmount > tokenBalance) {
      amountErrorSpan.textContent = "Insufficient funds";
      sendButton.disabled = true;
    } else if (newAmount.startsWith("-")) {
      amountErrorSpan.textContent = "You can't send negative amounts of ETH";
      sendButton.disabled = true;
    } else {
      amountErrorSpan.textContent = "";
      sendButton.disabled = false;
    }
  };

  const handleMaxBalanceButton = async () => {
    const amountInput = document.getElementById("AmountToSend");

    amountInput.value = tokenBalance;
  };

  const closeModals = () => {
    closeSendModal();
    setShowSendToModal(false);
    setShowTokensTab(true);
    //------------------------------------Not setShow but changing Tab selected---------------------------------
    setShowActivityTab(true);
  };

  const closeSendModal = () => {
    setShowSendModal(false);
    setShowSendToModal(true);
    document.getElementById("AmountToSend").value = 0;
    setAddressToSendTo("");
  };

  useEffect(() => {
    buildAccountsList();
    calcTokenBalance();
  }, []);

  useEffect(() => {
    if (tokenToSend !== "") {
      calcTokenBalance();
    }
  }, [tokenToSend]);

  useEffect(() => {
    if (showSendToModal) {
      buildAccountsList();
    }
  }, [showSendToModal, ethBalance]);

  return (
    <>
      <div id="SendModalContainer">
        <div id="SendToModal" hidden={!showSendToModal}>
          <h3>
            Send Modal<button onClick={closeModals}>X</button>
          </h3>
          <div id="SendAccountsList"></div>
        </div>

        <div id="SendModal" hidden={!showSendModal}>
          <h3>
            Send<button onClick={closeSendModal}>X</button>
          </h3>
          <div>
            <span id="SendToAccountName">{accountSelected.name}</span>
            <br></br>
            <span id="SendToAccountAddress">{accountSelected.address}</span>
            <button onClick={closeSendModal}>X</button>
          </div>
          <br></br>
          <div>
            <span>Activos</span>
            <button id="SendTokenSelected"></button>
            <div id="SendTokensList"></div>
          </div>
          <br></br>
          <div>
            <span>Importe:</span>
            <button onClick={handleMaxBalanceButton}>Máx.</button>
            <input
              id="AmountToSend"
              type="number"
              placeholder="0"
              onChange={handleAmountChange}
            ></input>
            <span id="AmountCurrencySymbolSpan"></span>
            <br></br>
            <span id="AmountToSendErrorSpan"></span>
          </div>
          <br></br>

          <button onClick={closeModals}>Cancel</button>
          <button id="SendButton" onClick={sendTransaction}>
            Send
          </button>
        </div>
      </div>
    </>
  );
};
