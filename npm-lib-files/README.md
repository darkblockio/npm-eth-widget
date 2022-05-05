# Darkblock.io React Component Library

## Getting Started 🚀

Install Darkblock's React Component Library using `yarn` or `npm`

```
yarn add @darkblock.io/eth-widget
```

```
npm i @darkblock.io/eth-widget --save
```

Once the library is installed, import or require components into your codebase, i.e:

```
import EthereumDarkblockWidget "@darkblock.io/eth-widget"
```

## Ethereum Widget Component

### Input

- **contractAddress:** contractAddress
- **tokenId:** id of the NFT in Ethereum
- **w3:\*** web3 object
- **cb:** callback function to be triggered on the widget's state change (optional)
- **config:** config object (optional)

**cb** function example, the callback function will have the widget's state passed as a parameter:

```
const cb = (param) => {
  console.log(param)
}
```

**config** object's default value:

```
{
  customCssClass: "",             // pass here a class name you plan to use
  debug: false,                   // debug flag to console.log some variables
  imgViewer: {                    // image viewer control parameters
    showRotationControl: true,
    autoHideControls: true,
    controlsFadeDelay: true,
  },
}
```

### Example

```
import EthereumDarkblockWidget from "@darkblock.io/eth-widget"

const Widget = () => {
  ...

  return (
    <EthereumDarkblockWidget
      contractAddress="0x495f947276749ce646f68ac8c248420045cb7b5e"
      tokenId="30553606573219150352991292921105176340809048341686170040023897672591735783425"
      w3={web3}
      cb={(p) => console.log(p)}
      config={config}
    />
  )
}

export default Widget

```
