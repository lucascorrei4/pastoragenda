import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Clock, Calendar, AlertTriangle, Settings, Save } from 'lucide-react';
import { pastorNotificationService, NotificationPreferences } from '../lib/pastor-notification-service';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface NotificationSettingsProps {
  onClose?: () => void;
}

export default function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    appointmentBooked: true,
    appointmentCancelled: true,
    appointmentReminders: true,
    dailySummary: true,
    weeklySummary: false,
    systemUpdates: true,
    urgentBookings: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    timezone: 'UTC'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const prefs = await pastorNotificationService.getNotificationPreferences(user.id);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      await pastorNotificationService.updateNotificationPreferences(user.id, preferences);
      toast.success('Notification settings saved successfully');
      onClose?.();
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notification Settings
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Immediate Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Immediate Notifications</span>
          </h3>
          
          <div className="space-y-3 pl-7">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">New Appointments</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Get notified when someone books an appointment
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.appointmentBooked}
                onChange={(e) => handlePreferenceChange('appointmentBooked', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Appointment Cancellations</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Get notified when appointments are cancelled
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.appointmentCancelled}
                onChange={(e) => handlePreferenceChange('appointmentCancelled', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Urgent Bookings</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Get notified for same-day or next-day bookings
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.urgentBookings}
                onChange={(e) => handlePreferenceChange('urgentBookings', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </label>
          </div>
        </div>

        {/* Scheduled Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>Scheduled Notifications</span>
          </h3>
          
          <div className="space-y-3 pl-7">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Appointment Reminders</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Get reminded 24 hours and 1 hour before appointments
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.appointmentReminders}
                onChange={(e) => handlePreferenceChange('appointmentReminders', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Daily Summary</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Get a summary of your day's appointments every morning
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.dailySummary}
                onChange={(e) => handlePreferenceChange('dailySummary', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Weekly Summary</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Get a weekly overview of your appointments and statistics
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.weeklySummary}
                onChange={(e) => handlePreferenceChange('weeklySummary', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </label>
          </div>
        </div>

        {/* System Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-500" />
            <span>System Notifications</span>
          </h3>
          
          <div className="space-y-3 pl-7">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">System Updates</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Get notified about new features and updates
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.systemUpdates}
                onChange={(e) => handlePreferenceChange('systemUpdates', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </label>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            <span>Quiet Hours</span>
          </h3>
          
          <div className="space-y-3 pl-7">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={preferences.quietHoursStart}
                  onChange={(e) => handlePreferenceChange('quietHoursStart', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={preferences.quietHoursEnd}
                  onChange={(e) => handlePreferenceChange('quietHoursEnd', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Non-urgent notifications will be delayed during quiet hours
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
