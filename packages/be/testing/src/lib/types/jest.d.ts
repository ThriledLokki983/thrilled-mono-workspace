/* eslint-disable @typescript-eslint/no-explicit-any */
// Jest global types for testing utilities
declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any[]> {
      (...args: Y): T;
      mockImplementation(fn?: (...args: Y) => T): this;
      mockImplementationOnce(fn?: (...args: Y) => T): this;
      mockReturnValue(value: T): this;
      mockReturnValueOnce(value: T): this;
      mockResolvedValue(value: T): this;
      mockResolvedValueOnce(value: T): this;
      mockRejectedValue(error: any): this;
      mockRejectedValueOnce(error: any): this;
      mockReset(): this;
      mockRestore(): void;
      mockClear(): this;
      getMockName(): string;
      mockName(name: string): this;
    }

    interface MockedFunction<T extends (...args: any[]) => any> extends Mock<ReturnType<T>, Parameters<T>> {
      (...args: Parameters<T>): ReturnType<T>;
    }

    // Simplified Mocked type to avoid parsing issues
    type Mocked<T> = {
      [K in keyof T]: T[K] extends (...args: any[]) => any ? MockedFunction<T[K]> : T[K];
    } & T;

    interface Matchers<R> {
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toMatchObject(expected: any): R;
      toContain(expected: any): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toBeNull(): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toBeGreaterThan(expected: number): R;
      toBeGreaterThanOrEqual(expected: number): R;
      toBeLessThan(expected: number): R;
      toBeLessThanOrEqual(expected: number): R;
      toHaveProperty(property: string, value?: any): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledTimes(times: number): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toMatch(expected: string | RegExp): R;
    }

    interface Expect {
      <T = any>(actual: T): Matchers<void>;
      any(constructor: any): any;
      anything(): any;
      arrayContaining(array: any[]): any;
      objectContaining(object: any): any;
      stringContaining(string: string): any;
      stringMatching(regexp: string | RegExp): any;
    }
  }

  const expect: jest.Expect;
  const describe: (name: string, fn: () => void) => void;
  const it: (name: string, fn: () => void | Promise<void>) => void;
  const beforeAll: (fn: () => void | Promise<void>) => void;
  const afterAll: (fn: () => void | Promise<void>) => void;
  const beforeEach: (fn: () => void | Promise<void>) => void;
  const afterEach: (fn: () => void | Promise<void>) => void;
}

export {};
