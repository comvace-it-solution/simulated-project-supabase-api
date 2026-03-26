import { HttpError } from "./validation.ts";

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function getCurrentDateString(): string {
  return getCurrentTimestamp().slice(0, 10);
}

export function validateTargetMonth(targetMonth: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {
    throw new HttpError(400, "targetMonth の形式が不正です。");
  }

  return targetMonth;
}

export function getMonthRange(targetMonth: string): {
  fromDate: string;
  toDateExclusive: string;
} {
  validateTargetMonth(targetMonth);

  const [yearText, monthText] = targetMonth.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const startDate = new Date(Date.UTC(year, monthIndex, 1));
  const nextMonthDate = new Date(Date.UTC(year, monthIndex + 1, 1));

  return {
    fromDate: startDate.toISOString().slice(0, 10),
    toDateExclusive: nextMonthDate.toISOString().slice(0, 10),
  };
}
