import Web3 from "web3"
import React, { useEffect, useState } from "react"
import { storiesOf } from "@storybook/react"
import EthUpgradeWidget from "../lib/EthUpgradeWidget"

const stories = storiesOf("Ethereum Upgrade Widget", module)

stories.add("Add Content", () => {
  const cb = (param1) => {
    console.log("upgrade cb", param1)
  }

  const Widget = () => {
    const [web3, setWeb3] = useState(null)
    const [address, setAddress] = useState(null)
    const [loaded, setLoaded] = useState(false)

    const apiKey = "" //Darkblock API key goes here
    
    useEffect(() => {
      if (window.ethereum) {
        window.ethereum
          .request({ method: "eth_requestAccounts" })
          .then((accounts) => {
            setAddress(accounts[0])
            let w3 = new Web3(window.ethereum)
            setWeb3(w3)
            setLoaded(true)
          })
          .catch((err) => {
            console.log(err)
            setWeb3(null)
            setLoaded(true)
          })
      } else {
        setWeb3(null)
        setLoaded(true)
      }
    }, [])

    return (
      <div style={{ maxWidth: "700px" }}>
        {loaded && (
          <EthUpgradeWidget
            apiKey={apiKey}
            contractAddress="0x495f947276749ce646f68ac8c248420045cb7b5e" //default db
            tokenId="30553606573219150352991292921105176340809048341686170040023897679188805550081" //default db
            w3={web3}
            cb={cb}
            network="mainnet"
            config={{
              customCssClass: "custom-class",
              debug: false,
              imgViewer: {
                showRotationControl: true,
                autoHideControls: true,
                controlsFadeDelay: true,
              },
            }}
          />
        )}
      </div>
    )
  }

  return <Widget />
})
