# burner-provider

Ephemeral key pair web3 provider

Here is an [example React app](https://github.com/austintgriffith/burner-provider-example) that uses the burner-provider!

```
npm install burner-provider
```

Pass `BurnerProvider` into Web() to initialize:
```javascript
import BurnerProvider from 'burner-provider';
import Web3 from 'web3';
var web3 = new Web3(new BurnerProvider('http://localhost:8545'));
```

OR using old `require()` method:
```javascript
const BurnerProvider = require('burner-provider');
const Web3 = require('web3');
var web3 = new Web3(new BurnerProvider('http://localhost:8545'));
```

OR using `ethers.js`:
```javascript
const BurnerProvider = require('burner-provider');
const ethers = require('ethers');
let provider = new ethers.providers.Web3Provider(new BurnerProvider('http://localhost:8545'));
```

You can get your address with:
```javascript
let accounts = await web3.eth.getAccounts()
```

Now your transactions will automatically sign and send:
```javascript
var tx = {
  to: this.state.to,
  from: this.state.accounts[0],
  value: this.state.value,
  data: '0x00'
}

web3.eth.sendTransaction(tx).then((receipt)=>{
  console.log("receipt",receipt)
  this.setState({receipt:receipt})
});
```

You also can access the private key directly with:
```javascript
localStorage.getItem('metaPrivateKey')
```

Optional Parameters:
```javascript
var web3 = new Web3(new BurnerProvider({
  rpcUrl: 'http://localhost:8545',
  namespace: 'YourCoolUrl'
}));
```

Websockets work too:
```javascript
var web3 = new Web3(new BurnerProvider('wss://mainnet.infura.io/ws'));
```

You can generate your wallet from a mnemonic and optional index too:
```javascript
var web3 = new Web3(new BurnerProvider({
    rpcUrl: 'http://localhost:8545',
    mnemonic: 'the bear is sticky with honey'
}));
```

-----------------------------------

Full CLI Example:
`index.js`:
```javascript
var Web3 = require('web3');
var BurnerProvider = require('./index.js')

// you can pass in just the RPC endpoint:
//var web3 = new Web3(new BurnerProvider('http://localhost:8545'));
//
//or you can even pass in a pk:
//var web3 = new Web3(new BurnerProvider({
//    rpcUrl: 'wss://mainnet.infura.io/ws',
//    privateKey: '0xc0745ca88cdcb802a30ba467850e19019f8e7354eecc5ab674d78452e4feab84'
//}));
//or you can pass it a websocket:
var web3 = new Web3(new BurnerProvider('wss://mainnet.infura.io/ws'));


console.log(web3.version)
web3.eth.getBlockNumber().then(console.log);
web3.eth.getAccounts().then((accounts)=>{
    console.log("Accounts:",accounts)
    web3.eth.getBalance(accounts[0]).then((balance)=>{
        console.log("balance:",balance)
        web3.eth.sign(web3.utils.utf8ToHex("Hello world"),accounts[0]).then((sig)=>{
            console.log("SIG:",sig)
            web3.currentProvider.stop()
        });
    })
});
```

```bash
npm install web3 burner-provider
node index.js
```

![image](https://user-images.githubusercontent.com/2653167/62563225-cb9c9d80-b83f-11e9-8496-b590226ef192.png)
