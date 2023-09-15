import { useEffect, useState } from "react";
import {
  fetchBackend,
  getAccountSelected,
  getAccounts,
  getNetworkSelected,
} from "../Functions";
import { sha256 } from "js-sha256";

export const AccountsModal = ({ setAccountSelectedExternal }) => {
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountsModal] = useState(false);
  const [showImportAccountModal, setShowImportAccountsModal] = useState(false);
  const [showDeletetAccountModal, setShowDeletetAccountModal] = useState(false);
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState("");

  const setAccountSelected = async (newAccountSelected) => {
    await fetchBackend("/setAccountSelected", "POST", {
      newAccountSelected: newAccountSelected,
    });
    document.getElementById("AccountSelect").textContent =
      newAccountSelected.name;

    setAccountSelectedExternal(newAccountSelected);
  };

  const initializeAccountModal = async () => {
    const accountsSelected = await getAccountSelected();
    document.getElementById("AccountSelect").textContent =
      accountsSelected.name;
    setAccountSelectedExternal(accountsSelected);
  };

  const handleShowAccountModal = async () => {
    closeModals();
    setShowAccountsModal(true);
    buildAccountsList();
  };

  const handleShowAddAccountModal = async () => {
    closeModals();
    setShowAddAccountsModal(true);
    buildAccountsList();

    document.getElementById("AddAccountName").placeholder =
      "Account " + ((await getAccounts()).length + 1);
    document.getElementById("AddAccountName").value = "";
    document.getElementById("CreateAccountButton").disabled = true;
    document.getElementById("AddAccountErrorSpan").textContent = "Requerido";
  };

  const handleShowImportAccountModal = () => {
    closeModals();
    setShowImportAccountsModal(true);
    buildAccountsList();
  };

  const handleAccountNameChange = (e) => {
    const button = document.getElementById("CreateAccountButton");
    const span = document.getElementById("AddAccountErrorSpan");
    if (e.target.value.length <= 0) {
      button.disabled = true;
      span.textContent = "Requerido";
    } else {
      button.disabled = false;
      span.textContent = "";
    }
  };

  const handlePrivateKeyImportChange = (e) => {
    const button = document.getElementById("ImportAccountButton");
    const span = document.getElementById("PrivateKeyImportErrorSpan");
    if (e.target.value.length <= 0) {
      button.disabled = true;
      span.textContent = "Requerido";
    } else {
      button.disabled = false;
      span.textContent = "";
    }
  };

  const buildAccountMoreDetails = async (isImported, address) => {
    const accountDetails = document.getElementById("AccountMoreDetailsDiv");
    const fragment = document.createDocumentFragment();

    const buttonMoreDetails = document.createElement("button");
    const a = document.createElement("a");
    const buttonExplorer = document.createElement("button");

    buttonMoreDetails.textContent = "More Details";
    buttonMoreDetails.onclick = function () {
      closeModals();
      setShowPrivateKeyModal(true);
      accountDetails.innerHTML = "";
    };

    a.textContent = "See on explorer";
    a.href = `${(await getNetworkSelected()).blockExplorer}/address/${address}`;

    buttonExplorer.appendChild(a);

    fragment.appendChild(buttonMoreDetails);
    fragment.appendChild(buttonExplorer);

    if (isImported) {
      let buttonDelete = document.createElement("button");
      buttonDelete.textContent = "Eliminar";
      buttonDelete.onclick = function () {
        setAddressToDelete(address);
        closeModals();
        setShowDeletetAccountModal(true);
      };
      fragment.appendChild(buttonDelete);
    }

    accountDetails.innerHTML = "";
    accountDetails.appendChild(fragment);
  };

  const buildAccountsList = async () => {
    const accounts = await getAccounts();
    const accountsDiv = document.getElementById("AccountsList");

    if (accounts.length === 0) {
      accountsDiv.innerHTML = "No accounts created";
      return;
    }

    const fragment = document.createDocumentFragment();
    for (let index in accounts) {
      const account = accounts[index];

      const divContenedor = document.createElement("div");
      const div = document.createElement("div");
      const br = document.createElement("br");
      const spanAccountName = document.createElement("span");
      const spanAccountAddress = document.createElement("span");
      const buttonDetails = document.createElement("button");

      divContenedor.id = account.address;

      div.className = "divHover";
      div.onclick = function () {
        setAccountSelected(account);
        closeModals();
      };

      spanAccountName.textContent = account.name;
      spanAccountAddress.textContent = account.address;

      buttonDetails.textContent = "...";
      buttonDetails.onclick = function () {
        buildAccountMoreDetails(account["imported"], account["address"]);
      };

      div.appendChild(spanAccountName);
      div.appendChild(br);
      div.appendChild(spanAccountAddress);

      if (accounts["imported"]) {
        const spanAccountImported = document.createElement("span");
        spanAccountImported.textContent = "Importado";
        div.appendChild(spanAccountImported);
      }

      divContenedor.appendChild(div);
      divContenedor.appendChild(buttonDetails);

      fragment.appendChild(divContenedor);
    }
    accountsDiv.innerHTML = "";
    accountsDiv.appendChild(fragment);
  };

  const createAccount = async () => {
    const accountName = document.getElementById("AddAccountName").value;
    await fetchBackend("/addAccount", "POST", {
      accountName: accountName,
    });
    closeModals();
  };

  const importAccount = async () => {
    const privateKeyInput = document.getElementById("PrivateKeyImportInput");
    const privateKeyErrorSpan = document.getElementById(
      "PrivateKeyImportErrorSpan"
    );
    const formattedPrivateKey = privateKeyInput.value.startsWith("0x")
      ? privateKeyInput.value
      : "0x" + privateKeyInput.value;

    const { result } = await fetchBackend("/importAccount", "POST", {
      privateKey: formattedPrivateKey,
    });

    if (result === 0) {
      privateKeyErrorSpan.textContent = "This is not a valid private key";
    } else if (result === 2) {
      privateKeyErrorSpan.textContent = "You have already added it";
    } else if (result === 3) {
      privateKeyErrorSpan.textContent =
        "Something unexpected occurred, try again later";
    } else {
      privateKeyErrorSpan.textContent = "";
      privateKeyInput.value = "";
      closeModals();
    }
  };

  const deleteAccount = async () => {
    await fetchBackend("/deleteAccount", "POST", {
      accountAddress: addressToDelete,
    });
    closeModals();
  };

  const handleRevealPrivateKey = async () => {
    const password = document.getElementById("WalletPasswordInput").value;

    const { privateKey } = await fetchBackend("/getPrivateKey", "POST", {
      hashedPassword: sha256(password),
    });
    if (privateKey) {
      document.getElementById("PrivateKeySpan").textContent = privateKey;
    } else {
      document.getElementById("WalletPasswordErrorSpan").textContent =
        "Incorrect Password";
    }
  };

  const closeModals = () => {
    setShowAccountsModal(false);
    setShowAddAccountsModal(false);
    setShowImportAccountsModal(false);
    setShowDeletetAccountModal(false);
    setShowPrivateKeyModal(false);
    document.getElementById("AccountSelect").disabled = false;
    document.getElementById("NetworkSelect").disabled = false;
    document.getElementById("PrivateKeySpan").textContent = "";
    document.getElementById("AccountMoreDetailsDiv").innerHTML = "";
    initializeAccountModal();
  };

  useEffect(() => {
    if (
      showAccountsModal ||
      showAddAccountModal ||
      showDeletetAccountModal ||
      showImportAccountModal ||
      showPrivateKeyModal
    ) {
      document.getElementById("AccountSelect").disabled = true;
      document.getElementById("NetworkSelect").disabled = true;
    }
  }, [
    showAccountsModal,
    showAddAccountModal,
    showImportAccountModal,
    showDeletetAccountModal,
    showPrivateKeyModal,
  ]);

  useEffect(() => {
    initializeAccountModal();
  }, []);

  return (
    <>
      <div id="AccountsModalContainer">
        <button onClick={handleShowAccountModal} id="AccountSelect"></button>

        <div id="AccountsModal" hidden={!showAccountsModal}>
          <h3>
            Seleccionar una cuenta
            <button onClick={closeModals}>X</button>
          </h3>
          <input type="search"></input>
          <div id="AccountsList"></div>
          <button onClick={handleShowAddAccountModal}>Add account</button>
          <button onClick={handleShowImportAccountModal}>Import account</button>
          <button>Hardware wallet</button>
        </div>

        <div id="AccountMoreDetailsDiv"></div>

        <div id="PrivateKeyModal" hidden={!showPrivateKeyModal}>
          <h3>
            Show private key<button onClick={closeModals}>X</button>
          </h3>
          <label>Enter your password</label>
          <input id="WalletPasswordInput"></input>
          <span id="WalletPasswordErrorSpan"></span>
          <span id="PrivateKeySpan"></span>
          <button onClick={handleRevealPrivateKey}>Reveal</button>
        </div>

        <div id="AddAccountModal" hidden={!showAddAccountModal}>
          <h3>
            <button onClick={handleShowAccountModal}>←</button>
            Add account<button onClick={closeModals}>X</button>
          </h3>
          <label>Nombre de la cuenta</label>
          <input id="AddAccountName" onChange={handleAccountNameChange}></input>
          <span id="AddAccountErrorSpan"></span>
          <button onClick={handleShowAccountModal}>Cancelar</button>
          <button onClick={createAccount} id="CreateAccountButton">
            Crear
          </button>
        </div>

        <div id="ImportAccountModal" hidden={!showImportAccountModal}>
          <h3>
            <button onClick={handleShowAccountModal}>←</button>
            Importar cuenta
            <button onClick={closeModals}>X</button>
          </h3>
          <label>Paste here the private key</label>
          <input
            id="PrivateKeyImportInput"
            onChange={handlePrivateKeyImportChange}
          ></input>
          <span id="PrivateKeyImportErrorSpan"></span>
          <button onClick={closeModals}>Cancelar</button>
          <button id="ImportAccountButton" onClick={importAccount}>
            Importar
          </button>
        </div>

        <div id="DeleteAccountModal" hidden={!showDeletetAccountModal}>
          <h3>Delete account</h3>
          <button onClick={handleShowAccountModal}>Cancelar</button>
          <button onClick={deleteAccount}>Eliminar</button>
        </div>
      </div>

      <br />
    </>
  );
};
