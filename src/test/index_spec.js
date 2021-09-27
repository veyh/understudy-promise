import chai, { expect } from "chai";
chai.use(require("chai-as-promised"));
import sinon from "sinon";
chai.use(require("sinon-chai"));
import Promise from "bluebird";
require("sinon-as-promised")(Promise);

import UnderstudyPromise from "../";

describe("shared/utils/understudy-promise", function () {
  it("modifies arguments with .waterfall", function () {
    const actor = new UnderstudyPromise;
    const originalUser = { name: "user", password: "pass" };

    actor.before("user-save", (user) => {
      expect(user).to.eql({ name: "user", password: "pass" });
      return { ...user, name: user.name.toUpperCase() };
    });

    actor.before("user-save", (user) => {
      expect(user).to.eql({ name: "USER", password: "pass" });
      return { ...user, password: user.password.toUpperCase() };
    });

    const createUser = () => {
      const user = { name: "user", password: "pass" };

      return actor.waterfall("user-save", user, user => {
        expect(user).to.eql({ name: "USER", password: "PASS" });
        return user;
      });
    };

    actor.after("user-save", (user) => {
      expect(user).to.eql({ name: "USER", password: "PASS" });
      return { ...user, name: user.name.toLowerCase() };
    });

    actor.after("user-save", (user) => {
      expect(user).to.eql({ name: "user", password: "PASS" });
      return { ...user, password: user.password.toLowerCase() };
    });

    actor.after("user-save", (user) => {
      expect(user).to.eql({ name: "user", password: "pass" });
      return { ...user, password: "pass2" };
    });

    return createUser()
    .then(user => {
      expect(user).to.eql({ name: "user", password: "pass2" });
    });
  });

  it("returns work result with .perform", function () {
    const actor = new UnderstudyPromise;

    const arg = { a: 1, b: 2 };
    const result = "hello";

    actor.before("work", _arg => {
      expect(_arg).to.eql(arg);
    });

    actor.after("work", _arg => {
      expect(_arg).to.eql(arg);
    });

    return actor.perform("work", arg, function () {
      return Promise.resolve(result);
    })
    .then(res => {
      expect(res).to.eql(result);
    });
  });

  it("short-circuits on before hook error", function () {
    const actor = new UnderstudyPromise;
    const err = new Error("gg");
    const data = { a: 1, b: 2 };

    const firstHook = sinon.stub().returns(data);
    const performFn = sinon.stub();

    actor.before("work", firstHook);
    actor.before("work", _ => {
      throw err;
    });

    let caughtError;

    return actor.perform("work", data, performFn)
    .catch(err => {
      caughtError = err;
    })
    .then(_ => {
      expect(firstHook).to.have.been.called;
      expect(caughtError).to.eql(err);
      expect(performFn).to.not.have.been.called;
    });
  });

  it("short-circuits on after hook error", function () {
    const actor = new UnderstudyPromise;
    const err = new Error("gg");
    const data = { a: 1, b: 2 };

    const firstHook = sinon.stub().returns(data);
    const performFn = sinon.stub().returns(data);

    actor.after("work", firstHook);
    actor.after("work", _ => {
      throw err;
    });

    let caughtError;

    return actor.perform("work", data, performFn)
    .catch(err => {
      caughtError = err;
    })
    .then(_ => {
      expect(performFn).to.have.been.called;
      expect(firstHook).to.have.been.called;
      expect(caughtError).to.eql(err);
    });
  });

  it("supports removing a single hook", async function () {
    const actor = new UnderstudyPromise;
    const firstFn = sinon.stub();
    const secondFn = sinon.stub();
    const otherFn = sinon.stub();

    actor.after("foo", firstFn);
    actor.after("foo", secondFn);
    actor.after("other", otherFn);
    await actor.perform("foo", () => {});

    expect(firstFn.callCount).to.eql(1);
    expect(secondFn.callCount).to.eql(1);
    expect(otherFn.callCount).to.eql(0);

    actor.unregister("foo", firstFn);
    await actor.perform("foo", () => {});
    await actor.perform("other", () => {});

    expect(firstFn.callCount).to.eql(1);
    expect(secondFn.callCount).to.eql(2);
    expect(otherFn.callCount).to.eql(1);
  });

  it("supports removing all hooks for an action", async function () {
    const actor = new UnderstudyPromise;
    const firstFn = sinon.stub();
    const secondFn = sinon.stub();
    const otherFn = sinon.stub();

    actor.after("foo", firstFn);
    actor.after("foo", secondFn);
    actor.after("other", otherFn);
    await actor.perform("foo", () => {});

    expect(firstFn.callCount).to.eql(1);
    expect(secondFn.callCount).to.eql(1);
    expect(otherFn.callCount).to.eql(0);

    actor.unregisterAll("foo");
    await actor.perform("foo", () => {});
    await actor.perform("other", () => {});

    expect(firstFn.callCount).to.eql(1);
    expect(secondFn.callCount).to.eql(1);
    expect(otherFn.callCount).to.eql(1);
  });

  it("supports removing all hooks", async function () {
    const actor = new UnderstudyPromise;
    const firstFn = sinon.stub();
    const secondFn = sinon.stub();
    const otherFn = sinon.stub();

    actor.after("foo", firstFn);
    actor.after("foo", secondFn);
    actor.after("other", otherFn);

    actor.unregisterAll();
    await actor.perform("foo", () => {});
    await actor.perform("other", () => {});

    expect(firstFn.callCount).to.eql(0);
    expect(secondFn.callCount).to.eql(0);
    expect(otherFn.callCount).to.eql(0);
  });
});
