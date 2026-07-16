import type { StorageAdapter } from './types'

interface SynchronousStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export class MemoryStorageAdapter implements StorageAdapter {
  private readonly values = new Map<string, string>()

  async getItem(key: string) {
    return this.values.get(key) ?? null
  }

  async setItem(key: string, value: string) {
    this.values.set(key, value)
  }

  async removeItem(key: string) {
    this.values.delete(key)
  }
}

export function createBrowserStorageAdapter(storage: SynchronousStorageLike): StorageAdapter {
  return {
    getItem: async (key) => storage.getItem(key),
    setItem: async (key, value) => storage.setItem(key, value),
    removeItem: async (key) => storage.removeItem(key),
  }
}
