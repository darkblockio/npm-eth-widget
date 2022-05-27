import Web3 from "web3"
import React, { useEffect, useState } from "react"
import { storiesOf } from "@storybook/react"
import EthereumDarkblockWidget from "../lib/EthWidget"

const stories = storiesOf("Ethereum Darkblock Widget", module)

stories.add("Video - Bubble Light", () => {
  const cb = (param1) => {
    console.log(param1)
  }

  const Widget = () => {
    const [web3, setWeb3] = useState(null)
    const [address, setAddress] = useState(null)

    useEffect(() => {
      window.ethereum
        ? ethereum
            .request({ method: "eth_requestAccounts" })
            .then((accounts) => {
              setAddress(accounts[0])
              let w3 = new Web3(ethereum)
              setWeb3(w3)
            })
            .catch((err) => console.log(err))
        : console.log("Please install MetaMask")
    }, [])
    return (
      <div style={{ maxWidth: "700px" }}>
        <EthereumDarkblockWidget
          contractAddress="0x495f947276749ce646f68ac8c248420045cb7b5e"
          tokenId="30553606573219150352991292921105176340809048341686170040023897679188805550081"
          w3={web3}
          cb={cb}
          config={{
            customCssClass: "custom-class",
            debug: true,
            imgViewer: {
              showRotationControl: true,
              autoHideControls: true,
              controlsFadeDelay: true,
            },
          }}
        />
      </div>
    )
  }

  return <Widget />
})
