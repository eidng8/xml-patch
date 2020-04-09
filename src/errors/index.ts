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
import {NodeImpl} from 'xmldom-ts';
import {XML} from '../xml';

type ExceptionHandler = (exception: Exception) => void;

let ignoredExceptions = [] as { new(): Exception }[];

let exceptionHandler: (exception: Exception) => void;

/**
 * Turns on all exceptions
 */
function dontIgnoreExceptions(): void {
  ignoredExceptions = [] as { new(): Exception }[];
}

/**
 * Turns off the given exceptions. Once turned off, the specified exception will
 * not be thrown. When such error occurred, if a global error handler is
 * previously set with {@link setExceptionHandler}, the error handler will be
 * invoked with the actual exception.
 * @param exceptions
 */
function ignoreExceptions(exceptions: { new(): Exception }[]): void {
  ignoredExceptions = exceptions;
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
  if (XML.isDocument(node) || XML.isRoot(node)) {
    throwException(new InvalidRootElementOperation(action));
    return false;
  }
  return true;
}

/**
 * Asserts the given action has exactly one text node child
 * @param action
 */
function assertTextChild(action: NodeImpl): boolean {
  if (action.childNodes.length > 1 || !XML.isText(action.firstChild)) {
    throwException(new InvalidNodeTypes(Exception.ErrNodeTypeText, action));
    return false;
  }
  return true;
}

export {
  assertNotRoot,
  assertTextChild,
  dontIgnoreExceptions,
  ignoreExceptions,
  setExceptionHandler,
  throwException,
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
