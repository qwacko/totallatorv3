import { tActions } from "@totallator/business-logic";

import { filterNullUndefinedAndDuplicates } from "$lib/helpers/filterNullUndefinedAndDuplicates.js";

export const load = async ({ locals }) => {
  const accountCount = await tActions.account.count();
  const accountsWithJournalCount =
    await tActions.account.listWithTransactionCount();
  const deletableAccountCount = accountsWithJournalCount.filter(
    (item) => item.journalCount === 0,
  ).length;
  const accountCreationOptions = [
    { title: "+ 10", income: 3, expense: 3, asset: 3, liability: 1 },
    { title: "+ 40", income: 6, expense: 20, asset: 10, liability: 4 },
    { title: "+ 100", income: 15, expense: 50, asset: 20, liability: 15 },
  ];

  const billCount = await tActions.bill.count();
  const billsWithJournalCount = await tActions.bill.listWithTransactionCount();
  const deletableBillCount = billsWithJournalCount.filter(
    (item) => item.journalCount === 0,
  ).length;

  const budgetCount = await tActions.budget.count();
  const budgetsWithJournalCount =
    await tActions.budget.listWithTransactionCount();
  const deletableBudgetCount = budgetsWithJournalCount.filter(
    (item) => item.journalCount === 0,
  ).length;

  const categoryCount = await tActions.category.count();
  const categoriesWithJournalCount =
    await tActions.category.listWithTransactionCount();
  const deletableCategoryCount = categoriesWithJournalCount.filter(
    (item) => item.journalCount === 0,
  ).length;

  const tagCount = await tActions.tag.count();
  const tagsWithJournalCount = await tActions.tag.listWithTransactionCount();
  const deletableTagCount = tagsWithJournalCount.filter(
    (item) => item.journalCount === 0,
  ).length;

  const labelCount = await tActions.label.count();
  const labelsWithJournalCount =
    await tActions.label.listWithTransactionCount();
  const deletableLabelCount = labelsWithJournalCount.filter(
    (item) => item.journalCount === 0,
  ).length;

  const reusableFilterCount = await tActions.reusableFitler.count();

  const journalCount = await tActions.journalView.count();
  const deletableJournalCount = journalCount;

  return {
    accountCreationOptions,
    accountCount,
    deletableAccountCount,

    billCount,
    deletableBillCount,

    budgetCount,
    deletableBudgetCount,

    categoryCount,
    deletableCategoryCount,

    tagCount,
    deletableTagCount,

    labelCount,
    deletableLabelCount,

    journalCount,
    deletableJournalCount,

    reusableFilterCount,
  };
};

export const actions = {
  bulkAddJournals: async (data) => {
    try {
      const startTime = new Date();
      const form = await data.request.formData();
      const count = Number(form.get("count")?.toString() || "200");

      await tActions.journal.seed(count);
      const endTime = new Date();
      const timeDiff = (endTime.getTime() - startTime.getTime()) / 1000;
      data.locals.global.logger.info(
        `Added ${count} transactions in ${timeDiff.toString()} seconds`,
      );
    } catch (e) {
      data.locals.global.logger.error("Error Creating Bulk Journals : ", e);
    }
  },
  bulkAddAccounts: async (data) => {
    try {
      const form = await data.request.formData();
      const countIncome = Number(form.get("countIncome")?.toString() || "10");
      const countExpenses = Number(
        form.get("countExpenses")?.toString() || "10",
      );
      const countAssets = Number(form.get("countAssets")?.toString() || "10");
      const countLiabilities = Number(
        form.get("countLiabilities")?.toString() || "10",
      );

      await tActions.account.seed({
        countAssets,
        countExpenses,
        countIncome,
        countLiabilities,
      });
    } catch (e) {
      data.locals.global.logger.error("Error Creating Bulk Accounts : ", e);
    }
  },
  bulkAddTags: async (data) => {
    try {
      const form = await data.request.formData();
      const count = Number(form.get("count")?.toString() || "10");

      await tActions.tag.seed(count);
    } catch (e) {
      data.locals.global.logger.error("Error Creating Bulk Tags : ", e);
    }
  },
  bulkAddBills: async (data) => {
    try {
      const form = await data.request.formData();
      const count = Number(form.get("count")?.toString() || "10");

      await tActions.bill.seed(count);
    } catch (e) {
      data.locals.global.logger.error("Error Creating Bulk Bills : ", e);
    }
  },
  bulkAddBudgets: async (data) => {
    try {
      const form = await data.request.formData();
      const count = Number(form.get("count")?.toString() || "10");

      await tActions.budget.seed(count);
    } catch (e) {
      data.locals.global.logger.error("Error Creating Budget Tags : ", e);
    }
  },
  bulkAddCategories: async (data) => {
    try {
      const form = await data.request.formData();
      const count = Number(form.get("count")?.toString() || "10");

      await tActions.category.seed(count);
    } catch (e) {
      data.locals.global.logger.error("Error Creating Bulk Categories : ", e);
    }
  },
  bulkAddLabels: async (data) => {
    try {
      const form = await data.request.formData();
      const count = Number(form.get("count")?.toString() || "10");

      await tActions.label.seed(count);
    } catch (e) {
      data.locals.global.logger.error("Error Creating Bulk Labels : ", e);
    }
  },
  bulkAddReusableFilters: async (data) => {
    try {
      const form = await data.request.formData();
      const count = Number(form.get("count")?.toString() || "10");

      await tActions.reusableFitler.seed({ count });
    } catch (e) {
      data.locals.global.logger.error(
        "Error Creating Bulk Reusable Filters : ",
        e,
      );
    }
  },
  deleteUnusedJournals: async (data) => {
    try {
      const journals = await tActions.journalView.list({
        filter: { pageSize: 10000 },
      });
      const transactionIds = filterNullUndefinedAndDuplicates(
        journals.data.map((item) => item.transactionId),
      );
      await tActions.journal.hardDeleteTransactions({
        transactionIds,
      });
    } catch (e) {
      data.locals.global.logger.error("Error Deleting Unused Journals : ", e);
    }
  },
  deleteUnusedAccounts: async (data) => {
    try {
      const accountsWithJournalCount =
        await tActions.account.listWithTransactionCount();
      const items = accountsWithJournalCount.filter(
        (item) => item.journalCount === 0,
      );
      await tActions.account.deleteMany(items);
    } catch (e) {
      data.locals.global.logger.error("Error Deleting Unused Accounts : ", e);
    }
  },
  deleteUnusedTags: async (data) => {
    try {
      const tagsWithJournalCount =
        await tActions.tag.listWithTransactionCount();
      const items = tagsWithJournalCount.filter(
        (item) => item.journalCount === 0,
      );
      await tActions.tag.deleteMany(items);
    } catch (e) {
      data.locals.global.logger.error("Error Deleting Unused Tags : ", e);
    }
  },
  deleteUnusedCategories: async ({ locals }) => {
    try {
      const categoriesWithJournalCount =
        await tActions.category.listWithTransactionCount();
      const items = categoriesWithJournalCount.filter(
        (item) => item.journalCount === 0,
      );
      await tActions.category.deleteMany(items);
    } catch (e) {
      locals.global.logger.error("Error Deleting Unused Categories : ", e);
    }
  },
  deleteUnusedBills: async ({ locals }) => {
    try {
      const billsWithJournalCount =
        await tActions.bill.listWithTransactionCount();
      const items = billsWithJournalCount.filter(
        (item) => item.journalCount === 0,
      );
      await tActions.bill.deleteMany(items);
    } catch (e) {
      locals.global.logger.error("Error Deleting Unused Bills : ", e);
    }
  },
  deleteUnusedBudgets: async ({ locals }) => {
    try {
      const budgetsWithJournalCount =
        await tActions.budget.listWithTransactionCount();
      const items = budgetsWithJournalCount.filter(
        (item) => item.journalCount === 0,
      );
      await tActions.budget.deleteMany(items);
    } catch (e) {
      locals.global.logger.error("Error Deleting Unused Budgets : ", e);
    }
  },
  deleteUnusedLabels: async ({ locals }) => {
    try {
      const labelsWithJournalCount =
        await tActions.label.listWithTransactionCount();
      const items = labelsWithJournalCount.filter(
        (item) => item.journalCount === 0,
      );
      await tActions.label.hardDeleteMany(items);
    } catch (e) {
      locals.global.logger.error("Error Deleting Unused Labels : ", e);
    }
  },
  deleteReusableFilters: async ({ locals }) => {
    try {
      const items = await tActions.reusableFitler.list({
        filter: { pageSize: 10000 },
      });
      await tActions.reusableFitler.deleteMany({
        ids: items.data.map((item) => item.id),
      });
    } catch (e) {
      locals.global.logger.error("Error Deleting Reusable Filters : ", e);
    }
  },
};
