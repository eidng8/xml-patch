/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { DocumentImpl, NodeImpl } from 'xmldom-ts';
import XmlWrapper from '../xml/xml-wrapper';
import Diff from '../diff';

/**
 * XML patch exception base class
 */
export default abstract class Exception extends Error {
  static readonly ErrorNamespace = 'urn:ietf:params:xml:ns:patch-ops-error';

  static readonly ErrorPrefix = 'err';

  // region Messages
  static ErrDirective =
    'A patch directive could not be fulfilled' +
    ' because the given directives were not' +
    ' understood.';

  static ErrEncoding = 'Encodings of the two documents do not match.';

  static ErrFunction =
    'The nodeset function id() is not supported, and thus' +
    ' attributes with the ID type are not known.';

  static ErrID =
    'The attribute xml:id as an ID attribute in XML documents is' +
    ' not supported.';

  static ErrMultipleMatches = 'Multiple matches found.';

  static ErrNamespaceURI =
    'The namespace URI value is not valid or the' +
    ' target document did not have this declaration.';

  static ErrNodeTypeText = 'This is expected to be a text node';

  static ErrNodeTypeMismatch = 'Type of the given node should match the target';

  static ErrNoMatch = 'No match found.';

  static ErrPrefix =
    'The namespace URI for the given prefix could not be' +
    ' located or resolved.';

  static ErrPrefixUsed = 'The given prefix is being used.';

  static ErrProlog = 'Patch failure related to XML prolog nodes.';

  static ErrRoot =
    'The root element of the document cannot be removed or' +
    ' another sibling element for the document root' +
    ' element cannot be added.';

  static ErrSelEmpty = '`sel` cannot be empty.';

  static ErrSelMissing = 'Missing `sel` attribute.';

  static ErrType = 'Invalid type.';

  static ErrWsAttribute = '`ws` is not allowed in attribute operation.';

  static ErrWsTextNode = '`ws` is not allowed in text node operation.';

  static ErrWsAfter = 'No whitespace node found after target';

  static ErrWsBefore = 'No whitespace node found before target';

  static ErrXML = 'Invalid XML.';
  // endregion

  /**
   * The action that caused error
   */
  action?: NodeImpl;

  // The error XML document
  protected xml!: XmlWrapper;

  // tag name of the actual error
  protected abstract tag: string;

  constructor(message?: string, action?: NodeImpl) {
    super(message);
    this.action = action;
  }

  public toString(): string {
    this.createRootNode();
    this.xml.root!.appendChild(this.createErrorNode());
    return this.xml.toString({ pretty: true, preserveComments: true });
  }

  public toLocaleString(): string {
    return this.toString();
  }

  /**
   * Creates the actual error node
   */
  public createErrorNode(doc?: DocumentImpl) {
    const elem = (doc || this.xml.doc).createElementNS(
      Exception.ErrorNamespace,
      this.qualifyName(`${this.tag}`),
    );
    if (this.message) {
      elem.setAttribute('phrase', this.message);
    }
    if (this.action) {
      elem.appendChild(this.xml.doc.importNode(this.action, true));
    }
    return elem;
  }

  /**
   * Qualifies the given local name with error namespace.
   * @param name
   */
  protected qualifyName(name: string) {
    return `${Exception.ErrorPrefix}:${name}`;
  }

  protected createRootNode() {
    this.xml = new XmlWrapper()
      .fromString(`<?xml version="1.0" encoding="utf-8"?>
<${Exception.ErrorPrefix}:patch-ops-error
    xmlns:${Exception.ErrorPrefix}="${Exception.ErrorNamespace}"
    xmlns="${Diff.DiffNamespace}"/>`);
    return this.xml.root!;
  }
}
