import { confirmIdentity } from "../contract/contract_actions.js";
import { registrationSuccessMail } from "../utils/utils.js";
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config()

export const acceptRegistration = async (electAuthAccount, voterAddress, appID, ballotID, voterMail, client) => {


    // Accept
    console.group(chalk.blueBright("CONFIRM VOTER IDENTITY (EA->SC)"))
    await confirmIdentity(electAuthAccount, voterAddress, appID, ballotID, client)

    // Send success registration mail
    await registrationSuccessMail(voterMail, appID)

    console.groupEnd(chalk.blueBright("CONFIRM VOTER IDENTITY (EA->SC)"))
}