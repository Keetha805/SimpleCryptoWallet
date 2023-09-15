import { fetchBackend, firstLetter, getAccountSelected } from "../Functions";
import { useEffect } from "react";

export const ActivityTab = ({
  client,
  showActivityTab,
  buildTransactionModal,
  filter = undefined,
}) => {
  client.onmessage = async (message) => {
    const msg = JSON.parse(message.data);

    if (msg.name === "sendTransaction") {
      //-------------------PENDING--------------------------------
      if (msg.status === "pending") {
        const { pendingTransactions } = await fetchBackend(
          "/pendingTransactions",
          "POST",
          {
            filter: filter,
          }
        );
        const pendingDiv = document.getElementById("PendingTransactionsDiv");
        buildTransactionsList(pendingTransactions, pendingDiv, "Pending");
        //-------------------SENT--------------------------------
      } else if (msg.status === "sent" || msg.status === "error") {
        const { sentTransaction } = await fetchBackend(
          "/sentTransactions",
          "POST",
          {
            filter: filter,
          }
        );
        const sentDiv = document.getElementById("SentTransactionsDiv");
        buildTransactionsList(sentTransaction, sentDiv, msg.status);
        //-------------------PENDING-UPDATED--------------------------------

        const { pendingTransactions } = await fetchBackend(
          "/pendingTransactions",
          "POST",
          {
            filter: filter,
          }
        );
        const pendingDiv = document.getElementById("PendingTransactionsDiv");
        buildTransactionsList(pendingTransactions, pendingDiv, "Pending");
      }
    }
  };

  const buildTransactionsList = async (transactions, transactionsDiv, type) => {
    if (!transactions) {
      transactionsDiv.innerHTML = "";
      return;
    }

    if (!transactionsDiv) {
      return;
    }

    const fragment = document.createDocumentFragment();

    for (let index in transactions) {
      const tx = transactions[index];
      const accountSelected = await getAccountSelected();

      let action;
      let value;
      if (
        tx.value.split(" ")[0] >= 0 &&
        tx.to.toLowerCase() === accountSelected.address.toLowerCase()
      ) {
        action = "Recibir";
        value = tx.value;
      } else if (
        tx.value.split(" ")[0] >= 0 &&
        tx.from.toLowerCase() === accountSelected.address.toLowerCase()
      ) {
        action = "Enviar";
        value = "-" + tx.value;
      }

      const div = document.createElement("div");
      const spanAction = document.createElement("span");
      const spanDate = document.createElement("span");
      const spanBalance = document.createElement("span");
      const br = document.createElement("br");
      const spanStatus = document.createElement("span");

      div.className = "divContainerHover";
      div.onclick = function () {
        buildTransactionModal(tx, action);
      };

      spanDate.textContent = tx.timeStamp + " ";

      spanAction.textContent = " " + action + " ";

      spanBalance.textContent = " " + value;

      spanStatus.textContent = tx.status;
      spanStatus.className =
        type == "pending"
          ? "yellow"
          : type == "sent"
          ? "green"
          : type == "error"
          ? "red"
          : "undefined";

      div.appendChild(spanDate);
      div.appendChild(spanAction);
      div.appendChild(spanBalance);
      div.appendChild(br);
      div.appendChild(spanStatus);

      fragment.appendChild(div);
    }
    if (transactions.length !== 0 && type == "pending" && type == "sent") {
      transactionsDiv.innerHTML = `<span>${firstLetter(type)}</span>`;
    } else {
      transactionsDiv.innerHTML = ``;
    }
    transactionsDiv.appendChild(fragment);
  };

  const initializeActivityTab = async () => {
    const { pendingTransactions } = await fetchBackend(
      "/pendingTransactions",
      "POST",
      { filter: filter }
    );
    const pendingDiv = document.getElementById("PendingTransactionsDiv");
    buildTransactionsList(pendingTransactions, pendingDiv, "Pending");

    //-----------------------sent----------------------------------
    const { sentTransactions } = await fetchBackend(
      "/sentTransactions",
      "POST",
      { filter: filter }
    );
    const sentDiv = document.getElementById("SentTransactionsDiv");
    buildTransactionsList(sentTransactions, sentDiv, "Sent");
  };

  useEffect(() => {
    if (showActivityTab) {
      initializeActivityTab();
    }
  }, [showActivityTab]);

  return (
    <>
      <div id="ActivityTabContainer">
        <div id="ActivityTab" hidden={!showActivityTab}>
          <div id="PendingTransactionsDiv"> </div>
          <div id="SentTransactionsDiv"></div>
        </div>
      </div>
    </>
  );
};
