import {DocumentImpl, DOMParserImpl as DOMParser, ElementImpl} from 'xmldom-ts';
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
    console.log(action);
    const query = elem.getAttribute('sel');
    console.log(query);
    if (!query) return;

    const targets = select(query, this.target);
    console.log(targets);
  }
}
