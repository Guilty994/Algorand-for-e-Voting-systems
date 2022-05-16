import * as fs from 'fs';
import algosdk from 'algosdk';
import dotenv from 'dotenv';
dotenv.config()

//SMART CONTRACT DEPLOYMENT
// declare application state storage (immutable)
const localInts = 0;
const localBytes = 2; // local choice, local reg status
const globalInts = 24; //# 4 for setup + 20 for choices. Use a larger number for more choices.
const globalBytes = 1; // EA address

// Candidate list
const candidates = ["paperino", "pippo", "pierino"];

// get accounts from mnemonic
const electAuthAccount = algosdk.mnemonicToSecretKey(process.env.REGAUTHMNEMONIC);
const elecAuthAddress = electAuthAccount.addr;


// Client connection /w Purestake
const algodServer = process.env.BASESERVER;
const algodPort = process.env.PORT;
const algodToken = {"X-API-Key": process.env.XAPIKEY};

let client = new algosdk.Algodv2(algodToken, algodServer, algodPort); 

// Read Teal File
let approvalProgram = ''
let clear_state_program = ''


try {
  approvalProgram = fs.readFileSync('./src/authority/contract/artifacts/vote_approval.teal', 'utf8')
  clear_state_program = fs.readFileSync('./src/authority/contract/artifacts/vote_clear_state.teal', 'utf8')
} catch (err) {
  console.error(err)
  
}



// Compile Program
const compileProgram = async (client, programSource) => {
    let encoder = new TextEncoder();
    let programBytes = encoder.encode(programSource);
    let compileResponse = await client.compile(programBytes).do();
    let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
    // console.log(compileResponse)
    return compiledBytes;
}

// convert 64 bit integer i to byte string
const intToBytes = (integer) => {
    return integer.toString()
}


//CREATE APP
// create unsigned transaction
const createApp = async (senderAddress, senderAccount, 
approvalProgram, clearProgram, 
localInts, localBytes, globalInts, globalBytes, app_args) => {
  try{
    const onComplete = algosdk.OnApplicationComplete.NoOpOC;

    const params = await client.getTransactionParams().do()
    params.fee = 1000;
    params.flatFee = true;

    let str_params = JSON.stringify(params, null, 4);
    console.log("Suggested params " + str_params);

      let txn = algosdk.makeApplicationCreateTxn(senderAddress, params, onComplete, 
        approvalProgram, clearProgram, 
        localInts, localBytes, globalInts, globalBytes, app_args);
      let txId = txn.txID().toString();
      // Sign the transaction
      let signedTxn = txn.signTxn(senderAccount.sk);
      console.log("Signed transaction with txID: %s", txId);

      // Submit the transaction
      await client.sendRawTransaction(signedTxn).do()                           
          // Wait for transaction to be confirmed
         let confirmedTxn = await algosdk.waitForConfirmation(client, txId, 4);

          console.log("Confirmed " + confirmedTxn.toString());

          //Get the completed Transaction
          console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
          // display results
          let transactionResponse = await client.pendingTransactionInformation(txId).do()
          let appId = transactionResponse['application-index'];
          console.log("Created new app-id: ",appId);
          return appId
    }catch(err){
    console.log(err)
  }
}

//READ STATE
// read local state of application from user account
const readLocalState = async (index, account) => {
try{
  let accountInfoResponse = await client.accountInformation(account.addr).do();
  let localState = accountInfoResponse['apps-local-state']
  return localState.map((item)=> {
    if(item['id'] == index){
      console.log("User's local state:" + item.id);
      let localStateItem = accountInfoResponse['apps-local-state'][item]['key-value']
      localStateItem.map((local) =>{
        console.log(local)
        return local
      })
    }
    return item
  })
}catch(err){
  console.log(err)
}
}


// read global state of application
const readGlobalState = async (index) => {
  try{
    let applicationInfoResponse = await client.getApplicationByID(index).do();
    let globalState = applicationInfoResponse['params']['global-state']
    return globalState.map((state) =>{
      return state;
    })
  }catch(err){
    console.log(err)
  }
}


//DELETE
// create unsigned transaction
const deleteApp = async (senderAddress, senderAccount, index) => {
  try{
    let params = await client.getTransactionParams().do()
    params.fee = 1000;
    params.flatFee = true;
    let txn = algosdk.makeApplicationDeleteTxn(senderAddress, params, index);
    // sign, send, await
    let txId = txn.txID().toString();
    // Sign the transaction
    let signedTxn = txn.signTxn(senderAccount.sk);
    console.log("Signed transaction with txID: %s", txId);

    // Submit the transaction
    await client.sendRawTransaction(signedTxn).do()                           
    // Wait for transaction to be confirmed
    const confirmedTxn = await algosdk.waitForConfirmation(client, txId, 4);
    console.log("Confirmed " + confirmedTxn)

    //Get the completed Transaction
    console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

    // display results
    let transactionResponse = await client.pendingTransactionInformation(txId).do();
    let appId = transactionResponse['txn']['txn'].apid;
    console.log("Deleted app-id: ",appId);
  }catch(err){
    console.log(err)
  }
}

const main = async () => {

  const approval_program = await compileProgram(client, approvalProgram)
  const clear_program = await  compileProgram(client,clear_state_program )

  // configure registration and voting period
  

  let RegBegin = 1652706033 // Thu May 12 2022 07:00:00 GMT+0000 // 16 omesso
  let RegEnd = 1652792433 // Fri May 13 2022 07:00:00 GMT+0000
  let VoteBegin = 1652878833 // Sat May 14 2022 07:00:00 GMT+0000
  let VoteEnd = 1652965233 // Sun May 15 2022 07:00:00 GMT+0000

  console.log(`Registration from: ${RegBegin} to ${RegEnd}`)
  console.log(`Vote from: ${VoteBegin} to ${VoteEnd}`)

  // create list of bytes for app args
  let appArgs = [];

  appArgs.push(
    new Uint8Array(Buffer.from(algosdk.encodeUint64(RegBegin))),
    new Uint8Array(Buffer.from(algosdk.encodeUint64(RegEnd))),
    new Uint8Array(Buffer.from(algosdk.encodeUint64(VoteBegin))),
    new Uint8Array(Buffer.from(algosdk.encodeUint64(VoteEnd))),
  )

  // create new application
  console.log("---STARTING CREATEAPP---")
  const appId =  await createApp(elecAuthAddress, electAuthAccount, approval_program, clear_program , localInts, localBytes, globalInts, globalBytes, appArgs)
  console.log("---END CREATEAPP---")    

  const globalState = await readGlobalState(appId)
  console.log("GLOBAL STATE BEFORE USERS INTERACTIONS")

  // https://developer.algorand.org/docs/get-details/encoding/
  globalState.forEach(state => {
      
      console.log(state);
      const decoded_key = Buffer.from(state['key'], "base64").toString();
      console.log("Key: "+decoded_key);
      const decoded_uint = state['value']['uint'];
      console.log("Uint: "+decoded_uint);
  });
  console.log("END GLOBAL STATE BEFORE USERS INTERACTIONS")


  //CREATOR
  console.log("---STARTING DELETEAPP---")
  await deleteApp(elecAuthAddress, electAuthAccount, appId)






}
main()