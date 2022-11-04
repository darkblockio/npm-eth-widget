import React, { useState, useEffect } from "react"
import { useMachine } from "@xstate/react"
import { utils, Upgrader, upgradeMachine } from "@darkblock.io/shared-components"
import signTypedData, { SIGNING_TYPE } from "../utils/signTypedData"

const EthUpgradeWidget = ({
  apiKey = null,
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
}) => {
  const upperNetwork = network.charAt(0).toUpperCase() + network.slice(1)
  const platform = network.toLowerCase() === "mainnet" ? "Ethereum" : `Ethereum-${upperNetwork}`

  const [state, send] = useMachine(() => upgradeMachine(tokenId, contractAddress, platform, dev))
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
      setTimeout(async () => {
        creatorDataWithOwner = await utils.getCreator(contractAddress, tokenId, platform, dev)
        if (
          creatorDataWithOwner &&
          creatorDataWithOwner.creator_address &&
          creatorDataWithOwner.creator_address.toLowerCase() === address.toLowerCase()
        ) {
          send({ type: "SUCCESS" })
        } else {
          send({ type: "FAIL" })
        }
      }, 1000)
    } catch {
      send({ type: "FAIL" })
    }
  }

  const signFileUploadData = async () => {
    let signatureData = `${state.context.platform}${state.context.nftData.nft.contract}:${state.context.nftData.nft.token}${state.context.fileHash}`

    await signTypedData(signatureData, w3, SIGNING_TYPE.upgradeNft)
      .then((response) => {
        state.context.signature = response
        send({ type: "SIGNING_SUCCESS" })
      })
      .catch(() => {
        state.context.signature = null
        send({ type: "SIGNING_FAIL" })
      })
  }

  return (
    <Upgrader
      apiKey={apiKey}
      state={state}
      config={config}
      authenticate={() => send({ type: "SIGN" })}
      reset={(value) => {
        if (value === "finished") {
          send({ type: "COMPLETE" })
        } else {
          send({ type: "RESET" })
        }
      }}
    />
  )
}

export default EthUpgradeWidget
