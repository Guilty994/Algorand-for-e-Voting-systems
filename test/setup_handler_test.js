import { setup } from "../src/authority/setup_handler.js";
import { deleteApp } from "../src/authority/contract/contract_delete.js";
import { lunchClient, readGlobalState } from "../src/authority/utils.js";
import { optin, generateBallots } from "../src/authority/ballot_handler.js";
import algosdk from 'algosdk';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { assert } from 'chai';
dotenv.config()

export const correctSetup = async () => {
    failed = true;
    // Voting project start
    console.group(chalk.bgYellowBright("VOTING SETUP"))
    const electAuthAccount = algosdk.mnemonicToSecretKey(process.env.ELECTAUTHMNEMONIC);
    const elecAuthAddress = electAuthAccount.addr;
    let appID = await setup(electAuthAccount, elecAuthAddress);
    console.groupEnd("VOTING SETUP")

    let client = await lunchClient();

    console.group(chalk.bgYellowBright("APP GLOBAL STATE"))
    await readGlobalState(appID, client);
    console.groupEnd("APP GLOBAL STATE")

    console.group(chalk.bgYellowBright("DELEATE APP"))
    await deleteApp(elecAuthAddress, electAuthAccount, appID, client);
    console.groupEnd("DELETE APP")

    return true;
}

export const illegalBallotGenerationCall = async () => {
    // Voting project start
    console.group(chalk.bgYellowBright("VOTING SETUP"))
    let electAuthAccount = algosdk.mnemonicToSecretKey(process.env.ELECTAUTHMNEMONIC);
    let elecAuthAddress = electAuthAccount.addr;
    let appID = await setup(electAuthAccount, elecAuthAddress);
    console.groupEnd("VOTING SETUP")

    
    console.group(chalk.bgRedBright("ILLEGAL STUFF"))
    let client = await lunchClient();
    let anotherUserAccount = algosdk.mnemonicToSecretKey(process.env.VOTERMNEMONIC);
    let anotherUserAddress = anotherUserAccount.addr;
    await optin(anotherUserAddress, anotherUserAccount, appID, client);
    await generateBallots(anotherUserAddress, anotherUserAccount, appID, client);
    console.groupEnd("ILLEGAL STUFF")

    return true;
}


// describe('Correct setup', function () {

//     this.timeout(9999999);
//     it('Should return true and no error', async function () {

//         const res = await correctSetup();
//         return assert.equal(res, true);

//     });

// });

describe('Illegal ballot generation', function () {

    this.timeout(9999999);
    it('Should fail', async function () {

        try{
            await illegalBallotGenerationCall();
            
        }catch(err){
            console.log("DIOCANE")
        }
        

    });

});
