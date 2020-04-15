/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import XmlWrapper from './xml-wrapper';
import {
  AttrImpl,
  CDATASectionImpl,
  CommentImpl,
  DocumentImpl,
  ElementImpl,
  NodeImpl,
  ProcessingInstructionImpl,
  TextImpl,
} from 'xmldom-ts';

/**
 * XmlWrapper Type guard
 * @param subject
 */
export function isXmlWrapper(subject: any): subject is XmlWrapper {
  return subject instanceof XmlWrapper;
}

/**
 * Document node type guard
 * @param subject
 */
export function isDocument(subject: any): subject is DocumentImpl {
  return subject instanceof DocumentImpl;
}

/**
 * Comment node type guard
 * @param node
 */
export function isComment(node: any): node is CommentImpl {
  return node instanceof CommentImpl;
}

/**
 * CData node type guard
 * @param node
 */
export function isCData(node: any): node is CDATASectionImpl {
  return node instanceof CDATASectionImpl;
}

/**
 * Text node type guard
 * @param node
 */
export function isText(node: any): node is TextImpl {
  return node instanceof TextImpl;
}

/**
 * Processing instruction node type guard
 * @param node
 */
export function isProcessingInstruction(
  node: any,
): node is ProcessingInstructionImpl {
  return node instanceof ProcessingInstructionImpl;
}

/**
 * Element node type guard
 * @param node
 */
export function isElement(node: any): node is ElementImpl {
  return node instanceof ElementImpl;
}

/**
 * Attribute node type guard
 * @param node
 */
export function isAttribute(node: any): node is AttrImpl {
  return node instanceof AttrImpl;
}

/**
 * Check if the given node is the root of its document.
 * @param node
 */
export function isRoot(node: NodeImpl): boolean {
  return isDocument(node.parentNode);
}

/**
 * Retrieves all attribute nodes of the given element.
 * @param element
 */
export function allAttributes(element: ElementImpl) {
  const attributes = [] as AttrImpl[];
  for (const a of element.attributes) {
    attributes.push(a);
  }
  return attributes;
}

/**
 * Check if the given node is a white space text node
 * @param node
 */
export function isEmptyText(node: NodeImpl): boolean {
  return isText(node) && !node.textContent!.trim();
}

/**
 * Counts all immediate element children
 * @param node
 * @param ignoreWhiteSpace
 */
export function childElementCount(
  node: NodeImpl,
  ignoreWhiteSpace = true,
): number {
  let count = 0;
  let child = node.firstChild;
  while (child) {
    const skip = ignoreWhiteSpace && isEmptyText(child);
    child = child.nextSibling;
    if (skip) continue;
    count++;
  }
  return count;
}

/**
 * Retrieves the first element child of the given node.
 * @param node
 */
export function firstElementChild(node: NodeImpl): ElementImpl | null {
  let child = node.firstChild;
  while (child) {
    if (isElement(child)) return child;
    child = child.nextSibling;
  }
  return null;
}

/**
 * Retrieves the first CData child of the given node.
 * @param node
 */
export function firstCDataChild(node: NodeImpl): CommentImpl | null {
  let child = node.firstChild;
  while (child) {
    if (isCData(child)) return child;
    child = child.nextSibling;
  }
  return null;
}

/**
 * Retrieves the first comment child of the given node.
 * @param node
 */
export function firstCommentChild(node: NodeImpl): CommentImpl | null {
  let child = node.firstChild;
  while (child) {
    if (isComment(child)) return child;
    child = child.nextSibling;
  }
  return null;
}

/**
 * Retrieves the first processing instruction child of the given node.
 * @param node
 */
export function firstProcessingInstructionChild(
  node: NodeImpl,
): ProcessingInstructionImpl | null {
  let child = node.firstChild;
  while (child) {
    if (isProcessingInstruction(child)) return child;
    child = child.nextSibling;
  }
  return null;
}

/**
 * Retrieves the next element sibling of the given node.
 * @param node
 */
export function nextElementSibling(node: NodeImpl): ElementImpl | null {
  let sibling = node.nextSibling;
  while (sibling) {
    if (isElement(sibling)) return sibling;
    sibling = sibling.nextSibling;
  }
  return null;
}
