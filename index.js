const ethers = require('ethers');
const Ganache = require('ganache-cli');

// ABIS
const flokiABI = require('./abis/FlokiAbi.json')
const routerABI = require('./abis/RouterAbi.json')
const wethABI = require('./abis/WethAbi.json')


const mainWalletPrivateKey = '0x1fcffdf4c796eb110c996a2dabdaffd3c136f640e5c87f0a9e01e8df3144645e';
const nodeEndPoint = 'Your Infura Key';
const url = "http://localhost:8545";

const provider = new ethers.providers.JsonRpcProvider(url);
const wallet = new ethers.Wallet(mainWalletPrivateKey, provider)
const account = wallet.connect(provider);

const addresses = {
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    floki: '0x43f11c02439e2736800433b4594994Bd43Cd066D',
    router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    recipient: account.address
}


const ganache = Ganache.server({
    fork: nodeEndPoint,
    // Leaving accounts empty will create 10 default accounts with 100 ETH Each
    accounts: [
        {
            secretKey: mainWalletPrivateKey, // accepts Real/Fake Private Key
            balance: ethers.utils.hexlify(ethers.utils.parseEther('12345')) // Populate with Fake ETH because it's a clone, Real Account Has it's own Real ETH Balance
        },
    ]
})

const router = new ethers.Contract(
    addresses.router,
    routerABI,
    account
);

const floki = new ethers.Contract(
    addresses.floki,
    flokiABI,
    account
);

const weth = new ethers.Contract(
    addresses.WETH,
    wethABI,
    account
);


console.log(`
    New pair 
    =================
    token0: ${weth.address}
    token1: ${floki.address}
  `);



ganache.listen(8545, async () => {
    const amountIn = ethers.utils.parseUnits('10', 'ether');
    const amounts = await router.getAmountsOut(amountIn, [weth.address, floki.address]);
    const amountOutMin = amounts[1].sub(amounts[1].div(10));
    const deadline = Math.floor(Date.now() / 1000) + 60 * 3; // 1 minutes from the current Unix time

    console.log(`
    Buying new token
    =================
    tokenIn: ${amountIn.toString()} ${weth.address} (WETH)
    tokenOut: ${amountOutMin.toString()} ${floki.address}
  `);
    const tx = await router.swapExactETHForTokens(
        amountOutMin,
        [weth.address, floki.address],
        addresses.recipient,
        deadline,
        {
            value: amountIn,
            gasLimit: 1000000
        }
    );
    const receipt = await tx.wait();
    console.log('Transaction receipt');
    console.log(receipt);

});



