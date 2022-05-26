/**
 * Unit tests for the voter
 */

import { debugSetup } from "../src/authority/setup_handler.js";
import { lunchClient } from "../src/utils/utils.js";
import { acceptRegistration } from "../src/authority/accept_registration.js";
import { preRegistrationRequest, registrationRequest, voteRequest } from "../src/voter/voter_handler.js";
import algosdk from 'algosdk';
import dotenv from 'dotenv';
import chalk from 'chalk';
import chai from 'chai';
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
chai.should();

dotenv.config()

export const main = async () => {

    const voterAccount = algosdk.mnemonicToSecretKey(process.env.VOTERMNEMONIC);

    const electAuthAccount = algosdk.mnemonicToSecretKey(process.env.ELECTAUTHMNEMONIC);

    // Lunch the voting project
    let returnedIDs = await debugSetup(electAuthAccount);

    let client = await lunchClient();

    console.group(chalk.bgGreenBright("REGISTRATION PROCESS"))
    await preRegistrationRequest(returnedIDs, voterAccount, client);
    await acceptRegistration(electAuthAccount, voterAccount.addr, returnedIDs.appID, returnedIDs.ballotID, client);
    await registrationRequest(voterAccount, returnedIDs.appID, returnedIDs.ballotID, client);
    console.groupEnd("REGISTRATION PROCESS")


    console.group(chalk.bgGreenBright("VOTING PROCESS"))
    await voteRequest(voterAccount, returnedIDs.appID, returnedIDs.ballotID, client);
    console.groupEnd("VOTING PROCESS")
}


main()

