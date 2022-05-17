import algosdk from 'algosdk';

//OPTIN
// create unsigned transaction
export const optin = async (senderAddress, senderAccount, AppId, client) => {
    try {
        let params = await client.getTransactionParams().do()
        params.fee = 1000;
        params.flatFee = true;

        let txn = algosdk.makeApplicationOptInTxn(senderAddress, params, AppId);
        let txId = txn.txID().toString();
        // sign, send, await
        // Sign the transaction
        let signedTxn = txn.signTxn(senderAccount.sk);
        console.log("Signed transaction with txID: %s", txId);

        // Submit the transaction
        await client.sendRawTransaction(signedTxn).do()
        // Wait for transaction to be confirmed
        const confirmedTxn = await algosdk.waitForConfirmation(client, txId, 4);
        //console.log("Confirmed " + confirmedTxn)

        //Get the completed Transaction
        console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
        // display results
        // display results
        let transactionResponse = await client.pendingTransactionInformation(txId).do();
        console.log("Opted-in to app-id:", transactionResponse['txn']['txn']['apid'])
    } catch (err) {
        console.log(err)
    }
}



//  CALL(NOOP)
// call application with arguments
export const generateBallots = async (senderAddress, senderAccount, appID, client) => {
    try {
        let noop = "generate_ballots"
        const appArgs = []
        appArgs.push(
            new Uint8Array(Buffer.from(noop)),
        )

        let params = await client.getTransactionParams().do()
        params.fee = 1000;
        params.flatFee = true;

        // create unsigned transaction
        let txn = algosdk.makeApplicationNoOpTxn(senderAddress, params, appID, appArgs)

        let txId = txn.txID().toString();
        // Sign the transaction
        let signedTxn = txn.signTxn(senderAccount.sk);
        console.log("Signed transaction with txID: %s", txId);

        // Submit the transaction
        await client.sendRawTransaction(signedTxn).do()
        // Wait for transaction to be confirmed
        const confirmedTxn = await algosdk.waitForConfirmation(client, txId, 4);
        //console.log("Confirmed " + confirmedTxn)

        //Get the completed Transaction
        console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

        // display results
        let transactionResponse = await client.pendingTransactionInformation(txId).do();
        console.log("Called app-id:", transactionResponse['txn']['txn']['apid'])
        if (transactionResponse['global-state-delta'] !== undefined) {
            console.log("Global State updated:", transactionResponse['global-state-delta']);
            const decoded_key = Buffer.from(transactionResponse['global-state-delta'][0]['key'], "base64").toString();
            console.log("key: "+decoded_key);
            console.log("uint: "+transactionResponse['global-state-delta'][0]['value']['uint']);
        }
        if (transactionResponse['local-state-delta'] !== undefined) {
            console.log("Local State updated:", transactionResponse['local-state-delta']);
        }
    } catch (err) {
        console.log(err)
    }
}
