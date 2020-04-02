import {NodeImpl} from 'xmldom-ts';
import {Diff, XML} from '..';

export default abstract class Exception extends Error {
  static readonly ErrorNamespace = 'urn:ietf:params:xml:ns:patch-ops-error';

  static readonly ErrorPrefix = 'err';

  action?: NodeImpl;

  protected xml!: XML;

  protected abstract tag: string;

  constructor(message?: string, action?: NodeImpl) {
    super(message);
    this.action = action;
  }

  public toString(): string {
    this.xml = new XML().fromString(`<?xml version="1.0" encoding="utf-8"?>
<${Exception.ErrorPrefix}:patch-ops-error
    xmlns:${Exception.ErrorPrefix}="${Exception.ErrorNamespace}"
    xmlns="${Diff.DiffNamespace}"></${Exception.ErrorPrefix}:patch-ops-error>`);
    this.xml.root!.appendChild(this.createErrorNode());
    return this.xml.toString({pretty: true, preserveComments: true});
  }

  public toLocaleString(): string {
    return this.toString();
  }

  protected qualifyName(name: string) {
    return `${Exception.ErrorPrefix}:${name}`;
  }

  protected createErrorNode() {
    const elem = this.xml.doc.createElementNS(
      Exception.ErrorNamespace,
      this.qualifyName(`${this.tag}`),
    );
    if (this.message) {
      elem.setAttribute('phrase', this.message);
    }
    if (this.action) {
      elem.appendChild((this.xml.doc.importNode(this.action, true)));
    }
    return elem;
  }
}
