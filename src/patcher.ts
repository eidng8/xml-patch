import {
  AttrImpl,
  DocumentImpl,
  DOMParserImpl as DOMParser,
  ElementImpl,
  NodeImpl,
  XMLSerializerImpl,
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
    this.addChildNode(target, action.children, pos);
  }

  protected processRemove(target: NodeImpl | NodeImpl[]) {
    if (!target) return;
    if (target instanceof NodeImpl) target.remove();
    (target as NodeImpl[]).map(n => n.remove());
  }

  protected processReplace(target: NodeImpl | NodeImpl[], action: ElementImpl) {
    if (!target) return;
    let nodes: NodeImpl[];
    if (target instanceof NodeImpl) {
      nodes = [target];
    } else {
      nodes = target;
    }
    for (const node of nodes) {
      if (node instanceof AttrImpl) {
        node.value = action.textContent!;
      } else {
        this.addChildNode(node, action.childNodes, 'before');
        node.parentNode!.removeChild(node);
      }
    }
  }

  protected addChildNode(
    target: NodeImpl,
    children: NodeImpl | NodeImpl[],
    pos?: string | null,
  ) {
    const ser = new XMLSerializerImpl();
    const chs = (Array.isArray(children) ? children : [children])
      .map(e => this.target.importNode(e, true));
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
}
