/**
 * Base AI Service Error
 * All AI-related errors extend from this class
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

/**
 * OpenAI API Timeout Error
 * Thrown when OpenAI API call exceeds timeout limit
 * Retryable: Yes (with exponential backoff)
 */
export class OpenAITimeoutError extends AIServiceError {
  constructor() {
    super('OpenAI API request timed out', 'OPENAI_TIMEOUT', true);
  }
}

/**
 * OpenAI Rate Limit Error
 * Thrown when OpenAI API rate limit is exceeded
 * Retryable: Yes (after delay)
 */
export class OpenAIRateLimitError extends AIServiceError {
  constructor() {
    super('OpenAI API rate limit exceeded', 'OPENAI_RATE_LIMIT', true);
  }
}

/**
 * Moderation Failed Error
 * Thrown when content moderation check fails
 * Retryable: Yes (regenerate different content)
 */
export class ModerationFailedError extends AIServiceError {
  constructor(reason: string) {
    super(`Content moderation failed: ${reason}`, 'MODERATION_FAILED', true);
  }
}

/**
 * Content Unsafe Error
 * Thrown when generated content is unsafe and cannot be retried
 * Retryable: No (fundamental content issue)
 */
export class ContentUnsafeError extends AIServiceError {
  constructor(reason: string) {
    super(`Unsafe content detected: ${reason}`, 'CONTENT_UNSAFE', false);
  }
}
