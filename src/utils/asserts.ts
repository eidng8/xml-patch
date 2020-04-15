/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { ElementImpl, NodeImpl } from 'xmldom-ts';
import { isDocument, isRoot, isText } from './type-guards';
import InvalidRootElementOperation from '../errors/InvalidRootElementOperation';
import InvalidNodeTypes from '../errors/InvalidNodeTypes';
import { Exception, throwException } from '../errors';
import Patch from '../patch';
import InvalidWhitespaceDirective from '../errors/InvalidWhitespaceDirective';

/**
 * Asserts the given node is not the root
 * @param node
 * @param action
 */
export function assertNotRoot(node: NodeImpl, action: NodeImpl): boolean {
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
export function assertTextChild(action: NodeImpl): boolean {
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
export function assertNoWsAttr(action: ElementImpl, message: string): boolean {
  if (action.hasAttribute(Patch.Ws)) {
    throwException(new InvalidWhitespaceDirective(message, action));
    return false;
  }
  return true;
}
