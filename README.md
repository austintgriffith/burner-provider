# burner-provider

Ephemeral key pair web3 provider

Here is an [example React app](https://github.com/austintgriffith/burner-provider-example) that uses the burner-provider!

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
