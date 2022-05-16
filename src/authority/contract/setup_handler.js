const main = async () => {

    const approval_program = await compileProgram(client, approvalProgram)
    const clear_program = await  compileProgram(client,clear_state_program )
  
    // configure registration and voting period
    
  
    let RegBegin = 2338800 // Thu May 12 2022 07:00:00 GMT+0000 // 165 omesso
    let RegEnd = 2425200 // Fri May 13 2022 07:00:00 GMT+0000
    let VoteBegin = 2511600 // Sat May 14 2022 07:00:00 GMT+0000
    let VoteEnd = 2598000 // Sun May 15 2022 07:00:00 GMT+0000
  
    console.log(`Registration from: ${RegBegin} to ${RegEnd}`)
    console.log(`Vote from: ${VoteBegin} to ${VoteEnd}`)
  
    // create list of bytes for app args
    let appArgs = [];
    appArgs.push(
      new Uint8Array(Buffer.from(intToBytes(RegBegin))),
      new Uint8Array(Buffer.from(intToBytes(RegEnd))),
      new Uint8Array(Buffer.from(intToBytes(VoteBegin))),
      new Uint8Array(Buffer.from(intToBytes(VoteEnd))),
    )
  
    // create new application
    console.log("---STARTING CREATEAPP---")
    const appId =  await createApp(elecAuthAddress, electAuthAccount, approval_program, clear_program , localInts, localBytes, globalInts, globalBytes, appArgs)
    console.log("---END CREATEAPP---")    
  
    const globalState = await readGlobalState(appId)
    console.log("GLOBAL STATE BEFORE USERS INTERACTIONS")
    console.log(globalState)
    console.log("END GLOBAL STATE BEFORE USERS INTERACTIONS")
  
  //   // USER 1
  //   console.log("USER 1")
  //   console.log("---STARTING OPTIN---")
  //   await Optin(userAccout.addr, userAccout, appId)
  //   console.log("---STARTING NOOP---")
  //   await noop(sender, userAccout, appId, "pippo")
  //   console.log("---END NOOP---")
  //   //  read localstate of application
  //   const localState = await  readLocalState(sender, userAccout, appId)
  //   console.log("Local State after USER 1")
  //   console.log(localState)
  //   console.log("END Local State after USER 1")
  //   //  read globalstate of application
  //   const gloablState = await readGlobalState(appId)
  //   console.log("Global State after USER 1")
  //   console.log(gloablState)
  //   console.log("END Global State after USER 1")
  //   // console.log("--CLEARING SENDER STATE")
  //   // await clearState(sender, appId)
  //   console.log("---STARTING CLOSEOUT---")
  //   await closeOut(sender, userAccout, appId)
  
  //   //USER 2
  //   console.log("USER 2")
  //   console.log("---STARTING OPTIN---")
  //   await Optin(user2Account.addr, user2Account, appId)
  //   console.log("---STARTING NOOP---")
  //   await noop(sender2, user2Account, appId, "pippo")
  //   console.log("---END NOOP---")
  //   //  read localstate of application
  //   const localState2 = await  readLocalState(sender2, user2Account, appId)
  //   console.log("Local State after USER 2")
  //   console.log(localState2)
  //   console.log("END Local State after USER 2")
  //   //  read globalstate of application
  //   const gloablState2 = await readGlobalState(appId)
  //   console.log("Global State after USER 2")
  //   console.log(gloablState2)
  //   console.log("END Global State after USER 2")
  //   // console.log("--CLEARING SENDER STATE")
  //   // await clearState(sender, appId)
  //   console.log("---STARTING CLOSEOUT---")
  //   await closeOut(sender2, user2Account, appId)
  
  
  
  
  //   // TALLY
  //   console.log("---TALLY---")
  
  //   let applicationInfoResponse = await client.getApplicationByID(appId).do();
  //   let globalStateTally = applicationInfoResponse['params']['global-state'];
  //   globalStateTally.map((state) =>{
  //     if(candidates.includes(atob(state.key))){
  //       console.log("Candidate:",atob(state.key), "# of votes:", state.value.uint)
  //     }
  //   })
  
  
  //   //CREATOR
  //   console.log("---STARTING DELETEAPP---")
  //   await deleteApp(elecAuthAddress, electAuthAccount, appId)
  
  
  
  
  
  
  }
  main()