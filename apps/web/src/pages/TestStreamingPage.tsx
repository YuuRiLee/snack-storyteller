import { useState } from 'react';
import { useStoryGeneration } from '../hooks/useStoryGeneration';

/**
 * Test Page for SSE Streaming
 *
 * Simple UI to test story generation streaming.
 * Will be replaced by production UI in Task 6.
 */
export function TestStreamingPage() {
  const [writerId, setWriterId] = useState('test-writer-id');
  const [tags, setTags] = useState('로맨스,경쾌한,해피엔딩');

  const {
    isGenerating,
    isComplete,
    hasError,
    errorMessage,
    currentContent,
    retryAttempt,
    retryReason,
    story,
    generate,
    cancel,
    reset,
  } = useStoryGeneration();

  const handleGenerate = () => {
    const tagArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    generate(writerId, tagArray);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🧪 Story Generation Streaming Test</h1>

      {/* Controls */}
      <div
        style={{
          marginBottom: '2rem',
          padding: '1rem',
          background: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Writer ID:
            <input
              type="text"
              value={writerId}
              onChange={(e) => setWriterId(e.target.value)}
              disabled={isGenerating}
              style={{ marginLeft: '1rem', padding: '0.5rem', width: '300px' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            Tags (comma-separated):
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={isGenerating}
              placeholder="로맨스,경쾌한,해피엔딩"
              style={{ marginLeft: '1rem', padding: '0.5rem', width: '300px' }}
            />
          </label>
        </div>

        <div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !writerId || !tags}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              background: isGenerating ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              marginRight: '1rem',
            }}
          >
            {isGenerating ? '⏳ Generating...' : '🚀 Generate Story'}
          </button>

          <button
            onClick={cancel}
            disabled={!isGenerating}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !isGenerating ? 'not-allowed' : 'pointer',
              marginRight: '1rem',
            }}
          >
            ❌ Cancel
          </button>

          <button
            onClick={reset}
            disabled={isGenerating}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
            }}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Status */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>📊 Status</h2>
        <div
          style={{
            fontFamily: 'monospace',
            background: '#f5f5f5',
            padding: '1rem',
            borderRadius: '8px',
          }}
        >
          <div>isGenerating: {isGenerating ? '✅ true' : '❌ false'}</div>
          <div>isComplete: {isComplete ? '✅ true' : '❌ false'}</div>
          <div>hasError: {hasError ? '❌ true' : '✅ false'}</div>
          {errorMessage && <div style={{ color: 'red' }}>Error: {errorMessage}</div>}
          {retryAttempt !== null && (
            <div style={{ color: 'orange' }}>
              🔄 Retry {retryAttempt}/3 - Reason: {retryReason}
            </div>
          )}
        </div>
      </div>

      {/* Streaming Content */}
      {currentContent && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>📝 Current Content ({currentContent.length} chars)</h2>
          <div
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              whiteSpace: 'pre-wrap',
              fontFamily: 'Georgia, serif',
              fontSize: '1.1rem',
              lineHeight: '1.8',
              minHeight: '200px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {currentContent}
            {isGenerating && <span style={{ animation: 'blink 1s infinite' }}>▊</span>}
          </div>
        </div>
      )}

      {/* Final Story */}
      {story && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>✅ Final Story</h2>
          <div
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '2px solid #28a745',
            }}
          >
            <h3>{story.title}</h3>
            <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
              ID: {story.id} | Words: {story.wordCount}
            </div>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'Georgia, serif',
                fontSize: '1.1rem',
                lineHeight: '1.8',
              }}
            >
              {story.content}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div
        style={{ marginTop: '3rem', padding: '1rem', background: '#e9ecef', borderRadius: '8px' }}
      >
        <h3>📖 Instructions</h3>
        <ol>
          <li>
            Make sure backend server is running: <code>pnpm dev</code> in <code>apps/server</code>
          </li>
          <li>Ensure you have a Writer in the database with the ID you enter</li>
          <li>Enter writer ID and tags, then click "Generate Story"</li>
          <li>Watch the streaming content appear in real-time</li>
          <li>If generation fails, it will auto-retry (check Status section)</li>
          <li>Final story will appear in "Final Story" section when complete</li>
        </ol>

        <h4>Test Writer Creation (via Prisma Studio or API):</h4>
        <pre
          style={{ background: 'white', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}
        >
          {`// In Prisma Studio or via API:
{
  "id": "test-writer-id",
  "name": "테스트 작가",
  "systemPrompt": "당신은 한국어 단편 소설 작가입니다. 1500-2000단어의 완성도 높은 소설을 작성하세요.",
  "personality": "창의적이고 감성적",
  "isPublic": true
}`}
        </pre>
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
