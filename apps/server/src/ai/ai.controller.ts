import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

/**
 * AI Controller (Development/Testing Only)
 *
 * Endpoints for monitoring and testing AI infrastructure.
 *
 * Routes:
 * - GET /ai/status - Get all provider statuses
 * - GET /ai/fallback-events - Get recent fallback events
 * - POST /ai/circuits/reset - Reset all circuit breakers
 *
 * Note: These endpoints are for development and testing purposes.
 * In production, consider adding admin role guards.
 */
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  /**
   * Get Provider Status
   *
   * GET /ai/status
   *
   * Response:
   * - providers: Array with name, enabled, priority, circuitState, stats
   *
   * Useful for monitoring provider health and circuit breaker states.
   */
  @Get('status')
  getProviderStatus() {
    return {
      providers: this.aiService.getProviderStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get Recent Fallback Events
   *
   * GET /ai/fallback-events
   *
   * Response:
   * - events: Array of FallbackEvent (fromProvider, toProvider, reason, timestamp)
   *
   * Useful for tracking when and why fallbacks occurred.
   */
  @Get('fallback-events')
  getFallbackEvents() {
    return {
      events: this.aiService.getRecentFallbackEvents(20),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset All Circuit Breakers
   *
   * POST /ai/circuits/reset
   *
   * Response: { success: true, message: string }
   *
   * Admin operation to manually reset all circuits to CLOSED state.
   * Use when providers have recovered and you want to resume normal operation.
   */
  @Post('circuits/reset')
  resetCircuits() {
    this.aiService.resetAllCircuits();
    return {
      success: true,
      message: '모든 Circuit Breaker가 초기화되었습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}
