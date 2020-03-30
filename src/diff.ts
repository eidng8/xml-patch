import {XMLFile} from './xml-file';
import {ElementImpl} from 'xmldom-ts';

export default class Diff {
  static readonly NamespaceRegistry = 'urn:ietf:params:xml:ns:patch-ops-error';

  static readonly SupportedActions = ['add', 'remove', 'replace'];

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
      if (Diff.SupportedActions.indexOf(action.localName) < 0) continue;
      this._actions.push(action);
    }
    return this;
  }

  protected compileActions(): Diff {
    for (const action of this.actions) {
      const exp = action.getAttribute('sel');
      if (!exp) continue;
      const cmp = this.compileAction(exp, action);
      if (exp != cmp) {
        action.setAttribute('sel', cmp);
      }
    }
    return this;
  }

  /**
   * Handles namespace mangling of the given expression. It processes the given
   * expression segment by segment, delimited by forward slash character `'/'`.
   * @param exp the XPath expression
   * @param action the action element
   */
  protected compileAction(exp: string, action: ElementImpl): string {
    let idx = 0;
    let isAttr = false;
    let squareDepth = 0;
    let bracketDepth = 0;
    let compiled = '';
    let part = '';
    let ch = '';
    let prefix = '';

    const mangle = () => {
      compiled += this.mangleElementNamespace(
        prefix.trim(),
        part.trim(),
        isAttr,
        action,
      ) + ch;
      idx++;
      part = '';
      prefix = '';
      isAttr = false;
    };

    const pack = () => {
      compiled += prefix + part + ch;
      prefix = '';
      part = '';
      ch = '';
      isAttr = false;
    };

    while ((ch = exp[idx])) {
      switch (ch) {
        // a segment is about to start, send everything before it to mangle.
        case '/':
          mangle();
          continue;

        // start of attribute expression
        case '@':
          isAttr = true;
          compiled += '@';
          ch = '';
          break;

        // if inside an attribute expression, mangle it
        case '=':
          if (isAttr) mangle();
          break;

        // stores current portion to prefix, if not in bracket or square bracket
        case ':':
          if (squareDepth || bracketDepth) break;
          if (':' != exp[idx + 1]) {
            prefix = part;
            part = '';
            idx++;
            continue;
          }
          break;

        // send everything to mangle if this is the 1st opening square bracket
        case '[':
          if (isAttr || !squareDepth) mangle();
          squareDepth++;
          continue;

        // closes a square bracket pair, if there is no square bracket left open
        // then pack everything to the compiled string, we don't mangle things
        // inside square brackets
        case ']':
          squareDepth--;
          if (!squareDepth) pack();
          break;

        // we don't do anything within brackets, just mark the its start
        case '(':
          bracketDepth++;
          break;

        // closes a bracket pair, if there is no bracket left open then pack
        // everything to the compiled string, we don't mangle things inside
        // brackets
        case ')':
          bracketDepth--;
          if (!bracketDepth) pack();
          break;
      }
      part += ch;
      idx++;
    }
    compiled += this.mangleElementNamespace(
      prefix.trim(),
      part.trim(),
      isAttr,
      action,
    );
    return compiled;
  }

  protected mangleElementNamespace(
    prefix: string,
    name: string,
    isAttr: boolean,
    action: ElementImpl,
  ): string {
    if (!name) return '';

    // nothing needs done if the diff document is not namespaced
    if (!prefix && !action.namespaceURI) return name;

    // if the expression is a single wildcard, we don't need to do anything
    if ('*' == name) return '*';

    // find out the namespace URI for the diff document, so we can ignore it
    // later on encounter
    const ns = isAttr && !prefix ? '' : action.lookupNamespaceURI(prefix || '');

    // expand the expression
    let exp = '*';
    if (ns) {
      exp += `[namespace-uri()='${ns}']`;
    }
    exp += `[local-name()='${name}']`;

    return exp;
  }
}
