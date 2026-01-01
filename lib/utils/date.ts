import { format, parse, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

const KST = 'Asia/Seoul'

/**
 * 현재 KST 날짜 반환
 */
export function getKSTToday(): Date {
  return toZonedTime(new Date(), KST)
}

/**
 * Date -> 'YYYY-MM-DD' 문자열 (DB 저장용)
 */
export function toDateString(date: Date): string {
  return formatInTimeZone(date, KST, 'yyyy-MM-dd')
}

/**
 * 'YYYY-MM-DD' 문자열 -> Date
 */
export function fromDateString(dateStr: string): Date {
  return parse(dateStr, 'yyyy-MM-dd', new Date())
}

/**
 * KST 기준 날짜 포맷팅
 */
export function formatKST(date: Date, formatStr: string): string {
  return formatInTimeZone(date, KST, formatStr)
}

/**
 * 날짜 문자열 포맷팅
 */
export function formatDateString(dateStr: string, formatStr: string): string {
  const date = fromDateString(dateStr)
  return format(date, formatStr)
}

/**
 * 월 범위 반환 (시작일, 종료일)
 */
export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const date = new Date(year, month - 1, 1)
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

/**
 * 이전 달 반환
 */
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  const date = subMonths(new Date(year, month - 1, 1), 1)
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  }
}

/**
 * 다음 달 반환
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  const date = addMonths(new Date(year, month - 1, 1), 1)
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  }
}

/**
 * 현재 년월 반환
 */
export function getCurrentYearMonth(): { year: number; month: number } {
  const today = getKSTToday()
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  }
}
