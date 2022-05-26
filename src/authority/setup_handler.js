import * as fs from 'fs';
import algosdk from 'algosdk';
import dotenv from 'dotenv';
import chalk from 'chalk';

import { applicationAddress, lunchClient, sendAsset, foundSmartContract} from '../utils/utils.js';
import {init, generateBallots, smartContractOptinAsset} from '../contract/contract_actions.js' 

dotenv.config()

/**
 * 
 * @param {*} client 
 * @param {*} programSource 
 * @returns 
 */
const compileProgram = async (client, programSource) => {
    let encoder = new TextEncoder();
    let programBytes = encoder.encode(programSource);
    let compileResponse = await client.compile(programBytes).do();
    let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
    // console.log(compileResponse)
    return compiledBytes;
}

/**
 * 
 * @param {*} electAuthAccount
 * @returns 
 */
export const debugSetup = async (electAuthAccount) => {//TODO: Modularizzare sta roba e portarla nei file di test

    console.group(chalk.bgGreenBright("VOTING SETUP"));
    let client = await lunchClient();
    //SMART CONTRACT DEPLOYMENT

    // declare application state storage (immutable)
    const localInts = 1;
    const localBytes = 1; // vote, registered status
    const globalInts = 25; // 5 for setup + 20 for result publication.
    const globalBytes = 1; // EA address, 

    // Read Teal File
    let approvalProgram = ''
    let clear_state_program = ''

    try {
        approvalProgram = fs.readFileSync('./src/contract/artifacts/vote_approval.teal', 'utf8')
        clear_state_program = fs.readFileSync('./src/contract/artifacts/vote_clear_state.teal', 'utf8')
    } catch (err) {
        console.error(err)

    }

    const approval_program = await compileProgram(client, approvalProgram)
    const clear_program = await compileProgram(client, clear_state_program)

    // configure registration and voting period
    // 86400 = 1 day
    let current_date = Math.round((new Date()).getTime() / 1000);

    let RegBegin = current_date;
    let RegEnd = RegBegin + 86400;
    let VoteBegin = RegEnd + 86400;
    let VoteEnd = VoteBegin + 86400;

    console.log(`Registration from: ${RegBegin} To: ${RegEnd}`)
    console.log(`Vote from: ${VoteBegin} To: ${VoteEnd}`)

    // create list of bytes for app args
    let appArgs = [];

    appArgs.push(
        new Uint8Array(Buffer.from(algosdk.encodeUint64(RegBegin))),
        new Uint8Array(Buffer.from(algosdk.encodeUint64(RegEnd))),
        new Uint8Array(Buffer.from(algosdk.encodeUint64(VoteBegin))),
        new Uint8Array(Buffer.from(algosdk.encodeUint64(VoteEnd))),
    )

    // Create new application
    console.group(chalk.blue("INIT SMART CONTRACT (EA->SC)"))
    //const appId = await createApp(electAuthAccount, approval_program, clear_program, localInts, localBytes, globalInts, globalBytes, appArgs, client)
    let appID = await init(electAuthAccount, approval_program, clear_program, localInts, localBytes, globalInts, globalBytes, appArgs, client)
    console.groupEnd("INIT SMART CONTRACT (EA->SC)")

    // Found the smart contract
    console.group(chalk.blue("ADD FOUND TO SMART CONTRACT (EA->SC)"))
    let appaddr = applicationAddress(appID, client);
    await foundSmartContract(electAuthAccount, appaddr, client);
    console.groupEnd("ADD FOUND TO SMART CONTRACT (EA->SC)")

    // Generate ballots
    console.group(chalk.blue("GENERATE BALLOTS (EA->SC)"))
    let ballotID = await generateBallots(electAuthAccount, appID, client);
    console.groupEnd("GENERATE BALLOTS (EA->SC)")


    // Optin into ballots
    console.group(chalk.blue("OPTIN ASSET \"BALLOTS\" (EA->SC)"))
    await smartContractOptinAsset(electAuthAccount, appID, ballotID, client)
    console.groupEnd("OPTIN ASSET \"BALLOTS\" (EA->SC)")
    console.group(chalk.blue("OPTIN ASSET \"BALLOTS\" (EA->ALGORAND)"))
    await sendAsset(electAuthAccount, electAuthAccount, ballotID, 0, client)
    console.groupEnd("OPTIN ASSET \"BALLOTS\" (EA->ALGORAND)")


    console.groupEnd("VOTING SETUP");
    return {appID, ballotID}
}
