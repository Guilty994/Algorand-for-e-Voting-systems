from pyteal import *

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

    get_encrypted_vote = App.localGetEx(Int(0), App.id(), Bytes("encrypted_vote"))

    get_registration_status = App.localGet(Int(0), Bytes("registered"))

    account_asset_balance = AssetHolding.balance(Txn.sender(), Txn.assets[0])

    voter_asset_balance = AssetHolding.balance(Txn.accounts[1], Txn.assets[0])

    on_registration = Seq(
        [
            account_asset_balance,
            Assert(
                And(Txn.application_args.length() == Int(1),
                    App.globalGet(Bytes("BallotID")) != Int(0),# check that the smart contract has initialized the assets
                    Global.latest_timestamp() >= App.globalGet(Bytes("RegBegin")),# Check the registration period
                    Global.latest_timestamp() <= App.globalGet(Bytes("RegEnd")) ,
                    Txn.assets[0] == App.globalGet(Bytes("BallotID")),# check that the asset is correct
                    account_asset_balance.hasValue(),  # check if the sender has opted into the asset (BALLOT)
                    account_asset_balance.value() == Int(1), # check if the sender has an asset (BALLOT)
                    App.localGet(Int(0), Bytes("registered")) == Int(0), # check that the user isn't registered yet
                )
            ),
            App.localPut(Int(0), Bytes("registered"), Int(1)),#1 = yes 0 = no
            Approve(),
        ]
    )


    on_vote = Seq(
        [
            get_encrypted_vote,
            account_asset_balance,
            Assert(
                And(Txn.application_args.length() == Int(2),
                    Txn.accounts.length() == Int(1),
                    Txn.accounts[1] == App.globalGet(Bytes("ElectionAuthority")),
                    Global.latest_timestamp() >= App.globalGet(Bytes("VoteBegin")),
                    Global.latest_timestamp() <= App.globalGet(Bytes("VoteEnd")),
                    Txn.assets[0] == App.globalGet(Bytes("BallotID")),# check that the asset is correct
                    account_asset_balance.hasValue(),  # check if the sender has opted into the asset (BALLOT)
                    account_asset_balance.value() == Int(1), # check if the sender has an asset (BALLOT)
                    get_registration_status == Int(1), # check that the user is registered
                    get_encrypted_vote.hasValue() == Int(0),
                )
            ),
            
            # Revoke the ballot
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.asset_receiver: Txn.accounts[1],
                TxnField.asset_sender: Txn.sender(),
                TxnField.asset_amount: Int(1),
                TxnField.xfer_asset: Txn.assets[0],
            }),
            InnerTxnBuilder.Submit(),

            # Save the encrypted vote
            App.localPut(Int(0), Bytes("encrypted_vote"), Txn.application_args[1]),

            Approve(),
        ]
    )

    on_generate_ballots = Seq(
        [
            Assert(
                And(Txn.application_args.length() == Int(1),
                    Txn.sender() == App.globalGet(Bytes("ElectionAuthority")),
                    App.globalGet(Bytes("BallotID")) == Int(0),
                )
            ),
            
            # Generate ballots
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetConfig,
                TxnField.config_asset_total: Int(1000000),
                TxnField.config_asset_decimals: Int(0),
                TxnField.config_asset_default_frozen: Int(1),
                TxnField.config_asset_unit_name: Bytes("blt"),
                TxnField.config_asset_name: Bytes("Ballots"),
                TxnField.config_asset_url: Bytes("https://www.unisa.it/"),
                TxnField.config_asset_manager: Global.current_application_address(),
                TxnField.config_asset_reserve: Global.current_application_address(),
                TxnField.config_asset_freeze: Global.current_application_address(),
                TxnField.config_asset_clawback: Global.current_application_address(),
            }),
            InnerTxnBuilder.Submit(),

            Assert(App.globalGet(Bytes("BallotID")) == Int(0)),

            App.globalPut(Bytes("BallotID"), InnerTxn.created_asset_id()),

            Approve(),
        ]
    )

    on_closeout = Seq(
        [
            Approve(),
        ]
    )

    # The optin is used to initialized the local status for the account in the smart contract 
    on_optin = Seq(
        [
            Assert(Txn.application_args.length() == Int(0)),

            # Setup the local status for each voter
            App.localPut(Int(0), Bytes("registered"), Int(0)),
            Approve(),
        ]
    )

    # Smart contract opton into asset to start using it (it is required by Algorand policy)
    on_sc_optin_asset = Seq(
        [
            Assert(
                And(
                    Txn.application_args.length() == Int(1),
                    Txn.sender() == App.globalGet(Bytes("ElectionAuthority")),
                    App.globalGet(Bytes("BallotID")) != Int(0),
                    )
                ),

            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.asset_receiver: Global.current_application_address(),
                TxnField.asset_amount: Int(0),
                TxnField.xfer_asset: Txn.assets[0],
            }),
            InnerTxnBuilder.Submit(),
            Approve(),
        ]
    )

    

    on_confirm_identity = Seq(
        [
            voter_asset_balance,
            Assert(
                And(
                    Txn.application_args.length() == Int(1),
                    Txn.accounts.length() == Int(1),
                    Txn.assets.length() == Int(1),
                    App.globalGet(Bytes("BallotID")) != Int(0),# check that the smart contract has initialized the assets
                    Global.latest_timestamp() >= App.globalGet(Bytes("RegBegin")),# Check the registration period
                    Global.latest_timestamp() <= App.globalGet(Bytes("RegEnd")) ,
                    Txn.assets[0] == App.globalGet(Bytes("BallotID")),# check that the asset is correct
                    voter_asset_balance.hasValue(),
                    voter_asset_balance.value() == Int(0),
                    )
                ),

            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.asset_receiver: Txn.accounts[1],
                TxnField.asset_sender: Global.current_application_address(),
                TxnField.asset_amount: Int(1),
                TxnField.xfer_asset: Txn.assets[0],
            }),
            InnerTxnBuilder.Submit(),
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
        [Txn.application_args[0] == Bytes("sc_optin_asset"), on_sc_optin_asset],
        [Txn.application_args[0] == Bytes("registration"), on_registration],
        [Txn.application_args[0] == Bytes("confirm_identity"), on_confirm_identity],
        [Txn.application_args[0] == Bytes("vote"), on_vote],
    )

    return program


def clear_state_program():

    return Approve()#for now not needed


if __name__ == "__main__":
    with open("./src/contract/artifacts/vote_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=5)
        f.write(compiled)

    with open("./src/contract/artifacts/vote_clear_state.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=5)
        f.write(compiled)