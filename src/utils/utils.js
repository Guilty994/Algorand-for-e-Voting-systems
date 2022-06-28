/**
 * Utils functions
 */
// https://developer.algorand.org/docs/get-details/encoding/

import algosdk from "algosdk";
import nodemailer from "nodemailer"
import fs from 'fs';
import chalk from "chalk";
import nacl from 'tweetnacl';
const { box, randomBytes } = nacl;
import naclutils from 'tweetnacl-util';
const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } = naclutils;

/**
 * Read the provided @account local state of the @index smart contract.
 * @param {*} index 
 * @param {*} account 
 * @param {*} client 
 * @returns 
 */
export const readLocalState = async (index, account, client) => {
    try {
        let accountInfoResponse = await client.accountInformation(account.addr).do();
        let localState = accountInfoResponse['apps-local-state']
        return localState.map((item) => {
            if (item['id'] == index) {
                console.log("User's local state:" + item.id);
                let localStateItem = accountInfoResponse['apps-local-state'][item]['key-value']
                localStateItem.map((local) => {
                    console.log(local)
                    return local
                })
            }
            return item
        })
    } catch (err) {
        console.log(err)
    }
}


/**
 * Read the @index smart contract global state.
 * @param {*} index 
 * @param {*} client 
 */
export const readGlobalState = async (index, client) => {
    try {
        let applicationInfoResponse = await client.getApplicationByID(index).do();
        let globalState = applicationInfoResponse['params']['global-state']
        globalState.map((state) => {
            console.log(state);
            const decoded_key = Buffer.from(state['key'], "base64").toString();
            console.log("Key: " + decoded_key);
            const decoded_uint = state['value']['uint'];
            console.log("Uint: " + decoded_uint);

        })
    } catch (err) {
        console.log(err)
    }
}

/**
 * Return the smart contract address for the provided @appID
 * @param {*} appID 
 * @returns Smart contract address
 */
export function applicationAddress(appID) {
    try {
        let value = algosdk.getApplicationAddress(appID);

        return value;

    } catch (err) {
        console.log(err)
    }
}



/**
 * Setup a client connect /w Purestake
 * @returns The client object
 */
export const lunchClient = async () => {

    const algodServer = process.env.BASESERVER;
    const algodPort = process.env.PORT;
    const algodToken = { "X-API-Key": process.env.XAPIKEY };

    let client = new algosdk.Algodv2(algodToken, algodServer, algodPort);


    return client
}

/**
 * Utils function to generate detailed debug report
 * @param {*} functionName 
 * @param {*} err 
 */
export const generateDebugLog = (functionName, err) => {
    try {
        let ts = Date.now();
        console.log(chalk.bgRedBright((functionName + " failed, detailed report can be found in debug/") + ts + ".txt"))
        fs.writeFileSync('./debug/' + ts + '.txt', err.toString());
    } catch (err1) {
        console.error(err1);
    }
}


// Function used to print asset holding for account and assetid
const printAssetHolding = async function (client, account, assetid) {
    let accountInfo = await client.accountInformation(account).do();
    for (let idx = 0; idx < accountInfo['assets'].length; idx++) {
        let scrutinizedAsset = accountInfo['assets'][idx];
        if (scrutinizedAsset['asset-id'] == assetid) {
            let myassetholding = JSON.stringify(scrutinizedAsset, undefined, 2);
            console.log("assetholdinginfo = " + myassetholding);
            break;
        }
    }
};


export const sendAsset = async (senderAccount, receiverAccount, assetID, amount, client) => {

    try {

        let params = await client.getTransactionParams().do();
        //comment out the next two lines to use suggested fee
        params.fee = 1000;
        params.flatFee = true;

        let sender = senderAccount.addr;
        let recipient = receiverAccount.addr;
        let revocationTarget = undefined;
        let closeRemainderTo = undefined;
        let note = undefined;

        // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
        let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
            sender,
            recipient,
            closeRemainderTo,
            revocationTarget,
            amount,
            note,
            assetID,
            params);
        // Must be signed by the account sending the asset  
        let rawSignedTxn = xtxn.signTxn(senderAccount.sk)
        let xtx = (await client.sendRawTransaction(rawSignedTxn).do());

        // Wait for confirmation
        let confirmedTxn = await algosdk.waitForConfirmation(client, xtx.txId, 4);
        //Get the completed Transaction
        console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

        console.log("Account = " + receiverAccount.addr);
        await printAssetHolding(client, receiverAccount.addr, assetID);

    } catch (err) {
        generateDebugLog("sendAsset", err);
        throw new Error('sendAsset fail');
    }


}


export const clawBackAsset = async (clawBackAccount, senderAddress, receiverAddress, assetID, amount, client) => {

    try {

        let params = await client.getTransactionParams().do();
        //comment out the next two lines to use suggested fee
        params.fee = 1000;
        params.flatFee = true;


        let revocationTarget = senderAddress;
        let closeRemainderTo = undefined;
        let note = undefined;

        // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
        let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
            clawBackAccount.addr,
            receiverAddress,
            closeRemainderTo,
            revocationTarget,
            amount,
            note,
            assetID,
            params);
        // Must be signed by the account sending the asset  
        let rawSignedTxn = xtxn.signTxn(clawBackAccount.sk)
        let xtx = (await client.sendRawTransaction(rawSignedTxn).do());

        // Wait for confirmation
        let confirmedTxn = await algosdk.waitForConfirmation(client, xtx.txId, 4);
        //Get the completed Transaction
        console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

        console.log("Account = " + receiverAddress);
        await printAssetHolding(client, receiverAddress, assetID);

    } catch (err) {
        generateDebugLog("clawbackAsset", err);
        throw new Error('clawbackAsset fail');
    }


}

// export const getSmartContractAddress = async (appID) => {

//     return algosdk.getApplicationAddress(appID)
// }


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
        throw new Error('found smart contract fail');
    }
}



const newNonce = () => randomBytes(box.nonceLength);

export const generateKeyPair = () => box.keyPair();

export const encrypt = (secretOrSharedKey, json, key) => {
    const nonce = newNonce();
    const messageUint8 = decodeUTF8(JSON.stringify(json));
    const encrypted = key
        ? box(messageUint8, nonce, key, secretOrSharedKey)
        : box.after(messageUint8, nonce, secretOrSharedKey);

    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);

    const base64FullMessage = encodeBase64(fullMessage);
    return base64FullMessage;
};

export const decrypt = (secretOrSharedKey, messageWithNonce, key) => {
    const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
    const nonce = messageWithNonceAsUint8Array.slice(0, box.nonceLength);
    const message = messageWithNonceAsUint8Array.slice(
        box.nonceLength,
        messageWithNonce.length
    );

    const decrypted = key
        ? box.open(message, nonce, key, secretOrSharedKey)
        : box.open.after(message, nonce, secretOrSharedKey);

    if (!decrypted) {
        throw new Error('Could not decrypt message');
    }

    const base64DecryptedMessage = encodeUTF8(decrypted);
    return JSON.parse(base64DecryptedMessage);
};



export const getVotingKey = async (index, client) => {
    try {
        let votingKey = undefined
        let applicationInfoResponse = await client.getApplicationByID(index).do();
        let globalState = applicationInfoResponse['params']['global-state']
        globalState.map((state) => {
            const decoded_key = Buffer.from(state['key'], "base64").toString();
            if (decoded_key == 'VotingKey') {
                votingKey = state['value']['bytes'];
                console.log("VotingKey: " + votingKey);
            }
        })

        return votingKey;
    } catch (err) {
        console.log(err)
    }
}

export const getElectionAuthorityAddress = async (index, client) => {

    try {
        let eaaddr = undefined
        let applicationInfoResponse = await client.getApplicationByID(index).do();
        let globalState = applicationInfoResponse['params']['global-state']
        globalState.map((state) => {
            const decoded_key = Buffer.from(state['key'], "base64").toString();
            if (decoded_key == 'ElectionAuthority') {
                eaaddr = Buffer.from(state['value']['bytes'], "base64").toString();
            }
        })

        console.log("ElectionAuthority = ", eaaddr)
        return eaaddr;
    } catch (err) {
        console.log(err)
    }
}

export const getBallotID = async (index, client) => {

    try {
        let ballotID = undefined
        let applicationInfoResponse = await client.getApplicationByID(index).do();
        let globalState = applicationInfoResponse['params']['global-state']
        globalState.map((state) => {
            const decoded_key = Buffer.from(state['key'], "base64").toString();
            if (decoded_key == 'BallotID') {
                ballotID = state['value']['uint'];
            }
        })

        console.log("BallotID = ", ballotID)
        return ballotID;
    } catch (err) {
        console.log(err)
    }
}

export const getTallyKey = async (index, client) => {

    try {
        let tallykey = undefined
        let applicationInfoResponse = await client.getApplicationByID(index).do();
        let globalState = applicationInfoResponse['params']['global-state']
        globalState.map((state) => {
            const decoded_key = Buffer.from(state['key'], "base64").toString();
            if (decoded_key == 'TallyKey') {
                tallykey = state['value']['bytes']
            }
        })

        console.log("TallyKey = ", tallykey)
        return tallykey;
    } catch (err) {
        console.log(err)
    }
}

export const registrationSuccessMail = async (voterMail, appID) => {

    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EAMAIL,
                pass: 'smxunocriyezvjes'
            }
        });

        let mailOptions = {
            from: process.env.EAMAIL,
            to: voterMail,
            subject: 'Identity verification report',
            text: 'Your identity was confirmed. Please continue the registration process. Election ID: '+appID,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                resolve(false); // or use rejcet(false) but then you will have to handle errors
            }
            else {
                console.log('Email sent to ' + voterMail);
                resolve(true);
            }
        });
    })


    // var transporter = nodemailer.createTransport({
    //     service: 'gmail',
    //     auth: {
    //         user: process.env.EAMAIL,
    //         pass: 'smxunocriyezvjes'
    //     }
    // });

    // var mailOptions = {
    //     from: process.env.EAMAIL,
    //     to: voterMail,
    //     subject: 'Identity verification report',
    //     text: 'Your identity was confirmed, continue the registration process'
    // };

    // transporter.sendMail(mailOptions, function (error, info) {
    //     if (error) {
    //         console.log(error);
    //     } else {
    //         //console.log('Email sent: ' + info.response);
    //         console.log('Identity confirmation success report sent to ' + voterMail)
    //     }
    // });

}


export const sendIdentityInformation = async (eamail, votermail, appID, algorandAddress, payload) => {

    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EAMAIL,
                pass: 'smxunocriyezvjes'
            }
        });

        let mailOptions = {
            from: votermail,
            to: eamail,
            subject: 'Identity information',
            text: 'Election ID: '+appID+'\nAlgorandAddress: '+algorandAddress+'\nOTP: '+payload,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                resolve(false); // or use rejcet(false) but then you will have to handle errors
            }
            else {
                console.log('Email sent to ' + eamail);
                resolve(true);
            }
        });
    })

}