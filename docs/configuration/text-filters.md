---
title: 'Text Filters'
---

# Text Filters

As well as supporting configuraiton of filtering through a popup menu, there is the ability to filter items by a simple text input. The following outlines the available syntax for different filtering options.

## Overview

The following rules are used across all text search types:

- _String Splitting :_ A single text filtering string is split into multiple filters split by a space (i.e. `searchA account:searchB` would search for `searchA` and `account:searchB`). If there is the desire to filter an item that has a space in it, then quotes can be used (i.e. `search A" account:"search B` would search for `search A` and `account:"search B"`).
- _Prefixes :_ For each type of filtering ther are different _prefixes_ wchih can be used (outlined below). For example `account:search` would search the account name for `search`.
- _Exclude :_ Putting a `!` in front of a search inverts the search. So `!account:search` would search for account names that _don't_ include `search`
- _Default Action :_ For any search item that doesn't have a prefix, there will be a default action applied. There is also a defaut action for search items that don't have an existing prefix, and start with a `!`.
- _Multiple Of Same Prefix :_ When there are multiple of the same prefix or action, then the way this is handled depends on the prefix / action.
- _Boolean Prefix :_ Some filters are a boolean (yes / no) filter. For these items the filter prefix and exclude filter prefix are used (i.e. `cash:` and `!cash:`), rather than writing true or false (i.e. `cash:true` and `cash:false`). Any text written after the colon is ignored (i.e. `cash:false` and `cash:cash` is the same as `cash:`)
- _Case Sensitivity :_ All text filters are case insensitive.
- _Filter Wildcards :_ Wildcards can be used in string filters that align with the underlying database (postgres). The following wildcards are supported:
  - `%` : Any number of characters (including none)
  - `_` : Any single character
- _Range Filters :_ For filters which are filtering within a range (i.e. `max:` and `min:`), the `!` vresion of this doesn't make sense. So the `!` version of htese filters will function that same with or without the `!` (i.e. `!max:100` and `max:100` will both filter for items with a maximum of 100).

## Journals

| Prefix           | Default |     Format / Options      | Search Function                                                                              | Duplicates       |
| ---------------- | :-----: | :-----------------------: | -------------------------------------------------------------------------------------------- | ---------------- |
| **description:** |   `Y`   |         `string`          | Journal Description                                                                          | or'ed together   |
| **max:**         |         |         `number`          | Maximum journal amount                                                                       | Minimum is used. |
| **min:**         |         |         `number`          | Minimum journal amount                                                                       | Maximum is used. |
| **linked:**      |         |         `boolean`         | Journal is "linked"                                                                          | Last is used     |
| **reconciled:**  |         |         `boolean`         | Journal is reconciled                                                                        | Last is used     |
| **checked:**     |         |         `boolean`         | Journal has had data checked                                                                 | Last is used     |
| **complete:**    |         |         `boolean`         | Journal is complete                                                                          | Last is used     |
| **transfer:**    |         |         `boolean`         | Journal is part of a transfer                                                                | Last is used     |
| **note:**        |         |         `boolean`         | The transaction has at least one [note](./notesfiles#notes) linked to it.                    | Last is used     |
| **reminder:**    |         |         `boolean`         | The transaction has at least one [note](./notesfiles#notes) that is a reminder linked to it. | Last is used     |
| **file:**        |         |         `boolean`         | The transaction has at least one [file](./notesfiles#files) linked to it.                    | Last is used     |
| **before:**      |         | `YYYY-MM-DD` or `YY-M-DD` | Journal date is before date                                                                  | earliest is used |
| **after:**       |         | `YYYY-MM-DD` or `YY-M-DD` | Journal date is after date                                                                   | latest is used   |
| **month:**       |         |    `YYYY-MM` or `YY-M`    | Journal date is in chosen month                                                              | or'ed together   |
| **payee:**       |         |         `string`          | At least one of the linked journal entries in the same transaction has a payee title.        | or'ed together   |

### Linked Items

For linked items (`account`, `bill`, `budget`, `category`, `tag`, `label`), using the text before the search term for that item will search the related item. For example `accounttype:asset` will return all journals with an account that is an asset account. The inversion of this is also possible, so `!accounttype:asset` will return all journals with an account that is not an asset account.

The linked item title without another filter will use the default search for that item. For example `account:search` is the same as `accountdescription:search`, and `!account:search` is the same as `!accountdescription:search`.

Because of the way the filtering works, it is possible to have some unusual filters such as `!account!type:asset` which will return journals that don't have an account that isn't an asset. Also `!accounttype:asset` and `account!type:asset` will return the same results.

### Shorthand Filters

For simpler searches fpr common linked items searches there are shorthands as shown below:

- `cash:` -> `accountcash:`
- `!cash:` -> `account!cash:`
- `type:` -> `accounttype:`
- `!type:` -> `account!type:`
- `networth:` -> `accountnetworth:`
- `!networth:` -> `account!networth:`
- `nw:` -> `accountnetworth:`
- `!nw:` -> `account!networth:`

## Accounts

Accounts have the following search options, as well as the [summary items](#summary-filters)

| Prefix              | Default |                               Format / Options                               | Search Function                                                              | Duplicates     |
| ------------------- | :-----: | :--------------------------------------------------------------------------: | ---------------------------------------------------------------------------- | -------------- |
| **id:**             |   `Y`   |                                   `string`                                   | Item ID                                                                      | or'ed together |
| **title:**          |   `Y`   |                                   `string`                                   | Account Name                                                                 | or'ed together |
| **titlecombined:**  |   `Y`   |                                   `string`                                   | Account Name and Group Combined                                              | or'ed together |
| **group:**          |         |                                   `string`                                   | Account Group Title search (combination of Group 1 / Group 2 / Group 3)      | or'ed together |
| **group1:**         |         |                                   `string`                                   | Account Group 1 Title search                                                 | or'ed together |
| **group2:**         |         |                                   `string`                                   | Account Group 2 Title search                                                 | or'ed together |
| **group3:**         |         |                                   `string`                                   | Account Group 3 Title search                                                 | or'ed together |
| **type:**           |         | `asset` `liability` `income` or `expense` (Can be combined with `,` or `\|`) | Account Type search                                                          | or'ed together |
| **cash:**           |         |                                  `boolean`                                   | Account is a cash account                                                    | Last is used   |
| **networth:**       |         |                                  `boolean`                                   | Account is a net worth account                                               | Last is used   |
| **startafter:**     |         |         `YYYY-MM-DD` or `YY-M-DD` (Can be combined with `,` or `\|`)         | Account Start Date is after date                                             | Last is used   |
| **startbefore:**    |         |         `YYYY-MM-DD` or `YY-M-DD` (Can be combined with `,` or `\|`)         | Account Start Date is before date                                            | Last is used   |
| **endafter:**       |         |         `YYYY-MM-DD` or `YY-M-DD` (Can be combined with `,` or `\|`)         | Account End Date is after date                                               | Last is used   |
| **endbefore:**      |         |         `YYYY-MM-DD` or `YY-M-DD` (Can be combined with `,` or `\|`)         | Account End Date is before date                                              | Last is used   |
| **status:**         |         |                            `active` / `disabled`                             | Account status matches term                                                  | or'ed together |
| **active:**         |         |                                  `boolean`                                   | Account is active                                                            | Last is used   |
| **disabled:**       |         |                                  `boolean`                                   | Account is disabled                                                          | Last is used   |
| **allowUpdate:**    |         |                                  `boolean`                                   | Account allows update                                                        | Last is used   |
| **importId:**       |         |                                   `string`                                   | Import ID matches value                                                      | or'ed together |
| **importDetailId:** |         |                                   `string`                                   | Import Detail ID matches value                                               | or'ed together |
| **note:**           |         |                                  `boolean`                                   | Has at least one [note](./notesfiles#notes) linked to it.                    | Last is used   |
| **reminder:**       |         |                                  `boolean`                                   | Has at least one [note](./notesfiles#notes) that is a reminder linked to it. | Last is used   |
| **file:**           |         |                                  `boolean`                                   | Has at least one [file](./notesfiles#files) linked to it.                    | Last is used   |

## Bills, Budgets, Labels

Bills, Budgets and Labels have the following search options, as well as the [summary items](#summary-filters)

| Prefix              | Default |   Format / Options    | Search Function                                                              | Duplicates     |
| ------------------- | :-----: | :-------------------: | ---------------------------------------------------------------------------- | -------------- |
| **id:**             |   `Y`   |       `string`        | Item ID                                                                      | or'ed together |
| **title:**          |   `Y`   |       `string`        | Combined Title                                                               | or'ed together |
| **status:**         |         | `active` / `disabled` | Account status matches term                                                  | or'ed together |
| **active:**         |         |       `boolean`       | Account is active                                                            | Last is used   |
| **disabled:**       |         |       `boolean`       | Account is disabled                                                          | Last is used   |
| **allowUpdate:**    |         |       `boolean`       | Account allows update                                                        | Last is used   |
| **importId:**       |         |       `string`        | Import ID matches value                                                      | or'ed together |
| **importDetailId:** |         |       `string`        | Import Detail ID matches value                                               | or'ed together |
| **note:**           |         |       `boolean`       | Has at least one [note](./notesfiles#notes) linked to it.                    | Last is used   |
| **reminder:**       |         |       `boolean`       | Has at least one [note](./notesfiles#notes) that is a reminder linked to it. | Last is used   |
| **file:**           |         |       `boolean`       | Has at least one [file](./notesfiles#files) linked to it.                    | Last is used   |

## Categories, Tags

Categories and Tags have the following search options, as well as the [summary items](#summary-filters)

| Prefix              | Default |   Format / Options    | Search Function                                                              | Duplicates     |
| ------------------- | :-----: | :-------------------: | ---------------------------------------------------------------------------- | -------------- |
| **id:**             |   `Y`   |       `string`        | Item ID                                                                      | or'ed together |
| **title:**          |   `Y`   |       `string`        | Combined Title                                                               | or'ed together |
| **group:**          |         |       `string`        | Group Title                                                                  | or'ed together |
| **single:**         |         |       `string`        | Single Title                                                                 | or'ed together |
| **status:**         |         | `active` / `disabled` | Account status matches term                                                  | or'ed together |
| **active:**         |         |       `boolean`       | Account is active                                                            | Last is used   |
| **disabled:**       |         |       `boolean`       | Account is disabled                                                          | Last is used   |
| **allowUpdate:**    |         |       `boolean`       | Account allows update                                                        | Last is used   |
| **importId:**       |         |       `string`        | Import ID matches value                                                      | or'ed together |
| **importDetailId:** |         |       `string`        | Import Detail ID matches value                                               | or'ed together |
| **note:**           |         |       `boolean`       | Has at least one [note](./notesfiles#notes) linked to it.                    | Last is used   |
| **reminder:**       |         |       `boolean`       | Has at least one [note](./notesfiles#notes) that is a reminder linked to it. | Last is used   |
| **file:**           |         |       `boolean`       | Has at least one [file](./notesfiles#files) linked to it.                    | Last is used   |

## Summary Filters

The following are available on the linked item lists (i.e. account, bill etc...), and can only be used in the item specific filtering as these don't work as nested filtering for journal filtering.

These filters filter the list based on aggregate data (sum, count, max date, min date) from journals associated with the linked item.

| Prefix        | Default |     Format / Options      | Search Function                      | Duplicates |
| ------------- | :-----: | :-----------------------: | ------------------------------------ | ---------- |
| **min:**      |         |         `number`          | Sum of journal entries minimum value | max        |
| **max:**      |         |         `number`          | Sum of journal entries maximum value | min        |
| **mincount:** |         |         `number`          | Minimum count of journal entries     | max        |
| **maxcount:** |         |         `number`          | Maximum count of journal entries     | min        |
| **minlast:**  |         | `YYYY-MM-DD` or `YY-M-DD` | Minimum last journal entry date      | min        |
| **maxlast:**  |         | `YYYY-MM-DD` or `YY-M-DD` | Maximum last journal entry date      | max        |
| **minfirst:** |         | `YYYY-MM-DD` or `YY-M-DD` | Minimum first journal entry date     | min        |
| **maxfirst:** |         | `YYYY-MM-DD` or `YY-M-DD` | Maximum first journal entry date     | max        |
