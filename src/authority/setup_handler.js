import * as fs from 'fs';
import algosdk from 'algosdk';
import dotenv from 'dotenv';
import chalk from 'chalk';
import nacl from 'tweetnacl';
const { box, randomBytes } = nacl;
import naclutils from 'tweetnacl-util';
const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } = naclutils;

import { applicationAddress, lunchClient, sendAsset, foundSmartContract, generateKeyPair} from '../utils/utils.js';
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
export const debugSetup = async (electAuthAccount, client) => {

    console.group(chalk.bgGreenBright("VOTING SETUP"));
    //SMART CONTRACT DEPLOYMENT

    // declare application state storage (immutable)
    const localInts = 1; // registered status
    const localBytes = 2; // encrypted vote, voter generated public key
    const globalInts = 5; // regstart, regend, votestart, voteend, ballotid
    const globalBytes = 4; // EA address, voting key, creator, tally key (ea address = creator)

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


    // correct setup
    // let RegBegin = current_date;
    // let RegEnd = RegBegin + 86400;
    // let VoteBegin = RegEnd + 86400;
    // let VoteEnd = VoteBegin + 86400;

    // debug setup

    let RegBegin = current_date;
    let RegEnd = current_date + 86400;
    let VoteBegin = current_date;
    let VoteEnd = current_date + 86400;

    console.log(`Registration from: ${RegBegin} To: ${RegEnd}`)
    console.log(`Vote from: ${VoteBegin} To: ${VoteEnd}`)

    // Create voting keys
    const EAKeys = generateKeyPair()

    console.log(`Public vote key: ${encodeBase64(EAKeys.publicKey)}\nPrivate vote key: ${encodeBase64(EAKeys.secretKey)}`)
   

    // create list of bytes for app args
    let appArgs = [];

    appArgs.push(
        new Uint8Array(Buffer.from(algosdk.encodeUint64(RegBegin))),
        new Uint8Array(Buffer.from(algosdk.encodeUint64(RegEnd))),
        new Uint8Array(Buffer.from(algosdk.encodeUint64(VoteBegin))),
        new Uint8Array(Buffer.from(algosdk.encodeUint64(VoteEnd))),
        EAKeys.publicKey,
        new Uint8Array(Buffer.from(electAuthAccount.addr)),
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
    return {appID, ballotID, EAKeys}
}


export const setupElection = async(RegBegin, RegEnd, VoteBegin, VoteEnd, electAuthAccount, client)=>{

    //SMART CONTRACT DEPLOYMENT

    // declare application state storage (immutable)
    const localInts = 1; // registered status
    const localBytes = 2; // encrypted vote, voter generated public key
    const globalInts = 5; // regstart, regend, votestart, voteend, ballotid
    const globalBytes = 4; // EA address, voting key, creator, tally key (ea address = creator)

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

    console.log(`Registration from: ${RegBegin} To: ${RegEnd}`)
    console.log(`Vote from: ${VoteBegin} To: ${VoteEnd}`)

    // Create voting keys
    const EAKeys = generateKeyPair()

    console.log(`Public vote key: ${encodeBase64(EAKeys.publicKey)}\nPrivate vote key: ${encodeBase64(EAKeys.secretKey)}`)
   

    // create list of bytes for app args
    let appArgs = [];

    appArgs.push(
        new Uint8Array(Buffer.from(algosdk.encodeUint64(RegBegin))),
        new Uint8Array(Buffer.from(algosdk.encodeUint64(RegEnd))),
        new Uint8Array(Buffer.from(algosdk.encodeUint64(VoteBegin))),
        new Uint8Array(Buffer.from(algosdk.encodeUint64(VoteEnd))),
        EAKeys.publicKey,
        new Uint8Array(Buffer.from(electAuthAccount.addr)),
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


    return {appID, ballotID, EAKeys}
}