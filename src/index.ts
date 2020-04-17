/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */
/* eslint-disable import/first */

import FormatOptions from './xml/format-options';
import XmlFileOptions from './xml/xml-file-options';
import XmlOptions from './xml/xml-options';

import Exception from './errors/Exception';
import ExceptionBag from './errors/ExceptionBag';
import InvalidPrologOperation from './errors/InvalidPrologOperation';
import InvalidNamespaceURI from './errors/InvalidNamespaceURI';
import InvalidNamespacePrefix from './errors/InvalidNamespacePrefix';
import InvalidNodeTypes from './errors/InvalidNodeTypes';
import InvalidCharacterSet from './errors/InvalidCharacterSet';
import InvalidDiffFormat from './errors/InvalidDiffFormat';
import InvalidEntityDeclaration from './errors/InvalidEntityDeclaration';
import InvalidAttributeValue from './errors/InvalidAttributeValue';
import InvalidPatchDirective from './errors/InvalidPatchDirective';
import InvalidRootElementOperation from './errors/InvalidRootElementOperation';
import InvalidWhitespaceDirective from './errors/InvalidWhitespaceDirective';
import UnsupportedXmlId from './errors/UnsupportedXmlId';
import UnsupportedIdFunction from './errors/UnsupportedIdFunction';
import UnlocatedNode from './errors/UnlocatedNode';
import XmlWrapper from './xml/xml-wrapper';
import XmlFile from './xml/xml-file';
import Compiler from './patch/compiler';
import NamespaceMangler from './patch/namespace-mangler';
import Action from './patch/action';
import ActionRemove from './patch/action-remove';
import ActionReplace from './patch/action-replace';
import ActionAdd from './patch/action-add';
import Patch from './patch/patch';

export * from './errors/helpers';

export * from './utils/helpers';
export * from './utils/type-guards';
export * from './utils/asserts';

export {
  FormatOptions,
  XmlOptions,
  XmlFileOptions,
  XmlFile,
  XmlWrapper,
  ExceptionBag,
  Exception,
  InvalidWhitespaceDirective,
  InvalidRootElementOperation,
  InvalidPatchDirective,
  InvalidAttributeValue,
  InvalidEntityDeclaration,
  InvalidDiffFormat,
  InvalidCharacterSet,
  InvalidNodeTypes,
  InvalidNamespacePrefix,
  InvalidNamespaceURI,
  InvalidPrologOperation,
  UnsupportedIdFunction,
  UnsupportedXmlId,
  Compiler,
  Action,
  ActionAdd,
  ActionReplace,
  ActionRemove,
  UnlocatedNode,
  NamespaceMangler,
  Patch,
};
