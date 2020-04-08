import {NodeImpl} from 'xmldom-ts';
import {Diff, XML} from '..';

export default abstract class Exception extends Error {
  static readonly ErrorNamespace = 'urn:ietf:params:xml:ns:patch-ops-error';

  static readonly ErrorPrefix = 'err';

  // region Messages
  static ErrDirective = 'A patch directive could not be fulfilled'
                        + ' because the given directives were not'
                        + ' understood.';

  static ErrMultipleMatches = 'Multiple matches found.';

  static ErrNodeType = 'Invalid node type';

  static ErrNoMatch = 'No match found.';

  static ErrPrefix = 'The namespace URI for the given prefix could not be'
                     + ' located or resolved.';

  static ErrPrefixUsed = 'The given prefix is being used.';

  static ErrRoot = 'The root element of the document cannot be removed or'
                   + ' another sibling element for the document root'
                   + ' element cannot be added.';

  static ErrSelAttribute = 'Invalid XPath expression by `sel`.';

  static ErrSelEmpty = '`sel` cannot be empty.';

  static ErrSelMissing = 'Missing `sel` attribute.';

  static ErrType = 'Invalid type.';

  static ErrWsAttribute = '`ws` is not allowed in attribute operation.';

  static ErrWsTextNode = '`ws` is not allowed in text node operation.';

  static ErrWsAfter = 'No whitespace node found after target';

  static ErrWsBefore = 'No whitespace node found before target';

  static ErrXML = 'Invalid XML.';
  // endregion

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
