import * as fs from 'fs';
import algosdk from 'algosdk';
import dotenv from 'dotenv';
import chalk from 'chalk';

import { applicationAddress, lunchClient } from '../utils/utils.js';
import { foundSmartContract } from '../contract/contract_add_founds.js'
import {init, optin, generateBallots} from '../contract/contract_actions.js' 

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
 * @param {*} elecAuthAddress 
 * @returns 
 */
export const setup = async (electAuthAccount, elecAuthAddress) => {

    let client = await lunchClient();
    //SMART CONTRACT DEPLOYMENT

    // declare application state storage (immutable)
    const localInts = 0;
    const localBytes = 2; // local choice, local reg status
    const globalInts = 25; //# 5 for setup + 20 for choices. Use a larger number for more choices.
    const globalBytes = 1; // EA address, ballot generation status

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

    console.log(`Registration from: ${RegBegin} to ${RegEnd}`)
    console.log(`Vote from: ${VoteBegin} to ${VoteEnd}`)

    // create list of bytes for app args
    let appArgs = [];

    appArgs.push(
        new Uint8Array(Buffer.from(algosdk.encodeUint64(RegBegin))),
        new Uint8Array(Buffer.from(algosdk.encodeUint64(RegEnd))),
        new Uint8Array(Buffer.from(algosdk.encodeUint64(VoteBegin))),
        new Uint8Array(Buffer.from(algosdk.encodeUint64(VoteEnd))),
    )

    // Create new application
    console.group(chalk.blue("CREATEAPP (createApp)"))
    //const appId = await createApp(electAuthAccount, approval_program, clear_program, localInts, localBytes, globalInts, globalBytes, appArgs, client)
    const appId = await init(electAuthAccount, approval_program, clear_program, localInts, localBytes, globalInts, globalBytes, appArgs, client)
    console.groupEnd("CREATEAPP (createApp)")

    // Found the smart contract
    console.group(chalk.blue("ADD FOUND TO SMART CONTRACT (foundSmartContract)"))
    let appaddr = applicationAddress(appId, client);
    await foundSmartContract(electAuthAccount, appaddr, client);
    console.groupEnd("ADD FOUND TO SMART CONTRACT (foundSmartContract)")

    // Generate ballots
    console.group(chalk.blue("GENERATE BALLOTS (generateBallots)"))
    await generateBallots(electAuthAccount, appId, client);
    console.groupEnd("GENERATE BALLOTS (optin, generateBallots)")

    return appId
}
