/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { ElementImpl, NodeImpl } from 'xmldom-ts';
import FormatOptions from '../xml/format-options';
import XmlWrapper from '../xml/xml-wrapper';
import { isXmlWrapper } from '../utils/type-guards';
import { firstElementChild, nextElementSibling } from '../utils/helpers';
import InvalidCharacterSet from '../errors/InvalidCharacterSet';
import InvalidPatchDirective from '../errors/InvalidPatchDirective';
import { throwException } from '../errors/helpers';
import Action from './action';
import ActionAdd from './action-add';
import ActionRemove from './action-remove';
import ActionReplace from './action-replace';

/**
 * Parse the given XML patch document, according to
 * {@link https://tools.ietf.org/html/rfc5261|RFC 5261}.
 */
export default class Patch {
  /**
   * List of defined patch directives (actions).
   */
  static readonly SupportedActions = ['add', 'remove', 'replace'];

  /**
   * The loaded XML document
   */
  protected patch!: XmlWrapper;

  protected target!: XmlWrapper;

  /**
   * List of actions to be performed.
   */
  protected _actions: (Action | null)[];

  /**
   * List of actions to be performed.
   */
  get actions(): (Action | null)[] {
    return this._actions;
  }

  /**
   * Encoding of the load XML.
   */
  get encoding(): string {
    return this.patch.encoding;
  }

  /**
   * @param patch This can be an XML string, of a {@link XmlWrapper} instance.
   */
  constructor(patch?: string | XmlWrapper) {
    this._actions = [];
    if (patch) {
      this.load(patch);
    }
  }

  /**
   * @param patch can be an XML string, of a {@link XmlWrapper} instance.
   * @return this instance
   */
  load(patch: string | XmlWrapper): Patch {
    this.patch = isXmlWrapper(patch)
      ? patch
      : new XmlWrapper().fromString(patch);
    this.loadActions();
    return this;
  }

  apply(xml: string | XmlWrapper): Patch {
    this.target = isXmlWrapper(xml) ? xml : new XmlWrapper().fromString(xml);
    if (this.target.encoding != this.encoding) {
      throwException(new InvalidCharacterSet());
    }
    this.actions.forEach(a => a && a.apply(this.target));
    return this;
  }

  /**
   * Pass through to underlining XML document's
   * {@link XmlWrapper.lookupNamespaceURI}
   * @param prefix
   * @param node the node to be looked up
   */
  lookupNamespaceURI(prefix: string | null, node?: NodeImpl): string | null {
    return this.patch.lookupNamespaceURI(prefix, node);
  }

  /**
   * Pass through to underlining XML document's {@link XmlWrapper.lookupPrefix}
   * @param uri
   * @param node the node to be looked up
   */
  lookupPrefix(uri: string | null, node?: NodeImpl): string | null {
    return this.patch.lookupPrefix(uri, node);
  }

  toString(options?: FormatOptions) {
    return this.target.toString(options);
  }

  toLocaleString(options?: FormatOptions) {
    return this.toString(options);
  }

  /**
   * Parses the XML patch document and extracts all its actions.
   * @return this instance
   */
  protected loadActions(): Patch {
    const root = this.patch.root;
    if (!root || !root.hasChildNodes()) {
      // RFC doesn't define what to do with empty patch document.
      // Just ignore it for now.
      return this;
    }
    let action = firstElementChild(root);
    while (action) {
      this.loadAction(action);
      action = nextElementSibling(action);
    }
    return this;
  }

  /**
   * Adds the given action to stack if applicable.
   * @param action
   */
  protected loadAction(action: ElementImpl): Patch {
    switch (action.localName) {
      case Action.Add:
        this._actions.push(new ActionAdd(this, action));
        break;

      case Action.Remove:
        this._actions.push(new ActionRemove(this, action));
        break;

      case Action.Replace:
        this._actions.push(new ActionReplace(this, action));
        break;

      default:
        throwException(new InvalidPatchDirective(action));
    }
    return this;
  }
}
