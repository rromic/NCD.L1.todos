# TODOS

This repository includes a complete project structure for AssemblyScript contracts targeting the NEAR platform.

The idea of this example is to create TODO list. It's covering all CRUD (create, read, update, delete) cases.
By default users are limited to create maximum of 5 items in one list -- this value can be overridden by setup up optional argument `itemLimit` when initialising contract.
There is also optional argument `paidAmounLimitInput` which is set by default to 5 NEAR. Basically idea for this is when users pays that total amount the usage of contract will be free for all.
Users are only allowed to pay when calling `create` method, all other change method such as `update` and `delete` are not accepting tokens.
Once user payes any amount, then user can create as many items in the list as he wants to.
The last optional argument which can be set is `freeToAll`. If owner of contract set that argument to `true`, then contract is free to use whole time.
Those optional arguments cam be set while init contract.
Exp.

```bash
near call $CONTRACT init '{"owner":"'$OWNER'", "freeToAll": false, "itemLimit": 10, "paidAmounLimitInput": 20}' --accountId $CONTRACT
```

The read method `getTodos` allowing users to get all todo lists by `account`, by `status` (is it done or not) and by `title` of todo list. All those arguments can be joined to get more filtered results.
Argument `account` is mandatory, and arguments `status` and `title` are optional.

The read method `getTodoTitles` returns all todo titles for account.
The read method `getTotalPaidAmount` returns total paid amount by all accounts.
The read method `getPaidAmountLimit` returns the value that represents treshold by which contract becomes free.
The read method `getItemLimit` returns number of maximum of items in the list for free use.
The read method `getIsFree` returns if the contract is free for all or not yet. It's becomming free once the paidAmountLimit gets meet.

The write method `update` accepts title as mandatory argument and items as optional, and for all those inputs, updates items to mark them as done/true or update whole list to done/true is only title is provided.
The write method `delete` accepts title as mandatory argument and items as optional, and for all those inputs, delete items from list or delete whole list is only title is provided.

Is unit test you can find various test cases which are supported by this contract.

## ⚠️ Warning

Any content produced by NEAR, or developer resources that NEAR provides, are for educational and inspiration purposes only. NEAR does not encourage, induce or sanction the deployment of any such applications in violation of applicable laws or regulations.

## Usage

### Getting started

#### Prerequisite

- Setup testnet environment `export NEAR_ENV=testnet`
- Login with yours testnet accounts `near login`
- Setup beneficiary account, needed for cleanup script. `export BENEFICIARY=<your near testnet account>`

1. clone this repo to a local folder
2. run `yarn`
3. run `yarn test`
4. run `./scripts/1.dev-deploy.sh` (follow instructions that you get from this script!)
5. run `./scripts/2.use-contract.sh`
6. run `./scripts/2.use-contract.sh` (yes, run it to see changes)
7. run `./scripts/3.free-contract.sh`
8. run `./scripts/4.cleanup.sh`

### Top-level `yarn` commands

- run `yarn test` to run all tests
  - (!) be sure to run `yarn build:release` at least once before:
    - run `yarn test:unit` to run only unit tests
- run `yarn build` to quickly verify build status
- run `yarn clean` to clean up build folder

### Other documentation

- See `./scripts/README.md` for documentation about the scripts

## The file system

```sh
├── README.md                          # this file
├── as-pect.config.js                  # configuration for as-pect (AssemblyScript unit testing)
├── asconfig.json                      # configuration for AssemblyScript compiler (supports multiple contracts)
├── package.json                       # NodeJS project manifest
├── scripts
│   ├── 1.dev-deploy.sh                # helper: build and deploy contracts
│   ├── 2.use-contract.sh              # helper: call methods for CRUD operations of contract
│   ├── 3.free-contract.sh             # helper: call methods to test free contract
│   ├── 4.cleanup.sh                   # helper: delete build and deploy artifacts
│   └── README.md                      # documentation for helper scripts
├── src
│   ├── as_types.d.ts                  # AssemblyScript headers for type hints
│   ├── todos                          # Contract Todos
│   │   ├── __tests__
│   │   │   ├── as-pect.d.ts           # as-pect unit testing headers for type hints
│   │   │   └── index.unit.spec.ts     # unit tests for todos
│   │   ├── asconfig.json              # configuration for AssemblyScript compiler (one per contract)
│   │   └── assembly
│   │       └── index.ts               # contract code for todos
│   │       └── models.ts              # model definition for todo class
│   ├── tsconfig.json                  # Typescript configuration
│   └── utils.ts                       # common contract utility functions
└── yarn.lock                          # project manifest version lock
```

### Contracts and Unit Tests

```txt
src
├── todos                       <-- Todos contract
│   ├── README.md
│   ├── __tests__
│   │   ├── index.unit.spec.ts
│   └── assembly
│       ├── index.ts
│       └── models.ts
└── utils.ts                      <-- shared contract code
```

### Helper Scripts

```txt
scripts
├── 1.dev-deploy.sh
├── 2.use-contract.sh
├── 3.free-contract.sh
|── 4.cleanup.sh
├── README.md                     <-- instructions
```

### Videos

**`Demo`**

This video shows the demo of the contract.

[(https://www.loom.com/share/1656de4e01f64a30bdaeb8c5eb60957b)](https://www.loom.com/share/1656de4e01f64a30bdaeb8c5eb60957b)
