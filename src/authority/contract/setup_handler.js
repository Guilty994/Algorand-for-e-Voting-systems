import * as fs from 'fs';
import { readGlobalState } from './utils.js';
import { createApp} from './contract_deploy.js';
import { deleteApp } from './contract_delete.js';
import algosdk from 'algosdk';
import dotenv from 'dotenv';
import chalk from 'chalk';
dotenv.config()

//SMART CONTRACT DEPLOYMENT
// declare application state storage (immutable)
const localInts = 0;
const localBytes = 2; // local choice, local reg status
const globalInts = 25; //# 5 for setup + 20 for choices. Use a larger number for more choices.
const globalBytes = 1; // EA address, ballot generation status

// Candidate list

// get accounts from mnemonic
const electAuthAccount = algosdk.mnemonicToSecretKey(process.env.REGAUTHMNEMONIC);
const elecAuthAddress = electAuthAccount.addr;

// Client connection /w Purestake
const algodServer = process.env.BASESERVER;
const algodPort = process.env.PORT;
const algodToken = { "X-API-Key": process.env.XAPIKEY };

let client = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// Read Teal File
let approvalProgram = ''
let clear_state_program = ''


try {
    approvalProgram = fs.readFileSync('./src/authority/contract/artifacts/vote_approval.teal', 'utf8')
    clear_state_program = fs.readFileSync('./src/authority/contract/artifacts/vote_clear_state.teal', 'utf8')
} catch (err) {
    console.error(err)

}


// Compile Program
const compileProgram = async (client, programSource) => {
    let encoder = new TextEncoder();
    let programBytes = encoder.encode(programSource);
    let compileResponse = await client.compile(programBytes).do();
    let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
    // console.log(compileResponse)
    return compiledBytes;
}

const main = async () => {

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

    // create new application
    console.group(chalk.blue("CREATEAPP"))
    const appId = await createApp(elecAuthAddress, electAuthAccount, approval_program, clear_program, localInts, localBytes, globalInts, globalBytes, appArgs, client)
    console.groupEnd("CREATEAPP")

    const globalState = await readGlobalState(appId, client)
    console.group(chalk.blue("GLOBAL STATE"))

    // https://developer.algorand.org/docs/get-details/encoding/
    globalState.forEach(state => {

        console.log(state);
        const decoded_key = Buffer.from(state['key'], "base64").toString();
        console.log("Key: " + decoded_key);
        const decoded_uint = state['value']['uint'];
        console.log("Uint: " + decoded_uint);
    });
    console.groupEnd("GLOBAL STATE")


    //CREATOR
    console.group(chalk.blue("DELEATE APP"))
    await deleteApp(elecAuthAddress, electAuthAccount, appId, client);
    console.groupEnd("DELETE APP")

}
main()