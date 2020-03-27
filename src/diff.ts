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
    let idx = 0;
    let depth = 0;
    let compiled = '';
    let part = '';
    let ch = '';
    let prefix = '';

    const advance = () => {
      compiled += this.compileNamespace(prefix, part, action) + ch;
      idx++;
      part = '';
      prefix = '';
    };

    while ((ch = exp[idx])) {
      switch (ch) {
        case '/':
          advance();
          continue;

        case ':':
          if (depth) break;
          if (':' != exp[idx + 1]) {
            prefix = part;
            part = '';
            continue;
          }
          break;

        case '[':
          depth++;
          advance();
          continue;

        case ']':
          depth--;
          break;
      }
      part += ch;
      idx++;
    }
    if (part) {
      compiled += this.compileNamespace(prefix, part, action);
    }
    return compiled;
  }

  protected compileNamespace(
    prefix: string,
    name: string,
    action: ElementImpl,
  ): string {
    if (!prefix && !action.namespaceURI) return name;
    let compiled = '';
    let idx = prefix.indexOf('[');
    console.log(idx, action, compiled);
    return compiled;
  }
}
