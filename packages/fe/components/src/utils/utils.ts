// noinspection JSUnusedGlobalSymbols

import React from 'react';
import DOMPurify from 'dompurify';
import { parseJson } from '@grrr/utils';
import type { CssBreakPointsInterface } from '../types/common-interfaces';


/**
 * Convert to integer.
 */
export const int = (value: string) => parseInt(value, 10);

/**
 * Arrow key identifiers.
 */
export const isLeftKey = (e: React.KeyboardEvent<HTMLButtonElement | MouseEvent>) =>
  e.key && e.key === 'ArrowLeft';
export const isUpKey = (e: React.KeyboardEvent<HTMLButtonElement>) => e.key && e.key === 'ArrowUp';
export const isRightKey = (e: React.KeyboardEvent<HTMLButtonElement>) =>
  e.key && e.key === 'ArrowRight';
export const isDownKey = (e: React.KeyboardEvent<HTMLButtonElement>) =>
  e.key && e.key === 'ArrowDown';

export const isSpaceKey = (e: React.KeyboardEvent<HTMLButtonElement>) => e.key && e.key === ' ';
export const isEnterKey = (e: React.KeyboardEvent<HTMLButtonElement>) => e.key && e.key === 'Enter';
export const isEscapeKey = (e: React.KeyboardEvent<HTMLButtonElement>) =>
  e.key && e.key === 'Escape';

/**
 * Sanitize HTML content.
 */
export const sanitize = (value: string) => DOMPurify.sanitize(value);

/**
 * New line to breaks (equal to `nl2br` in PHP).
 */
export const nl2br = (value: string) => {
  const sanitized = sanitize(value);
  return sanitized?.replace(/[\r\n]+/g, '<br/>');
};

/**
 * Highlight string matches in search queries.
 */
export const highlight = (content: string, query: string) => {
  if (!query) {
    return content;
  }
  const regex = new RegExp(query.split(' ').join('|'), 'ig');
  const sanitized = sanitize(content);
  return sanitized.replace(regex, '<mark>$&</mark>');
};

/**
 * Clamp numbers.
 */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Check if number is even or odd.
 */
export const isEven = (value: number) => value % 2 === 0;
export const isOdd = (value: number) => Math.abs(value % 2) === 1;

/**
 * Basic sessionStorage and localStorage helpers.
 */
export const store = (key: string, value: string, { permanent = false } = {}) => {
  if (!key) {
    return;
  }
  const storage = permanent ? localStorage : sessionStorage;
  storage.setItem(key, JSON.stringify(value));
};
export const restore = (key: string, { permanent = false } = {}) => {
  const storage = permanent ? localStorage : sessionStorage;
  return parseJson(storage.getItem(key));
};

/**
 * Scroll to top.
 */
export const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  window.scrollTo({
    top: 0,
    behavior: behavior,
  });
};

/**
 * Set input value, which is a bit different in React.
 * See: https://stackoverflow.com/a/46012210
 */
export const setReactInputValue = (input: string, value: string) => {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  nativeInputValueSetter?.call(input, value);
};

/**
 * URL slash helpers.
 */
export const stripTrailingSlash = (string: string) => string.replace(/\/$/g, '');
export const stripDoubleSlashes = (string: string) => string.replace(/\/\/+/g, '/');

/**
 * Prefers reduced motion.
 */
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Get CSS breakpoint values from CSS variables.
 */
export const getBreakpointValues = (sizes: CssBreakPointsInterface = []) =>
  sizes.reduce(
    (acc: Record<string, number>, size: string) => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(
        `--breakpoint-${size}`
      );
      return {
        ...acc,
        [size]: int(value),
      };
    },
    {} as Record<string, number>
  );

/**
 * Check if a breakpoint matches the current width.
 * Note: `window.innerWidth` is full width, `clientWidth` excludes visible scrollbar.
 */
export const matchesBreakpoint = (size: number) =>
  (window.innerWidth || document.documentElement.clientWidth) >= size;

/**
 * Get array with matching breakpoint names.
 */
export const getMatchingBreakpoints = (sizes: number[]) => {
  return sizes.filter((size) => matchesBreakpoint(size));
};
