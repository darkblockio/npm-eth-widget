import React, { useState, useEffect } from "react"
import { Stack, utils, widgetMachine } from "@darkblock.io/shared-components"
import { useMachine } from "@xstate/react"
import signTypedData, { SIGNING_TYPE } from "../utils/signTypedData"

const EthereumDarkblockWidget = ({
  contractAddress,
  tokenId,
  w3 = null,
  cb = null,
  network = "mainnet",
  config = {
    customCssClass: "",
    debug: false,
    imgViewer: {
      showRotationControl: true,
      autoHideControls: true,
      controlsFadeDelay: true,
    },
  },
  dev = false,
  dbConfig = null,
}) => {
  const upperNetwork = network.charAt(0).toUpperCase() + network.slice(1)
  const platform = network.toLowerCase() === "mainnet" ? "Ethereum" : `Ethereum-${upperNetwork}`

  const [state, send] = useMachine(() => widgetMachine(tokenId, contractAddress, platform, dev, dbConfig))
  const [address, setAddress] = useState(null)
  const [mediaURL, setMediaURL] = useState("")
  const [stackMediaURLs, setStackMediaURLs] = useState("")
  const [epochSignature, setEpochSignature] = useState(null)

  const callback = (state) => {
    if (config.debug) console.log("Callback function called from widget. State: ", state)

    if (typeof cb !== "function") return

    try {
      cb(state)
    } catch (e) {
      console.log("Callback function error: ", e)
    }
  }

  useEffect(() => {
    callback(state.value)

    if (!w3) {
      send({ type: "NO_WALLET" })
    } else {
      if (state.value === "idle") {
        send({ type: "FETCH_ARWEAVE" })
      }

      if (state.value === "started") {
        const connectWallet = async () => {
          const checkAddress = await w3.eth.getAccounts().then((data) => {
            return data[0].toLowerCase()
          })

          if (checkAddress) {
            setAddress(checkAddress)
            send({ type: "CONNECT_WALLET" })
          }
        }

        connectWallet()
      }

      if (state.value === "wallet_connected") {
        // send({ type: "SIGN" })
      }

      if (state.value === "signing") {
        authenticate(w3)
      }

      if (state.value === "authenticated") {
        send({ type: "DECRYPT" })
      }

      if (state.value === "decrypting") {
        setMediaURL(
          utils.getProxyAsset(
            state.context.artId,
            epochSignature,
            state.context.tokenId,
            state.context.contractAddress,
            null,
            platform,
            address
          )
        )

        let arrTemp = []

        state.context.display.stack.map((db) => {
          arrTemp.push(
            utils.getProxyAsset(
              db.artId,
              epochSignature,
              state.context.tokenId,
              state.context.contractAddress,
              null,
              platform,
              address
            )
          )
        })

        setStackMediaURLs(arrTemp)

        setTimeout(() => {
          send({ type: "SUCCESS" })
        }, 1000)
      }

      if (state.value === "display") {
      }
    }
  }, [state.value])

  const authenticate = async (w3) => {
    let signature
    let epoch = Date.now()
    let sessionToken = epoch + address
    let ownerDataWithOwner

    try {
      ownerDataWithOwner = await utils.getOwner(contractAddress, tokenId, platform, address, dev)

      if (
        !ownerDataWithOwner ||
        !ownerDataWithOwner.owner_address ||
        ownerDataWithOwner.owner_address.toLowerCase() !== address.toLowerCase()
      ) {
        send({ type: "FAIL" })
      } else {
        signature = await signTypedData(sessionToken, w3, SIGNING_TYPE.accessAuth).then((response) => {
          return response
        })

        if (signature) {
          send({ type: "SUCCESS" })
        } else {
          send({ type: "FAIL" })
        }
      }
    } catch (e) {
      signature ? send({ type: "FAIL" }) : send({ type: "CANCEL" })
    }

    setEpochSignature(epoch + "_" + signature)
  }

  return <Stack state={state} authenticate={() => send({ type: "SIGN" })} urls={stackMediaURLs} config={config} />
}

export default EthereumDarkblockWidget
