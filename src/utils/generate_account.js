import algosdk from 'algosdk';

export const createAccount = function() {
    try {  
        const myaccount = algosdk.generateAccount();
        //console.log("Account Address = " + myaccount.addr);
        const account_mnemonic = algosdk.secretKeyToMnemonic(myaccount.sk);
        //console.log("Account Mnemonic = "+ account_mnemonic);

        const address = myaccount.addr
        return {address, account_mnemonic};
    }
    catch (err) {
        console.log("err", err);
    }
}