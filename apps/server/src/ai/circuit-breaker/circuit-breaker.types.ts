/**
 * Circuit Breaker Types
 *
 * Circuit Breaker 패턴의 타입 정의.
 * 연속 실패 시 자동으로 차단하고, 일정 시간 후 복구를 시도합니다.
 */

/**
 * Circuit 상태
 *
 * - CLOSED: 정상 상태, 요청 허용
 * - OPEN: 차단 상태, 요청 즉시 실패
 * - HALF_OPEN: 테스트 상태, 제한된 요청 허용
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * 개별 Provider의 Circuit 상태
 */
export interface ProviderCircuitState {
  /** 현재 상태 */
  state: CircuitState;

  /** 연속 실패 횟수 */
  failureCount: number;

  /** 마지막 실패 시간 */
  lastFailureTime: Date | null;

  /** 마지막 성공 시간 */
  lastSuccessTime: Date | null;

  /** OPEN 상태 전환 시간 */
  openedAt: Date | null;

  /** HALF_OPEN에서 허용된 테스트 요청 수 */
  halfOpenRequestCount: number;
}

/**
 * Circuit Breaker 설정
 */
export interface CircuitBreakerConfig {
  /**
   * OPEN 전환까지 연속 실패 수
   * @default 5
   */
  failureThreshold: number;

  /**
   * OPEN → HALF_OPEN 전환까지 대기 시간 (ms)
   * @default 30000
   */
  resetTimeoutMs: number;

  /**
   * HALF_OPEN에서 허용할 테스트 요청 수
   * @default 1
   */
  halfOpenRequests: number;

  /**
   * 실패 카운트 리셋 윈도우 (ms)
   * 이 시간 내에 연속 실패가 발생해야 카운트됨
   * @default 60000
   */
  monitoringWindowMs: number;
}

/**
 * Circuit 상태 변경 이벤트
 */
export interface CircuitStateChangeEvent {
  providerName: string;
  previousState: CircuitState;
  newState: CircuitState;
  reason: string;
  timestamp: Date;
}

/**
 * Circuit Breaker 통계
 */
export interface CircuitBreakerStats {
  providerName: string;
  state: CircuitState;
  failureCount: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
  lastStateChange: Date | null;
}
