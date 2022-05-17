//READ STATE

// https://developer.algorand.org/docs/get-details/encoding/

import algosdk from "algosdk";

// read local state of application from user account
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


// read global state of application
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

export function applicationAddress(appID) {
    try {
        let value = algosdk.getApplicationAddress(appID);

        return value;

    } catch (err) {
        console.log(err)
    }
}


// Client connection /w Purestake
export const lunchClient = async () => {

    const algodServer = process.env.BASESERVER;
    const algodPort = process.env.PORT;
    const algodToken = { "X-API-Key": process.env.XAPIKEY };

    let client = new algosdk.Algodv2(algodToken, algodServer, algodPort);


    return client
}
