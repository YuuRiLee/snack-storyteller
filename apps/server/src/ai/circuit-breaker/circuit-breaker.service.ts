import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CircuitState,
  ProviderCircuitState,
  CircuitBreakerConfig,
  CircuitStateChangeEvent,
  CircuitBreakerStats,
} from './circuit-breaker.types';

/**
 * Circuit Breaker Service
 *
 * Provider별 Circuit Breaker 패턴을 구현합니다.
 *
 * 동작 방식:
 * 1. CLOSED: 정상 상태, 모든 요청 허용
 * 2. 연속 N회 실패 시 → OPEN 전환 (요청 즉시 차단)
 * 3. resetTimeout 경과 후 → HALF_OPEN 전환 (테스트 요청 허용)
 * 4. 테스트 성공 → CLOSED, 실패 → OPEN
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, ProviderCircuitState>();
  private readonly config: CircuitBreakerConfig;

  // 통계용 카운터
  private readonly stats = new Map<
    string,
    { totalRequests: number; totalFailures: number; totalSuccesses: number }
  >();

  constructor(configService: ConfigService) {
    this.config = {
      failureThreshold: configService.get<number>(
        'AI_CIRCUIT_FAILURE_THRESHOLD',
        5,
      ),
      resetTimeoutMs: configService.get<number>(
        'AI_CIRCUIT_RESET_TIMEOUT_MS',
        30000,
      ),
      halfOpenRequests: configService.get<number>(
        'AI_CIRCUIT_HALF_OPEN_REQUESTS',
        1,
      ),
      monitoringWindowMs: configService.get<number>(
        'AI_CIRCUIT_MONITORING_WINDOW_MS',
        60000,
      ),
    };

    this.logger.log('CircuitBreakerService initialized', {
      config: this.config,
    });
  }

  /**
   * 요청 전 Circuit 상태 확인
   *
   * @param providerName - 프로바이더 이름
   * @returns true if request is allowed, false if circuit is open
   */
  canRequest(providerName: string): boolean {
    const circuit = this.getOrCreateCircuit(providerName);

    // OPEN 상태에서 resetTimeout 경과 확인
    if (circuit.state === 'OPEN') {
      if (this.shouldTransitionToHalfOpen(circuit)) {
        this.transitionState(
          providerName,
          'HALF_OPEN',
          'Reset timeout elapsed',
        );
        return true;
      }
      return false;
    }

    // HALF_OPEN 상태에서 허용된 요청 수 확인
    if (circuit.state === 'HALF_OPEN') {
      if (circuit.halfOpenRequestCount >= this.config.halfOpenRequests) {
        return false;
      }
      circuit.halfOpenRequestCount++;
      return true;
    }

    // CLOSED 상태: 항상 허용
    return true;
  }

  /**
   * 현재 Circuit 상태 조회
   */
  getState(providerName: string): CircuitState {
    const circuit = this.getOrCreateCircuit(providerName);

    // OPEN 상태에서 resetTimeout 경과 확인 (상태 조회 시에도 전환)
    if (circuit.state === 'OPEN' && this.shouldTransitionToHalfOpen(circuit)) {
      this.transitionState(providerName, 'HALF_OPEN', 'Reset timeout elapsed');
    }

    return circuit.state;
  }

  /**
   * 요청 성공 기록
   */
  recordSuccess(providerName: string): void {
    const circuit = this.getOrCreateCircuit(providerName);
    const stats = this.getOrCreateStats(providerName);

    stats.totalRequests++;
    stats.totalSuccesses++;

    circuit.lastSuccessTime = new Date();
    circuit.failureCount = 0;

    // HALF_OPEN 상태에서 성공 시 CLOSED로 전환
    if (circuit.state === 'HALF_OPEN') {
      this.transitionState(providerName, 'CLOSED', 'Test request succeeded');
    }

    this.logger.debug({
      event: 'circuit_success',
      provider: providerName,
      state: circuit.state,
    });
  }

  /**
   * 요청 실패 기록
   */
  recordFailure(providerName: string, error?: Error): void {
    const circuit = this.getOrCreateCircuit(providerName);
    const stats = this.getOrCreateStats(providerName);

    stats.totalRequests++;
    stats.totalFailures++;

    const now = new Date();

    // Monitoring window 내의 실패만 카운트
    if (
      circuit.lastFailureTime &&
      now.getTime() - circuit.lastFailureTime.getTime() >
        this.config.monitoringWindowMs
    ) {
      // 윈도우 밖의 실패는 카운트 리셋
      circuit.failureCount = 0;
    }

    circuit.failureCount++;
    circuit.lastFailureTime = now;

    this.logger.warn({
      event: 'circuit_failure',
      provider: providerName,
      failureCount: circuit.failureCount,
      threshold: this.config.failureThreshold,
      error: error?.message,
    });

    // HALF_OPEN 상태에서 실패 시 즉시 OPEN으로 전환
    if (circuit.state === 'HALF_OPEN') {
      this.transitionState(providerName, 'OPEN', 'Test request failed');
      return;
    }

    // CLOSED 상태에서 임계치 도달 시 OPEN으로 전환
    if (
      circuit.state === 'CLOSED' &&
      circuit.failureCount >= this.config.failureThreshold
    ) {
      this.transitionState(
        providerName,
        'OPEN',
        `Failure threshold reached (${circuit.failureCount}/${this.config.failureThreshold})`,
      );
    }
  }

  /**
   * Circuit 강제 리셋 (테스트/관리용)
   */
  reset(providerName: string): void {
    const circuit = this.getOrCreateCircuit(providerName);
    const previousState = circuit.state;

    circuit.state = 'CLOSED';
    circuit.failureCount = 0;
    circuit.halfOpenRequestCount = 0;
    circuit.openedAt = null;

    this.logger.log({
      event: 'circuit_reset',
      provider: providerName,
      previousState,
    });
  }

  /**
   * 모든 Circuit 리셋
   */
  resetAll(): void {
    for (const providerName of this.circuits.keys()) {
      this.reset(providerName);
    }
    this.logger.log('All circuits reset');
  }

  /**
   * Circuit 통계 조회
   */
  getStats(providerName: string): CircuitBreakerStats {
    const circuit = this.getOrCreateCircuit(providerName);
    const stats = this.getOrCreateStats(providerName);

    return {
      providerName,
      state: circuit.state,
      failureCount: circuit.failureCount,
      totalRequests: stats.totalRequests,
      totalFailures: stats.totalFailures,
      totalSuccesses: stats.totalSuccesses,
      lastStateChange: circuit.openedAt,
    };
  }

  /**
   * 모든 Provider의 통계 조회
   */
  getAllStats(): CircuitBreakerStats[] {
    return Array.from(this.circuits.keys()).map((name) => this.getStats(name));
  }

  /**
   * Circuit 상태가 OPEN인지 확인
   */
  isOpen(providerName: string): boolean {
    return this.getState(providerName) === 'OPEN';
  }

  /**
   * Circuit 상태가 CLOSED인지 확인
   */
  isClosed(providerName: string): boolean {
    return this.getState(providerName) === 'CLOSED';
  }

  // Private methods

  private getOrCreateCircuit(providerName: string): ProviderCircuitState {
    if (!this.circuits.has(providerName)) {
      this.circuits.set(providerName, {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: null,
        lastSuccessTime: null,
        openedAt: null,
        halfOpenRequestCount: 0,
      });
    }
    return this.circuits.get(providerName)!;
  }

  private getOrCreateStats(providerName: string) {
    if (!this.stats.has(providerName)) {
      this.stats.set(providerName, {
        totalRequests: 0,
        totalFailures: 0,
        totalSuccesses: 0,
      });
    }
    return this.stats.get(providerName)!;
  }

  private shouldTransitionToHalfOpen(circuit: ProviderCircuitState): boolean {
    if (circuit.state !== 'OPEN' || !circuit.openedAt) {
      return false;
    }

    const elapsed = Date.now() - circuit.openedAt.getTime();
    return elapsed >= this.config.resetTimeoutMs;
  }

  private transitionState(
    providerName: string,
    newState: CircuitState,
    reason: string,
  ): void {
    const circuit = this.getOrCreateCircuit(providerName);
    const previousState = circuit.state;

    circuit.state = newState;

    if (newState === 'OPEN') {
      circuit.openedAt = new Date();
      circuit.halfOpenRequestCount = 0;
    } else if (newState === 'HALF_OPEN') {
      circuit.halfOpenRequestCount = 0;
    } else if (newState === 'CLOSED') {
      circuit.openedAt = null;
      circuit.failureCount = 0;
      circuit.halfOpenRequestCount = 0;
    }

    const event: CircuitStateChangeEvent = {
      providerName,
      previousState,
      newState,
      reason,
      timestamp: new Date(),
    };

    this.logger.warn({
      event: 'circuit_state_change',
      ...event,
    });
  }
}
