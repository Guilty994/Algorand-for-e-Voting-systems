import { clawBackAsset, getSmartContractAddress } from "../utils/utils.js";
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config()

export const acceptRegistration = async (electAuthAccount, voterAddress, appID, ballotID, client) => {

    console.group(chalk.blueBright("ACCEPT REGISTRATION REQUEST (EA)"))
    let smartContractAddress = await getSmartContractAddress(appID)
    await clawBackAsset(electAuthAccount, smartContractAddress, voterAddress, ballotID, 1, client)
    console.groupEnd(chalk.blueBright("ACCEPT REGISTRATION REQUEST (EA)"))
}