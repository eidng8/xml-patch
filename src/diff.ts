import {XMLFile} from './xml-file';
import {ElementImpl} from 'xmldom-ts';

export default class Diff {
  protected xml!: XMLFile;

  protected _actions: ElementImpl[];

  get actions(): ElementImpl[] {
    return this._actions;
  }

  constructor(diff: string | XMLFile) {
    this._actions = [];
    this.load(diff).loadActions().compileActions();
  }

  load(diff: string | XMLFile): Diff {
    if (XMLFile.isXMLFile(diff)) {
      this.xml = diff;
      return this;
    }
    this.xml = new XMLFile().fromString(diff);
    return this;
  }

  protected loadActions(): Diff {
    const root = this.xml.root;
    if (!root) return this;
    for (const action of root.childNodes) {
      if (!XMLFile.isElement(action)) continue;
      this._actions.push(action);
    }
    return this;
  }

  protected compileActions(): Diff {
    for (const action of this._actions) {
      const exp = action.getAttribute('sel');
      if (!exp) continue;
      const cmp = this.compileAction(exp, action);
      if (exp != cmp) {
        action.setAttribute('sel', cmp);
      }
    }
    return this;
  }

  protected compileAction(exp: string, action: ElementImpl): string {
    let compiled = '';
    let part = '';
    let idx = 0;
    let ch = '';
    let depth = 0;
    while ((ch = exp[idx])) {
      switch (ch) {
        case '/':
          if (!depth) {
            compiled += this.compilePart(part, action) + ch;
            idx++;
            part = '';
            continue;
          }
          break;

        case '[':
          depth++;
          break;

        case ']':
          depth--;
          break;
      }
      part += ch;
      idx++;
    }
    if (part) {
      compiled += this.compilePart(part, action);
    }
    return compiled;
  }

  protected compilePart(part: string, action: ElementImpl): string {
    if (!part) return '';
    if (!action.namespaceURI) return part;
    let compiled = '';
    let idx = part.indexOf('[');
    console.log(idx, action, compiled);
    return compiled;
  }
}
