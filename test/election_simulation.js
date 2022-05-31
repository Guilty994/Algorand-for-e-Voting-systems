/**
 * Tests for voting process simulation
 */

import { debugSetup } from "../src/authority/setup_handler.js";
import { lunchClient } from "../src/utils/utils.js";
import { acceptRegistration } from "../src/authority/accept_registration.js";
import { preRegistrationRequest, registrationRequest, voteRequest } from "../src/voter/voter_handler.js";
import algosdk from 'algosdk';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { enableTally } from "../src/authority/enable_tally.js";
import { computeResults } from "../src/utils/compute_results.js";

dotenv.config()

export const main = async () => {

    let client = await lunchClient();

   
    // Lunch the voting project
    const electAuthAccount = algosdk.mnemonicToSecretKey(process.env.ELECTAUTHMNEMONIC);
    const returnedIDs = await debugSetup(electAuthAccount, client);
   
    // Simulate pre-registration
    const voterAccount1 = algosdk.mnemonicToSecretKey(process.env.VOTERMNEMONIC);
    const voterAccount2 = algosdk.mnemonicToSecretKey(process.env.VOTERMNEMONIC2);
    const voterAccount3 = algosdk.mnemonicToSecretKey(process.env.VOTERMNEMONIC3);

    console.group(chalk.bgGreenBright("PRE-REGISTRATION"))
    console.group(chalk.bgCyanBright("VOTER 1"))
    await preRegistrationRequest(returnedIDs, voterAccount1, client);
    console.groupEnd("VOTER 1")
    console.group(chalk.bgCyanBright("VOTER 2"))
    await preRegistrationRequest(returnedIDs, voterAccount2, client);
    console.groupEnd("VOTER 2")
    console.group(chalk.bgCyanBright("VOTER 3"))
    await preRegistrationRequest(returnedIDs, voterAccount3, client);
    console.groupEnd("VOTER 3")
    console.groupEnd("PRE-REGISTRATION")

    // Simulate confirm identity
    console.group(chalk.bgGreenBright("IDENTITY CONFIRMATION"))
    console.group(chalk.bgCyanBright("VOTER 1"))
    await acceptRegistration(electAuthAccount, voterAccount1.addr, returnedIDs.appID, returnedIDs.ballotID, client);
    console.groupEnd("VOTER 1")
    console.group(chalk.bgCyanBright("VOTER 2"))
    await acceptRegistration(electAuthAccount, voterAccount2.addr, returnedIDs.appID, returnedIDs.ballotID, client);
    console.groupEnd("VOTER 2")
    console.group(chalk.bgCyanBright("VOTER 3"))
    await acceptRegistration(electAuthAccount, voterAccount3.addr, returnedIDs.appID, returnedIDs.ballotID, client);
    console.groupEnd("VOTER 3")
    console.groupEnd("IDENTITY CONFIRMATION")

    // Simulate registration
    console.group(chalk.bgGreenBright("REGISTRATION"))
    console.group(chalk.bgCyanBright("VOTER 1"))
    await registrationRequest(voterAccount1, returnedIDs.appID, returnedIDs.ballotID, client);
    console.groupEnd("VOTER 1")
    console.group(chalk.bgCyanBright("VOTER 2"))
    await registrationRequest(voterAccount2, returnedIDs.appID, returnedIDs.ballotID, client);
    console.groupEnd("VOTER 2")
    console.group(chalk.bgCyanBright("VOTER 3"))
    await registrationRequest(voterAccount3, returnedIDs.appID, returnedIDs.ballotID, client);
    console.groupEnd("VOTER 3")
    console.groupEnd("REGISTRATION")


    // Simulate voters vote
    console.group(chalk.bgGreenBright("VOTING"))
    console.group(chalk.bgCyanBright("VOTER 1"))
    const choiceVoter1 = {candidate_id: '420'}
    console.log("Plain text vote: ", choiceVoter1)
    await voteRequest(voterAccount1, returnedIDs.appID, returnedIDs.ballotID, choiceVoter1, client);
    console.groupEnd("VOTER 1")
    console.group(chalk.bgCyanBright("VOTER 2"))
    const choiceVoter2 = {candidate_id: '99999'}
    console.log("Plain text vote: ", choiceVoter2)
    await voteRequest(voterAccount2, returnedIDs.appID, returnedIDs.ballotID, choiceVoter2, client);
    console.groupEnd("VOTING PROCESS VOTER 2")
    console.groupEnd("VOTER 2")
    console.group(chalk.bgCyanBright("VOTER 3"))
    const choiceVoter3 = {candidate_id: '420'}
    console.log("Plain text vote: ", choiceVoter3)
    await voteRequest(voterAccount3, returnedIDs.appID, returnedIDs.ballotID, choiceVoter3, client);
    console.groupEnd("VOTER 3")
    console.groupEnd("VOTING")


    // Simulate start tally
    console.group(chalk.bgGreenBright("TALLY SETUP"))
    await enableTally(electAuthAccount, returnedIDs.appID, returnedIDs.EAKeys.secretKey, client)
    console.groupEnd("TALLY SETUP")


    // Autotally
    console.group(chalk.bgGreenBright("RESULT COMPUTING"))
    await computeResults(returnedIDs.appID, client)
    console.groupEnd("RESULT COMPUTING")
}

main()