---
title: 'Salt Edge Auto-Import'
---

# Salt Edge Auto Import

## Overview

Salt Edge is a commercial provider of a banking API. They have the ability to setup an account for personal use at this time, however this may come or go at any time.

## Setup

::: warning
The use of Salt Edge in some cases requires you to provide them with your bank account login details and they impersonate you to scrape transaction information. Make sure you understand and are comfortable with the risks before proceeding.
:::

Getting access to Salt Edge working requires a sign-up, followed by getting your account into "Test" which allose connections with up to 100 accounts.

[Link to create account](https://www.saltedge.com/client_users/sign_up)

The actual signup process will change over time, and so getting the correct access is left to the user.

## API Access Setup

Once the account is setup, create a new application through `Settings > Applications`.

- Since you will be setting up accounts directly, the **Home URL** and **Application URL** are not important, but it is recommended to set these up to align with your eventual use case.

Create an **API Key** of type **Service** for access to your accounts. The API Key is the source of the _App ID_ and _Secret_.

## Bank Account Connection

Create a new **Connection** for each bank account to be connected to, and then within each connection there will be many accounts for the different accounts that exist with that bank.

Creation of connections will require you to input authorization details.

Once the connection is made and accounts are listed, the **Connection ID** and **Account ID** can be copied into the configuration.

## Configuration

In addition to the [generic configuration](advanced/automatic-import.md#common-configuration), Salt Edge requires the following configuration items.

### App ID

- `Required`

This comes from the API Key. Copy and paste the API App ID directly from the Salt Edge Website

### Secret

- `Required`

This comes from the API Key. Copy and paste the API secret directly from the Salt Edge Website

### Connection ID

- `Required`

  The connection ID, is the ID (7 digit number in my experience) for the bank connection. A single connection can have multiple accounts associated with it.

### Account ID

- `Required`

  The account ID can be either the ID **or** the Account Name. Note that the account name shown in the Salt Edge web page may be obfuscated (have x's in some locations), so use of the Account Name will require knowledge of teh full account name.

## Import Mapping

The following is example import mapping that works with Salt Edge.

- Skip Rows: `0`
- Unique ID : <span v-pre>`{{ id }}`</span>
- Date : <span v-pre>`{{ substring made_on 0 10 }}`</span>
- Description : <span v-pre>`{{ description }}`</span>
- Amount : <span v-pre>`{{ amount }}`</span>
- From Account : Set to a catch-all / unallocated account for later automatic updates to fix.
- To Account : Set to the account that this auto import is for.
