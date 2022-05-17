from pyteal import *
#logic is wrong on checking current round for register/voting period

def approval_program():
    init = Seq(
        [
            App.globalPut(Bytes("ElectionAuthority"), Txn.sender()),
            App.globalPut(Bytes("BallotID"), Int(0)),
            Assert(Txn.application_args.length() == Int(4)),
            App.globalPut(Bytes("RegBegin"), Btoi(Txn.application_args[0])),
            App.globalPut(Bytes("RegEnd"), Btoi(Txn.application_args[1])),
            App.globalPut(Bytes("VoteBegin"), Btoi(Txn.application_args[2])),
            App.globalPut(Bytes("VoteEnd"), Btoi(Txn.application_args[3])),
            Approve(),
        ]
    )

    is_electionAuthority = Txn.sender() == App.globalGet(Bytes("ElectionAuthority"))

    get_vote_of_sender = App.localGetEx(Int(0), App.id(), Bytes("voted"))

    get_registered_status = App.localGetEx(Int(0), App.id(), Bytes("registered"))

    on_registration = Seq(
        # Check registraiton period
        [
            Assert(
                And(App.globalGet(Bytes("BallotID")) > Int(0),
                    Global.latest_timestamp() >= App.globalGet(Bytes("RegBegin")),
                    Global.latest_timestamp() <= App.globalGet(Bytes("RegEnd")) ,
                )
            ),
            get_registered_status,
            If(get_registered_status.hasValue(), Reject()),
            App.localPut(Int(0), Bytes("registered"), Int(1)),#1 = yes 0 = no
            Approve(),
        ]
    )

    choice = Txn.application_args[1]
    choice_tally = App.globalGet(choice)
    
    on_vote = Seq(
        [
            # check voting period
            Assert(
                And(Global.latest_timestamp() >= App.globalGet(Bytes("VoteBegin")),
                    Global.latest_timestamp() <= App.globalGet(Bytes("VoteEnd")) ,
                )
            ),

            # check if registered
            get_registered_status,
            Assert(
                And(get_registered_status.hasValue(),
                    get_registered_status.value() == Int(1),
                )
            ),

            # check if already voted
            get_vote_of_sender,
            If(get_vote_of_sender.hasValue(), Return(Int(0))),

            # update vote
            App.globalPut(choice, choice_tally + Int(1)),
            App.localPut(Int(0), Bytes("voted"), choice),
            Approve(),
        ]
    )

    on_generate_ballots = Seq(
        [
            Assert(
                And(Txn.sender() == App.globalGet(Bytes("ElectionAuthority")),
                    App.globalGet(Bytes("BallotID")) == Int(0),
                )
            ),
            

            #generate ballots
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetConfig,
                TxnField.config_asset_total: Int(1000000),
                TxnField.config_asset_decimals: Int(0),
                TxnField.config_asset_default_frozen: Int(1),
                TxnField.config_asset_unit_name: Bytes("ballot"),
                TxnField.config_asset_name: Bytes("Ballots"),
                TxnField.config_asset_url: Bytes("https://www.unisa.it/"),
                TxnField.config_asset_manager: Global.current_application_address(),
                TxnField.config_asset_reserve: Global.current_application_address(),
                TxnField.config_asset_freeze: Global.current_application_address(),
                TxnField.config_asset_clawback: Global.current_application_address()
            }),
            InnerTxnBuilder.Submit(),

            App.globalPut(Bytes("BallotID"), InnerTxn.created_asset_id()),
            Approve(),
        ]
    )

    on_closeout = Seq(
        [
            Approve(),
        ]
    )

    on_optin = Seq(
        [
            Approve(),
        ]
    )



    program = Cond(
        [Txn.application_id() == Int(0), init],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_electionAuthority)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_electionAuthority)],
        [Txn.on_completion() == OnComplete.CloseOut, on_closeout],
        [Txn.on_completion() == OnComplete.OptIn, on_optin],
        [Txn.application_args[0] == Bytes("generate_ballots"), on_generate_ballots],
        [Txn.application_args[0] == Bytes("registration"), on_registration],
        [Txn.application_args[0] == Bytes("vote"), on_vote],
    )

    return program


def clear_state_program():

    return Approve()#for now not needed


if __name__ == "__main__":
    with open("./src/authority/contract/artifacts/vote_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=5)
        f.write(compiled)

    with open("./src/authority/contract/artifacts/vote_clear_state.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=5)
        f.write(compiled)