# solidity voting app

## units tests

- My first check is for the inherited OpenZeppelin ownable contract
- I created const values for the 10 accounts in my Ganache blockchain
- I check my functions with the 3 espect (normal event revert)
- the WorkflowStatus had to be changed all along the tests
- for the last test (tally), I made 3 propositions (red, green and blue)

## setup 

```bash
# if not installed
npm install -g truffle
#then
npm install
```

## deployment

```bash
truffle test test/voting.test.js --network development
truffle test test/voting.test.js --network ropsten
```
