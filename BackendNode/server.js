const express = require("express");
const cors = require("cors");
const fs = require("fs");
const web3 = require("web3");
const ethers = require("ethers");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

//------------------------------TOKENCONTRACT------------------------------------
const abi = JSON.parse(fs.readFileSync("./abi.json", "utf8"))["abi"];

//------------------------------CONFIG------------------------------------
const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
const networks = new Map(Object.entries(config["networks"]));
const accounts = config["accounts"];

//------------------------------WEB3------------------------------------
const provider = new web3.providers.http.HttpProvider(
  config["networkSelected"].networkURL
);
let Web3 = new web3.Web3(provider);
let wallet = Web3.wallet;

//-------------------------------ABI-DECODER------------------------------------
const InputDataDecoder = require("ethereum-input-data-decoder");
const decoder = new InputDataDecoder(abi);
//------------------------------FUNCTIONS------------------------------------

let walletPassword;

// ------------FORMATTING------------

const toFixed = (num, fixed) => {
  var re = new RegExp("^-?\\d+(?:.\\d{0," + (fixed || -1) + "})?");
  return num.toString().match(re)[0];
};

const endsWith = (searchString, stringToLook, position = undefined) => {
  position = position || stringToLook.length;
  position = position - searchString.length;
  var lastIndex = stringToLook.lastIndexOf(searchString);
  return lastIndex !== -1 && lastIndex === position;
};

// const orderByDate = (array) => {
//   let length = array.length;
//   let newArray = [];
//   while (newArray.length !== length) {
//     for (let index in array) {
//       const element = array[index];

//       if (newArray.length == 0) {
//         newArray[0] = element;
//       } else if (array.length === 1) {
//         newArray[newArray.length] = array[0];
//         let toDelete = array.findIndex(
//           (e) => e.timeStamp == newArray[newArray.length - 1].timeStamp
//         );
//         array.splice(toDelete, 1);
//       } else {
//         if (
//           Number(element.timeStamp) >
//           Number(newArray[newArray.length - 1].timeStamp)
//         ) {
//           newArray[newArray.length - 1] = element;
//         }

//         if (index == array.length - 1) {
//           let toDelete = array.findIndex(
//             (e) => e.timeStamp == newArray[newArray.length - 1].timeStamp
//           );
//           array.splice(toDelete, 1);
//           newArray[newArray.length] = array[0];
//         }
//       }
//     }
//   }
//   return newArray;
// };

const formatDate = (timestamp) => {
  const date = new Date(parseFloat(timestamp));
  const dateFormat = date.toDateString().substring(4, 10);
  const dateString = dateFormat.split(" ")[1].startsWith("0")
    ? dateFormat.split(" ")[0] + " " + dateFormat.split(" ")[1].substring(1)
    : dateFormat;
  return dateString;
};

const formatTransaction = async (transactionHash) => {
  const tx = await Web3.eth.getTransaction(transactionHash);
  const validDataDecoded = decoder.decodeData(tx.data).method
    ? decoder.decodeData(tx.data).method.includes("transfer")
    : false;
  const date = formatDate(new Date().getTime());
  let txObj;
  if (validDataDecoded) {
    const tokensArray =
      config["tokens"][config["accountSelected"].address][
        config["networkSelected"].chainName
      ];
    const token = tokensArray
      ? tokensArray.find((token) => token.address.toLowerCase() == tx.to)
      : undefined;
    if (token == undefined) {
      return;
    }
    let value = (
      parseInt(decoder.decodeData(tx.input).inputs[1]["_hex"], 16) /
      10 ** token.decimals
    )
      .toString()
      .includes("e")
      ? 0
      : parseInt(decoder.decodeData(tx.input).inputs[1]["_hex"], 16) /
        10 ** token.decimals;
    txObj = {
      transactionHash: transactionHash,
      from: tx.from,
      to: tx.to,
      nonce: parseInt(tx.nonce).toString(),
      value: parseInt(value) + " " + token.symbol,
      functionName: decoder.decodeData(tx.data).method,
      gasLimit: parseInt(tx.gas).toString(),
      gasPrice: parseInt(tx.gasPrice).toString(),
      total: parseInt(tx.gasPrice * tx.gas + tx.value).toString(),
      timeStamp: date,
      status: "pending",
    };
  } else {
    let value = (parseInt(tx.value) / 10 ** 18).toString().includes("e")
      ? 0
      : parseInt(tx.value) / 10 ** 18;
    txObj = {
      transactionHash: transactionHash,
      from: tx.from,
      to: tx.to,
      nonce: parseInt(tx.nonce).toString(),
      value: parseInt(value) + " " + config["networkSelected"].currencySymbol,
      functionName: "",
      gasLimit: parseInt(tx.gas).toString(),
      gasPrice: parseInt(tx.gasPrice).toString(),
      total: (parseInt(tx.gasPrice * tx.gas) / 10 ** 18).toString(),
      timeStamp: date,
      status: "pending",
    };
  }
  return txObj;
};

// ---------------MAIN-------------
const rewriteConfig = (newData, index) => {
  let newFile = config;
  newFile[index] = newData;

  fs.writeFileSync("./config.json", JSON.stringify(newFile), "utf8");
};

const fetchEtherscan = async (endpoint) => {
  const apiURL = config["networkSelected"]["apiURL"];
  const validation = `&apiKey=QRP5G5PF8HXRCR178CM76FYQIUAGE5UQ5S`;
  const url = apiURL + endpoint + validation;
  let result = await axios.get(url);
  result = result["data"]["result"];

  return result;
};

const sendTransaction = async (req) => {
  const { tokenToSend, addressToSendTo, amountToSend } = req;

  if (isWalletLocked) {
    return undefined;
  }
  const formattedAmountToSend = ethers.parseUnits(amountToSend, "ether");
  const from = config["accountSelected"].address;
  const gasPrice = await Web3.eth.getGasPrice();
  const nonce = await Web3.eth.getTransactionCount(from);

  let tx;
  if (endsWith("ETH", tokenToSend.symbol)) {
    tx = {
      from: from,
      nonce: nonce,
      chainId: config["networkSelected"].chainId,
      to: addressToSendTo,
      value: formattedAmountToSend,
      gasPrice: gasPrice,
      gas: "220000",
      chain: config["networkSelected"].chainName,
    };
  } else {
    const tokenContract = new Web3.eth.Contract(abi, tokenToSend.address);
    const data = tokenContract.methods
      .transfer(addressToSendTo, formattedAmountToSend)
      .encodeABI();
    tx = {
      from: from,
      nonce: nonce,
      chainId: config["networkSelected"].chainId,
      to: tokenToSend.address,
      data: data,
      value: 0,
      gasPrice: gasPrice,
      gas: "250000",
      chain: config["networkSelected"].chainName,
    };
  }
  const encryptedAccount = wallet.find(
    (acc) => acc.address == from.toLowerCase().replace("0x", "")
  );
  const account = (
    await Web3.eth.accounts.wallet.decrypt([encryptedAccount], walletPassword)
  )[0];

  let tempTransactionHash;
  console.log("account: ", account);
  try {
    const signedTx = await account.signTransaction(tx);
    console.log("signedTx: ", signedTx);
    const sentTransaction = await Web3.eth
      .sendSignedTransaction(signedTx.rawTransaction)
      .on("receipt", async (receipt) => {
        console.log("receipt:", receipt.transactionHash);

        const newPendingTransactions = config["pendingTransactions"];
        let index = newPendingTransactions[
          config["accountSelected"].address
        ].findIndex((tx) => tx.transactionHash == receipt.transactionHash);
        const txObj = newPendingTransactions[
          config["accountSelected"].address
        ].splice(index, 1);
        rewriteConfig(newPendingTransactions, "pendingTransactions");

        const newTransactions = config["transactions"];
        txObj[0]["status"] = "sent";
        newTransactions[config["accountSelected"].address].push(txObj[0]);
        rewriteConfig(newTransactions, "transactions");

        clients.sendUTF(
          JSON.stringify({
            name: "sendTransaction",
            status: "sent",
            transactionHash: receipt.transactionHash,
            from: receipt.from,
            success: Number(receipt.status) == 1 ? true : false,
          })
        );
      })
      .on("transactionHash", async (transactionHash) => {
        console.log("transactionHash: ", transactionHash);
        tempTransactionHash = transactionHash;

        setTimeout(async () => {
          const tx = await Web3.eth.getTransaction(transactionHash);

          const pendingTransactions = config["pendingTransactions"];
          pendingTransactions[config["accountSelected"].address].push(
            await formatTransaction(transactionHash)
          );
          rewriteConfig(pendingTransactions, "pendingTransactions");

          clients.sendUTF(
            JSON.stringify({
              name: "sendTransaction",
              status: "pending",
              transactionHash: transactionHash,
              from: tx.from,
              success: Number(tx.status) == 1 ? true : false,
            })
          );
        }, 2000);
      })
      .on("error", async (error) => {
        console.log("error: ", error);

        if (tempTransactionHash) {
          const newPendingTransactions = config["pendingTransactions"];
          let index = newPendingTransactions[
            config["accountSelected"].address
          ].findIndex((tx) => tx.transactionHash == tempTransactionHash);
          const txObj = newPendingTransactions[
            config["accountSelected"].address
          ].splice(index, 1);
          rewriteConfig(newPendingTransactions, "pendingTransactions");

          if (txObj) {
            if (txObj.length >= 0) {
              const newTransactions = config["transactions"];
              txObj[0]["status"] = "error";
              newTransactions[config["accountSelected"].address].push(txObj[0]);
              rewriteConfig(newTransactions, "transactions");
            }
          }
        }

        // if (txObj[0] == null) {
        //   const newTransactions = config["transactions"];
        //   const fatalError = {
        //     from: tx.from,
        //     to: tx.to,
        //     nonce: parseInt(tx.nonce).toString(),
        //     value:
        //       parseInt(value) + " " + config["networkSelected"].currencySymbol,
        //     functionName:
        //       decoder.decodeData(tx.data).method !== ""
        //         ? decoder.decodeData(tx.data).method
        //         : "",
        //     gasLimit: tx.gas.toString(),
        //     gasPrice: tx.gasPrice.toString(),
        //     total: (
        //       parseInt(parseInt(tx.gasPrice) * parseInt(tx.gas)) /
        //       10 ** 18
        //     ).toString(),
        //     timeStamp: date,
        //     status: "error",
        //   };
        //   tx.functionName =
        //     newTransactions[config["accountSelected"].address].push(fatalError);
        //   rewriteConfig(newTransactions, "transactions");
        // } else {
        //   const newTransactions = config["transactions"];
        //   newTransactions[config["accountSelected"].address].push(txObj[0]);
        //   rewriteConfig(newTransactions, "transactions");
        // }

        clients.sendUTF(
          JSON.stringify({
            name: "sendTransaction",
            status: "error",
            transactionHash: "",
            from: config["accountSelected"].address,
            success: false,
            error: error,
          })
        );
      });
    return sentTransaction;
  } catch (error) {
    console.log(
      "------------------------------ Error ------------------------------ "
    );
    return undefined;
  }
};

// ------- LISTEN PENDING TRANSACTIONS -----------
const setConstantListeners = async () => {
  for (let address in config["pendingTransactions"]) {
    for (let index in config["pendingTransactions"][address]) {
      let hash = config["pendingTransactions"][address][index].transactionHash;
      console.log("hash: ", hash);
      setInterval(async () => {
        const tx = await Web3.eth.getTransaction(hash);
      }, 2000);
    }
  }
};

//--------------------------INITIALIZE--------------------------------

app.listen(8000, async () => {
  console.log("Server is running on port 8000");
  if (config["wallet"].length !== 0) {
    wallet = config["wallet"];
    isWalletLocked = true;
  }
  await setConstantListeners();
});

//--------------------------NETWORKS--------------------------------
app.get("/networks", (req, res) => {
  res.json({ networks: config["networks"] });
});

app.get("/networkSelected", (req, res) => {
  res.json({ networkSelected: config["networkSelected"] });
});

app.post("/setNetworkSelected", (req, res) => {
  const { newNetworkSelected } = req.body;
  rewriteConfig(newNetworkSelected, "networkSelected");
  res.json({ result: true });
});

app.post("/deleteNetwork", (req, res) => {
  const { networkToDelete } = req.body;

  networks.delete(networkToDelete);
  rewriteConfig(Object.fromEntries(networks.entries()), "networks");

  const firstValue = networks.keys().next().value;
  rewriteConfig(firstValue, "networkSelected");

  res.json({ newNetworkSelected: firstValue });
});

//--------------------------ACCOUNTS--------------------------------
app.get("/accounts", (req, res) => {
  res.json({ accounts: config["accounts"] });
});

app.get("/accountSelected", (req, res) => {
  res.json({ accountSelected: config["accountSelected"] });
});

app.post("/setAccountSelected", (req, res) => {
  const { newAccountSelected } = req.body;
  rewriteConfig(newAccountSelected, "accountSelected");
  res.json({ result: true });
});

app.post("/addAccount", async (req, res) => {
  let { accountName } = req.body;

  if (isWalletLocked) {
    res.json({ result: false });
    return;
  }

  const newAccount = Web3.eth.accounts.create();
  const newEncryptedAccount = await newAccount.encrypt(walletPassword);
  wallet.push(newEncryptedAccount);

  const newData = accounts;
  const newAccountObj = {
    name: accountName,
    address: newAccount.address,
    imported: false,
  };
  newData.push(newAccountObj);

  let newTokensObj = config["tokens"];
  newTokensObj[newAccount.address] = {};

  let newWallet = config["wallet"];
  newWallet.push(newEncryptedAccount);

  let newPendingTransactions = config["pendingTransactions"];
  newPendingTransactions[newAccount.address] = [];

  let newTransactions = config["transactions"];
  newTransactions[newAccount.address] = [];

  rewriteConfig(newData, "accounts");
  rewriteConfig(newAccountObj, "accountSelected");
  rewriteConfig(newTokensObj, "tokens");
  rewriteConfig(newWallet, "wallet");
  rewriteConfig(newPendingTransactions, "pendingTransactions");
  rewriteConfig(newTransactions, "transactions");

  res.json({ result: true });
});

app.post("/importAccount", async (req, res) => {
  let { privateKey } = req.body;

  if (isWalletLocked) {
    res.json({ result: 0 });
    return;
  }

  try {
    wallet = await Web3.eth.accounts.wallet.decrypt(wallet, walletPassword);
    wallet.add(privateKey);
  } catch (err) {
    console.log(err);
    try {
      wallet = await Web3.eth.accounts.wallet.encrypt(walletPassword);
    } catch (error) {}
    res.json({ result: 0 });
    return;
  }
  const repeatedAccount = accounts.find(
    (acc) => acc.address === wallet[wallet.length - 1].address
  )
    ? true
    : false;

  if (!repeatedAccount) {
    const account = wallet[wallet.length - 1];
    const address = account.address;
    const accountName = "Account " + (config["accounts"].length + 1);

    const newData = accounts;
    const newAccountObj = {
      name: accountName,
      address: address,
      imported: true,
    };
    newData.push(newAccountObj);

    const newTokensObj = config["tokens"];
    newTokensObj[address] = {};

    const newWallet = config["wallet"];
    const encryptedNewAccount = await account.encrypt(walletPassword);
    newWallet.push(encryptedNewAccount);
    wallet = newWallet;

    let newPendingTransactions = config["pendingTransactions"];
    newPendingTransactions[address] = [];

    let newTransactions = config["transactions"];
    newTransactions[address] = [];

    rewriteConfig(newData, "accounts");
    rewriteConfig(newAccountObj, "accountSelected");
    rewriteConfig(newTokensObj, "tokens");
    rewriteConfig(newWallet, "wallet");
    rewriteConfig(newPendingTransactions, "pendingTransactions");
    rewriteConfig(newTransactions, "transactions");

    res.json({ result: 1 });
    return;
  }
  res.json({ result: 2 });
});

app.post("/deleteAccount", (req, res) => {
  let { accountAddress } = req.body;

  if (isWalletLocked) {
    res.json({ result: false });
    return;
  }

  const account = config["wallet"].find(
    (acc) => acc.address === accountAddress.toLowerCase().replace("0x", "")
  );

  if (account) {
    let index = wallet.indexOf(account);

    let newData = accounts;
    newData.splice(index, 1);

    let newAccountSelected = newData[0] ? newData[0] : {};

    let newWallet = config["wallet"];
    newWallet.splice(index, 1);
    wallet = newWallet;

    let newTokensObj = config["tokens"];
    delete newTokensObj[accountAddress];

    let newPendingTransactions = config["pendingTransactions"];
    delete newPendingTransactions[accountAddress];

    let newTransactions = config["transactions"];
    delete newTransactions[accountAddress];

    rewriteConfig(newData, "accounts");
    rewriteConfig(newAccountSelected, "accountSelected");
    rewriteConfig(newWallet, "wallet");
    rewriteConfig(newTokensObj, "tokens");
    rewriteConfig(newPendingTransactions, "pendingTransactions");
    rewriteConfig(newTransactions, "transactions");

    res.json({ result: true });
    return;
  }

  res.json({ result: false });
});

app.post("/getPrivateKey", async (req, res) => {
  const { hashedPassword } = req.body;

  if (isWalletLocked) {
    res.json({ privateKey: undefined });
    return;
  }

  if (hashedPassword !== walletPassword) {
    res.json({ privateKey: undefined });
  }

  const accountAddress = config["accountSelected"].address
    .toLowerCase()
    .replace("0x", "");
  const encryptedAccount = config["wallet"].find(
    (acc) => acc.address === accountAddress
  );
  const privateKey = (
    await Web3.eth.accounts.wallet.decrypt([encryptedAccount], hashedPassword)
  )["0"].privateKey;

  res.json({ privateKey: privateKey });
});

//-----------------------------WALLET--------------------------------

let isWalletLocked = false;
let cancel = false;

app.get("/isNewWallet", (req, res) => {
  res.json({
    isNewWallet: wallet.length == 0,
  });
});

app.get("/isWalletLocked", (req, res) => {
  res.json({
    isWalletLocked: isWalletLocked,
  });
});

app.post("/unlockWallet", async (req, res) => {
  const { hashedPassword, hashedHashedPassword } = req.body;
  if (hashedHashedPassword == config["walletPassword"]) {
    isWalletLocked = false;
    walletPassword = hashedPassword;
    res.json({ result: true });
  } else {
    res.json({ result: false });
  }
});

app.post("/setWalletPassword", (req, res) => {
  const { hashedPassword, hashedHashedPassword } = req.body;
  if (wallet.length === 0) {
    walletPassword = hashedPassword;
    rewriteConfig(hashedHashedPassword, "walletPassword");
    res.json({ result: true });
  } else {
    res.json({ result: false });
  }
});

app.get("/lockWallet", (req, res) => {
  if (!cancel) {
    isWalletLocked = true;
    walletPassword = "";
    cancel = false;
    res.json({ result: true });
  } else {
    res.json({ result: false });
  }
});

app.get("/deleteTimeout", (req, res) => {
  cancel = true;
  res.json({ result: true });
});

app.get("/cancelCancel", (req, res) => {
  cancel = false;
  res.json({ result: true });
});

//---------------------------------TOKENS--------------------------------

app.get("/tokens", (req, res) => {
  let tokensAddress = config["tokens"][config.accountSelected.address];
  let tokensSelected = tokensAddress
    ? tokensAddress[config["networkSelected"].chainName]
    : undefined;
  let formattedTokensSelected =
    tokensSelected !== undefined ? tokensSelected : [];

  const alreadyAdded =
    formattedTokensSelected.find((token) => token.address === "") !== undefined
      ? true
      : false;

  const ethTokenObj = {
    address: "",
    symbol: config["networkSelected"].currencySymbol,
    decimals: 18,
  };

  if (!alreadyAdded) {
    formattedTokensSelected.unshift(ethTokenObj);
  }

  res.json({
    tokens: formattedTokensSelected,
  });
});

app.post("/fetchTokenContract", async (req, res) => {
  const { tokenAddress, networkURL } = req.body;

  let tokensSelected =
    config["tokens"][config.accountSelected.address][
      config["networkSelected"].chainName
    ];
  let formattedTokensSelected = tokensSelected ? tokensSelected : [];

  for (let index in formattedTokensSelected) {
    const token = formattedTokensSelected[index];
    if (token.address === tokenAddress) {
      res.json({
        tokenSymbol: "",
        tokenDecimals: "",
        isAlreadyImported: true,
      });
      return;
    }
  }

  try {
    const tokenWeb3 = new web3.Web3(
      new web3.providers.http.HttpProvider(networkURL)
    );
    const contract = new tokenWeb3.eth.Contract(abi, tokenAddress);

    let tokenDecimals = await contract.methods
      .decimals()
      .call({ from: config["accountSelected"].address });
    tokenDecimals = Number(tokenDecimals);

    let tokenSymbol = await contract.methods
      .symbol()
      .call({ from: config["accountSelected"].address });

    try {
      let tokenBalance = await contract.methods
        .balanceOf(config["accountSelected"].address)
        .call({ from: config["accountSelected"].address });
    } catch (error) {
      res.json({
        tokenSymbol: tokenSymbol,
        tokenDecimals: tokenDecimals,
      });
    }

    res.json({
      tokenSymbol: tokenSymbol,
      tokenDecimals: tokenDecimals,
      isAlreadyImported: false,
    });
  } catch (error) {
    console.log("error: ", error);
    res.json({
      tokenSymbol: "",
      tokenDecimals: "",
      isAlreadyImported: false,
    });
  }
});

app.post("/importToken", async (req, res) => {
  const { tokenAddress, tokenSymbol, tokenDecimals } = req.body;

  const networkName = config["networkSelected"].chainName;
  const accountAddress = config["accountSelected"].address;
  const newData = config["tokens"];
  const newTokenObj = {
    address: tokenAddress,
    symbol: tokenSymbol,
    decimals: tokenDecimals,
  };

  if (newData[accountAddress][networkName]) {
    newData[accountAddress][networkName].push(newTokenObj);
  } else {
    newData[accountAddress][networkName] = [newTokenObj];
  }

  rewriteConfig(newData, "tokens");
  console.log(config["tokens"]);

  res.json({ result: true });
});

app.post("/tokenBalance", async (req, res) => {
  const { tokenAddress } = req.body;

  const tokenProvider = new web3.providers.http.HttpProvider(
    config["networkSelected"].networkURL
  );
  const tokenWeb3 = new web3.Web3(tokenProvider);
  const tokenContract = new tokenWeb3.eth.Contract(abi, tokenAddress);

  const accountAddress = config["accountSelected"].address;

  if (accountAddress) {
    let tokenBalance = await tokenContract.methods
      .balanceOf(accountAddress)
      .call({ from: accountAddress });

    tokenBalance = Number(tokenBalance) / 10 ** 18;
    res.json({ tokenBalance: tokenBalance });
  } else {
    res.json({ tokenBalance: "No account selected" });
  }
});

//---------------------------------ETH--------------------------------

app.get("/ethBalance", async (req, res) => {
  if (config["networkSelected"].apiURL) {
    const endpoint = `/api?module=account&action=balance&address=${config["accountSelected"].address}&tag=latest`;
    let newEthBalance = await fetchEtherscan(endpoint);

    if (newEthBalance) {
      if (newEthBalance == 0) {
        res.json({ newEthBalance: "0" });
      } else {
        newEthBalance = toFixed(ethers.formatUnits(newEthBalance, "ether"), 2);
        res.json({ newEthBalance: newEthBalance });
      }
    } else {
      res.json({ newEthBalance: "ERROR" });
    }
  } else {
    res.json({ newEthBalance: "RED DE PRUEBA" });
  }
});

//---------------------------------TRANSACTIONS--------------------------------

app.post("/pendingTransactions", async (req, res) => {
  const { filter } = req.body;
  const pendingTransactions =
    config["pendingTransactions"][config["accountSelected"].address];

  const formattedPendingTransactions = pendingTransactions.reverse();

  if (filter) {
    const filteredTransactions = formattedPendingTransactions.filter((tx) =>
      tx.value.includes(filter)
    );
    res.json({
      pendingTransactions: filteredTransactions,
    });
  } else {
    res.json({
      pendingTransactions: formattedPendingTransactions,
    });
  }
});

app.post("/sentTransactions", async (req, res) => {
  const { filter } = req.body;
  let transactions = config["transactions"][config["accountSelected"].address];

  transactions = transactions.reverse();

  if (filter) {
    const filteredTransactions = transactions.filter((tx) =>
      tx.value.includes(filter)
    );
    res.json({
      sentTransactions: filteredTransactions,
    });
  } else {
    res.json({
      sentTransactions: transactions,
    });
  }
});

//---------------------------------WEBSOCKET--------------------------------
const webSocketsServerPort = 8001;
const webSocketServer = require("websocket").server;
const http = require("http");

//Spinning the http server and the websocket server
const server = http.createServer();
server.listen(webSocketsServerPort);
console.log("Listening on port " + webSocketsServerPort);

const wsServer = new webSocketServer({
  httpServer: server,
});

let clients;

wsServer.on("request", (request) => {
  const connection = request.accept(null, request.origin);
  clients = connection;

  connection.on("message", async (message) => {
    if (message.type == "utf8") {
      const msg = JSON.parse(message.utf8Data);

      if (msg.name == "sendTransaction") {
        const sendTx = await sendTransaction(msg.body);
      }
    }
  });
});
