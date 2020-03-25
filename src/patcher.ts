import {
  AttrImpl,
  DocumentImpl,
  DOMParserImpl as DOMParser,
  ElementImpl,
  NodeImpl,
} from 'xmldom-ts';
import {select} from 'xpath-ts';

export class Patcher {
  protected diff!: DocumentImpl;

  protected target!: DocumentImpl;

  public load(diff: string): Patcher {
    const parser = new DOMParser();
    this.diff = parser.parseFromString(diff) as DocumentImpl;
    return this;
  }

  public patch(xml: string): DocumentImpl | null {
    const parser = new DOMParser();
    this.target = parser.parseFromString(xml) as DocumentImpl;

    const root = this.diff.documentElement;
    if (!root.hasChildNodes()) {
      return null;
    }

    root.childNodes.forEach((node: Node) => {
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
    const target = select(query, this.target);

    switch (action) {
      case 'add':
        this.processAdd(
          target as NodeImpl,
          elem.getAttribute('type'),
          elem.getAttribute('pos'),
          elem,
        );
        break;

      case 'remove':
        this.processRemove(target as NodeImpl | NodeImpl[]);
        break;

      case 'replace':
        this.processReplace(target as NodeImpl | NodeImpl[], elem);
        break;

      default:
        throw Error(`Invalid tag: ${action}`);
    }
  }

  protected processAdd(
    target: NodeImpl,
    type: string | null,
    pos: string | null,
    action: NodeImpl,
  ) {
    const nodes = this.warpNodes(target);
    if (!nodes) return;
    for (const node of nodes) {
      this.addChildNode(node, action.childNodes, pos);
    }
  }

  protected processRemove(target: NodeImpl | NodeImpl[]) {
    if (!target) return;
    if (target instanceof NodeImpl) target.remove();
    (target as NodeImpl[]).map(n => n.remove());
  }

  protected processReplace(target: NodeImpl | NodeImpl[], action: ElementImpl) {
    const nodes = this.warpNodes(target);
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

  protected addChildNode(
    target: NodeImpl,
    children: NodeImpl | NodeImpl[],
    pos?: string | null,
  ) {
    const chs = this.importNodes(children);
    switch (pos) {
      case 'before':
        for (const child of chs) {
          target.insertBefore(child, target);
        }
        break;

      case 'after':
        for (const child of chs) {
          target.insertBefore(child, target.nextSibling);
        }
        break;

      default:
        for (const child of chs) {
          target.appendChild(child);
        }
    }
  }

  protected warpNodes(node: NodeImpl | NodeImpl[]): NodeImpl[] | null {
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
}
