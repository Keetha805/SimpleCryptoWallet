import { useEffect, useState } from "react";
import { getEthBalance } from "./Functions";
import { TokensTab } from "./Tabs/TokensTab";
import { TabList, Tab } from "@web3uikit/core";
import { SendModal } from "./Modals/SendModal";
import { ActivityTab } from "./Tabs/ActivityTab";
import { w3cwebsocket } from "websocket";
import { TransactionModal } from "./Modals/TransactionModal";

export const Wallet = ({ accountSelected, networkSelected }) => {
  const [showSendToModal, setShowSendToModal] = useState(false);
  const [showTokensTab, setShowTokensTab] = useState(true);
  const [showActivityTab, setShowActivityTab] = useState(true);

  const [tokenToSend, setTokenToSend] = useState("");
  const [ethBalance, setEthBalance] = useState(0);

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [txObj, setTxObj] = useState({});
  const [action, setAction] = useState("");

  const client = new w3cwebsocket("ws://localhost:8001");

  const updateEthBalance = async () => {
    const newEthBalance = await getEthBalance();
    setEthBalance(newEthBalance);
  };

  const buildTransactionModal = async (newTxObj, newAction) => {
    setShowTransactionModal(true);
    setTxObj(newTxObj);
    setAction(newAction);
  };

  useEffect(() => {
    if (accountSelected.address) {
      updateEthBalance();
    }
  }, [accountSelected, networkSelected]);

  return (
    <>
      <div id="WalletDiv">
        <div>
          {ethBalance} {networkSelected.currencySymbol}
        </div>

        <TransactionModal
          showTransactionModal={showTransactionModal}
          setShowTransactionModal={setShowTransactionModal}
          txObj={txObj}
          action={action}
        ></TransactionModal>

        <TabList defaultActiveKey={1}>
          <Tab tabName="Tokens" tabKey={0}>
            <TokensTab
              ethBalance={ethBalance}
              accountSelected={accountSelected}
              networkSelected={networkSelected}
              tokenToSend={tokenToSend}
              showTokensTab={showTokensTab}
              setShowTokensTab={setShowTokensTab}
              setShowSendToModal={setShowSendToModal}
              setTokenToSend={setTokenToSend}
              client={client}
              buildTransactionModal={buildTransactionModal}
            ></TokensTab>
          </Tab>
          <Tab tabName="Activity" tabKey={1}>
            <ActivityTab
              client={client}
              showActivityTab={showActivityTab}
              setShowActivityTab={setShowActivityTab}
              buildTransactionModal={buildTransactionModal}
            ></ActivityTab>
          </Tab>
        </TabList>
      </div>

      <SendModal
        ethBalance={ethBalance}
        accountSelected={accountSelected}
        setShowTokensTab={setShowTokensTab}
        showSendToModal={showSendToModal}
        setShowSendToModal={setShowSendToModal}
        tokenToSend={tokenToSend}
        setTokenToSend={setTokenToSend}
        client={client}
        setShowActivityTab={setShowActivityTab}
      ></SendModal>
    </>
  );
};
