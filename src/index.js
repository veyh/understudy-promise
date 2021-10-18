import Promise from "bluebird";

module.exports = class UnderstudyPromise {
  constructor() {
    this.perform = this._performer(false);
    this.waterfall = this._performer(true);
    this.after = this._registrar("_after_interceptors");
    this.before = this._registrar("_before_interceptors");
    this._before_interceptors = null;
    this._after_interceptors = null;
  }

  unregister(action, func) {
    for (const property of ["_before_interceptors", "_after_interceptors"]) {
      if (this[property] && this[property][action]) {
        this[property][action] = this[property][action].filter(f => f !== func);
      }
    }
  }

  unregisterAll(action) {
    if (!action) {
      this._before_interceptors = null;
      this._after_interceptors = null;
      return;
    }

    for (const property of ["_before_interceptors", "_after_interceptors"]) {
      if (this[property]) {
        delete this[property][action];
      }
    }
  }

  _registrar(property) {
    return (action, hookFn) => {
      this._validateRegistrar(action, hookFn);

      if (!this[property]) {
        this[property] = {};
      }

      if (!this[property][action]) {
        this[property][action] = [];
      }

      let interceptors = this[property][action];
      interceptors.push(hookFn);
    };
  }

  _validateRegistrar(action, hookFn) {
    if (typeof action !== "string") {
      throw new Error("action must be a string");
    }

    if (typeof hookFn !== "function") {
      throw new Error("hookFn must be a function");
    }
  }

  _performer(waterfall) {
    const perform = (action, ...args) => {
      this._validateAction(action);
      const work = this._getWorkArgsAndFn(args);

      const iterate = (interceptors, result, after) => {
        if (!interceptors) {
          return Promise.try(_ => after(result));
        }

        interceptors = [...interceptors];

        let i = 0;
        const len = interceptors.length;

        if (!len) {
          return Promise.try(_ => after(result));
        }

        const nextInterceptor = (waterfallResult) => {
          if (i < len) {
            const interceptor = interceptors[i++];

            return Promise.try(_ => interceptor(
              waterfall ? waterfallResult : result
            ))
            .then(nextInterceptor);
          }

          return Promise.try(_ => after(waterfallResult));
        };

        return nextInterceptor(result);
      };

      const executePerform = (waterfallArgs) => {
        let performArgs = waterfall ? waterfallArgs : work.args;

        return Promise.try(_ => work.fn(performArgs))
        .then((performResult) => {
          let afterArg = waterfall ? performResult : work.args;

          return iterate(
            this._after_interceptors && this._after_interceptors[action],
            afterArg,
            afterResult => waterfall ? afterResult : performResult
          );
        });
      };

      return iterate(
        this._before_interceptors && this._before_interceptors[action],
        work.args,
        executePerform
      );
    };

    return perform;
  }

  _validateAction(action) {
    if (typeof action !== "string") {
      throw new Error("action must be a string");
    }
  }

  _getWorkArgsAndFn(args) {
    const work = {
      fn: noop,
    };

    if (args.length === 2) {
      [work.args, work.fn] = args;
    }

    else if (args.length === 1) {
      if (typeof args[0] === "function") {
        work.fn = args[0];
      }

      else {
        work.args = args[0];
      }
    }

    return work;
  }
};

function noop() {}
