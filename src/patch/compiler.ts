/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { ElementImpl } from 'xmldom-ts';
import { XPathParser } from 'xpath-ts';
import { assertAttributeNotEmpty } from '../utils/asserts';
import Action from './action';
import Patch from './patch';

export default class Compiler {
  protected patch!: Patch;

  protected action!: ElementImpl;

  /**
   * Goes through all extracted actions, performs checking and namespace
   * mangling.
   */
  compile(patch: Patch, action: ElementImpl): boolean {
    if (!assertAttributeNotEmpty(action, Action.Selector)) return false;
    this.patch = patch;
    this.action = action;
    const expression = action.getAttribute(Action.Selector)!.trim();
    let mangled = this.mangleNamespace(expression);
    // RFC 4.1, second paragraph: 'sel' attribute always start from root node
    if (!mangled.startsWith('/')) {
      mangled = `/${mangled}`;
    }
    if (expression != mangled) {
      action.setAttribute(Action.Predicated, mangled);
    }
    return true;
  }

  /**
   * This is a *simple* process. It's not supposed to work on complex XPath
   * expressions. Currently it expands *qualified names* in simple expressions
   * of form `a/b/c` to expressions with predicates
   * `*[namespace-uri()='uuu'][local-name()='nnn']`. Also, quotation marks are
   * not dealt with either.
   * @param expression
   */
  protected mangleNamespace(expression: string): string {
    const parser = new XPathParser();
    const [types, tokens] = parser.tokenize(expression);
    for (let idx = 0; idx < types.length; idx++) {
      switch (types[idx]) {
        case XPathParser.QNAME:
          tokens[idx] = this.compileQName(
            tokens[idx],
            XPathParser.AT == types[idx - 1],
          );
          break;

        case XPathParser.LITERAL:
          tokens[idx] = this.compileLiteral(tokens[idx]);
          break;

        case XPathParser.DOUBLECOLON:
          idx++;
          break;
      }
    }
    tokens.pop();
    return tokens.join('');
  }

  protected compileQName(token: string, isAttr: boolean) {
    const [prefix, name] = this.tokenizeQName(token);
    return this.mangleQName(prefix, name, isAttr);
  }

  protected compileLiteral(token: string): string {
    const literal = token.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `'${literal}'`;
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
   */
  protected mangleQName(prefix: string, name: string, isAttr: boolean): string {
    // RFC 4.2.1, paragraph 3: leave this unqualified.
    if (!prefix && !this.action.namespaceURI) {
      return `*[local-name()='${name}']`;
    }

    // RFC 4.2.1, paragraph 1 & 2: lookup namespaces
    const ns = this.getPrefix(prefix, isAttr);

    // use predicates for our convenience
    let exp = '*';
    if (ns) {
      exp += `[namespace-uri()='${ns}']`;
    }
    exp += `[local-name()='${name}']`;

    return exp;
  }

  protected getPrefix(prefix: string, isAttr: boolean): string | null {
    if (isAttr && !prefix) return '';
    return this.patch.lookupNamespaceURI(prefix || '', this.action);
  }
}
