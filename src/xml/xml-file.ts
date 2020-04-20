/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { existsSync, readFile } from 'fs';
import { DocumentImpl } from 'xmldom-ts';
import iconv from 'iconv-lite';
import XmlWrapper from './xml-wrapper';
import XmlFileOptions from './xml-file-options';

/**
 * A wrapper over {@link https://www.npmjs.com/package/xmldom-ts|xmldom-ts}.
 * This class handles encoding while reading from files.
 */
export default class XmlFile extends XmlWrapper {
  /**
   * The file system mock to be used
   */
  protected _fsMock?: any;

  constructor(options: XmlFileOptions = {}) {
    super(options);
    this._fsMock = options.fsMock;
  }

  /**
   * Load XML from the given file
   * @param path
   */
  async fromFile(path: string): Promise<XmlFile> {
    return new Promise((resolve, reject) => {
      if (!existsSync(path)) {
        reject(new Error(`File doesn't exist: ${path}`));
        return;
      }
      this.loadFile(path)
        .then(() => resolve(this))
        .catch(r => reject(r));
    });
  }

  /**
   * Tries to determine the proper encoding of the file, by the first
   * processing instruction. Uses default encoding if none were found.
   * @param path
   */
  async determineEncoding(path: string): Promise<[string, Buffer]> {
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
  async loadFile(path: string): Promise<DocumentImpl> {
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
  async readFile(path: string): Promise<Buffer> {
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
