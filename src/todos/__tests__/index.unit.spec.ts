import { u128, VMContext } from "near-sdk-as";
import { ONE_NEAR } from "../../utils";
import { Contract } from "../assembly";

let contract: Contract;
const user = "bob";
const owner = "alice";

beforeEach(() => {
  VMContext.setCurrent_account_id(user);
  VMContext.setAccount_balance(ONE_NEAR); // resolves HostError(BalanceExceeded)
  VMContext.setSigner_account_id(user);
  VMContext.setAttached_deposit(u128.mul(ONE_NEAR, u128.from(0)));
  contract = new Contract(owner);
})

describe("Contract", () => {
  // VIEW method tests
  it("can be initialized with owner", () => {
    expect(contract.getOwner()).toBe(owner);
  });

  it("empty todos", () => {
    expect(contract.getTodos(user)).toStrictEqual("You don't have any todo list created!");
    expect(contract.getTodoTitles(user)).toStrictEqual("You don't have any todo list created!");
    expect(() => { contract.update("title1", "item1"); }).toThrow("There are no todo list to update!");
    expect(() => { contract.delete("title1", "item1"); }).toThrow("There are no todo list to delete!");
  });

  it("get test", () => {
    expect(contract.getTodos(user, "title")).toStrictEqual("You don't have any todo list created!");
    expect(contract.getTodos(user, "title", "false")).toStrictEqual("You don't have any todo list created!");
    expect(contract.getTodos(user, "title", "true")).toStrictEqual("You don't have any todo list created!");
    expect(contract.getTodos(user)).toStrictEqual("You don't have any todo list created!");
    expect(contract.create("title1", "item1")).toBe("Todo list title1 successfully saved for a accountID bob!");
    expect(contract.getTodoTitles(user)).toBe("titles: title1");
    expect(contract.getTodos(user)).toStrictEqual("--title title1 --items item: item1 done: false");
    expect(contract.getTodos(user, "title1", "false")).toStrictEqual("--title title1 --items item: item1 done: false");
    expect(contract.getTodos(user, "title1", "true")).toStrictEqual("--title title1 --items");
    expect(contract.getTodos(user, "title1")).toStrictEqual("--title title1 --items item: item1 done: false");
    expect(contract.getTodos(user, "", "false")).toStrictEqual("--title title1 --items item: item1 done: false");
    expect(contract.create("title2", "item2")).toBe("Todo list title2 successfully saved for a accountID bob!");
    expect(contract.getTodos(user)).toStrictEqual("--title title1 --items item: item1 done: false --title title2 --items item: item2 done: false");
  });

  // WRITE method tests
  it("create test", () => {
    expect(contract.create("title1", "item1")).toBe("Todo list title1 successfully saved for a accountID bob!");
    expect(() => { contract.create("title1", "item1,item2") }).toThrow("There is already same todo list name title1!");
    expect(() => { contract.create("title2", "item1,item2,item3") }).not.toThrow();
    expect(() => { contract.create("title3", "item1,item2,item3,item4,item5,item6") }).toThrow("You have to pay some price!");

    expect(contract.getIsFree()).toStrictEqual("It's not yet free to all!");
    VMContext.setAttached_deposit(u128.mul(ONE_NEAR, u128.from(6)));
    expect(contract.create("title3", "item1,item2,item3,item4,item5,item6")).toBe("Todo list title3 successfully saved for a accountID bob!");
    VMContext.setAttached_deposit(u128.mul(ONE_NEAR, u128.from(1)));
    expect(() => { contract.create("title4", "item1,item2,item3,item4,item5,item6") }).toThrow("You already paid!");
    VMContext.setAttached_deposit(u128.mul(ONE_NEAR, u128.from(11)));
    expect(() => { contract.create("title4", "item1,item2,item3,item4,item5,item6") }).toThrow("You are trying to attach too many NEAR Tokens to this call. There is a safe limit while in beta of 10 NEAR");

    expect(contract.getTotalPaidAmount()).toStrictEqual("Total paid amount: 6000000000000000000000000");
    expect(contract.getIsFree()).toStrictEqual("It's free to all!");

    expect(contract.getItemLimit()).toStrictEqual("Item limit: 5");
    expect(contract.getPaidAmountLimit()).toStrictEqual("Paid amount limit: 5000000000000000000000000");

    VMContext.setSigner_account_id(owner);
    VMContext.setCurrent_account_id(owner);
    expect(() => { contract.create("title5", "item1,item2,item3,item4,item5,item6") }).toThrow("You don't have to pay, it's free!");
    VMContext.setAttached_deposit(u128.from(0));
    expect(contract.create("title5", "item1,item2,item3,item4,item5,item6")).toBe("Todo list title5 successfully saved for a accountID alice!");
  });

  it("create test free to all", () => {
    expect(() => { contract.create("title1", "item1,item2,item3,item4,item5,item6") }).toThrow("You have to pay some price!");
    VMContext.setPredecessor_account_id(owner);
    contract.setFree();
    expect(contract.create("title1", "item1,item2,item3,item4,item5,item6")).toBe("Todo list title1 successfully saved for a accountID bob!");
  });

  it("update test", () => {
    expect(contract.create("title1", "item1")).toBe("Todo list title1 successfully saved for a accountID bob!");
    expect(contract.getTodos(user, "title1")).toStrictEqual("--title title1 --items item: item1 done: false");
    contract.update("title1", "item1");
    expect(contract.getTodos(user, "title1")).toStrictEqual("--title title1 --items item: item1 done: true");
    expect(() => { contract.update("title2", "item1"); }).toThrow("There is no title title2!");

    expect(contract.create("title2", "item2")).toBe("Todo list title2 successfully saved for a accountID bob!");
    expect(contract.getTodos(user, "title2")).toStrictEqual("--title title2 --items item: item2 done: false");
    contract.update("title2");
    expect(contract.getTodos(user, "title2")).toStrictEqual("--title title2 --items item: item2 done: true");

    VMContext.setAttached_deposit(u128.mul(ONE_NEAR, u128.from(1)));
    expect(() => { contract.update("title1", "item2"); }).toThrow("Method doesn't accept money!");

    expect(() => { contract.update("title3"); }).toThrow("There is no title title3!");
  });

  it("delete test", () => {
    expect(contract.create("title1", "item1,item2,item3")).toBe("Todo list title1 successfully saved for a accountID bob!");
    expect(contract.getTodos(user, "title1")).toStrictEqual("--title title1 --items item: item1 done: false item: item2 done: false item: item3 done: false");
    contract.delete("title1", "item1");
    expect(contract.getTodos(user, "title1")).toStrictEqual("--title title1 --items item: item2 done: false item: item3 done: false");
    expect(() => { contract.delete("title1") }).not.toThrow();
    expect(contract.getTodos(user, "title1")).toStrictEqual("You don't have any todo list created!");
    expect(() => { contract.delete("title1", "item1") }).toThrow("There are no todo list to delete!");

    expect(contract.create("title1", "item1,item2,item3")).toBe("Todo list title1 successfully saved for a accountID bob!");
    VMContext.setAttached_deposit(u128.mul(ONE_NEAR, u128.from(1)));
    expect(() => { contract.delete("title1", "item2"); }).toThrow("Method doesn't accept money!");

    VMContext.setAttached_deposit(u128.mul(ONE_NEAR, u128.from(0)));
    expect(contract.create("title2", "item1,item2,item3")).toBe("Todo list title2 successfully saved for a accountID bob!");
    expect(contract.create("title3", "item1,item2,item3")).toBe("Todo list title3 successfully saved for a accountID bob!");
    contract.delete("title2");
    expect(() => { contract.delete("title2", "item1") }).toThrow("There is no title title2!");
  });
});
