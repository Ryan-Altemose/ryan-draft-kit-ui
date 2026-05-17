'use client';

import { useEffect, useState } from 'react';

export type NotificationEvent = {
  type: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
};

export type NotificationStreamDebug = {
  streamUrl: string;
  lastConnectedAt: string | null;
  lastErrorAt: string | null;
  lastEventAt: string | null;
  lastReadyState: number | null;
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
  return '/api/events';
}

export function useNotificationStream({
  enabled,
}: UseNotificationStreamOptions) {
  const [status, setStatus] = useState<NotificationStreamStatus>('idle');
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null);
  const [debug, setDebug] = useState<NotificationStreamDebug>({
    streamUrl: getNotificationStreamUrl(),
    lastConnectedAt: null,
    lastErrorAt: null,
    lastEventAt: null,
    lastReadyState: null,
  });

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return;
    }

    const streamUrl = getNotificationStreamUrl();
    const source = new EventSource(streamUrl);
    setStatus('connecting');
    setDebug((current) => ({
      ...current,
      streamUrl,
      lastReadyState: source.readyState,
    }));

    source.onopen = () => {
      setStatus('connected');
      setDebug((current) => ({
        ...current,
        lastConnectedAt: new Date().toISOString(),
        lastReadyState: source.readyState,
      }));
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
        setDebug((current) => ({
          ...current,
          lastEventAt: new Date().toISOString(),
          lastReadyState: source.readyState,
        }));
      } catch {
        setStatus('error');
        setDebug((current) => ({
          ...current,
          lastErrorAt: new Date().toISOString(),
          lastReadyState: source.readyState,
        }));
      }
    };

    source.onerror = () => {
      setStatus('error');
      setDebug((current) => ({
        ...current,
        lastErrorAt: new Date().toISOString(),
        lastReadyState: source.readyState,
      }));
    };

    return () => {
      setDebug((current) => ({
        ...current,
        lastReadyState: source.readyState,
      }));
      source.close();
    };
  }, [enabled]);

  return { status, lastEvent, debug };
}
