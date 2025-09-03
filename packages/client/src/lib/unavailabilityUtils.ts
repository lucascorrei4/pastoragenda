import type { UnavailabilityPeriod } from './supabase'

/**
 * Checks if a given date and time falls within any unavailability period
 * @param date - The date to check
 * @param time - The time to check (optional, defaults to checking if any time on the date is blocked)
 * @param unavailabilityPeriods - Array of unavailability periods
 * @returns Object with isUnavailable flag and matching period details
 */
export function checkUnavailability(
  date: Date,
  time?: string,
  unavailabilityPeriods: UnavailabilityPeriod[] = []
): { isUnavailable: boolean; period: UnavailabilityPeriod | null; reason: string | null } {
  const checkDate = new Date(date)
  const checkTime = time || '00:00:00'
  
  for (const period of unavailabilityPeriods) {
    const startDate = new Date(period.start_date)
    const endDate = new Date(period.end_date)
    
    // Check if the date falls within the period range
    if (checkDate >= startDate && checkDate <= endDate) {
      // If it's an all-day block, the entire day is unavailable
      if (period.is_all_day) {
        return {
          isUnavailable: true,
          period,
          reason: period.description || period.title
        }
      }
      
      // For partial day blocks, check if the time falls within the blocked hours
      if (time) {
        const periodStartTime = period.start_time
        const periodEndTime = period.end_time
        
        // Handle time comparison (simple string comparison works for HH:MM format)
        if (checkTime >= periodStartTime && checkTime <= periodEndTime) {
          return {
            isUnavailable: true,
            period,
            reason: period.description || period.title
          }
        }
      } else {
        // If no specific time is provided but the date is in a partial day period,
        // we consider it unavailable since we don't know the specific time
        return {
          isUnavailable: true,
          period,
          reason: period.description || period.title
        }
      }
    }
  }
  
  return {
    isUnavailable: false,
    period: null,
    reason: null
  }
}

/**
 * Filters out unavailable time slots from a list of available slots
 * @param availableSlots - Array of available time slots
 * @param unavailabilityPeriods - Array of unavailability periods
 * @param date - The date for the time slots
 * @returns Filtered array of available slots
 */
export function filterUnavailableSlots(
  availableSlots: Array<{ time: string; [key: string]: any }>,
  unavailabilityPeriods: UnavailabilityPeriod[],
  date: Date
): Array<{ time: string; [key: string]: any }> {
  return availableSlots.filter(slot => {
    const { isUnavailable } = checkUnavailability(date, slot.time, unavailabilityPeriods)
    return !isUnavailable
  })
}

/**
 * Gets all unavailability periods that are currently active or will be active soon
 * @param unavailabilityPeriods - Array of all unavailability periods
 * @param daysAhead - Number of days ahead to include (default: 30)
 * @returns Array of active/upcoming unavailability periods
 */
export function getActiveUnavailabilityPeriods(
  unavailabilityPeriods: UnavailabilityPeriod[],
  daysAhead: number = 30
): UnavailabilityPeriod[] {
  const now = new Date()
  const futureDate = new Date()
  futureDate.setDate(now.getDate() + daysAhead)
  
  return unavailabilityPeriods.filter(period => {
    const endDate = new Date(period.end_date)
    return endDate >= now && new Date(period.start_date) <= futureDate
  })
}
