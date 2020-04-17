# Contributing

Please be sure to read the contribution guidelines before making or requesting a change.

## Filing Issues

While filing issues, please kindly provide a small data set so that tests can be tailed to tackle your specific situation. This makes the issue clearer, and saves time on crafting test data.

## Contributing Code

Please submit PR against the `dev` branch. Any PR to `master` will be rejected. Also, please make sure to update/rebase your branch before submitting PR.

This library uses [prettier](https://www.npmjs.com/package/prettier) to control coding style. It is hooked to pre-commit script.

The library requires 100% test coverage. Any new pieces of codes must have corresponding tests.

This library requires full documentation coverage. Everything must have doc comments, even for private and protected members. There are a few exceptions to this:

- Commonly used functions with exact same definition, such as `toString()`, `toLocaleString()`, etc.
- Constructors without parameters, or whose parameters are well documented on their own. Such as the constructor of `XmlWrapper`'.
- String constants used as messages. Such error messages from `Exception`.
