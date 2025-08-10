import { type RequestEvent } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

import { tActions } from "@totallator/business-logic";
import { createNoteJournalSchema, createNoteSchema } from "@totallator/shared";
import { formatDate, getCurrencyFormatter } from "@totallator/shared";

import type { RouteId } from "$app/types";

export const noteFormActions = {
  addNoteJournalFilter: async (
    data: RequestEvent<Partial<Record<string, string>>, RouteId>,
  ) => {
    const form = await superValidate(
      data.request,
      zod4(createNoteJournalSchema),
    );
    const creationPerson = data.locals.user?.id;

    if (!creationPerson) {
      throw new Error("User not found");
    }

    const userInfo = await data.locals.db.query.user.findFirst({
      where: (userTable, { eq }) => eq(userTable.id, creationPerson),
    });

    if (!userInfo) {
      throw new Error("User not found");
    }

    if (!form.valid) {
      return { form };
    }

    const summaryData = await tActions.journalView.simpleSummary({
      filter: form.data.filter,
    });

    const currencyFormatter = getCurrencyFormatter(userInfo.currencyFormat);

    const messages = {
      includeDate: `Generated: ${formatDate(new Date(), userInfo.dateFormat)}`,
      includeDateRange: `Transactions From ${formatDate(new Date(summaryData.earliest), userInfo.dateFormat)} to ${formatDate(new Date(summaryData.latest), userInfo.dateFormat)}`,
      includeEarliest: `Earliest : ${formatDate(new Date(summaryData.earliest), userInfo.dateFormat)}`,
      includeLatest: `Latest : ${formatDate(new Date(summaryData.latest), userInfo.dateFormat)}`,
      includeCount: `Count : ${summaryData.count.toFixed(0)}`,
      includeCountPositive: `Count (Positive) : ${summaryData.positiveCount.toFixed(0)}`,
      includeCountNegative: `Count (Negative) : ${summaryData.negativeCount.toFixed(0)}`,
      includeCountPositiveNoTransfer: `Count (Positive Excl Transfer) : ${summaryData.positiveCountNonTransfer.toFixed(0)}`,
      includeCountNegativeNoTransfer: `Count (Positive Excl Transfer) : ${summaryData.negativeCountNonTransfer.toFixed(0)}`,
      includeSum: `Sum : ${currencyFormatter.format(summaryData.sum)}`,
      includeSumPositive: `Sum (Positive) : ${currencyFormatter.format(summaryData.positiveSum)}`,
      includeSumNegative: `Sum (Negative) : ${currencyFormatter.format(summaryData.negativeSum)}`,
      includeSumPositiveNoTransfer: `Sum (Positive) : ${currencyFormatter.format(summaryData.positiveSumNonTransfer)}`,
      includeSumNegativeNoTransfer: `Sum (Positive) : ${currencyFormatter.format(summaryData.negativeSumNonTransfer)}`,
    };

    const keys = Object.keys(messages) as (keyof typeof messages)[];

    const messageComponents = keys
      .map((item) => ({
        check: Boolean(form.data[item]),
        message: messages[item],
      }))
      .filter((item) => item.check);

    const combinedNoteMessage = `${form.data.title},\n${messageComponents
      .map((item) => item.message)
      .join(",\n")}`;

    try {
      await tActions.note.create({
        data: {
          type: "info",
          note: combinedNoteMessage,
          transactionId: form.data.transactionId,
          accountId: form.data.accountId,
          billId: form.data.billId,
          budgetId: form.data.budgetId,
          categoryId: form.data.categoryId,
          tagId: form.data.tagId,
          labelId: form.data.labelId,
          autoImportId: form.data.autoImportId,
          reportElementId: form.data.reportElementId,
          reportId: form.data.reportId,
        },
        creationUserId: creationPerson,
      });
    } catch (e) {
      data.locals.global.logger.error("Error Creating Note", e);
    }

    return { form };
  },
  addNote: async (
    data: RequestEvent<Partial<Record<string, string>>, RouteId>,
  ) => {
    const form = await superValidate(data.request, zod4(createNoteSchema));
    const creationPerson = data.locals.user?.id;

    if (!creationPerson) {
      throw new Error("User not found");
    }

    if (!form.valid) {
      return { form };
    }

    try {
      await tActions.note.create({
        data: form.data,
        creationUserId: creationPerson,
      });
    } catch (e) {
      data.locals.global.logger.error("Error Creating Note", e);
    }
  },
  deleteNote: async (
    data: RequestEvent<Partial<Record<string, string>>, RouteId>,
  ) => {
    const form = await data.request.formData();
    const noteId = form.get("noteId");
    if (!noteId) return;
    const noteIdString = noteId.toString();
    try {
      await tActions.note.deleteMany({
        filter: { idArray: [noteIdString] },
      });
    } catch (error) {
      data.locals.global.logger.error(
        "Error Deleting Note ",
        noteIdString,
        error,
      );
    }
  },
};
