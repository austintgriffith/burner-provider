var Web3 = require('web3');
const ProviderEngine = require('web3-provider-engine')
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js')
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture.js')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')
const VmSubprovider = require('web3-provider-engine/subproviders/vm.js')
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js')
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js')
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js')
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')

module.exports = BurnerProvider

let metaAccount

function BurnerProvider(opts = {}){
  var engine = new ProviderEngine()
  var web3 = new Web3(engine)

  // let them pass in a simple string for the options and use that as infura or whatevs
  let rpcUrl = opts
  if(typeof rpcUrl != "string"){
    rpcUrl = opts.rpcUrl
  }

  if(opts&&opts.privateKey){
    //if they passed in a private key, use it to generate an account
    metaAccount = web3.eth.accounts.privateKeyToAccount(opts.privateKey)
  } else if(typeof localStorage != "undefined"&&typeof localStorage.setItem == "function"){
    //load private key out of local storage
    let metaPrivateKey = localStorage.getItem('metaPrivateKey')
    if(metaPrivateKey=="0") metaPrivateKey=false;
    if(metaPrivateKey && metaPrivateKey.length!==66) metaPrivateKey=false;
    if(metaPrivateKey) metaAccount = web3.eth.accounts.privateKeyToAccount(metaPrivateKey)
  }else{
    //local storage isn't an option and they didn't pass in a pk so just generate one in memory
    // (just leave metaAccount false and it will be created in the next block)
  }

  if(!metaAccount){
    metaAccount = web3.eth.accounts.create();
    //if we needed to generate, save the pk to local storage
    if(typeof localStorage != "undefined"&&typeof localStorage.setItem == "function"){
      localStorage.setItem('metaPrivateKey',metaAccount.privateKey)
    }
  }

  // static results
  engine.addProvider(new FixtureSubprovider({
    web3_clientVersion: 'ProviderEngine/v0.0.0/javascript',
    net_listening: true,
    eth_hashrate: '0x00',
    eth_mining: false,
    eth_syncing: true,
  }))

  // cache layer
  engine.addProvider(new CacheSubprovider())

  // filters
  engine.addProvider(new FilterSubprovider())

  // pending nonce
  engine.addProvider(new NonceSubprovider())

  // vm
  engine.addProvider(new VmSubprovider())

  // id mgmt
  engine.addProvider(new HookedWalletSubprovider({
    getAccounts: function(cb){
      console.log("getAccounts!!")
      cb(false,[metaAccount.address])
    },
    approveTransaction: function(cb){
      console.log("no interface yet for approveTransaction!!")
      cb(true)
    },
    signTransaction: metaAccount.signTransaction,
    sign: metaAccount.sign,
    encrypt: metaAccount.encrypt,
    privateKey: metaAccount.privateKey,
    address: metaAccount.address,
    signMessage: (msgParams,cb) => {
      var message = ethUtil.toBuffer(msgParams.data)
      var msgHash = ethUtil.hashPersonalMessage(message)
      var sig = ethUtil.ecsign(msgHash,Buffer.from(metaAccount.privateKey.replace("0x",""), 'hex'))
      var serialized = ethUtil.bufferToHex(sigUtil.concatSig(sig.v, sig.r, sig.s))
      cb(null, serialized)
    }
  }))

  // data source
  engine.addProvider(new RpcSubprovider({
    rpcUrl: rpcUrl,
  }))

  // start polling for blocks
  engine.start()

  return engine
}


function generateMetaAccount(){
  let result = window.web3.eth.accounts.create();
}
