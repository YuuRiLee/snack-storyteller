import * as React from 'react';
import { Card, CardContent, Badge } from '../ui';
import type { StoryStats as StoryStatsType } from '../../types';

interface StoryStatsProps {
  stats: StoryStatsType;
}

/**
 * StoryStats Component
 *
 * Displays user's story statistics:
 * - Total stories count
 * - Total words
 * - Total read time
 * - Average word count
 * - Top tags
 * - Bookmarked count
 */
export function StoryStats({ stats }: StoryStatsProps) {
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '만';
    }
    return num.toLocaleString();
  };

  const formatTime = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
    }
    return `${minutes}분`;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Stories */}
          <StatItem
            label="총 소설"
            value={stats.totalStories}
            suffix="편"
            icon={<BookIcon />}
          />

          {/* Total Words */}
          <StatItem
            label="총 글자 수"
            value={formatNumber(stats.totalWords)}
            suffix="자"
            icon={<TextIcon />}
          />

          {/* Total Read Time */}
          <StatItem
            label="총 읽기 시간"
            value={formatTime(stats.totalReadTime)}
            icon={<ClockIcon />}
          />

          {/* Average Word Count */}
          <StatItem
            label="평균 길이"
            value={formatNumber(stats.averageWordCount)}
            suffix="자"
            icon={<ChartIcon />}
          />

          {/* Bookmarked Count */}
          <StatItem
            label="북마크"
            value={stats.bookmarkedCount}
            suffix="개"
            icon={<BookmarkIcon />}
          />

          {/* Top Tags */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-xs text-muted-foreground mb-1">인기 태그</p>
            <div className="flex flex-wrap gap-1">
              {stats.topTags.length > 0 ? (
                stats.topTags.slice(0, 3).map((tag) => (
                  <Badge key={tag.tag} variant="secondary" className="text-xs">
                    {tag.tag} ({tag.count})
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">없음</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatItemProps {
  label: string;
  value: number | string;
  suffix?: string;
  icon: React.ReactNode;
}

function StatItem({ label, value, suffix, icon }: StatItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">
          {value}
          {suffix && <span className="text-sm font-normal ml-0.5">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}

// Icons
function BookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  );
}

export default StoryStats;
