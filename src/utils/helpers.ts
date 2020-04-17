/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import {
  CommentImpl,
  ElementImpl,
  NodeImpl,
  ProcessingInstructionImpl,
} from 'xmldom-ts';
import {
  isCData,
  isComment,
  isElement,
  isProcessingInstruction,
  isText,
} from './type-guards';

/**
 * A predicate used while iterating DOM tree. Whose return value affects the
 * flow of iteration.
 */
export type NodeMatcher = (
  node: NodeImpl,
  ...args: any[]
) => any | null | undefined;

/**
 * A predicate used while iterating DOM tree. See {@link lookupThrough} for more
 * detail.
 */
export type NodeIterator = (node: NodeImpl) => NodeImpl | null;

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
  return lookupSibling(node.firstChild, n => (isElement(n) ? n : null));
}

/**
 * Retrieves the first CData child of the given node.
 * @param node
 */
export function firstCDataChild(node: NodeImpl): CommentImpl | null {
  return lookupSibling(node.firstChild, n => (isCData(n) ? n : null));
}

/**
 * Retrieves the first comment child of the given node.
 * @param node
 */
export function firstCommentChild(node: NodeImpl): CommentImpl | null {
  return lookupSibling(node.firstChild, n => (isComment(n) ? n : null));
}

/**
 * Retrieves the first processing instruction child of the given node.
 * @param node
 */
export function firstProcessingInstructionChild(
  node: NodeImpl,
): ProcessingInstructionImpl | null {
  return lookupSibling(node.firstChild, n =>
    isProcessingInstruction(n) ? n : null,
  );
}

/**
 * Retrieves the next element sibling of the given node.
 * @param node
 */
export function nextElementSibling(node: NodeImpl): ElementImpl | null {
  return lookupSibling(node.nextSibling, n => (isElement(n) ? n : null));
}

/**
 * Looks up for something matching certain criteria, falling back to
 * ancestors all the way to the document root. Starting from the given node.
 *
 * The `match` callback should determine whether a given node fulfills criteria.
 * If `match()` returns a value that is not `null` or `undefined`, the loop will
 * return immediately, with the return value from `match()`.
 * @param node The node to start looking.
 * @param match A callback function to determine if the node matches criteria.
 * @param args Extra arguments to be passed to `match` callback.
 */
export function lookupAncestor(
  node: NodeImpl,
  match: NodeMatcher,
  ...args: any[]
): any | null {
  return lookupThrough(node, match, n => n.parentNode, ...args);
}

/**
 * Looks up for something matching certain criteria, among siblings from
 * `node` onward.
 *
 * The `match` callback should determine whether a given node fulfills criteria.
 * If `match()` returns a value that is not `null` or `undefined`, the loop will
 * return immediately, with the return value from `match()`.
 * @param node The node to start looking.
 * @param match A callback function to determine if the node matches criteria.
 * @param args Extra arguments to be passed to `match` callback.
 */
export function lookupSibling(
  node: NodeImpl,
  match: NodeMatcher,
  ...args: any[]
): any | null {
  return lookupThrough(node, match, n => n.nextSibling, ...args);
}

/**
 * Looks up for something matching certain criteria.
 *
 * The `next` callback should return the next node of interest. If `next()`
 * returns a falsy value, the loop breaks and returns `null`.
 *
 * The `match` callback should determine whether a given node fulfills criteria.
 * If `match()` returns a value that is not `null` or `undefined`, the loop will
 * return immediately, with the return value from `match()`.
 *
 * @param node The node to start looking.
 * @param match A callback function to determine if the node matches criteria.
 * @param next A callback that returns the next node to be matched.
 * @param args Extra arguments to be passed to `match` callback.
 */
export function lookupThrough(
  node: NodeImpl | null,
  match: NodeMatcher,
  next: NodeIterator,
  ...args: any[]
): any | null {
  let anchor = node;
  while (anchor) {
    const ret = match(anchor, ...args);
    if (ret !== null && ret !== undefined) return ret;
    anchor = next(anchor);
  }
  return null;
}

/**
 * Descend the given node (excluding itself) breadth-first. Child nodes of the
 * current node are pushed to stack before calling the `match` predicate.
 * If `match()` returns `true`, the loop will break, returning the node at
 * that point.
 * @param node
 * @param match
 * @param args
 */
export function descend(
  node: NodeImpl,
  match: NodeMatcher,
  ...args: any[]
): NodeImpl | null {
  const nodes = ((node && node.childNodes) || []) as NodeImpl[];
  let current = nodes.shift();
  while (current) {
    isElement(current) && nodes.push(...current.childNodes);
    if (true === match(current, ...args)) return current;
    current = nodes.shift();
  }
  return null;
}

/**
 * Remove all empty text nodes from descendants of the given node.
 * @param node
 */
export function removeEmptyTextNodes(node: NodeImpl): void {
  descend(node, current => {
    if (isEmptyText(current)) {
      current.parentNode.removeChild(current);
    }
  });
}

/**
 * {@link String.trim} all descendants' text nodes.
 * @param node
 */
export function trimTextContents(node: NodeImpl): void {
  descend(node, current => {
    if (isText(current)) {
      const txt = current.textContent!.trim();
      current.textContent = txt;
      current.data = txt!;
    }
  });
}
