/**
 * Unit tests for the authority
 */

import { debugSetup } from "../src/authority/setup_handler.js";
import { deleteApplication, optin, generateBallots, smartContractOptinAsset } from "../src/contract/contract_actions.js";
import { lunchClient, readGlobalState } from "../src/utils/utils.js";
import algosdk from 'algosdk';
import dotenv from 'dotenv';
import chalk from 'chalk';
import chai from 'chai';
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
chai.should();

dotenv.config()


describe('Correct setup', function () {

    this.timeout(9999999);
    it('Nothing should fail', async function () {

        // Voting project start
        console.group(chalk.bgGreenBright("VOTING SETUP"))
        const electAuthAccount = algosdk.mnemonicToSecretKey(process.env.ELECTAUTHMNEMONIC);
        let returnedIDs = await debugSetup(electAuthAccount);
        console.groupEnd("VOTING SETUP")

        let client = await lunchClient();

        console.group(chalk.bgGreenBright("APP GLOBAL STATE"))
        await readGlobalState(returnedIDs.appID, client);
        console.groupEnd("APP GLOBAL STATE")

        console.group(chalk.bgGreenBright("DELEATE APP"))
        await deleteApplication(electAuthAccount,returnedIDs.appID, client);
        console.groupEnd("DELETE APP")

    });

});

xdescribe('Illegal ballot generation', function () {

    this.timeout(9999999);

    it('generateBallots should fail', async function () {
        // Voting project start
        console.group(chalk.bgGreenBright("VOTING SETUP"))
        let electAuthAccount = algosdk.mnemonicToSecretKey(process.env.ELECTAUTHMNEMONIC);
        let returnedIds = await expect(debugSetup(electAuthAccount)).to.not.be.rejected;
        expect(returnedIds.appID).to.be.a('number');
        expect(returnedIds.ballotID).to.be.a('number');
        console.groupEnd("VOTING SETUP")

        console.group(chalk.bgYellowBright("ILLEGAL BALLOTS GENERATION"))
        let client = await lunchClient();

        // Double creation by EA
        await expect(generateBallots(electAuthAccount, returnedIds.appID, client)).to.eventually.be.rejectedWith('generate ballots fail').and.be.an.instanceOf(Error);

        // Double creation from another user
        let anotherUserAccount = algosdk.mnemonicToSecretKey(process.env.VOTERMNEMONIC);
        await expect(generateBallots(anotherUserAccount, returnedIds.appID, client)).to.eventually.be.rejectedWith('generate ballots fail').and.be.an.instanceOf(Error);
        
        console.groupEnd("ILLEGAL BALLOT GENERATION")

        console.group(chalk.bgGreenBright("DELEATE APP"))
        await expect(deleteApplication(electAuthAccount, returnedIds.appID, client)).to.not.be.rejected;
        console.groupEnd("DELETE APP")
    });

});


