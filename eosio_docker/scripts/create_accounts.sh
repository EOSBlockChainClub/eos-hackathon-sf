#!/bin/bash
set -o errexit

echo "=== start deploy data ==="

# set PATH
PATH="$PATH:/opt/eosio/bin"

# change to script directory
cd "$(dirname "$0")"

echo "=== start create accounts in blockchain ==="

# download jq for json reader, we use jq here for reading the json file ( accounts.json )
mkdir -p ~/bin && curl -sSL -o ~/bin/jq https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64 && chmod +x ~/bin/jq && export PATH=$PATH:~/bin

# loop through the array in the json file, import keys and create accounts
# these pre-created accounts will be used for saving / erasing notes
# we hardcoded each account name, public and private key in the json.
# NEVER store the private key in any source code in your real life developmemnt
# This is just for demo purpose

cleos wallet create -n userwal --to-console | tail -1 | sed -e 's/^"//' -e 's/"$//' > user_wallet_password.txt

# unlock the wallet, ignore error if already unlocked
if [ ! -z $3 ]; then cleos wallet unlock -n userwal --password $(cat user_wallet_password.txt) || true; fi

jq -c '.[]' accounts.json | while read i; do
  name=$(jq -r '.name' <<< "$i")
  pub=$(jq -r '.publicKey' <<< "$i")
  priv=$(jq -r '.privateKey' <<< "$i")
  permJson='{"threshold": 1,"keys": [{"key": "'
  permJson+=$pub
  permJson+='","weight": 1}],"accounts": [{"permission":{"actor":"notechainacc","permission":"eosio.code"},"weight":1}]}'

  # to simplify, we use the same key for owner and active key of each account
  cleos create account eosio $name $pub $pub

  cleos wallet import -n userwal --private-key $priv

  cleos set account permission $name active "$permJson" owner -p $name
done
