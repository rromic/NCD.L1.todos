#!/usr/bin/env bash

# exit on first error after this point to avoid redeploying with successful build
set -e

echo
echo ---------------------------------------------------------
echo "Step 0: Check for environment variable with contract name"
echo ---------------------------------------------------------
echo

[ -z "$CONTRACT" ] && echo "Missing \$CONTRACT environment variable" && exit 1
[ -z "$CONTRACT" ] || echo "Found it! \$CONTRACT is set to [ $CONTRACT ]"

echo
echo

near view $CONTRACT getIsFree  

echo
echo
# set free to all 

near call $CONTRACT setFree --accountId $OWNER 

echo
echo

near view $CONTRACT getIsFree  

echo
echo
# it's free to add as many items as you like
near call $CONTRACT create '{"list": "item1,item2,item3,item4,item5,item6", "title":"Clothing"}' --accountId $USER 

echo
echo
# it will panic with error You don't have to pay, it's free!
near call $CONTRACT create '{"list": "item1,item2,item3,item4,item5,item6", "title":"Clothing"}' --accountId $USER --amount 1

echo
echo

near view $CONTRACT getTodos '{"account": "'$USER'"}'

echo
echo
echo "now run this script again to see changes made by this file"
exit 0
