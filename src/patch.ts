/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { AttrImpl, ElementImpl, NodeImpl } from 'xmldom-ts';
import { select } from 'xpath-ts';
import XmlWrapper from './xml-wrapper';
import Diff from './diff';
import {
  assertNotRoot,
  assertNoWsAttr,
  assertTextChild,
  InvalidAttributeValue,
  InvalidCharacterSet,
  InvalidNamespacePrefix,
  InvalidNodeTypes,
  InvalidPatchDirective,
  InvalidWhitespaceDirective,
  throwException,
  UnlocatedNode,
} from './errors';
import Exception from './errors/Exception';
import {
  allAttributes,
  childElementCount,
  firstCDataChild,
  firstCommentChild,
  firstElementChild,
  firstProcessingInstructionChild,
  isAttribute,
  isCData,
  isComment,
  isElement,
  isEmptyText,
  isProcessingInstruction,
  isText,
  isXmlWrapper,
} from './helpers';

/**
 * Patches XML according to
 * {@link https://tools.ietf.org/html/rfc5261|RFC 5261}.
 */
export default class Patch {
  // region Constants
  /**
   * The `<add>` directive
   */
  static readonly Add = 'add';

  /**
   * The `<replace>` directive
   */
  static readonly Replace = 'replace';

  /**
   * The `<remove>` directive
   */
  static readonly Remove = 'remove';

  /**
   * The `sel` attribute
   */
  static readonly Selector = 'sel';

  /**
   * The `sel` attribute translated into predicates.
   */
  static readonly Predicated = 'p-sel';

  /**
   * The `type` attribute
   */
  static readonly Type = 'type';

  /**
   * The `pos` attribute
   */
  static readonly Pos = 'pos';

  /**
   * The `ws` attribute of the `<remove>` directive
   */
  static readonly Ws = 'ws';
  /**
   * An valid value to `'pos'` and `'ws'` attributes. Denoting action is applied
   * to the next sibling of the target node.
   */
  static readonly After = 'after';

  /**
   * An valid value to `'pos'` and `'ws'` attributes. Denoting action is
   * applied to the previous sibling of the target node.
   */
  static readonly Before = 'before';
  /**
   * An valid value to `'pos'` attribute. Denoting inserting before the first
   * child node.
   */
  static readonly Prepend = 'prepend';
  /**
   * An valid value to `'ws'` attribute. Denoting action is applied to both
   * previous and next sibling of the target node.
   */
  static readonly Both = 'both';

  /**
   * The attribute axis
   */
  static readonly AxisAttribute = 'attribute::';

  /**
   * The namespace axis
   */
  static readonly AxisNamespace = 'namespace::';
  // endregion

  /**
   * The diff document to be processed.
   */
  protected diff!: Diff;

  /**
   * The target XML document to be patched.
   */
  protected target!: XmlWrapper;

  /**
   * Load diff XML document from the given string.
   * @param diff
   */
  public load(diff: string | XmlWrapper): Patch {
    this.diff = new Diff(diff);
    return this;
  }

  /**
   * Patches the given XML using the loaded diff.
   * @param xml
   */
  public patch(xml: string | XmlWrapper): XmlWrapper {
    if (isXmlWrapper(xml)) {
      this.target = xml;
    } else {
      this.target = new XmlWrapper().fromString(xml);
    }
    if (this.target.encoding != this.diff.encoding) {
      throwException(new InvalidCharacterSet());
    }
    for (const action of this.diff.actions) {
      this.processAction(action);
    }
    return this.target;
  }

  /**
   * Processes the given action.
   * @param elem
   */
  protected processAction(elem: ElementImpl) {
    // Caution: `tagName` also includes prefix, don't use it.
    const action = elem.localName;
    const query =
      elem.getAttribute(Patch.Predicated) || elem.getAttribute(Patch.Selector)!;
    const [target, prefix] = this.select(query, elem);
    // this is the only place to use this function
    // I don't like making it a member method.
    const process = (target, cb) => {
      if (!target) return;
      // In case of ignoring errors, multiple targets could be selected
      if (Array.isArray(target)) {
        target.forEach(t => t && cb(t));
      } else {
        cb(target, elem);
      }
    };
    switch (action) {
      case Patch.Add:
        process(target, t => this.processAdd(t, elem));
        break;

      case Patch.Remove:
        if (prefix) {
          process(target, t => this.removeNamespace(t, prefix, elem));
        } else {
          process(target, t => this.processRemove(t, elem));
        }
        break;

      case Patch.Replace:
        if (prefix) {
          process(target, t => this.replaceNamespace(t, prefix, elem));
        } else {
          process(target, t => this.processReplace(t, elem));
        }
        break;
    }
  }

  // region Addition
  /**
   * Handles `<add>` directive.
   * @param target
   * @param action
   */
  protected processAdd(target: NodeImpl, action: ElementImpl): void {
    const type = (action.getAttribute(Patch.Type) || '').trim() || '';
    if (type.length) {
      if (!isElement(target)) {
        throwException(new InvalidNodeTypes(Exception.ErrType, action));
        return;
      }
      if ('@' == type[0]) {
        if (!assertTextChild(action)) return;
        // RFC 4.3, 4th paragraph, child node of attribute action must be
        // text node. However, it doesn't mention about empty action node
        // in such case. Considering that XML allows attribute values to be
        // empty, this case should be considered valid.
        this.addAttribute(
          target,
          action,
          type.substr(1),
          action.textContent!.trim(),
        );
      } else if (type.startsWith(Patch.AxisAttribute)) {
        // same as above
        if (!assertTextChild(action)) return;
        this.addAttribute(
          target,
          action,
          type.substr(Patch.AxisAttribute.length).trim(),
          action.textContent!.trim(),
        );
      } else if (type.startsWith(Patch.AxisNamespace)) {
        if (!action.hasChildNodes() || !assertTextChild(action)) {
          // Empty namespace isn't valid. More detail:
          // https://stackoverflow.com/a/44278867/1353368
          throwException(new InvalidPatchDirective(action));
          return;
        }
        this.target.addNamespace(
          type.substr(Patch.AxisNamespace.length).trim(),
          action.textContent!.trim(),
          target as ElementImpl,
        );
      } else {
        throwException(new InvalidAttributeValue(Exception.ErrType, action));
      }
    } else {
      this.addNode(target, action);
    }
  }

  /**
   * Adds the given attribute to the target node.
   * @param target
   * @param action
   * @param name
   * @param value
   */
  protected addAttribute(
    target: ElementImpl,
    action: ElementImpl,
    name: string,
    value: string,
  ): void {
    const [prefix, localName, targetPrefix, targetNS] = this.mapNamespace(
      name,
      target,
      action,
      true,
    );
    if (targetNS) {
      const p = `${targetPrefix || prefix}:${localName}`;
      target.setAttributeNS(targetNS, p, value);
    } else {
      target.setAttribute(name, value || '');
    }
  }

  /**
   * Adds all children of action to target node.
   * @param target
   * @param action
   */
  protected addNode(target: NodeImpl, action: ElementImpl): void {
    const imported = this.importNodes(action.childNodes, target);
    let anchor = target;
    switch (action.getAttribute(Patch.Pos)) {
      case Patch.After:
        if (firstElementChild(action) && !assertNotRoot(target, action)) {
          return;
        }
        for (const child of imported) {
          anchor = target.parentNode!.insertBefore(child, anchor.nextSibling);
        }
        break;

      case Patch.Before:
        if (firstElementChild(action) && !assertNotRoot(target, action)) {
          return;
        }
        for (const child of imported) {
          target.parentNode!.insertBefore(child, target);
        }
        break;

      case Patch.Prepend:
        anchor = target.firstChild;
        for (const child of imported) {
          target.insertBefore(child, anchor);
        }
        break;

      default:
        for (const child of imported) {
          target.appendChild(child);
        }
    }
  }

  // endregion

  // region Removal
  /**
   * Handles `<remove>` directive. Please note that namespace removal is
   * handled by {@link removeNamespace}, not here.
   * @param target
   * @param action
   */
  protected processRemove(target: NodeImpl, action: ElementImpl): void {
    const ws = action.getAttribute(Patch.Ws);
    // RFC 4.5, 2nd paragraph, `ws` is only not allowed with texts, attributes.
    if (isAttribute(target)) {
      assertNoWsAttr(action, Exception.ErrWsAttribute);
      (target.ownerElement! as ElementImpl).removeAttributeNode(target);
    } else if (isText(target)) {
      assertNoWsAttr(action, Exception.ErrWsTextNode);
      target.parentNode!.removeChild(target);
    } else {
      if (isElement(target) && !assertNotRoot(target, action)) {
        // RFC 3, last paragraph
        return;
      }
      if (ws) {
        this.removeWhiteSpaceNode(ws, target, action);
      }
      target.parentNode!.removeChild(target);
    }
  }

  /**
   * Removes white space nodes according to `ws`.
   * @param ws
   * @param target
   * @param action
   */
  protected removeWhiteSpaceNode(
    ws: string,
    target: NodeImpl,
    action: ElementImpl,
  ): void {
    let sibling;
    const parent = target.parentNode!;
    if (Patch.After == ws || Patch.Both == ws) {
      sibling = target.nextSibling;
      if (isEmptyText(sibling)) {
        parent.removeChild(sibling);
      } else {
        throwException(
          new InvalidWhitespaceDirective(Exception.ErrWsAfter, action),
        );
        // return;
      }
    }
    if (Patch.Before == ws || Patch.Both == ws) {
      sibling = target.previousSibling;
      if (isEmptyText(sibling)) {
        parent.removeChild(target.previousSibling);
      } else {
        throwException(
          new InvalidWhitespaceDirective(Exception.ErrWsBefore, action),
        );
        // return;
      }
    }
  }

  /**
   * Removes the specified namespace declaration.
   * @param target
   * @param prefix
   * @param action
   */
  protected removeNamespace(
    target: ElementImpl,
    prefix: string,
    action: ElementImpl,
  ): void {
    // RFC 4.5, 2nd paragraph: specifically prohibits namespace nodes
    // with `ws` attribute.
    assertNoWsAttr(action, Exception.ErrWsAttribute);
    const uri = target.lookupNamespaceURI(prefix);
    if (!uri) {
      throwException(new InvalidNamespacePrefix(Exception.ErrPrefix, action));
      return;
    }
    if (this.hasPrefixChildren(target, prefix)) {
      throwException(
        new InvalidNamespacePrefix(Exception.ErrPrefixUsed, action),
      );
      return;
    }
    target.nodeName = target.localName;
    target.tagName = target.localName;
    target.prefix = null;
    delete target._nsMap[prefix];
    target.removeAttributeNode(target.getAttributeNode(`xmlns:${prefix}`));
    if (target.namespaceURI == uri) {
      target.namespaceURI = null;
    }
  }

  // endregion

  // region Replacement
  /**
   * Handles `<replace>` directive. Please note that namespace replacement is
   * handled by {@link replaceNamespace}, not here.
   * @param target
   * @param action
   */
  protected processReplace(target: NodeImpl, action: ElementImpl) {
    if (isAttribute(target)) {
      target.value = action.textContent!;
      return;
    } else if (isText(target)) {
      target.data = target.nodeValue = action.textContent!;
      return;
    } else if (isProcessingInstruction(target)) {
      const child = firstProcessingInstructionChild(action);
      if (!child) {
        throwException(
          new InvalidNodeTypes(Exception.ErrNodeTypeMismatch, action),
        );
        // return;
      }
    } else if (isCData(target)) {
      const child = firstCDataChild(action);
      if (!child) {
        throwException(
          new InvalidNodeTypes(Exception.ErrNodeTypeMismatch, action),
        );
        // return;
      }
    } else if (isComment(target)) {
      const child = firstCommentChild(action);
      if (!child) {
        throwException(
          new InvalidNodeTypes(Exception.ErrNodeTypeMismatch, action),
        );
        // return;
      }
    } else {
      if (!assertNotRoot(target, action)) {
        // RFC 3, last paragraph
        return;
      }
      if (
        childElementCount(action) != 1 ||
        firstElementChild(action)!.nodeType != target.nodeType
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
          new InvalidNodeTypes(Exception.ErrNodeTypeMismatch, action),
        );
        // return;
      }
    }
    const anchor = target.nextSibling;
    const parent = target.parentNode!;
    parent.removeChild(target);
    this.importNodes(action.childNodes, target).forEach(node =>
      parent.insertBefore(node, anchor),
    );
  }

  /**
   * Replaces the namespace Declaration URI of the given prefix. Please note
   * that the prefix isn't changed. RFC doesn't provide a way to change prefix.
   * @param target
   * @param prefix
   * @param action
   */
  protected replaceNamespace(
    target: any,
    prefix: string,
    action: ElementImpl,
  ): void {
    let uri = '';
    if (action.hasChildNodes() && assertTextChild(action)) {
      uri = action.textContent!.trim();
    }
    if (!target.lookupNamespaceURI(prefix)) {
      // RFC 4.4.3
      throwException(new InvalidNamespacePrefix(Exception.ErrPrefix, action));
      return;
    }
    target.setAttribute(`xmlns:${prefix}`, uri);
    target._nsMap[prefix] = uri;
  }

  // endregion

  // region Utilities
  /**
   * Perform the XPath query on target document. If the expression denotes a
   * namespace prefix operation, the prefix will be returned in the second
   * element of the returned array. In this case, the query will be performed
   * without the namespace axis.
   * @param expression
   * @param action
   */
  protected select(
    expression: string,
    action: ElementImpl,
  ): [NodeImpl | NodeImpl[] | null, string] {
    const parts = /^(.+?)(?:\/namespace::(.+))?$/i.exec(expression)!;
    const target = select(parts[1], this.target.doc) as NodeImpl[];
    // RFC 4.1, first paragraph, last sentence: must match exactly one node.
    if (1 == target.length) {
      return [target[0], parts[2] || ''];
    } else if (target.length > 1) {
      throwException(new UnlocatedNode(Exception.ErrMultipleMatches, action));
      return [target, ''];
    }
    throwException(new UnlocatedNode(Exception.ErrNoMatch, action));
    return [null, ''];
  }

  /**
   * Imports the given nodes to target document, with namespace mapped to target
   * document's namespaces.
   * @param nodes
   * @param target
   */
  protected importNodes(nodes: NodeImpl[], target: NodeImpl): NodeImpl[] {
    return nodes.map(n => {
      const c = this.mangleNS(n.cloneNode(true), target, n);
      return this.target.doc.importNode(c, true);
    });
  }

  /**
   * Default namespace has been translated into the XPath expressions, we just
   * need to handle prefixes here.
   *
   * @param node a imported node that will be put to target, please note that
   * this node *may* not be in the diff document.
   * @param target a node in the target document.
   * @param anchor a node in the diff document, mostly likely the node being
   * processed currently.
   */
  protected mangleNS(
    node: NodeImpl | AttrImpl,
    target: NodeImpl,
    anchor: NodeImpl,
  ): NodeImpl {
    if (node.hasChildNodes()) {
      for (const child of node.childNodes) {
        this.mangleNS(child, target, anchor);
      }
    }
    if (!isElement(node) && !isAttribute(node)) {
      // we are in the middle of importing nodes that can be all kinds of nodes,
      // don't throw exception here.
      return node;
    }
    const [prefix, , targetPrefix, targetNS] = this.mapNamespace(
      (<ElementImpl>node).tagName || (<AttrImpl>node).name,
      target,
      anchor,
    );
    if (targetPrefix) {
      this.setPrefix(node, targetPrefix);
    } else if (targetNS) {
      this.setPrefix(node, prefix, targetNS);
    }
    if (isAttribute(node)) return node;
    if (node.hasAttributes()) {
      const attrs = allAttributes(node);
      for (const attr of attrs) {
        this.mangleNS(attr, target, anchor);
      }
    }
    return node;
  }

  /**
   * Sets the node prefix, and namespace URI if provided. Please note that the
   * namespace lookup list (`_nsMap`) is not changed.
   * @param node
   * @param prefix
   * @param ns
   */
  protected setPrefix(
    node: ElementImpl | AttrImpl,
    prefix: string,
    ns?: string,
  ): void {
    node.prefix = prefix;
    if (ns) {
      node.namespaceURI = ns;
    }
    const prop = isElement(node) ? 'tagName' : 'name';
    if (prefix) {
      node.nodeName = `${prefix}:${node.localName}`;
      node[prop] = `${prefix}:${node.localName}`;
    } else {
      node.nodeName = node.localName;
      node[prop] = node.localName;
    }
  }

  /**
   * Map the given namespace to target document's namespaces.
   * @param name
   * @param target
   * @param node
   * @param isAttr
   */
  protected mapNamespace(
    name: string,
    target: NodeImpl,
    node: NodeImpl,
    isAttr?: boolean,
  ): string[] {
    // we may in the middle of add or replacing nodes, which may involve adding
    // new namespaces to target.
    // dont throw any exception here.
    const parts = name.split(':');
    if (parts.length < 2) {
      // RFC 4.2.3, last "For example" paragraph, last sentence:
      // unprefixed attributes don't inherit the default namespace declaration
      if (isElement(node) && node.namespaceURI && !isAttr) {
        const prefix = this.target.lookupPrefix(node.namespaceURI, target);
        return ['', name, prefix || '', node.namespaceURI];
      }
      return ['', name, '', ''];
    }
    const [prefix, local] = parts;
    const uri = this.diff.lookupNamespaceURI(prefix, node)!;
    const targetPrefix = this.target.lookupPrefix(uri);
    return [prefix, local, targetPrefix || '', uri];
  }

  /**
   * Check if the given prefix is used by any descendant node.
   * @param anchor
   * @param prefix
   */
  protected hasPrefixChildren(anchor: ElementImpl, prefix: string): boolean {
    let child = firstElementChild(anchor);
    let found = false;
    while (child && !found) {
      if (prefix == child.prefix) {
        return true;
      }
      if (child.hasChildNodes()) {
        found = this.hasPrefixChildren(child, prefix);
        if (found) return true;
      }
      child = child.nextSibling;
    }
    return found;
  }

  // endregion
}
