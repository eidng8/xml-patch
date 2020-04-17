/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { ElementImpl, NodeImpl } from 'xmldom-ts';
import Exception from '../errors/Exception';
import InvalidNodeTypes from '../errors/InvalidNodeTypes';
import InvalidWhitespaceDirective from '../errors/InvalidWhitespaceDirective';
import InvalidRootElementOperation from '../errors/InvalidRootElementOperation';
import InvalidAttributeValue from '../errors/InvalidAttributeValue';
import InvalidPatchDirective from '../errors/InvalidPatchDirective';
import { throwException } from '../errors/helpers';
import { isDocument, isElement, isRoot, isText } from './type-guards';
import Action from '../patch/action';
import Patch from '../patch/patch';
import {
  firstProcessingInstructionChild,
  firstCDataChild,
  firstCommentChild,
} from './helpers';

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
 * Asserts the given node is an element node
 * @param node
 * @param action
 */
export function assertElement(node: NodeImpl, action?: NodeImpl): boolean {
  if (isElement(node)) return true;
  throwException(new InvalidNodeTypes(Exception.ErrType, action || node));
  return false;
}

/**
 * Asserts the given node is an empty text node
 * @param node
 * @param action
 * @param message
 */
export function assertEmptyText(
  node: NodeImpl,
  action?: NodeImpl,
  message?: string,
): boolean {
  if (isText(node) && !node.textContent!.trim()) return true;
  throwException(
    new InvalidWhitespaceDirective(
      message || Exception.ErrType,
      action || node,
    ),
  );
  return false;
}

/**
 * Asserts the given action has one text node child or no child at all
 * @param node
 */
export function assertTextChildOrNothing(node: NodeImpl): boolean {
  if (!node.childNodes.length) return true;
  if (node.childNodes.length > 1 || !isText(node.firstChild)) {
    throwException(new InvalidNodeTypes(Exception.ErrNodeTypeText, node));
    return false;
  }
  return true;
}

/**
 * Asserts the given action has one text node child or no child at all
 * @param node
 */
export function assertTextChildNotEmpty(node: NodeImpl): boolean {
  if (
    node.childNodes.length != 1 ||
    !isText(node.firstChild) ||
    !node.firstChild.textContent!.trim()
  ) {
    throwException(new InvalidNodeTypes(Exception.ErrNodeTypeText, node));
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
  if (action.hasAttribute(Action.Ws)) {
    throwException(new InvalidWhitespaceDirective(message, action));
    return false;
  }
  return true;
}

/**
 * Asserts element has the given attribute with non-empty value
 * @param elem
 * @param attr
 * @param message
 */
export function assertAttributeNotEmpty(
  elem: ElementImpl,
  attr: string,
  message?: string,
): boolean {
  const a = elem.getAttribute(attr);
  if (a && a.trim()) return true;
  throwException(
    new InvalidAttributeValue(message || Exception.ErrSelEmpty, elem),
  );
  return false;
}

/**
 * Asserts the given action tag is supported
 * @param action
 */
export function assertKnownAction(action: ElementImpl): boolean {
  if (Patch.SupportedActions.indexOf(action.localName) >= 0) return true;
  throwException(new InvalidPatchDirective(action));
  return false;
}

export function assertHasProcessingInstructionChild(node: NodeImpl): boolean {
  if (firstProcessingInstructionChild(node)) return true;
  throwException(new InvalidNodeTypes(Exception.ErrNodeTypeMismatch, node));
  return false;
}

export function assertHasCDataChild(node: NodeImpl): boolean {
  if (firstCDataChild(node)) return true;
  throwException(new InvalidNodeTypes(Exception.ErrNodeTypeMismatch, node));
  return false;
}

export function assertHasCommentChild(node: NodeImpl): boolean {
  if (firstCommentChild(node)) return true;
  throwException(new InvalidNodeTypes(Exception.ErrNodeTypeMismatch, node));
  return false;
}
