import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";
import type { Locale, NumeralSystem } from "@/lib/i18n/config";
import { buildLocaleTag } from "@/lib/formatters/numerals";
import type { Transaction } from "@/lib/types/transaction";
import { csvRow } from "./serialize";

type Messages = typeof enMessages;
const dictionaries: Record<Locale, Messages> = { en: enMessages, ar: arMessages };

export function buildTransactionsCsvHeader(locale: Locale): string {
  const cols = dictionaries[locale].transactions.columns;
  return csvRow([
    cols.id,
    cols.createdAt,
    "customer_id", // not in column dictionary; column header in EN technical form
    cols.type,
    cols.channel,
    cols.status,
    cols.governorate,
    cols.amount,
  ]);
}

/** Per-locale row formatter. The closure captures the heavy
 * `Intl.*` instances so each row doesn't pay the construction cost. */
export function makeTransactionRowFormatter(locale: Locale, numerals: NumeralSystem) {
  const tag = buildLocaleTag(locale, numerals);
  const dateFmt = new Intl.DateTimeFormat(tag, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const numberFmt = new Intl.NumberFormat(tag, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const m = dictionaries[locale].transactions;

  return (t: Transaction): string =>
    csvRow([
      t.id,
      dateFmt.format(new Date(t.createdAt)),
      t.customerId,
      m.type[t.type],
      m.channel[t.channel],
      m.status[t.status],
      m.governorate[t.governorate],
      numberFmt.format(t.amountSar / 100),
    ]);
}
