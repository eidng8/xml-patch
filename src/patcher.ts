import {AttrImpl, ElementImpl, NodeImpl} from 'xmldom-ts';
import {select} from 'xpath-ts';
import {XML} from './xml';
import Diff from './diff';
import {
  assertNotRoot,
  InvalidAttributeValue,
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
    const action = elem.tagName;
    const query = elem.getAttribute('sel')!;
    const target = this.select(query, this.target.doc, elem);
    switch (action) {
      case Patcher.Add:
        this.processAdd(
          target,
          elem.getAttribute('type'),
          elem,
        );
        break;

      case Patcher.Remove:
        this.processRemove(target, elem.getAttribute('ws'), elem);
        break;

      case Patcher.Replace:
        this.processReplace(target, elem);
        break;

      default:
        throw new InvalidPatchDirective(elem);
    }
  }

  // region Addition
  protected processAdd(
    target: NodeImpl,
    type: string | null,
    action: ElementImpl,
  ) {
    if (!action.hasChildNodes()) return;
    const t = (type && type.trim()) || '';
    if (t.length) {
      if ('@' == t[0]) {
        this.addAttribute(target, action, t.substr(1), action.textContent!);
      } else if (t.startsWith(Patcher.AxisAttribute)) {
        this.addAttribute(
          target,
          action,
          t.substr(Patcher.AxisAttribute.length).trim(),
          action.textContent!,
        );
      } else if (t.startsWith(Patcher.AxisNamespace)) {
        this.target.addNamespace(
          t.substr(Patcher.AxisNamespace.length).trim(),
          action.textContent!,
          target as ElementImpl,
        );
      } else {
        throw new InvalidAttributeValue('Invalid type.', action);
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
  ) {
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

  protected addNode(
    target: NodeImpl,
    action: ElementImpl,
  ) {
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
  protected processRemove(
    target: NodeImpl,
    ws: string | null,
    action: ElementImpl,
  ) {
    if (!assertNotRoot(target, action)) return;
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
      }
      target.parentNode!.removeChild(target);
    } else {
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
  ) {
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

  // endregion

  // region Replacement
  protected processReplace(target: NodeImpl, action: ElementImpl) {
    if (target instanceof AttrImpl) {
      target.value = action.textContent!;
    } else {
      if (!assertNotRoot(target, action)) return;
      for (const n of this.importNodes(action.childNodes, target)) {
        target.parentNode!.replaceChild(n, target);
      }
    }
  }

  // endregion

  // region Utilities
  protected select(
    expression: string,
    doc: NodeImpl,
    action: NodeImpl,
  ): NodeImpl {
    const target = select(expression, doc) as NodeImpl | NodeImpl[];
    // RFC 4.1, first paragraph, last sentence: must match exactly one node.
    if (Array.isArray(target)) {
      if (1 == target.length) {
        return target[0];
      } else if (target.length > 1) {
        throw new UnlocatedNode('Multiple matches found.', action);
      }
    }
    throw new UnlocatedNode('No match found.', action);
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

  // endregion
}
