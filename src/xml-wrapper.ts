/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import {existsSync, readFile} from 'fs';
import {
  AttrImpl,
  CDATASectionImpl,
  CommentImpl,
  DocumentImpl,
  DOMParserImpl,
  ElementImpl,
  NodeImpl,
  ProcessingInstructionImpl,
  TextImpl,
} from 'xmldom-ts';
import iconv from 'iconv-lite';
import {
  ExceptionBag,
  InvalidDiffFormat,
  InvalidEntityDeclaration,
  throwException,
} from './errors';

const pd = require('pretty-data').pd;

/**
 * Options to reading XML file
 */
export interface XMLFileOptions {
  /**
   * Default encoding to use while reading file
   */
  defaultEncoding?: string;

  /**
   * The file system mock to be used
   */
  fsMock?: any;
}

/**
 * Options to format the XML document to string
 */
export interface FormatOptions {
  /**
   * Pretty print the XML
   */
  pretty?: boolean,

  /**
   * Minify the XML
   */
  minify?: boolean,

  /**
   * Preserve comments in XML
   */
  preserveComments?: boolean
}

/**
 * A wrapper over {@link https://www.npmjs.com/package/xmldom-ts|xmldom-ts}.
 * This class handles encoding while reading from files.
 * There are some convenient methods and polyfills. There are many gaps between
 * the standard DOM feature set provided by browsers. I've tried to modify the
 * original `xmldom-ts` package but failed. The original project doesn't provide
 * a `package-lock.json`. `tsc` spills a whole lot of errors on it.
 */
export default class XmlWrapper {
  // region Fields
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
   * The file system mock to be used
   */
  protected _fsMock?: any;
  // endregion

  // region Static Methods
  /**
   * Type guard
   * @param subject
   */
  static isXML(subject: any): subject is XmlWrapper {
    return subject instanceof XmlWrapper;
  }

  /**
   * Document node type guard
   * @param subject
   */
  static isDocument(subject: any): subject is DocumentImpl {
    return subject instanceof DocumentImpl;
  }

  /**
   * Comment node type guard
   * @param node
   */
  static isComment(node: any): node is CommentImpl {
    return node instanceof CommentImpl;
  }

  /**
   * CData node type guard
   * @param node
   */
  static isCData(node: any): node is CDATASectionImpl {
    return node instanceof CDATASectionImpl;
  }

  /**
   * Text node type guard
   * @param node
   */
  static isText(node: any): node is TextImpl {
    return node instanceof TextImpl;
  }

  /**
   * Processing instruction node type guard
   * @param node
   */
  static isProcessingInstruction(node: any): node is ProcessingInstructionImpl {
    return node instanceof ProcessingInstructionImpl;
  }

  /**
   * Element node type guard
   * @param node
   */
  static isElement(node: any): node is ElementImpl {
    return node instanceof ElementImpl;
  }

  /**
   * Attribute node type guard
   * @param node
   */
  static isAttribute(node: any): node is AttrImpl {
    return node instanceof AttrImpl;
  }

  /**
   * Check if the given node is the root of its document.
   * @param node
   */
  static isRoot(node: NodeImpl): boolean {
    return XmlWrapper.isDocument(node.parentNode);
  }

  /**
   * Retrieves all attribute nodes of the given element.
   * @param element
   */
  static allAttributes(element: ElementImpl) {
    const attributes = [] as AttrImpl[];
    for (const a of element.attributes) {
      attributes.push(a);
    }
    return attributes;
  }

  /**
   * Check if the given node is a white space text node
   * @param node
   */
  static isEmptyText(node: NodeImpl): boolean {
    return XmlWrapper.isText(node) && !node.textContent!.trim();
  }

  /**
   * Counts all immediate element children
   * @param node
   * @param ignoreWhiteSpace
   */
  static childElementCount(node: NodeImpl, ignoreWhiteSpace = true): number {
    let count = 0;
    let child = node.firstChild;
    while (child) {
      const skip = ignoreWhiteSpace && XmlWrapper.isEmptyText(child);
      child = child.nextSibling;
      if (skip) continue;
      count++;
    }
    return count;
  }

  /**
   * Retrieves the first element child of the given node.
   * @param node
   */
  static firstElementChild(node: NodeImpl): ElementImpl | null {
    let child = node.firstChild;
    while (child) {
      if (XmlWrapper.isElement(child)) return child;
      child = child.nextSibling;
    }
    return null;
  }

  /**
   * Retrieves the first CData child of the given node.
   * @param node
   */
  static firstCDataChild(node: NodeImpl): CommentImpl | null {
    let child = node.firstChild;
    while (child) {
      if (XmlWrapper.isCData(child)) return child;
      child = child.nextSibling;
    }
    return null;
  }

  /**
   * Retrieves the first comment child of the given node.
   * @param node
   */
  static firstCommentChild(node: NodeImpl): CommentImpl | null {
    let child = node.firstChild;
    while (child) {
      if (XmlWrapper.isComment(child)) return child;
      child = child.nextSibling;
    }
    return null;
  }

  /**
   * Retrieves the first processing instruction child of the given node.
   * @param node
   */
  static firstProcessingInstructionChild(
    node: NodeImpl,
  ): ProcessingInstructionImpl | null {
    let child = node.firstChild;
    while (child) {
      if (XmlWrapper.isProcessingInstruction(child)) return child;
      child = child.nextSibling;
    }
    return null;
  }

  /**
   * Retrieves the next element sibling of the given node.
   * @param node
   */
  static nextElementSibling(node: NodeImpl): ElementImpl | null {
    let sibling = node.nextSibling;
    while (sibling) {
      if (XmlWrapper.isElement(sibling)) return sibling;
      sibling = sibling.nextSibling;
    }
    return null;
  }

  // endregion

  // region Properties
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

  // endregion

  constructor(options: XMLFileOptions = {}) {
    this._defaultEncoding = options.defaultEncoding || 'utf-8';
    this._fsMock = options.fsMock;
    this._exceptions = new ExceptionBag();
  }

  // region Public Methods
  /**
   * Load XML from the given file
   * @param path
   */
  async fromFile(path: string): Promise<XmlWrapper> {
    return new Promise((resolve, reject) => {
      if (!existsSync(path)) {
        reject(new Error(`File doesn't exist: ${path}`));
        return;
      }
      this.loadFile(path).then(() => resolve(this)).catch(r => reject(r));
    });
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
    const opts = Object.assign({
      pretty: true,
      minify: false,
      preserveComments: true,
    }, options);
    if (opts.minify) {
      return pd.xmlmin(xml, opts.preserveComments);
    }
    // noinspection TypeScriptValidateJSTypes
    return pd.xml(xml);
  }

  /**
   * Remove all empty text nodes from descendants of the given node.
   * @param node
   */
  removeEmptyTextNodes(node: NodeImpl): XmlWrapper {
    if (!node.hasChildNodes()) return this;
    let child: NodeImpl = node.firstChild;
    while (child) {
      if (XmlWrapper.isText(child)) {
        if (child.textContent && child.textContent.trim()) {
          child = child.nextSibling;
        } else {
          const n = child;
          child = child.nextSibling;
          node.removeChild(n);
        }
        continue;
      } else if (XmlWrapper.isElement(child)) {
        this.removeEmptyTextNodes(child);
      }
      child = child.nextSibling;
    }
    return this;
  }

  /**
   * {@link String.trim} all descendants' text nodes.
   * @param node
   */
  trimTextContents(node: NodeImpl): XmlWrapper {
    if (!node.hasChildNodes()) return this;
    for (const child of node.childNodes) {
      if (XmlWrapper.isText(child)) {
        const txt = child.textContent && child.textContent.trim();
        child.textContent = txt;
        child.data = txt!;
      } else if (XmlWrapper.isElement(child)) {
        this.trimTextContents(child);
      }
    }
    return this;
  }

  /**
   * Passes through to given node's `lookupNamespaceURI()`, and back track to
   * ancestors if not found in the node.
   * @param prefix
   * @param node
   */
  lookupNamespaceURI(prefix: string | null, node?: NodeImpl): string | null {
    if (!prefix) {
      return node ? node.lookupNamespaceURI('')
        : this.root!.lookupNamespaceURI('');
    }
    let anchor = node || this.root!;
    do {
      const uri = anchor.lookupNamespaceURI(prefix);
      if (uri) return uri;
    } while ((anchor = anchor.parentNode));
    return null;
  }

  /**
   * Passes through to given node's `lookupPrefix()`, and back track to
   * ancestors if not found in the node.
   * @param uri
   * @param node
   */
  lookupPrefix(uri: string | null, node?: NodeImpl): string | null {
    if (!uri) return null;
    let anchor = node || this.root!;
    do {
      const prefix = anchor.lookupPrefix(uri);
      if (prefix) return prefix;
    } while ((anchor = anchor.parentNode));
    return null;
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

  // endregion

  // region Protected Methods
  /**
   * Tries to determine the proper encoding of the file, by the first
   * processing instruction. Uses default encoding if none were found.
   * @param path
   */
  protected async determineEncoding(path: string): Promise<[string, Buffer]> {
    return new Promise((resolve, reject) => {
      this.readFile(path)
        .then(buf => {
          const len = buf.indexOf('?>', 0, 'latin1');
          if (len < 0) {
            this._encoding = this._defaultEncoding;
            resolve([this._defaultEncoding, buf]);
            return;
          }

          const pi = buf.toString(this._defaultEncoding, 0, len + 2);
          const regex = /<\?xml .*encoding="(.+?)".*\?>/i;
          const re = regex.exec(pi);
          if (!re || re.length < 2) {
            this._encoding = this._defaultEncoding;
            resolve([this._defaultEncoding, buf]);
            return;
          }

          this._encoding = re[1];
          resolve([re[1], buf]);
        })
        .catch(r => reject(r));
    });
  }

  /**
   * Loads the XML from given file.
   * @param path
   */
  protected async loadFile(path: string): Promise<DocumentImpl> {
    return new Promise((resolve, reject) => {
      this.determineEncoding(path)
        .then(([encoding, buf]) => {
          const xml = iconv.decode(buf, encoding);
          this._doc = this.parser.parseFromString(xml) as DocumentImpl;
          if (this.hasError) {
            reject(this.exception);
            return;
          }
          resolve(this._doc);
        })
        .catch(r => reject(r));
    });
  }

  /**
   * Read the given file. If a mock was provided, use the mock instead of `fs`.
   * @param path
   */
  protected async readFile(path: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const handle = (err: Error | null, buf: Buffer) => {
        if (err) {
          reject(err);
          return;
        }
        if (!buf) {
          reject(new Error(`Failed to read file: ${path}`));
          return;
        }
        if (buf.length < 1) {
          reject(new Error(`File is empty: ${path}`));
          return;
        }
        resolve(buf);
      };
      if (this._fsMock) {
        this._fsMock.readFile(path, handle);
      } else {
        readFile(path, handle);
      }
    });
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

  // endregion
}
