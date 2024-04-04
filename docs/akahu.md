---
title: 'Akahu Auto-Import'
---

# Akahu Auto Import

## Overview

Akahu is a commercial provider of a banking API focused on New Zealand financial institutions. They have the ability to setup an account for personal use at this time, however this may come or go at any time.

## Setup

::: warning
The use of Akahu will require you to provide them with login credentials to your accounts. Make sure you understand and are comfortable with the risks before proceeding.
:::

Getting access to Akahu working requires a sign-up and setup a personal application. Note that signup is through a one time access code rather than a traditional signup.

[Link to create account](https://my.akahu.nz/login)

The actual signup process will change over time, and so getting the correct access is left to the user.

## API Access Setup

Use the **Developers** section to create an API connection. This will give you an _App Access Token_ and _User Access Token_ which can be input into the auto import configuration.

The required permissions are **Accounts** and **Transactions**. It is recommended to only use these, as this prevents this API access from creating transactions.

## Bank Account Connection

Create a new **Connection** for each bank to be connected. A single connection will allow access to many accounts.

Creation of connections will require you to input authorization details.

## Configuration

In addition to the [generic configuration](./automatic-import.md#common-configuration), Akahu requires the following configuration items.

### App Accesss Token

- `Required`

This comes from the developer connection App Access Token Copy and paste directly from the Akahu Website

### User Access Token

- `Required`
  This comes from the developer connection User Access Token Copy and paste directly from the Akahu Website

### Account ID / Name

- `Required`

Write the Account Name from the Akahu website. If this doesn't work, then the Account ID can be obtained from the URL when viewing the account in the Akahu website (`acc_*************************`)

## Import Mapping

The following is example import mapping that works with Salt Edge.

- Skip Rows: `0`
- Unique ID : <span v-pre>`{{ _id }}`</span>
- Date : <span v-pre>`{{substring date 0 10}}`</span>
- Description : <span v-pre>`{{type}} {{merchant.name }} {{description}}{{meta.reference}}`</span> Note that this is likely to need to be adjusted for different banks.
- Amount : <span v-pre>`{{ amount }}`</span>
- From Account : Set to a catch-all / unallocated account for later automatic updates to fix.
- To Account : Set to the account that this auto import is for.
