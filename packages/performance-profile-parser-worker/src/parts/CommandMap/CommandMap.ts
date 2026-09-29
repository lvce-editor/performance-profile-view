import { parsePerformanceProfile } from '../ParsePerformanceProfile/ParsePerformanceProfile.ts'

export const commandMap: Readonly<Record<string, unknown>> = {
  'PerformanceProfileParser.parse': parsePerformanceProfile,
}
