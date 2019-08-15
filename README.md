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
```
var web3 = new Web3(new BurnerProvider({
  rpcUrl: 'http://localhost:8545',
  namespace: 'YourCoolUrl'
}));
```

-----------------------------------

Full CLI Example:
`index.js`:
```
var Web3 = require("web3")
var BurnerProvider = require("burner-provider")
var web3 = new Web3(new BurnerProvider('https://mainnet.infura.io'));
const message = "three six nine the goose drank wine"
web3.eth.getAccounts((err,accounts)=>{
  console.log("accounts:",accounts)
  web3.eth.sign(message,accounts[0],(err,sig)=>{
    console.log("sig",sig)
    let recovered = web3.eth.accounts.recover(message,sig)
    console.log("recovered",recovered)
    console.log("valid:",recovered===accounts[0])
    web3.currentProvider.stop()
  })
})
```

```bash
npm install web3 burner-provider
node index.js
```

![image](https://user-images.githubusercontent.com/2653167/62563225-cb9c9d80-b83f-11e9-8496-b590226ef192.png)

