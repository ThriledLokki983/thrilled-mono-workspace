/**
 * Jest Global Type Declarations
 * This file provides type definitions for Jest globals used throughout the testing package
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="jest" />

declare global {
  // Jest globals
  const describe: typeof jest.describe;
  const it: typeof jest.it;
  const test: typeof jest.test;
  const expect: typeof jest.expect;
  const beforeAll: typeof jest.beforeAll;
  const afterAll: typeof jest.afterAll;
  const beforeEach: typeof jest.beforeEach;
  const afterEach: typeof jest.afterEach;

  // Jest namespace
  namespace jest {
    interface Matchers<R> {
      toBeDefined(): R;
      toBeUndefined(): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toStrictEqual(expected: any): R;
      toMatchObject(expected: object): R;
      toHaveProperty(property: string, value?: any): R;
      toContain(item: any): R;
      toMatch(regexp: string | RegExp): R;
      toBeGreaterThan(number: number): R;
      toBeGreaterThanOrEqual(number: number): R;
      toBeLessThan(number: number): R;
      toBeLessThanOrEqual(number: number): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(times: number): R;
    }

    interface MockedFunction<T extends (...args: unknown[]) => unknown> {
      (...args: Parameters<T>): ReturnType<T>;
      mockReturnValue(value: ReturnType<T>): this;
      mockReturnValueOnce(value: ReturnType<T>): this;
      mockResolvedValue(value: Awaited<ReturnType<T>>): this;
      mockResolvedValueOnce(value: Awaited<ReturnType<T>>): this;
      mockRejectedValue(value: any): this;
      mockRejectedValueOnce(value: any): this;
      mockImplementation(fn: T): this;
      mockImplementationOnce(fn: T): this;
      mockClear(): this;
      mockReset(): this;
      mockRestore(): void;
    }

    // Simplified Mocked type to avoid parsing issues
    type Mocked<T> = {
      [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? MockedFunction<T[K]> : T[K];
    } & T;

    interface Mock<T = any, Y extends any[] = any[]> {
      (...args: Y): T;
      mockReturnValue(value: T): this;
      mockReturnValueOnce(value: T): this;
      mockResolvedValue(value: Awaited<T>): this;
      mockResolvedValueOnce(value: Awaited<T>): this;
      mockRejectedValue(value: any): this;
      mockRejectedValueOnce(value: any): this;
      mockImplementation(fn: (...args: Y) => T): this;
      mockImplementationOnce(fn: (...args: Y) => T): this;
      mockClear(): this;
      mockReset(): this;
      mockRestore(): void;
    }
  }
}

export {};
