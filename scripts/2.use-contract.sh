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
echo ---------------------------------------------------------
echo "Step 1: Call 'view' functions on the contract"
echo
echo "(run this script again to see changes made by this file)"
echo ---------------------------------------------------------
echo

near view $CONTRACT getOwner --accountId $OWNER

echo
echo

near view $CONTRACT getTodos '{"account": "'$OWNER'"}'

echo
echo

near view $CONTRACT getTodoTitles '{"account": "'$OWNER'"}'

echo
echo

near view $CONTRACT getTodos '{"account": "'$OWNER'", "title":"Clothing"}'

echo
echo

near view $CONTRACT getTodos '{"account": "'$OWNER'", "title":"Shopping", "status": "false"}'

echo
echo

near view $CONTRACT getTodos '{"account": "'$OWNER'", "title":"Shopping", "status": "true"}'

echo
echo

near view $CONTRACT getTotalPaidAmount 

echo
echo

near view $CONTRACT getPaidAmountLimit 

echo
echo

near view $CONTRACT getItemLimit 

echo
echo

near view $CONTRACT getIsFree  

echo
echo
echo ---------------------------------------------------------
echo "Step 2: Call 'change' functions on the contract"
echo ---------------------------------------------------------
echo
near call $CONTRACT create '{"title":"Shopping", "list": "item1,item2,item3"}' --accountId $OWNER

echo
echo
# this call will fail due to limit of max items in one todo list with error "You have to pay some price!"
# second call will successfully create a new list with those items, because in next command we are sending some money
# all other calls will fail with error "There is already todo list with title Cleaning!"
near call $CONTRACT create '{"title":"Cleaning", "list": "item1,item2,item3,item4,item5,item6"}' --accountId $OWNER 

echo
echo

# in the next execution of the script, this create method will panic with error saying that "You already paid!"
near call $CONTRACT create '{"title":"Clothing", "list": "item1,item2,item3,item4,item5,item6"}' --accountId $OWNER --amount 1

echo
echo 

near call $CONTRACT delete '{"title":"Clothing"}' --accountId $OWNER 

echo
echo

near call $CONTRACT update '{"title":"Shopping", "list": "item1,item2"}' --accountId $OWNER 

echo
echo
echo "now run this script again to see changes made by this file"
exit 0
