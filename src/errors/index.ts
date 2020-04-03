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

function throwException(exception: Exception): void {
  throw exception;
}

function assertNotRoot(node: NodeImpl, action: NodeImpl): boolean {
  // RFC 3, last paragraph: don't replace/remove root node, or add sibling
  if (XML.isDocument(node) || XML.isRoot(node)) {
    throwException(new InvalidRootElementOperation(Exception.ErrRoot, action));
    return false;
  }
  return true;
}

export {
  throwException,
  assertNotRoot,
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
