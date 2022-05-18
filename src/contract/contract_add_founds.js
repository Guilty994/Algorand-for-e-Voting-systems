import algosdk from "algosdk";
import { generateDebugLog } from "../utils/utils.js";

/**
 * Add algo to the smart contract.
 * @param {*} senderAccount 
 * @param {*} smartContractAddress 
 * @param {*} client 
 */
export const foundSmartContract = async (senderAccount, smartContractAddress, client) => {
    try {

        // Construct the transaction
        let params = await client.getTransactionParams().do();
        // comment out the next two lines to use suggested fee
        params.fee = algosdk.ALGORAND_MIN_TX_FEE;
        params.flatFee = true;

        const enc = new TextEncoder();
        const note = enc.encode("fouding smart contract");
        let amount = 1000000; // equals 1 ALGO

        let txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: senderAccount.addr,
            to: smartContractAddress,
            amount: amount,
            note: note,
            suggestedParams: params
        });

        // Sign the transaction
        let signedTxn = txn.signTxn(senderAccount.sk);
        let txId = txn.txID().toString();
        console.log("Signed transaction with txID: %s", txId);

        // Submit the transaction
        await client.sendRawTransaction(signedTxn).do();

        // Wait for confirmation
        let confirmedTxn = await algosdk.waitForConfirmation(client, txId, 4);
        //Get the completed Transaction
        console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
        // let mytxinfo = JSON.stringify(confirmedTxn.txn.txn, undefined, 2);
        // console.log("Transaction information: %o", mytxinfo);
        let string = new TextDecoder().decode(confirmedTxn.txn.txn.note);
        console.log("Note field: ", string);
        let senderAccountInfo = await client.accountInformation(senderAccount.addr).do();
        let smartContractAccountInfo = await client.accountInformation(smartContractAddress).do();
        console.log("Transaction Amount: %d microAlgos", confirmedTxn.txn.txn.amt);
        console.log("Transaction Fee: %d microAlgos", confirmedTxn.txn.txn.fee);
        console.log("Sender account balance: %d microAlgos", senderAccountInfo.amount);
        console.log("Smart contract account balance: %d microAlgos", smartContractAccountInfo.amount);

    } catch (err) {
        generateDebugLog("foundSmartContract", err);
    }
}