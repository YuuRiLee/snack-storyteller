import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook State
 */
interface UseStoryGenerationState {
  // Status
  isGenerating: boolean;
  isComplete: boolean;
  hasError: boolean;
  errorMessage: string | null;

  // Progress
  currentContent: string;
  retryAttempt: number | null;
  retryReason: string | null;

  // Result
  story: {
    id: string;
    title: string;
    content: string;
    wordCount: number;
  } | null;

  // Actions
  generate: (writerId: string, tags: string[]) => void;
  cancel: () => void;
  reset: () => void;
}

/**
 * useStoryGeneration Hook
 *
 * Real-time story generation with Server-Sent Events (SSE).
 *
 * Features:
 * - Real-time token streaming
 * - Retry notifications
 * - Error handling
 * - Proper cleanup on unmount
 *
 * Example:
 * ```tsx
 * const { isGenerating, currentContent, story, generate, cancel } = useStoryGeneration();
 *
 * // Start generation
 * generate('writer-id', ['로맨스', '경쾌한']);
 *
 * // Display streaming content
 * <div>{currentContent}</div>
 *
 * // Final story
 * {story && <Story data={story} />}
 * ```
 *
 * @returns Hook state and actions
 */
export function useStoryGeneration(): UseStoryGenerationState {
  // Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Progress
  const [currentContent, setCurrentContent] = useState('');
  const [retryAttempt, setRetryAttempt] = useState<number | null>(null);
  const [retryReason, setRetryReason] = useState<string | null>(null);

  // Result
  const [story, setStory] = useState<UseStoryGenerationState['story']>(null);

  // AbortController ref for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Cancel generation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    cancel();
    setIsComplete(false);
    setHasError(false);
    setErrorMessage(null);
    setCurrentContent('');
    setRetryAttempt(null);
    setRetryReason(null);
    setStory(null);
  }, [cancel]);

  /**
   * Start generation
   */
  const generate = useCallback(
    async (writerId: string, tags: string[]) => {
      // Reset previous state
      reset();

      // Validation
      if (!writerId || tags.length === 0) {
        setHasError(true);
        setErrorMessage('Writer ID and tags are required');
        return;
      }

      const token = localStorage.getItem('access_token');
      if (!token) {
        setHasError(true);
        setErrorMessage('Please login to generate a story');
        return;
      }

      // Create AbortController for cancellation
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsGenerating(true);

      try {
        // Use fetch with Authorization header (EventSource doesn't support custom headers)
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const params = new URLSearchParams({
          writerId,
          tags: tags.join(','),
        });

        const response = await fetch(`${apiUrl}/stories/generate/stream?${params}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        // SSE event state (event can span multiple lines)
        let currentEventType = '';
        let currentEventData = '';

        // Process SSE stream
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events
          // Format:
          //   event: token
          //   id: 84
          //   data: {"token":"시"}
          //   (empty line = event complete)
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              currentEventData = line.slice(6).trim();
            } else if (line === '' && currentEventData) {
              // Empty line = event complete, process it
              try {
                const parsed = JSON.parse(currentEventData);

                switch (currentEventType) {
                  case 'token':
                    if (parsed.token) {
                      setCurrentContent((prev) => prev + parsed.token);
                    }
                    break;

                  case 'retry':
                    setRetryAttempt(parsed.attempt);
                    setRetryReason(parsed.reason);
                    // Clear content for retry
                    setCurrentContent('');
                    break;

                  case 'done':
                    setStory(parsed);
                    setCurrentContent(parsed.content);
                    setIsComplete(true);
                    setIsGenerating(false);
                    return;

                  case 'error':
                    setHasError(true);
                    setErrorMessage(parsed.message);
                    setIsGenerating(false);
                    return;
                }
              } catch (parseError) {
                console.error('Failed to parse SSE message:', parseError, currentEventData);
              }

              // Reset for next event
              currentEventType = '';
              currentEventData = '';
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // User cancelled - don't show error
          return;
        }

        console.error('SSE stream error:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : '서버 연결이 끊어졌습니다');
        setIsGenerating(false);
      }
    },
    [reset],
  );

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Status
    isGenerating,
    isComplete,
    hasError,
    errorMessage,

    // Progress
    currentContent,
    retryAttempt,
    retryReason,

    // Result
    story,

    // Actions
    generate,
    cancel,
    reset,
  };
}
