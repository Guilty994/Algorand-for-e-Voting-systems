import algosdk from 'algosdk';

//DELETE
// create unsigned transaction
export const deleteApp = async (senderAddress, senderAccount, index, client) => {
  try {
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
      // console.log("Confirmed " + confirmedTxn)

      //Get the completed Transaction
      console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

      // display results
      let transactionResponse = await client.pendingTransactionInformation(txId).do();
      let appId = transactionResponse['txn']['txn'].apid;
      console.log("Deleted app-id: ", appId);
  } catch (err) {
      console.log(err)
  }
}