---
title: 'Notes / Files'
---

# Notes / Files

## Overview

It is possible to store notes and files against items. It is up to the user how these are used, but there are some common use cases:

- **Notes**
  - Store additional information about an item that may be useful in the future.
  - Store reminders of actions that need to be taken.
- **Files**
  - Store invoices / receipts against transactions.
  - Store images of items, such as a photo of a product.

Notes and Files can be stored against the following items:

- Transaction
- Account
- Category
- Tag
- Budget
- Bill
- Label
- Report Element
- Report

## Notes

Notes are simply a text field that can be stored against an item, they can be set as information or a reminder. They have the ability to set if they are a reminder which will highligh them and make them searchable. Notes cannot be updated once they are created, only deleted.

From the linked item (i.e. Transaction, Account...) items with or without attached notes can be filtered using the `note:` and `!note:` filters. To find items with a reminder note use the `reminder:` and `!reminder:` filters.

## Files

Files can be uploaded and stored against an item. They can be downloaded at any time. For files that are identified as images, a thumbnail will be generated and displayed to speed up viewing.

There is a regular task to identify files that are missing from the underlying storage, and highlight these to the user to allow for easy clearing up of the database.

Linked items can be filtered whether they have or don't have linked files using the `file:` and `!file:` filters.

Files can have their title adjusted after upload, or be linked to other items.
