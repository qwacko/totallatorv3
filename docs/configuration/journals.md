---
title: 'Journals 🚧'
---

# Journals 🚧

## Status

Each journal can be have the following status set:

- `reconciled` - This is intended to be set when the journal has been reconciled with the bank statement.
- `checked` - This is intended to be used when the journal data (i.e. description / tag / category etc...) have been checked.
- `complete` - This is intended to be used when the journal is complete and no further changes are expected. When a journal is set to `complete` then it is also set to `checked` and `reconciled`. Once complete, the only updates allowed to a journal are to change the status back to `incomplete` or update labels.

The user is free to use these statuses as they see fit, but the above is the intended use.

::: warning
Work In Progresss
:::
