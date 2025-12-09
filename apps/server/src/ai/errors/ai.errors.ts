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
    super('AI 서비스 응답 시간이 초과되었습니다', 'OPENAI_TIMEOUT', true);
  }
}

/**
 * OpenAI Rate Limit Error
 * Thrown when OpenAI API rate limit is exceeded
 * Retryable: Yes (after delay)
 */
export class OpenAIRateLimitError extends AIServiceError {
  constructor() {
    super('AI 서비스 사용량 한도를 초과했습니다', 'OPENAI_RATE_LIMIT', true);
  }
}

/**
 * Moderation Failed Error
 * Thrown when content moderation check fails
 * Retryable: Yes (regenerate different content)
 */
export class ModerationFailedError extends AIServiceError {
  constructor(reason: string) {
    super(`콘텐츠 검토 실패: ${reason}`, 'MODERATION_FAILED', true);
  }
}

/**
 * Content Unsafe Error
 * Thrown when generated content is unsafe and cannot be retried
 * Retryable: No (fundamental content issue)
 */
export class ContentUnsafeError extends AIServiceError {
  constructor(reason: string) {
    super(`부적절한 콘텐츠 감지: ${reason}`, 'CONTENT_UNSAFE', false);
  }
}

/**
 * All Providers Failed Error
 * Thrown when all AI providers have failed
 * Retryable: No (all fallbacks exhausted)
 */
export class AIAllProvidersFailedError extends AIServiceError {
  constructor(
    public readonly attemptedProviders: string[],
    public readonly providerErrors: Error[],
  ) {
    super(
      `모든 AI 서비스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.`,
      'ALL_PROVIDERS_FAILED',
      false,
    );
  }
}

/**
 * Circuit Open Error
 * Thrown when circuit breaker is open for all providers
 * Retryable: No (must wait for circuit to reset)
 */
export class AICircuitOpenError extends AIServiceError {
  constructor(providerName: string) {
    super(
      `AI 서비스(${providerName})가 일시적으로 이용 불가능합니다`,
      'CIRCUIT_OPEN',
      false,
    );
  }
}
