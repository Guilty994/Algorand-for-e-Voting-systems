/**
 * Unit tests for the voter
 */

import { debugSetup } from "../src/authority/setup_handler.js";
import { lunchClient, generateKeyPair, decrypt, encrypt, getElectionAuthorityAddress} from "../src/utils/utils.js";
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
chai.use(chaiAsPromised);
chai.should();

dotenv.config()

export const voterSetup = async () => {

    let client = await lunchClient();

    const voterAccount = algosdk.mnemonicToSecretKey(process.env.VOTERMNEMONIC);

    const electAuthAccount = algosdk.mnemonicToSecretKey(process.env.ELECTAUTHMNEMONIC);

    // Lunch the voting project
    let returnedIDs = await debugSetup(electAuthAccount, client);



    console.group(chalk.bgGreenBright("REGISTRATION PROCESS"))
    await preRegistrationRequest(returnedIDs, voterAccount, client);
    await acceptRegistration(electAuthAccount, voterAccount.addr, returnedIDs.appID, returnedIDs.ballotID, client);
    await registrationRequest(voterAccount, returnedIDs.appID, returnedIDs.ballotID, client);
    console.groupEnd("REGISTRATION PROCESS")


    console.group(chalk.bgGreenBright("VOTING PROCESS"))
    const choice = {candidate_id: '123'}
    console.log("Plain text vote: ", choice)
    const returnVoterRequest = await voteRequest(voterAccount, returnedIDs.appID, returnedIDs.ballotID, choice, client);
    console.groupEnd("VOTING PROCESS")



    

    // // sanity check
    // const decryptionSharedKey = box.before(returnVoterRequest.voterGeneratedKeys.publicKey, returnedIDs.EAKeys.secretKey)

    // const decryptedVote = decrypt(decryptionSharedKey, returnVoterRequest.encryptedVote)
    // console.log("Decrypted vote: ", decryptedVote)
}


export const testKeys = async () => {

    const vote = { candidate_id: '123' }
    const EAKeys = generateKeyPair()
    const voterKeys = generateKeyPair()

 
    console.log("Pub key: ", encodeBase64(EAKeys.publicKey))

    //generate public key from private key using algorand public key

    

    const encryptionSharedKey = box.before(EAKeys.publicKey, voterKeys.secretKey)
    const encryptedVote = encrypt(encryptionSharedKey, vote)
    console.log("Encrypted vote: ", encryptedVote)


    // console.log("Encrypted vote unint8array: ",  new Uint8Array(Buffer.from(encryptedVote)))


    const decryptionSharedKey = box.before(voterKeys.publicKey, EAKeys.secretKey)

    const decryptedVote = decrypt(decryptionSharedKey, encryptedVote)
    console.log("Decrypted vote: ", decryptedVote)

}

testKeys()


// voterSetup()






