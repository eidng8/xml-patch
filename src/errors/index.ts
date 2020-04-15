/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { ElementImpl, NodeImpl } from 'xmldom-ts';
import { Patch } from '..';
import InvalidAttributeValue from './InvalidAttributeValue';
import InvalidCharacterSet from './InvalidCharacterSet';
import InvalidDiffFormat from './InvalidDiffFormat';
import InvalidEntityDeclaration from './InvalidEntityDeclaration';
import InvalidNamespacePrefix from './InvalidNamespacePrefix';
import InvalidNamespaceURI from './InvalidNamespaceURI';
import InvalidNodeTypes from './InvalidNodeTypes';
import InvalidPatchDirective from './InvalidPatchDirective';
import InvalidPrologOperation from './InvalidPrologOperation';
import InvalidRootElementOperation from './InvalidRootElementOperation';
import InvalidWhitespaceDirective from './InvalidWhitespaceDirective';
import UnlocatedNode from './UnlocatedNode';
import UnsupportedIdFunction from './UnsupportedIdFunction';
import UnsupportedXmlId from './UnsupportedXmlId';
import Exception from './Exception';
import ExceptionBag from './ExceptionBag';
import { isDocument, isRoot, isText } from '../helpers';

type ExceptionHandler = (exception: Exception) => void;

let ignoredExceptions = [] as { new (): Exception }[];

let exceptionHandler: (exception: Exception) => void;

/**
 * Turns on all exceptions
 */
function dontIgnoreExceptions(): void {
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
function ignoreExceptions(
  ...exceptions: { new (): Exception }[] | { new (): Exception }[][]
): void {
  ignoredExceptions = exceptions.flat();
}

/**
 * Sets a global error handler, used in conjunction with
 * {@link ignoreExceptions}.
 * @param handler
 */
function setExceptionHandler(handler: ExceptionHandler): void {
  exceptionHandler = handler;
}

/**
 * Throws the given exception if it is not ignored by {@link ignoreExceptions}.
 * @param exception
 */
function throwException<T extends Exception>(exception: T): void {
  let ignore = false;
  for (const ignored of ignoredExceptions) {
    if (exception instanceof ignored) {
      ignore = true;
      if (exceptionHandler) {
        exceptionHandler(exception);
      }
      break;
    }
  }
  if (ignore) return;
  throw exception;
}

/**
 * Asserts the given node is not the root
 * @param node
 * @param action
 */
function assertNotRoot(node: NodeImpl, action: NodeImpl): boolean {
  // RFC 3, last paragraph: don't replace/remove root node, or add sibling
  if (isDocument(node) || isRoot(node)) {
    throwException(new InvalidRootElementOperation(action));
    return false;
  }
  return true;
}

/**
 * Asserts the given action has one text node child or no child at all
 * @param action
 */
function assertTextChild(action: NodeImpl): boolean {
  if (!action.childNodes.length) return true;
  if (action.childNodes.length > 1 || !isText(action.firstChild)) {
    throwException(new InvalidNodeTypes(Exception.ErrNodeTypeText, action));
    return false;
  }
  return true;
}

/**
 * Asserts the given action has no 'ws' attribute.
 * @param action
 * @param message
 */
function assertNoWsAttr(action: ElementImpl, message: string): boolean {
  if (action.hasAttribute(Patch.Ws)) {
    throwException(new InvalidWhitespaceDirective(message, action));
    return false;
  }
  return true;
}

export {
  assertNotRoot,
  assertNoWsAttr,
  assertTextChild,
  dontIgnoreExceptions,
  ignoreExceptions,
  setExceptionHandler,
  throwException,
  Exception,
  ExceptionBag,
  ExceptionHandler,
  InvalidWhitespaceDirective,
  InvalidRootElementOperation,
  InvalidPrologOperation,
  InvalidPatchDirective,
  InvalidNodeTypes,
  InvalidNamespaceURI,
  InvalidNamespacePrefix,
  InvalidCharacterSet,
  InvalidDiffFormat,
  InvalidEntityDeclaration,
  InvalidAttributeValue,
  UnsupportedXmlId,
  UnsupportedIdFunction,
  UnlocatedNode,
};
