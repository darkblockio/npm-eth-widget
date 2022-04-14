import React from "react";
import { storiesOf } from "@storybook/react";
import EthereumDarkblockWidget from "../lib/EthWidget";

const stories = storiesOf("Ethereum Darkblock Widget", module);

stories.add("App", () => {
  return (
    <EthereumDarkblockWidget
      contractAddress="0x495f947276749ce646f68ac8c248420045cb7b5e"
      tokenId="30553606573219150352991292921105176340809048341686170040023897672591735783425"
      w3={{ currentProvider: "jhkj" }}
      cb={(p) => console.log(p)}
    />
  );
});
