import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import App from "./App";
import { WalletProvider } from "./hooks/useWallet";
import { I18nProvider } from "./i18n/I18nProvider";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <WalletProvider>
          <App />
          <ToastContainer position="bottom-right" theme="light" />
        </WalletProvider>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
);
