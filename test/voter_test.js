/**
 * Unit tests for the voter
 */

 import { setup } from "../src/authority/setup_handler.js";
 import { deleteApplication, optin, generateBallots } from "../src/contract/contract_actions.js";
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