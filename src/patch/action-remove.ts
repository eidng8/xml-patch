/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { AttrImpl, ElementImpl, NodeImpl, TextImpl } from 'xmldom-ts';
import Exception from '../errors/Exception';
import InvalidNamespacePrefix from '../errors/InvalidNamespacePrefix';
import { throwException } from '../errors/helpers';
import { isAttribute, isElement, isText } from '../utils/type-guards';
import {
  assertEmptyText,
  assertNotRoot,
  assertNoWsAttr,
} from '../utils/asserts';
import Action from './action';

/**
 * Patches XML according to
 * {@link https://tools.ietf.org/html/rfc5261|RFC 5261}.
 */
export default class ActionRemove extends Action {
  /**
   * The `ws` attribute.
   */
  get ws() {
    return this.action.getAttribute(Action.Ws);
  }

  /**
   * @inheritDoc
   */
  protected process(subject: NodeImpl, prefix?: string): void {
    if (prefix) {
      this.removeNamespace(subject as ElementImpl, prefix);
      return;
    }
    // RFC 4.5, 2nd paragraph, `ws` is only not allowed with texts, attributes.
    if (isAttribute(subject)) {
      this.removeAttribute(subject);
    } else if (isText(subject)) {
      this.removeTextNode(subject);
    } else {
      this.removeNode(subject);
    }
  }

  /**
   * Removes the targeted attribute.
   * @param subject the targeted node in target document
   */
  protected removeAttribute(subject: AttrImpl) {
    assertNoWsAttr(this.action, Exception.ErrWsAttribute);
    (subject.ownerElement! as ElementImpl).removeAttributeNode(subject);
  }

  /**
   * Removes the targeted text node.
   * @param subject the targeted node in target document
   */
  protected removeTextNode(subject: TextImpl) {
    assertNoWsAttr(this.action, Exception.ErrWsTextNode);
    subject.parentNode!.removeChild(subject);
  }

  /**
   * Removes the targeted node.
   * @param subject the targeted node in target document
   */
  protected removeNode(subject: NodeImpl) {
    if (isElement(subject) && !assertNotRoot(subject, this.action)) {
      // RFC 3, last paragraph
      return;
    }
    this.removeWhiteSpaceSiblings(subject);
    subject.parentNode!.removeChild(subject);
  }

  /**
   * Removes white space siblings according to `ws`.
   * @param subject the targeted node in target document
   */
  protected removeWhiteSpaceSiblings(subject: NodeImpl): void {
    if (Action.After == this.ws || Action.Both == this.ws) {
      this.removeWhiteSpaceNode(subject.nextSibling, Exception.ErrWsAfter);
    }
    if (Action.Before == this.ws || Action.Both == this.ws) {
      this.removeWhiteSpaceNode(
        subject.previousSibling as NodeImpl,
        Exception.ErrWsBefore,
      );
    }
  }

  /**
   * Removes white space node if applicable.
   * @param subject the targeted node in target document
   * @param msg error message when occurred
   */
  protected removeWhiteSpaceNode(subject: NodeImpl, msg: string): void {
    if (assertEmptyText(subject, this.action, msg)) {
      subject.parentNode.removeChild(subject);
    }
  }

  /**
   * Removes the specified namespace declaration.
   * @param subject the targeted node in target document
   * @param prefix a prefix that exists in the target document
   */
  protected removeNamespace(subject: ElementImpl, prefix: string): void {
    // RFC 4.5, 2nd paragraph: specifically prohibits namespace nodes
    // with `ws` attribute.
    assertNoWsAttr(this.action, Exception.ErrWsAttribute);
    const uri = subject.lookupNamespaceURI(prefix);
    if (!uri) {
      throwException(
        new InvalidNamespacePrefix(Exception.ErrPrefix, this.action),
      );
      return;
    }
    if (this.hasPrefixChildren(subject, prefix)) {
      throwException(
        new InvalidNamespacePrefix(Exception.ErrPrefixUsed, this.action),
      );
      return;
    }
    subject.nodeName = subject.localName;
    subject.tagName = subject.localName;
    subject.prefix = null;
    delete subject._nsMap[prefix];
    subject.removeAttributeNode(subject.getAttributeNode(`xmlns:${prefix}`));
    if (subject.namespaceURI == uri) {
      subject.namespaceURI = null;
    }
  }
}
