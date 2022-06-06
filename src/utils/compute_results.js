import algosdk from 'algosdk';
import dotenv from 'dotenv';
import chalk from 'chalk';
import fetch from 'node-fetch';
import nacl from "tweetnacl";
const { box } = nacl;
import naclutils from 'tweetnacl-util';
const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } = naclutils;

import { getBallotID, getElectionAuthorityAddress, getTallyKey, decrypt} from './utils.js';


dotenv.config()



export const computeResults = async (appID, client) => {

    const votersAddress = []
    const tallyedResults = new Map()

    console.group(chalk.blueBright("GET SMART CONTRACT INFO (ANY USER)"))

    console.log("AppID = ", appID)

    // // Get EA Address
    // const eaaddr = await getElectionAuthorityAddress(appID, client)

    // Get ASA id
    const ballotid = await getBallotID(appID, client)

    // Get tally key
    const tallykey = await getTallyKey(appID, client)

   console.groupEnd(chalk.blueBright("GET SMART CONTRACT INFO (ANY USER)"))

    

    // Get the voters address from the ASA

    console.group(chalk.blueBright("GET VOTERS ADDRESS (ANY USER)"))

    const url = "https://algoindexer.testnet.algoexplorerapi.io/v2/assets/" + ballotid + "/balances";
    const options = {
        headers: {
            Authorization: "accept: application/json"
        }
    };
    let data = await fetch(url, options).then(res => res.json())

    data['balances'].forEach(entry => {

        if (entry['amount'] == 2) {
            votersAddress.push(entry['address'])
        }
    });

    // console.log("Voters address: ")
    console.log(votersAddress)

    console.groupEnd(chalk.blueBright("GET VOTERS ADDRESS (ANY USER)"))

    // Get the encrypted vote for each voter account, decrypt the vote and update the vote counter

    

    console.group(chalk.blueBright("TALLY VOTES (ANY USER)"))

    for(const voterAddr of votersAddress ){
        
        let encryptedVote = undefined
        let voterPublicKey = undefined
        let accountInfoResponse = await client.accountInformation(voterAddr).do();
        for (let i = 0; i < accountInfoResponse['apps-local-state'].length; i++) {

            if (accountInfoResponse['apps-local-state'][i].id == appID) {

                for (let n = 0; n < accountInfoResponse['apps-local-state'][i][`key-value`].length; n++) {
                    let localStateKey = accountInfoResponse['apps-local-state'][i][`key-value`][n]['key']
                    let decodedLocalStateKey = Buffer.from(localStateKey, "base64").toString();
                    if (decodedLocalStateKey == 'encrypted_vote') {
                        encryptedVote = Buffer.from(accountInfoResponse['apps-local-state'][i][`key-value`][n]['value']['bytes'], "base64").toString();
                        //encryptedVote = accountInfoResponse['apps-local-state'][i][`key-value`][n]['value']['bytes']

                    } else if (decodedLocalStateKey == 'public_key') {
                        //voterPublicKey = Buffer.from(accountInfoResponse['apps-local-state'][i][`key-value`][n]['value']['bytes'], "base64").toString();
                        voterPublicKey = accountInfoResponse['apps-local-state'][i][`key-value`][n]['value']['bytes']

                    }
                }
                break;
            }
        }


        // let result  = JSON.stringify({ "Voter address":voterAddr, "Encrypted vote":encryptedVote, "Voter public key":voterPublicKey }, null, 4);
        // console.log(result)

        // decrypt vote

        const uint8voterpubkey = decodeBase64(voterPublicKey)
        const uint8tallykey = decodeBase64(tallykey)

        const decryptionSharedKey = box.before(uint8voterpubkey, uint8tallykey)
        const decryptedVote = decrypt(decryptionSharedKey, encryptedVote)


        let found = false;
        for(const item of tallyedResults){
            
            if(item[0]['candidate_id'] == decryptedVote['candidate_id']){
                found = true;
                tallyedResults.set(item[0], item[1]+1)
                break;
            }
        }
        if(!found){
            tallyedResults.set(decryptedVote, 1)
        } 
    }

    console.log(tallyedResults)

    console.groupEnd(chalk.blueBright("TALLY VOTES (ANY USER)"))

}