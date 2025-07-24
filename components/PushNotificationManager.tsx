'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function PushNotificationManager() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  useEffect(() => {
    // Show prompt after user has been on the site for 30 seconds
    if (user && permission === 'default') {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    }
  }, [user, permission]);

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    }
  };

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  };

  const subscribeToPush = async () => {
    if (!user) return;

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) return;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId: user.id
        })
      });

      if (response.ok) {
        setIsSubscribed(true);
        setShowPrompt(false);
        console.log('Push subscription successful');
      } else {
        console.error('Failed to save subscription on server');
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove subscription from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            userId: user.id
          })
        });

        setIsSubscribed(false);
        console.log('Push unsubscription successful');
      }
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
    }
  };

  if (!user || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  return (
    <>
      {/* Notification permission prompt */}
      {showPrompt && permission === 'default' && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-xl p-6 z-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-3xl">🔔</span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">
                Bleib am Ball!
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Erhalte Push-Benachrichtigungen wenn du herausgefordert wirst.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={subscribeToPush}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
                >
                  ⚽ Aktivieren
                </button>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                >
                  Später
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings toggle (show in user menu or settings) */}
      {permission === 'granted' && (
        <div className="hidden">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSubscribed}
              onChange={() => isSubscribed ? unsubscribeFromPush() : subscribeToPush()}
              className="sr-only"
            />
            <div className={`w-10 h-6 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-gray-300'} relative transition-colors`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isSubscribed ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm">Push Notifications</span>
          </label>
        </div>
      )}
    </>
  );
}