/**
 * Utils functions
 */
// https://developer.algorand.org/docs/get-details/encoding/

import algosdk from "algosdk";
import fs from 'fs';
import chalk from "chalk";

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
export const generateDebugLog = (functionName, err) =>{
    try {
        let ts = Date.now();
        console.log(chalk.bgRedBright((functionName+" failed, detailed report can be found in debug/") +ts+ ".txt"))
        fs.writeFileSync('./debug/'+ts+'.txt', err.toString());
    } catch (err1) {
        console.error(err1);
    }
}
