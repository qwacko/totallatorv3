TODO : Improve filtering for journals (dropdown?). Multiple Dropdowns where suitable?
TODO : Favicon.
TODO : Add "Create Transaction" page (currently links to creating a new tag). Would be nice to have the ability to find similar items or something.
TODO : User Management / User Page
TODO : Confirm why backups are not working correctly.
TODO : Add Pivot Table Report Functionality (Basic).
TODO : Make other import formats work
TODO : Allow for download of simple import templates.
TODO : Confirm / Make docker build process work, including different branches, auto-build / publish etc...
OPTION : Make journal text filter be more broad (i.e. search Description, Account, Tag, Bill, Budget, Label, Category, Payee). This will be difficult as searching the payee and label require sub queries.
OPTION : Move the dropdowns to the Edit / Clone pages, they aren't needed all the time. Or possibly move them up to a higher level layout so they are only loaded on initial load or following data update.
OPTION : Update README
OPTION : When editing (or adding) a journal, allow for the creation of new accounts (or linked items) by name if they cannot be found.
OPTION : Make column visibility controlled by a dropdown and matching wrapper component (possibly just make a cell and header wrapper?). Use a local storage store for this rather than the URL. Probably store this information in a localstorage store.
OPTION : More columns in linked item views, including journal count.
OPTION : Make Clone and Edit Journals pages so that they don't waste as much space.
OPTION : Consider whether direct editing from a table view is beneficial for journals, or if the current approach is OK. Maybe have a special edit journals mode or something? Could have that clicking an item opens a dropdown to edit it.
OPTION : Consider pre-loading page data.
OPTION : Consider adding "otherAccountId" / "payee" to the bulk update form.
OPTION : Consider colour coding tags / bills / budgets / categories / tags etc...
OPTION : Consider refactoring out the journals table if this is useful elsehwere - currently this isn't required.
OPTION : Improve mobile functionality.
OPTION : Figure out how to make table columns consistent width (and adjustable)
OPTION : Allow linked items (tags etc...) to be sorted by journal count and total. Possibly this would require the original query to get the sums and counts as well. This could actually use the "summary" info that is created, and join that? But this is more joining, more complexity.... I guess this only needs to be done for the "linked items" and not the main journal, so possibly beneficial. Just need to make sure the summaries are updated...
OPTION : Have Export Functionality
OPTION : Reports - Create Reports / Pivot Tables to allow for viewing of data etc... (this would also be well served by creating direct links from the values to journals)
OPTION : Reports - Make reports "saveable" to allow for easy retrieval.
OPTION : Reports - Allow reports to have data tables as well as graphics. Use JSON to store the configuration in a db table (to allow for flexbility of configuration).
OPTION : Reports - For reports, possibly consider allowing creation of "visualisations" which can be used across multiple "reports"
OPTION : May be useful to have the bulkEdit / bulkDelete pages include the summary to make it easy to confirm the journals, and navigate to the latest.
OPTION : May be useful to have the summary information include the latest 5 journals or something.
OPTION : May be useful to allow bulkEdit / bulkDelete from the summary popup.
OPTION : Consider how to better support more journals per transaction.
OPTION : Allow display of more rows (make it adjustable) This will need to somehow affect the "defaultJournalFilter" parameter, so not sure how to do it.
