import Web3 from "web3";
import React, { useState, useEffect } from "react";
import Header from "./Header";
import Player from "./Player";
// import NoDarkblockHeader from "../../Header/NoDarkblockHeader"
import Panel from "./Panel";
import { getProxyAsset } from "./utils";
import "./db.css";
import { useMachine } from "@xstate/react";
import { widgetMachine } from "./widgetMachine";

const widgetName = "DarkblockWidget";
const platform = "Ethereum";

const signData = (address, data, cb) => {
  return new Promise((resolve, reject) => {
    const web3 = new Web3(Web3.givenProvider);
    const typedData = [
      {
        type: "string",
        name: "Message",
        value: data,
      },
    ];
    return web3.currentProvider.send(
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

const EthereumDarkblockWidget = ({
  contractAddress,
  tokenId,
  sessionToken = false,
}) => {
  const [state, send] = useMachine(() =>
    widgetMachine(tokenId, contractAddress, platform)
  );
  const [mediaURL, setMediaURL] = useState("");
  const [address, setAddress] = useState("");
  const [epochSignature, setEpochSignature] = useState(null);

  useEffect(() => {
    console.log(state.value);

    if (state.value === "idle") {
      send({ type: "FETCH_ARWEAVE" });
    }

    if (state.value === "started") {
      const connectWallet = async () => {
        console.log("web3: ", web3);
        if (!web3) {
          console.log("web3: ", web3);
          try {
            await window.ethereum.enable();
            web3 = new Web3(window.ethereum);
          } catch (error) {
            window.alert("You need to allow MetaMask.");
            return;
          }
        }

        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts) {
          console.log("accounts: ", accounts);
          setAddress(accounts[0]);
          send({ type: "CONNECT_WALLET" });
        }
      };

      connectWallet();
    }

    if (state.value === "wallet_connected") {
      // send({ type: "SIGN" })
    }

    if (state.value === "signing") {
      authenticate();
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

  const authenticate = async () => {
    let signature;
    let epoch = Date.now();
    let sessionToken = epoch + address;

    try {
      signature = await signData(address, sessionToken, () => {
        send({ type: "SUCCESS" });
      });
    } catch (e) {
      console.log(e);

      signature ? send({ type: "FAIL" }) : send({ type: "CANCEL" });
    }

    setEpochSignature(epoch + "_" + signature);
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
