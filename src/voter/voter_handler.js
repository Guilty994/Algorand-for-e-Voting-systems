import { optin, registration, vote } from "../contract/contract_actions.js";
import { sendAsset, getVotingKey, generateKeyPair, encrypt, getElectionAuthorityAddress, sendIdentityInformation } from "../utils/utils.js";
import dotenv from 'dotenv';
import chalk from 'chalk';

import nacl from 'tweetnacl';
const { box, randomBytes } = nacl;
import naclutils from 'tweetnacl-util';
const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } = naclutils;


dotenv.config()


export const preRegistrationRequest = async (returnedIDs, voterAccount, eamail, votermail, payload, client) => {

   console.group(chalk.blueBright("OPTIN SMART CONTRACT (VOTER->SC)"))
   await optin(voterAccount, returnedIDs.appID, client)
   console.groupEnd(chalk.blueBright("OPTIN SMART CONTRACT (VOTER->SC)"))

   // 1. OPTIN INTO THE BALLOT ASSET
   // 2. SEND REQUEST TO EA TO CONFIRM IDENTITY  
   // 3. EA VERIFY THE IDENTITY 
   // 4. EA MANIFEST THE VOTER ELIGIBILITY TO VOTE SENDING A TOKEN TO THE PROVIDED ACCOUNT

   // this is required by Algorand ASA protocol (must send a self transaction to optin)
   console.group(chalk.blueBright("OPTIN BALLOT (VOTER->ALGORAND)"))
   await sendAsset(voterAccount, voterAccount, returnedIDs.ballotID, 0, client)
   console.groupEnd(chalk.blueBright("OPTIN BALLOT (VOTER->ALGORAND)"))

   console.group(chalk.blueBright("IDENTITY CONFIRMATION REQUEST (VOTER->EA)"))
   // send mail to ea containing personal information in order to confirm the identity of the account
   await sendIdentityInformation(eamail, votermail, returnedIDs.appID, voterAccount.addr, payload)
   
   
   console.groupEnd(chalk.blueBright("IDENTITY CONFIRMATION REQUEST (VOTER->EA)"))

}

export const registrationRequest = async (voterAccount, appID, ballotID, client) => {

   console.group(chalk.blueBright("REGISTRATION (VOTER->SC)"))
   await registration(voterAccount, appID, ballotID, client);
   console.groupEnd(chalk.blueBright("REGISTRATION (VOTER->SC)"))

}

export const voteRequest = async (voterAccount, appID, ballotID, choice, client) => {

   // get voting key
   console.group(chalk.blueBright("GET VOTING KEY (VOTER->SC)"))
   const votingKey = await getVotingKey(appID, client)
   console.groupEnd(chalk.blueBright("GET VOTING KEY (VOTER->SC)"))

   // encrypt vote
   console.group(chalk.blueBright("ENCRYPT VOTE (VOTER)"))
   const voterGeneratedKeys = generateKeyPair();

   const encryptionSharedKey = box.before(decodeBase64(votingKey), voterGeneratedKeys.secretKey)
   const encryptedVote = encrypt(encryptionSharedKey, choice)
   console.log("Encrypted vote: ", encryptedVote)
   console.log("Voter generated public key: ", encodeBase64(voterGeneratedKeys.publicKey))

   console.groupEnd(chalk.blueBright("ENCRYPT VOTE (VOTER)"))


   // Send vote
   console.group(chalk.blueBright("SEND VOTE (VOTER->SC)"))
   const eaaddr = await getElectionAuthorityAddress(appID, client)
   await vote(voterAccount, eaaddr, appID, ballotID, encryptedVote, voterGeneratedKeys.publicKey, client)
   console.groupEnd(chalk.blueBright("SEND VOTE (VOTER->SC)"))

   return {encryptedVote, voterGeneratedKeys}
}

