import { UnauthorizedException } from '@nestjs/common';

/**
 * Generic request with user object
 */
interface RequestWithUser {
  user?: { id?: string };
}

/**
 * Extract user ID from request or throw UnauthorizedException
 */
export function getUserIdOrThrow(req: RequestWithUser): string {
  if (!req.user?.id) {
    throw new UnauthorizedException('Authentication required');
  }
  return req.user.id;
}
