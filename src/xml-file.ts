import {existsSync, readFile} from 'fs';
import {DocumentImpl, DOMParserImpl, XMLSerializerImpl} from 'xmldom-ts';
import iconv from 'iconv-lite';

const pd = require('pretty-data').pd;

export interface XMLFileOptions {
  defaultEncoding?: string;

  warnError?: boolean;

  fsMock?: any;
}

export class XMLFile {
  protected _defaultEncoding: string;

  protected _doc!: DocumentImpl;

  protected _encoding!: string;

  protected _warnings!: string[];

  protected _errors!: string[];

  protected _warnError: boolean;

  protected _fsMock?: any;

  get encoding(): string {
    return this._encoding;
  }

  get doc(): DocumentImpl {
    return this._doc;
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

  async fromFile(path: string): Promise<XMLFile> {
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

  fromString(xml: string, encoding = 'utf-8'): XMLFile {
    this._warnings = [];
    this._errors = [];
    this._encoding = encoding;
    this._doc = this.parser.parseFromString(xml) as DocumentImpl;
    if (this.errors.length || (this._warnError && this.warnings.length)) {
      throw new Error('Failed to parse the given XML');
    }
    return this;
  }

  toString(minify = false, preserveComments = false): string {
    const xml = new XMLSerializerImpl().serializeToString(this.doc);
    if (minify) {
      return pd.xmlmin(xml, preserveComments);
    }
    return pd.xml(xml);
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
