import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const globalForRedis = globalThis;

export const redis =
  globalForRedis.redis ||
  new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

redis.on("error", (err) => {
  // Silent fallback in development if local Redis is not running yet
  if (process.env.NODE_ENV === "development") {
    console.warn("Redis connection notice:", err.message);
  } else {
    console.error("Redis connection error:", err);
  }
});

export default redis;
