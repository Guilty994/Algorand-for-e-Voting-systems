import { optin, registration } from "../contract/contract_actions.js";
import { sendAsset } from "../utils/utils.js";
import dotenv from 'dotenv';
import chalk from 'chalk';


dotenv.config()


export const preRegistrationRequest = async (returnedIDs, voterAccount, client) => {

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

   console.group(chalk.blueBright("REGISTRATION REQUEST (VOTER->EA)"))
   //TODO: per ora assumo che in qualche modo viene inviata una richiesta che è poi elaborata asyncronamente dall'EA ed RA
   console.groupEnd(chalk.blueBright("REGISTRATION REQUEST (VOTER->EA)"))

}

export const registrationRequest = async (voterAccount, appID, ballotID, client) => {

   console.group(chalk.blueBright("REGISTRATION (VOTER->SC)"))
   await registration(voterAccount, appID, ballotID, client);
   console.groupEnd(chalk.blueBright("REGISTRATION (VOTER->SC)"))

}

export const voteRequest = async (voterAccount, appID, ballotID, client) => {

}

