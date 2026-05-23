import { format, formatDistanceToNow, isToday, isYesterday, differenceInDays, parseISO } from 'date-fns';

/**
 * Standard format patterns for system-wide consistency
 */
export const DATE_FORMATS = {
    DATE_ONLY: 'MMM dd, yyyy',        // Oct 25, 2023
    TIME_ONLY: 'h:mm a',             // 2:30 PM
    DATE_TIME: 'MMM dd, yyyy h:mm a', // Oct 25, 2023 2:30 PM
    SHORT_MONTH: 'MMM',              // Oct
    DAY_NUM: 'dd',                  // 25
    YEAR: 'yyyy',                    // 2023
    ISO_DATE: 'yyyy-MM-dd',          // 2023-10-25
};

/**
 * Ensures a date string is treated as UTC if it lacks a timezone indicator.
 * Also handles numeric timestamp strings.
 */
export function normalizeUTC(dateString: string | number): string {
    if (!dateString) return '';
    
    const str = dateString.toString();
    
    // If it's a numeric timestamp (Unix epoch), return it as is (new Date handles numbers/numeric strings)
    if (/^\d+$/.test(str)) return str;

    if (!str.endsWith('Z') && !str.includes('+')) {
        return str + 'Z';
    }
    return str;
}

/**
 * Formats a date string into a relative time string (e.g., "Today at 2:23 PM")
 */
export function getRelativeTimeString(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(normalizeUTC(dateString));
    if (isNaN(date.getTime())) return 'Unknown time';

    if (isToday(date)) {
        return `Today`;
    }

    if (isYesterday(date)) {
        return `Yesterday`;
    }

    const daysDiff = differenceInDays(new Date(), date);
    if (daysDiff < 7 && daysDiff > 0) {
        return `${daysDiff} days ago (${format(date, 'MMM d')})`;
    }

    return format(date, DATE_FORMATS.DATE_ONLY);
}

/**
 * Generic local time formatter
 */
export function formatLocalTime(dateString: string, pattern: string = DATE_FORMATS.DATE_TIME): string {
    if (!dateString) return '';

    const date = new Date(normalizeUTC(dateString));
    if (isNaN(date.getTime())) return 'Unknown time';

    return format(date, pattern);
}

/**
 * Standard Date Formatter (standardized to Oct 25, 2023)
 */
export function formatDate(dateString: string): string {
    return formatLocalTime(dateString, DATE_FORMATS.DATE_ONLY);
}

/**
 * Standard Time Formatter (standardized to 2:30 PM)
 */
export function formatTime(dateString: string): string {
    return formatLocalTime(dateString, DATE_FORMATS.TIME_ONLY);
}

/**
 * Standard Full DateTime Formatter (standardized to Oct 25, 2023 2:30 PM)
 */
export function formatDateTime(dateString: string): string {
    return formatLocalTime(dateString, DATE_FORMATS.DATE_TIME);
}

/**
 * Returns 'Today', 'Yesterday', or a formatted date string for chat dividers.
 */
export function formatMessageDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(normalizeUTC(dateString));
    if (isNaN(date.getTime())) return '';

    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, DATE_FORMATS.DATE_ONLY);
}
