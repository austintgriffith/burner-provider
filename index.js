var Web3 = require('web3');
var fs = require('fs');
const ProviderEngine = require('web3-provider-engine')
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js')
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture.js')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')
const VmSubprovider = require('web3-provider-engine/subproviders/vm.js')
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx.js')
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js')
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js')

module.exports = BurnerProvider

let metaAccount

function BurnerProvider(opts = {}){
  var engine = new ProviderEngine()
  var web3 = new Web3(engine)

  // let them pass in a simple string for the options and use that as infura or whatevs
  if(typeof opts == "string"){
    let rpcUrl = opts
    opts = {rpcUrl}
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
    //local storage isn't an option and they didn't pass in a pk attempted to use the filesystem
    try{
      let fsPk = fs.readFileSync(".pk").toString()
      if(fsPk){
        metaAccount = web3.eth.accounts.privateKeyToAccount(fsPk)
      }
    }catch(e){}
    // if not just generate a temp account in memory for this session
    // (just leave metaAccount false and it will be created in the next block)
  }

  if(!metaAccount){
    metaAccount = web3.eth.accounts.create();
    //if we needed to generate, save the pk to local storage
    if(typeof localStorage != "undefined"&&typeof localStorage.setItem == "function"){
      localStorage.setItem('metaPrivateKey',metaAccount.privateKey)
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

  // cache layer
  engine.addProvider(new CacheSubprovider())

  // filters
  engine.addProvider(new FilterSubprovider())

  // pending nonce
  engine.addProvider(new NonceSubprovider())

  // vm
  engine.addProvider(new VmSubprovider())

  // id mgmt
  engine.addProvider(new HookedWalletSubprovider(opts))

  // data source
  engine.addProvider(new RpcSubprovider(opts))

  // start polling for blocks
  engine.start()

  return engine
}
