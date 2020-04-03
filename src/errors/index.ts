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

function throwException(exception: Exception): void {
  throw exception;
}

export {
  throwException,
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
