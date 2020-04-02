import {XML} from './xml';
import {ElementImpl, NodeImpl} from 'xmldom-ts';
import {XPathParser} from 'xpath-ts';

export default class Diff {
  static readonly NamespaceRegistry = 'urn:ietf:params:xml:ns:patch-ops-error';

  static readonly SupportedActions = ['add', 'remove', 'replace'];

  protected xml!: XML;

  protected _actions: ElementImpl[];

  get actions(): ElementImpl[] {
    return this._actions;
  }

  constructor(diff: string | XML) {
    this._actions = [];
    this.load(diff).loadActions().compileActions();
  }

  load(diff: string | XML): Diff {
    if (XML.isXMLFile(diff)) {
      this.xml = diff;
      return this;
    }
    this.xml = new XML().fromString(diff);
    return this;
  }

  lookupNamespaceURI(prefix: string | null, node?: NodeImpl): string | null {
    return this.xml.lookupNamespaceURI(prefix, node);
  }

  lookupPrefix(uri: string | null, node?: NodeImpl): string | null {
    return this.xml.lookupPrefix(uri, node);
  }

  protected loadActions(): Diff {
    const root = this.xml.root;
    if (!root) return this;
    for (const action of root.childNodes) {
      if (!XML.isElement(action)) continue;
      if (!action.hasAttribute('sel')) throw new Error();
      if (Diff.SupportedActions.indexOf(action.localName) < 0) continue;
      this._actions.push(action);
    }
    return this;
  }

  protected compileActions(): Diff {
    for (const action of this.actions) {
      const exp = action.getAttribute('sel')!.trim();
      if (!exp) throw new Error();
      let cmp = this.mangleNamespace(exp, action);
      // RFC 4.1, second paragraph: 'sel' attribute always start from root node
      if (!cmp.startsWith('/')) {
        cmp = `/${cmp}`;
      }
      if (exp != cmp) {
        action.setAttribute('sel', cmp);
      }
    }
    return this;
  }

  protected mangleNamespace(expression: string, action: ElementImpl): string {
    let a;
    let name;
    let prefix;
    const parser = new XPathParser();
    const [types, tokens] = parser.tokenize(expression);
    for (let idx = 0; idx < types.length; idx++) {
      switch (types[idx]) {
        case XPathParser.QNAME:
          [prefix, name] = this.tokenizeQName(tokens[idx]);
          a = XPathParser.AT == types[idx - 1];
          tokens[idx] = this.mangleQName(prefix, name, a, action);
          break;

        case XPathParser.LITERAL:
          name = tokens[idx].replace('\\', '\\\\').replace('\'', '\\\'');
          tokens[idx] = `'${name}'`;
      }
    }
    tokens.pop();
    return tokens.join('');
  }

  protected tokenizeQName(qname: string): string[] {
    let prefix = '';
    const parts = qname.split(':');
    let name = parts[0];
    if (parts.length > 1) {
      [prefix, name] = parts;
    }
    return [prefix, name];
  }

  protected mangleQName(
    prefix: string,
    name: string,
    isAttr: boolean,
    action: ElementImpl,
  ): string {
    if (!name) return '';

    // if the expression is a single wildcard, we don't need to do anything
    if ('*' == name) return '*';

    // RFC 4.2.1, paragraph 3: leave this unqualified.
    if (!prefix && !action.namespaceURI) return name;

    // RFC 4.2.1, paragraph 1 & 2: lookup namespaces
    const ns = isAttr && !prefix ? ''
      : this.xml.lookupNamespaceURI(prefix || '', action);

    // use predicates for our convenience
    let exp = '*';
    if (ns) {
      exp += `[namespace-uri()='${ns}']`;
    }
    exp += `[local-name()='${name}']`;

    return exp;
  }
}
