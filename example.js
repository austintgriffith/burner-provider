var Web3 = require('web3');
var BurnerProvider = require('./index.js')

// you can pass in just the RPC endpoint:
//var web3 = new Web3(new BurnerProvider('http://localhost:8545'));
//
//or you can even pass in a pk:
var web3 = new Web3(new BurnerProvider({
    rpcUrl: 'http://localhost:8545',
    privateKey: '0xc0745ca88cdcb802a30ba467850e19019f8e7354eecc5ab674d78452e4feab84'
}));

console.log(web3.version)
web3.eth.getBlockNumber().then(console.log);
web3.eth.getAccounts().then((accounts)=>{
    console.log("Accounts:",accounts)
    web3.eth.sign(web3.utils.utf8ToHex("Hello world"),accounts[0]).then(console.log);
});
