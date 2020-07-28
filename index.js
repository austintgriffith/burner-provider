const { Web3Provider } = require('@ethersproject/providers');
const ProviderEngine = require('web3-provider-engine')
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js')
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture.js')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx.js')
// const VmSubprovider = require('web3-provider-engine/subproviders/vm.js')
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js')
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js')
const WebSocketSubProvider = require('web3-provider-engine/subproviders/websocket.js')

const sigUtil = require('eth-sig-util');
const BurnerSigner = require('./signer');

module.exports = BurnerProvider

function BurnerProvider(opts = {}){
  var engine = new ProviderEngine()

  // let them pass in a simple string for the options and use that as infura or whatevs
  if(typeof opts == "string"){
    let rpcUrl = opts
    opts = {rpcUrl}
  }

  const metaAccount = BurnerSigner(opts).connect(new Web3Provider(engine))

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



  if(opts.rpcUrl.indexOf("wss://")==0){
    engine.addProvider(new WebSocketSubProvider(opts))
  }else{
    // data source
    engine.addProvider(new RpcSubprovider(opts))
  }

  // start polling for blocks
  engine.start()

  return engine
}
