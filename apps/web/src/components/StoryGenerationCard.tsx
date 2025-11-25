import { useState } from 'react';
import { useStoryGeneration } from '../hooks/useStoryGeneration';

interface Writer {
  id: string;
  name: string;
  imageUrl?: string | null;
  personality: string;
}

const AVAILABLE_TAGS = [
  '로맨스',
  '느와르',
  '경쾌한',
  '어두운',
  '해피엔딩',
  '반전',
  '스릴러',
  '판타지',
];

interface StoryGenerationCardProps {
  writers: Writer[];
}

export function StoryGenerationCard({ writers }: StoryGenerationCardProps) {
  const [selectedWriter, setSelectedWriter] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const {
    isGenerating,
    isComplete,
    hasError,
    errorMessage,
    currentContent,
    retryAttempt,
    story,
    generate,
    cancel,
    reset,
  } = useStoryGeneration();

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleGenerate = () => {
    if (selectedWriter && selectedTags.length > 0) {
      generate(selectedWriter, selectedTags);
    }
  };

  const handleNewStory = () => {
    reset();
    setSelectedTags([]);
  };

  const selectedWriterData = writers.find((w) => w.id === selectedWriter);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          AI 단편 소설 생성
        </h1>
        <p className="text-muted-foreground">
          작가를 선택하고 태그를 골라 나만의 소설을 만들어보세요
        </p>
      </div>

      {/* Generation Form */}
      {!isComplete && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          {/* Writer Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              작가 선택
            </label>
            <select
              value={selectedWriter}
              onChange={(e) => setSelectedWriter(e.target.value)}
              disabled={isGenerating}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">작가를 선택하세요</option>
              {writers.map((writer) => (
                <option key={writer.id} value={writer.id}>
                  {writer.name} - {writer.personality}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              태그 선택 (최대 3개)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                const isDisabled = !isSelected && selectedTags.length >= 3;

                return (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    disabled={isDisabled || isGenerating}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all
                      ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }
                      ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                      ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              선택됨: {selectedTags.length}/3
            </p>
          </div>

          {/* Generate Button */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={
                isGenerating || !selectedWriter || selectedTags.length === 0
              }
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {isGenerating ? '⏳ 생성 중...' : '🚀 소설 생성하기'}
            </button>

            {isGenerating && (
              <button
                onClick={cancel}
                className="px-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:bg-destructive/90 transition-colors"
              >
                ❌ 취소
              </button>
            )}
          </div>

          {/* Status Messages */}
          {retryAttempt !== null && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-yellow-500 text-sm">
                🔄 재시도 중... ({retryAttempt}/3)
              </p>
            </div>
          )}

          {hasError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive text-sm">❌ {errorMessage}</p>
            </div>
          )}
        </div>
      )}

      {/* Streaming Display */}
      {currentContent && !isComplete && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              생성 중...
            </h2>
            <span className="text-sm text-muted-foreground">
              {currentContent.length} 글자
            </span>
          </div>
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-foreground">
              {currentContent}
              {isGenerating && (
                <span className="inline-block w-2 h-6 bg-primary ml-1 animate-pulse" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Final Story */}
      {isComplete && story && (
        <div className="bg-card border-2 border-primary rounded-lg p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {story.title}
              </h2>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>📖 {story.wordCount} 단어</span>
                <span>
                  ✍️{' '}
                  {selectedWriterData?.name || story.writer?.name || '작가'}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handleNewStory}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              새 소설 쓰기
            </button>
          </div>

          <div className="border-t border-border pt-6">
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-foreground">
                {story.content}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-border">
            <button className="flex-1 px-6 py-3 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors">
              💾 저장하기
            </button>
            <button className="flex-1 px-6 py-3 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors">
              🔗 공유하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
