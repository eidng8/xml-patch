import {AttrImpl, DocumentImpl, ElementImpl, NodeImpl} from 'xmldom-ts';
import {select} from 'xpath-ts';
import {XMLFile} from './xml-file';

export class Patcher {
  protected diff!: DocumentImpl;

  protected target!: DocumentImpl;

  public load(diff: string): Patcher {
    this.diff = new XMLFile().fromString(diff).doc;
    return this;
  }

  public patch(xml: string): DocumentImpl | null {
    this.target = new XMLFile().fromString(xml).doc;

    const root = this.diff.documentElement;
    if (!root.hasChildNodes()) {
      return null;
    }

    root.childNodes.forEach((node: NodeImpl) => {
      if (node instanceof ElementImpl) {
        this.processAction(node as ElementImpl);
      }
    });
    return this.target;
  }

  protected processAction(elem: ElementImpl) {
    const action = elem.tagName;
    const query = elem.getAttribute('sel');
    if (!query) {
      throw Error('Attribute `sel` is missing.');
    }
    const target = select(query, this.target) as NodeImpl | NodeImpl[];

    if (this.isQueryNamespace(query)) {
      this.replaceNamespace(null, elem);
      return;
    }

    switch (action) {
      case 'add':
        this.processAdd(
          this.wrapNodes(target),
          elem.getAttribute('type'),
          elem.getAttribute('pos'),
          elem,
        );
        break;

      case 'remove':
        this.processRemove(this.wrapNodes(target));
        break;

      case 'replace':
        this.processReplace(this.wrapNodes(target), elem);
        break;

      default:
        throw Error(`Invalid tag: ${action}`);
    }
  }

  protected processAdd(
    nodes: NodeImpl[] | null,
    type: string | null,
    pos: string | null,
    action: NodeImpl,
  ) {
    if (!nodes) return;
    if (type) {
      for (const node of nodes) {
        this.addAttribute(node, type.substr(1), action.textContent!);
      }
    } else {
      for (const node of nodes) {
        this.addChildNode(node, action.childNodes, pos);
      }
    }
  }

  protected processRemove(nodes: NodeImpl[] | null) {
    if (!nodes) return;
    for (const node of nodes) {
      if (node instanceof AttrImpl) {
        (node.ownerElement! as ElementImpl).removeAttributeNode(node);
      } else {
        node.parentNode!.removeChild(node);
      }
    }
  }

  protected processReplace(nodes: NodeImpl[] | null, action: ElementImpl) {
    if (!nodes) return;
    for (const node of nodes) {
      if (node instanceof AttrImpl) {
        node.value = action.textContent!;
      } else {
        if (node.parentNode instanceof DocumentImpl
            && node instanceof ElementImpl) {
          this.removeAllChildren(this.target);
          this.importNodes(action.childNodes)
            .forEach(n => this.target.appendChild(n));
        } else {
          for (const n of this.importNodes(action.childNodes)) {
            node.parentNode!.replaceChild(n, node);
          }
        }
      }
    }
  }

  protected replaceNamespace(
    nodes: NodeImpl[] | null,
    action: ElementImpl,
  ) {
    if (!nodes) return;
    console.log(action);
  }

  protected addChildNode(
    target: NodeImpl,
    children: NodeImpl | NodeImpl[],
    pos?: string | null,
  ) {
    const imported = this.importNodes(children);
    switch (pos) {
      case 'before':
        for (const child of imported) {
          target.parentNode!.insertBefore(child, target);
        }
        break;

      case 'after':
        for (const child of imported) {
          target.parentNode!.insertBefore(child, target.nextSibling);
        }
        break;

      default:
        for (const child of imported) {
          target.appendChild(child);
        }
    }
  }

  protected wrapNodes(node: NodeImpl | NodeImpl[]): NodeImpl[] | null {
    if (!node) return null;
    let wrapped: NodeImpl[];
    if (node instanceof NodeImpl) {
      wrapped = [node];
    } else {
      wrapped = node;
    }
    return wrapped;
  }

  protected importNodes(nodes: NodeImpl | NodeImpl[]): NodeImpl[] {
    return (Array.isArray(nodes) ? nodes : [nodes])
      .map(e => this.target.importNode(e, true));
  }

  protected removeAllChildren(target: NodeImpl) {
    target.childNodes.forEach((n: NodeImpl) => target.removeChild(n));
  }

  protected addAttribute(target: NodeImpl, name: string, value: string) {
    const nodes = this.wrapNodes(target);
    if (!nodes) return;
    for (const node of nodes as ElementImpl[]) {
      node.setAttribute(name, value);
    }
  }

  protected isQueryNamespace(query: string) {
    return query.indexOf('namespace::') >= 0;
  }
}
