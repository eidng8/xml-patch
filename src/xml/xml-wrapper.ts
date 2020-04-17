/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { DocumentImpl, DOMParserImpl, ElementImpl, NodeImpl } from 'xmldom-ts';
import XmlOptions from './xml-options';
import FormatOptions from './format-options';
import ExceptionBag from '../errors/ExceptionBag';
import InvalidDiffFormat from '../errors/InvalidDiffFormat';
import InvalidEntityDeclaration from '../errors/InvalidEntityDeclaration';
import { throwException } from '../errors/helpers';
import { lookupAncestor } from '../utils/helpers';

const pd = require('pretty-data').pd;

/**
 * A wrapper over {@link https://www.npmjs.com/package/xmldom-ts|xmldom-ts}.
 * This class handles encoding while reading from files.
 * There are some convenient methods and polyfills. There are many gaps between
 * the standard DOM feature set provided by browsers. I've tried to modify the
 * original `xmldom-ts` package but failed. The original project doesn't provide
 * a `package-lock.json`. `tsc` spills a whole lot of errors on it.
 */
export default class XmlWrapper {
  /**
   * Default encoding to use while reading file
   */
  protected _defaultEncoding: string;

  /**
   * The XML document
   */
  protected _doc!: DocumentImpl;

  /**
   * Actual encoding of the loaded XML document
   */
  protected _encoding!: string;

  protected _exceptions: ExceptionBag;

  /**
   * Encoding of the loaded XML document
   */
  get encoding(): string {
    return this._encoding;
  }

  /**
   * The document node
   */
  get doc(): DocumentImpl {
    return this._doc;
  }

  /**
   * The root element node
   */
  get root(): ElementImpl | null {
    return this.doc.documentElement as ElementImpl | null;
  }

  get hasError(): boolean {
    return this._exceptions.hasException;
  }

  get exception(): ExceptionBag {
    return this._exceptions;
  }

  /**
   * Creates a new DOM parser
   */
  protected get parser() {
    return new DOMParserImpl({
      // locator is always need for error position info
      locator: {},
      errorHandler: {
        warning: this.warning.bind(this),
        error: this.error.bind(this),
        fatalError: this.fatalError.bind(this),
      },
    });
  }

  constructor(options: XmlOptions = {}) {
    this._defaultEncoding = options.defaultEncoding || 'utf-8';
    this._exceptions = new ExceptionBag();
  }

  /**
   * Load XML from the given string. The `encoding` parameter must be correct.
   * @param xml
   * @param encoding
   */
  fromString(xml: string, encoding?: string): XmlWrapper {
    this._encoding = encoding || this._defaultEncoding;
    this._doc = this.parser.parseFromString(xml) as DocumentImpl;
    if (this.hasError) {
      throwException(this.exception);
    }
    return this;
  }

  toString(options?: FormatOptions): string {
    const xml = this.doc.toString();
    const opts = Object.assign(
      {
        pretty: true,
        minify: false,
        preserveComments: true,
      },
      options,
    );
    if (opts.minify) {
      return pd.xmlmin(xml, opts.preserveComments);
    }
    // noinspection TypeScriptValidateJSTypes
    return pd.xml(xml);
  }

  /**
   * Passes through to given node's `lookupNamespaceURI()`, and back track to
   * ancestors if not found in the node.
   * @param prefix
   * @param node
   */
  lookupNamespaceURI(prefix: string | null, node?: NodeImpl): string | null {
    if (!prefix) {
      return node
        ? node.lookupNamespaceURI('')
        : this.root!.lookupNamespaceURI('');
    }
    return lookupAncestor(
      node || this.root!,
      (anchor, prefix) => anchor.lookupNamespaceURI(prefix),
      prefix,
    );
  }

  /**
   * Passes through to given node's `lookupPrefix()`, and back track to
   * ancestors if not found in the node.
   * @param uri
   * @param node
   */
  lookupPrefix(uri: string | null, node?: NodeImpl): string | null {
    if (!uri) return null;
    return lookupAncestor(
      node || this.root!,
      (anchor, uri) => anchor.lookupPrefix(uri),
      uri,
    );
  }

  /**
   * Adds the given namespace declaration to the specified node, or root node if
   * no node is given.
   * @param prefix
   * @param uri
   * @param node
   */
  addNamespace(prefix: string, uri: string, node?: ElementImpl): XmlWrapper {
    if (!prefix) return this;
    const n = node || this.root!;
    n._nsMap[prefix] = uri;
    n.setAttribute(`xmlns:${prefix}`, uri);
    return this;
  }

  protected warning(err: string) {
    this._exceptions.push(new InvalidDiffFormat(err));
  }

  protected error(err: string) {
    if (err.indexOf('entity not found:') > -1) {
      this._exceptions.push(new InvalidEntityDeclaration(err));
    } else {
      this._exceptions.push(new InvalidDiffFormat(err));
    }
  }

  protected fatalError(err: string) {
    this._exceptions.push(new InvalidDiffFormat(err));
  }
}
