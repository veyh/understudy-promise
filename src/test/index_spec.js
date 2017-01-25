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
});
