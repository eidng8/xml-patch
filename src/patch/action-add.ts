/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { ElementImpl, NodeImpl } from 'xmldom-ts';
import Exception from '../errors/Exception';
import InvalidAttributeValue from '../errors/InvalidAttributeValue';
import { throwException } from '../errors/helpers';
import { firstElementChild } from '../utils/helpers';
import {
  assertNotRoot,
  assertTextChildNotEmpty,
  assertTextChildOrNothing,
  assertElement,
} from '../utils/asserts';
import Action from './action';

/**
 * Handles the `<add>` directive.
 */
export default class ActionAdd extends Action {
  /**
   * The `pos` attribute.
   */
  get pos(): string | null {
    return this.action.getAttribute(Action.Pos);
  }

  /**
   * The `type` attribute.
   */
  get type(): string {
    return (this.action.getAttribute(Action.Type) || '').trim() || '';
  }

  /**
   * Whether the action is targeting an attribute.
   */
  get isAttributeAction(): boolean {
    return '@' == this.type[0] || this.type.startsWith(Action.AxisAttribute);
  }

  /**
   * Whether the action is targeting an namespace.
   */
  get isNamespaceAction(): boolean {
    return this.type.startsWith(Action.AxisNamespace);
  }

  /**
   * Returns the targeted attribute name of an attribute action.
   */
  get typeAttributeName(): string {
    return this.type
      .substr('@' == this.type[0] ? 1 : Action.AxisAttribute.length)
      .trim();
  }

  /**
   * Returns the targeted namespace name of a namespace action.
   */
  get typeNamespacePrefix(): string {
    return this.type.substr(Action.AxisNamespace.length).trim();
  }

  /**
   * @inheritDoc
   */
  protected process(subject: NodeImpl): void {
    if (this.type.length) {
      this.processActionType(subject as ElementImpl);
    } else {
      this.addNode(subject);
    }
  }

  /**
   * Process the action according the `type`
   * @param subject the targeted node in target document
   */
  protected processActionType(subject: ElementImpl) {
    // RFC 4.3, 4th paragraph: The value of the optional 'type' attribute is
    // only used when adding attributes and namespaces.
    // Only elements can be these 2 pieces.
    if (!assertElement(subject, this.action)) {
      return;
    }
    if (this.isAttributeAction) {
      this.addAttribute(subject, this.typeAttributeName);
    } else if (this.isNamespaceAction) {
      this.addNamespace(subject);
    } else {
      throwException(new InvalidAttributeValue(Exception.ErrType, this.action));
    }
  }

  /**
   * Adds the given attribute to the target node. The given `name` will be
   * mapped to target document's namespace via
   * {@link NamespaceMangler.mapNamespace}.
   * @param subject the targeted node in target document
   * @param name the qualified name from patch document
   */
  protected addAttribute(subject: ElementImpl, name: string): void {
    // RFC 4.3, 4th paragraph, child node of attribute action must be
    // text node. However, it doesn't mention about empty action node
    // in such case. Considering that XML allows attribute values to be
    // empty, this case should be considered valid.
    if (!assertTextChildOrNothing(this.action)) return;
    const value = this.action.textContent!.trim();
    const [
      prefix,
      localName,
      targetPrefix,
      targetNS,
    ] = this.mangler.mapNamespace(name, subject, this.action, true);
    if (targetNS) {
      const p = `${targetPrefix || prefix}:${localName}`;
      subject.setAttributeNS(targetNS, p, value);
    } else {
      subject.setAttribute(name, value || '');
    }
  }

  /**
   * Adds namespace to target document node. The namespace and prefix will be
   * added as is.
   * @param subject the targeted node in target document
   */
  protected addNamespace(subject: ElementImpl) {
    // Empty namespace isn't valid. More detail:
    // https://stackoverflow.com/a/44278867/1353368
    if (!assertTextChildNotEmpty(this.action)) return;
    this.xml.addNamespace(
      this.typeNamespacePrefix,
      this.action.textContent!.trim(),
      subject,
    );
  }

  /**
   * Adds all children of action to target node.
   * @param subject the targeted node in target document
   */
  protected addNode(subject: NodeImpl): void {
    const imported = this.importNodes(this.action.childNodes, subject);
    switch (this.pos) {
      case Action.After:
        this.after(subject, imported);
        break;

      case Action.Before:
        this.before(subject, imported);
        break;

      case Action.Prepend:
        this.prepend(subject, imported);
        break;

      default:
        this.append(subject, imported);
    }
  }

  /**
   * Inserts nodes after target node.
   * @param subject the targeted node in target document
   * @param imported nodes to be added to target position, which are already
   * imported into target document.
   */
  protected after(subject: NodeImpl, imported: NodeImpl[]) {
    if (this.cantAddElement(subject)) return;
    let anchor = subject;
    const parent = subject.parentNode!;
    imported.forEach(child => {
      anchor = parent.insertBefore(child, anchor.nextSibling);
    });
  }

  /**
   * Inserts nodes before target node.
   * @param subject the targeted node in target document
   * @param imported nodes to be added to target position, which are already
   * imported into target document.
   */
  protected before(subject: NodeImpl, imported: NodeImpl[]) {
    if (this.cantAddElement(subject)) return;
    const parent = subject.parentNode!;
    imported.forEach(child => parent.insertBefore(child, subject));
  }

  /**
   * Prepends nodes as target node's first child.
   * @param subject the targeted node in target document
   * @param imported nodes to be added to target position, which are already
   * imported into target document.
   */
  protected prepend(subject: NodeImpl, imported: NodeImpl[]) {
    const anchor = subject.firstChild;
    imported.forEach(child => subject.insertBefore(child, anchor));
  }

  /**
   * Appends nodes as target node's last child.
   * @param subject the targeted node in target document
   * @param imported nodes to be added to target position, which are already
   * imported into target document.
   */
  protected append(subject: NodeImpl, imported: NodeImpl[]) {
    imported.forEach(child => subject.appendChild(child));
  }

  /**
   * Determines whether new element can be added as target node's sibling.
   * @param subject the targeted node in target document
   */
  protected cantAddElement(subject: NodeImpl): boolean {
    // Everything can be added, except adding elements to root level.
    return (
      firstElementChild(this.action) != null &&
      !assertNotRoot(subject, this.action)
    );
  }
}
