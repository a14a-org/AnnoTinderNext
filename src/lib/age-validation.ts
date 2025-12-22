/**
 * Age validation utilities for screening participants
 */

/**
 * Calculate age from a month-year string (format: "MM-YYYY")
 * Uses the 15th of the month as the reference date for calculation
 */
export const calculateAgeFromMonthYear = (monthYear: string): number => {
  const [month, year] = monthYear.split('-')

  if (!month || !year) {
    return 0
  }

  const monthNum = parseInt(month, 10)
  const yearNum = parseInt(year, 10)

  if (isNaN(monthNum) || isNaN(yearNum)) {
    return 0
  }

  // Use the 15th of the birth month as reference
  const birthDate = new Date(yearNum, monthNum - 1, 15)
  const today = new Date()

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < 15)) {
    age--
  }

  return age
}

/**
 * Check if a person is under 18 based on their birth month/year
 */
export const isUnder18 = (monthYear: string): boolean => {
  const age = calculateAgeFromMonthYear(monthYear)
  return age < 18
}

/**
 * Check if a person meets the minimum age requirement
 */
export const meetsAgeRequirement = (monthYear: string, minAge: number = 18): boolean => {
  const age = calculateAgeFromMonthYear(monthYear)
  return age >= minAge
}
