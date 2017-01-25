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

  _registrar(property) {
    return function (action, hookFn) {
      this._validateRegistrar(action, hookFn);

      if (!this[property])
        this[property] = {};

      if (!this[property][action])
        this[property][action] = [];

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
    return function perform(action, ...args) {
      this._validateAction(action);
      const work = this._getWorkArgsAndFn(args);

      function iterate(self, interceptors, result, after) {
        if (!interceptors) {
          return Promise.try(_ => after(result));
        }

        interceptors = [...interceptors];

        let i = 0;
        const len = interceptors.length;

        if (!len) {
          return Promise.try(_ => after(result));
        }

        function nextInterceptor(waterfallResult) {
          if (i === len) {
            return Promise.try(_ => after(waterfallResult));
          }

          else if (i < len) {
            const interceptor = interceptors[i++];

            return Promise.try(_ => interceptor(
              waterfall ? waterfallResult : result
            ))
            .then(nextInterceptor);
          }
        }

        return nextInterceptor(result);
      }

      function executePerform(waterfallArgs) {
        const self = this;
        let performArgs = waterfall ? waterfallArgs : work.args;

        return Promise.try(_ => work.fn(performArgs))
        .then(function (performResult) {
          let afterArg = waterfall ? performResult : work.args;

          return iterate(
            self,
            self._after_interceptors && self._after_interceptors[action],
            afterArg,
            afterResult => waterfall ? afterResult : performResult
          );
        });
      }

      return iterate(
        this,
        this._before_interceptors && this._before_interceptors[action],
        work.args,
        executePerform.bind(this)
      );
    };
  }

  _validateAction(action) {
    if (typeof action !== "string") {
      throw new Error("action must be a string");
    }
  }

  _getWorkArgsAndFn(args) {
    const work = {};

    if (args.length === 2) {
      [work.args, work.fn] = args;
    }

    else if (args.length === 1) {
      [work.fn] = args;
    }

    if (typeof work.fn !== "function"){
      throw new Error("workFn must be a function");
    }

    return work;
  }
};
