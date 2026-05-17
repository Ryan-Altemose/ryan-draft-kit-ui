import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotificationStream } from './useNotificationStream';

class MockEventSource {
  static instances: MockEventSource[] = [];
  onopen: null | (() => void) = null;
  onmessage: null | ((event: MessageEvent) => void) = null;
  onerror: null | (() => void) = null;
  closed = false;
  url: string;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
  }
}

describe('useNotificationStream', () => {
  const originalEventSource = global.EventSource;

  afterEach(() => {
    global.EventSource = originalEventSource;
    MockEventSource.instances = [];
    vi.unstubAllEnvs();
  });

  it('stays idle when disabled', () => {
    global.EventSource = MockEventSource as unknown as typeof EventSource;

    const { result } = renderHook(() =>
      useNotificationStream({ enabled: false }),
    );

    expect(result.current.status).toBe('idle');
    expect(MockEventSource.instances).toHaveLength(0);
  });

  it('captures notification events from the stream', () => {
    global.EventSource = MockEventSource as unknown as typeof EventSource;

    const { result } = renderHook(() =>
      useNotificationStream({ enabled: true }),
    );

    expect(MockEventSource.instances).toHaveLength(1);
    const instance = MockEventSource.instances[0];
    expect(instance.url).toBe('/api/events');

    act(() => {
      instance.onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'injury-update',
            message: 'Fake Player is now injured',
            data: { player: 'Fake Player' },
            timestamp: '2026-05-16T00:00:00.000Z',
          }),
        }),
      );
    });

    expect(result.current.lastEvent).toEqual({
      type: 'injury-update',
      message: 'Fake Player is now injured',
      data: { player: 'Fake Player' },
      timestamp: '2026-05-16T00:00:00.000Z',
    });
  });
});
