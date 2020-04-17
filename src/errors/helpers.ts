/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';

/**
 * A global handler to process ignored exceptions.
 */
export type ExceptionHandler = (exception: Exception) => void;

/**
 * List of ignored exceptions.
 */
let ignoredExceptions = [] as { new (): Exception }[];

/**
 * The global exception handler that was registered.
 */
let exceptionHandler: (exception: Exception) => void;

/**
 * Turns on all exceptions
 */
export function dontIgnoreExceptions(): void {
  ignoredExceptions = [] as { new (): Exception }[];
}

/**
 * Turns off the given exceptions. Once turned off, the specified exception
 * will
 * not be thrown. When such error occurred, if a global error handler is
 * previously set with {@link setExceptionHandler}, the error handler will be
 * invoked with the actual exception.
 * @param exceptions everything passed to this parameter, albeit arrays, rest
 *   arguments, or combination of both, will be flattened to a one-dimension
 *   array.
 */
export function ignoreExceptions(
  ...exceptions: { new (): Exception }[] | { new (): Exception }[][]
): void {
  ignoredExceptions = exceptions.flat();
}

/**
 * Sets a global error handler, used in conjunction with
 * {@link ignoreExceptions}.
 * @param handler
 */
export function setExceptionHandler(handler: ExceptionHandler): void {
  exceptionHandler = handler;
}

/**
 * Checks if the given exception should be ignored.
 * @param ex
 */
export function shouldIgnoreException(ex: Exception): boolean {
  return ignoredExceptions.some(ignored => ex instanceof ignored);
}

/**
 * Throws the given exception if it is not ignored by {@link ignoreExceptions}.
 * @param exception
 */
export function throwException<T extends Exception>(exception: T): void {
  if (shouldIgnoreException(exception)) {
    if (exceptionHandler) {
      exceptionHandler(exception);
    }
    return;
  }
  throw exception;
}
