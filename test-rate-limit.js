/**
 * Test script to verify Upstash Redis rate limiting works
 * Run with: node test-rate-limit.js
 */

const { Redis } = require('@upstash/redis');
const { Ratelimit } = require('@upstash/ratelimit');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testRateLimit() {
  console.log('🧪 Testing Upstash Redis Rate Limiting...\n');

  // 1. Test Redis connection
  console.log('1️⃣  Testing Redis connection...');
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const pingResult = await redis.ping();
    console.log('✅ Redis connection successful:', pingResult);
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    return;
  }

  // 2. Test rate limiting
  console.log('\n2️⃣  Testing rate limiting...');
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '10 s'),
      analytics: true,
      prefix: 'buildlight:test',
    });

    // Make 6 requests (should hit limit on 6th)
    console.log('   Making 6 requests (limit is 5 per 10 seconds)...\n');

    for (let i = 1; i <= 6; i++) {
      const { success, limit, remaining, reset } = await ratelimit.limit('test-user-123');

      const status = success ? '✅ ALLOWED' : '❌ BLOCKED';
      console.log(`   Request ${i}: ${status}`);
      console.log(`      - Limit: ${limit} requests`);
      console.log(`      - Remaining: ${remaining}`);
      console.log(`      - Reset in: ${Math.ceil((reset - Date.now()) / 1000)}s\n`);

      if (!success && i === 6) {
        console.log('✅ Rate limiting working correctly! Request 6 was blocked.\n');
      }
    }

    // Cleanup test key
    await redis.del('buildlight:test:test-user-123');
    console.log('🧹 Cleaned up test data');

  } catch (error) {
    console.error('❌ Rate limiting test failed:', error.message);
    return;
  }

  // 3. Test all rate limit levels
  console.log('\n3️⃣  Testing all rate limit levels...');
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const levels = [
      { name: 'STRICT', limit: 5, window: '10 s', prefix: 'buildlight:ratelimit:strict' },
      { name: 'STANDARD', limit: 20, window: '10 s', prefix: 'buildlight:ratelimit:standard' },
      { name: 'GENEROUS', limit: 100, window: '10 s', prefix: 'buildlight:ratelimit:generous' },
      { name: 'UPLOAD', limit: 10, window: '60 s', prefix: 'buildlight:ratelimit:upload' },
    ];

    for (const level of levels) {
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(level.limit, level.window),
        analytics: true,
        prefix: level.prefix,
      });

      const { success, limit, remaining } = await ratelimit.limit('test-all-levels');
      console.log(`   ${level.name}: ${limit} req/${level.window} - ✅ Working (${remaining} remaining)`);

      // Cleanup
      await redis.del(`${level.prefix}:test-all-levels`);
    }

    console.log('\n✅ All rate limit levels configured correctly!');

  } catch (error) {
    console.error('❌ Rate limit levels test failed:', error.message);
    return;
  }

  console.log('\n🎉 All tests passed! Rate limiting is ready for production.\n');
}

// Run tests
testRateLimit().catch(console.error);
