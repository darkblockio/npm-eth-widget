const signInAndGetAccount = async (w3) => {
  try {
    const address = await w3.eth.getAccounts().then((data) => {
      return data[0].toLowerCase()
    })

    return address
  } catch (e) {
    alert(`Please make sure you have Metamask installed : ${e.message}`)
  }
}

const signTypedData = async (data, w3) => {
  let chainId = 1 //ethereum default

  const address = await signInAndGetAccount(w3)
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

  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        w3.currentProvider.sendAsync(
          {
            method: "eth_signTypedData_v4",
            params: [address, msgParams],
            from: address,
          },
          async function (err, result) {
            if (err) reject(err)
            if (result.error) {
              reject(result.error.message)
            }
            resolve(result.result)
          }
        )
      }, 1)
    } catch (err) {
      reject(err)
    }
  })
}

export default signTypedData
