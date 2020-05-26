# XML Patch

[![master build](https://img.shields.io/travis/com/eidng8/xml-patch?color=333&logo=travis)](https://travis-ci.com/eidng8/xml-patch) [![vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/eidng8/xml-patch?color=333&logo=snyk)](https://snyk.io/test/github/eidng8/xml-patch?targetFile=package.json) [![maintainability](https://img.shields.io/codeclimate/maintainability/eidng8/xml-patch?color=333&logo=code-climate)](https://codeclimate.com/github/eidng8/xml-patch/maintainability) [![master coverage](https://img.shields.io/coveralls/github/eidng8/xml-patch/master?color=333&logo=coveralls)](https://coveralls.io/github/eidng8/xml-patch?branch=master) [![dev build](https://img.shields.io/travis/com/eidng8/xml-patch/dev?color=333&label=dev%20build&logo=travis)](https://travis-ci.com/eidng8/xml-patch/tree/dev) [![dev coverage](https://img.shields.io/coveralls/github/eidng8/xml-patch/dev?color=333&label=dev%20coverage&logo=coveralls)](https://coveralls.io/github/eidng8/xml-patch?branch=dev)

This library provides functionalities to apply XML patch. It is supposed to be [RFC 5261](https://tools.ietf.org/html/rfc5261) compliant. Documentation can be found in source code, and [online](https://eidng8.github.io/xml-patch/index.html).

Command line tool can be found [here](https://github.com/eidng8/xml-patch-cli).

## Known issues

1. It is tested with some commonly used XPath queries. However, XPath could be written in complexity beyond the capability of this library. In such circumstances, this library could raise error, or in worse scenarios it may behave unexpected.

2. Due to various reasons, there are a few errors defined in the RFC document, which will not be thrown at all. It doesn't mean those errors won't exist in XML documents, it's just they couldn't be detected by this library, or is interpreted differently and translated into other errors. These errors are:

   - InvalidNamespaceURI (<invalid-namespace-uri>)
   - InvalidPrologOperation (<invalid-prolog-operation>)
   - UnsupportedIdFunction (<unsupported-id-function>)
   - UnsupportedXmlId (<unsupported-xml-id>)

3. This package uses webpack. Just in case anyone gets curious, don't fire up `tsc`. It keeps complaining about `xmldom-ts`.

## How to use

#### Installation

```bash
npm i -S g8-xml-patch
```

> There is a companion CLI package too: [xml-patch-cli](https://github.com/eidng8/xml-patch-cli)

#### JavaScript

```js
const XmlPatch = require('g8-xml-patch');

console.log(
  'This document: <a><b/></a> will be patched to:\n',
  new XmlPatch.Patch('<diff><add sel="a/b"><c/></add></diff>')
    .apply('<a><b/></a>')
    .toString(),
);

try {
  new XmlPatch.Patch().load('<diff><b/></diff>');
} catch (ex) {
  console.log('\nAnd here comes the expected error:\n', ex.toString());
}
```

#### TypeScript

```ts
import { Patch } from 'g8-xml-patch';

console.log(
  'This document: <a><b/></a> will be patched to:\n',
  new Patch()
    .load('<diff><add sel="a/b"><c/></add></diff>')
    .apply('<a><b/></a>')
    .toString(),
);

try {
  new Patch('<diff><b/></diff>');
} catch (ex) {
  console.log('\nAnd here comes the expected error:\n', ex.toString());
}
```

## Deviations from RFC 5261

This library provides a mechanism to suppress exception throwing. One can define a callback function to handle suppressed exceptions.

### Suppressing exceptions

##### `ignoreExceptions(...exceptions:{new():Exception}[] | {new():Exception}[][])`

The `ignoreExceptions()` global function accepts a list of exceptions to be suppressed. Please note that exceptions that were not listed in the call will **_not_** be suppressed. Once suppressed, the corresponding error will be ignored, and the process of related operation **_may or may not_** go as usual depending on the nature of the error.

- If the error is crucial to the process or the RFC description, related process will be skipped for the occurring target node or action directive.
- If the error is not crucial, or RFC doesn't provide a clear definition, related process will be performed.

##### `dontIgnoreExceptions()`

The `dontIgnoreExceptions()` global function simply cancels all suppression from the point of invocation forward.

### Handling suppressed exceptions

##### `setExceptionHandler(handler:ExceptionHandler)`

The `setExceptionHandler()` global function accepts a callback function, which will be invoked when error occurs and **_were suppressed_**. The callback will be invoked with the exception that would have been thrown if weren't suppressed. However, the return value of the callback function will be ignored. There will be no way for the callback function to affect the flow of process, except throwing an error to break the program.

### Side effects of exception suppression

As mentioned above, the flow of program may or may not go as usual when errors occur and were suppressed. The behavior introduces a number of side effects, and deviates from the original RFC document.

- When `InvalidNodeTypes` (`<invalid-node-types>`) is suppressed, it will be possible to replace a target node with multiple nodes.
- When `UnlocatedNode` (`<unlocated-node>`) is suppressed,
  - it will be possible to target multiple nodes with the `sel` attribute.
  - `sel` may yield no match, so the directive will have no effect
- Combining the above two cases, it will be possible to target multiple nodes, and operate with the same set of nodes provided by a single directive.
- When `InvalidWhitespaceDirective` (`<invalid-whitespace-directive>`) is suppressed, directives with `ws` attribute will only remove white space nodes whenever applicable.
- When `InvalidNodeTypes` (`<invalid-node-types>`) is suppressed, it will be possible to replace nodes with different types. Say, replacing an element node with text node.

Please note that the above list is not exhaustive. There may be other side effects haven't been defined or noticed yet.

## Messages translations

All messages provided in this library can be localized by simply assigning new values to class variables of `Exception`. These messages all start with the `Err` prefix in their names.

There are samples of translations of two written scripts of Chinese. These samples are provided in TypeScript forms, and their final JavaScript forms.

#### `/translations`

The two translations here are to demonstrate the final form that will be part of this library's distribution. So in case any of you are interested in contributing to this library, this is the place to submit your translations. To use these translations, simply require it after the main import.

```js
const XmlPatch = require('g8-xml-patch');

// must load after xml-patch
require('g8-xml-patch/translations/zh_chs');

// or load your own translation .js file
require('./path/to/your/translation');

// do your stuff.
```

#### `/src/translations`

The two translations here are to demonstrate how you can write your own ad-hoc translations in source tree. Please don't use the two files in this directory directly in your code.

To use these translations, simply:

```ts
import { Patch } from 'g8-xml-patch';

// you can use the js version just the same way
require('g8-xml-patch/translations/zh_cht');

// or make and load your own translation .ts file
import './path/to/your/translation';

// do your stuff.
```

Here's a snipped version of source code:

```ts
import { Exception } from 'g8-xml-patch';

Exception.ErrDirective = 'Your take on this';

Exception.ErrEncoding = 'Just translate it already';

// ... more translation go on ...
```

## Test data set

There are some XML files in the `tests/data` directory, which are used for unit testing. They mainly come from two sources:

1. Samples from the [RFC 5261](https://tools.ietf.org/html/rfc5261) document.
2. Samples from the [diffxml](http://diffxml.sourceforge.net/) project.
