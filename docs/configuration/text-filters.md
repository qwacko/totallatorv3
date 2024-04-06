---
title: 'Text Filters 🚧'
---

# Text Filters 🚧

As well as supporting configuraiton of filtering through a popup menu, there is the ability to filter items by a simple text input. The following outlines the available syntax for different filtering options.

## Overview

The following rules are used across all text search types:

- _String Splitting :_ A single text filtering string is split into multiple filters split by a space (i.e. `searchA account:searchB` would search for `searchA` and `account:searchB`). If there is the desire to filter an item that has a space in it, then quotes can be used (i.e. `search A" account:"search B` would search for `search A` and `account:"search B"`).
- _Prefixes :_ For each type of filtering ther are different _prefixes_ wchih can be used (outlined below). For example `account:search` would search the account name for `search`.
- _Exclude :_ Putting a `!` in front of a search inverts the search. So `!account:search` would search for account names that _don't_ include `search`
- _Default Action :_ For any search item that doesn't have a prefix, there will be a default action applied. There is also a defaut action for search items that don't have an existing prefix, and start with a `!`.
- _Multiple Of Same Prefix :_ When there are multiple of the same prefix or action, then the way this is handled depends on the prefix / action.
- _Boolean Prefix :_ Some filters are a boolean (yes / no) filter. For these items the filter prefix and exclude filter prefix are used (i.e. `cash:` and `!cash:`), rather than writing true or false (i.e. `cash:true` and `cash:false`). Any text written after the colon is ignored (i.e. `cash:false` and `cash:cash` is the same as `cash:`)

## Journals

| Prefix           | Default |                               Format / Options                               | Search Function                        | Duplicates       |
| ---------------- | :-----: | :--------------------------------------------------------------------------: | -------------------------------------- | ---------------- |
| **description:** |   `Y`   |                                   `string`                                   | Journal Description (case insensitive) | or'ed together   |
| **max:**         |         |                                   `number`                                   | Maximum journal amount                 | Maximum is used. |
| **min:**         |         |                                   `number`                                   | Minimum journal amount                 | Minimum is used. |
| **linked:**      |         |                                  `boolean`                                   | Journal is "linked"                    | Last is used     |
| **reconciled:**  |         |                                  `boolean`                                   | Journal is reconciled                  | Last is used     |
| **checked:**     |         |                                  `boolean`                                   | Journal has had data checked           | Last is used     |
| **complete:**    |         |                                  `boolean`                                   | Journal is complete                    | Last is used     |
| **transfer:**    |         |                                  `boolean`                                   | Journal is part of a transfer          | Last is used     |
| **before:**      |         |                          `YYYY-MM-DD` or `YY-M-DD`                           | Journal date is before date            | earliest is used |
| **after:**       |         |                          `YYYY-MM-DD` or `YY-M-DD`                           | Journal date is after date             | latest is used   |
| **month:**       |         |                             `YYYY-MM` or `YY-M`                              | Journal date is in chosen month        | or'ed together   |
| **bill:**        |         |                                   `string`                                   | Journal Bill Title search              | or'ed together   |
| **budget:**      |         |                                   `string`                                   | Journal Budget Title search            | or'ed together   |
| **category:**    |         |                                   `string`                                   | Journal Category Title search          | or'ed together   |
| **tag:**         |         |                                   `string`                                   | Journal Tag Title search               | or'ed together   |
| **label:**       |         |                                   `string`                                   | Journal Label Title search             | or'ed together   |
| **account:**     |         |                                   `string`                                   | Journal Account Title search           | or'ed together   |
| **type:**        |         | `asset` `liability` `income` or `expense` (Can be combined with `,` or `\|`) | Journal Account Type search            | or'ed together   |
| **group:**       |         |                                   `string`                                   | Journal Account Group search           | or'ed together   |
| **cash:**        |         |                                  `boolean`                                   | Journal Account is a cash account      | Last is used     |
| **networth:**    |         |                                  `boolean`                                   | Journal Account is a net worth account | Last is used     |

::: warning
Work In Progresss
:::
