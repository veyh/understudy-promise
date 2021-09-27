# understudy-promise

Based on [understudy](https://github.com/bmeck/understudy) v4.1.0.

## Differences

- There is only one argument to the hooks. If you need multiple arguments, pass in arrays or objects. The argument is also passed to the perform function.
- When using waterfall, the result of the before hook function chain is passed down to the perforn function.
- There is no callback to either .perform or .waterfall. They return promises, so use .then and .catch. Errors thrown when there is no .catch are **not** ignored.
- Additional API for removing hooks: `unregister(action, func)` to remove a single hook and `unregisterAll([action])` to remove many.
