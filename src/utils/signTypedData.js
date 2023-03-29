
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
const signMessage = async (message, address) => {
  // const message = "Hello World";
  const from = address;
  const params = [message, from];
  const method = "personal_sign";
  return await window.ethereum.request({
    method,
    params,
    from,
  });
};
export const SIGNING_TYPE = {
  accessAuth: "access",
  upgradeNft: "upgradeNft",
  upgradeCollection: "upgradeCollection",
}
const signTypedData = async (data, w3, type) => {
  const address = await signInAndGetAccount(w3)
  let msgParams = ""
  switch (type) {
    case SIGNING_TYPE.accessAuth:
      msgParams = `You are unlocking content via the Darkblock Protocol.\n\nPlease sign to authenticate.\n\nThis request will not trigger a blockchain transaction or cost any fee.\n\nAuthentication Token: ${data}`
      break
    case SIGNING_TYPE.upgradeNft:
      msgParams = `You are interacting with the Darkblock Protocol.\n\nPlease sign to upgrade this NFT.\n\nThis request will not trigger a blockchain transaction or cost any fee.\n\nAuthentication Token: ${data}`
      break
    case SIGNING_TYPE.upgradeCollection:
      msgParams = `You are interacting with the Darkblock Protocol.\n\nAttention: You are attempting to upgrade an entire NFT collection!\n\nPlease sign to continue.\n\nThis request will not trigger a blockchain transaction or cost any fee.\nAuthentication Token: ${data}`
      break
    default:
      msgParams = `You are unlocking content via the Darkblock Protocol.\n\nPlease sign to authenticate.\n\nThis request will not trigger a blockchain transaction or cost any fee.\n\nAuthentication Token: ${data}`
      break
  }
  return new Promise(async (resolve, reject) => {
    try {
      const signedMessage = await signMessage(msgParams, address);
      resolve(signedMessage);
    } catch (err) {
      reject(err);
    }
  });
  
}
export default signTypedData
// 