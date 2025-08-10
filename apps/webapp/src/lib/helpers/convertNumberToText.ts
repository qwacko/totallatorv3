import type { ReportConfigPartNumberDisplayType } from "@totallator/shared";
import {
  type currencyFormatType,
  getCurrencyFormatter,
} from "@totallator/shared";

export const convertNumberToText = ({
  value,
  config,
  currency,
}: {
  value: number;
  config: ReportConfigPartNumberDisplayType;
  currency: currencyFormatType;
}) => {
  if (config === "percent") {
    return `${value.toFixed(0)}%`;
  }
  if (config === "percent2dp") {
    return `${value.toFixed(2)}%`;
  }
  if (config === "currency") {
    const formatter = getCurrencyFormatter(currency);
    return formatter.format(value);
  }
  if (config === "number2dp") return value.toFixed(2);

  return value.toFixed(0);
};
