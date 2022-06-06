import { debugSetup } from "../src/authority/setup_handler.js";
import { lunchClient, generateKeyPair, decrypt, encrypt, getElectionAuthorityAddress, getBallotID, registrationSuccessMail} from "../src/utils/utils.js";
import { acceptRegistration } from "../src/authority/accept_registration.js";
import { preRegistrationRequest, registrationRequest, voteRequest } from "../src/voter/voter_handler.js";
import nacl from "tweetnacl";
const { box } = nacl;
import naclutils from 'tweetnacl-util';
const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } = naclutils;
import algosdk from 'algosdk';
import dotenv from 'dotenv';
import chalk from 'chalk';
import chai from 'chai';
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { computeResults } from "../src/utils/compute_results.js";
chai.use(chaiAsPromised);
chai.should();

dotenv.config()


export const main = async () => {

    let client = await lunchClient();


    const appID = 92882946

    console.log("AppID = ", appID)

    await computeResults(appID, client)

}

//main()


registrationSuccessMail('electionauthoritytest+voter1@gmail.com')