var ethers = require('ethers');
var fs = require('fs');
const ProviderEngine = require('web3-provider-engine')
//const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js')
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture.js')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx.js')
// const VmSubprovider = require('web3-provider-engine/subproviders/vm.js')
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js')
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js')
const WebSocketSubProvider = require('web3-provider-engine/subproviders/websocket.js')

const sigUtil = require('eth-sig-util')

module.exports = BurnerProvider

let metaAccount

function BurnerProvider(opts = {}){
  var engine;// = new ProviderEngine()

  console.log("🚛🚛🚛🚛🚛🚛🚛 BurnerProvider 🚛🚛🚛🚛🚛🚛🚛")

  // let them pass in a simple string for the options and use that as infura or whatevs
  if(typeof opts == "string"){
    let rpcUrl = opts
    opts = {rpcUrl}
  }

  if(opts && opts.provider){
    //console.log("Adding optional provider: ",opts.provider)
    //engine.addProvider(opts.provider)
    engine = opts.provider
    //console.log("Adding optional provider: ",opts.provider)
  }else{/*engine.addProvider(opts.provider)*/
    engine = new ProviderEngine()
  }

  let provider = new ethers.providers.Web3Provider(engine)


  let privateKeyStorageString = "metaPrivateKey"
  if(opts.namespace){
    privateKeyStorageString = privateKeyStorageString+"_"+opts.namespace
  }

  if(opts&&opts.privateKey){
    //if they passed in a private key, use it to generate an account
    //metaAccount = provider.eth.accounts.privateKeyToAccount(opts.privateKey)
    metaAccount = new ethers.Wallet(opts.privateKey, provider);
    //console.log("metaAccount from pk",metaAccount)
  } else if(typeof localStorage != "undefined"&&typeof localStorage.setItem == "function"){
    //load private key out of local storage
    let metaPrivateKey = localStorage.getItem(privateKeyStorageString)
    if(metaPrivateKey=="0") metaPrivateKey=false;
    if(metaPrivateKey && metaPrivateKey.length!==66) metaPrivateKey=false;
    //if(metaPrivateKey) metaAccount = provider.eth.accounts.privateKeyToAccount(metaPrivateKey)
    if(metaPrivateKey) metaAccount = new ethers.Wallet(metaPrivateKey, provider);
  }else{
    //local storage isn't an option and they didn't pass in a pk attempted to use the filesystem
    try{
      let fsPk = fs.readFileSync(".pk").toString()
      if(fsPk){
        metaAccount = new ethers.Wallet(fsPk, provider);
      }
    }catch(e){}
    // if not just generate a temp account in memory for this session
    // (just leave metaAccount false and it will be created in the next block)
  }

  if(!metaAccount){
    //generate account either from a provided mnemonic, pk, or random generation
    if(opts.mnemonic){
      const bip39 = require('bip39');
      const hdkey = require('ethereumjs-wallet/hdkey');
      let index = "0"
      if(typeof opts.index != "undefined"){
        index = opts.index
      }
      const seed = bip39.mnemonicToSeedSync(opts.mnemonic);
      const hdwallet = hdkey.fromMasterSeed(seed);
      const wallet_hdpath = "m/44'/60'/0'/0/";
      const wallet = hdwallet.derivePath(wallet_hdpath + index).getWallet();
      const privateKey ="0x"+wallet.getPrivateKey().toString("hex")
      //metaAccount = provider.eth.accounts.privateKeyToAccount(privateKey)
      metaAccount = new ethers.Wallet(privateKey, provider);
    }else{
      //metaAccount = provider.eth.accounts.create();
      metaAccount = ethers.Wallet.createRandom()
    }
    //if we needed to generate, save the pk to local storage
    if(typeof localStorage != "undefined"&&typeof localStorage.setItem == "function"){
      localStorage.setItem(privateKeyStorageString,metaAccount.privateKey)
    }else{
      //if we can't use local storage try saving it to the filesystem
      try{
        fs.writeFileSync(".pk",metaAccount.privateKey)
      }catch(e){}
    }
  }

  opts.getPrivateKey = (address,cb)=>{
    if(address.toLowerCase()==metaAccount.address.toLowerCase()){
      cb(null,Buffer.from(metaAccount.privateKey.replace("0x",""),'hex'))
    }else{
      cb("unknown account")
    }
  }

  opts.getAccounts = (cb)=>{
    //console.log("metaAccount",metaAccount)
    cb(false,[metaAccount.address])
  }

  // static results
  engine.addProvider(new FixtureSubprovider({
    web3_clientVersion: 'ProviderEngine/v0.0.0/javascript',
    net_listening: true,
    eth_hashrate: '0x00',
    eth_mining: false,
    eth_syncing: true,
  }))


  // cache layer // PULLED THANKS TO A HEADS UP FROM GSN! SORRY GUYS!
  //engine.addProvider(new CacheSubprovider())

  // filters
  engine.addProvider(new FilterSubprovider())

  // pending nonce
  engine.addProvider(new NonceSubprovider())

  // vm
  // engine.addProvider(new VmSubprovider())

  // id mgmt
  const hookedWalletSubprovider = new HookedWalletSubprovider(opts)

  hookedWalletSubprovider.signTypedMessage = function (msgParams, cb) {
    opts.getPrivateKey(msgParams.from, function(err, privateKey) {
      if (err) return cb(err)

      if (typeof msgParams.data === 'string') {
        msgParams.data = JSON.parse(msgParams.data);
      }

      const serialized = sigUtil.signTypedData_v4(privateKey, msgParams)
      cb(null, serialized)
    })
  }
  engine.addProvider(hookedWalletSubprovider)



  if(opts&&opts.rpcUrl&&opts.rpcUrl.indexOf&&opts.rpcUrl.indexOf("wss://")==0){
    engine.addProvider(new WebSocketSubProvider(opts))
  }else{
    // data source
    engine.addProvider(new RpcSubprovider(opts))
  }

  // start polling for blocks
  engine.start()


  //do this to prevent skipCache: true -- to prevent PollingBlockTracker undefined errors from eth-block-tracker/src/polling.js
  //engine._blockTracker._setSkipCacheFlag = false

  return engine
}
