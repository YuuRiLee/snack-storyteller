/**
 * AI Provider Interface
 *
 * 모든 AI 프로바이더가 구현해야 하는 공통 인터페이스.
 * Fallback 시스템에서 동일한 방식으로 각 프로바이더를 호출할 수 있게 합니다.
 */

/**
 * Provider 메타데이터
 */
export interface AIProviderConfig {
  /** 프로바이더 고유 식별자 */
  name: string;

  /** 우선순위 (낮을수록 먼저 시도, 1 = Primary) */
  priority: number;

  /** 프로바이더 활성화 여부 */
  enabled: boolean;

  /** 스트리밍 지원 여부 */
  supportsStreaming: boolean;

  /** 요청 타임아웃 (ms) */
  timeoutMs: number;

  /** 사용할 모델명 */
  model: string;
}

/**
 * AI Provider 인터페이스
 *
 * 모든 AI 프로바이더 (OpenAI, Gemini 등)가 구현합니다.
 */
export interface AIProvider {
  /** 프로바이더 설정 */
  readonly config: AIProviderConfig;

  /**
   * 소설 생성 (스트리밍)
   *
   * @param systemPrompt - Writer의 시스템 프롬프트
   * @param tags - 요청된 태그 목록 (1-3개)
   * @returns AsyncGenerator yielding content chunks
   * @throws AIProviderError 프로바이더 에러 발생 시
   */
  generateStoryStream(
    systemPrompt: string,
    tags: string[],
  ): AsyncGenerator<string>;

  /**
   * 제목 생성
   *
   * @param content - 생성된 소설 내용
   * @returns 생성된 제목
   * @throws AIProviderError 프로바이더 에러 발생 시
   */
  generateTitle(content: string): Promise<string>;

  /**
   * 헬스 체크 (선택적)
   *
   * 프로바이더가 정상 동작하는지 확인합니다.
   * Circuit Breaker의 HALF_OPEN 상태에서 테스트용으로 사용됩니다.
   *
   * @returns true if healthy, false otherwise
   */
  healthCheck?(): Promise<boolean>;
}

/**
 * AI Provider 에러
 *
 * 개별 프로바이더에서 발생하는 에러.
 * Fallback 로직에서 다음 프로바이더로 전환할지 결정하는 데 사용됩니다.
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly providerName: string,
    public readonly code: AIProviderErrorCode,
    public readonly retryable: boolean,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

/**
 * Provider 에러 코드
 */
export type AIProviderErrorCode =
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'AUTHENTICATION'
  | 'INVALID_REQUEST'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'CONTENT_FILTER'
  | 'UNKNOWN';

/**
 * Provider 선택 결과
 */
export interface ProviderSelectionResult {
  provider: AIProvider;
  skipReason?: string;
}

/**
 * Fallback 이벤트 (로깅/모니터링용)
 */
export interface FallbackEvent {
  fromProvider: string;
  toProvider: string;
  reason: string;
  errorCode: AIProviderErrorCode;
  timestamp: Date;
}
