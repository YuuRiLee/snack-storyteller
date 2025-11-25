/**
 * Moderation Result Interface
 */
export interface ModerationResult {
  safe: boolean;
  reason?: string;
}

/**
 * Korean Filter
 *
 * Fast keyword-based content filtering for Korean text.
 * First layer of moderation before OpenAI Moderation API.
 *
 * Strategy:
 * - Lightweight keyword matching (no regex)
 * - Focuses on Korean-specific inappropriate terms
 * - Fail-fast to avoid expensive API calls
 *
 * Categories:
 * - Profanity (욕설)
 * - Sexual content (성적 콘텐츠)
 * - Violence (폭력)
 * - Hate speech (혐오 표현)
 */
export class KoreanFilter {
  private readonly blockedKeywords = [
    // 욕설 (Profanity)
    '씨발',
    '개새끼',
    '병신',
    '엿먹어',
    '지랄',
    '미친',
    '좆',
    '염병',

    // 성적 콘텐츠 (Sexual content)
    '섹스',
    '야동',
    '포르노',
    '자위',
    '강간',
    '성폭행',

    // 폭력 (Violence)
    '살인',
    '자살',
    '학살',
    '고문',
    '테러',

    // 혐오 표현 (Hate speech)
    '김치녀',
    '한남',
    '맘충',
    '틀딱',
    '급식충',
  ];

  /**
   * Check content for blocked keywords
   *
   * @param content - Text to check
   * @returns ModerationResult with safe status and reason if blocked
   */
  check(content: string): ModerationResult {
    const lowerContent = content.toLowerCase();

    for (const keyword of this.blockedKeywords) {
      if (lowerContent.includes(keyword)) {
        return {
          safe: false,
          reason: `부적절한 키워드 감지: ${keyword}`,
        };
      }
    }

    return { safe: true };
  }
}
