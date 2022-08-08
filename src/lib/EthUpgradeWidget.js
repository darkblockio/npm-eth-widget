import React, { useState, useEffect } from "react"
import { useMachine } from "@xstate/react"
import { utils, Upgrader, upgradeMachine } from "./shared"
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
        console.log("^^^^^^^^^^^^^^eth signing")
        console.log("state to sign", state)
        signFileUploadData()
      }

      //
      // if (state.value === "signing") {
      //   console.log("------ signing")
      //   authenticate(w3)
      // }
      //
      // if (state.value === "authenticated") {
      //   console.log("------ authenticated")
      //   send({ type: "DECRYPT" })
      // }
      //
      // if (state.value === "decrypting") {
      //   console.log("------ decrypting")
      //   setMediaURL(
      //     utils.getProxyAsset(
      //       state.context.artId,
      //       epochSignature,
      //       state.context.tokenId,
      //       state.context.contractAddress,
      //       null,
      //       platform,
      //       address
      //     )
      //   )
      //
      //   let arrTemp = []
      //
      //   state.context.display.stack.map((db) => {
      //     arrTemp.push(
      //       utils.getProxyAsset(
      //         db.artId,
      //         epochSignature,
      //         state.context.tokenId,
      //         state.context.contractAddress,
      //         null,
      //         platform,
      //         address
      //       )
      //     )
      //   })
      //
      //   setStackMediaURLs(arrTemp)
      //
      //   setTimeout(() => {
      //     console.log("------ SUCCESS")
      //     send({ type: "SUCCESS" })
      //   }, 1000)
      // }
      //
      // if (state.value === "display") {
      //   console.log("------ display")
      // }
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

    console.log("signatureData", signatureData)

    let signature = await signTypedData(signatureData, w3).then((response) => {
      return response
    })

    console.log("signature", signature)

    state.context.signature = signature
    state.context.uploadPercent = 50

    console.log("ETH WIDGET state", state)

    send({ type: "SUCCESS" })

    // return new Promise((resolve, reject) => {
    //   try {
    //     const msgParams = JSON.stringify({
    //       domain: {
    //         // Defining the chain aka Rinkeby testnet or Ethereum Main Net
    //         chainId: 1, //ethereum
    //         // Give a user friendly name to the specific contract you are signing for.
    //         name: "Verifying Ownership",
    //         // If name isn't enough add verifying contract to make sure you are establishing contracts with the proper entity
    //         verifyingContract: address,
    //         // Just let's you know the latest version. Definitely make sure the field name is correct.
    //         version: "1",
    //       },
    //
    //       // Defining the message signing data content.
    //       message: {
    //         /*
    //            - Anything you want. Just a JSON Blob that encodes the data you want to send
    //            - No required fields
    //            - This is DApp Specific
    //            - Be as explicit as possible when building out the message schema.
    //           */
    //         contents: data,
    //       },
    //       // Refers to the keys of the *types* object below.
    //       primaryType: "Mail",
    //       types: {
    //         // TODO: Clarify if EIP712Domain refers to the domain the contract is hosted on
    //         EIP712Domain: [
    //           { name: "name", type: "string" },
    //           { name: "version", type: "string" },
    //           { name: "chainId", type: "uint256" },
    //           { name: "verifyingContract", type: "address" },
    //         ],
    //
    //         // Refer to PrimaryType
    //         Mail: [{ name: "contents", type: "string" }],
    //         // Not an EIP712Domain definition
    //       },
    //     })
    //
    //     setTimeout(() => {
    //       w3.currentProvider.sendAsync(
    //         {
    //           method: "eth_signTypedData_v4",
    //           params: [address, msgParams],
    //           from: address,
    //         },
    //         async function (err, result) {
    //           if (err) reject(null)
    //           if (result.error) {
    //             reject(null)
    //           }
    //           resolve(result.result)
    //         }
    //       )
    //     }, 1)
    //   } catch (err) {
    //     resolve(err)
    //   }
    // })
  }

  // return <Stack state={state} authenticate={() => send({ type: "SIGN" })} urls={stackMediaURLs} config={config} />
  return <Upgrader apiKey={apiKey} state={state} config={config} authenticate={() => send({ type: "SIGN" })} />
}

export default EthUpgradeWidget
