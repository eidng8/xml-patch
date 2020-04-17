/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { NodeImpl } from 'xmldom-ts';
import Exception from '../errors/Exception';
import InvalidNodeTypes from '../errors/InvalidNodeTypes';
import InvalidNamespacePrefix from '../errors/InvalidNamespacePrefix';
import { throwException } from '../errors/helpers';
import {
  isAttribute,
  isCData,
  isComment,
  isElement,
  isProcessingInstruction,
  isText,
} from '../utils/type-guards';
import {
  childElementCount,
  firstCDataChild,
  firstCommentChild,
  firstElementChild,
  firstProcessingInstructionChild,
} from '../utils/helpers';
import { assertNotRoot, assertTextChildOrNothing } from '../utils/asserts';
import Action from './action';

/**
 * Patches XML according to
 * {@link https://tools.ietf.org/html/rfc5261|RFC 5261}.
 */
export default class ActionReplace extends Action {
  protected process(subject: NodeImpl, prefix?: string): void {
    if (prefix) {
      if (isElement(subject)) {
        this.replaceNamespace(subject, prefix);
      }
      return;
    }
    if (isAttribute(subject)) {
      subject.value = this.action.textContent!;
      return;
    } else if (isText(subject)) {
      subject.data = subject.nodeValue = this.action.textContent!;
      return;
    } else if (isProcessingInstruction(subject)) {
      const child = firstProcessingInstructionChild(this.action);
      if (!child) {
        throwException(
          new InvalidNodeTypes(Exception.ErrNodeTypeMismatch, this.action),
        );
        // return;
      }
    } else if (isCData(subject)) {
      const child = firstCDataChild(this.action);
      if (!child) {
        throwException(
          new InvalidNodeTypes(Exception.ErrNodeTypeMismatch, this.action),
        );
        // return;
      }
    } else if (isComment(subject)) {
      const child = firstCommentChild(this.action);
      if (!child) {
        throwException(
          new InvalidNodeTypes(Exception.ErrNodeTypeMismatch, this.action),
        );
        // return;
      }
    } else {
      if (!assertNotRoot(subject, this.action)) {
        // RFC 3, last paragraph
        return;
      }
      if (
        childElementCount(this.action) != 1 ||
        firstElementChild(this.action)!.nodeType != subject.nodeType
      ) {
        // Although RFC doesn't explicitly specify the case, I think replacement
        // are allowed only one to one. Reasons:
        // 1. Last paragraph of 4.4, it uses `child`, not `children`;
        // 2. In every explanation and example it give, it is always
        //    "replacing an element".
        // 3. While talking about things other than elements or replacement,
        //    it always uses singular, not plural. And when pluralization is
        //    intended, it states explicitly, such as "Adding Multiple Nodes".
        // 4. Lastly, in the last sentence of `<invalid-node-types>`, it states
        //    somewhat explicitly.
        throwException(
          new InvalidNodeTypes(Exception.ErrNodeTypeMismatch, this.action),
        );
        // return;
      }
    }
    const anchor = subject.nextSibling;
    const parent = subject.parentNode!;
    parent.removeChild(subject);
    this.importNodes(this.action.childNodes, subject).forEach(node =>
      parent.insertBefore(node, anchor),
    );
  }

  /**
   * Replaces the namespace Declaration URI of the given prefix. Please note
   * that the prefix isn't changed. RFC doesn't provide a way to change prefix.
   * @param target
   * @param prefix
   */
  protected replaceNamespace(target: any, prefix: string): void {
    let uri = '';
    if (this.action.hasChildNodes() && assertTextChildOrNothing(this.action)) {
      uri = this.action.textContent!.trim();
    }
    if (!target.lookupNamespaceURI(prefix)) {
      // RFC 4.4.3
      throwException(
        new InvalidNamespacePrefix(Exception.ErrPrefix, this.action),
      );
      return;
    }
    target.setAttribute(`xmlns:${prefix}`, uri);
    target._nsMap[prefix] = uri;
  }
}
