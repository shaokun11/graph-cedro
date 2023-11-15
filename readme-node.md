
### Setting Up Local Graph Node

> This tutorial has been tested only on Ubuntu 20.04.

### Docker Setup

- Install Docker:

```
sudo apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io
sudo systemctl start docker # Docker will start automatically on future system boots
```

- Install Docker Compose v2:

```
sudo apt-get install docker-compose-plugin
docker compose version
```

- Set Docker to run without `sudo`:

```
sudo groupadd docker
sudo usermod -aG docker $USER
sudo reboot
docker run hello-world # This should work without sudo now
```

### Installing Git
Please refer to this tutorial: [Git - Installing Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)


### Installing Node.js 18
Please refer to this tutorial: [Node.js - Download](https://nodejs.org/en/download)

### Downloading Graph Node
1. Clone the source code:

```
git clone https://github.com/graphprotocol/graph-node.git
cd graph-node
```

2. Checkout the specified version:

```
git branch -b v0.2.21 02c96c0698d770fd0769e12f869a12425518ef53
```

3. Modify the docker-compose file:

```
cd docker
vim docker-compose.yml

Replace line 4:
image: graphprotocol/graph-node
to 
image: graphprotocol/graph-node:v0.24.1

Replace line 20:
ethereum: 'mainnet:http://host.docker.internal:8545'
to
ethereum: 'bscTest:https://falling-practical-yard.bsc-testnet.quiknode.pro/fee98de2587ea84a431d686f61afdf5bda48cff9/'

You can obtain the URL from https://www.ankr.com/, https://www.quicknode.com/, or https://www.infura.io.
Choose the corresponding network for BSC Testnet (or any other network if your contract is deployed on a different network), and select the node type as 'archive'.
```

4. Start the Graph Node:

```
Go to the directory containing the docker-compose.yml file and execute:
docker compose up -d

This will start the Graph Node on port 8000.

You can view the logs using:
docker logs docker-graph-node-1--tail 10 -f
```

5. Deploy your own subgraph:
> This example uses https://github.com/shaokun11/graph-cedro for illustration.

```
git clone https://github.com/shaokun11/graph-cedro
git checkout layerzero
cd graph-cedro
npm i
npm run codegen
npm run create
npm run deploy:l
```

6. Query the data:
```
Visit http://localhost:8000/subgraphs/name/cedro/server1 to query the data.

input

{
  depositEntity(id: "0xbb88ae68e7aec851f25b74d443aaf05da4308ece860c9d710e8675167b0b1710") {
    chainId
    timestamp
  }
}

output:

{
  "data": {
    "depositEntity": {
      "chainId": "0x46544d0000000000000000000000000000000000000000000000000000000000",
      "timestamp": "1685013491"
    }
  }
}


```

---

