const { client } = require('./redisClient');

class CacheService {
  constructor(namespace = '') {
    this.namespace = namespace ? `${namespace}:` : '';
  } 

  _namespacedKey(key) {
    return `${this.namespace}${key}`;
  }
  
  async get(key) {
    try {
      const namespacedKey = this._namespacedKey(key);
      const cachedData = await client.get(namespacedKey);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }
  
  async set(key, data, ttl) {
    try {
      const namespacedKey = this._namespacedKey(key);
      await client.set(namespacedKey, JSON.stringify(data), { EX: ttl });
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }
  
  async del(keys) {
    if (!keys) return true;

    try {
      if (Array.isArray(keys)) {
        if (keys.length === 0) return true;
        const namespacedKeys = keys.map(key => this._namespacedKey(key));
        await client.del(namespacedKeys);
      } else {
        await client.del(this._namespacedKey(keys));
      }
      return true;
    } catch (error) {
      console.error(`Cache delete error:`, error);
      return false;
    }
  }

  async delByPattern(pattern) {
    try {
      const namespacedPattern = this._namespacedKey(pattern);
      const keys = await client.keys(namespacedPattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache delete by pattern error for ${pattern}:`, error);
      return false;
    }
  }

  async delByPatterns(patterns) {
    try {
      if (!patterns || patterns.length === 0) return true;

      const pipeline = client.pipeline();

      for (const pattern of patterns) {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          pipeline.del(keys);
        }
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error(`Cache delete by patterns error:`, error);
      return false;
    }
  }
}

module.exports = {
  forDomain: (domain) => new CacheService(domain),

  product: new CacheService('product'),
  user: new CacheService('user'),
  cart: new CacheService('cart'),
  category: new CacheService('category'),
  brand: new CacheService('brand'),

  instance: new CacheService()
};