---
title: 'Auto-Import'
---

# Automatic Imports

Automatic Imports allow for the import process to reach out to external services and retrieve transaction information from them, and load them into your account journals history.

::: tip
It is best to make a separate automatic import for each account, even if the configuration is almost the same.
:::

## Sources

Currently supported import sources are:

- [SaltEdge](https://www.saltedge.com/) - Global coverage of differnt banks. Requires you to setup a developers account and add your bank accounts manually. [More Info](./salt-edge.md)
- [Akahu](https://www.akahu.nz/) - A New Zealand focused bank integration service. Requires the setup of an account. [More Info](./akahu.md)

## Behaviour / Process

Automatic importing follows the following sequence:

- _User Preparation_
  - User creates necessary accounts with providers.
  - Retrieve and input necessary credentials into auto import.
- _Built In Functionality_
  - Reach out to provider and retrieve the latest transactions (using user provided credentials)
  - Process and filter data based on user configuration (i.e. start date, target account etc..)
  - Create a new import with all the transactions added (applying import mapping configuration).
- _Normal Import Functionality (If Auto Process is true)_
  - Identify and mark duplicate transactions.
  - Import all new transactions.
  - Run post-import modifications on new transactions.

## Setup Tips

- Create a blank import mapping before creating the automatic import so that it can be used initially.
- Initially set "Automatic Process" to false to avoid erroneous imports.
- Once you have configured the automatic import use the "Get Data" button to test that data retrieval works correctly. There will be a button that appears to indicate that data has been retrieve, and display the retrieved data (Similar for errors).
- Once data retrieval is working correcly, then use the `Actions -> Update Sample Data` to update the import mapping with imported data. This will then allow for the correct configuration of the import mapping.

## Common Configuration

The following configuration items are common across all automatic import sources.

### Title

Title for automatic import.

### Import Mapping

Functionality that will be used to map the imported data into the trasaction data (i.e. account, date, amount, description etc...). Since this includes the to / from account information it is likely that a separate automatic import and matching import mapping will need to be created for each account that data it to be imported for.

### Frequency

- Options: `Daily | Weekly | Monthly`

Set how frequent the automatic import will be run. Note that the automatic import can also be manually triggered through the web interface.

### Processing

- Options : `Auto | Manual`

Sets whether the import is configured to automatically process after creation. It is a good idea to set this to `Manual` initially, and do the first import manually to make sure the configuration is correct.

### Cleaning

- Options : `Auto | Manual`

Sets whether the import is configured to automatically clean up after some time. Recommended to be set to `Auto`.

### Lookback Days

Sets the number of days in the past that journals should be considered for import. Can be configured after creation, so could be set to a low value initially to minimise data transfer while configuring and testing the import, and then a large value to get all historical transactions, and then reverted to a normal value ( probably 2-3x the import frequency ) for long term operation.

### Start Date

- Format : `YYYY-MM-DD (i.e. 2024-02-31)`

The earliest date that journals will be considered for import from. This overrides the _Lookback Days_ setting.
