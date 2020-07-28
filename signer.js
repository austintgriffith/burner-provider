const { Wallet } = require('@ethersproject/wallet')

const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');

const readPrivateKeyFromLocalStorage = (privateKeyStorageString) => {
  let metaPrivateKey = localStorage.getItem(privateKeyStorageString)
  if(metaPrivateKey == "0") metaPrivateKey = false;
  if(metaPrivateKey && metaPrivateKey.length !== 66) metaPrivateKey=false;
  return metaPrivateKey
}

const loadPrivateKey = (privateKeyStorageString) => {
  if(typeof localStorage != "undefined" && typeof localStorage.setItem == "function"){
    //load private key out of local storage
    return readPrivateKeyFromLocalStorage(privateKeyStorageString)
  }else{
    //local storage isn't an option and they didn't pass in a pk attempted to use the filesystem
    try{
      return fs.readFileSync(".pk").toString()
    }catch(e){}
  }
}

const savePrivateKey = (privateKeyStorageString, privateKey) => {
  if(typeof localStorage != "undefined" && typeof localStorage.setItem == "function"){
    localStorage.setItem(privateKeyStorageString, privateKey)
  }else{
    // if we can't use local storage try saving it to the filesystem
    try{
      fs.writeFileSync(".pk", privateKey)
    }catch(e){}
  }
}

const generatePrivateKeyFromMnenomic = (mnemonic, index) => {
  const accountIndex = index || "0"
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const hdwallet = hdkey.fromMasterSeed(seed);
  const wallet_hdpath = "m/44'/60'/0'/0/";
  const wallet = hdwallet.derivePath(wallet_hdpath + accountIndex).getWallet();
  const privateKey ="0x"+wallet.getPrivateKey().toString("hex")
  return privateKey
}

const BurnerSigner = ({index, privateKey, mnemonic, namespace}) => {

  const privateKeyStorageString = `metaPrivateKey${namespace ? `_${namespace}`: ""}`

  let metaAccount
  if(privateKey){
    // if they passed in a private key, use it to generate an account
    metaAccount = new Wallet(privateKey);
  } else {
    //  Check if we have a private key saved
    const metaPrivateKey = loadPrivateKey(privateKeyStorageString);
    if (metaPrivateKey) metaAccount = new Wallet(metaPrivateKey);
    // if not just generate a temp account in memory for this session
    // (just leave metaAccount false and it will be created in the next block)
  }

  if(!metaAccount){
    // generate account either from a provided mnemonic or random generation
    if(mnemonic){
      metaAccount = new Wallet(generatePrivateKeyFromMnenomic(mnemonic, index));
    }else{
      metaAccount = Wallet.createRandom()
    }
    // if we needed to generate, save the pk to local storage
    savePrivateKey(privateKeyStorageString, metaAccount.privateKey)
  }

  return metaAccount
}

module.exports = BurnerSigner