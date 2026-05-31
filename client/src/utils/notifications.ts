export const READ_NOTIFICATION_STORAGE_KEY = 'readNotificationIds';
export const NOTIFICATION_READ_EVENT = 'smartsport:notifications-read';

export const getReadNotificationIds = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(READ_NOTIFICATION_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

export const saveReadNotificationIds = (ids: string[]) => {
  const uniqueIds = Array.from(new Set(ids));
  localStorage.setItem(READ_NOTIFICATION_STORAGE_KEY, JSON.stringify(uniqueIds));
  window.dispatchEvent(new CustomEvent(NOTIFICATION_READ_EVENT));
  return uniqueIds;
};
