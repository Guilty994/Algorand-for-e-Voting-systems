from algosdk.v2client import algod

def check_bal(my_address):
    algod_address = "https://testnet-algorand.api.purestake.io/ps2"
    algod_token = "cVUq9NZ8jb23hAlrL3GvBGzx67my0aA4YkjLUiZ7"
    headers = {
        "X-API-Key": algod_token,
    }

    algod_client = algod.AlgodClient(algod_token, algod_address, headers)

    # check info
    account_info = algod_client.account_info(my_address)
    print("Account balance: {} microAlgos".format(account_info.get('amount')) + "\n")




print('Election Authority balance')
check_bal('ECMJ7CS4GHI5KHST7QLNPFNSY3HRFIAGG3E2QVD3JZY77DJCIJX5T3SOL4')

print('Registration Authority balance')
check_bal('EPZVXMCCO6CDYBMELEPKB6ROGGY7PRF7HPQPKFOODXEE4TOVBW2P4VJ6PQ')

print('Voter balance')
check_bal('MDG737VNILRVNSKRALS4R7L7EXA4UBQ55LM34457X6USDVX4OHGH6ELO6U')