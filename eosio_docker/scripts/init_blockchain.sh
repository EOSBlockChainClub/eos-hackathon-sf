#!/usr/bin/env bash
set -o errexit

echo "=== setup blockchain accounts and smart contract ==="

# set PATH
PATH="$PATH:/opt/eosio/bin:/opt/eosio/bin/scripts"

set -m

echo "=== install EOSIO.CDT (Contract Development Toolkit) ==="
apt install /opt/eosio/bin/scripts/eosio.cdt-1.3.2.x86_64.deb

# start nodeos ( local node of blockchain )
# run it in a background job such that docker run could continue
nodeos -e -p eosio -d /mnt/dev/data \
  --config-dir /mnt/dev/config \
  --http-validate-host=false \
  --plugin eosio::producer_plugin \
  --plugin eosio::chain_api_plugin \
  --plugin eosio::http_plugin \
  --http-server-address=0.0.0.0:8888 \
  --access-control-allow-origin=* \
  --contracts-console \
  --verbose-http-errors &
sleep 1s
until curl localhost:8888/v1/chain/get_info
do
  sleep 1s
done

# Sleep for 2 to allow time 4 blocks to be created so we have blocks to reference when sending transactions
sleep 2s
echo "=== setup wallet: eosiomain ==="
# First key import is for eosio system account
cleos wallet create -n eosiomain --to-console | tail -1 | sed -e 's/^"//' -e 's/"$//' > eosiomain_wallet_password.txt
cleos wallet import -n eosiomain --private-key 5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3

echo "=== setup wallet: notechainwal ==="
# key for eosio account and export the generated password to a file for unlocking wallet later
cleos wallet create -n notechainwal --to-console | tail -1 | sed -e 's/^"//' -e 's/"$//' > notechain_wallet_password.txt
# Owner key for notechainwal wallet
cleos wallet import -n notechainwal --private-key 5JpWT4ehouB2FF9aCfdfnZ5AwbQbTtHBAwebRXt94FmjyhXwL4K
# Active key for notechainwal wallet
cleos wallet import -n notechainwal --private-key 5JD9AGTuTeD5BXZwGQ5AtwBqHK21aHmYnTetHgk1B3pjj7krT8N

# create account for notechainacc with above wallet's public keys
cleos create account eosio notechainacc EOS6PUh9rs7eddJNzqgqDx1QrspSHLRxLMcRdwHZZRL4tpbtvia5B EOS8BCgapgYA2L4LJfCzekzeSr3rzgSTUXRXwNi8bNRoz31D14en9

echo "=== setup wallet: eosio.token ==="
# key for eosio account and export the generated password to a file for unlocking wallet later
cleos wallet create -n eosiowallet --to-console | tail -1 | sed -e 's/^"//' -e 's/"$//' > eosio_wallet_password.txt
# Owner key for eosiowallet wallet
cleos wallet import -n eosiowallet --private-key 5JNECtLCSVkyx2EtgiYgeJ4kCVmmMudwt92hFQEXfSLtZM6V9ur
# Active key for eosiowallet wallet
cleos wallet import -n eosiowallet --private-key 5KLpVjUiH9mGpqiqgRUpJ8WWYYbkbxJbaBwXHnABh6DJoAoF6oD

# * Replace "notechainwal" by your own wallet name when you start your own project

# create account for eosio.token with above wallet's public keys
cleos create account eosio eosio.token EOS5xuM3PrBbFBRXf9hPQA3fDHYzjtKyvD31iqsgsPhtJRZt8yHVj EOS6QUsRZsW7Yi47ExfW8cKBJ6q8XHT9UFAjRgpnQTj1Cikn9Pm4i

# * Replace "notechainacc" by your own account name when you start your own project

echo "=== deploy smart contract ==="
# $1 smart contract name
# $2 account holder name of the smart contract
# $3 wallet for unlock the account
# $4 password for unlocking the wallet
deploy_contract.sh notechain notechainacc notechainwal $(cat notechain_wallet_password.txt)

echo "=== deploy eos token ==="
deploy_contract.sh eosio.token eosio.token eosiowallet $(cat eosio_wallet_password.txt)

echo "=== create user accounts ==="
# script for create data into blockchain
create_accounts.sh

echo "=== issuing tokens ==="
cleos push action eosio.token create '{"issuer":"eosio", "maximum_supply":"1000000000.0000 EOS"}' -p eosio.token@active

echo "=== sending tokens to acct1 ==="
cleos push action eosio.token issue '[ "useraaaaaaaa", "100.0000 EOS", "memo" ]' -p eosio

echo "=== sending tokens to acct2 ==="
cleos push action eosio.token issue '[ "useraaaaaaab", "100.0000 EOS", "memo" ]' -p eosio

# cleos wallet import --private-key 5K7mtrinTFrVTduSxizUc5hjXJEtTjVTsqSHeBHes1Viep86FP5
# cleos wallet import --private-key 5KLqT1UFxVnKRWkjvhFur4sECrPhciuUqsYRihc1p9rxhXQMZBg

# cleos set account permission useraaaaaaaa active EOS6PUh9rs7eddJNzqgqDx1QrspSHLRxLMcRdwHZZRL4tpbtvia5B -p useraaaaaaaa@active
# cleos set account permission useraaaaaaab active EOS6PUh9rs7eddJNzqgqDx1QrspSHLRxLMcRdwHZZRL4tpbtvia5B -p useraaaaaaab@active

# cleos set account permission useraaaaaaaa active EOS8BCgapgYA2L4LJfCzekzeSr3rzgSTUXRXwNi8bNRoz31D14en9 -p useraaaaaaaa@active
# cleos set account permission useraaaaaaab active EOS8BCgapgYA2L4LJfCzekzeSr3rzgSTUXRXwNi8bNRoz31D14en9 -p useraaaaaaab@active

# Usage: cleos set account permission [OPTIONS] account permission authority [parent]

# Positionals:
#   account TEXT                The account to set/delete a permission authority for (required)
#   permission TEXT             The permission name to set/delete an authority for (required)
#   authority TEXT              [delete] NULL, [create/update] public key, JSON string, or filename defining the authority (required)
#   parent TEXT                 [create] The permission name of this parents permission (Defaults to: "Active")

# Options:
#   -h,--help                   Print this help message and exit
#   -x,--expiration             set the time in seconds before a transaction expires, defaults to 30s
#   -f,--force-unique           force the transaction to be unique. this will consume extra bandwidth and remove any protections against accidently issuing the same transaction multiple times
#   -s,--skip-sign              Specify if unlocked wallet keys should be used to sign transaction
#   -j,--json                   print result as json
#   -d,--dont-broadcast         don't broadcast transaction to the network (just print to stdout)
#   --return-packed             used in conjunction with --dont-broadcast to get the packed transaction
#   -r,--ref-block TEXT         set the reference block num or block id used for TAPOS (Transaction as Proof-of-Stake)
#   -p,--permission TEXT ...    An account and permission level to authorize, as in 'account@permission' (defaults to 'account@active')
#   --max-cpu-usage-ms UINT     set an upper limit on the milliseconds of cpu usage budget, for the execution of the transaction (defaults to 0 which means no limit)
#   --max-net-usage UINT        set an upper limit on the net usage budget, in bytes, for the transaction (defaults to 0 which means no limit)
#   --delay-sec UINT            set the delay_sec seconds, defaults to 0s

# * Replace the script with different form of data that you would pushed into the blockchain when you start your own project

echo "=== end of setup blockchain accounts and smart contract ==="
# create a file to indicate the blockchain has been initialized
touch "/mnt/dev/data/initialized"

# put the background nodeos job to foreground for docker run
fg %1
