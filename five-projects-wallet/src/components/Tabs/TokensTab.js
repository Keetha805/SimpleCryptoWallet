import { useEffect, useState } from "react";
import {
  fetchBackend,
  getNetworkSelected,
  getTokens,
  endsWith,
} from "../Functions";
import { ActivityTab } from "./ActivityTab";

export const TokensTab = ({
  accountSelected,
  networkSelected,
  ethBalance,
  tokenToSend,
  showTokensTab,
  setShowTokensTab,
  setShowSendToModal,
  setTokenToSend,
  client,
  buildTransactionModal,
}) => {
  const [showImportTokenModal, setShowImportTokenModal] = useState(false);
  const [showTokenTab, setShowTokenTab] = useState(false);

  const [tokenDecimals, setTokenDecimals] = useState(0);
  const [tokenSymbol, setTokenSymbol] = useState("");

  const [tokenSelected, setTokenSelected] = useState(tokenToSend.symbol);

  const buildTokenTab = (token, tokenBalance) => {
    const tokenTab = document.getElementById("TokenTab");

    const divContainer = document.createElement("div");
    const div = document.createElement("div");
    const h3Title = document.createElement("h3");
    const buttonClose = document.createElement("button");
    const spanBalance = document.createElement("span");
    const buttonBuy = document.createElement("button");
    const buttonSend = document.createElement("button");

    h3Title.textContent = token.symbol;

    buttonClose.textContent = "X";
    buttonClose.onclick = function () {
      closeTab();
      return;
    };

    buttonBuy.disabled = true;
    buttonSend.onclick = function () {
      setShowTokensTab(false);
      tokenTab.innerHTML = "";
      setShowSendToModal(true);
    };

    spanBalance.textContent = tokenBalance;

    buttonBuy.textContent = "Buy";
    buttonSend.textContent = "Send";

    h3Title.appendChild(buttonClose);

    div.appendChild(buttonBuy);
    div.appendChild(buttonSend);

    if (!endsWith("ETH", token.symbol)) {
      const buttonDelete = document.createElement("button");
      buttonDelete.textContent = "Delete";
      buttonDelete.onclick = function () {};
      div.appendChild(buttonDelete);
    }

    divContainer.appendChild(h3Title);
    divContainer.appendChild(spanBalance);
    divContainer.appendChild(div);

    tokenTab.innerHTML = "";
    tokenTab.appendChild(divContainer);
    setShowTokenTab(true);
  };

  const buildTokenBalances = async () => {
    const tokens = await getTokens();
    const tokensList = document.getElementById("TokensList");
    const fragment = document.createDocumentFragment();

    for (let index in tokens) {
      const token = tokens[index];

      let balance;
      if (endsWith("ETH", token.symbol)) {
        balance = ethBalance;
      } else {
        let { tokenBalance } = await fetchBackend("/tokenBalance", "POST", {
          tokenAddress: token.address,
        });
        balance = tokenBalance;
      }

      const div = document.createElement("div");
      const spanTokenName = document.createElement("span");
      const br = document.createElement("br");
      const spanBalance = document.createElement("span");

      div.className = "divContainerHover";
      div.onclick = function () {
        setShowTokensTab(false);
        setTokenToSend(token);
        setTokenSelected(token.symbol);
        buildTokenTab(token, balance);
      };

      spanTokenName.textContent = token.symbol;
      spanBalance.textContent = balance + " " + token.symbol;

      div.appendChild(spanTokenName);
      div.appendChild(br);
      div.appendChild(spanBalance);

      fragment.appendChild(div);
    }

    tokensList.innerHTML = "";
    tokensList.appendChild(fragment);
  };

  const handleShowImportTokenModal = () => {
    setShowImportTokenModal(true);
    setShowTokensTab(false);
    document.getElementById("TokenSymbolInput").disabled = true;
  };

  const handleTokenAddressChange = async (e) => {
    const newTokenAddress = e.target.value;
    const errorSpan = document.getElementById("TokenAddressErrorSpan");
    const importButton = document.getElementById("ImportTokenButton");

    if (newTokenAddress.lenght <= 0) {
      errorSpan.textContent = "Direccion no válida";
      importButton.disabled = true;
    } else {
      const { tokenSymbol, tokenDecimals, isAlreadyImported } =
        await fetchBackend("/fetchTokenContract", "POST", {
          tokenAddress: newTokenAddress,
          networkURL: (await getNetworkSelected()).networkURL,
        });

      if (tokenDecimals !== "" && tokenSymbol !== "") {
        errorSpan.textContent = "";
        importButton.disabled = false;

        setTokenSymbol(tokenSymbol);
        setTokenDecimals(tokenDecimals);
      } else if (!isAlreadyImported) {
        errorSpan.textContent = "Invalid token address";
        importButton.disabled = true;
      } else {
        errorSpan.textContent = "Already imported";
        importButton.disabled = true;
      }
    }
  };

  const handleTokenSymbolChange = (e) => {
    const newTokenSymbol = e.target.value;
    const errorSpan = document.getElementById("TokenSymbolErrorSpan");
    const button = document.getElementById("ImportTokenButton");
    setTokenSymbol(newTokenSymbol);
    if (newTokenSymbol.length <= 0) {
      errorSpan.textContent = "Name length has to be more than 0 characters";
      button.disabled = true;
    } else {
      errorSpan.textContent = "";
      button.disabled = false;
    }
  };

  const handleImportTokens = async () => {
    const tokenAddress = document.getElementById("TokenAddressInput").value;
    const { result } = await fetchBackend("/importToken", "POST", {
      tokenAddress: tokenAddress,
      tokenSymbol: tokenSymbol,
      tokenDecimals: tokenDecimals,
    });

    if (result) {
      closeTab();
      buildTokenBalances();
    }
  };

  const closeTab = () => {
    setTokenSymbol("");
    setShowImportTokenModal(false);
    setShowTokenTab(false);
    setShowTokensTab(true);
    setTokenSelected("");
    document.getElementById("TokenTab").innerHTML = "";
    document.getElementById("TokenAddressInput").value = "";
    setTokenDecimals(0);
  };

  useEffect(() => {
    if (accountSelected.address && showTokensTab) {
      buildTokenBalances();
      closeTab();
    }
  }, [accountSelected, networkSelected, ethBalance]);

  return (
    <>
      <div id="TokensTabContainer">
        <div id="TokensTab" hidden={!showTokensTab}>
          <div id="TokensList"></div>
          <button onClick={handleShowImportTokenModal}>Import tokens</button>
        </div>

        <div>
          <div id="TokenTab" hidden={!showTokenTab}></div>
          <div id="ActivityTab">
            <ActivityTab
              client={client}
              showActivityTab={showTokenTab}
              buildTransactionModal={buildTransactionModal}
              filter={tokenSelected}
            ></ActivityTab>
          </div>
        </div>

        <div id="ImportTokenModal" hidden={!showImportTokenModal}>
          <h3>
            Import Tokens<button onClick={closeTab}>X</button>
          </h3>
          <div id="ImportForm">
            <label>Address of token contract</label>
            <input
              id="TokenAddressInput"
              onChange={handleTokenAddressChange}
            ></input>
            <span id="TokenAddressErrorSpan"></span>
            <br></br>
            <label>Token symbol</label>
            <input
              id="TokenSymbolInput"
              value={tokenSymbol}
              onChange={handleTokenSymbolChange}
            ></input>
            <button
              onClick={() => {
                document.getElementById("TokenSymbolInput").disabled = false;
              }}
            >
              Edit
            </button>
            <span id="TokenSymbolErrorSpan"></span>
            <br></br>
            <label>Token decimals</label>
            <input value={tokenDecimals} disabled={true}></input>
            <br></br>
            <button id="ImportTokenButton" onClick={handleImportTokens}>
              Add custom token
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
