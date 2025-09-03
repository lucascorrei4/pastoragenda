/**
 * Translates default event type titles and descriptions
 * @param eventType - The event type object
 * @param t - Translation function from react-i18next
 * @returns Event type with translated title and description
 */
export function translateDefaultEventType(eventType: any, t: (key: string) => string) {
  // Check if this is a default event type by checking if title starts with 'defaultEventTypes.'
  if (eventType.title?.startsWith('defaultEventTypes.')) {
    return {
      ...eventType,
      title: t(eventType.title),
      description: eventType.description?.startsWith('defaultEventTypes.') 
        ? t(eventType.description) 
        : eventType.description
    }
  }
  
  return eventType
}

/**
 * Translates an array of event types
 * @param eventTypes - Array of event type objects
 * @param t - Translation function from react-i18next
 * @returns Array of event types with translated titles and descriptions
 */
export function translateDefaultEventTypes(eventTypes: any[], t: (key: string) => string) {
  return eventTypes.map(eventType => translateDefaultEventType(eventType, t))
}
