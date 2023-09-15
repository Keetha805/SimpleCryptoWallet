import React from "react";
import ReactDOM from "react-dom/client";
import reportWebVitals from "./reportWebVitals";
import { MoralisProvider } from "react-moralis";
import { Main } from "./components/Main/Main";
global.Buffer = global.Buffer || require("buffer").Buffer;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <MoralisProvider initializeOnMount={false}>
    <Main></Main>
  </MoralisProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
