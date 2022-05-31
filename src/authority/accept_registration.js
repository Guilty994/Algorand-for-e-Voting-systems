import { confirmIdentity } from "../contract/contract_actions.js";
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config()

export const acceptRegistration = async (electAuthAccount, voterAddress, appID, ballotID, client) => {

    // DO CHECKS 


    // ---

    // Accept

    console.group(chalk.blueBright("CONFIRM VOTER IDENTITY (EA->SC)"))
    await confirmIdentity(electAuthAccount, voterAddress, appID, ballotID, client)
    console.groupEnd(chalk.blueBright("CONFIRM VOTER IDENTITY (EA->SC)"))
}