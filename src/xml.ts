import {existsSync, readFile} from 'fs';
import {
  AttrImpl,
  DocumentImpl,
  DOMParserImpl,
  ElementImpl,
  NodeImpl,
  TextImpl,
} from 'xmldom-ts';
import iconv from 'iconv-lite';

const pd = require('pretty-data').pd;

export interface XMLFileOptions {
  defaultEncoding?: string;

  warnError?: boolean;

  fsMock?: any;
}

export interface FormatOptions {
  pretty?: boolean,

  minify?: boolean,

  preserveComments?: boolean
}

export class XML {
  protected _defaultEncoding: string;

  protected _doc!: DocumentImpl;

  protected _encoding!: string;

  protected _warnings!: string[];

  protected _errors!: string[];

  protected _warnError: boolean;

  protected _fsMock?: any;

  static isXMLFile(subject: any): subject is XML {
    return subject instanceof XML;
  }

  /**
   * Text node type guard
   * @param node
   */
  static isText(node: any): node is TextImpl {
    return node instanceof TextImpl;
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

  static allAttributes(node: ElementImpl) {
    const attributes = [];
    for (const a of node.attributes) {
      attributes.push(a);
    }
    return attributes;
  }

  get encoding(): string {
    return this._encoding;
  }

  get doc(): DocumentImpl {
    return this._doc;
  }

  get root(): ElementImpl | null {
    return this.doc.documentElement as ElementImpl | null;
  }

  get warnings(): string[] {
    return this._warnings;
  }

  get errors(): string[] {
    return this._errors;
  }

  protected get parser() {
    /* istanbul ignore next */
    return new DOMParserImpl({
      // locator is always need for error position info
      locator: {},
      errorHandler: {
        warning: err => this._warnings.push(err),
        error: err => this._errors.push(err),
        fatalError: err => this._errors.push(err),
      },
    });
  }

  constructor(options: XMLFileOptions = {}) {
    this._defaultEncoding = options.defaultEncoding || 'utf-8';
    this._warnError = options.warnError || false;
    this._fsMock = options.fsMock;
  }

  async fromFile(path: string): Promise<XML> {
    return new Promise((resolve, reject) => {
      this._warnings = [];
      this._errors = [];
      if (!existsSync(path)) {
        reject(new Error(`File doesn't exist: ${path}`));
        return;
      }
      this.loadFile(path).then(() => resolve(this)).catch(r => reject(r));
    });
  }

  fromString(xml: string, encoding = 'utf-8'): XML {
    this._warnings = [];
    this._errors = [];
    this._encoding = encoding;
    this._doc = this.parser.parseFromString(xml) as DocumentImpl;
    if (this.errors.length || (this._warnError && this.warnings.length)) {
      throw new Error('Failed to parse the given XML');
    }
    return this;
  }

  toString(options?: FormatOptions): string {
    const xml = this.doc.toString();
    const opts = Object.assign({
      pretty: true,
      minify: false,
      preserveComments: false,
    }, options);
    if (opts.minify) {
      return pd.xmlmin(xml, opts.preserveComments);
    }
    // noinspection TypeScriptValidateJSTypes
    return pd.xml(xml);
  }

  removeEmptyTextNodes(node: NodeImpl): XML {
    if (!node.hasChildNodes()) return this;
    let idx = 0;
    let child: NodeImpl;
    while ((child = node.childNodes[idx])) {
      if (XML.isText(child)) {
        if (child.textContent && child.textContent.trim()) {
          idx++;
          continue;
        }
        child.parentNode.removeChild(child);
      } else if (XML.isElement(child)) {
        this.removeEmptyTextNodes(child);
        idx++;
      }
    }
    return this;
  }

  trimTextContents(node: NodeImpl): XML {
    if (!node.hasChildNodes()) return this;
    for (const child of node.childNodes) {
      if (XML.isText(child)) {
        const txt = child.textContent && child.textContent.trim();
        child.textContent = txt;
        child.data = txt!;
      } else if (XML.isElement(child)) {
        this.trimTextContents(child);
      }
    }
    return this;
  }

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

  lookupPrefix(uri: string | null, node?: NodeImpl): string | null {
    if (!uri) return null;
    let anchor = node || this.root!;
    do {
      const prefix = anchor.lookupPrefix(uri);
      if (prefix) return prefix;
    } while ((anchor = anchor.parentNode));
    return null;
  }

  addNamespace(prefix: string, uri: string, node?: ElementImpl) {
    if (!prefix || !uri) return;
    const n = node || this.root!;
    n._nsMap[prefix] = uri;
    n.setAttribute(`xmlns:${prefix}`, uri);
  }

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

  protected async loadFile(path: string): Promise<DocumentImpl> {
    return new Promise((resolve, reject) => {
      this.determineEncoding(path)
        .then(([encoding, buf]) => {
          const xml = iconv.decode(buf, encoding);
          this._doc = this.parser.parseFromString(xml) as DocumentImpl;
          if (this.errors.length || (this._warnError && this.warnings.length)) {
            reject(new Error('Failed to parse the given XML'));
            return;
          }
          resolve(this._doc);
        })
        .catch(r => reject(r));
    });
  }

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
}
