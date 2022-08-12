import React, { useState, useEffect } from "react"
import { useMachine } from "@xstate/react"
import { utils, Upgrader, upgradeMachine } from "@darkblock.io/shared-components"
import signTypedData from "../utils/signTypedData"

const platform = "Ethereum"
const EthUpgradeWidget = ({
  apiKey = null,
  contractAddress,
  tokenId,
  w3 = null,
  cb = null,
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
  const [state, send] = useMachine(() => upgradeMachine(tokenId, contractAddress, platform))
  const [address, setAddress] = useState(null)

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
    if (!apiKey) {
      send({ type: "NO_APIKEY" })
    }
    if (!w3) {
      send({ type: "NO_WALLET" })
    } else {
      if (state.value === "idle") {
        send({ type: "FETCH_CREATOR" })
      }

      if (state.value === "started") {
        const connectWallet = async () => {
          const checkAddress = await w3.eth.getAccounts().then((data) => {
            return data[0].toLowerCase()
          })

          if (checkAddress) {
            setAddress(checkAddress)
            state.context.wallet_address = checkAddress
            send({ type: "CONNECT_WALLET" })
          } else {
            send({ type: "CONNECT_FAILED" })
          }
        }

        connectWallet()
      }

      if (state.value === "wallet_connected") {
        send({ type: "VERIFY_OWNER" })
      }

      if (state.value === "verify_owner") {
        verifyOwnership()
      }

      if (state.value === "signing") {
        signFileUploadData()
      }
    }
  }, [state.value])

  const verifyOwnership = async () => {
    let creatorDataWithOwner

    try {
      creatorDataWithOwner = await utils.getCreator(contractAddress, tokenId, platform)

      if (
        creatorDataWithOwner &&
        creatorDataWithOwner.creator_address &&
        creatorDataWithOwner.creator_address.toLowerCase() === address.toLowerCase()
      ) {
        send({ type: "SUCCESS" })
      } else {
        send({ type: "FAIL" })
      }
    } catch {
      send({ type: "FAIL" })
    }
  }

  const signFileUploadData = async () => {
    let signatureData = `${state.context.platform}${state.context.nftData.nft.contract}:${state.context.nftData.nft.token}${state.context.fileHash}`
    
    await signTypedData(signatureData, w3)
      .then((response) => {
        state.context.signature = response
        send({ type: "SIGNING_SUCCESS" })
      })
      .catch(() => {
        state.context.signature = null
        send({ type: "SIGNING_FAIL" })
      })
  }

  return <Upgrader apiKey={apiKey} state={state} config={config} authenticate={() => send({ type: "SIGN" })} />
}

export default EthUpgradeWidget
