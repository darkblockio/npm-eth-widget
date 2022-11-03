import React, { useState, useEffect } from "react"
import { Stack, utils, widgetMachine } from "@darkblock.io/shared-components"
import { useMachine } from "@xstate/react"

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
}) => {
  const upperNetwork = network.charAt(0).toUpperCase() + network.slice(1)
  const platform = network.toLowerCase() === "mainnet" ? "Ethereum" : `Ethereum-${upperNetwork}`

  const [state, send] = useMachine(() => widgetMachine(tokenId, contractAddress, platform, dev))
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
        (!ownerDataWithOwner ||
          !ownerDataWithOwner.owner_address ||
          ownerDataWithOwner.owner_address.toLowerCase() !== address.toLowerCase()) &&
        (!ownerDataWithOwner ||
          !ownerDataWithOwner.creator_address ||
          ownerDataWithOwner.creator_address.toLowerCase() !== address.toLowerCase())
      ) {
        send({ type: "FAIL" })
      } else {
        signature = await signData(address, sessionToken, w3, platform, network).then((response) => {
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

  const signData = async (address, data, w3, platform, network = null) => {
    let chainId = 1 //ethereum default
    if (network.toLowerCase() === "rinkeby") chainId = 4
    if (network.toLowerCase() === "goerli") chainId = 5

    return new Promise((resolve, reject) => {
      try {
        const msgParams = JSON.stringify({
          domain: {
            // Defining the chain aka Rinkeby testnet or Ethereum Main Net
            chainId: chainId,
            // Give a user friendly name to the specific contract you are signing for.
            name: "Verifying Ownership",
            // If name isn't enough add verifying contract to make sure you are establishing contracts with the proper entity
            verifyingContract: address,
            // Just let's you know the latest version. Definitely make sure the field name is correct.
            version: "1",
          },

          // Defining the message signing data content.
          message: {
            /*
               - Anything you want. Just a JSON Blob that encodes the data you want to send
               - No required fields
               - This is DApp Specific
               - Be as explicit as possible when building out the message schema.
              */
            contents: data,
          },
          // Refers to the keys of the *types* object below.
          primaryType: "Mail",
          types: {
            // TODO: Clarify if EIP712Domain refers to the domain the contract is hosted on
            EIP712Domain: [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" },
            ],

            // Refer to PrimaryType
            Mail: [{ name: "contents", type: "string" }],
            // Not an EIP712Domain definition
          },
        })

        setTimeout(() => {
          w3.currentProvider.sendAsync(
            {
              method: "eth_signTypedData_v4",
              params: [address, msgParams],
              from: address,
            },
            async function (err, result) {
              if (err) reject(null)
              if (result.error) {
                reject(null)
              }
              resolve(result.result)
            }
          )
        }, 1)
      } catch (err) {
        resolve(err)
      }
    })
  }

  return <Stack state={state} authenticate={() => send({ type: "SIGN" })} urls={stackMediaURLs} config={config} />
}

export default EthereumDarkblockWidget
