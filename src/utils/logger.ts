/**
 * Conditional logger — only logs in development mode.
 * In production builds, all calls are no-ops.
 */

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export const log = isDev ? console.log : () => {};
export const warn = isDev ? console.warn : () => {};
export const error = isDev ? console.error : () => {};
