import { Context, PersistentMap, u128, PersistentSet, ContractPromiseBatch, logging } from "near-sdk-core"
import { AccountId, ONE_NEAR, XCC_GAS } from "../../utils"

import { Todo } from "./models";

const CONTRIBUTION_SAFETY_LIMIT: u128 = u128.mul(ONE_NEAR, u128.from(10));

@nearBindgen
export class Contract {
  private owner: AccountId;
  private freeToAll: bool;
  private itemLimit: i32;
  private paidAmountLimit: u128;
  private totalPaidAmount: u128 = u128.Zero;

  constructor(owner: AccountId, freeToAll: bool = false, itemLimit: i32 = 5, paidAmounLimitInput: i32 = 5) {
    this.owner = owner;
    this.freeToAll = freeToAll;
    this.itemLimit = itemLimit;
    this.paidAmountLimit = u128.mul(ONE_NEAR, u128.from(paidAmounLimitInput));
  }

  //View methods
  getOwner(): AccountId {
    return this.owner;
  }

  getTodos(account: string, title: string = "", status: string = ""): string {
    const author = account.trim();
    let todos = this.getTodoList(author);
    if (title == "" && status == "") {
      if (todos != null) {
        if (todos.length > 0) {
          let allTodos: string = "";
          for (let i = 0; i < todos.length; ++i) {
            if (i > 0) {
              allTodos += " --title " + todos[i].title + " --items";
            } else {
              allTodos += "--title " + todos[i].title + " --items";
            }
            let keys = todos[i].list.keys();
            let values = todos[i].list.values();
            for (let j = 0; j < keys.length; ++j) {
              allTodos += " item: " + keys[j] + " done: " + values[j].toString();
            }
          }
          return allTodos
        }
      }
    } else if (title.length != 0 && status == "") {
      if (todos != null) {
        if (todos.length > 0) {
          let allTodos: string = "--title ";
          let titleExist: bool = false;
          for (let i = 0; i < todos.length; ++i) {
            if (todos[i].title == title.trim()) {
              titleExist = true;
              allTodos += todos[i].title + " --items";
              let keys = todos[i].list.keys();
              let values = todos[i].list.values();
              for (let j = 0; j < keys.length; ++j) {
                allTodos += " item: " + keys[j] + " done: " + values[j].toString();
              }
            }
          }
          if (!titleExist) {
            return `There is no title ${title.trim()}!`
          }
          return allTodos
        }
      }
    } else if (title.length != 0 && status.length != 0) {
      if (todos != null) {
        if (todos.length > 0) {
          let allTodos: string = "--title ";
          let titleExist: bool = false;
          for (let i = 0; i < todos.length; ++i) {
            if (todos[i].title == title.trim()) {
              titleExist = true;
              allTodos += todos[i].title + " --items";
              let keys = todos[i].list.keys();
              let values = todos[i].list.values();
              for (let j = 0; j < keys.length; ++j) {
                if (status.trim() == "true" && values[j].toString() == "true") {
                  allTodos += " item: " + keys[j] + " done: " + values[j].toString();
                } else if (status.trim() == "false" && values[j].toString() == "false") {
                  allTodos += " item: " + keys[j] + " done: " + values[j].toString();
                }
              }
            }
          }
          if (!titleExist) {
            return `There is no title ${title.trim()}!`
          }
          return allTodos
        }
      }
    } else if (title == "" && status.length != 0) {
      if (todos != null) {
        if (todos.length > 0) {
          let allTodos: string = "--title ";
          for (let i = 0; i < todos.length; ++i) {
            allTodos += todos[i].title + " --items";
            let keys = todos[i].list.keys();
            let values = todos[i].list.values();
            for (let j = 0; j < keys.length; ++j) {
              if (status.trim() == "true" && values[j].toString() == "true") {
                allTodos += " item: " + keys[j] + " done: " + values[j].toString();
              } else if (status.trim() == "false" && values[j].toString() == "false") {
                allTodos += " item: " + keys[j] + " done: " + values[j].toString();
              }
            }
          }
          return allTodos
        }
      }
    }
    return "You don't have any todo list created!"
  }

  getTodoTitles(account: string): string {
    const author = account.trim();
    let todos = this.getTodoList(author);
    if (todos != null) {
      if (todos.length > 0) {
        let titles: string = "titles:";
        for (let i = 0; i < todos.length; ++i) {
          titles += " " + todos[i].title;
        }
        return titles
      }
      return "You don't have any todo list created!"
    }
    return "You don't have any todo list created!"
  }

  getTotalPaidAmount(): string {
    return `Total paid amount: ${this.totalPaidAmount}`
  }

  getPaidAmountLimit(): string {
    return `Paid amount limit: ${this.paidAmountLimit}`
  }

  getItemLimit(): string {
    return `Item limit: ${this.itemLimit}`
  }

  getIsFree(): string {
    if (this.freeToAll) {
      return "It's free to all!"
    } else {
      return "It's not yet free to all!"
    }
  }

  //Write methods
  @mutateState()
  create(title: string, list: string): string {
    const author = Context.sender;

    const deposit = Context.attachedDeposit;
    this.assertFinancialSafetyLimits(deposit);

    let isPaid = this.isPaid(author);
    if (deposit > u128.Zero) {
      assert(!this.freeToAll, "You don't have to pay, it's free!");
      assert(!isPaid, "You already paid!");
      this.setPaid(author);
      isPaid = true;
      this.updatePaidAmount(deposit);
    }

    let itemsList = list.split(',');

    if (!isPaid && !this.freeToAll) {
      assert(itemsList.length <= this.itemLimit, "You have to pay some price!");
    }

    let map = new Map<string, bool>();
    for (let i = 0; i < itemsList.length; ++i) {
      map.set(itemsList[i].trim(), false);
    }

    let todo = new Todo(author, title.trim(), map);
    assert(this.saveTodoList(todo), `There is already same todo list name ${todo.title}!`);
    return `Todo list ${title.trim()} successfully saved for a accountID ${author}!`
  }

  @mutateState()
  update(title: string, list: string = ""): void {
    let todosMap = new PersistentMap<AccountId, Array<Todo>>("todos");
    const author = Context.sender;

    const deposit = Context.attachedDeposit;
    this.assertFinancialSafetyLimits(deposit);
    assert(deposit == u128.Zero, "Method doesn't accept money!");

    let itemsList = list.split(',');
    let todos = this.getTodoList(author);
    let titleExist: bool = false;
    if (todos != null) {
      if (todos.length > 0) {
        for (let i = 0; i < todos.length; ++i) {
          if (todos[i].title == title.trim()) {
            titleExist = true;
            let keys = todos[i].list.keys();
            for (let j = 0; j < keys.length; ++j) {
              if (list.length > 0) {
                for (let k = 0; k < itemsList.length; ++k) {
                  if (itemsList[k].trim() == keys[j]) {
                    todos[i].list.set(keys[j], true);
                  }
                }
              } else {
                todos[i].list.set(keys[j], true);
              }
            }
          }
        }
        assert(titleExist, `There is no title ${title.trim()}!`);
        todosMap.set(author, todos);
      } else {
        assert(todos.length > 0, "There are no todo list to delete!");
      }
    }
    assert(todos != null, "There are no todo list to update!");
  }

  @mutateState()
  delete(title: string, list: string = ""): void {
    let todosMap = new PersistentMap<AccountId, Array<Todo>>("todos");
    const author = Context.sender;

    const deposit = Context.attachedDeposit;
    this.assertFinancialSafetyLimits(deposit);
    assert(deposit == u128.Zero, "Method doesn't accept money!");

    let itemsList = list.split(',');
    let todos = this.getTodoList(author);
    let titleExist: bool = false;
    if (todos != null) {
      if (todos.length > 0) {
        for (let i = 0; i < todos.length; ++i) {
          if (todos[i].title == title.trim()) {
            titleExist = true;
            if (list.length == 0) {
              todos.splice(i, 1);
            } else {
              let keys = todos[i].list.keys();
              for (let j = 0; j < keys.length; ++j) {
                for (let k = 0; k < itemsList.length; ++k) {
                  if (itemsList[k].trim() == keys[j]) {
                    todos[i].list.delete(keys[j]);
                  }
                }
              }
            }
          }
        }
        assert(titleExist, `There is no title ${title.trim()}!`);
        todosMap.set(author, todos);
      } else {
        assert(todos.length > 0, "There are no todo list to delete!");
      }
    }
    assert(todos != null, "There are no todo list to delete!");
  }

  @mutateState()
  setFree(): void {
    this.assertOwner();
    this.freeToAll = true;
  }

  //Private methods
  private transfer(): void {
    const to_self = Context.contractName;
    const to_owner = ContractPromiseBatch.create(this.owner);

    const promise = to_owner.transfer(this.totalPaidAmount)
    promise.then(to_self).function_call("on_transfer_complete", '{}', u128.Zero, XCC_GAS)
  }

  private isPaid(accountId: AccountId): bool {
    let paid = new PersistentSet<AccountId>("payed");
    return paid.has(accountId)
  }

  private setPaid(accountId: AccountId): void {
    let paid = new PersistentSet<AccountId>("payed");
    paid.add(accountId);
  }

  private updatePaidAmount(deposit: u128): void {
    this.totalPaidAmount = u128.add(this.totalPaidAmount, deposit);
    if (u128.ge(this.totalPaidAmount, this.paidAmountLimit)) {
      this.transfer();
      this.freeToAll = true;
    }
  }

  private saveTodoList(todo: Todo): bool {
    let todos = new PersistentMap<AccountId, Array<Todo>>("todos");
    let todoList = this.getTodoList(todo.author);
    if (todoList !== null) {
      if (!this.todoListNotExists(todoList, todo.title)) {
        return false
      }
      todoList.push(todo);
      todos.set(todo.author, todoList);
    } else {
      let newTodolist = new Array<Todo>();
      newTodolist.push(todo);
      todos.set(todo.author, newTodolist);
    }
    return true
  }

  private getTodoList(accountId: AccountId): Array<Todo> | null {
    let todos = new PersistentMap<AccountId, Array<Todo>>("todos");
    return todos.get(accountId)
  }

  private todoListNotExists(todos: Array<Todo>, title: string): bool {
    let notExist: bool = true;
    for (let i = 0; i < todos.length; ++i) {
      if (todos[i].title == title) {
        notExist = false;
      }
    }
    return notExist;
  }

  private assertFinancialSafetyLimits(deposit: u128): void {
    assert(u128.le(deposit, CONTRIBUTION_SAFETY_LIMIT), `You are trying to attach too many NEAR Tokens to this call. There is a safe limit while in beta of ${CONTRIBUTION_SAFETY_LIMIT} NEAR`);
  }

  private assertOwner(): void {
    const caller = Context.predecessor;
    assert(this.owner == caller, "Only the owner of this contract may call this method");
  }
}
