import { accountTypeEnum } from "$lib/schema/accountTypeSchema";
import { statusEnum } from "$lib/schema/statusSchema";
import { currencyFormatEnum, dateFormatEnum } from "$lib/schema/userSchema";
import { z } from "zod";

const idColumn = { id: z.string() }

const statusColumns = {
    status: z.enum(statusEnum),
    active: z.boolean(),
    disabled: z.boolean(),
    allowUpdate: z.boolean(),
}

const importColumns = {
    importId: z.string().optional(),
    importDetailId: z.string().optional(),
}

const timestampColumns = {
    createdAt: z.date(),
    updatedAt: z.date(),
}

const backupSchemaRev1 = z.object({
    version: z.literal(1),
    data: z.object({
        user: z.array(z.object({
            id: z.string(),
            name: z.string(),
            username: z.string(),
            admin: z.boolean(),
            currencyFormat: z.enum(currencyFormatEnum),
            dateFormat: z.enum(dateFormatEnum),
        })),
        user_key: z.array(z.object({
            id: z.string(),
            userId: z.string(),
            hashedPassword: z.string(),
        })),
        account: z.array(z.object({
            ...idColumn,
            ...importColumns,
            title: z.string(),
            type: z.enum(accountTypeEnum),
            isCash: z.boolean(),
            isNetWorth: z.boolean(),
            accountGroup: z.string().optional(),
            accountGroup2: z.string().optional(),
            accountGroup3: z.string().optional(),
            accountGroupCombined: z.string(),
            accountTitleCombined: z.string(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            ...timestampColumns
        })
        ),
        tag: z.array(z.object({
            ...idColumn,
            ...importColumns,
            title: z.string(),
            group: z.string(),
            single: z.string(),
            ...statusColumns,
            ...timestampColumns
        })
        ),
        category: z.array(z.object({
            ...idColumn,
            ...importColumns,
            title: z.string(),
            group: z.string(),
            single: z.string(),
            ...statusColumns,
            ...timestampColumns
        })
        ),
        bill: z.array(z.object({
            ...idColumn,
            ...importColumns,
            title: z.string(),
            ...statusColumns,
            ...timestampColumns
        })
        ),
        budget: z.array(z.object({
            ...idColumn,
            ...importColumns,
            title: z.string(),
            ...statusColumns,
            ...timestampColumns
        })
        ),
        label: z.array(z.object({
            ...idColumn,
            ...importColumns,
            title: z.string(),
            ...statusColumns,
            ...timestampColumns
        })
        ),
    })
})