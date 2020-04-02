import {AttrImpl, DocumentImpl, ElementImpl, NodeImpl} from 'xmldom-ts';
import {select} from 'xpath-ts';
import {XMLFile} from './xml-file';
import Diff from './diff';
import {XPatchException} from './errors';

export class Patcher {
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

  protected diff!: Diff;

  protected target!: XMLFile;

  public load(diff: string): Patcher {
    this.diff = new Diff(diff);
    return this;
  }

  public patch(xml: string): XMLFile {
    this.target = new XMLFile().fromString(xml);
    for (const action of this.diff.actions) {
      this.processAction(action);
    }
    return this.target;
  }

  protected processAction(elem: ElementImpl) {
    const action = elem.tagName;
    const query = elem.getAttribute('sel')!;
    let target = select(query, this.target.doc) as NodeImpl | NodeImpl[];

    // RFC 4.1, first paragraph, last sentence: must match exactly one node.
    if (Array.isArray(target) && 1 == target.length) {
      target = target[0];
    } else {
      throw new XPatchException(
        'Expected only one matching element, but multiple has been found.',
      );
    }

    switch (action) {
      case Patcher.Add:
        this.processAdd(
          target,
          elem.getAttribute('type'),
          elem.getAttribute('pos'),
          elem,
        );
        break;

      case Patcher.Remove:
        this.processRemove(target, elem.getAttribute('ws'));
        break;

      case Patcher.Replace:
        this.processReplace(target, elem);
        break;

      default:
        throw Error(`Invalid tag: ${action}`);
    }
  }

  // region Addition
  protected processAdd(
    target: NodeImpl | null | undefined,
    type: string | null,
    pos: string | null,
    action: NodeImpl,
  ) {
    if (!target || !action.hasChildNodes()) return;
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
        throw new Error();
      }
    } else {
      this.addChildNode(target, action.childNodes, pos);
    }
  }

  protected addAttribute(
    target: NodeImpl,
    node: NodeImpl,
    name: string,
    value: string,
  ) {
    if (!target || !XMLFile.isElement(target)) return;
    const [prefix, localName, targetPrefix, targetNS]
      = this.mapNamespace(name, target, node);
    if (targetNS) {
      const p = targetPrefix || prefix;
      const n = p ? `${p}:${localName}` : localName;
      target.setAttributeNS(targetNS, n, value);
    } else {
      target.setAttribute(name, value || '');
    }
  }

  protected addChildNode(
    target: NodeImpl,
    children: NodeImpl[],
    pos?: string | null,
  ) {
    const imported = this.importNodes(children, target);
    let anchor = target;
    switch (pos) {
      case 'after':
        for (const child of imported) {
          anchor = target.parentNode!.insertBefore(child, anchor.nextSibling);
        }
        break;

      case 'before':
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
    node: NodeImpl | null | undefined,
    ws: string | null,
  ) {
    if (!node) return;
    if (XMLFile.isAttribute(node)) {
      (node.ownerElement! as ElementImpl).removeAttributeNode(node);
    } else if (XMLFile.isText(node)) {
      node.parentNode!.removeChild(node);
    } else {
      const parent = node.parentNode!;
      if (!ws) {
        parent.removeChild(node);
        return;
      }
      // RFC 4.5, 2nd paragraph: specifically prohibits removal of namespace
      // nodes with `ws` attribute, but I haven't figured out the exact meaning,
      // so it is ignored for now.
      let sibling;
      if ('after' == ws || 'both' == ws) {
        sibling = node.nextSibling;
        if (XMLFile.isText(sibling) && !sibling.textContent!.trim()) {
          parent.removeChild(sibling);
        }
      }
      if ('before' == ws || 'both' == ws) {
        sibling = node.previousSibling;
        if (XMLFile.isText(sibling) && !sibling.textContent!.trim()) {
          parent.removeChild(node.previousSibling);
        }
      }
      parent.removeChild(node);
    }
  }

  // endregion

  protected importNodes(nodes: NodeImpl[], target: NodeImpl): NodeImpl[] {
    return nodes.map(n => {
      const c = this.mangleNS(n.cloneNode(true), target, n);
      return this.target.doc.importNode(c, true);
    });
  }

  protected processReplace(
    node: NodeImpl | null | undefined,
    action: ElementImpl,
  ) {
    if (!node) return;
    if (node instanceof AttrImpl) {
      node.value = action.textContent!;
    } else {
      if (node.parentNode instanceof DocumentImpl
          && node instanceof ElementImpl) {
        this.removeAllChildren(this.target.doc);
        this.importNodes(action.childNodes, node)
          .forEach(n => this.target.doc.appendChild(n));
      } else {
        for (const n of this.importNodes(action.childNodes, node)) {
          node.parentNode!.replaceChild(n, node);
        }
      }
    }
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
    if (!XMLFile.isElement(node) && !XMLFile.isAttribute(node)) return node;
    const [prefix, , targetPrefix, targetNS] = this.mapNamespace(
      XMLFile.isElement(node) ? node.tagName : node.name,
      target,
      anchor,
    );
    if (targetPrefix) {
      this.setPrefix(node, targetPrefix);
    } else if (targetNS) {
      this.setPrefix(node, prefix, targetNS);
    }
    if (XMLFile.isAttribute(node)) return node;
    if (node.hasAttributes()) {
      const attrs = XMLFile.allAttributes(node);
      for (const attr of attrs) {
        this.mangleNS(attr, target, anchor);
      }
    }
    return node;
  }

  protected removeAllChildren(target: NodeImpl) {
    target.childNodes.forEach((n: NodeImpl) => target.removeChild(n));
  }

  protected isQueryNamespace(query: string) {
    return query.indexOf('namespace::') >= 0;
  }

  protected setPrefix(node: NodeImpl, prefix: string, ns?: string): void {
    node.prefix = prefix;
    if (ns) {
      node.namespaceURI = ns;
    }
    if (XMLFile.isElement(node)) {
      if (prefix) {
        node.nodeName = `${prefix}:${node.localName}`;
        node.tagName = `${prefix}:${node.localName}`;
      } else {
        node.nodeName = node.localName;
        node.tagName = node.localName;
      }
    } else if (XMLFile.isAttribute(node)) {
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
  ): string[] {
    const parts = name.split(':');
    if (parts.length < 2) {
      return ['', name, '', ''];
    }
    const [prefix, local] = parts;
    const uri = node
      ? this.diff.lookupNamespaceURI(prefix, node)
      : this.target.lookupNamespaceURI(prefix, target);
    const targetPrefix = this.target.lookupPrefix(uri);
    return [prefix, local, targetPrefix || '', uri || ''];
  }
}
