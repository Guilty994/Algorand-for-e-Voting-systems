import algosdk from 'algosdk';

//CREATE APP
// create unsigned transaction
export const createApp = async (senderAddress, senderAccount,
    approvalProgram, clearProgram,
    localInts, localBytes, globalInts, globalBytes, app_args, client) => {
    try {
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
        console.log("Created new app-id: ", appId);
        return appId;
    } catch (err) {
        console.log(err)
    }
}
