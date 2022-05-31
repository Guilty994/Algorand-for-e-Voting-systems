import { tally } from "../contract/contract_actions.js";
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config()

export const enableTally = async (electAuthAccount, appID, tallyKey, client) => {

    console.group(chalk.blueBright("ENABLE TALLY (EA->SC)"))
    await tally(electAuthAccount, appID, tallyKey, client)
    console.groupEnd(chalk.blueBright("ENABLE TALLY(EA->SC)"))
}