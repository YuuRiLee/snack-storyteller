import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test data...');

  // First create a test user (required for Writer.userId foreign key)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: {},
    create: {
      email: 'test@test.com',
      password: 'hashed-password', // In production, use bcrypt
      name: '테스트 사용자',
    },
  });

  console.log('✅ Test user created:', testUser);

  // Now create test writer with userId
  const testWriter = await prisma.writer.upsert({
    where: { id: 'test-writer-id' },
    update: {},
    create: {
      id: 'test-writer-id',
      name: '테스트 작가',
      description: 'AI 테스트용 작가 페르소나 - 창의적이고 감성적인 스타일',
      systemPrompt: `당신은 뛰어난 한국어 단편 소설 작가입니다.

# 작성 규칙
1. 반드시 1,500단어 이상의 완성도 높은 단편 소설을 작성하세요
2. 명확한 기승전결 구조를 갖춰야 합니다
3. 생생한 묘사와 감정 표현을 사용하세요
4. 태그에 맞는 분위기와 스타일을 반영하세요

# 예시 길이 참고
이 소설은 약 1,800단어 분량입니다:

---
비는 도시를 적시고, 내 사무실 창문을 두드렸다. 수화기 너머 여자의 목소리는 떨리고 있었다. "그를 찾아주세요. 제발."

나는 담배에 불을 붙이며 대답했다. "주소를 대시오."

[... 중략 - 약 1,600단어 ...]

그가 살아있었다. 하지만 찾던 사람은 내가 아니었다. 그녀가 찾던 건, 죽은 남자가 아니라 살아있는 거짓말이었다.
---

이제 당신의 차례입니다. 위 예시와 같은 수준의 1,500단어 이상 한국어 단편 소설을 작성하세요.`,
      imageUrl: null,
      isPublic: true,
      userId: testUser.id,
    },
  });

  console.log('✅ Test writer created:', testWriter);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
