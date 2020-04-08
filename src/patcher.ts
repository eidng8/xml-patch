import {AttrImpl, ElementImpl, NodeImpl} from 'xmldom-ts';
import {select} from 'xpath-ts';
import {XML} from './xml';
import Diff from './diff';
import {
  assertNotRoot,
  assertTextChild,
  InvalidAttributeValue,
  InvalidNamespacePrefix,
  InvalidPatchDirective,
  InvalidWhitespaceDirective,
  throwException,
  UnlocatedNode,
} from './errors';
import Exception from './errors/Exception';

export class Patcher {
  // region Constants
  static readonly Add = 'add';

  static readonly Replace = 'replace';

  static readonly Remove = 'remove';

  static readonly Selector = 'sel';

  static readonly Type = 'type';

  static readonly Pos = 'pos';

  static readonly After = 'after';

  static readonly Before = 'before';

  static readonly Prepend = 'prepend';

  static readonly AxisAttribute = 'attribute::';

  static readonly AxisNamespace = 'namespace::';
  // endregion

  protected diff!: Diff;

  protected target!: XML;

  public load(diff: string): Patcher {
    this.diff = new Diff(diff);
    return this;
  }

  public patch(xml: string): XML {
    this.target = new XML().fromString(xml);
    for (const action of this.diff.actions) {
      this.processAction(action);
    }
    return this.target;
  }

  protected processAction(elem: ElementImpl) {
    const action = elem.localName;
    const query = elem.getAttribute('sel')!;
    const [target, prefix] = this.select(query, elem);
    const process = (target, cb) => {
      if (!target) return;
      if (Array.isArray(target)) {
        target.forEach(t => t && cb(t));
      } else {
        cb(target, elem);
      }
    };
    switch (action) {
      case Patcher.Add:
        process(target, t => this.processAdd(t, elem));
        break;

      case Patcher.Remove:
        if (prefix) {
          process(target, t => this.removeNamespace(t, prefix, elem));
        } else {
          process(target, t => this.processRemove(t, elem));
        }
        break;

      case Patcher.Replace:
        if (prefix) {
          process(target, t => this.replaceNamespace(t, prefix, elem));
        } else {
          process(target, t => this.processReplace(t, elem));
        }
        break;

      default:
        throwException(new InvalidPatchDirective(elem));
    }
  }

  // region Addition
  protected processAdd(target: NodeImpl, action: ElementImpl): void {
    if (!action.hasChildNodes()) return;
    const t = (action.getAttribute('type') || '').trim() || '';
    if (t.length) {
      if ('@' == t[0]) {
        if (!assertTextChild(action)) return;
        this.addAttribute(
          target,
          action,
          t.substr(1),
          action.textContent!.trim(),
        );
      } else if (t.startsWith(Patcher.AxisAttribute)) {
        if (!assertTextChild(action)) return;
        this.addAttribute(
          target,
          action,
          t.substr(Patcher.AxisAttribute.length).trim(),
          action.textContent!.trim(),
        );
      } else if (t.startsWith(Patcher.AxisNamespace)) {
        if (!assertTextChild(action)) return;
        this.target.addNamespace(
          t.substr(Patcher.AxisNamespace.length).trim(),
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

  protected addAttribute(
    target: NodeImpl,
    node: NodeImpl,
    name: string,
    value: string,
  ): void {
    if (!target || !XML.isElement(target)) return;
    const [prefix, localName, targetPrefix, targetNS]
      = this.mapNamespace(name, target, node, true);
    if (targetNS) {
      const p = targetPrefix || prefix;
      const n = p ? `${p}:${localName}` : localName;
      target.setAttributeNS(targetNS, n, value);
    } else {
      target.setAttribute(name, value || '');
    }
  }

  protected addNode(target: NodeImpl, action: ElementImpl): void {
    const imported = this.importNodes(action.childNodes, target);
    let anchor = target;
    switch (action.getAttribute('pos')) {
      case 'after':
        if (!assertNotRoot(target, action)) return;
        for (const child of imported) {
          anchor = target.parentNode!.insertBefore(child, anchor.nextSibling);
        }
        break;

      case 'before':
        if (!assertNotRoot(target, action)) return;
        for (const child of imported) {
          target.parentNode!.insertBefore(child, target);
        }
        break;

      case 'prepend':
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
  protected processRemove(target: NodeImpl, action: ElementImpl): void {
    const ws = action.getAttribute('ws');
    if (XML.isAttribute(target)) {
      if (ws) {
        throwException(
          new InvalidAttributeValue(Exception.ErrWsAttribute, action));
        return;
      }
      (target.ownerElement! as ElementImpl).removeAttributeNode(target);
    } else if (XML.isText(target)) {
      if (ws) {
        throwException(
          new InvalidAttributeValue(Exception.ErrWsTextNode, action));
        return;
      }
      target.parentNode!.removeChild(target);
    } else {
      if (XML.isElement(target) && !assertNotRoot(target, action)) return;
      if (ws) {
        this.removeWhiteSpaceNode(ws, target, action);
      }
      target.parentNode!.removeChild(target);
    }
  }

  protected removeWhiteSpaceNode(
    ws: string,
    target: NodeImpl,
    action: NodeImpl,
  ): void {
    // RFC 4.5, 2nd paragraph: specifically prohibits removal of namespace
    // nodes with `ws` attribute, but I haven't figured out the exact meaning,
    // so it is ignored for now.
    let sibling;
    const parent = target.parentNode!;
    if ('after' == ws || 'both' == ws) {
      sibling = target.nextSibling;
      if (XML.isText(sibling) && !sibling.textContent!.trim()) {
        parent.removeChild(sibling);
      } else {
        throwException(
          new InvalidWhitespaceDirective(Exception.ErrWsAfter, action));
        return;
      }
    }
    if ('before' == ws || 'both' == ws) {
      sibling = target.previousSibling;
      if (XML.isText(sibling) && !sibling.textContent!.trim()) {
        parent.removeChild(target.previousSibling);
      } else {
        throwException(
          new InvalidWhitespaceDirective(Exception.ErrWsBefore, action));
        // return;
      }
    }
  }

  protected removeNamespace(
    target: ElementImpl,
    prefix: string,
    action: ElementImpl,
  ): void {
    const uri = target.lookupNamespaceURI(prefix);
    if (!uri) {
      throwException(new InvalidNamespacePrefix(Exception.ErrPrefix, action));
      return;
    }
    if (this.hasPrefixChildren(target, prefix)) {
      throwException(
        new InvalidNamespacePrefix(Exception.ErrPrefixUsed, action));
      return;
    }
    target.nodeName = target.localName;
    target.tagName = target.localName;
    target.prefix = null;
    delete (target._nsMap[prefix]);
    target.removeAttributeNode(target.getAttributeNode(`xmlns:${prefix}`));
    if (target.namespaceURI == uri) {
      target.namespaceURI = null;
    }
  }

  // endregion

  // region Replacement
  protected processReplace(target: NodeImpl, action: ElementImpl) {
    if (target instanceof AttrImpl) {
      target.value = action.textContent!;
    } else {
      if (XML.isElement(target) && !assertNotRoot(target, action)) return;
      for (const n of this.importNodes(action.childNodes, target)) {
        target.parentNode!.replaceChild(n, target);
      }
    }
  }

  protected replaceNamespace(
    target: any,
    prefix: string,
    action: ElementImpl,
  ): void {
    let uri = '';
    if (action.hasChildNodes() && assertTextChild(action)) {
      uri = (action.textContent || '').trim();
    }
    if (!target.lookupNamespaceURI(prefix)) {
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
    action: NodeImpl,
  ): [NodeImpl | NodeImpl[] | null, string] {
    const parts = /^(.+?)(?:\/namespace::(.+))?$/i.exec(expression);
    if (!parts || parts.length < 2) {
      throwException(
        new InvalidAttributeValue(Exception.ErrSelAttribute, action));
      return [null, ''];
    }
    const target = select(parts[1], this.target.doc) as NodeImpl | NodeImpl[];
    // RFC 4.1, first paragraph, last sentence: must match exactly one node.
    if (Array.isArray(target)) {
      if (1 == target.length) {
        return [target[0], parts[2] || ''];
      } else if (target.length > 1) {
        throwException(
          new UnlocatedNode(Exception.ErrMultipleMatches, action));
        return [target, ''];
      }
    }
    throwException(new UnlocatedNode(Exception.ErrNoMatch, action));
    return [null, ''];
  }

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
    anchor?: NodeImpl,
  ): NodeImpl {
    if (node.hasChildNodes()) {
      for (const child of node.childNodes) {
        this.mangleNS(child, target, anchor);
      }
    }
    if (!XML.isElement(node) && !XML.isAttribute(node)) return node;
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
    if (XML.isAttribute(node)) return node;
    if (node.hasAttributes()) {
      const attrs = XML.allAttributes(node);
      for (const attr of attrs) {
        this.mangleNS(attr, target, anchor);
      }
    }
    return node;
  }

  protected setPrefix(node: NodeImpl, prefix: string, ns?: string): void {
    node.prefix = prefix;
    if (ns) {
      node.namespaceURI = ns;
    }
    if (XML.isElement(node)) {
      if (prefix) {
        node.nodeName = `${prefix}:${node.localName}`;
        node.tagName = `${prefix}:${node.localName}`;
      } else {
        node.nodeName = node.localName;
        node.tagName = node.localName;
      }
    } else if (XML.isAttribute(node)) {
      if (prefix) {
        node.nodeName = `${prefix}:${node.localName}`;
        node.name = `${prefix}:${node.localName}`;
      } else {
        node.nodeName = node.localName;
        node.name = node.localName;
      }
    }
  }

  protected mapNamespace(
    name: string,
    target: NodeImpl,
    node?: NodeImpl,
    isAttr?: boolean,
  ): string[] {
    const parts = name.split(':');
    if (parts.length < 2) {
      // RFC 4.2.3, last "For example" paragraph, last sentence:
      // unprefixed attributes don't inherit the default namespace declaration
      if (node && XML.isElement(node) && node.namespaceURI && !isAttr) {
        const prefix = this.target.lookupPrefix(node.namespaceURI, target);
        return ['', name, prefix || '', node.namespaceURI];
      }
      return ['', name, '', ''];
    }
    const [prefix, local] = parts;
    const uri = node
      ? this.diff.lookupNamespaceURI(prefix, node)
      : this.target.lookupNamespaceURI(prefix, target);
    const targetPrefix = this.target.lookupPrefix(uri);
    return [prefix, local, targetPrefix || '', uri || ''];
  }

  protected hasPrefixChildren(anchor: ElementImpl, prefix: string): boolean {
    let child = XML.firstElementChild(anchor);
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
