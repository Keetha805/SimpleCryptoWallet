import { useEffect } from "react";
import {
  firstLetter,
  getAccountSelected,
  getNetworkSelected,
} from "../Functions";

export const TransactionModal = ({
  showTransactionModal,
  setShowTransactionModal,
  txObj,
  action,
  status,
}) => {
  const initializeTransactionModal = async () => {
    const transactionDetailsDiv = document.getElementById("TransactionDetails");

    const fragment = document.createDocumentFragment();

    const spanStatus = document.createElement("span");
    const aEtherscan = document.createElement("a");
    const buttonCopy = document.createElement("button");

    spanStatus.textContent = "Estado: " + status;

    aEtherscan.textContent = "See in the block explorer";
    aEtherscan.href =
      (await getNetworkSelected()).blockExplorer +
      "/tx/" +
      txObj.transactionHash;

    buttonCopy.textContent = "Copy id. de transaction";
    buttonCopy.onclick = function () {
      navigator.clipboard.writeText(txObj.transactionHash);
    };

    for (let detailName in txObj) {
      const detail = txObj[detailName];

      const spanName = document.createElement("span");
      const spanData = document.createElement("span");
      const br = document.createElement("br");

      spanName.textContent = detailName + ": ";

      if (detailName == "value" || detailName == "total") {
        const strong = document.createElement("strong");
        if (
          detailName == "value" &&
          txObj.from.toLowerCase() ==
            (await getAccountSelected()).address.toLowerCase()
        ) {
          strong.textContent = "- ";
        }
        strong.textContent += detail + " ";
        spanData.appendChild(strong);
      } else if (detailName == "timeStamp" || detailName == "functionName") {
        continue;
      } else if (detailName.toLowerCase().includes("gas")) {
        spanData.textContent = detail / 10 ** 9;
      } else {
        spanData.textContent = detail;
      }

      fragment.appendChild(spanName);
      fragment.appendChild(spanData);
      fragment.appendChild(br);
    }

    transactionDetailsDiv.innerHTML = "";
    transactionDetailsDiv.appendChild(fragment);
  };

  const closeModal = () => {
    setShowTransactionModal(false);
  };

  useEffect(() => {
    if (showTransactionModal) {
      initializeTransactionModal();
    }
  }, [showTransactionModal]);
  return (
    <>
      <div id="TransactionModal" hidden={!showTransactionModal}>
        <div>
          <h3>
            {firstLetter(action)}
            <button onClick={closeModal}>X</button>
          </h3>

          <div id="TransactionDetails"></div>
        </div>
      </div>
    </>
  );
};
