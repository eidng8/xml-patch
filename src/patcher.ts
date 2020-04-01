import {AttrImpl, DocumentImpl, ElementImpl, NodeImpl} from 'xmldom-ts';
import {select} from 'xpath-ts';
import {XMLFile} from './xml-file';
import Diff from './diff';
import {arrayWrap} from './helpers';
import {NotImplementedException, XPatchException} from './errors';

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
    const query = elem.getAttribute('sel');
    let target = select(query!, this.target.doc) as NodeImpl | NodeImpl[];

    // RFC 4.1, first paragraph, last sentence: only one node is allowed.
    if (Array.isArray(target)) {
      if (target.length > 1) {
        throw new XPatchException(
          'Expected only one matching element, but multiple has been found.',
        );
      }
      target = target[0];
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
        this.processReplace(arrayWrap(target), elem);
        break;

      default:
        throw Error(`Invalid tag: ${action}`);
    }
  }

  // region Addition
  protected processAdd(
    node: NodeImpl | null | undefined,
    type: string | null,
    pos: string | null,
    action: NodeImpl,
  ) {
    if (!node || !action.hasChildNodes()) return;
    const t = (type && type.trim()) || '';
    if (t.length) {
      if ('@' == t[0]) {
        this.addAttribute(node, t.substr(1), action.textContent!);
      } else if (t.startsWith(Patcher.AxisAttribute)) {
        this.addAttribute(
          node,
          t.substr(Patcher.AxisAttribute.length).trim(),
          action.textContent!,
        );
      } else {
        this.addNamespace(
          t.substr(Patcher.AxisNamespace.length).trim(),
          action.textContent!,
        );
      }
    } else {
      this.addChildNode(node, action.childNodes, pos);
    }
  }

  protected addAttribute(target: NodeImpl, name: string, value: string) {
    if (!target || !XMLFile.isElement(target)) return;
    target.setAttribute(name, value || '');
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Haven't figured out how to implement this
   * @param prefix
   * @param uri
   */
  private addNamespace(prefix: string, uri: string) {
    if (!prefix || !uri) return;
    throw new NotImplementedException();
  }

  protected addChildNode(
    target: NodeImpl,
    children: NodeImpl[],
    pos?: string | null,
  ) {
    const imported = this.importNodes(children);
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

  protected importNodes(nodes: NodeImpl[]): NodeImpl[] {
    return nodes.map(n =>
      this.target.doc.importNode(this.mangleNS(n.cloneNode(true)), true));
  }

  protected processReplace(
    nodes: NodeImpl[] | null | undefined,
    action: ElementImpl,
  ) {
    if (!nodes) return;
    for (const node of nodes) {
      if (node instanceof AttrImpl) {
        node.value = action.textContent!;
      } else {
        if (node.parentNode instanceof DocumentImpl
            && node instanceof ElementImpl) {
          this.removeAllChildren(this.target.doc);
          this.importNodes(action.childNodes)
            .forEach(n => this.target.doc.appendChild(n));
        } else {
          for (const n of this.importNodes(action.childNodes)) {
            node.parentNode!.replaceChild(n, node);
          }
        }
      }
    }
  }

  /**
   * Default namespace has been translated into the XPath expressions, we just
   * need to handle prefixes here.
   *
   * @param node a node that will be put to target
   */
  protected mangleNS(node: NodeImpl | AttrImpl): NodeImpl {
    if (node.hasChildNodes()) {
      for (const child of node.childNodes) {
        this.mangleNS(child);
      }
    }
    if (!XMLFile.isElement(node) && !XMLFile.isAttribute(node)) return node;
    if (node.prefix) {
      const diffURI = this.target.lookupNamespaceURI(node.prefix, node);
      if (diffURI) {
        const targetPrefix = this.target.lookupPrefix(diffURI, node);
        if (targetPrefix) {
          node.prefix = targetPrefix;
        }
      }
    }
    if (XMLFile.isAttribute(node)) return node;
    if (node.hasAttributes()) {
      const attrs = node.getAttributeNames();
      for (const attr of attrs) {
        this.mangleNS(node.getAttributeNode(attr));
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
}
