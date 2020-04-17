/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

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
import XmlWrapper from '../xml/xml-wrapper';

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
