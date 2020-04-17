/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { ElementImpl, NodeImpl } from 'xmldom-ts';
import { select } from 'xpath-ts';
import XmlWrapper from '../xml/xml-wrapper';
import Exception from '../errors/Exception';
import UnlocatedNode from '../errors/UnlocatedNode';
import { throwException } from '../errors/helpers';
import { isElement } from '../utils/type-guards';
import { assertElement, assertKnownAction } from '../utils/asserts';
import { descend } from '../utils/helpers';
import Compiler from './compiler';
import NamespaceMangler from './namespace-mangler';
import Patch from './patch';

/**
 * Base class of patch actions (directives).
 */
export default abstract class Action {
  // region Constants
  /**
   * The `<add>` directive
   */
  static readonly Add = 'add';

  /**
   * The `<replace>` directive
   */
  static readonly Replace = 'replace';

  /**
   * The `<remove>` directive
   */
  static readonly Remove = 'remove';

  /**
   * The `sel` attribute
   */
  static readonly Selector = 'sel';

  /**
   * The `sel` attribute translated into predicates.
   */
  static readonly Predicated = 'p-sel';

  /**
   * The `type` attribute
   */
  static readonly Type = 'type';

  /**
   * The `pos` attribute
   */
  static readonly Pos = 'pos';

  /**
   * The `ws` attribute of the `<remove>` directive
   */
  static readonly Ws = 'ws';
  /**
   * An valid value to `'pos'` and `'ws'` attributes. Denoting action is applied
   * to the next sibling of the target node.
   */
  static readonly After = 'after';

  /**
   * An valid value to `'pos'` and `'ws'` attributes. Denoting action is
   * applied to the previous sibling of the target node.
   */
  static readonly Before = 'before';
  /**
   * An valid value to `'pos'` attribute. Denoting inserting before the first
   * child node.
   */
  static readonly Prepend = 'prepend';
  /**
   * An valid value to `'ws'` attribute. Denoting action is applied to both
   * previous and next sibling of the target node.
   */
  static readonly Both = 'both';

  /**
   * The attribute axis
   */
  static readonly AxisAttribute = 'attribute::';

  /**
   * The namespace axis
   */
  static readonly AxisNamespace = 'namespace::';
  // endregion

  /**
   * The target XML document to be patched.
   */
  protected xml!: XmlWrapper;

  /**
   * The patch document to be processed.
   */
  protected patch: Patch;

  /**
   * DOM element of the action.
   */
  protected action: ElementImpl;

  /**
   * The XPath express to be used in query.
   */
  protected _query: string;

  /**
   * The namespace mangler to be used.
   */
  protected mangler: NamespaceMangler;

  /**
   * Whether current action is valid.
   */
  protected _valid: boolean = false;

  /**
   * The `sel` attribute.
   */
  get sel(): string | null | undefined {
    return this.action.getAttribute(Action.Selector);
  }

  /**
   * The `sel` attribute translated into predicates.
   */
  get predicate(): string | null | undefined {
    return this.action.getAttribute(Action.Predicated);
  }

  /**
   * The effective expression to be used in query.
   */
  get query(): string {
    return this._query;
  }

  /**
   * Name of the action (directive).
   */
  get directive(): string {
    return this.action.localName;
  }

  /**
   * DOM element of the action.
   */
  get element(): ElementImpl {
    return this.action;
  }

  /**
   * Whether current action is valid.
   */
  get valid() {
    return this._valid;
  }

  /**
   * @param patch the {@link Patch} instance where the action is in.
   * @param action DOM element of the action.
   */
  constructor(patch: Patch, action: ElementImpl) {
    this.patch = patch;
    this.action = action;
    this.mangler = new NamespaceMangler(patch);
    this.compile();
    this._query =
      action.getAttribute(Action.Predicated) ||
      action.getAttribute(Action.Selector)!;
  }

  /**
   * Applies the action
   */
  apply(xml: XmlWrapper) {
    if (!this.valid) return;
    this.xml = xml;
    this.mangler.setTarget(xml);
    const [subject, prefix] = this.select();
    // this is the only place to use this function
    // I don't like making it a member method.
    if (!subject) return;
    // In case of ignoring errors, multiple targets could be selected
    if (Array.isArray(subject)) {
      subject.forEach(t => t && this.process(t, prefix));
    } else {
      this.process(subject, prefix);
    }
  }

  /**
   * Process the action. The `prefix` is only useful when processing namespace
   * actions.
   * @param subject the targeted node in target document
   * @param prefix a prefix that exists in the target document
   */
  protected abstract process(subject: NodeImpl, prefix?: string);

  /**
   * Tries to compile the action, and update the validity state.
   */
  protected compile() {
    // Although RFC doesn't explicitly define how to deal with empty 'sel'.
    // Judging by the description of <invalid-attribute-value> error,
    this._valid =
      assertElement(this.action) &&
      assertKnownAction(this.action) &&
      new Compiler().compile(this.patch, this.action);
  }

  /**
   * Perform the XPath query on target document. If the expression denotes a
   * namespace prefix operation, the prefix will be returned in the second
   * element of the returned array. In this case, the query will be performed
   * without the namespace axis.
   */
  protected select(): [NodeImpl | NodeImpl[] | null, string] {
    const parts = /^(.+?)(?:\/namespace::(.+))?$/i.exec(this.query)!;
    const target = select(parts[1], this.xml.doc) as NodeImpl[];
    // RFC 4.1, first paragraph, last sentence: must match exactly one node.
    if (1 == target.length) {
      return [target[0], parts[2] || ''];
    } else if (target.length > 1) {
      const ex = new UnlocatedNode(Exception.ErrMultipleMatches, this.action);
      throwException(ex);
      return [target, parts[2] || ''];
    }
    throwException(new UnlocatedNode(Exception.ErrNoMatch, this.action));
    return [null, ''];
  }

  /**
   * Imports the given nodes to target document, with namespace mapped to target
   * document's namespaces.
   * @param nodes
   * @param target
   */
  protected importNodes(nodes: NodeImpl[], target: NodeImpl): NodeImpl[] {
    return nodes.map(n => {
      const c = this.mangler.mangle(n.cloneNode(true), target, n);
      return this.xml.doc.importNode(c, true);
    });
  }

  /**
   * Check if the given prefix is used by any descendant node.
   * @param anchor
   * @param prefix
   */
  protected hasPrefixChildren(anchor: ElementImpl, prefix: string): boolean {
    let found = false;
    descend(
      anchor,
      current => (found = isElement(current) && prefix == current.prefix),
    );
    return found;
  }
}
