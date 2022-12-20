### readme
> 
如果事件有更新,更新server.json文件后,需要把一下的内容放入到abi中
```
  {
    "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "name": "reserves",
    "outputs": [
      { "internalType": "uint256", "name": "interestRate", "type": "uint256" },
      { "internalType": "uint256", "name": "currentRatio", "type": "uint256" },
      { "internalType": "address", "name": "ceToken", "type": "address" },
      { "internalType": "address", "name": "debtToken", "type": "address" },
      { "internalType": "uint256", "name": "ceScaled", "type": "uint256" },
      { "internalType": "uint256", "name": "dtScaled", "type": "uint256" },
      {
        "internalType": "uint256",
        "name": "lastUpdateTime",
        "type": "uint256"
      },
      { "internalType": "uint256", "name": "ceSupply", "type": "uint256" },
      { "internalType": "uint256", "name": "debtSupply", "type": "uint256" },
      { "internalType": "bool", "name": "enable", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
```
