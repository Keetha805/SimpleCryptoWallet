//--------------------------------FORMATTING----------------------------
export const formatAddress = (address, format = "") => {
  if (address == "" || address == undefined) {
    return "";
  }

  let newAddress = address.startsWith("0x") ? address : "0x" + address;
  if (format == "lower") {
    newAddress = address.toLowerCase();
  }
  newAddress =
    newAddress.substring(0, 6) +
    "..." +
    newAddress.substring(newAddress.length - 4);
  return newAddress;
};

export const formatDate = (timestamp) => {
  const date = new Date(parseFloat(timestamp) * 1000);
  const dateFormat = date.toDateString().substring(4, 10);
  const dateString = dateFormat.split(" ")[1].startsWith("0")
    ? dateFormat.split(" ")[0] + " " + dateFormat.split(" ")[1].substring(1)
    : dateFormat;
  return dateString;
};

export const firstLetter = (word) => {
  if (word) {
    let firstLetter = word.charAt(0).toUpperCase();
    let finalString = firstLetter + word.substring(1);
    return finalString;
  }
  return "";
};

export const toFixed = (num, fixed) => {
  var re = new RegExp("^-?\\d+(?:.\\d{0," + (fixed || -1) + "})?");
  return num.toString().match(re)[0];
};

export const endsWith = (searchString, stringToLook, position = undefined) => {
  position = position || stringToLook.length;
  position = position - searchString.length;
  var lastIndex = stringToLook.lastIndexOf(searchString);
  return lastIndex !== -1 && lastIndex === position;
};
//--------------------------------NETWORKS----------------------------
export const getNetworks = async () => {
  const { networks } = await fetchBackend("/networks");
  return networks;
};

export const getNetworkSelected = async () => {
  const { networkSelected } = await fetchBackend("/networkSelected");
  return networkSelected;
};

//--------------------------------ACCOUNTS----------------------------

export const getAccounts = async () => {
  const { accounts } = await fetchBackend("/accounts");
  return accounts;
};

export const getAccountSelected = async () => {
  let { accountSelected: acc } = await fetchBackend("/accountSelected");
  acc = acc.name === undefined ? { name: "Non accounts selected" } : acc;
  return acc;
};

//--------------------------------TOKENS----------------------------

export const getTokens = async () => {
  const { tokens } = await fetchBackend("/tokens");
  return tokens;
};

//--------------------------------ETH----------------------------

export const getEthBalance = async () => {
  const { newEthBalance } = await fetchBackend("/ethBalance");
  return newEthBalance;
};

//--------------------------------TRANSACTIONS----------------------------

export const getTransactions = async () => {
  const { transactions } = await fetchBackend("/transactions");
  return transactions;
};

//--------------------------------MAIN FUNCTIONALITES----------------------------

export const fetchBackend = async (endpoint, method = "", body = {}) => {
  const url = "http://localhost:8000" + endpoint;
  let result;
  if (method === "POST") {
    const headers = {
      "Content-Type": "application/json",
    };
    result = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });
  } else {
    result = await fetch(url);
  }

  result = await result.json();

  return result;
};
