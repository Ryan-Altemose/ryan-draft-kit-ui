'use client';

import { useEffect, useState } from 'react';

export type NotificationEvent = {
  type: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
};

type NotificationStreamStatus = 'idle' | 'connecting' | 'connected' | 'error';

type UseNotificationStreamOptions = {
  enabled: boolean;
};

type StreamMessage =
  | NotificationEvent
  | { type: 'connected'; message: string; timestamp: string };

function isNotificationEvent(
  payload: StreamMessage,
): payload is NotificationEvent {
  return payload.type !== 'connected';
}

function getNotificationStreamUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return `${baseUrl}/api/events`;
}

export function useNotificationStream({
  enabled,
}: UseNotificationStreamOptions) {
  const [status, setStatus] = useState<NotificationStreamStatus>('idle');
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return;
    }

    const source = new EventSource(getNotificationStreamUrl());
    setStatus('connecting');

    source.onopen = () => {
      setStatus('connected');
    };

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as StreamMessage;

        if (!isNotificationEvent(payload)) {
          return;
        }

        setLastEvent({
          type: payload.type,
          message: payload.message,
          data: payload.data ?? {},
          timestamp: payload.timestamp,
        });
      } catch {
        setStatus('error');
      }
    };

    source.onerror = () => {
      setStatus('error');
    };

    return () => {
      source.close();
    };
  }, [enabled]);

  return { status, lastEvent };
}
