'use client';

import { createContext, useEffect, useMemo, useState } from 'react';
import AlertWidget from '@/shared/components/ui/AlertWidget';
import {
  useNotificationStream,
  type NotificationEvent,
} from '@/shared/hooks/useNotificationStream';

type NotificationCenterContextValue = {
  status: ReturnType<typeof useNotificationStream>['status'];
  lastEvent: NotificationEvent | null;
  debug: ReturnType<typeof useNotificationStream>['debug'];
  dismissNotification: () => void;
};

export const NotificationCenterContext =
  createContext<NotificationCenterContextValue | null>(null);

export function NotificationCenterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, lastEvent, debug } = useNotificationStream({ enabled: true });
  const [activeEvent, setActiveEvent] = useState<NotificationEvent | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!lastEvent) return;

    setActiveEvent(lastEvent);
    setIsOpen(true);
  }, [lastEvent]);

  const contextValue = useMemo(
    () => ({
      status,
      lastEvent,
      debug,
      dismissNotification: () => setIsOpen(false),
    }),
    [status, lastEvent, debug],
  );

  return (
    <NotificationCenterContext.Provider value={contextValue}>
      {children}
      {activeEvent ? (
        <AlertWidget
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          category={activeEvent.type}
          description={activeEvent.message}
        />
      ) : null}
    </NotificationCenterContext.Provider>
  );
}
