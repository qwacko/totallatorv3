OPTION : Favicon.
OPTION : Add Pivot Table Report Functionality (Basic).
OPTION : Make journal text filter be more broad (i.e. search Description, Account, Tag, Bill, Budget, Label, Category, Payee). This will be difficult as searching the payee and label require sub queries.
OPTION : Move the dropdowns to the Edit / Clone pages, they aren't needed all the time. Or possibly move them up to a higher level layout so they are only loaded on initial load or following data update.
OPTION : Make Account Table show useful information (Type, etc...)
OPTION : Make Accounts / Tags / etc... have bulk delete and bulk update options.
OPTION : Update README
OPTION : When editing (or adding) a journal, allow for the creation of new accounts (or linked items) by name if they cannot be found.
OPTION : Make column visibility controlled by a dropdown and matching wrapper component (possibly just make a cell and header wrapper?). Use a local storage store for this rather than the URL. Probably store this information in a localstorage store.
OPTION : More columns in linked item views, including journal count.
OPTION : Make Clone and Edit Journals pages so that they don't waste as much space.
OPTION : Consider whether direct editing from a table view is beneficial for journals, or if the current approach is OK. Maybe have a special edit journals mode or something? Could have that clicking an item opens a dropdown to edit it.
OPTION : Consider pre-loading page data (i.e. from pagination, links from other linked item lists).
OPTION : Consider adding "otherAccountId" / "payee" to the bulk update form.
OPTION : Consider colour coding tags / bills / budgets / categories / tags etc...
OPTION : Consider refactoring out the journals table if this is useful elsehwere - currently this isn't required.
OPTION : Improve mobile functionality.
OPTION : Figure out how to make table columns consistent width (and adjustable)
OPTION : Allow linked items (tags etc...) to be sorted by journal count and total. Possibly this would require the original query to get the sums and counts as well.
OPTION : Reports - Create Reports / Pivot Tables to allow for viewing of data etc... (this would also be well served by creating direct links from the values to journals)
OPTION : Reports - Make reports "saveable" to allow for easy retrieval.
OPTION : Reports - Allow reports to have data tables as well as graphics. Use JSON to store the configuration in a db table (to allow for flexbility of configuration).
OPTION : Reports - For reports, possibly consider allowing creation of "visualisations" which can be used across multiple "reports"
OPTION : May be useful to have the bulkEdit / bulkDelete pages include the summary to make it easy to confirm the journals, and navigate to the latest.
OPTION : May be useful to have the summary information include the latest 5 journals or something.
OPTION : Consider how to better support more journals per transaction.
OPTION : Allow display of more rows (make it adjustable) This will need to somehow affect the "defaultJournalFilter" parameter, so not sure how to do it.
OPTION : Confirm that view user works correctly.
OPTION : Fix Auto-Login from First User Signup...
OPTION : Make Imports have the functionality to ignore existing matching items (duplicate identification)
OPTION : Make there be better information when processing massive imports (currently just looks like it is frozen, but it does actually work).
OPTION : Make journal imports more efficient - bulk import rather than lots of single, also have lookups of accounts etc... be bundled rather than repeated for each journal
OPTION : Make "Disabled" of linked items actually useful (i.e. remove from dropdown options).
OPTION : Add disable / enable button to linked items list. Make disabled items greyed out.
