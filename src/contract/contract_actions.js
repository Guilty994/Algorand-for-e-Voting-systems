/**
 * Contains function to invoke specific action for the smart contract.
 */
import algosdk from 'algosdk';
import { generateDebugLog } from '../utils/utils.js'

/**
 * Create a smart contract and deploy it on the Algorand network.
 * @param {Account of the creator of the smart contract} senderAccount 
 * @param {Compiled Teal approval program} approvalProgram 
 * @param {Compiled Teal clear program} clearProgram 
 * @param {Max number of local ints that the smart contract can store per account} localInts 
 * @param {Max number of local bytes that the smart contract can store per account} localBytes 
 * @param {Max number of gloal ints that the smart contract can store globally} globalInts 
 * @param {Max number of global bytes that the smart contract can store globally} globalBytes 
 * @param {Arguments needed by the smart contract during the initialization} app_args 
 * @param {Algorand client} client 
 * @returns Smart contract ID
 */
export const init = async (senderAccount,
    approvalProgram, clearProgram,
    localInts, localBytes, globalInts, globalBytes, app_args, client) => {

    try {
        const onComplete = algosdk.OnApplicationComplete.NoOpOC;

        const params = await client.getTransactionParams().do()
        params.fee = 1000;
        params.flatFee = true;

        let str_params = JSON.stringify(params, null, 4);
        console.log("Suggested params " + str_params);

        let txn = algosdk.makeApplicationCreateTxn(senderAccount.addr, params, onComplete,
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

        //console.log("Confirmed " + confirmedTxn.toString());

        //Get the completed Transaction
        console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
        // display results
        let transactionResponse = await client.pendingTransactionInformation(txId).do()
        let appId = transactionResponse['application-index'];
        console.log("Created new app-id: ", appId);
        return appId;
    } catch (err) {
        generateDebugLog('createApp', err)
    }
}

/**
 * Send a smart contract delete request. (In this smart contract sender must be equal to creator)
 * @param {*} senderAccount 
 * @param {*} index 
 * @param {*} client 
 */
export const deleteApplication = async (senderAccount, index, client) => {
    try {
        let params = await client.getTransactionParams().do()
        params.fee = 1000;
        params.flatFee = true;
        let txn = algosdk.makeApplicationDeleteTxn(senderAccount.addr, params, index);
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
        generateDebugLog("deleteApplication", err)
    }
}

export const updateApplication = async () => {

}

/**
 * Optin into the smart contract.
 * @param {*} senderAccount 
 * @param {*} AppId 
 * @param {*} client 
 */
export const optin = async (senderAccount, AppId, client) => {
    try {
        let params = await client.getTransactionParams().do()
        params.fee = 1000;
        params.flatFee = true;

        let txn = algosdk.makeApplicationOptInTxn(senderAccount.addr, params, AppId);
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
        let transactionResponse = await client.pendingTransactionInformation(txId).do();
        console.log("Opted-in to app-id:", transactionResponse['txn']['txn']['apid'])
    } catch (err) {
        generateDebugLog('optin', err);
    }
}

/**
 * Send a noop request to generate ballots.
 * @param {*} senderAccount 
 * @param {*} appID 
 * @param {*} client 
 */
export const generateBallots = async (senderAccount, appID, client) => {
    try {
        let ballotID;
        let noop = "generate_ballots"
        const appArgs = []
        appArgs.push(
            new Uint8Array(Buffer.from(noop)),
        )

        let params = await client.getTransactionParams().do()
        params.fee = 1000;
        params.flatFee = true;

        // create unsigned transaction
        let txn = algosdk.makeApplicationNoOpTxn(senderAccount.addr, params, appID, appArgs)

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
            console.log("key: " + decoded_key);
            console.log("uint: " + transactionResponse['global-state-delta'][0]['value']['uint']);
            ballotID = transactionResponse['global-state-delta'][0]['value']['uint'];
        }
        if (transactionResponse['local-state-delta'] !== undefined) {
            console.log("Local State updated:", transactionResponse['local-state-delta']);
        }

        return ballotID
    } catch (err) {
        generateDebugLog('generateBallots', err);
        throw new Error('generate ballots fail');
    }
}

/**
 * This allow the smart contract to optin into the BALLOT asset. (It is required for Algorand ASA policy)
 * @param {*} senderAccount 
 * @param {*} appID 
 * @param {*} assetID 
 * @param {*} client 
 */
export const smartContractOptinAsset = async (senderAccount, appID, assetID, client) => {
    try {
        let noop = "sc_optin_asset"

        const assets = []
        assets.push(
            assetID
        )
        const appArgs = []
        appArgs.push(
            new Uint8Array(Buffer.from(noop)),
        )

        let params = await client.getTransactionParams().do()
        params.fee = 1000;
        params.flatFee = true;

        // create unsigned transaction
        let txn = algosdk.makeApplicationNoOpTxn(senderAccount.addr, params, appID, appArgs, undefined, undefined, assets)

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
            console.log("key: " + decoded_key);
            console.log("uint: " + transactionResponse['global-state-delta'][0]['value']['uint']);
        }
        if (transactionResponse['local-state-delta'] !== undefined) {
            console.log("Local State updated:", transactionResponse['local-state-delta']);
        }

        console.log("AppId: " + appID + " opted-in asset: " + assetID)
    } catch (err) {
        generateDebugLog('smartContractOptinAsset', err);
        throw new Error('smartContractOptinAsset ballots fail');
    }
}

export const registration = async (senderAccount, appID, assetID, client) => {


    try {
        let noop = "registration"

        const assets = []
        assets.push(
            assetID
        )
        const appArgs = []
        appArgs.push(
            new Uint8Array(Buffer.from(noop)),
        )

        let params = await client.getTransactionParams().do()
        params.fee = 1000;
        params.flatFee = true;

        // create unsigned transaction
        let txn = algosdk.makeApplicationNoOpTxn(senderAccount.addr, params, appID, appArgs, undefined, undefined, assets)

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
            console.log("key: " + decoded_key);
            console.log("uint: " + transactionResponse['global-state-delta'][0]['value']['uint']);
        }
        if (transactionResponse['local-state-delta'] !== undefined) {
            let decoded_key = Buffer.from(transactionResponse['local-state-delta'][0]['delta'][0]['key'], "base64").toString();
            console.log("Local State updated:");
            console.log("key: " + decoded_key);
            console.log("uint: " + transactionResponse['local-state-delta'][0]['delta'][0]['value']['uint']);
        }
    } catch (err) {
        console.log(err);
        generateDebugLog('registration', err);
        throw new Error('registration fail');
    }

}

export const vote = async (senderAccount, EAAddress, appID, assetID, encryptedVote, generatedPublicKey, client) => {
    try {
        let noop = "vote"

        const assets = []
        assets.push(
            assetID
        )

        const appArgs = []
    
        appArgs.push(
            new Uint8Array(Buffer.from(noop)),
            new Uint8Array(Buffer.from(encryptedVote)),
            new Uint8Array(Buffer.from(generatedPublicKey)),
        )

        const accounts = []
        accounts.push(
            EAAddress,
        )

        let params = await client.getTransactionParams().do()
        params.fee = 1000;
        params.flatFee = true;

        // create unsigned transaction
        let txn = algosdk.makeApplicationNoOpTxn(senderAccount.addr, params, appID, appArgs, accounts, undefined, assets)

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
            console.log("key: " + decoded_key);
            console.log("uint: " + transactionResponse['global-state-delta'][0]['value']['uint']);
        }
        if (transactionResponse['local-state-delta'] !== undefined) {
            let decoded_key = Buffer.from(transactionResponse['local-state-delta'][0]['delta'][0]['key'], "base64").toString();
            console.log("Local State updated:");
            console.log("key: " + decoded_key);
            let encoded_vote = Buffer.from(transactionResponse['local-state-delta'][0]['delta'][0]['value']['bytes'], "base64").toString();
            console.log("bytes: " + encoded_vote);
        }
    } catch (err) {
        generateDebugLog('vote', err);
        throw new Error('vote fail');
    }



}

export const confirmIdentity = async (senderAccount, voterAccount, appID, assetID, client) => {
    try {
        let noop = "confirm_identity"

        const assets = []
        assets.push(
            assetID
        )
        const appArgs = []
        appArgs.push(
            new Uint8Array(Buffer.from(noop))
        )

        const accounts = []
        accounts.push(
            voterAccount
        )

        let params = await client.getTransactionParams().do()
        params.fee = 1000;
        params.flatFee = true;

        // create unsigned transaction
        let txn = algosdk.makeApplicationNoOpTxn(senderAccount.addr, params, appID, appArgs, accounts, undefined, assets)

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
            console.log("key: " + decoded_key);
            console.log("uint: " + transactionResponse['global-state-delta'][0]['value']['uint']);
        }
        if (transactionResponse['local-state-delta'] !== undefined) {
            let decoded_key = Buffer.from(transactionResponse['local-state-delta'][0]['delta'][0]['key'], "base64").toString();
            console.log("Local State updated:");
            console.log("key: " + decoded_key);
            console.log("uint: " + transactionResponse['local-state-delta'][0]['delta'][0]['value']['uint']);
        }
    } catch (err) {
        generateDebugLog('confirmIdentity', err);
        throw new Error('confirmIdentity fail');
    }
}


export const tally = async (senderAccount, appID, tallyKey, client) => {
    try {
        let noop = "tally"

        const appArgs = []
        appArgs.push(
            new Uint8Array(Buffer.from(noop)),
            new Uint8Array(Buffer.from(tallyKey))
        )


        let params = await client.getTransactionParams().do()
        params.fee = 1000;
        params.flatFee = true;

        // create unsigned transaction
        let txn = algosdk.makeApplicationNoOpTxn(senderAccount.addr, params, appID, appArgs, undefined, undefined, undefined)

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
            const decoded_key = Buffer.from(transactionResponse['global-state-delta'][0]['key'], "base64").toString();
            const tallyKey = transactionResponse['global-state-delta'][0]['value']['bytes'];        
            console.log("Tally key: " + tallyKey);
        }
        if (transactionResponse['local-state-delta'] !== undefined) {
            let decoded_key = Buffer.from(transactionResponse['local-state-delta'][0]['delta'][0]['key'], "base64").toString();
            console.log("Local State updated:");
            console.log("key: " + decoded_key);
            console.log("uint: " + transactionResponse['local-state-delta'][0]['delta'][0]['value']['uint']);
        }
    } catch (err) {
        generateDebugLog('tally', err);
        throw new Error('tally fail');
    }
}



