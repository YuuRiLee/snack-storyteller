import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Story Generation Event Types
 */
type StoryEvent =
  | { type: 'token'; data: { token: string } }
  | { type: 'retry'; data: { reason: string; attempt: number; maxRetries: number } }
  | { type: 'done'; data: { id: string; title: string; content: string; wordCount: number } }
  | { type: 'error'; data: { message: string } };

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

  // EventSource ref for cleanup
  const eventSourceRef = useRef<EventSource | null>(null);

  /**
   * Cancel generation
   */
  const cancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
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
    (writerId: string, tags: string[]) => {
      // Reset previous state
      reset();

      // Validation
      if (!writerId || tags.length === 0) {
        setHasError(true);
        setErrorMessage('Writer ID and tags are required');
        return;
      }

      // Create EventSource
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const url = `${apiUrl}/stories/generate/stream`;

      // Note: EventSource doesn't support POST with body
      // We'll need to send params as query string or use different approach
      const params = new URLSearchParams({
        writerId,
        tags: tags.join(','),
      });

      const eventSource = new EventSource(`${url}?${params}`);
      eventSourceRef.current = eventSource;

      setIsGenerating(true);

      // Event handlers
      eventSource.onmessage = (event) => {
        try {
          const parsed: StoryEvent = JSON.parse(event.data);

          switch (parsed.type) {
            case 'token':
              setCurrentContent((prev) => prev + parsed.data.token);
              break;

            case 'retry':
              setRetryAttempt(parsed.data.attempt);
              setRetryReason(parsed.data.reason);
              // Clear content for retry
              setCurrentContent('');
              break;

            case 'done':
              setStory(parsed.data);
              setCurrentContent(parsed.data.content);
              setIsComplete(true);
              setIsGenerating(false);
              eventSource.close();
              break;

            case 'error':
              setHasError(true);
              setErrorMessage(parsed.data.message);
              setIsGenerating(false);
              eventSource.close();
              break;
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
          setHasError(true);
          setErrorMessage('Failed to parse server response');
          setIsGenerating(false);
          eventSource.close();
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setHasError(true);
        setErrorMessage('Connection to server lost');
        setIsGenerating(false);
        eventSource.close();
      };
    },
    [reset],
  );

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
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
