export const fileReasonEnum = ['receipt', 'invoice', 'report', 'info'] as const;
export type FileReason = (typeof fileReasonEnum)[number];
