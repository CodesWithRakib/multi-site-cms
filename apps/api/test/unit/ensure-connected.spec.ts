import { describe, expect, it } from '@jest/globals';
import type { DataSource } from 'typeorm';

import { ensureInitialized, getInitializedRepository } from '../../src/database/ensure-connected';

/**
 * Mirrors TypeORM's DataSource.initialize contract: it throws when called while
 * already initialized or still initializing, and sets `isInitialized` before the
 * remaining (metadata) work finishes.
 */
class FakeDataSource {
  isInitialized = false;
  isInitializing = false;
  metadataReady = false;
  initializeCalls = 0;
  failNext = false;

  async initialize(): Promise<this> {
    this.initializeCalls += 1;
    if (this.isInitialized || this.isInitializing) {
      throw new Error('CannotConnectAlreadyConnectedError');
    }
    this.isInitializing = true;
    try {
      await new Promise((resolve) => setTimeout(resolve, 5));
      if (this.failNext) {
        this.failNext = false;
        throw new Error('connect failed');
      }
      this.isInitialized = true;
      await new Promise((resolve) => setTimeout(resolve, 5));
      this.metadataReady = true;
      return this;
    } finally {
      this.isInitializing = false;
    }
  }

  getRepository(target: string): { target: string; metadataReady: boolean } {
    return { target, metadataReady: this.metadataReady };
  }
}

const asDataSource = (fake: FakeDataSource): DataSource => fake as unknown as DataSource;

describe('ensureInitialized', () => {
  it('shares one initialization across concurrent cold-start callers', async () => {
    const fake = new FakeDataSource();

    await Promise.all(Array.from({ length: 10 }, () => ensureInitialized(asDataSource(fake))));

    expect(fake.initializeCalls).toBe(1);
    expect(fake.isInitialized).toBe(true);
  });

  it('never hands out a repository before metadata is built', async () => {
    const fake = new FakeDataSource();

    const repositories = await Promise.all(
      Array.from({ length: 5 }, () => getInitializedRepository(asDataSource(fake), 'Post')),
    );

    for (const repository of repositories) {
      expect(repository).toEqual({ target: 'Post', metadataReady: true });
    }
  });

  it('does not call initialize again once initialized', async () => {
    const fake = new FakeDataSource();
    await ensureInitialized(asDataSource(fake));
    await ensureInitialized(asDataSource(fake));

    expect(fake.initializeCalls).toBe(1);
  });

  it('retries after a failed attempt', async () => {
    const fake = new FakeDataSource();
    fake.failNext = true;

    await expect(ensureInitialized(asDataSource(fake))).rejects.toThrow('connect failed');
    await ensureInitialized(asDataSource(fake));

    expect(fake.initializeCalls).toBe(2);
    expect(fake.isInitialized).toBe(true);
  });
});
