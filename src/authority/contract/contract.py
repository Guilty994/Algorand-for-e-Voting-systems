from pyteal import *
#logic is wrong on checking current round for register/voting period

def approval_program():
    init = Seq(
        [
            App.globalPut(Bytes("ElectionAuthority"), Txn.sender()),
            App.globalPut(Bytes("BallotsNumber"), Int(0)),
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

    is_ballot_generated = App.globalGet(Bytes("BallotsGenerated"))

    
    on_register = Seq(
        # Check registraiton period
        [
            Assert(
                And(Global.latest_timestamp() >= App.globalGet(Bytes("RegBegin")),
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
            If( get_registered_status.hasValue(),
                If( get_registered_status.value() == Int(0), 
                    Reject()),
                Reject(),
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
                    Global.latest_timestamp() >= App.globalGet(Bytes("RegBegin")),
                    Global.latest_timestamp() <= App.globalGet(Bytes("RegEnd")) ,
                    App.globalGet(Bytes("BallotsNumber")) == Int(0),
                )
            ),
            #generate ballots
            # ---
            App.globalPut(Bytes("BallotsNumber"), Int(100000)),
            Approve(),
        ]
    )

    on_closeout = Seq(
        [
            get_vote_of_sender,
            Approve(),
        ]
    )



    program = Cond(
        [Txn.application_id() == Int(0), init],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_electionAuthority)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_electionAuthority)],
        [Txn.on_completion() == OnComplete.CloseOut, on_closeout],
        [Txn.on_completion() == OnComplete.OptIn, on_register],
        [Txn.application_args[0] == Bytes("vote"), on_vote],
        [Txn.application_args[0] == Bytes("generate_ballots"), on_generate_ballots],
    )

    return program


def clear_state_program():
    get_vote_of_sender = App.localGetEx(Int(0), App.id(), Bytes("voted"))
    program = Seq(
        [
            get_vote_of_sender,
            If(
                And(
                    Global.round() <= App.globalGet(Bytes("VoteEnd")),# andrebbe fatto >= per evitare che l'app è chiusa prima che la votazione finisce
                    get_vote_of_sender.hasValue(),
                ),
                App.globalPut(
                    get_vote_of_sender.value(),
                    App.globalGet(get_vote_of_sender.value()) - Int(1),
                ),
            ),
        Approve(),
        ]
    )

    return program


if __name__ == "__main__":
    with open("./src/authority/contract/artifacts/vote_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=5)
        f.write(compiled)

    with open("./src/authority/contract/artifacts/vote_clear_state.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=5)
        f.write(compiled)