import {XML} from './xml';
import {ElementImpl, NodeImpl} from 'xmldom-ts';
import {XPathParser} from 'xpath-ts';
import {
  InvalidAttributeValue,
  InvalidPatchDirective,
  throwException,
} from './errors';
import Exception from './errors/Exception';
import {Patch} from './patch';

/**
 * Parse the given XML patch document, according to
 * {@link https://tools.ietf.org/html/rfc5261|RFC 5261}.
 */
export default class Diff {
  /**
   * XML namespace of XML patch
   */
  static readonly DiffNamespace = 'urn:ietf:params:xml:ns:pidf-diff';

  /**
   * List of defined patch directives (actions).
   */
  static readonly SupportedActions = ['add', 'remove', 'replace'];

  /**
   * The loaded XML document
   */
  protected xml!: XML;

  /**
   * List of actions to be performed.
   */
  protected _actions: ElementImpl[];

  /**
   * List of actions to be performed.
   */
  get actions(): ElementImpl[] {
    return this._actions;
  }

  /**
   * @param diff This can be an XML string, of a {@link XML} instance.
   */
  constructor(diff: string | XML) {
    this._actions = [];
    this.load(diff).loadActions().compileActions();
  }

  /**
   * @param diff can be an XML string, of a {@link XML} instance.
   * @return this instance
   */
  load(diff: string | XML): Diff {
    if (XML.isXML(diff)) {
      this.xml = diff;
      return this;
    }
    this.xml = new XML().fromString(diff);
    return this;
  }

  /**
   * Pass through to underlining XML document's {@link XML.lookupNamespaceURI}
   * @param prefix
   * @param node the node to be looked up
   */
  lookupNamespaceURI(prefix: string | null, node?: NodeImpl): string | null {
    return this.xml.lookupNamespaceURI(prefix, node);
  }

  /**
   * Pass through to underlining XML document's {@link XML.lookupPrefix}
   * @param uri
   * @param node the node to be looked up
   */
  lookupPrefix(uri: string | null, node?: NodeImpl): string | null {
    return this.xml.lookupPrefix(uri, node);
  }

  /**
   * Parses the XML patch document and extracts all its actions.
   * Please note that this method *doesn't* check the action, which is done by
   * {@link compileActions}
   * @return this instance
   */
  protected loadActions(): Diff {
    const root = this.xml.root;
    if (!root || !root.hasChildNodes()) {
      // RFC doesn't define what to do with empty patch document.
      // Just ignore it for now.
      return this;
    }
    let action = XML.firstElementChild(root);
    while (action) {
      if (!action.hasAttribute(Patch.Selector)) {
        // Although RFC doesn't explicitly define how to deal with empty 'sel'.
        // Judging by the description of <invalid-attribute-value> error,
        // I think this should be an error.
        throwException(
          new InvalidAttributeValue(Exception.ErrSelMissing, action));
        return this;
      }
      if (Diff.SupportedActions.indexOf(action.localName) < 0) {
        throwException(new InvalidPatchDirective(action));
        continue;
      }
      this._actions.push(action);
      action = XML.nextElementSibling(action);
    }
    return this;
  }

  /**
   * Goes through all extracted actions, performs checking and namespace
   * mangling.
   */
  protected compileActions(): Diff {
    for (const action of this.actions) {
      const exp = action.getAttribute(Patch.Selector)!.trim();
      if (!exp) {
        // As mentioned in `loadActions()`, I think this is an error.
        throwException(
          new InvalidAttributeValue(Exception.ErrSelEmpty, action));
        return this;
      }
      let cmp = this.mangleNamespace(exp, action);
      // RFC 4.1, second paragraph: 'sel' attribute always start from root node
      if (!cmp.startsWith('/')) {
        cmp = `/${cmp}`;
      }
      if (exp != cmp) {
        action.setAttribute(Patch.Predicated, cmp);
      }
    }
    return this;
  }

  /**
   * This is a *simple* process. It's not supposed to work on complex XPath
   * expressions. Currently it expands *qualified names* in simple expressions
   * of form `a/b/c` to expressions with predicates
   * `*[namespace-uri()='uuu'][local-name()='nnn']`. Also, quotation marks are
   * not dealt with either.
   * @param expression
   * @param action the owning action element of the expression
   */
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
          break;

        case XPathParser.DOUBLECOLON:
          idx++;
          break;
      }
    }
    tokens.pop();
    return tokens.join('');
  }

  /**
   * Breaks up the qualified name by colon `':'`.
   * @param qname
   */
  protected tokenizeQName(qname: string): string[] {
    let prefix = '';
    const parts = qname.split(':');
    let name = parts[0];
    if (parts.length > 1) {
      [prefix, name] = parts;
    }
    return [prefix, name];
  }

  /**
   * Actually mangles the namespace.
   * @param prefix
   * @param name
   * @param isAttr
   * @param action
   */
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
    if (!prefix && !action.namespaceURI) return `*[local-name()='${name}']`;

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
