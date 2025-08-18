
import { eq, inArray, SQLWrapper } from 'drizzle-orm';
import {  logDomainEnum, logActionEnum, logDestinationEnum, configurationTable } from './../schema/index.js';
import z from 'zod';


export const logConfigFilterValidation = z.object({
    domain: z.array(z.enum(logDomainEnum)).optional(),
    action: z.array(z.enum(logActionEnum)).optional(),
    destination: z.array(z.enum(logDestinationEnum)).optional()
})

export type LogFilterConfigValidationType = z.infer<typeof logConfigFilterValidation>
export type LogFilterConfigValidationOutputType = z.output<typeof logConfigFilterValidation>

export const filterConfigurationsToSQL = (filter: LogFilterConfigValidationOutputType): SQLWrapper[] => {

        const conditions : SQLWrapper[] = []

        if(filter.action && filter.action.length > 0){
            conditions.push(inArray(configurationTable.action, filter.action))
        }
        if(filter.destination && filter.destination.length > 0){
            conditions.push(inArray(configurationTable.destination, filter.destination))
        }
        if(filter.domain && filter.domain.length > 0){
            conditions.push(inArray(configurationTable.domain, filter.domain))
        }

        if(conditions.length === 0){
            conditions.push(eq(configurationTable.action, configurationTable.action))
        }

        return conditions

    }