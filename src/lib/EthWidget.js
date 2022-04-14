import React, { useState, useEffect } from "react";
import Header from "./Header";
import Player from "./Player";
// import NoDarkblockHeader from "../../Header/NoDarkblockHeader"
import Panel from "./Panel";
import { getProxyAsset } from "./utils";
import "./db.css";
import { useMachine } from "@xstate/react";
import { widgetMachine } from "./widgetMachine";

const platform = "Ethereum";

const EthereumDarkblockWidget = ({
  contractAddress,
  tokenId,
  w3 = null,
  config = {
    customCssClass: "",
    debug: false,
    imgViewer: {
      showRotationControl: true,
      autoHideControls: true,
      controlsFadeDelay: true,
    },
  },
}) => {
  const [state, send] = useMachine(() =>
    widgetMachine(tokenId, contractAddress, platform)
  );
  const [address, setAddress] = useState(null);
  const [mediaURL, setMediaURL] = useState("");
  const [epochSignature, setEpochSignature] = useState(null);

  // useEffect(() => {
  //   window.ethereum
  //     ? ethereum
  //         .request({ method: "eth_requestAccounts" })
  //         .then((accounts) => {
  //           setAddress(accounts[0]);
  //           let w3 = new Web3(ethereum);
  //           setWeb3(w3);
  //         })
  //         .catch((err) => console.log(err))
  //     : console.log("Please install MetaMask");
  // }, []);

  useEffect(() => {
    console.log(state.value);

    if (state.value === "idle") {
      send({ type: "FETCH_ARWEAVE" });
    }

    if (state.value === "started") {
      const connectWallet = async () => {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });

          if (accounts) {
            console.log("accounts: ", accounts);
            setAddress(accounts[0]);
            send({ type: "CONNECT_WALLET" });
          }
        }
      };

      connectWallet();
    }

    if (state.value === "wallet_connected") {
      // send({ type: "SIGN" })
    }

    if (state.value === "signing") {
      authenticate(w3);
    }

    if (state.value === "authenticated") {
      send({ type: "DECRYPT" });
    }

    if (state.value === "decrypting") {
      setMediaURL(
        getProxyAsset(
          state.context.artId,
          epochSignature,
          state.context.tokenId,
          state.context.contractAddress,
          null,
          platform
        )
      );
      setTimeout(() => {
        send({ type: "SUCCESS" });
      }, 1000);
    }

    if (state.value === "display") {
    }
  }, [state.value]);

  const authenticate = async (w3) => {
    let signature;
    let epoch = Date.now();
    let sessionToken = epoch + address;

    try {
      signature = await signData(address, sessionToken, w3, () => {
        send({ type: "SUCCESS" });
      });
    } catch (e) {
      console.log(e);

      signature ? send({ type: "FAIL" }) : send({ type: "CANCEL" });
    }

    setEpochSignature(epoch + "_" + signature);
  };

  const signData = (address, data, w3, cb) => {
    return new Promise((resolve, reject) => {
      const typedData = [
        {
          type: "string",
          name: "Message",
          value: data,
        },
      ];
      return w3.currentProvider.send(
        {
          method: "eth_signTypedData",
          params: [typedData, address],
        },
        (err, result) => {
          if (err) {
            return reject(err);
          }

          if (result.error) {
            reject(result.error.message);
          }

          if (typeof cb === "function") {
            cb();
          }
          resolve(result.result);
        }
      );
    });
  };

  return (
    <div className="DarkblockWidget-App">
      <>
        {state.value === "display" ? (
          <Player
            mediaType={state.context.display.fileFormat}
            mediaURL={mediaURL}
          />
        ) : (
          <Header state={state} authenticate={() => send({ type: "SIGN" })} />
        )}
        <Panel state={state} />
        <p>{state.value}</p>
      </>
    </div>
  );
};

export default EthereumDarkblockWidget;
