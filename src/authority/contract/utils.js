

//READ STATE
// read local state of application from user account
export const readLocalState = async (index, account, client) => {
    try {
        let accountInfoResponse = await client.accountInformation(account.addr).do();
        let localState = accountInfoResponse['apps-local-state']
        return localState.map((item) => {
            if (item['id'] == index) {
                console.log("User's local state:" + item.id);
                let localStateItem = accountInfoResponse['apps-local-state'][item]['key-value']
                localStateItem.map((local) => {
                    console.log(local)
                    return local
                })
            }
            return item
        })
    } catch (err) {
        console.log(err)
    }
}


// read global state of application
export const readGlobalState = async (index, client) => {
    try {
        let applicationInfoResponse = await client.getApplicationByID(index).do();
        let globalState = applicationInfoResponse['params']['global-state']
        return globalState.map((state) => {
            return state;
        })
    } catch (err) {
        console.log(err)
    }
}
