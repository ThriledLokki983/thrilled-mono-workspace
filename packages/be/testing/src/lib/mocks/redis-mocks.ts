/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Redis } from 'ioredis';

// Define RedisStatus type locally since it's not exported from ioredis
type RedisStatus = 'wait' | 'connecting' | 'connect' | 'ready' | 'close' | 'reconnecting' | 'end' | 'lazyConnect';

// Type for pubsub listeners
type PubSubListener = (channel: string, message: string) => void;

/**
 * Mock Redis Client
 */
export class MockRedis implements Partial<Redis> {
  private data: Map<string, string> = new Map();
  private hashData: Map<string, Map<string, string>> = new Map();
  private setData: Map<string, Set<string>> = new Map();
  private listData: Map<string, string[]> = new Map();
  private ttlData: Map<string, number> = new Map();
  private pubsubListeners: Map<string, PubSubListener[]> = new Map();

  // Basic string operations
  get = jest.fn().mockImplementation((key: string) => {
    const value = this.data.get(key);
    return Promise.resolve(value || null);
  });

  set = jest.fn().mockImplementation((key: string, value: string, ...args: unknown[]) => {
    this.data.set(key, value);
    
    // Handle EX (expiration in seconds)
    if (args.length >= 2 && args[0] === 'EX') {
      const ttl = parseInt(args[1] as string);
      this.ttlData.set(key, Date.now() + ttl * 1000);
    }
    
    return Promise.resolve('OK');
  });

  setex = jest.fn().mockImplementation((key: string, seconds: number, value: string) => {
    this.data.set(key, value);
    this.ttlData.set(key, Date.now() + seconds * 1000);
    return Promise.resolve('OK');
  });

  del = jest.fn().mockImplementation((...keys: string[]) => {
    let deleted = 0;
    keys.forEach(key => {
      if (this.data.has(key)) {
        this.data.delete(key);
        this.ttlData.delete(key);
        deleted++;
      }
    });
    return Promise.resolve(deleted);
  });

  exists = jest.fn().mockImplementation((...keys: string[]) => {
    const count = keys.filter(key => this.data.has(key)).length;
    return Promise.resolve(count);
  });

  expire = jest.fn().mockImplementation((key: string, seconds: number) => {
    if (this.data.has(key)) {
      this.ttlData.set(key, Date.now() + seconds * 1000);
      return Promise.resolve(1);
    }
    return Promise.resolve(0);
  });

  ttl = jest.fn().mockImplementation((key: string) => {
    const expiry = this.ttlData.get(key);
    if (!expiry) return Promise.resolve(-1);
    
    const remaining = Math.floor((expiry - Date.now()) / 1000);
    return Promise.resolve(remaining > 0 ? remaining : -2);
  });

  keys = jest.fn().mockImplementation((pattern: string) => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const matchingKeys = Array.from(this.data.keys()).filter(key => regex.test(key));
    return Promise.resolve(matchingKeys);
  });

  // Hash operations
  hget = jest.fn().mockImplementation((key: string, field: string) => {
    const hash = this.hashData.get(key);
    return Promise.resolve(hash?.get(field) || null);
  });

  hset = jest.fn().mockImplementation((key: string, ...args: unknown[]) => {
    if (!this.hashData.has(key)) {
      this.hashData.set(key, new Map());
    }
    
    const hash = this.hashData.get(key);
    if (!hash) {
      return Promise.resolve(0);
    }
    
    let fieldsSet = 0;
    
    for (let i = 0; i < args.length; i += 2) {
      if (i + 1 < args.length) {
        const field = args[i] as string;
        const value = args[i + 1] as string;
        if (!hash.has(field)) fieldsSet++;
        hash.set(field, value);
      }
    }
    
    return Promise.resolve(fieldsSet);
  });

  hgetall = jest.fn().mockImplementation((key: string) => {
    const hash = this.hashData.get(key);
    if (!hash) return Promise.resolve({});
    
    const result: Record<string, string> = {};
    hash.forEach((value, field) => {
      result[field] = value;
    });
    
    return Promise.resolve(result);
  });

  hdel = jest.fn().mockImplementation((key: string, ...fields: string[]) => {
    const hash = this.hashData.get(key);
    if (!hash) return Promise.resolve(0);
    
    let deleted = 0;
    fields.forEach(field => {
      if (hash.delete(field)) deleted++;
    });
    
    return Promise.resolve(deleted);
  });

  // Set operations
  sadd = jest.fn().mockImplementation((key: string, ...members: string[]) => {
    if (!this.setData.has(key)) {
      this.setData.set(key, new Set());
    }
    
    const set = this.setData.get(key);
    if (!set) {
      return Promise.resolve(0);
    }
    
    let added = 0;
    
    members.forEach(member => {
      if (!set.has(member)) {
        set.add(member);
        added++;
      }
    });
    
    return Promise.resolve(added);
  });

  srem = jest.fn().mockImplementation((key: string, ...members: string[]) => {
    const set = this.setData.get(key);
    if (!set) return Promise.resolve(0);
    
    let removed = 0;
    members.forEach(member => {
      if (set.delete(member)) removed++;
    });
    
    return Promise.resolve(removed);
  });

  smembers = jest.fn().mockImplementation((key: string) => {
    const set = this.setData.get(key);
    return Promise.resolve(set ? Array.from(set) : []);
  });

  sismember = jest.fn().mockImplementation((key: string, member: string) => {
    const set = this.setData.get(key);
    return Promise.resolve(set?.has(member) ? 1 : 0);
  });

  // List operations
  lpush = jest.fn().mockImplementation((key: string, ...values: string[]) => {
    if (!this.listData.has(key)) {
      this.listData.set(key, []);
    }
    
    const list = this.listData.get(key);
    if (!list) {
      return Promise.resolve(0);
    }
    
    values.reverse().forEach(value => {
      list.unshift(value);
    });
    
    return Promise.resolve(list.length);
  });

  rpush = jest.fn().mockImplementation((key: string, ...values: string[]) => {
    if (!this.listData.has(key)) {
      this.listData.set(key, []);
    }
    
    const list = this.listData.get(key);
    if (!list) {
      return Promise.resolve(0);
    }
    
    values.forEach(value => {
      list.push(value);
    });
    
    return Promise.resolve(list.length);
  });

  lpop = jest.fn().mockImplementation((key: string) => {
    const list = this.listData.get(key);
    return Promise.resolve(list?.shift() || null);
  });

  rpop = jest.fn().mockImplementation((key: string) => {
    const list = this.listData.get(key);
    return Promise.resolve(list?.pop() || null);
  });

  llen = jest.fn().mockImplementation((key: string) => {
    const list = this.listData.get(key);
    return Promise.resolve(list?.length || 0);
  });

  lrange = jest.fn().mockImplementation((key: string, start: number, stop: number) => {
    const list = this.listData.get(key);
    if (!list) return Promise.resolve([]);
    
    return Promise.resolve(list.slice(start, stop + 1));
  });

  // Connection operations
  ping = jest.fn().mockImplementation(() => {
    return Promise.resolve('PONG');
  });

  connect = jest.fn().mockImplementation(() => {
    return Promise.resolve('OK');
  });

  quit = jest.fn().mockImplementation(() => {
    return Promise.resolve('OK');
  });

  disconnect = jest.fn().mockImplementation(() => {
    return Promise.resolve();
  });

  // Utility operations
  flushall = jest.fn().mockImplementation(() => {
    this.data.clear();
    this.hashData.clear();
    this.setData.clear();
    this.listData.clear();
    this.ttlData.clear();
    return Promise.resolve('OK');
  });

  flushdb = jest.fn().mockImplementation(() => {
    return this.flushall();
  });

  // Pub/Sub operations
  publish = jest.fn().mockImplementation((channel: string, message: string) => {
    const listeners = this.pubsubListeners.get(channel) || [];
    listeners.forEach(listener => listener(channel, message));
    return Promise.resolve(listeners.length);
  });

  subscribe = jest.fn().mockImplementation((..._channels: string[]) => {
    return Promise.resolve();
  });

  unsubscribe = jest.fn().mockImplementation((..._channels: string[]) => {
    return Promise.resolve();
  });

  on = jest.fn().mockImplementation((event: string, listener: PubSubListener) => {
    if (event === 'message') {
      // Store message listeners for pub/sub simulation
      if (!this.pubsubListeners.has('*')) {
        this.pubsubListeners.set('*', []);
      }
      const globalListeners = this.pubsubListeners.get('*');
      if (globalListeners) {
        globalListeners.push(listener);
      }
    }
    return this;
  });

  // Status and configuration
  status?: 'wait' | 'connecting' | 'connect' | 'ready' | 'close' | 'reconnecting' | 'end' = 'ready';

  // Helper methods for testing
  clearData(): void {
    this.data.clear();
    this.hashData.clear();
    this.setData.clear();
    this.listData.clear();
    this.ttlData.clear();
    this.pubsubListeners.clear();
  }

  getData(): Map<string, string> {
    return new Map(this.data);
  }

  getHashData(): Map<string, Map<string, string>> {
    return new Map(this.hashData);
  }

  getSetData(): Map<string, Set<string>> {
    return new Map(this.setData);
  }

  getListData(): Map<string, string[]> {
    return new Map(this.listData);
  }

  simulateExpiry(): void {
    const now = Date.now();
    for (const [key, expiry] of this.ttlData.entries()) {
      if (expiry <= now) {
        this.data.delete(key);
        this.ttlData.delete(key);
      }
    }
  }
}

/**
 * Create mock Redis instance
 */
export function createMockRedis(): MockRedis {
  return new MockRedis();
}

/**
 * Redis test utilities
 */
export class RedisTestUtils {
  /**
   * Test Redis operations with a mock instance
   */
  static async testRedisOperations(
    operations: (redis: MockRedis) => Promise<void>,
    autoExpiry = false
  ): Promise<MockRedis> {
    const mockRedis = createMockRedis();
    
    await operations(mockRedis);
    
    if (autoExpiry) {
      mockRedis.simulateExpiry();
    }
    
    return mockRedis;
  }

  /**
   * Setup Redis mocks for cache manager testing
   */
  static setupCacheManagerMocks(): MockRedis {
    const mockRedis = createMockRedis();
    
    // Override constructor to return our mock
    jest.doMock('ioredis', () => {
      return {
        Redis: jest.fn().mockImplementation(() => mockRedis),
        default: jest.fn().mockImplementation(() => mockRedis),
      };
    });
    
    return mockRedis;
  }

  /**
   * Test cache operations
   */
  static async testCacheOperations(
    redis: MockRedis,
    operations: {
      set: { key: string; value: string; ttl?: number }[];
      get: string[];
      delete: string[];
    }
  ): Promise<{
    setResults: string[];
    getResults: (string | null)[];
    deleteResults: number[];
  }> {
    // Set operations
    const setResults: string[] = [];
    for (const op of operations.set) {
      const result = op.ttl 
        ? await redis.setex(op.key, op.ttl, op.value)
        : await redis.set(op.key, op.value);
      setResults.push(result);
    }

    // Get operations
    const getResults: (string | null)[] = [];
    for (const key of operations.get) {
      const result = await redis.get(key);
      getResults.push(result);
    }

    // Delete operations
    const deleteResults: number[] = [];
    for (const key of operations.delete) {
      const result = await redis.del(key);
      deleteResults.push(result);
    }

    return { setResults, getResults, deleteResults };
  }
}
