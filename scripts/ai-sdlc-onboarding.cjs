#!/usr/bin/env node
"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/yaml/dist/nodes/identity.js"(exports2) {
    "use strict";
    var ALIAS = Symbol.for("yaml.alias");
    var DOC = Symbol.for("yaml.document");
    var MAP = Symbol.for("yaml.map");
    var PAIR = Symbol.for("yaml.pair");
    var SCALAR = Symbol.for("yaml.scalar");
    var SEQ = Symbol.for("yaml.seq");
    var NODE_TYPE = Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports2.ALIAS = ALIAS;
    exports2.DOC = DOC;
    exports2.MAP = MAP;
    exports2.NODE_TYPE = NODE_TYPE;
    exports2.PAIR = PAIR;
    exports2.SCALAR = SCALAR;
    exports2.SEQ = SEQ;
    exports2.hasAnchor = hasAnchor;
    exports2.isAlias = isAlias;
    exports2.isCollection = isCollection;
    exports2.isDocument = isDocument;
    exports2.isMap = isMap;
    exports2.isNode = isNode;
    exports2.isPair = isPair;
    exports2.isScalar = isScalar;
    exports2.isSeq = isSeq;
  }
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/yaml/dist/visit.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var BREAK = Symbol("break visit");
    var SKIP = Symbol("skip children");
    var REMOVE = Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path2) {
      const ctrl = callVisitor(key, node, visitor, path2);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path2, ctrl);
        return visit_(key, ctrl, visitor, path2);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path2 = Object.freeze(path2.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path2);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path2 = Object.freeze(path2.concat(node));
          const ck = visit_("key", node.key, visitor, path2);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path2);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path2) {
      const ctrl = await callVisitor(key, node, visitor, path2);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path2, ctrl);
        return visitAsync_(key, ctrl, visitor, path2);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path2 = Object.freeze(path2.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path2);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path2 = Object.freeze(path2.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path2);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path2);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path2) {
      if (typeof visitor === "function")
        return visitor(key, node, path2);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path2);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path2);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path2);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path2);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path2);
      return void 0;
    }
    function replaceNode(key, path2, node) {
      const parent = path2[path2.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports2.visit = visit;
    exports2.visitAsync = visitAsync;
  }
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/yaml/dist/doc/directives.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports2.Directives = Directives;
  }
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/yaml/dist/doc/anchors.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports2.anchorIsValid = anchorIsValid;
    exports2.anchorNames = anchorNames;
    exports2.createNodeAnchors = createNodeAnchors;
    exports2.findNewAnchor = findNewAnchor;
  }
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/yaml/dist/doc/applyReviver.js"(exports2) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports2.applyReviver = applyReviver;
  }
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/yaml/dist/nodes/toJS.js"(exports2) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports2.toJS = toJS;
  }
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/yaml/dist/nodes/Node.js"(exports2) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports2.NodeBase = NodeBase;
  }
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/yaml/dist/nodes/Alias.js"(exports2) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        if (found && ctx) {
          const { anchors: anchors2, doc: doc2, maxAliasCount } = ctx;
          let data = anchors2.get(found);
          if (!data) {
            toJS.toJS(found, null, ctx);
            data = anchors2.get(found);
          }
          if (data?.res === void 0) {
            const msg = "This should not happen: Alias anchor was not resolved?";
            throw new ReferenceError(msg);
          }
          if (maxAliasCount >= 0) {
            data.count += 1;
            if (data.aliasCount === 0)
              data.aliasCount = getAliasCount(doc2, found, anchors2);
            if (data.count * data.aliasCount > maxAliasCount) {
              const msg = "Excessive alias count indicates a resource exhaustion attack";
              throw new ReferenceError(msg);
            }
          }
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const source = this.resolve(ctx.doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        return ctx.anchors.get(source).res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports2.Alias = Alias;
  }
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/yaml/dist/nodes/Scalar.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports2.Scalar = Scalar;
    exports2.isScalarValue = isScalarValue;
  }
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/yaml/dist/doc/createNode.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports2.createNode = createNode;
  }
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/yaml/dist/nodes/Collection.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path2, value) {
      let v = value;
      for (let i = path2.length - 1; i >= 0; --i) {
        const k = path2[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path2) => path2 == null || typeof path2 === "object" && !!path2[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path2, value) {
        if (isEmptyPath(path2))
          this.add(value);
        else {
          const [key, ...rest] = path2;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path2) {
        const [key, ...rest] = path2;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path2, keepScalar) {
        const [key, ...rest] = path2;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path2) {
        const [key, ...rest] = path2;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path2, value) {
        const [key, ...rest] = path2;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports2.Collection = Collection;
    exports2.collectionFromPath = collectionFromPath;
    exports2.isEmptyPath = isEmptyPath;
  }
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyComment.js"(exports2) {
    "use strict";
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
    exports2.indentComment = indentComment;
    exports2.lineComment = lineComment;
    exports2.stringifyComment = stringifyComment;
  }
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/yaml/dist/stringify/foldFlowLines.js"(exports2) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text[++i];
        } else {
          do {
            ch = text[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text[start];
        }
      }
      return end;
    }
    exports2.FOLD_BLOCK = FOLD_BLOCK;
    exports2.FOLD_FLOW = FOLD_FLOW;
    exports2.FOLD_QUOTED = FOLD_QUOTED;
    exports2.foldFlowLines = foldFlowLines;
  }
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyString.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str += "\\x" + code.substr(2);
                    else
                      str += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str += "\n";
                  i += 2;
                }
                str += indent;
                if (json[i + 2] === " ")
                  str += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str = start ? str + json.slice(start) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports2.stringifyString = stringifyString;
  }
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/yaml/dist/stringify/stringify.js"(exports2) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports2.createStringifyContext = createStringifyContext;
    exports2.stringify = stringify;
  }
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyPair.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports2.stringifyPair = stringifyPair;
  }
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/yaml/dist/log.js"(exports2) {
    "use strict";
    var node_process = require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports2.debug = debug;
    exports2.warn = warn;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports2.addMergeToJSMap = addMergeToJSMap;
    exports2.isMergeKey = isMergeKey;
    exports2.merge = merge;
  }
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports2) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports2.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/yaml/dist/nodes/Pair.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports2.Pair = Pair;
    exports2.createPair = createPair;
  }
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyCollection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify2(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str2);
      }
      let str;
      if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
        if (i < items.length - 1) {
          str += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str += ",";
          }
        }
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines.push(str);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start;
          for (const line of lines)
            str += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports2.stringifyCollection = stringifyCollection;
  }
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLMap.js"(exports2) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports2.YAMLMap = YAMLMap;
    exports2.findPair = findPair;
  }
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/yaml/dist/schema/common/map.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports2.map = map;
  }
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLSeq.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports2.YAMLSeq = YAMLSeq;
  }
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/yaml/dist/schema/common/seq.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports2.seq = seq;
  }
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/yaml/dist/schema/common/string.js"(exports2) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports2.string = string;
  }
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/yaml/dist/schema/common/null.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports2.nullTag = nullTag;
  }
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/yaml/dist/schema/core/bool.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports2.boolTag = boolTag;
  }
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyNumber.js"(exports2) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports2.stringifyNumber = stringifyNumber;
  }
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/yaml/dist/schema/core/float.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node.minFractionDigits = str.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports2.float = float;
    exports2.floatExp = floatExp;
    exports2.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/yaml/dist/schema/core/int.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports2.int = int;
    exports2.intHex = intHex;
    exports2.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/yaml/dist/schema/core/schema.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/yaml/dist/schema/json/schema.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports2) {
    "use strict";
    var node_buffer = require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i = 0; i < str.length; ++i)
            buffer[i] = str.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str.substr(o, lineWidth);
          }
          str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports2.binary = binary;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports2.createPairs = createPairs;
    exports2.pairs = pairs;
    exports2.resolvePairs = resolvePairs;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports2.YAMLOMap = YAMLOMap;
    exports2.omap = omap;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports2.falseTag = falseTag;
    exports2.trueTag = trueTag;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f = str.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports2.float = float;
    exports2.floatExp = floatExp;
    exports2.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n2 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports2.int = int;
    exports2.intBin = intBin;
    exports2.intHex = intHex;
    exports2.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports2.YAMLSet = YAMLSet;
    exports2.set = set;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports2.floatTime = floatTime;
    exports2.intTime = intTime;
    exports2.timestamp = timestamp;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/yaml/dist/schema/tags.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports2.coreKnownTags = coreKnownTags;
    exports2.getTags = getTags;
  }
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/yaml/dist/schema/Schema.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports2.Schema = Schema;
  }
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyDocument.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports2.stringifyDocument = stringifyDocument;
  }
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/yaml/dist/doc/Document.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path2, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path2, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path2) {
        if (Collection.isEmptyPath(path2)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path2) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path2, keepScalar) {
        if (Collection.isEmptyPath(path2))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path2, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path2) {
        if (Collection.isEmptyPath(path2))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path2) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path2, value) {
        if (Collection.isEmptyPath(path2)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path2), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path2, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports2.Document = Document;
  }
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/yaml/dist/errors.js"(exports2) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports2.YAMLError = YAMLError;
    exports2.YAMLParseError = YAMLParseError;
    exports2.YAMLWarning = YAMLWarning;
    exports2.prettifyError = prettifyError;
  }
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/yaml/dist/compose/resolve-props.js"(exports2) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports2.resolveProps = resolveProps;
  }
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/yaml/dist/compose/util-contains-newline.js"(exports2) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports2.containsNewline = containsNewline;
  }
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports2) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports2.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/yaml/dist/compose/util-map-includes.js"(exports2) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports2.mapIncludes = mapIncludes;
  }
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-map.js"(exports2) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports2.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-seq.js"(exports2) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports2.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/yaml/dist/compose/resolve-end.js"(exports2) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep + cb;
              sep = "";
              break;
            }
            case "newline":
              if (comment)
                sep += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports2.resolveEnd = resolveEnd;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep)
                for (const st of sep) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports2.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/yaml/dist/compose/compose-collection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports2.composeCollection = composeCollection;
  }
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep === " ")
            sep = "\n";
          else if (!prevMoreIndented && sep === "\n")
            sep = "\n\n";
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep === "\n")
            value += "\n";
          else
            sep = "\n";
        } else {
          value += sep + content;
          sep = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports2.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return unfoldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function unfoldLines(source) {
      const line = /(.*?)\r?\n/sy;
      let match = line.exec(source);
      if (!match)
        return source;
      let trimEnd, trimBoth;
      try {
        trimEnd = new RegExp("(?<![ 	])[ 	]+$");
        trimBoth = new RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
      } catch {
        trimEnd = /[ \t]+$/;
        trimBoth = /^[ \t]+|[ \t]+$/g;
      }
      let res = match[1].replace(trimEnd, "");
      let sep = " ";
      let pos = line.lastIndex;
      while (match = line.exec(source)) {
        const lm = match[1].replace(trimBoth, "");
        if (lm === "") {
          if (sep === "\n")
            res += sep;
          else
            sep = "\n";
        } else {
          res += sep + lm;
          sep = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports2.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/yaml/dist/compose/compose-scalar.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports2.composeScalar = composeScalar;
  }
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports2) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports2.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/yaml/dist/compose/compose-node.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports2.composeEmptyNode = composeEmptyNode;
    exports2.composeNode = composeNode;
  }
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/yaml/dist/compose/compose-doc.js"(exports2) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports2.composeDoc = composeDoc;
  }
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/yaml/dist/compose/composer.js"(exports2) {
    "use strict";
    var node_process = require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports2.Composer = Composer;
  }
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/yaml/dist/parse/cst-scalar.js"(exports2) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports2.createScalarToken = createScalarToken;
    exports2.resolveAsScalar = resolveAsScalar;
    exports2.setScalarValue = setScalarValue;
  }
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/yaml/dist/parse/cst-stringify.js"(exports2) {
    "use strict";
    var stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep)
        for (const st of sep)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports2.stringify = stringify;
  }
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/yaml/dist/parse/cst-visit.js"(exports2) {
    "use strict";
    var BREAK = Symbol("break visit");
    var SKIP = Symbol("skip children");
    var REMOVE = Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path2) => {
      let item = cst;
      for (const [field, index] of path2) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path2) => {
      const parent = visit.itemAtPath(cst, path2.slice(0, -1));
      const field = path2[path2.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path2, item, visitor) {
      let ctrl = visitor(item, path2);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path2.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path2);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path2) : ctrl;
    }
    exports2.visit = visit;
  }
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/yaml/dist/parse/cst.js"(exports2) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports2.createScalarToken = cstScalar.createScalarToken;
    exports2.resolveAsScalar = cstScalar.resolveAsScalar;
    exports2.setScalarValue = cstScalar.setScalarValue;
    exports2.stringify = cstStringify.stringify;
    exports2.visit = cstVisit.visit;
    exports2.BOM = BOM;
    exports2.DOCUMENT = DOCUMENT;
    exports2.FLOW_END = FLOW_END;
    exports2.SCALAR = SCALAR;
    exports2.isCollection = isCollection;
    exports2.isScalar = isScalar;
    exports2.prettyToken = prettyToken;
    exports2.tokenType = tokenType;
  }
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/yaml/dist/parse/lexer.js"(exports2) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports2.Lexer = Lexer;
  }
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/yaml/dist/parse/line-counter.js"(exports2) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports2.LineCounter = LineCounter;
  }
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/yaml/dist/parse/parser.js"(exports2) {
    "use strict";
    var node_process = require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep;
          if (scalar.end) {
            sep = scalar.end;
            sep.push(this.sourceToken);
            delete scalar.end;
          } else
            sep = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep = it.sep;
                  sep.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs2 = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs2, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs2);
              } else {
                Object.assign(it, { key: fs2, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs2 = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs2, sep: [] });
              else if (it.sep)
                this.stack.push(fs2);
              else
                Object.assign(it, { key: fs2, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep = fc.end.splice(1, fc.end.length);
            sep.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports2.Parser = Parser;
  }
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/yaml/dist/public-api.js"(exports2) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports2.parse = parse;
    exports2.parseAllDocuments = parseAllDocuments;
    exports2.parseDocument = parseDocument;
    exports2.stringify = stringify;
  }
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/yaml/dist/index.js"(exports2) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports2.Composer = composer.Composer;
    exports2.Document = Document.Document;
    exports2.Schema = Schema.Schema;
    exports2.YAMLError = errors.YAMLError;
    exports2.YAMLParseError = errors.YAMLParseError;
    exports2.YAMLWarning = errors.YAMLWarning;
    exports2.Alias = Alias.Alias;
    exports2.isAlias = identity.isAlias;
    exports2.isCollection = identity.isCollection;
    exports2.isDocument = identity.isDocument;
    exports2.isMap = identity.isMap;
    exports2.isNode = identity.isNode;
    exports2.isPair = identity.isPair;
    exports2.isScalar = identity.isScalar;
    exports2.isSeq = identity.isSeq;
    exports2.Pair = Pair.Pair;
    exports2.Scalar = Scalar.Scalar;
    exports2.YAMLMap = YAMLMap.YAMLMap;
    exports2.YAMLSeq = YAMLSeq.YAMLSeq;
    exports2.CST = cst;
    exports2.Lexer = lexer.Lexer;
    exports2.LineCounter = lineCounter.LineCounter;
    exports2.Parser = parser.Parser;
    exports2.parse = publicApi.parse;
    exports2.parseAllDocuments = publicApi.parseAllDocuments;
    exports2.parseDocument = publicApi.parseDocument;
    exports2.stringify = publicApi.stringify;
    exports2.visit = visit.visit;
    exports2.visitAsync = visit.visitAsync;
  }
});

// src/catalog.js
var require_catalog = __commonJS({
  "src/catalog.js"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var path2 = require("path");
    var YAML = require_dist();
    function combineApplies(a, b) {
      if (a && b) return { type: "all", of: [a, b] };
      return a || b || null;
    }
    function normCheck(c, section, group, groupDef) {
      return Object.assign({
        level: section.level,
        tier: "script",
        scope: "repo",
        stack: ["any"],
        since: "0.1.0",
        soft: false,
        why: "",
        fix: ""
      }, c, {
        section: section.key,
        group: group || null,
        setup: groupDef && groupDef.setup || null,
        applies: combineApplies(groupDef && groupDef.applies, c.applies)
      });
    }
    function mcpChecks(g) {
      const label = g.title;
      const slug = g.slug;
      const configured = { type: "custom", name: "mcp-server", match: g.match, require: "present" };
      return [
        {
          slug: `${slug}-configured`,
          title: `${label} is configured in the project MCP config`,
          why: `Everyone working on this project needs the same ${label} connection, defined in a committed project-level file.`,
          detect: configured,
          fix: `Add a server for ${label} to the project MCP config (Cursor: .cursor/mcp.json, Claude Code: .mcp.json) and commit it.
Use environment-variable references for credentials, never literal values.
Setup guide: {{skill_dir}}/${g.setup}`
        },
        {
          slug: `${slug}-env-declared`,
          title: `${label} environment variables are declared`,
          why: "A new machine cannot connect if nobody knows which variables the MCP server needs.",
          applies: configured,
          detect: { type: "custom", name: "mcp-server", match: g.match, require: "env-declared" },
          fix: `List every environment variable referenced by the ${label} server config in .env.example (names only, no values).`
        },
        {
          slug: `${slug}-env-set`,
          title: `${label} environment variables are set on this machine`,
          why: "The MCP server cannot start without its variables.",
          scope: "local",
          applies: configured,
          detect: { type: "custom", name: "mcp-env-set", match: g.match },
          fix: `Set the missing variables in your shell or in an uncommitted .env file. Setup guide: {{skill_dir}}/${g.setup}`
        },
        {
          slug: `${slug}-authenticated`,
          title: `${label} connection works and is authenticated`,
          why: "Configured is not the same as working: tokens expire and logins differ per person.",
          scope: "local",
          tier: "chat",
          applies: configured,
          chat_note: `Validate in chat: confirm the ${label} tools are available in this session and make one harmless read-only call.`,
          fix: `Authenticate the ${label} MCP server in your AI tool (setup guide: {{skill_dir}}/${g.setup}), then re-run the chat audit.`
        }
      ];
    }
    function projectMcpChecks(name, entry) {
      const label = entry.description || name;
      const match = entry.match || name;
      const g = { slug: `project-mcp-${name}`, title: label, match, setup: "references/integrations/project-mcp.md" };
      return mcpChecks(g).map((c) => {
        return c;
      });
    }
    function loadCatalog2(skillDir) {
      const doc = YAML.parse(fs2.readFileSync(path2.join(skillDir, "references", "catalog.yaml"), "utf8"));
      const sections = [];
      const checks = [];
      const items = [];
      const skills = [];
      const mcpCategories = [];
      const mcpProviders = [];
      for (const [key, sec] of Object.entries(doc.sections || {})) {
        const section = { key, title: sec.title || key, description: sec.description || "", level: sec.level || "must", kind: sec.skills ? "skills" : "checks" };
        sections.push(section);
        if (sec.skills) {
          for (const s of sec.skills) {
            skills.push(Object.assign({ stack: ["any"], kind: "skill", group: "General", onboarding: false }, s, { section: key }));
          }
          continue;
        }
        if (sec.mcp_categories) {
          for (const [catKey, cat] of Object.entries(sec.mcp_categories)) {
            const category = {
              key: catKey,
              title: cat.title || catKey,
              description: cat.description || "",
              defaultOff: cat.default_off_unless_stack || null,
              providers: []
            };
            for (const p of cat.providers || []) {
              const provider = {
                key: p.key,
                slug: p.slug || p.key,
                title: p.title || p.key,
                description: p.description || "",
                match: p.match || p.key,
                setup: p.setup || null,
                category: catKey,
                stack: p.stack || ["any"],
                template: p.template || null
              };
              category.providers.push(provider);
              mcpProviders.push(provider);
              const groupDef = {
                slug: provider.slug,
                title: provider.title,
                description: provider.description,
                setup: provider.setup,
                match: provider.match,
                applies: p.applies || null,
                stack: provider.stack
              };
              const defs = [];
              if (p.template === "mcp") defs.push(...mcpChecks(groupDef));
              defs.push(...p.checks || []);
              const normed = defs.map((c) => normCheck(c, section, provider.slug, groupDef));
              checks.push(...normed);
              items.push({
                slug: provider.slug,
                key: provider.key,
                title: provider.title,
                description: provider.description,
                section: key,
                category: catKey,
                stack: provider.stack,
                checks: normed.map((c) => c.slug),
                setup: provider.setup,
                kind: "mcp-provider",
                mcp: true
              });
            }
            mcpCategories.push(category);
          }
        }
        for (const c of sec.checks || []) {
          const check = normCheck(c, section, section.level === "optional" ? c.slug : null, null);
          checks.push(check);
          if (section.level === "optional") {
            items.push({ slug: c.slug, title: c.title, description: c.why, section: key, stack: c.stack || ["any"], checks: [c.slug], kind: "check" });
          }
        }
        for (const g of sec.groups || []) {
          const defs = [];
          if (g.template === "mcp") defs.push(...mcpChecks(g));
          defs.push(...g.checks || []);
          const normed = defs.map((c) => normCheck(c, section, g.slug, g));
          checks.push(...normed);
          items.push({
            slug: g.slug,
            key: g.key || g.slug,
            title: g.title,
            description: g.description,
            section: key,
            stack: g.stack || ["any"],
            checks: normed.map((c) => c.slug),
            setup: g.setup || null,
            kind: "group"
          });
        }
      }
      const seen = /* @__PURE__ */ new Map();
      const claim = (slug, what) => {
        if (seen.has(slug) && !(seen.get(slug) === "check" && what === "item-check")) throw new Error(`Duplicate slug in catalog: ${slug}`);
        seen.set(slug, what);
      };
      for (const c of checks) claim(c.slug, "check");
      for (const i of items) if (i.kind === "group" || i.kind === "mcp-provider") claim(i.slug, i.kind);
      for (const s of skills) claim(s.slug, "skill");
      return { version: doc.version || 1, sections, checks, items, skills, mcpCategories, mcpProviders, projectMcpChecks };
    }
    module2.exports = { loadCatalog: loadCatalog2, projectMcpChecks, mcpChecks };
  }
});

// src/stack.js
var require_stack = __commonJS({
  "src/stack.js"(exports2, module2) {
    "use strict";
    var KNOWN_STACK = ["node", "typescript", "react", "python", "django"];
    function detectStack2(repo) {
      const tags = /* @__PURE__ */ new Set();
      const pkg = repo.json("package.json");
      if (pkg) {
        tags.add("node");
        const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies, pkg.peerDependencies);
        if (deps.react || deps["react-dom"] || deps.next) tags.add("react");
        if (deps.typescript || repo.match(["tsconfig.json", "tsconfig.*.json"]).length) tags.add("typescript");
      }
      if (repo.match(["pyproject.toml", "requirements*.txt", "Pipfile", "setup.py", "setup.cfg", "manage.py"]).length) tags.add("python");
      if (repo.match(["manage.py"]).length || repo.hasDep(["django", "Django"])) {
        tags.add("django");
        tags.add("python");
      }
      return [...tags];
    }
    module2.exports = { KNOWN_STACK, detectStack: detectStack2 };
  }
});

// src/tools.js
var require_tools = __commonJS({
  "src/tools.js"(exports2, module2) {
    "use strict";
    var TOOLS = {
      cursor: {
        label: "Cursor",
        repoSkillDirs: [".cursor/skills", ".cursor/rules"],
        userSkillDirs: [".cursor/skills", ".cursor/rules"],
        mcpFiles: [".cursor/mcp.json"]
      },
      "claude-code": {
        label: "Claude Code",
        repoSkillDirs: [".claude/skills", ".claude/commands"],
        userSkillDirs: [".claude/skills", ".claude/commands"],
        mcpFiles: [".mcp.json"]
      }
    };
    var SHARED = {
      repoSkillDirs: [".agents/skills", ".github/prompts"],
      userSkillDirs: [".agents/skills"],
      mcpFiles: [".vscode/mcp.json"]
    };
    var KNOWN_TOOLS = Object.keys(TOOLS);
    function activeTools(config) {
      const t = config && config.tools && config.tools.length ? config.tools : KNOWN_TOOLS;
      return t.filter((x) => TOOLS[x]);
    }
    function collect(config, key) {
      const out2 = [];
      for (const t of activeTools(config)) out2.push(...TOOLS[t][key]);
      out2.push(...SHARED[key]);
      return [...new Set(out2)];
    }
    module2.exports = {
      KNOWN_TOOLS,
      TOOLS,
      activeTools,
      repoSkillDirs: (c) => collect(c, "repoSkillDirs"),
      userSkillDirs: (c) => collect(c, "userSkillDirs"),
      mcpFiles: (c) => collect(c, "mcpFiles")
    };
  }
});

// src/config.js
var require_config = __commonJS({
  "src/config.js"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var path2 = require("path");
    var YAML = require_dist();
    var { KNOWN_STACK } = require_stack();
    var { KNOWN_TOOLS } = require_tools();
    var CONFIG_FILE2 = ".ai-sdlc.yaml";
    var SOURCE = "github.com/parthbt-yorkie/ai-sdlc-onboarding";
    var LEGACY_MCP = {
      github: { category: "code-host", key: "github" },
      "gerrit-mcp": { category: "code-host", key: "gerrit" },
      "jira-mcp": { category: "issue-tracker", key: "jira" },
      "figma-mcp": { category: "design", key: "figma" },
      "sentry-mcp": { category: "errors", key: "sentry" }
    };
    function normOptional(v) {
      if (v === true) return "required";
      if (v === false) return "off";
      if (v == null) return "unset";
      const s = String(v).trim().toLowerCase();
      if (["required", "y", "yes", "true", "on"].includes(s)) return "required";
      if (["off", "n", "no", "false", "skip"].includes(s)) return "off";
      if (["unset", "undecided", "?", ""].includes(s)) return "unset";
      return null;
    }
    function normSkill2(v) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const inner = normSkill2(v.skill !== void 0 ? v.skill : v.value);
        return Object.assign({}, inner, {
          description: v.description ? String(v.description) : "",
          source: v.source ? String(v.source) : "",
          path: v.path ? String(v.path) : "",
          match: v.match ? String(v.match) : ""
        });
      }
      if (v === true) return { mode: "custom" };
      if (v === false) return { mode: "off" };
      if (v == null) return { mode: "unset" };
      const s = String(v).trim();
      const l = s.toLowerCase();
      if (["custom", "y", "yes", "any", "true"].includes(l)) return { mode: "custom" };
      if (["off", "n", "no", "false", "skip"].includes(l)) return { mode: "off" };
      if (["unset", "undecided", "?", ""].includes(l)) return { mode: "unset" };
      return { mode: "named", name: s };
    }
    function listOf(v) {
      if (v == null) return [];
      return (Array.isArray(v) ? v : String(v).split(",")).map((x) => String(x).trim()).filter(Boolean);
    }
    function normMcpValue(v) {
      if (v == null) return { mode: "unset", providers: [] };
      if (typeof v === "string") {
        const l = v.trim().toLowerCase();
        if (["off", "n", "no", "false"].includes(l)) return { mode: "off", providers: [] };
        if (["unset", "undecided", "?", ""].includes(l)) return { mode: "unset", providers: [] };
        return { mode: "providers", providers: listOf(v) };
      }
      if (Array.isArray(v)) {
        const providers = v.map(String).map((x) => x.trim()).filter(Boolean);
        return providers.length ? { mode: "providers", providers } : { mode: "unset", providers: [] };
      }
      return { mode: "unset", providers: [] };
    }
    function migrateLegacyMcp(optional, mcp) {
      const out2 = Object.assign({}, mcp);
      const leftover = Object.assign({}, optional);
      for (const [slug, map] of Object.entries(LEGACY_MCP)) {
        if (!(slug in leftover)) continue;
        const state = leftover[slug];
        delete leftover[slug];
        if (out2[map.category] && out2[map.category].mode !== "unset") continue;
        if (state === "required") out2[map.category] = { mode: "providers", providers: [map.key] };
        else if (state === "off") out2[map.category] = { mode: "off", providers: [] };
        else out2[map.category] = { mode: "unset", providers: [] };
      }
      return { optional: leftover, mcp: out2 };
    }
    function loadConfig2(root, now) {
      const file = path2.join(root, CONFIG_FILE2);
      const out2 = {
        exists: false,
        path: file,
        errors: [],
        warnings: [],
        version: null,
        source: SOURCE,
        tools: [],
        stack: [],
        ci: false,
        optional: {},
        skills: {},
        projectSkills: {},
        mcp: {},
        projectMcp: {},
        ignored: [],
        skillLocations: [],
        extras: {}
      };
      if (!fs2.existsSync(file)) return out2;
      out2.exists = true;
      let raw;
      try {
        raw = YAML.parse(fs2.readFileSync(file, "utf8"));
      } catch (e) {
        out2.errors.push(`${CONFIG_FILE2} is not valid YAML: ${String(e.message).split("\n")[0]}`);
        return out2;
      }
      if (raw == null) raw = {};
      if (typeof raw !== "object" || Array.isArray(raw)) {
        out2.errors.push(`${CONFIG_FILE2} must be a YAML mapping`);
        return out2;
      }
      const known = /* @__PURE__ */ new Set(["skill", "tools", "stack", "ci", "optional_checks", "skills", "project_skills", "ignored_checks", "skill_locations", "mcp", "project_mcp"]);
      for (const k of Object.keys(raw)) if (!known.has(k)) {
        out2.extras[k] = raw[k];
        out2.warnings.push(`unknown top-level key "${k}" in ${CONFIG_FILE2}`);
      }
      const skill = raw.skill && typeof raw.skill === "object" ? raw.skill : {};
      out2.version = skill.version ? String(skill.version) : null;
      if (skill.source) out2.source = String(skill.source);
      out2.tools = listOf(raw.tools);
      for (const t of out2.tools) if (!KNOWN_TOOLS.includes(t)) out2.warnings.push(`unknown tool "${t}" in tools (known: ${KNOWN_TOOLS.join(", ")})`);
      out2.stack = listOf(raw.stack);
      for (const t of out2.stack) if (!KNOWN_STACK.includes(t)) out2.warnings.push(`unknown stack tag "${t}" (known: ${KNOWN_STACK.join(", ")})`);
      out2.ci = raw.ci === true || String(raw.ci).toLowerCase() === "true";
      out2.skillLocations = listOf(raw.skill_locations);
      const optional = {};
      for (const [slug, v] of Object.entries(raw.optional_checks || {})) {
        const n = normOptional(v);
        if (n === null) {
          out2.warnings.push(`optional_checks.${slug}: "${v}" is not required/off/unset; treated as unset`);
          optional[slug] = "unset";
        } else optional[slug] = n;
      }
      const mcp = {};
      for (const [cat, v] of Object.entries(raw.mcp || {})) mcp[cat] = normMcpValue(v);
      const migrated = migrateLegacyMcp(optional, mcp);
      out2.optional = migrated.optional;
      out2.mcp = migrated.mcp;
      if (Object.keys(raw.optional_checks || {}).some((k) => LEGACY_MCP[k]) && !raw.mcp) {
        out2.warnings.push("legacy optional_checks MCP entries are still supported; re-run init to move them into mcp:");
      }
      for (const [slug, v] of Object.entries(raw.skills || {})) out2.skills[slug] = normSkill2(v);
      for (const [slug, v] of Object.entries(raw.project_skills || {})) out2.projectSkills[slug] = normSkill2(v);
      for (const [slug, v] of Object.entries(raw.project_mcp || {})) {
        if (v && typeof v === "object") {
          out2.projectMcp[slug] = {
            match: String(v.match || slug),
            description: v.description ? String(v.description) : "",
            mode: v.off === true || v.mode === "off" ? "off" : "required"
          };
        } else if (v === false || String(v).toLowerCase() === "off") {
          out2.projectMcp[slug] = { match: slug, description: "", mode: "off" };
        } else {
          out2.projectMcp[slug] = { match: String(v || slug), description: "", mode: "required" };
        }
      }
      const nowMs = (now || /* @__PURE__ */ new Date()).getTime();
      for (const e of Array.isArray(raw.ignored_checks) ? raw.ignored_checks : []) {
        const slug = e && (e.slug || e.id);
        if (!slug) {
          out2.errors.push('ignored_checks: every entry needs a "slug"');
          continue;
        }
        const reason = e.reason ? String(e.reason).trim() : "";
        if (!reason) {
          out2.errors.push(`ignored_checks: "${slug}" needs a "reason" (why is it safe to skip?)`);
          continue;
        }
        const entry = { slug: String(slug), reason, expires: e.expires ? String(e.expires) : null, expired: false, expiresSoon: false };
        if (entry.expires) {
          const end = Date.parse(entry.expires + (entry.expires.length === 10 ? "T23:59:59Z" : ""));
          if (Number.isNaN(end)) out2.errors.push(`ignored_checks: "${slug}" has an invalid expires date "${entry.expires}" (use YYYY-MM-DD)`);
          else {
            entry.expired = nowMs > end;
            entry.expiresSoon = !entry.expired && end - nowMs < 30 * 864e5;
          }
        }
        out2.ignored.push(entry);
      }
      return out2;
    }
    function wrap2(text, width, prefix) {
      const words = String(text).replace(/\s+/g, " ").trim().split(" ");
      const lines = [];
      let cur = "";
      for (const w of words) {
        if ((cur + " " + w).trim().length > width - prefix.length) {
          lines.push(prefix + cur);
          cur = w;
        } else cur = (cur + " " + w).trim();
      }
      if (cur) lines.push(prefix + cur);
      return lines;
    }
    function indent(text, n) {
      return text.split("\n").filter((l, i, a) => !(i === a.length - 1 && l === "")).map((l) => " ".repeat(n) + l).join("\n");
    }
    var flow = (list) => `[${list.join(", ")}]`;
    var val = (s) => YAML.stringify(String(s)).trim();
    function stackMatches2(itemStack, stack) {
      return !itemStack || itemStack.includes("any") || itemStack.some((t) => stack.includes(t));
    }
    function mcpRenderValue(v) {
      if (!v || v.mode === "unset") return "unset";
      if (v.mode === "off") return "off";
      return v.providers.length === 1 ? v.providers[0] : flow(v.providers);
    }
    function providerRequired2(config, catalog, providerSlugOrKey) {
      for (const [cat, v] of Object.entries(config.mcp || {})) {
        if (!v || v.mode !== "providers") continue;
        const catDef = (catalog.mcpCategories || []).find((c) => c.key === cat);
        for (const key of v.providers) {
          const p = catDef && catDef.providers.find((x) => x.key === key || x.slug === key) || (catalog.mcpProviders || []).find((x) => x.key === key || x.slug === key);
          if (!p) continue;
          if (p.slug === providerSlugOrKey || p.key === providerSlugOrKey) return true;
        }
      }
      if (config.optional[providerSlugOrKey] === "required") return true;
      for (const [legacy, map] of Object.entries(LEGACY_MCP)) {
        if (map.key === providerSlugOrKey && config.optional[legacy] === "required") return true;
      }
      return false;
    }
    function renderConfig(model, catalog, version) {
      const L = [];
      const push = (...x) => L.push(...x);
      push(
        "# =============================================================================",
        "# AI SDLC onboarding configuration  (commit this file)",
        "# =============================================================================",
        `# What this is: this project's answers about what "AI SDLC ready" means here.`,
        "# Anyone who runs the audit (CLI, CI or chat) is checked against these answers.",
        "# You can edit it by hand. Run `audit` to validate. Re-run `init` after updating the",
        "# skill: it keeps your answers and only asks about newly added items.",
        "#",
        "# Install the onboarding skill at the pinned version below (any skills folder works; add it",
        "# to .gitignore if you do not want to commit it):",
        `#   git clone --branch v${version} https://github.com/parthbt-yorkie/ai-sdlc-onboarding.git .cursor/skills/ai-sdlc-onboarding`,
        "# Run:",
        "#   node .cursor/skills/ai-sdlc-onboarding/scripts/ai-sdlc-onboarding.cjs audit",
        "# =============================================================================",
        "",
        "skill:",
        `  source: ${model.source || SOURCE}`,
        `  version: ${version}   # the skill version this file was created with (changed by init)`,
        "",
        "# AI tools your team uses: cursor, claude-code. Decides which skill, rule and MCP",
        "# locations are inspected. Leave empty to inspect every known tool. Shared folders",
        "# are always included (.agents/skills, .github/prompts, .vscode/mcp.json).",
        "# Add more folders with skill_locations.",
        `tools: ${flow(model.tools)}`,
        "",
        "# Detected technology stack: node, typescript, react, python, django. Decides which checks apply.",
        `stack: ${flow(model.stack)}`,
        "",
        "# true = this project runs the audit in CI (see assets/ci-github-actions.yml in the skill).",
        "# CI checks configuration only; authentication is validated on a developer machine or in chat.",
        `ci: ${model.ci ? "true" : "false"}`,
        "",
        "# -----------------------------------------------------------------------------",
        "# MCP providers by category. Value: a provider key, a list, off, or unset.",
        "# Alternatives in the same category (e.g. github vs gitlab) are offered at init.",
        "# -----------------------------------------------------------------------------",
        "mcp:"
      );
      for (const cat of catalog.mcpCategories || []) {
        push(...wrap2(`${cat.title}: ${cat.description}`, 100, "  # "));
        const keys = cat.providers.map((p) => p.key).join(", ");
        push(`  # providers: ${keys}`);
        const cur = model.mcp && model.mcp[cat.key] || { mode: "unset", providers: [] };
        push(`  ${cat.key}: ${mcpRenderValue(cur)}`);
      }
      push(
        "",
        "# Project-specific MCP servers not in the catalog (accepted during init from unknown servers).",
        "project_mcp:"
      );
      const pm = Object.entries(model.projectMcp || {});
      if (pm.length) {
        const obj = {};
        for (const [slug, v] of pm) {
          if (v.mode === "off") obj[slug] = "off";
          else {
            obj[slug] = { match: v.match || slug };
            if (v.description) obj[slug].description = v.description;
          }
        }
        push(indent(YAML.stringify(obj), 2));
      }
      push(
        "",
        "# -----------------------------------------------------------------------------",
        "# Optional checks",
        "#   required = must pass for the project to be READY",
        "#   off      = this project does not use it, do not check",
        "#   unset    = not decided yet (shown as a reminder, does not affect the verdict)",
        "# Must-have checks always run. ignored_checks can skip a gating check with a reason.",
        "# -----------------------------------------------------------------------------",
        "optional_checks:"
      );
      const optSections = catalog.sections.filter((s) => s.level === "optional" && s.kind === "checks");
      const mcpSlugs = new Set((catalog.items || []).filter((i) => i.kind === "mcp-provider").map((i) => i.slug));
      for (const sec of optSections) {
        const its = catalog.items.filter((i) => i.section === sec.key && i.kind !== "mcp-provider" && stackMatches2(i.stack, model.stack));
        if (!its.length) continue;
        push(`  # ---- ${sec.title} ----`);
        for (const i of its) {
          push(...wrap2(`${i.title}: ${i.description}`, 100, "  # "));
          push(`  ${i.slug}: ${model.optional[i.slug] || "unset"}`);
        }
      }
      const knownOpt = new Set(catalog.items.filter((i) => i.kind !== "mcp-provider").map((i) => i.slug));
      for (const [slug, v] of Object.entries(model.optional || {})) {
        if (!knownOpt.has(slug) && !mcpSlugs.has(slug) && !LEGACY_MCP[slug]) push(`  ${slug}: ${v}   # not in this skill version's catalog`);
      }
      push(
        "",
        "# -----------------------------------------------------------------------------",
        "# Skills, rules and workflows. For each capability choose one:",
        "#   custom       = everyone needs SOME relevant skill/rule for this; which one is their choice",
        "#   <skill-name> = this exact skill must exist in everyone's setup",
        "#   off          = do not check",
        "#   unset        = not decided yet",
        "# Skills marked onboarding in the catalog must be decided (not unset) for READY.",
        "# -----------------------------------------------------------------------------",
        "skills:"
      );
      let lastGroup = null;
      for (const s of catalog.skills.filter((x) => stackMatches2(x.stack, model.stack))) {
        if (s.group !== lastGroup) {
          push(`  # ---- ${s.group}${s.onboarding ? " (onboarding)" : ""} ----`);
          lastGroup = s.group;
        }
        push(...wrap2(`${s.title}: ${s.description}`, 100, "  # "));
        const cur = model.skills[s.slug];
        push(`  ${s.slug}: ${cur ? skillValue(cur) : "unset"}`);
      }
      const knownSkills = new Set(catalog.skills.map((s) => s.slug));
      for (const [slug, v] of Object.entries(model.skills || {})) {
        if (!knownSkills.has(slug)) push(`  ${slug}: ${skillValue(v)}   # not in this skill version's catalog (use project_skills for your own)`);
      }
      push(
        "",
        "# -----------------------------------------------------------------------------",
        "# Project-specific skills: required for THIS project but not part of the catalog.",
        "# Same rules as above. Add `description` so the chat audit can recognise a match.",
        "# -----------------------------------------------------------------------------",
        "project_skills:"
      );
      const ps = Object.entries(model.projectSkills || {});
      if (ps.length) {
        const obj = {};
        for (const [slug, v] of ps) {
          if (v.description || v.source || v.path) {
            obj[slug] = { skill: skillValue(v) };
            if (v.description) obj[slug].description = v.description;
            if (v.source) obj[slug].source = v.source;
            if (v.path) obj[slug].path = v.path;
          } else obj[slug] = skillValue(v);
        }
        push(indent(YAML.stringify(obj), 2));
      }
      push(
        "",
        "# -----------------------------------------------------------------------------",
        "# Ignored checks: skip a gating check. A reason is required.",
        "# `expires` (YYYY-MM-DD) is optional. Active ignores are listed in the audit report.",
        "# -----------------------------------------------------------------------------",
        "ignored_checks:"
      );
      if (model.ignored && model.ignored.length) {
        push(indent(YAML.stringify(model.ignored.map((e) => {
          const o = { slug: e.slug, reason: e.reason };
          if (e.expires) o.expires = e.expires;
          return o;
        })), 2));
      }
      if (model.skillLocations && model.skillLocations.length) {
        push("", "# Extra folders to look for skills/rules in (relative to the repo, or ~ for your home folder).", "skill_locations:");
        for (const s of model.skillLocations) push(`  - ${val(s)}`);
      }
      if (model.extras && Object.keys(model.extras).length) {
        push("", "# Other settings preserved from the previous file", YAML.stringify(model.extras).trimEnd());
      }
      return L.join("\n") + "\n";
    }
    function skillValue(v) {
      if (v.mode === "named") return val(v.name);
      return v.mode;
    }
    module2.exports = {
      CONFIG_FILE: CONFIG_FILE2,
      SOURCE,
      LEGACY_MCP,
      loadConfig: loadConfig2,
      renderConfig,
      normSkill: normSkill2,
      normOptional,
      normMcpValue,
      stackMatches: stackMatches2,
      wrap: wrap2,
      providerRequired: providerRequired2,
      migrateLegacyMcp,
      listOf
    };
  }
});

// src/repo.js
var require_repo = __commonJS({
  "src/repo.js"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var path2 = require("path");
    var cp = require("child_process");
    var SKIP_DIRS = /* @__PURE__ */ new Set([
      "node_modules",
      ".git",
      ".venv",
      "venv",
      "env",
      "__pycache__",
      "dist",
      "build",
      ".next",
      ".tox",
      ".mypy_cache",
      ".pytest_cache",
      "coverage",
      ".turbo",
      ".cache"
    ]);
    function run(cmd, args, opts) {
      try {
        return cp.execFileSync(cmd, args, Object.assign({
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
          maxBuffer: 128 * 1024 * 1024,
          timeout: 2e4
        }, opts || {}));
      } catch (e) {
        return null;
      }
    }
    function status(cmd, args, opts) {
      const r = cp.spawnSync(cmd, args, Object.assign({ encoding: "utf8", timeout: 2e4 }, opts || {}));
      if (r.error) return { error: r.error, status: null, stdout: "", stderr: "" };
      return { status: r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
    }
    function walk(root, rel, out2) {
      out2 = out2 || [];
      let entries;
      try {
        entries = fs2.readdirSync(path2.join(root, rel), { withFileTypes: true });
      } catch (e) {
        return out2;
      }
      for (const d of entries) {
        if (d.isSymbolicLink()) continue;
        const r = rel ? rel + "/" + d.name : d.name;
        if (d.isDirectory()) {
          if (!SKIP_DIRS.has(d.name)) walk(root, r, out2);
        } else if (d.isFile()) {
          out2.push(r);
        }
      }
      return out2;
    }
    function expandBraces(g) {
      const m = /\{([^{}]*)\}/.exec(g);
      if (!m) return [g];
      return m[1].split(",").flatMap((opt) => expandBraces(g.slice(0, m.index) + opt + g.slice(m.index + m[0].length)));
    }
    function globToRegex(g) {
      const anchored = g.includes("/");
      let re = "";
      for (let i = 0; i < g.length; i++) {
        const c = g[i];
        if (c === "*") {
          if (g[i + 1] === "*") {
            i++;
            if (g[i + 1] === "/") {
              i++;
              re += "(?:.*/)?";
            } else {
              re += ".*";
            }
          } else {
            re += "[^/]*";
          }
        } else if (c === "?") {
          re += "[^/]";
        } else {
          re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
        }
      }
      return new RegExp((anchored ? "^" : "^(?:.*/)?") + re + "$");
    }
    function stripJsonc(s) {
      let out2 = "";
      let i = 0;
      let inStr = false;
      while (i < s.length) {
        const c = s[i];
        const n = s[i + 1];
        if (inStr) {
          out2 += c;
          if (c === "\\") {
            out2 += n || "";
            i += 2;
            continue;
          }
          if (c === '"') inStr = false;
          i++;
          continue;
        }
        if (c === '"') {
          inStr = true;
          out2 += c;
          i++;
          continue;
        }
        if (c === "/" && n === "/") {
          while (i < s.length && s[i] !== "\n") i++;
          continue;
        }
        if (c === "/" && n === "*") {
          i += 2;
          while (i < s.length && !(s[i] === "*" && s[i + 1] === "/")) i++;
          i += 2;
          continue;
        }
        out2 += c;
        i++;
      }
      return out2.replace(/,(\s*[}\]])/g, "$1");
    }
    var Repo2 = class {
      constructor(root) {
        this.root = path2.resolve(root);
        this.isGit = (run("git", ["-C", this.root, "rev-parse", "--is-inside-work-tree"]) || "").trim() === "true";
        this._files = null;
        this._tracked = null;
        this._text = /* @__PURE__ */ new Map();
        this._json = /* @__PURE__ */ new Map();
        this._re = /* @__PURE__ */ new Map();
      }
      // Files present in the working tree and not git-ignored (tracked + new untracked).
      files() {
        if (this._files) return this._files;
        let list = null;
        if (this.isGit) {
          const out2 = run("git", ["-C", this.root, "ls-files", "-z", "--cached", "--others", "--exclude-standard"]);
          if (out2 !== null) list = out2.split("\0").filter(Boolean);
        }
        if (!list) list = walk(this.root, "");
        list = [...new Set(list)].filter((f) => fs2.existsSync(path2.join(this.root, f)));
        this._files = list.sort();
        return this._files;
      }
      // Committed files only (empty set when not a git repo).
      tracked() {
        if (this._tracked) return this._tracked;
        let set = /* @__PURE__ */ new Set();
        if (this.isGit) {
          const out2 = run("git", ["-C", this.root, "ls-files", "-z"]);
          if (out2) set = new Set(out2.split("\0").filter(Boolean));
        }
        this._tracked = set;
        return set;
      }
      isCommitted(rel) {
        return this.isGit ? this.tracked().has(rel) : fs2.existsSync(path2.join(this.root, rel));
      }
      isIgnored(rel) {
        if (!this.isGit) return false;
        return status("git", ["-C", this.root, "check-ignore", "-q", "--", rel]).status === 0;
      }
      onDisk(rel) {
        return fs2.existsSync(path2.join(this.root, rel));
      }
      compile(g) {
        if (!this._re.has(g)) this._re.set(g, expandBraces(g).map(globToRegex));
        return this._re.get(g);
      }
      match(globs) {
        const res = [].concat(globs).flatMap((g) => this.compile(g));
        return this.files().filter((f) => res.some((r) => r.test(f)));
      }
      has(rel) {
        return this.files().includes(rel);
      }
      read(rel) {
        if (this._text.has(rel)) return this._text.get(rel);
        let t = "";
        try {
          const p = path2.join(this.root, rel);
          if (fs2.statSync(p).size <= 1024 * 1024) t = fs2.readFileSync(p, "utf8");
        } catch (e) {
          t = "";
        }
        this._text.set(rel, t);
        return t;
      }
      json(rel) {
        if (this._json.has(rel)) return this._json.get(rel);
        let v = null;
        if (this.onDisk(rel)) {
          try {
            v = JSON.parse(stripJsonc(this.read(rel)));
          } catch (e) {
            v = null;
          }
        }
        this._json.set(rel, v);
        return v;
      }
      hasDep(names) {
        const pkg = this.json("package.json");
        if (pkg) {
          const keys = Object.keys(Object.assign({}, pkg.dependencies, pkg.devDependencies, pkg.peerDependencies, pkg.optionalDependencies));
          for (const n of names) {
            if (n.endsWith("*") ? keys.some((k) => k.startsWith(n.slice(0, -1))) : keys.includes(n)) return true;
          }
        }
        const pyFiles = this.match(["requirements*.txt", "requirements/*.txt", "pyproject.toml", "Pipfile", "setup.py", "setup.cfg"]);
        for (const f of pyFiles) {
          const t = this.read(f);
          for (const n of names) {
            const base = n.replace(/\*$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            if (new RegExp("(^|[^A-Za-z0-9_.-])" + base + "([^A-Za-z0-9_.-]|$)", "im").test(t)) return true;
          }
        }
        return false;
      }
    };
    module2.exports = { Repo: Repo2, run, status, stripJsonc };
  }
});

// src/skills.js
var require_skills = __commonJS({
  "src/skills.js"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var os = require("os");
    var path2 = require("path");
    var YAML = require_dist();
    var tools2 = require_tools();
    function frontmatter(text) {
      const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text || "");
      if (!m) return null;
      try {
        const v = YAML.parse(m[1]);
        return v && typeof v === "object" ? v : null;
      } catch (e) {
        return null;
      }
    }
    function describeFile(file, fallbackName, isSkillMd) {
      let text = "";
      try {
        text = fs2.readFileSync(file, "utf8");
      } catch (e) {
        return null;
      }
      const fm = frontmatter(text) || {};
      const name = typeof fm.name === "string" && fm.name.trim() || fallbackName;
      const description = typeof fm.description === "string" ? fm.description.trim().replace(/\s+/g, " ") : "";
      const issues = [];
      if (isSkillMd) {
        if (!fm.name) issues.push('frontmatter is missing "name"');
        if (!description) issues.push('frontmatter is missing "description"');
      } else if (/\.mdc$/.test(file)) {
        if (!description && fm.globs === void 0 && fm.alwaysApply === void 0) issues.push("rule has no description, globs or alwaysApply");
      }
      if (!text.trim()) issues.push("file is empty");
      return { name, description, wellFormed: issues.length === 0, issues };
    }
    function scanDir(abs, scope, repo, out2) {
      let entries;
      try {
        entries = fs2.readdirSync(abs, { withFileTypes: true });
      } catch (e) {
        return;
      }
      for (const d of entries) {
        const p = path2.join(abs, d.name);
        let info = null;
        if (d.isDirectory() || d.isSymbolicLink()) {
          const sm = path2.join(p, "SKILL.md");
          if (fs2.existsSync(sm)) info = Object.assign({ file: sm }, describeFile(sm, d.name, true));
        } else if (/\.(md|mdc)$/i.test(d.name) && !/^readme/i.test(d.name)) {
          info = Object.assign({ file: p }, describeFile(p, d.name.replace(/\.(prompt\.)?(md|mdc)$/i, ""), false));
        }
        if (!info || !info.name) continue;
        const entry = { name: info.name, description: info.description, scope, wellFormed: info.wellFormed, issues: info.issues };
        if (scope === "repo") {
          const rel = path2.relative(repo.root, info.file).split(path2.sep).join("/");
          entry.path = rel;
          entry.committed = repo.isCommitted(rel);
          entry.ignored = repo.isIgnored(rel);
        } else {
          entry.path = info.file.replace(os.homedir(), "~");
        }
        out2.push(entry);
      }
    }
    function indexSkills2(repo, config) {
      const out2 = [];
      for (const d of tools2.repoSkillDirs(config)) scanDir(path2.join(repo.root, d), "repo", repo, out2);
      for (const d of tools2.userSkillDirs(config)) scanDir(path2.join(os.homedir(), d), "user", repo, out2);
      for (const extra of config && config.skillLocations || []) {
        const abs = extra.startsWith("~") ? path2.join(os.homedir(), extra.slice(1)) : path2.resolve(repo.root, extra);
        scanDir(abs, abs.startsWith(repo.root + path2.sep) ? "repo" : "user", repo, out2);
      }
      return out2;
    }
    module2.exports = { frontmatter, indexSkills: indexSkills2 };
  }
});

// src/customs.js
var require_customs = __commonJS({
  "src/customs.js"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var path2 = require("path");
    var tools2 = require_tools();
    var { frontmatter } = require_skills();
    var { run, status: sh } = require_repo();
    var R = (status, detail) => ({ status, detail: detail || "" });
    var cap = (arr, n) => arr.slice(0, n || 3).join(", ") + (arr.length > (n || 3) ? ` (+${arr.length - (n || 3)} more)` : "");
    var DOC_GLOBS = ["AGENTS.md", "README.md", "CONTRIBUTING.md", "docs/**/*.md"];
    var CI_GLOBS = [
      ".github/workflows/*.{yml,yaml}",
      ".gitlab-ci.yml",
      ".gitlab/ci/*.yml",
      "Jenkinsfile",
      ".circleci/config.yml",
      "azure-pipelines.yml",
      "bitbucket-pipelines.yml",
      ".drone.yml",
      ".travis.yml",
      ".zuul.yaml",
      ".zuul.d/*.yaml",
      "zuul.d/*.yaml",
      ".buildkite/*.{yml,yaml}"
    ];
    var ENV_EXAMPLES = [".env.example", ".env.sample", ".env.template", "env.example", ".env.dist", "**/.env.example"];
    var text = (ctx, globs) => ctx.repo.match(globs).map((f) => ctx.repo.read(f)).join("\n");
    var docs = (ctx) => text(ctx, DOC_GLOBS);
    var lines = (t) => t.split(/\r?\n/);
    var nonEmpty = (t) => lines(t).filter((l) => l.trim());
    function needsTypecheck(ctx) {
      if (ctx.stack.has("typescript")) return true;
      if (!ctx.stack.has("python")) return false;
      return ctx.repo.match(["mypy.ini", ".mypy.ini", "pyrightconfig.json"]).length > 0 || /^\[tool\.(mypy|pyright)/m.test(ctx.repo.read("pyproject.toml"));
    }
    var needsBuild = (ctx) => ctx.stack.has("react");
    function commandSurface(ctx) {
      const pkg = /* @__PURE__ */ new Set();
      const make = /* @__PURE__ */ new Set();
      let bodies = "";
      const j = ctx.repo.json("package.json");
      if (j && j.scripts) for (const [k, v] of Object.entries(j.scripts)) {
        pkg.add(k);
        bodies += `${k} ${v}
`;
      }
      for (const f of ctx.repo.match(["Makefile", "makefile", "GNUmakefile"])) {
        const t = ctx.repo.read(f);
        for (const m of t.matchAll(/^([A-Za-z0-9_.-]+)\s*:(?!=)/gm)) make.add(m[1]);
        bodies += t + "\n";
      }
      for (const f of ctx.repo.match(["justfile", "Justfile"])) {
        const t = ctx.repo.read(f);
        for (const m of t.matchAll(/^([A-Za-z0-9_-]+)[^\n:]*:/gm)) make.add(m[1]);
        bodies += t + "\n";
      }
      for (const f of ctx.repo.match(["tox.ini", "noxfile.py"])) bodies += ctx.repo.read(f) + "\n";
      return { pkg, make, names: /* @__PURE__ */ new Set([...pkg, ...make]), bodies };
    }
    var CAT = {
      lint: { name: /^(lint|eslint|ruff|flake8|pylint|check|verify)([:_-]|$)/i, cmd: /(eslint|\bruff\b|flake8|pylint|biome (check|lint)|(npm|pnpm|yarn)( run)? lint|make lint)/i },
      test: { name: /^(test|tests|pytest|jest|vitest|unit|spec)([:_-]|$)/i, cmd: /(pytest|\bjest\b|vitest|manage\.py test|(npm|pnpm|yarn)( run)? test|make test|\btox\b|\bnox\b)/i },
      typecheck: { name: /^(typecheck|type-check|types|tsc|mypy|pyright|check-types)([:_-]|$)/i, cmd: /(\btsc\b|\bmypy\b|pyright|typecheck|type-check)/i },
      build: { name: /^build([:_-]|$)/i, cmd: /((npm|pnpm|yarn)( run)? build|make build|vite build|next build)/i }
    };
    function canonicalCommands(ctx) {
      const { names, bodies } = commandSurface(ctx);
      const doc = docs(ctx);
      const need = ["lint", "test"];
      if (needsTypecheck(ctx)) need.push("typecheck");
      if (needsBuild(ctx)) need.push("build");
      const missing = [];
      const found = [];
      for (const c of need) {
        const ok = [...names].some((n) => CAT[c].name.test(n)) || CAT[c].cmd.test(bodies) || CAT[c].cmd.test(doc);
        (ok ? found : missing).push(c);
      }
      return missing.length ? R("fail", `no script, target or documented command for: ${missing.join(", ")}`) : R("pass", `found: ${found.join(", ")}`);
    }
    function agentDocsCommandsValid(ctx) {
      if (!ctx.repo.has("AGENTS.md")) return R("na", "AGENTS.md is missing (see agents-md-complete)");
      const t = ctx.repo.read("AGENTS.md");
      const { pkg, make } = commandSurface(ctx);
      const refs = /* @__PURE__ */ new Set();
      const missing = [];
      for (const m of t.matchAll(/\b(?:npm|pnpm|yarn|bun)\s+run\s+([A-Za-z0-9:_-]+)/g)) {
        refs.add(m[0]);
        if (!pkg.has(m[1])) missing.push(m[0]);
      }
      for (const m of t.matchAll(/\b(?:npm|pnpm|yarn|bun)\s+(test|lint|build|dev|format|typecheck)\b/g)) {
        refs.add(m[0]);
        if (!pkg.has(m[1])) missing.push(m[0]);
      }
      for (const m of t.matchAll(/\bmake\s+([A-Za-z0-9_-]+)/g)) {
        refs.add(m[0]);
        if (!make.has(m[1])) missing.push(m[0]);
      }
      const others = /\b(pytest|python manage\.py \w+|ruff|mypy|uv run|poetry run|tox|nox)\b/.test(t);
      if (!refs.size && !others) return R("fail", "AGENTS.md documents no runnable commands");
      if (missing.length) return R("fail", `AGENTS.md references commands that do not exist: ${cap([...new Set(missing)], 4)}`);
      return R("pass", `${refs.size} documented command(s) exist`);
    }
    function singleTestDocumented(ctx) {
      const t = docs(ctx);
      const re = /(pytest\s+[\w./:-]+|-k\s+["']?\w+|\bjest\s+[\w./-]+|vitest\s+(run\s+)?[\w./-]+|testPathPattern|single test|specific test|one test|run a (single|specific)|test:file|manage\.py test [\w.]+)/i;
      return re.test(t) ? R("pass", "documented") : R("fail", "no example of running a single test or test file");
    }
    function ciRuns(ctx) {
      const files = ctx.repo.match(CI_GLOBS);
      if (!files.length) return R("fail", "no CI configuration found");
      const t = files.map((f) => ctx.repo.read(f)).join("\n");
      const rules = { lint: /(lint|eslint|ruff|flake8|pylint|biome)/i, test: /(\btest|pytest|jest|vitest)/i, typecheck: /(\btsc\b|typecheck|type-check|mypy|pyright)/i };
      const need = ["lint", "test"];
      if (needsTypecheck(ctx)) need.push("typecheck");
      const missing = need.filter((c) => !rules[c].test(t));
      return missing.length ? R("fail", `CI does not appear to run: ${missing.join(", ")}`) : R("pass", `CI config: ${cap(files, 2)}`);
    }
    function ciUsesRepoScripts(ctx) {
      const files = ctx.repo.match(CI_GLOBS);
      if (!files.length) return R("na", "no CI configuration");
      const t = files.map((f) => ctx.repo.read(f)).join("\n");
      const re = /((npm|pnpm|yarn)( run)? (lint|test|build|typecheck)|make (lint|test|check|build)|\bjust \w+|\btox\b|\bnox\b|poetry run|uv run|pre-commit run)/i;
      return re.test(t) ? R("pass", "CI calls repo scripts") : R("fail", "CI seems to call raw tools instead of the repo scripts, so CI and local can drift");
    }
    function typescriptStrict(ctx) {
      let cfgs = ctx.repo.match(["tsconfig.json", "tsconfig.*.json"]).filter((f) => !f.includes("/"));
      if (!cfgs.length) cfgs = ctx.repo.match(["**/tsconfig.json"]);
      if (!cfgs.length) return R("fail", "no tsconfig.json found");
      let unresolved = false;
      const strictOf = (rel, depth) => {
        const j = ctx.repo.json(rel);
        if (!j) return null;
        const co = j.compilerOptions || {};
        if (co.strict === true) return true;
        if (co.strict === false) return false;
        if (j.extends && depth < 4) {
          for (const e of [].concat(j.extends)) {
            if (String(e).startsWith(".")) {
              let p = path2.posix.normalize(path2.posix.join(path2.posix.dirname(rel), e));
              if (!p.endsWith(".json")) p += ".json";
              if (strictOf(p, depth + 1) === true) return true;
            } else unresolved = true;
          }
        }
        return null;
      };
      if (cfgs.some((f) => strictOf(f, 0) === true)) return R("pass", "strict enabled");
      if (unresolved) return R("cannot-verify", 'tsconfig extends an external preset; confirm "strict" is enabled');
      return R("fail", '"strict" is not enabled in tsconfig');
    }
    function noTrackedEnv(ctx) {
      const pool = ctx.repo.isGit ? [...ctx.repo.tracked()] : ctx.repo.files();
      const bad = pool.filter((f) => /(^|\/)\.env(\.[^/]+)?$/.test(f) && !/\.(example|sample|template|dist|defaults)$/i.test(f));
      return bad.length ? R("fail", `real env file(s) are committed: ${cap(bad)}`) : R("pass", "");
    }
    function envExampleApplies(ctx) {
      if (ctx.repo.match([".env", ".env.*"]).length) return R("pass", "");
      const re = /(process\.env|import\.meta\.env|os\.environ|os\.getenv|environ\.get|dotenv|django-environ|decouple)/;
      const hit = ctx.repo.match(["**/*.{js,jsx,ts,tsx,mjs,cjs,py}", "package.json", "requirements*.txt", "pyproject.toml"]).some((f) => re.test(ctx.repo.read(f)));
      return hit ? R("pass", "") : R("na", "no environment variables used");
    }
    function localServices(ctx) {
      const composeGlobs = ["docker-compose*.y*ml", "compose*.y*ml", ".devcontainer/**", "devbox.json"];
      const compose = ctx.repo.match(composeGlobs);
      const uses = compose.length > 0 || ctx.repo.hasDep(["psycopg2", "psycopg2-binary", "psycopg", "mysqlclient", "pymysql", "pg", "mysql2", "redis", "ioredis", "pymongo", "mongoose", "celery", "kafkajs", "amqplib", "kombu", "sqlalchemy", "prisma", "typeorm", "sequelize"]);
      if (!uses) return R("na", "no external services detected");
      if (compose.length) return R("pass", "found " + cap(compose, 2));
      if (/(docker|compose|postgres|redis|mysql|mongo|database|migrate|seed)/i.test(docs(ctx))) return R("pass", "services are documented in README/AGENTS.md");
      return R("fail", "external services detected but no compose file or documented setup");
    }
    function bootstrapCommand(ctx) {
      const { pkg, make } = commandSurface(ctx);
      const hit = [...pkg].filter((n) => /^(setup|bootstrap|init|dev:setup|install:all|first-run)$/i.test(n)).map((n) => `package.json script "${n}"`).concat([...make].filter((n) => /^(setup|bootstrap|install|init|dev-setup)$/i.test(n)).map((n) => `make ${n}`)).concat(ctx.repo.match(["scripts/{setup,bootstrap,install,init}*", "setup.sh", "bootstrap.sh"]));
      if (hit.length) return R("pass", cap(hit, 2));
      for (const f of ctx.repo.match(["README.md", "AGENTS.md", "CONTRIBUTING.md"])) {
        const ls = lines(ctx.repo.read(f));
        for (let i = 0; i < ls.length; i++) {
          if (/^#{1,4}\s+.*(setup|getting started|installation|quick start|install)/i.test(ls[i]) && ls.slice(i + 1, i + 15).some((l) => /^```/.test(l))) return R("pass", `documented in ${f}`);
        }
      }
      return R("fail", "no setup script or target and no documented setup commands");
    }
    function agentsMdComplete(ctx) {
      if (!ctx.repo.has("AGENTS.md")) return R("fail", "AGENTS.md not found");
      const t = ctx.repo.read("AGENTS.md");
      if (nonEmpty(t).length < 12) return R("fail", "AGENTS.md is almost empty");
      const heads = lines(t).filter((l) => /^#{1,6}\s/.test(l)).join("\n");
      const cats = {
        "commands (setup/build/test)": /(command|setup|install|build|test|run|script)/i,
        "architecture": /(architecture|structure|overview|layout|codebase|directory|folder|project)/i,
        "conventions": /(convention|style|guideline|standard|pattern|practice|rule)/i,
        "boundaries (what not to do)": /(boundar|off-limits|do not|don't|never|avoid|restrict|forbidden|safety|careful)/i
      };
      const missing = Object.entries(cats).filter(([k, re]) => !(re.test(heads) || k.startsWith("boundaries") && re.test(t))).map(([k]) => k);
      if (missing.length > 1) return R("fail", `AGENTS.md is missing sections for: ${missing.join(", ")}`);
      return R("pass", missing.length ? `consider adding: ${missing[0]}` : "all key sections present");
    }
    function agentDocsPathsValid(ctx) {
      const files = ctx.repo.match(["AGENTS.md", "CLAUDE.md", "GEMINI.md", ".cursor/rules/*.{md,mdc}", ".github/copilot-instructions.md"]);
      if (!files.length) return R("na", "no agent instruction files");
      const base = new Set(ctx.repo.files().map((f) => f.split("/").pop()));
      const missing = /* @__PURE__ */ new Set();
      for (const f of files) {
        for (const m of ctx.repo.read(f).matchAll(/`([^`\n]+)`/g)) {
          let tok = m[1].trim();
          if (/\s|:\/\/|[*?{}<>|=()$~@]/.test(tok) || tok.includes("...")) continue;
          tok = tok.replace(/^\.\//, "").replace(/[#:]\d.*$/, "").replace(/[,.;:]+$/, "");
          const isPath = tok.includes("/") && (/\.[A-Za-z0-9]+$/.test(tok) || tok.endsWith("/")) || /^[\w.-]+\.(md|mdc|json|ts|tsx|js|jsx|py|ya?ml|toml|cfg|ini|sh)$/.test(tok);
          if (!isPath || tok.startsWith("/")) continue;
          if (ctx.repo.onDisk(tok.replace(/\/$/, ""))) continue;
          if (!tok.includes("/") && base.has(tok)) continue;
          missing.add(tok);
        }
      }
      return missing.size ? R("fail", `referenced paths not found: ${cap([...missing], 5)}`) : R("pass", "");
    }
    function agentFilesNotDuplicated(ctx) {
      const others = ctx.repo.match(["CLAUDE.md", "GEMINI.md", ".github/copilot-instructions.md", ".cursorrules"]);
      if (!others.length) return R("na", "no tool-specific instruction files");
      if (!ctx.repo.has("AGENTS.md")) return R("fail", "tool-specific instruction files exist but there is no AGENTS.md baseline");
      const dup = others.filter((f) => nonEmpty(ctx.repo.read(f)).length > 30 && !/AGENTS\.md/.test(ctx.repo.read(f)));
      return dup.length ? R("fail", `long tool-specific files that do not point to AGENTS.md (possible duplication): ${cap(dup)}`) : R("pass", "");
    }
    function agentContextSize(ctx) {
      const a = ctx.repo.has("AGENTS.md") ? nonEmpty(ctx.repo.read("AGENTS.md")).length : 0;
      let always = 0;
      for (const f of ctx.repo.match([".cursor/rules/*.mdc"])) {
        const t = ctx.repo.read(f);
        const fm = frontmatter(t);
        if (fm && fm.alwaysApply === true) always += nonEmpty(t).length;
      }
      if (!a && !always) return R("na", "no always-on agent context found");
      const probs = [];
      if (a > 400) probs.push(`AGENTS.md has ${a} lines`);
      if (always > 600) probs.push(`always-applied rules total ${always} lines`);
      return probs.length ? R("fail", probs.join("; ") + " (large always-on context dilutes instructions)") : R("pass", `AGENTS.md ${a} lines, always-on rules ${always} lines`);
    }
    function agentRulesReferenceConfig(ctx) {
      const files = ctx.repo.match(["AGENTS.md", "CLAUDE.md", "GEMINI.md", ".cursorrules", ".cursor/rules/*.{md,mdc}", ".github/copilot-instructions.md"]);
      if (!files.length) return R("na", "no agent instruction files");
      const restating = /(semicolon|trailing comma|single quote|double quote|indent(ation)? (of )?\d|\b[24][- ]space|tabs? (for|instead)|line length|max-line|print width)/i;
      const referencing = /(prettier|eslint|ruff|\bblack\b|biome|\.editorconfig|lint config|formatter config)/i;
      const flagged = files.filter((f) => restating.test(ctx.repo.read(f)) && !referencing.test(ctx.repo.read(f)));
      return flagged.length ? R("fail", `restates formatting rules without pointing at the shared config: ${cap(flagged)}`) : R("pass", "");
    }
    function agentIgnoreFile(ctx) {
      const missing = [];
      for (const t of tools2.activeTools(ctx.config)) {
        if (t === "cursor" && !ctx.repo.match([".cursorignore", ".cursorindexingignore"]).length) missing.push("cursor (.cursorignore)");
        if (t === "claude-code" && !/"deny"\s*:/.test(ctx.repo.read(".claude/settings.json"))) missing.push("claude-code (permissions.deny in .claude/settings.json)");
      }
      return missing.length ? R("fail", `no ignore/deny rules for: ${missing.join(", ")}`) : R("pass", "");
    }
    var SPECIFIC = [
      ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
      ["private key", /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/],
      ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
      ["GitHub fine-grained token", /\bgithub_pat_[A-Za-z0-9_]{50,}\b/],
      ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
      ["Stripe live key", /\bsk_live_[A-Za-z0-9]{20,}/],
      ["Sentry auth token", /\bsntry[su]_[A-Za-z0-9+/=_-]{20,}/],
      ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/]
    ];
    var SENTRY_RULES = [SPECIFIC[6], ["Sentry auth token assignment", /SENTRY_AUTH_TOKEN\s*[:=]\s*["']?[A-Za-z0-9+/=_-]{20,}/]];
    var GENERIC = /(?:api[_-]?key|secret|passwd|password|token)\s*[:=]\s*["'][A-Za-z0-9/+_=-]{24,}["']/i;
    var GENERIC_SKIP_LINE = /(process\.env|os\.environ|getenv|example|placeholder|your[_-]|changeme|xxxx|<[^>]+>|\$\{)/i;
    var SKIP_FILE = /(\.(png|jpe?g|gif|ico|pdf|zip|gz|woff2?|ttf|eot|mp[34]|webp|lock|map)$|(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|poetry\.lock)$|\.min\.)/i;
    var TESTISH = /((^|\/)(tests?|__tests__|fixtures|mocks?|examples?|docs)\/|\.(test|spec)\.|\.(example|sample|template)$|\.md$)/i;
    function lineOf(t, re) {
      const ls = lines(t);
      for (let i = 0; i < ls.length; i++) if (re.test(ls[i])) return i + 1;
      return 1;
    }
    function secretScan(ctx, args) {
      const rules = args.only === "sentry" ? SENTRY_RULES : SPECIFIC;
      const hits = [];
      for (const f of ctx.repo.files()) {
        if (SKIP_FILE.test(f)) continue;
        const t = ctx.repo.read(f);
        if (!t) continue;
        for (const [kind, re] of rules) if (re.test(t)) hits.push({ kind, file: f, line: lineOf(t, re), generic: false });
        if (!args.only && !TESTISH.test(f) && GENERIC.test(t)) {
          const ls = lines(t);
          const i = ls.findIndex((l) => GENERIC.test(l) && !GENERIC_SKIP_LINE.test(l));
          if (i >= 0) hits.push({ kind: "possible hard-coded secret", file: f, line: i + 1, generic: true });
        }
      }
      const specific = hits.filter((h) => !h.generic);
      const fmt = (arr) => cap(arr.map((h) => `${h.kind} in ${h.file}:${h.line}`), 4);
      if (specific.length) return R("fail", `${specific.length} credential(s) found (values not shown): ${fmt(specific)}`);
      if (hits.length) return R("warn", `possible hard-coded secret(s), please review (values not shown): ${fmt(hits)}`);
      return R("pass", "");
    }
    function exampleEnvValues(ctx) {
      const f = ctx.repo.match(ENV_EXAMPLES)[0];
      if (!f) return R("na", "no .env.example");
      const bad = [];
      for (const l of lines(ctx.repo.read(f))) {
        const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(l);
        if (!m) continue;
        const v = m[2].replace(/^["']|["']$/g, "");
        if (/(prod|production)/i.test(v) && /(https?:|@|\.)/.test(v)) bad.push(m[1] + " (production-looking value)");
        else if (v.length >= 24 && /[A-Za-z]/.test(v) && /\d/.test(v) && !/(example|placeholder|your|change|xxx|<)/i.test(v) && !/[:/]/.test(v)) bad.push(m[1] + " (looks like a real secret)");
      }
      return bad.length ? R("fail", `${f}: ${cap(bad, 4)}`) : R("pass", "");
    }
    var REF = /\$\{[^}]+\}|\$[A-Z_][A-Z0-9_]*|%[A-Z_][A-Z0-9_]*%|\{\{[^}]+\}\}/;
    var SECRETKEY = /(token|secret|password|passwd|api[_-]?key|apikey|auth|bearer|credential)/i;
    function readMcp(ctx) {
      const out2 = [];
      for (const f of tools2.mcpFiles(ctx.config)) {
        if (!ctx.repo.onDisk(f)) continue;
        const j = ctx.repo.json(f);
        out2.push({ file: f, committed: ctx.repo.isCommitted(f), servers: j && (j.mcpServers || j.servers) || {} });
      }
      return out2;
    }
    function mcpConfigCommitted(ctx) {
      const cfgs = readMcp(ctx);
      const mentioned = /\bMCP\b/.test(docs(ctx));
      if (!cfgs.length && !mentioned) return R("na", "MCP is not used in this project");
      if (!cfgs.length) return R("fail", `MCP is mentioned in the docs but no project-level MCP config was found (${tools2.mcpFiles(ctx.config).join(", ")})`);
      const ok = cfgs.filter((c) => c.committed);
      if (!ok.length) return R("fail", `MCP config exists locally but is not committed: ${cfgs.map((c) => c.file).join(", ")}`);
      return R("pass", "committed: " + ok.map((c) => c.file).join(", "));
    }
    function mcpServersDocumented(ctx) {
      const names = [...new Set(readMcp(ctx).flatMap((c) => Object.keys(c.servers)))];
      if (!names.length) return R("na", "no MCP servers configured");
      const d = docs(ctx).toLowerCase();
      const missing = names.filter((n) => !d.includes(n.toLowerCase()));
      return missing.length ? R("fail", `MCP server(s) not mentioned in README/AGENTS.md/docs: ${missing.join(", ")}`) : R("pass", `${names.length} server(s) documented`);
    }
    function mcpNoInlineSecrets(ctx) {
      const cfgs = readMcp(ctx);
      if (!cfgs.length) return R("na", "no project MCP config");
      const bad = [];
      for (const c of cfgs) {
        for (const [name, s] of Object.entries(c.servers)) {
          for (const sect of ["env", "headers"]) {
            for (const [k, v] of Object.entries(s && s[sect] || {})) {
              if (typeof v === "string" && v && !REF.test(v) && SECRETKEY.test(k)) bad.push(`${name}.${sect}.${k}`);
            }
          }
          const args = (s && s.args || []).map(String);
          args.forEach((a, i) => {
            const m = /^--?([A-Za-z-]*(?:token|secret|password|key|auth)[A-Za-z-]*)(?:=(.+))?$/i.exec(a);
            if (!m) return;
            const v = m[2] !== void 0 ? m[2] : args[i + 1];
            if (v && !REF.test(v) && !/^-/.test(v)) bad.push(`${name}.args ${m[1]}`);
          });
          if (s && typeof s.url === "string" && /[?&](token|key|api_?key|apikey|secret|access_token)=[^&$]+/i.test(s.url) && !REF.test(s.url)) bad.push(`${name}.url query credential`);
        }
      }
      return bad.length ? R("fail", `literal credential(s) in MCP config (values not shown): ${cap(bad, 5)}`) : R("pass", "");
    }
    function findServers(ctx, match) {
      const re = new RegExp(match, "i");
      const out2 = [];
      for (const c of readMcp(ctx)) {
        for (const [name, s] of Object.entries(c.servers)) {
          if (re.test(name) || re.test(JSON.stringify([s && s.command, s && s.args, s && s.url]))) out2.push({ file: c.file, name, cfg: s || {} });
        }
      }
      return out2;
    }
    function refNames(servers) {
      const names = /* @__PURE__ */ new Set();
      for (const s of servers) {
        for (const m of JSON.stringify(s.cfg).matchAll(/\$\{(?:env:)?([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Z_][A-Z0-9_]*)/g)) names.add(m[1] || m[2]);
      }
      return [...names];
    }
    function envNamesIn(t) {
      const m = /* @__PURE__ */ new Map();
      for (const l of lines(t)) {
        const x = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(l);
        if (x && !/^\s*#/.test(l)) m.set(x[1], x[2].replace(/^["']|["']$/g, ""));
      }
      return m;
    }
    function mcpServer(ctx, args) {
      const found = findServers(ctx, args.match);
      if (args.require === "present") {
        return found.length ? R("pass", `server "${found[0].name}" in ${found[0].file}`) : R("fail", `no MCP server matching /${args.match}/ in ${tools2.mcpFiles(ctx.config).join(", ")}`);
      }
      if (!found.length) return R("na", "server not configured");
      const names = refNames(found);
      if (!names.length) return R("pass", "no environment variables referenced");
      const declared = /* @__PURE__ */ new Set();
      for (const f of ctx.repo.match(ENV_EXAMPLES)) for (const k of envNamesIn(ctx.repo.read(f)).keys()) declared.add(k);
      const missing = names.filter((n) => !declared.has(n));
      return missing.length ? R("fail", `not declared in .env.example: ${missing.join(", ")}`) : R("pass", `declared: ${names.join(", ")}`);
    }
    function isSet(ctx, name) {
      if (process.env[name]) return true;
      const v = ctx.repo.onDisk(".env") ? envNamesIn(ctx.repo.read(".env")).get(name) : void 0;
      return Boolean(v);
    }
    function mcpEnvSet(ctx, args) {
      const names = refNames(findServers(ctx, args.match));
      if (!names.length) return R("na", "no environment variables referenced");
      const missing = names.filter((n) => !isSet(ctx, n));
      return missing.length ? R("fail", `not set on this machine: ${missing.join(", ")}`) : R("pass", `set: ${names.join(", ")} (values not shown)`);
    }
    function readmeSetupAndRun(ctx) {
      const f = ctx.repo.match(["README.md", "README", "README.rst", "readme.md"])[0];
      if (!f) return R("fail", "README not found");
      const t = ctx.repo.read(f);
      if (nonEmpty(t).length < 15) return R("fail", "README is very short");
      const heads = lines(t).filter((l) => /^#{1,6}\s/.test(l)).join("\n");
      const miss = [];
      if (!/(setup|install|getting started|quick start|prerequisite)/i.test(heads)) miss.push("setup/installation");
      if (!/(run|usage|development|start|scripts|commands|build|test)/i.test(heads)) miss.push("how to run");
      return miss.length ? R("fail", `README has no section for: ${miss.join(", ")}`) : R("pass", "");
    }
    function envVarsSet(ctx) {
      const f = ctx.repo.match(ENV_EXAMPLES)[0];
      if (!f) return R("na", "no .env.example");
      const names = [...envNamesIn(ctx.repo.read(f)).keys()];
      if (!names.length) return R("na", "no variables listed");
      const missing = names.filter((n) => !isSet(ctx, n));
      return missing.length ? R("fail", `not set on this machine: ${cap(missing, 6)}`) : R("pass", "all set (values not shown)");
    }
    function toolchainMatches(ctx) {
      const problems = [];
      let checked = 0;
      const rangeOk = (pin, cur) => {
        const m = /^\s*(>=|\^|~)?\s*v?(\d+)/.exec(pin);
        if (!m) return true;
        return m[1] === ">=" ? cur >= Number(m[2]) : cur === Number(m[2]);
      };
      if (ctx.stack.has("node")) {
        let pin = null;
        for (const f of [".nvmrc", ".node-version"]) if (ctx.repo.onDisk(f)) {
          pin = ctx.repo.read(f).trim();
          break;
        }
        if (!pin) {
          const j = ctx.repo.json("package.json");
          pin = j && j.engines && j.engines.node || null;
        }
        if (pin) {
          checked++;
          if (!rangeOk(pin, Number(process.versions.node.split(".")[0]))) problems.push(`node: pinned ${pin}, running ${process.versions.node}`);
        }
      }
      if (ctx.stack.has("python") && ctx.repo.onDisk(".python-version")) {
        const pin = /(\d+)\.(\d+)/.exec(ctx.repo.read(".python-version"));
        const out2 = run("python3", ["--version"]) || run("python", ["--version"]);
        const cur = out2 && /(\d+)\.(\d+)/.exec(out2);
        if (pin && cur) {
          checked++;
          if (pin[1] !== cur[1] || pin[2] !== cur[2]) problems.push(`python: pinned ${pin[0]}, running ${cur[0]}`);
        } else if (pin && !cur) problems.push("python: not found on PATH");
      }
      if (!checked && !problems.length) return R("na", "no pinned runtime to compare");
      return problems.length ? R("fail", problems.join("; ")) : R("pass", "matches pinned versions");
    }
    function hooksInstalled(ctx) {
      if (!ctx.repo.isGit) return R("na", "not a git repository");
      const configured = ctx.repo.match([".husky/*", "lefthook*.y*ml", ".lefthook*.y*ml", ".pre-commit-config.y*ml", ".githooks/*"]).length > 0 || /"(lint-staged|simple-git-hooks|husky)"\s*:/.test(ctx.repo.read("package.json"));
      if (!configured) return R("na", "no hook tool configured (see pre-commit-configured)");
      const hp = (run("git", ["-C", ctx.repo.root, "config", "--get", "core.hooksPath"]) || "").trim();
      const dir = hp ? path2.resolve(ctx.repo.root, hp) : path2.resolve(ctx.repo.root, (run("git", ["-C", ctx.repo.root, "rev-parse", "--git-path", "hooks"]) || ".git/hooks").trim());
      return fs2.existsSync(path2.join(dir, "pre-commit")) ? R("pass", "pre-commit hook is installed") : R("fail", "hooks are configured in the repo but not installed in this clone");
    }
    function ghCliAuth() {
      const v = sh("gh", ["--version"]);
      if (v.error || v.status !== 0) return R("fail", "gh CLI is not installed");
      return sh("gh", ["auth", "status"]).status === 0 ? R("pass", "gh is authenticated") : R("fail", "gh is not authenticated");
    }
    function nestedAgentDocs(ctx) {
      const j = ctx.repo.json("package.json");
      const mono = ctx.repo.match(["pnpm-workspace.yaml", "lerna.json", "nx.json", "turbo.json", "rush.json"]).length > 0 || Boolean(j && j.workspaces);
      if (!mono) return R("na", "not a monorepo");
      const nested = ctx.repo.match(["**/AGENTS.md"]).filter((f) => f !== "AGENTS.md");
      return nested.length ? R("pass", "found " + cap(nested, 2)) : R("fail", "monorepo detected but no per-package AGENTS.md");
    }
    function testsAvoidNetwork(ctx) {
      return ctx.repo.hasDep(["msw", "nock", "responses", "requests-mock", "vcrpy", "pytest-httpx", "pytest-socket", "respx", "httpretty", "jest-fetch-mock", "fetch-mock", "@pollyjs/*"]) ? R("pass", "HTTP mocking library found") : R("fail", "no HTTP mocking or network-blocking library found; tests may hit real services");
    }
    function branchProtectionReviews(ctx) {
      if (ctx.mode === "ci") return R("cannot-verify", "branch protection needs gh on a developer machine; skipped in CI");
      const v = sh("gh", ["--version"]);
      if (v.error || v.status !== 0) return R("cannot-verify", "gh CLI is not installed");
      const repo = sh("gh", ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"], { cwd: ctx.repo.root });
      if (repo.status !== 0 || !repo.stdout.trim()) return R("cannot-verify", "could not resolve the GitHub repo with gh");
      const name = repo.stdout.trim();
      const def = sh("gh", ["api", `repos/${name}`, "--jq", ".default_branch"]);
      if (def.status !== 0) return R("cannot-verify", "could not read the default branch");
      const branch = def.stdout.trim() || "main";
      const prot = sh("gh", ["api", `repos/${name}/branches/${branch}/protection/required_pull_request_reviews`]);
      if (prot.status === 0) return R("pass", `required reviews on ${branch}`);
      if (/404/.test(prot.stderr || "") || /Not Found/.test(prot.stderr || "")) return R("fail", `no required pull request reviews on ${branch}`);
      return R("cannot-verify", "could not read branch protection (need admin:repo scope or the repo is private without access)");
    }
    function skillsWellFormed(ctx) {
      const { indexSkills: indexSkills2 } = require_skills();
      const index = indexSkills2(ctx.repo, ctx.config);
      const repoSkills = index.filter((s) => s.scope === "repo" && s.committed && /SKILL\.md$/i.test(s.path || ""));
      if (!repoSkills.length) return R("na", "no committed SKILL.md files");
      const bad = repoSkills.filter((s) => !s.wellFormed);
      return bad.length ? R("fail", `malformed skill(s): ${cap(bad.map((s) => `${s.name} (${(s.issues || []).join("; ")})`))}`) : R("pass", `${repoSkills.length} committed skill(s) well-formed`);
    }
    module2.exports = {
      "canonical-commands": canonicalCommands,
      "agent-docs-commands-valid": agentDocsCommandsValid,
      "single-test-documented": singleTestDocumented,
      "ci-runs-quality-gates": ciRuns,
      "ci-uses-repo-scripts": ciUsesRepoScripts,
      "typescript-strict": typescriptStrict,
      "no-tracked-env": noTrackedEnv,
      "env-example-applies": envExampleApplies,
      "local-services": localServices,
      "bootstrap-command": bootstrapCommand,
      "agents-md-complete": agentsMdComplete,
      "agent-docs-paths-valid": agentDocsPathsValid,
      "agent-files-not-duplicated": agentFilesNotDuplicated,
      "agent-context-size": agentContextSize,
      "agent-rules-reference-config": agentRulesReferenceConfig,
      "agent-ignore-file": agentIgnoreFile,
      "secret-scan": secretScan,
      "example-env-values": exampleEnvValues,
      "mcp-config-committed": mcpConfigCommitted,
      "mcp-servers-documented": mcpServersDocumented,
      "mcp-no-inline-secrets": mcpNoInlineSecrets,
      "mcp-server": mcpServer,
      "mcp-env-set": mcpEnvSet,
      "readme-setup-and-run": readmeSetupAndRun,
      "env-vars-set": envVarsSet,
      "toolchain-matches": toolchainMatches,
      "hooks-installed": hooksInstalled,
      "gh-cli-auth": ghCliAuth,
      "nested-agent-docs": nestedAgentDocs,
      "tests-avoid-network": testsAvoidNetwork,
      "branch-protection-reviews": branchProtectionReviews,
      "skills-well-formed": skillsWellFormed,
      // exported for the engine / skill index
      _refNames: refNames,
      _findServers: findServers
    };
  }
});

// src/detect.js
var require_detect = __commonJS({
  "src/detect.js"(exports2, module2) {
    "use strict";
    var customs = require_customs();
    var R = (status, detail) => ({ status, detail: detail || "" });
    var cap = (arr, n) => arr.slice(0, n || 3).join(", ") + (arr.length > (n || 3) ? ` (+${arr.length - (n || 3)} more)` : "");
    function combine(results) {
      const rs = results.filter((r) => r.status !== "na");
      if (!rs.length) return "na";
      if (rs.some((r) => r.status === "fail")) return "fail";
      if (rs.some((r) => r.status === "warn")) return "warn";
      if (rs.some((r) => r.status === "cannot-verify")) return "cannot-verify";
      return "pass";
    }
    function evalExpr(e, ctx) {
      if (!e) return R("na", "no detector");
      switch (e.type) {
        case "exists": {
          const f = ctx.repo.match(e.paths);
          return f.length ? R("pass", "found " + cap(f)) : R("fail", "none of: " + cap(e.paths, 4));
        }
        case "contains": {
          const files = ctx.repo.match(e.paths);
          if (!files.length) return R("fail", "no files matching " + cap(e.paths, 3));
          const re = new RegExp(e.pattern, e.flags || "im");
          const hit = files.find((f) => re.test(ctx.repo.read(f)));
          return hit ? R("pass", "found in " + hit) : R("fail", `pattern not found in ${files.length} file(s)`);
        }
        case "absent": {
          const re = new RegExp(e.pattern, e.flags || "im");
          const hits = ctx.repo.match(e.paths).filter((f) => re.test(ctx.repo.read(f)));
          return hits.length ? R("fail", "found in " + cap(hits)) : R("pass", "");
        }
        case "any": {
          const rs = e.of.map((x) => evalExpr(x, ctx));
          const pass = rs.find((r) => r.status === "pass");
          if (pass) return pass;
          const cv = rs.find((r) => r.status === "cannot-verify");
          if (cv) return cv;
          const warn = rs.find((r) => r.status === "warn");
          if (warn) return warn;
          const fails = rs.filter((r) => r.status === "fail");
          return fails.length ? R("fail", fails[0].detail) : R("na", "");
        }
        case "all": {
          const rs = e.of.map((x) => evalExpr(x, ctx));
          const status = combine(rs);
          return R(status, rs.filter((r) => r.status !== "pass" && r.status !== "na").map((r) => r.detail).filter(Boolean).join("; "));
        }
        case "per-eco": {
          const ecos = ["node", "python"].filter((t) => ctx.stack.has(t) && e[t]);
          if (!ecos.length) return R("na", "no matching ecosystem");
          const rs = ecos.map((t) => ({ t, r: evalExpr(e[t], ctx) }));
          const status = combine(rs.map((x) => x.r));
          const bad = rs.filter((x) => x.r.status !== "pass" && x.r.status !== "na");
          return R(status, bad.map((x) => `${x.t}: ${x.r.detail}`).join("; "));
        }
        case "stack":
          return e.tags.some((t) => ctx.stack.has(t)) ? R("pass", "") : R("na", "stack does not match");
        case "dep":
          return ctx.repo.hasDep(e.names) ? R("pass", "dependency found") : R("na", "dependency not found");
        case "custom": {
          const fn = customs[e.name];
          if (!fn) return R("cannot-verify", `unknown detector "${e.name}"`);
          try {
            return fn(ctx, e);
          } catch (err2) {
            return R("cannot-verify", `detector error: ${err2.message}`);
          }
        }
        default:
          return R("cannot-verify", `unknown detector type "${e.type}"`);
      }
    }
    module2.exports = { evalExpr, combine };
  }
});

// src/local.js
var require_local = __commonJS({
  "src/local.js"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var path2 = require("path");
    var YAML = require_dist();
    var DIR = ".ai-sdlc";
    var KEEP_REPORTS = 20;
    function dirPath(root) {
      return path2.join(root, DIR);
    }
    function ensureDir(root) {
      const d = dirPath(root);
      fs2.mkdirSync(path2.join(d, "reports"), { recursive: true });
      const gi = path2.join(d, ".gitignore");
      if (!fs2.existsSync(gi)) fs2.writeFileSync(gi, "*\n");
      return d;
    }
    function readLocal(root) {
      const f = path2.join(dirPath(root), "local.yaml");
      try {
        const v = YAML.parse(fs2.readFileSync(f, "utf8")) || {};
        return { skill_mappings: v.skill_mappings && typeof v.skill_mappings === "object" ? v.skill_mappings : {} };
      } catch (e) {
        return { skill_mappings: {} };
      }
    }
    function writeLocal(root, data) {
      ensureDir(root);
      const header = '# Personal, uncommitted. Maps a "custom" skill slug to the skill YOU use for it.\n# Managed by: ai-sdlc-onboarding map <slug>=<skill-name>\n';
      fs2.writeFileSync(path2.join(dirPath(root), "local.yaml"), header + YAML.stringify(data));
    }
    function setMapping(root, slug, name) {
      const d = readLocal(root);
      if (name) d.skill_mappings[slug] = name;
      else delete d.skill_mappings[slug];
      writeLocal(root, d);
    }
    function readLatest(root) {
      try {
        return JSON.parse(fs2.readFileSync(path2.join(dirPath(root), "reports", "latest.json"), "utf8"));
      } catch (e) {
        return null;
      }
    }
    function saveReport(root, result, now) {
      ensureDir(root);
      const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
      const dir = path2.join(dirPath(root), "reports");
      const file = path2.join(dir, `audit-${stamp}.json`);
      const body = JSON.stringify(result, null, 2) + "\n";
      fs2.writeFileSync(file, body);
      fs2.writeFileSync(path2.join(dir, "latest.json"), body);
      const old = fs2.readdirSync(dir).filter((f) => /^audit-.*\.json$/.test(f)).sort();
      for (const f of old.slice(0, Math.max(0, old.length - KEEP_REPORTS))) fs2.unlinkSync(path2.join(dir, f));
      return path2.relative(root, file).split(path2.sep).join("/");
    }
    module2.exports = { DIR, dirPath, readLocal, setMapping, readLatest, saveReport, ensureDir };
  }
});

// src/semver.js
var require_semver = __commonJS({
  "src/semver.js"(exports2, module2) {
    "use strict";
    function parse(v) {
      const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(v == null ? "" : v).trim());
      return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
    }
    function cmp(a, b) {
      const x = parse(a);
      const y = parse(b);
      if (!x || !y) return null;
      for (let i = 0; i < 3; i++) {
        if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
      }
      return 0;
    }
    module2.exports = { parse, cmp };
  }
});

// src/scan.js
var require_scan = __commonJS({
  "src/scan.js"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var path2 = require("path");
    var YAML = require_dist();
    var { Repo: Repo2 } = require_repo();
    var { detectStack: detectStack2 } = require_stack();
    var { indexSkills: indexSkills2 } = require_skills();
    var tools2 = require_tools();
    function loadKnown(skillDir) {
      try {
        return YAML.parse(fs2.readFileSync(path2.join(skillDir, "references", "known-configs.yaml"), "utf8")) || {};
      } catch (e) {
        return { paths: [], patterns: [], kinds: [] };
      }
    }
    function guessKind(file, kinds) {
      for (const k of kinds || []) {
        if (new RegExp(k.pattern, "i").test(file)) return k.kind;
      }
      return "other";
    }
    function collectCatalogPaths(catalog) {
      const out2 = /* @__PURE__ */ new Set();
      const walk = (e) => {
        if (!e || typeof e !== "object") return;
        if (Array.isArray(e.paths)) for (const p of e.paths) out2.add(p);
        if (e.of) for (const x of e.of) walk(x);
        for (const k of Object.keys(e)) {
          if (k === "paths" || k === "of" || k === "type" || k === "pattern" || k === "flags" || k === "name" || k === "match" || k === "require" || k === "only" || k === "tags" || k === "names") continue;
          if (typeof e[k] === "object") walk(e[k]);
        }
      };
      for (const c of catalog.checks) {
        walk(c.detect);
        walk(c.applies);
      }
      return out2;
    }
    function isCovered(file, known, catalogPaths, repo) {
      const pool = [...known.paths || [], ...known.patterns || [], ...catalogPaths];
      for (const g of pool) {
        if (repo.match([g]).includes(file)) return true;
        if (g === file) return true;
      }
      if (/(^|\/)\.env(\.|$)/.test(file) && !/\.(example|sample|template|dist)$/i.test(file)) return true;
      if (/\.(lock|lockb)$/i.test(file) || file.endsWith("package-lock.json")) return true;
      return false;
    }
    function looksLikeConfig(file) {
      const base = file.split("/").pop();
      if (base.startsWith(".") && !base.startsWith(".git")) return true;
      if (/\.config\.[^.]+$/i.test(base)) return true;
      if (/\.(toml|ini|yml|yaml|json|jsonc|mdc)$/i.test(base)) return true;
      if (/^(Dockerfile|Jenkinsfile|Makefile|makefile|Justfile|justfile)$/i.test(base)) return true;
      if (/^\.(cursor|claude|vscode|github|gitlab|devcontainer|agents|husky|circleci)\//.test(file)) return true;
      if (/^(docs|adr)\//.test(file) && /\.md$/i.test(file)) return false;
      return false;
    }
    function readMcpServers(repo, config) {
      const out2 = [];
      for (const f of tools2.mcpFiles(config)) {
        if (!repo.onDisk(f)) continue;
        const j = repo.json(f);
        const servers = j && (j.mcpServers || j.servers) || {};
        for (const [name, cfg] of Object.entries(servers)) {
          out2.push({
            name,
            file: f,
            command: cfg && cfg.command ? String(cfg.command) : null,
            url: cfg && cfg.url ? String(cfg.url) : null,
            committed: repo.isCommitted(f)
          });
        }
      }
      return out2;
    }
    function matchProvider(server, providers) {
      const hay = `${server.name} ${server.command || ""} ${server.url || ""}`;
      for (const p of providers) {
        if (!p.match) continue;
        if (new RegExp(p.match, "i").test(hay)) return p;
      }
      return null;
    }
    function detectTools(repo) {
      const found = [];
      if (repo.onDisk(".cursor") || repo.match([".cursor/**"]).length) found.push("cursor");
      if (repo.onDisk(".claude") || repo.match([".claude/**", ".mcp.json"]).length) found.push("claude-code");
      return found.length ? found : ["cursor"];
    }
    function detectCiPresent(repo) {
      return repo.match([
        ".github/workflows/*.{yml,yaml}",
        ".gitlab-ci.yml",
        ".gitlab/ci/*.yml",
        "Jenkinsfile",
        ".circleci/config.yml",
        "azure-pipelines.yml",
        "bitbucket-pipelines.yml",
        ".drone.yml",
        ".travis.yml"
      ]).length > 0;
    }
    function signals(repo) {
      const readme = repo.match(["README.md", "README", "readme.md"])[0];
      const headings = [];
      if (readme) {
        for (const l of repo.read(readme).split(/\r?\n/)) {
          const m = /^(#{1,3})\s+(.+)$/.exec(l);
          if (m) headings.push(m[2].trim());
        }
      }
      let topDirs = [];
      try {
        topDirs = fs2.readdirSync(repo.root, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".") && !["node_modules", "dist", "build", "coverage", "__pycache__", "venv"].includes(d.name)).map((d) => d.name).slice(0, 20);
      } catch (e) {
      }
      const deps = [];
      const j = repo.json("package.json");
      if (j) {
        for (const k of Object.keys(Object.assign({}, j.dependencies || {}, j.devDependencies || {}))) deps.push(k);
      }
      const req = repo.match(["requirements.txt", "requirements*.txt", "pyproject.toml"])[0];
      if (req) {
        const t = repo.read(req);
        for (const m of t.matchAll(/^([A-Za-z0-9_.-]+)\s*[<=>~!]/gm)) deps.push(m[1]);
        for (const m of t.matchAll(/^\s*"([A-Za-z0-9_.-]+)"\s*=/gm)) deps.push(m[1]);
      }
      return { readmeHeadings: headings.slice(0, 30), topDirs, dependencies: [...new Set(deps)].slice(0, 40) };
    }
    function missingStandardFiles(repo, catalog, stack) {
      const { evaluateCheck } = require_engine();
      const ctx = { repo, stack: new Set(stack), mode: "ci", config: { tools: [] } };
      const interesting = /* @__PURE__ */ new Set([
        "agents-md-complete",
        "pull-request-template",
        "env-example",
        "pre-commit-configured",
        "formatter-config-committed",
        "linter-config-committed",
        "readme-setup-and-run"
      ]);
      const out2 = [];
      for (const c of catalog.checks) {
        if (c.level !== "must" || !interesting.has(c.slug)) continue;
        if (c.stack && !c.stack.includes("any") && !c.stack.some((t) => stack.includes(t))) continue;
        const r = evaluateCheck(c, ctx);
        if (r.status === "fail") {
          out2.push({
            slug: c.slug,
            title: c.title,
            detail: r.detail,
            fix: c.fix || "",
            template: /Template:\s*\{\{skill_dir\}\}\/(\S+)/.exec(c.fix || "") ? RegExp.$1 : null
          });
        }
      }
      if (!repo.match([".github/workflows/*ai-sdlc*"]).length) {
        out2.push({
          slug: "ai-sdlc-ci-workflow",
          title: "AI SDLC onboarding CI workflow",
          detail: "no .github/workflows file for ai-sdlc-onboarding",
          fix: "Copy assets/ci-github-actions.yml to .github/workflows/ai-sdlc-onboarding.yml",
          template: "assets/ci-github-actions.yml",
          notACheck: true
        });
      }
      return out2;
    }
    function runScan(opts) {
      const { root, catalog, skillDir, config } = opts;
      const repo = new Repo2(root);
      const stack = config && config.stack && config.stack.length ? config.stack : detectStack2(repo);
      const cfg = config || { tools: [], stack, optional: {}, skills: {}, projectSkills: {}, mcp: {}, projectMcp: {}, ignored: [], warnings: [] };
      const toolsDetected = detectTools(repo);
      const activeCfg = Object.assign({}, cfg, { tools: cfg.tools && cfg.tools.length ? cfg.tools : toolsDetected });
      const skillIndex = indexSkills2(repo, activeCfg);
      const known = loadKnown(skillDir);
      const catalogPaths = collectCatalogPaths(catalog);
      const providers = catalog.mcpProviders || [];
      const mcpServers = readMcpServers(repo, activeCfg);
      const matched = [];
      const unknownMcp = [];
      for (const s of mcpServers) {
        const p = matchProvider(s, providers);
        if (p) matched.push({ server: s, provider: p.key, category: p.category, slug: p.slug });
        else unknownMcp.push({
          name: s.name,
          file: s.file,
          command: s.command,
          url: s.url,
          committed: s.committed
        });
      }
      const { evaluateCheck } = require_engine();
      const ctx = { repo, stack: new Set(stack), mode: "ci", config: activeCfg, skillDir };
      const evidence = [];
      for (const item of catalog.items) {
        if (item.kind === "mcp-provider" || item.mcp) {
          const conf = catalog.checks.find((c) => c.slug === `${item.slug}-configured` || item.checks && item.checks.includes(c.slug) && /configured$/.test(c.slug));
          if (conf) {
            const r = evaluateCheck(conf, ctx);
            if (r.status === "pass") evidence.push({ slug: item.key || item.slug, check: conf.slug, detail: r.detail, section: "integrations", category: item.category });
          }
          continue;
        }
        const checks = catalog.checks.filter((c) => (c.group === item.slug || (item.checks || []).includes(c.slug)) && c.scope === "repo" && c.tier !== "chat");
        let anyPass = false;
        let detail = "";
        for (const c of checks) {
          const r = evaluateCheck(c, ctx);
          if (r.status === "pass") {
            anyPass = true;
            detail = r.detail;
            break;
          }
        }
        if (anyPass) evidence.push({ slug: item.slug, detail, section: item.section });
      }
      for (const m of matched) {
        if (!m.server.committed) continue;
        if (!evidence.some((e) => e.slug === m.provider)) {
          evidence.push({ slug: m.provider, check: `${m.slug}-configured`, detail: `server "${m.server.name}" in ${m.server.file}`, section: "integrations", category: m.category });
        }
      }
      const unknownFiles = [];
      for (const f of repo.files()) {
        if (!looksLikeConfig(f)) continue;
        if (isCovered(f, known, catalogPaths, repo)) continue;
        if (f.split("/").length > 4 && !f.startsWith(".github/") && !f.startsWith(".cursor/") && !f.startsWith(".claude/")) continue;
        unknownFiles.push({
          path: f,
          kind: guessKind(f, known.kinds),
          why: "config-looking file not covered by this skill version"
        });
      }
      const byCategory = {};
      for (const cat of catalog.mcpCategories || []) {
        const found = matched.filter((m) => m.category === cat.key).map((m) => m.provider);
        byCategory[cat.key] = {
          title: cat.title,
          providers: cat.providers.map((p) => p.key),
          found: [...new Set(found)],
          recommended: found.length ? [...new Set(found)] : cat.defaultOff && !cat.defaultOff.some((t) => stack.includes(t)) ? null : null
        };
      }
      return {
        stack,
        tools: toolsDetected,
        ciPresent: detectCiPresent(repo),
        skillIndex,
        mcpServers,
        mcpMatched: matched,
        mcpByCategory: byCategory,
        unknownMcp,
        unknownFiles: unknownFiles.slice(0, 100),
        evidence,
        missingStandards: missingStandardFiles(repo, catalog, stack),
        signals: signals(repo),
        onboardingSkills: (catalog.skills || []).filter((s) => s.onboarding)
      };
    }
    function writeUnknownLog(root, scan, skillVersion, now) {
      const local2 = require_local();
      local2.ensureDir(root);
      const body = {
        generatedAt: (now || /* @__PURE__ */ new Date()).toISOString(),
        skillVersion,
        files: scan.unknownFiles || [],
        mcpServers: (scan.unknownMcp || []).map((s) => ({
          name: s.name,
          file: s.file,
          command: s.command || void 0,
          url: s.url || void 0
        }))
      };
      const file = path2.join(local2.dirPath(root), "unknown-configs.json");
      fs2.writeFileSync(file, JSON.stringify(body, null, 2) + "\n");
      return path2.relative(root, file).split(path2.sep).join("/");
    }
    module2.exports = {
      runScan,
      writeUnknownLog,
      detectTools,
      detectCiPresent,
      matchProvider,
      readMcpServers
    };
  }
});

// src/engine.js
var require_engine = __commonJS({
  "src/engine.js"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var os = require("os");
    var path2 = require("path");
    var { Repo: Repo2 } = require_repo();
    var { detectStack: detectStack2 } = require_stack();
    var { evalExpr } = require_detect();
    var { indexSkills: indexSkills2 } = require_skills();
    var { stackMatches: stackMatches2, providerRequired: providerRequired2 } = require_config();
    var { projectMcpChecks } = require_catalog();
    var local2 = require_local();
    var semver2 = require_semver();
    var customs = require_customs();
    var tools2 = require_tools();
    var TRIGGER_PHRASE2 = "Run the AI SDLC onboarding (full)";
    var ONBOARDING_SINCE = "0.2.0";
    function base(c) {
      return {
        slug: c.slug,
        title: c.title,
        section: c.section,
        level: c.level,
        group: c.group || null,
        tier: c.tier,
        scope: c.scope,
        why: c.why || "",
        fix: c.fix || "",
        setup: c.setup || null,
        status: "pass",
        detail: "",
        chatReview: false,
        gating: false
      };
    }
    function evaluateCheck(c, ctx) {
      const out2 = base(c);
      if (!stackMatches2(c.stack, [...ctx.stack])) {
        out2.status = "na";
        out2.detail = "not applicable to this stack";
        return out2;
      }
      if (c.applies) {
        const a = evalExpr(c.applies, ctx);
        if (a.status !== "pass") {
          out2.status = "na";
          out2.detail = a.detail || "not applicable";
          return out2;
        }
      }
      if (c.scope === "local" && ctx.mode === "ci") {
        out2.status = "cannot-verify";
        out2.detail = "needs this machine; skipped in CI";
        return out2;
      }
      if (c.tier === "chat") {
        out2.status = "needs-chat";
        out2.detail = c.chat_note || "validate in chat";
        return out2;
      }
      const r = evalExpr(c.detect, ctx);
      out2.status = r.status;
      out2.detail = r.detail;
      if (out2.status === "fail" && c.soft) out2.status = "warn";
      out2.chatReview = c.tier === "hybrid";
      return out2;
    }
    function expandPath(p, root) {
      if (p.startsWith("~")) return path2.join(os.homedir(), p.slice(1));
      return path2.resolve(root, p);
    }
    function skillFix(def, spec, cliHint2) {
      const where = ".cursor/skills/<name>/SKILL.md (Cursor) or .claude/skills/<name>/SKILL.md (Claude Code)";
      if (spec.mode === "named") {
        return `Make the skill "${spec.name}" available: put it in ${where}, commit it if it should be shared, or add \`source:\` in .ai-sdlc.yaml so others know where to get it.
If the name changed, update it in .ai-sdlc.yaml.`;
      }
      return `Create or install a skill/rule for "${def.title}"${def.description ? ` (${def.description})` : ""} in ${where}.
Then match it: run the chat audit ("${TRIGGER_PHRASE2}"), or run: ${cliHint2} map ${def.slug}=<your-skill-name>`;
    }
    function candidatesFor(def, index) {
      const kws = (def.keywords || []).concat(String(def.slug).split("-")).map((k) => k.toLowerCase()).filter((k) => k.length > 2);
      return index.map((s) => {
        const hay = `${s.name} ${s.description}`.toLowerCase();
        return { s, score: kws.filter((k) => hay.includes(k)).length };
      }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map((x) => ({ name: x.s.name, scope: x.s.scope, path: x.s.path }));
    }
    function evalSkill(def, spec, ctx, index, mapping, cliHint2) {
      const out2 = {
        slug: def.slug,
        title: def.title || def.slug,
        description: def.description || "",
        section: "skills",
        kind: "skill",
        level: "optional",
        tier: "chat",
        scope: "local",
        mode: spec.mode,
        name: spec.name || null,
        status: "pass",
        detail: "",
        why: def.description || "",
        fix: "",
        chatReview: false,
        gating: true,
        project: Boolean(def.project),
        setup: null,
        group: null,
        since: def.since || "0.1.0"
      };
      const byName = (n) => index.filter((s) => s.name.toLowerCase() === String(n).toLowerCase());
      if (spec.mode === "named") {
        let found = byName(spec.name);
        if (spec.path) {
          const abs = expandPath(spec.path, ctx.repo.root);
          if (fs2.existsSync(abs)) {
            const inRepo2 = abs.startsWith(ctx.repo.root + path2.sep);
            const rel = path2.relative(ctx.repo.root, abs).split(path2.sep).join("/");
            found = found.concat([{ name: spec.name, scope: inRepo2 ? "repo" : "user", path: spec.path, wellFormed: true, issues: [], committed: inRepo2 ? ctx.repo.isCommitted(rel) : false, ignored: false }]);
          }
        }
        const shared = found.find((f) => f.scope === "repo" && f.committed && !f.ignored);
        const inRepo = found.find((f) => f.scope === "repo");
        const personal = found.find((f) => f.scope === "user");
        if (shared) {
          if (!shared.wellFormed) {
            out2.status = "fail";
            out2.detail = `"${spec.name}" found at ${shared.path} but is malformed: ${shared.issues.join("; ")}`;
          } else out2.detail = `"${spec.name}" is shared in the repo (${shared.path})`;
        } else if (ctx.mode === "ci") {
          out2.status = "cannot-verify";
          out2.detail = `"${spec.name}" is not committed in the repo; user-level installs cannot be seen in CI`;
        } else if (inRepo) {
          out2.status = spec.source ? "pass" : "warn";
          out2.detail = `"${spec.name}" exists at ${inRepo.path} but is not committed${spec.source ? `; others get it from ${spec.source}` : " (others cannot get it): commit it or add `source`"}`;
        } else if (personal) {
          out2.status = spec.source ? "pass" : "warn";
          out2.detail = `"${spec.name}" is installed in your user folder (${personal.path})${spec.source ? `; others get it from ${spec.source}` : " only: add `source` so others can install it"}`;
        } else {
          out2.status = "fail";
          out2.detail = `named skill "${spec.name}" not found in the project or user skill folders${spec.source ? `; get it from ${spec.source}` : ""}`;
        }
      } else if (ctx.mode === "ci") {
        out2.status = "cannot-verify";
        out2.detail = "any relevant skill is required; this depends on each person's setup (check locally or in chat)";
      } else {
        const mapped = mapping[def.slug];
        const found = mapped ? byName(mapped) : [];
        if (found.length) {
          const best = found.find((f) => f.scope === "repo" && f.committed) || found[0];
          out2.detail = `mapped to "${mapped}" (${best.scope === "repo" && best.committed ? "shared in the repo" : "personal install"})`;
          out2.portable = best.scope === "repo" && best.committed;
        } else {
          out2.status = "needs-chat";
          out2.detail = mapped ? `your mapping "${mapped}" no longer resolves to an installed skill` : "any relevant skill is required; match yours in chat";
          out2.candidates = candidatesFor(def, index);
        }
      }
      if (out2.status !== "pass") out2.fix = skillFix(def, spec, cliHint2);
      return out2;
    }
    function unsetSkillResult(def) {
      return {
        slug: def.slug,
        title: def.title || def.slug,
        description: def.description || "",
        section: "skills",
        kind: "skill",
        level: "optional",
        tier: "chat",
        scope: "local",
        mode: "unset",
        name: null,
        status: "fail",
        detail: "not decided yet: set to custom, a skill name, or off",
        why: def.description || "Onboarding requires a decision for this skill.",
        fix: `In .ai-sdlc.yaml set skills.${def.slug} to custom (any relevant skill), a specific skill name, or off.
Or re-run init and answer the question.`,
        chatReview: false,
        gating: true,
        project: Boolean(def.project),
        setup: null,
        group: null,
        since: ONBOARDING_SINCE,
        onboardingUnset: true
      };
    }
    function isCheckGating(c, config, catalog) {
      if (c.level === "must") return true;
      if (!c.group) return false;
      if (providerRequired2(config, catalog, c.group)) return true;
      if ((config.optional[c.group] || "unset") === "required") return true;
      const m = /^project-mcp-(.+)$/.exec(c.group);
      if (m && config.projectMcp[m[1]] && config.projectMcp[m[1]].mode === "required") return true;
      return false;
    }
    function runAudit2(opts) {
      const { root, config, catalog, mode, skillVersion, skillDir, all, cliHint: cliHint2 } = opts;
      const now = opts.now || /* @__PURE__ */ new Date();
      const repo = new Repo2(root);
      const stackArr = config.stack.length ? config.stack : detectStack2(repo);
      const ctx = { repo, stack: new Set(stackArr), mode, config, skillDir };
      const mapping = local2.readLocal(root).skill_mappings;
      const index = indexSkills2(repo, config);
      const ignoredBy = new Map(config.ignored.map((i) => [i.slug, i]));
      const warnings = config.warnings.slice();
      const projectMcpCheckList = [];
      for (const [name, entry] of Object.entries(config.projectMcp || {})) {
        if (entry.mode === "off") continue;
        for (const c of projectMcpChecks(name, entry)) {
          projectMcpCheckList.push(Object.assign(normProjectCheck(c, name), { group: `project-mcp-${name}` }));
        }
      }
      const knownSlugs = /* @__PURE__ */ new Set([
        ...catalog.checks.map((c) => c.slug),
        ...catalog.skills.map((s) => s.slug),
        ...Object.keys(config.projectSkills),
        ...projectMcpCheckList.map((c) => c.slug),
        "ai-sdlc-ci-workflow"
      ]);
      for (const i of config.ignored) if (!knownSlugs.has(i.slug)) warnings.push(`ignored_checks: unknown slug "${i.slug}"`);
      for (const slug of Object.keys(config.optional)) {
        if (!catalog.items.some((i) => i.slug === slug) && !/^gerrit-mcp|jira-mcp|figma-mcp|sentry-mcp|github$/.test(slug)) {
          warnings.push(`optional_checks: unknown slug "${slug}"`);
        }
      }
      for (const i of config.ignored) if (i.expiresSoon) warnings.push(`ignored_checks: "${i.slug}" expires on ${i.expires} (within 30 days)`);
      const results = [];
      const undecided = [];
      const optState = (slug) => config.optional[slug] || "unset";
      const allChecks = catalog.checks.concat(projectMcpCheckList);
      for (const c of allChecks) {
        const gating2 = isCheckGating(c, config, catalog);
        if (!gating2 && !all) continue;
        if (!gating2 && c.group && optState(c.group) === "off") continue;
        let r;
        const ign = ignoredBy.get(c.slug);
        if (gating2 && ign && !ign.expired) {
          r = Object.assign(base(c), { status: "ignored", detail: ign.reason + (ign.expires ? ` (until ${ign.expires})` : "") });
        } else {
          r = evaluateCheck(c, ctx);
          if (ign && ign.expired) r.detail += ` [ignore expired on ${ign.expires}]`;
          if (gating2 && r.status === "fail" && config.version && semver2.cmp(c.since || "0.1.0", config.version) === 1) {
            r.status = "warn";
            r.pendingNew = true;
            r.detail = `new in skill v${c.since}; warning until you re-run init (does not block READY): ${r.detail}`;
          }
        }
        r.gating = gating2;
        results.push(r);
      }
      for (const it of catalog.items) {
        if (it.kind === "mcp-provider") {
          const cat = it.category;
          const state = config.mcp[cat];
          if (!state || state.mode === "unset") {
            if (stackMatches2(it.stack, stackArr)) undecided.push({ slug: `${cat}:${it.key}`, title: `${it.title} (${cat})`, kind: "mcp", description: it.description });
          }
          continue;
        }
        if (stackMatches2(it.stack, stackArr) && optState(it.slug) === "unset") {
          undecided.push({ slug: it.slug, title: it.title, kind: it.kind, description: it.description });
        }
      }
      for (const cat of catalog.mcpCategories || []) {
        if (!config.mcp[cat.key] || config.mcp[cat.key].mode === "unset") {
          undecided.push({ slug: cat.key, title: cat.title, kind: "mcp-category", description: cat.description });
        }
      }
      for (const def of catalog.skills) {
        if (!stackMatches2(def.stack, stackArr)) continue;
        if (def.applies_dep && !repo.hasDep(def.applies_dep)) continue;
        const spec = config.skills[def.slug] || { mode: "unset" };
        if (spec.mode === "off") continue;
        if (spec.mode === "unset") {
          undecided.push({ slug: def.slug, title: def.title, kind: "skill", description: def.description, onboarding: Boolean(def.onboarding) });
          if (def.onboarding) {
            let r = unsetSkillResult(def);
            const ign2 = ignoredBy.get(def.slug);
            if (ign2 && !ign2.expired) {
              r = Object.assign(r, { status: "ignored", detail: ign2.reason });
            } else if (config.version && semver2.cmp(ONBOARDING_SINCE, config.version) === 1) {
              r.status = "warn";
              r.pendingNew = true;
              r.detail = `new in skill v${ONBOARDING_SINCE}; warning until you re-run init (does not block READY): ${r.detail}`;
            }
            r.gating = true;
            results.push(r);
          }
          continue;
        }
        const ign = ignoredBy.get(def.slug);
        if (ign && !ign.expired) {
          results.push(Object.assign(evalSkillStub(def, spec), { status: "ignored", detail: ign.reason }));
          continue;
        }
        results.push(evalSkill(def, spec, ctx, index, mapping, cliHint2));
      }
      for (const [slug, spec] of Object.entries(config.projectSkills)) {
        if (spec.mode === "off") continue;
        const def = { slug, title: slug, description: spec.description || "", keywords: (spec.description || "").split(/\W+/), project: true, onboarding: true };
        if (spec.mode === "unset") {
          undecided.push({ slug, title: slug, kind: "project-skill", description: spec.description || "", onboarding: true });
          let r = unsetSkillResult(def);
          if (config.version && semver2.cmp(ONBOARDING_SINCE, config.version) === 1) {
            r.status = "warn";
            r.pendingNew = true;
            r.detail = `new in skill v${ONBOARDING_SINCE}; warning until you re-run init (does not block READY): ${r.detail}`;
          }
          r.gating = true;
          results.push(r);
          continue;
        }
        results.push(evalSkill(def, spec, ctx, index, mapping, cliHint2));
      }
      const gating = results.filter((r) => r.gating);
      const by = (s) => gating.filter((r) => r.status === s);
      const pass = by("pass").length;
      const fail = by("fail").length;
      const warn = by("warn").length;
      const decisive = pass + fail + warn;
      const mustApplicable = gating.filter((r) => r.level === "must" && r.status !== "na");
      const ready = fail === 0;
      const scopeLabel = mode === "ci" ? "config only" : "config + local config";
      const rank = { fail: 0, warn: 1 };
      const steps = gating.filter((r) => r.status === "fail" || r.status === "warn").map((r, i) => ({ r, i })).sort((a, b) => rank[a.r.status] - rank[b.r.status] || a.i - b.i).map((x) => x.r);
      const toVerify = gating.filter((r) => r.status === "needs-chat" || r.status === "cannot-verify");
      let unknown = null;
      try {
        const { runScan, writeUnknownLog } = require_scan();
        const scan = runScan({ root, catalog, skillDir, config });
        const saved = writeUnknownLog(root, scan, skillVersion, now);
        unknown = {
          path: saved,
          files: (scan.unknownFiles || []).length,
          mcpServers: (scan.unknownMcp || []).length,
          sample: (scan.unknownFiles || []).slice(0, 5).map((f) => f.path),
          mcpSample: (scan.unknownMcp || []).slice(0, 5).map((s) => s.name)
        };
      } catch (e) {
        warnings.push(`could not write unknown-configs log: ${e.message}`);
      }
      const prev = local2.readLatest(root);
      return {
        tool: "ai-sdlc-onboarding",
        generatedAt: now.toISOString(),
        project: path2.basename(root),
        mode,
        skillVersion,
        configVersion: config.version,
        tools: tools2.activeTools(config),
        stack: stackArr,
        verdict: { ready, label: ready ? `READY (${scopeLabel})` : "NOT READY", scope: scopeLabel },
        score: decisive ? Math.round(100 * pass / decisive) : null,
        counts: {
          pass,
          warn,
          fail,
          needsChat: by("needs-chat").length,
          cannotVerify: by("cannot-verify").length,
          ignored: by("ignored").length,
          notApplicable: by("na").length,
          ignoredMust: mustApplicable.filter((r) => r.status === "ignored").length,
          totalMust: mustApplicable.length,
          undecided: undecided.length,
          pendingNew: gating.filter((r) => r.pendingNew).length
        },
        previous: prev ? { generatedAt: prev.generatedAt, score: prev.score, verdict: prev.verdict && prev.verdict.label } : null,
        steps: steps.map((r) => ({ slug: r.slug, title: r.title, status: r.status, section: r.section, detail: r.detail, why: r.why, fix: r.fix, setup: r.setup })),
        toVerify: toVerify.map((r) => ({ slug: r.slug, title: r.title, status: r.status, detail: r.detail, fix: r.fix, candidates: r.candidates || void 0 })),
        items: results,
        undecided,
        warnings,
        unknown,
        chat: {
          triggerPhrase: TRIGGER_PHRASE2,
          needsChat: gating.filter((r) => r.status === "needs-chat").map((r) => r.slug),
          reviewInChat: gating.filter((r) => r.chatReview && r.status !== "na").map((r) => r.slug),
          skillIndex: index.map((s) => ({ name: s.name, description: s.description, scope: s.scope, path: s.path, committed: s.committed, wellFormed: s.wellFormed })),
          mcpServers: Object.keys(customs._findServers(ctx, ".*").reduce((a, s) => {
            a[s.name] = 1;
            return a;
          }, {}))
        }
      };
    }
    function normProjectCheck(c, name) {
      return Object.assign({
        level: "optional",
        tier: "script",
        scope: "repo",
        stack: ["any"],
        since: ONBOARDING_SINCE,
        soft: false,
        why: "",
        fix: "",
        section: "integrations",
        setup: "references/integrations/project-mcp.md"
      }, c, { group: `project-mcp-${name}` });
    }
    function evalSkillStub(def, spec) {
      return {
        slug: def.slug,
        title: def.title,
        description: def.description,
        section: "skills",
        kind: "skill",
        level: "optional",
        tier: "chat",
        scope: "local",
        mode: spec.mode,
        name: spec.name || null,
        status: "pass",
        detail: "",
        why: def.description,
        fix: "",
        chatReview: false,
        gating: true,
        setup: null,
        group: null
      };
    }
    module2.exports = { runAudit: runAudit2, TRIGGER_PHRASE: TRIGGER_PHRASE2, evaluateCheck, ONBOARDING_SINCE };
  }
});

// src/report.js
var require_report = __commonJS({
  "src/report.js"(exports2, module2) {
    "use strict";
    var ICON = { fail: "FAIL", warn: "WARN", "needs-chat": "CHAT", "cannot-verify": "SKIP", ignored: "IGNORED", pass: "PASS", na: "N/A" };
    function indentBlock(t, n) {
      return String(t).split("\n").map((l) => " ".repeat(n) + l).join("\n");
    }
    function renderMarkdown2(res, opts) {
      const skillDir = opts && opts.skillDir || "<skill folder>";
      const fill = (t) => String(t || "").replace(/\{\{skill_dir\}\}/g, skillDir);
      const L = [];
      const c = res.counts;
      L.push(`# AI SDLC onboarding: ${res.project}`);
      L.push("");
      L.push(`**Verdict: ${res.verdict.label}**`);
      let scoreLine = res.score === null ? "Score: n/a (nothing could be evaluated)" : `Score: **${res.score}%** (${c.pass} passing, ${c.fail} failing, ${c.warn} warning)`;
      if (res.previous && res.previous.score != null && res.score !== null) {
        const d = res.score - res.previous.score;
        scoreLine += `, ${d === 0 ? "unchanged" : (d > 0 ? "+" : "") + d + " points"} since ${res.previous.generatedAt.slice(0, 10)}`;
      }
      L.push(scoreLine);
      L.push(`Mode: ${res.mode === "ci" ? "CI (configuration only)" : "local"} | skill v${res.skillVersion} | config v${res.configVersion} | tools: ${res.tools.join(", ") || "none"} | stack: ${res.stack.join(", ") || "unknown"}`);
      if (c.totalMust) L.push(`Must-have checks ignored: ${c.ignoredMust} of ${c.totalMust}`);
      if (res.verdict.ready && (c.needsChat || c.cannotVerify)) {
        L.push(`Not yet covered: ${c.needsChat + c.cannotVerify} item(s) need chat or a local run, so this verdict is **${res.verdict.scope}** only.`);
      }
      L.push("");
      if (res.steps.length) {
        L.push(`## Path to 100% (${res.steps.length} step${res.steps.length === 1 ? "" : "s"})`);
        L.push("");
        res.steps.forEach((s, i) => {
          L.push(`${i + 1}. **[${ICON[s.status]}] \`${s.slug}\`**: ${s.title}`);
          if (s.detail) L.push(`   - Found: ${s.detail}`);
          if (s.why) L.push(`   - Why it matters: ${s.why}`);
          if (s.fix) {
            L.push("   - Fix:");
            L.push(indentBlock(fill(s.fix).trim(), 7));
          }
          L.push("");
        });
      } else {
        L.push("## Path to 100%");
        L.push("");
        L.push("Nothing left to fix among the checks that could be evaluated here.");
        L.push("");
      }
      if (res.toVerify.length) {
        L.push(`## Still to verify (${res.toVerify.length})`);
        L.push("");
        for (const v of res.toVerify) {
          L.push(`- **[${ICON[v.status]}] \`${v.slug}\`**: ${v.title}: ${v.detail}`);
          if (v.candidates && v.candidates.length) L.push(`  - Candidates found: ${v.candidates.map((x) => `${x.name} (${x.scope})`).join(", ")}`);
        }
        L.push("");
      }
      const ignored = res.items.filter((r) => r.gating && r.status === "ignored");
      if (ignored.length) {
        L.push(`## Ignored (${ignored.length})`);
        L.push("");
        for (const r of ignored) L.push(`- \`${r.slug}\`: ${r.detail}`);
        L.push("");
      }
      if (res.undecided.length) {
        L.push(`## Undecided (${res.undecided.length}): not affecting the verdict`);
        L.push("");
        L.push("Run `init` (or edit `.ai-sdlc.yaml`) to set these to required/off or custom/off/skill name:");
        for (const u of res.undecided.slice(0, 12)) L.push(`- \`${u.slug}\`: ${u.title}`);
        if (res.undecided.length > 12) L.push(`- ... and ${res.undecided.length - 12} more`);
        L.push("");
      }
      if (res.warnings.length) {
        L.push("## Notices");
        L.push("");
        for (const w of res.warnings) L.push(`- ${w}`);
        L.push("");
      }
      if (res.unknown && (res.unknown.files || res.unknown.mcpServers)) {
        L.push("## Not covered by this skill version");
        L.push("");
        L.push(`${res.unknown.files} config file(s) and ${res.unknown.mcpServers} MCP server(s) are not recognised yet.`);
        L.push(`Logged to \`${res.unknown.path}\` (local, not committed) so you can extend the skill.`);
        if (res.unknown.sample && res.unknown.sample.length) L.push(`Examples: ${res.unknown.sample.join(", ")}`);
        if (res.unknown.mcpSample && res.unknown.mcpSample.length) L.push(`Unknown MCP: ${res.unknown.mcpSample.join(", ")}`);
        L.push("");
      }
      const passed = res.items.filter((r) => r.gating && r.status === "pass").map((r) => `\`${r.slug}\``);
      if (passed.length) {
        L.push(`## Passed (${passed.length})`);
        L.push("");
        L.push(passed.join(", "));
        L.push("");
      }
      if (c.needsChat || res.chat.reviewInChat.length) {
        L.push("---");
        L.push(`For the detailed report, run this in chat: "${res.chat.triggerPhrase}"`);
      }
      if (opts && opts.savedTo) L.push(`Result saved to ${opts.savedTo} (not committed).`);
      return L.join("\n") + "\n";
    }
    module2.exports = { renderMarkdown: renderMarkdown2 };
  }
});

// src/init.js
var require_init = __commonJS({
  "src/init.js"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var path2 = require("path");
    var readline = require("readline");
    var {
      loadConfig: loadConfig2,
      renderConfig,
      CONFIG_FILE: CONFIG_FILE2,
      wrap: wrap2,
      stackMatches: stackMatches2,
      normSkill: normSkill2,
      normOptional,
      normMcpValue,
      listOf,
      LEGACY_MCP
    } = require_config();
    var { detectStack: detectStack2, KNOWN_STACK } = require_stack();
    var { KNOWN_TOOLS } = require_tools();
    var { Repo: Repo2 } = require_repo();
    var { runScan, writeUnknownLog } = require_scan();
    function makeAsk() {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const queue = [];
      let waiter = null;
      let closed = false;
      rl.on("line", (l) => {
        if (waiter) {
          const w = waiter;
          waiter = null;
          w(l.trim());
        } else queue.push(l.trim());
      });
      rl.on("close", () => {
        closed = true;
        if (waiter) {
          const w = waiter;
          waiter = null;
          w("");
        }
      });
      const ask = (q) => {
        rl.setPrompt(q);
        rl.prompt();
        if (queue.length) return Promise.resolve(queue.shift());
        if (closed) return Promise.resolve("");
        return new Promise((res) => {
          waiter = res;
        });
      };
      return { ask, close: () => rl.close() };
    }
    function pairs(list) {
      return (list || []).map((s) => {
        const i = String(s).indexOf("=");
        return i < 0 ? [String(s), ""] : [String(s).slice(0, i), String(s).slice(i + 1)];
      });
    }
    function emptyModel(existing, detected) {
      return {
        source: existing.source,
        tools: existing.tools.length ? existing.tools.slice() : ["cursor"],
        stack: existing.stack.length ? existing.stack.slice() : detected,
        ci: existing.ci,
        optional: Object.assign({}, existing.optional),
        skills: Object.assign({}, existing.skills),
        projectSkills: Object.assign({}, existing.projectSkills),
        mcp: Object.assign({}, existing.mcp),
        projectMcp: Object.assign({}, existing.projectMcp),
        ignored: existing.errors.length ? [] : existing.ignored.map((e) => ({ slug: e.slug, reason: e.reason, expires: e.expires })),
        skillLocations: existing.skillLocations,
        extras: existing.extras
      };
    }
    function applyMigration(model) {
      for (const [slug, map] of Object.entries(LEGACY_MCP)) {
        if (!(slug in model.optional)) continue;
        const state = model.optional[slug];
        delete model.optional[slug];
        if (model.mcp[map.category] && model.mcp[map.category].mode !== "unset") continue;
        if (state === "required") model.mcp[map.category] = { mode: "providers", providers: [map.key] };
        else if (state === "off") model.mcp[map.category] = { mode: "off", providers: [] };
        else model.mcp[map.category] = { mode: "unset", providers: [] };
      }
    }
    function skillRec(scan, slug) {
      const def = (scan.onboardingSkills || []).find((s) => s.slug === slug) || scan.skillIndex && null;
      const kws = String(slug).split("-").filter((k) => k.length > 2);
      const hits = (scan.skillIndex || []).map((s) => {
        const hay = `${s.name} ${s.description}`.toLowerCase();
        return { s, score: kws.filter((k) => hay.includes(k)).length };
      }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
      const committed = hits.find((x) => x.s.scope === "repo" && x.s.committed);
      if (committed) return { value: committed.s.name, mode: "named", evidence: `found committed skill "${committed.s.name}"` };
      const personal = hits.find((x) => x.s.scope === "user");
      if (personal) return { value: "custom", mode: "custom", mapTo: personal.s.name, evidence: `found personal skill "${personal.s.name}"` };
      return { value: "custom", mode: "custom", evidence: null };
    }
    function buildPlan(opts) {
      const { catalog, model, scan } = opts;
      const questions = [];
      const push = (q) => questions.push(q);
      push({
        id: "tools",
        kind: "tools",
        prompt: "Which AI tools does this team use?",
        options: KNOWN_TOOLS.map((t) => ({ value: t, label: t })),
        multi: true,
        recommended: scan.tools,
        evidence: scan.tools.length ? `detected: ${scan.tools.join(", ")}` : null,
        current: model.tools
      });
      push({
        id: "stack",
        kind: "stack",
        prompt: "Technology stack for this project?",
        options: KNOWN_STACK.map((t) => ({ value: t, label: t })),
        multi: true,
        recommended: scan.stack,
        evidence: scan.stack.length ? `detected: ${scan.stack.join(", ")}` : null,
        current: model.stack
      });
      push({
        id: "ci",
        kind: "ci",
        prompt: "Will this project run the audit in CI?",
        options: [{ value: "yes", label: "yes" }, { value: "no", label: "no" }],
        recommended: scan.ciPresent || model.ci ? "yes" : "no",
        evidence: scan.ciPresent ? "CI config found in the repo" : null,
        current: model.ci ? "yes" : "no"
      });
      for (const cat of catalog.mcpCategories || []) {
        const found = scan.mcpByCategory[cat.key] && scan.mcpByCategory[cat.key].found || [];
        const cur = model.mcp[cat.key] || { mode: "unset", providers: [] };
        let recommended = "unset";
        if (found.length) recommended = found.join(",");
        else if (cat.defaultOff && !cat.defaultOff.some((t) => model.stack.includes(t) || scan.stack.includes(t))) recommended = "off";
        const askAgain = cur.mode === "off" && found.length;
        if (cur.mode === "providers" || cur.mode === "off" && !askAgain || cur.mode === "unset" && false) {
        }
        if ((cur.mode === "providers" || cur.mode === "off" && !askAgain) && !askAgain) {
          if (!askAgain) {
            push({
              id: `mcp:${cat.key}`,
              kind: "mcp",
              category: cat.key,
              prompt: `${cat.title}: which provider(s)?`,
              options: [
                ...cat.providers.map((p) => ({ value: p.key, label: p.title })),
                { value: "off", label: "off (not used)" },
                { value: "unset", label: "unset (decide later)" }
              ],
              multi: true,
              recommended,
              evidence: found.length ? `configured in repo: ${found.join(", ")}` : null,
              current: cur.mode === "providers" ? cur.providers.join(",") : cur.mode,
              decided: true,
              skipInteractive: !askAgain
            });
            continue;
          }
        }
        push({
          id: `mcp:${cat.key}`,
          kind: "mcp",
          category: cat.key,
          prompt: `${cat.title}: which provider(s)? (${cat.description})`,
          options: [
            ...cat.providers.map((p) => ({ value: p.key, label: `${p.title}${found.includes(p.key) ? " (found)" : ""}` })),
            { value: "off", label: "off (not used)" },
            { value: "unset", label: "unset (decide later)" }
          ],
          multi: true,
          recommended,
          evidence: found.length ? `configured in repo: ${found.join(", ")}` : askAgain ? `was off, but now found: ${found.join(", ")}` : null,
          current: cur.mode === "providers" ? cur.providers.join(",") : cur.mode,
          contradiction: askAgain
        });
      }
      for (const u of scan.unknownMcp || []) {
        const slug = u.name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "custom-mcp";
        if (model.projectMcp[slug] && model.projectMcp[slug].mode !== "unset") continue;
        push({
          id: `project-mcp:${slug}`,
          kind: "project-mcp",
          name: slug,
          prompt: `Unknown MCP server "${u.name}" in ${u.file}. Require it as a project MCP?`,
          options: [{ value: "yes", label: "yes, add as project_mcp" }, { value: "no", label: "no, only log it" }],
          recommended: u.committed ? "yes" : "no",
          evidence: `server "${u.name}" (${u.command || u.url || "no command"})`,
          match: u.name,
          description: `Project MCP server ${u.name}`
        });
      }
      const coverageSections = ["quality", "coding-standards", "process-standards", "code-review", "tooling", "best-practices", "agent-setup", "integrations"];
      for (const sec of catalog.sections.filter((s) => s.level === "optional" && coverageSections.includes(s.key))) {
        for (const it of catalog.items.filter((i) => i.section === sec.key && i.kind !== "mcp-provider" && stackMatches2(i.stack, model.stack))) {
          const cur = model.optional[it.slug] || "unset";
          const ev = (scan.evidence || []).find((e) => e.slug === it.slug);
          const askAgain = cur === "off" && ev;
          if (cur === "required" || cur === "off" && !askAgain) {
            push({
              id: `optional:${it.slug}`,
              kind: "optional",
              slug: it.slug,
              prompt: `${it.title}?`,
              options: [{ value: "required", label: "required" }, { value: "off", label: "off" }, { value: "unset", label: "unset" }],
              recommended: ev ? "required" : "unset",
              evidence: ev ? ev.detail : null,
              current: cur,
              decided: true,
              skipInteractive: !askAgain,
              section: sec.key
            });
            continue;
          }
          push({
            id: `optional:${it.slug}`,
            kind: "optional",
            slug: it.slug,
            prompt: `${it.title}: ${it.description}`,
            options: [{ value: "required", label: "required" }, { value: "off", label: "off" }, { value: "unset", label: "unset" }],
            recommended: ev ? "required" : "unset",
            evidence: ev ? ev.detail : askAgain ? `was off, but evidence found: ${ev.detail}` : null,
            current: cur,
            contradiction: Boolean(askAgain),
            section: sec.key
          });
        }
      }
      const onboard = catalog.skills.filter((s) => s.onboarding && stackMatches2(s.stack, model.stack));
      for (const sk of onboard) {
        if (sk.applies_dep) {
          const repo = new Repo2(opts.root);
          if (!repo.hasDep(sk.applies_dep)) continue;
        }
        const cur = model.skills[sk.slug];
        const curVal = cur ? cur.mode === "named" ? cur.name : cur.mode : "unset";
        if (cur && cur.mode !== "unset") {
          push({
            id: `skill:${sk.slug}`,
            kind: "skill",
            slug: sk.slug,
            prompt: `${sk.title}?`,
            options: [{ value: "custom", label: "any relevant skill" }, { value: "off", label: "off" }],
            recommended: skillRec(scan, sk.slug).value,
            evidence: null,
            current: curVal,
            decided: true,
            skipInteractive: true,
            onboarding: true
          });
          continue;
        }
        const rec = skillRec(scan, sk.slug);
        push({
          id: `skill:${sk.slug}`,
          kind: "skill",
          slug: sk.slug,
          prompt: `${sk.title}: ${sk.description}`,
          options: [
            { value: "custom", label: "any relevant skill (custom)" },
            { value: "off", label: "off" },
            { value: "unset", label: "unset" }
          ],
          recommended: rec.value,
          evidence: rec.evidence,
          mapTo: rec.mapTo || null,
          current: curVal,
          onboarding: true
        });
      }
      push({
        id: "project-skill-briefs",
        kind: "signals",
        prompt: "Chat: propose up to 3 project-specific skill briefs from these signals (or skip).",
        signals: scan.signals,
        recommended: null,
        skipInteractive: true
      });
      for (const miss of scan.missingStandards || []) {
        if (model.ignored.some((i) => i.slug === miss.slug)) continue;
        push({
          id: `missing:${miss.slug}`,
          kind: "missing",
          slug: miss.slug,
          prompt: `${miss.title} is missing (${miss.detail}). Is this intentional?`,
          options: [{ value: "ignore", label: "yes, intentionally missing (ignore in audit)" }, { value: "keep", label: "no, keep as an audit action item" }],
          recommended: "keep",
          evidence: miss.detail,
          template: miss.template,
          fix: miss.fix,
          notACheck: miss.notACheck
        });
      }
      return {
        skillVersion: opts.version,
        stack: scan.stack,
        tools: scan.tools,
        questions,
        unknown: { files: (scan.unknownFiles || []).length, mcpServers: (scan.unknownMcp || []).length },
        signals: scan.signals
      };
    }
    function applyAnswer(model, q, answer) {
      if (q.kind === "tools") model.tools = listOf(answer).filter((t) => KNOWN_TOOLS.includes(t));
      else if (q.kind === "stack") model.stack = listOf(answer).filter((t) => KNOWN_STACK.includes(t));
      else if (q.kind === "ci") model.ci = /^(y|yes|true|1)$/i.test(String(answer));
      else if (q.kind === "mcp") {
        const raw = String(answer).trim();
        if (/^off$/i.test(raw)) model.mcp[q.category] = { mode: "off", providers: [] };
        else if (/^unset$/i.test(raw) || raw === "") model.mcp[q.category] = { mode: "unset", providers: [] };
        else model.mcp[q.category] = normMcpValue(raw);
      } else if (q.kind === "project-mcp") {
        if (/^(y|yes)$/i.test(String(answer))) {
          model.projectMcp[q.name] = { match: q.match || q.name, description: q.description || "", mode: "required" };
        }
      } else if (q.kind === "optional") {
        const n = normOptional(answer);
        model.optional[q.slug] = n || "unset";
      } else if (q.kind === "skill") {
        model.skills[q.slug] = normSkill2(answer);
      } else if (q.kind === "missing") {
        if (/^ignore$/i.test(String(answer))) {
          if (!model.ignored.some((i) => i.slug === q.slug)) {
            model.ignored.push({ slug: q.slug, reason: "intentionally not used", expires: null });
          }
        }
      }
    }
    function applyRecommended(model, plan) {
      for (const q of plan.questions) {
        if (q.skipInteractive && !q.contradiction) continue;
        if (q.recommended == null || q.kind === "signals") continue;
        applyAnswer(model, q, q.recommended);
      }
    }
    async function askPlan(model, plan, log) {
      const { ask, close } = makeAsk();
      const maps = [];
      try {
        log("");
        log("AI SDLC onboarding (init). Press Enter to accept the recommendation in [brackets].");
        for (const q of plan.questions) {
          if (q.skipInteractive && !q.contradiction) continue;
          if (q.kind === "signals") continue;
          log("");
          log(`== ${q.id} ==`);
          log(q.prompt);
          if (q.evidence) log(`    Evidence: ${q.evidence}`);
          for (const l of wrap2(`Options: ${q.options.map((o) => o.label).join(" | ")}`, 96, "    ")) log(l);
          const rec = q.recommended == null ? q.current || "" : q.recommended;
          const a = await ask(`    Answer [${rec}]: `);
          const value = a === "" ? rec : a;
          applyAnswer(model, q, value);
          if (q.kind === "skill" && q.mapTo && (value === "custom" || value === "y" || value === "")) {
            maps.push({ slug: q.slug, name: q.mapTo });
          }
        }
      } finally {
        close();
      }
      return maps;
    }
    async function runInit2(opts) {
      const { root, catalog, version, flags, interactive, log } = opts;
      const existing = loadConfig2(root);
      if (existing.exists && existing.errors.length && !flags.force) {
        return { error: `${CONFIG_FILE2} has problems; fix them by hand or re-run with --force to rewrite it:
  - ${existing.errors.join("\n  - ")}` };
      }
      const repo = new Repo2(root);
      const detected = detectStack2(repo);
      const model = emptyModel(existing, detected);
      applyMigration(model);
      const problems = [];
      for (const cat of catalog.mcpCategories || []) {
        if (!model.mcp[cat.key]) model.mcp[cat.key] = { mode: "unset", providers: [] };
      }
      const scan = runScan({ root, catalog, skillDir: opts.skillDir || path2.resolve(__dirname, ".."), config: Object.assign({}, existing, model) });
      writeUnknownLog(root, scan, version);
      if (flags.plan) {
        const plan2 = buildPlan({ catalog, model, scan, version, root });
        return { plan: plan2, scan, model, existed: existing.exists };
      }
      if (flags.tools !== void 0) {
        model.tools = listOf(flags.tools);
        for (const t of model.tools) if (!KNOWN_TOOLS.includes(t)) problems.push(`unknown tool "${t}" (known: ${KNOWN_TOOLS.join(", ")})`);
      } else if (!existing.tools.length) {
        model.tools = scan.tools.slice();
      }
      if (flags.stack !== void 0) {
        model.stack = listOf(flags.stack);
        for (const t of model.stack) if (!KNOWN_STACK.includes(t)) problems.push(`unknown stack tag "${t}" (known: ${KNOWN_STACK.join(", ")})`);
      } else if (!existing.stack.length) {
        model.stack = scan.stack.slice();
      }
      if (flags.ci) model.ci = true;
      const itemSlugs = new Set(catalog.items.filter((i) => i.kind !== "mcp-provider").map((i) => i.slug));
      for (const s of listOf(flags.require)) {
        if (itemSlugs.has(s)) model.optional[s] = "required";
        else problems.push(`--require: unknown optional check "${s}"`);
      }
      for (const s of listOf(flags.off)) {
        if (itemSlugs.has(s)) model.optional[s] = "off";
        else problems.push(`--off: unknown optional check "${s}"`);
      }
      const skillSlugs = new Set(catalog.skills.map((s) => s.slug));
      for (const [slug, v] of pairs(flags.skill)) {
        if (skillSlugs.has(slug)) model.skills[slug] = normSkill2(v === "" ? "unset" : v);
        else problems.push(`--skill: unknown skill "${slug}" (for your own skills use --project-skill)`);
      }
      for (const [slug, v] of pairs(flags["project-skill"])) {
        model.projectSkills[slug] = Object.assign({}, model.projectSkills[slug] || {}, normSkill2(v === "" ? "custom" : v));
      }
      for (const [slug, v] of pairs(flags.describe)) {
        if (model.projectSkills[slug]) model.projectSkills[slug].description = v;
        else problems.push(`--describe: "${slug}" is not a project skill (add it with --project-skill first)`);
      }
      for (const [cat, v] of pairs(flags.mcp)) {
        if (!(catalog.mcpCategories || []).some((c) => c.key === cat)) problems.push(`--mcp: unknown category "${cat}"`);
        else model.mcp[cat] = normMcpValue(v);
      }
      for (const [name, v] of pairs(flags["project-mcp"])) {
        if (v === "off" || v === "n") model.projectMcp[name] = { match: name, description: "", mode: "off" };
        else model.projectMcp[name] = { match: v || name, description: "", mode: "required" };
      }
      for (const [slug, reason] of pairs(flags.ignore)) {
        const r = reason || "intentionally not used";
        const existingIgn = model.ignored.find((i) => i.slug === slug);
        if (existingIgn) existingIgn.reason = r;
        else model.ignored.push({ slug, reason: r, expires: null });
      }
      const plan = buildPlan({ catalog, model, scan, version, root });
      if (flags["accept-recommended"]) applyRecommended(model, plan);
      if (problems.length) return { error: problems.join("\n") };
      let maps = [];
      if (interactive && !flags["accept-recommended"]) {
        maps = await askPlan(model, plan, log);
      } else if (!flags.yes && !flags["accept-recommended"] && !Object.keys(flags).some((k) => ["tools", "stack", "require", "off", "skill", "mcp", "project-mcp", "project-skill", "ignore", "ci"].includes(k))) {
      }
      for (const cat of catalog.mcpCategories || []) {
        if (!model.mcp[cat.key]) model.mcp[cat.key] = { mode: "unset", providers: [] };
      }
      fs2.writeFileSync(path2.join(root, CONFIG_FILE2), renderConfig(model, catalog, version));
      writeUnknownLog(root, scan, version);
      for (const m of maps) {
        try {
          localSetMapping(root, m.slug, m.name);
        } catch (e) {
        }
      }
      return {
        model,
        existed: existing.exists,
        hadVersion: Boolean(existing.version),
        previousVersion: existing.version,
        detected,
        scan,
        plan,
        maps
      };
    }
    function localSetMapping(root, slug, name) {
      const local2 = require_local();
      local2.setMapping(root, slug, name);
    }
    module2.exports = { runInit: runInit2, buildPlan, applyRecommended };
  }
});

// src/cli.js
var fs = require("fs");
var path = require("path");
var { loadCatalog } = require_catalog();
var { loadConfig, CONFIG_FILE, wrap, stackMatches, normSkill, providerRequired } = require_config();
var { runAudit, TRIGGER_PHRASE } = require_engine();
var { renderMarkdown } = require_report();
var { runInit } = require_init();
var { Repo } = require_repo();
var { detectStack } = require_stack();
var { indexSkills } = require_skills();
var local = require_local();
var semver = require_semver();
var tools = require_tools();
var SKILL_DIR = path.resolve(__dirname, "..");
var VERSION = JSON.parse(fs.readFileSync(path.join(SKILL_DIR, "package.json"), "utf8")).version;
var VALUE_FLAGS = /* @__PURE__ */ new Set(["root", "format", "tools", "stack", "require", "off", "skill", "project-skill", "describe", "mode", "mcp", "project-mcp", "ignore"]);
var REPEAT_FLAGS = /* @__PURE__ */ new Set(["skill", "project-skill", "describe", "mcp", "project-mcp", "ignore"]);
function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x.startsWith("--")) {
      const eq = x.indexOf("=");
      const k = eq < 0 ? x.slice(2) : x.slice(2, eq);
      const inline = eq < 0 ? void 0 : x.slice(eq + 1);
      if (VALUE_FLAGS.has(k)) {
        const v = inline !== void 0 ? inline : argv[++i];
        if (REPEAT_FLAGS.has(k)) (a[k] = a[k] || []).push(v);
        else a[k] = v;
      } else a[k] = true;
    } else a._.push(x);
  }
  return a;
}
var HELP = `ai-sdlc-onboarding v${VERSION}: is this project ready for AI-assisted development?

Usage: node <skill-folder>/scripts/ai-sdlc-onboarding.cjs <command> [options]

Commands
  init                 Onboard / create or update .ai-sdlc.yaml (scans the repo, asks with recommendations)
  audit                Check the project against .ai-sdlc.yaml, print the report, save it to .ai-sdlc/reports/
  list                 Show every check/skill slug with its current state
  explain <slug>       Show what a check or skill means, how it is detected and how to fix it
  map <slug>=<name>    Remember which skill YOU use for a "custom" skill (personal, not committed)
  map <slug> --remove  Forget that mapping

Common options
  --root <dir>         Project folder (default: current folder)
  --ci                 audit: CI mode, configuration only (also when CI=true or CI=1). On init, sets ci: true in the config instead.
  --format json        Machine-readable output (audit, list, init --plan)
  --no-save            audit: do not write .ai-sdlc/reports/
  --all                audit: also evaluate optional checks still unset. They do not affect the score or verdict. off stays skipped.

init options (for scripts and agents; skip the questions)
  --yes                Do not ask questions; keep existing answers, mark new items "unset"
  --plan               Print the question plan (use with --format json for chat onboarding)
  --accept-recommended Apply every recommendation from the scan without asking
  --interactive        Ask questions even when not attached to a terminal
  --tools a,b          cursor, claude-code
  --stack a,b          node, typescript, react, python, django
  --require slug,slug  Mark optional checks as required
  --off slug,slug      Mark optional checks as not used
  --mcp cat=provider[,provider]|off|unset   (repeatable)
  --project-mcp name=match   Require an unknown MCP server (repeatable)
  --skill slug=value   value: y | n | custom | off | <skill-name>   (repeatable)
  --project-skill slug=value   Add a project-specific skill (repeatable); describe it with
  --describe slug=text
  --ignore slug=reason Mark a check as intentionally skipped
  --ci                 Set ci: true (this project runs the audit in CI). This is not audit's CI mode.
  --force              Rewrite a config that has errors

Exit codes: 0 ready, 1 not ready, 2 usage/config problem.
`;
function cliHint(root) {
  const bundle = process.argv[1] ? path.resolve(process.argv[1]) : path.join(SKILL_DIR, "scripts", "ai-sdlc-onboarding.cjs");
  const rel = path.relative(root, bundle);
  return `node ${rel.startsWith("..") ? bundle : rel}`;
}
function out(s) {
  process.stdout.write(s + "\n");
}
function err(s) {
  process.stderr.write(s + "\n");
}
function handshake(configVersion, installed) {
  const c = semver.cmp(installed, configVersion);
  if (c === null) return { ok: false, msg: `Cannot compare skill version "${installed}" with config version "${configVersion}".` };
  if (c === 0) return { ok: true };
  const upd = `git -C ${SKILL_DIR} fetch --tags && git -C ${SKILL_DIR} checkout v${configVersion}`;
  if (c < 0) return { ok: false, msg: `${CONFIG_FILE} was created with skill v${configVersion} but v${installed} is installed.
Update the skill to match:
  ${upd}` };
  if (semver.parse(installed)[0] !== semver.parse(configVersion)[0]) {
    return { ok: false, msg: `${CONFIG_FILE} was created with skill v${configVersion}; installed v${installed} is a new major version.
Run init to migrate the config (your answers are kept).` };
  }
  return { ok: true, newer: true };
}
function pickMode(args) {
  if (args.mode === "ci" || args.mode === "local") return args.mode;
  if (args.ci) return "ci";
  return /^(true|1)$/i.test(process.env.CI || "") ? "ci" : "local";
}
function stateOf(config, slug) {
  return config.optional[slug] || "unset";
}
function skillState(config, slug) {
  const s = config.skills[slug] || config.projectSkills[slug];
  if (!s) return "unset";
  return s.mode === "named" ? s.name : s.mode;
}
function mcpState(config, cat) {
  const v = config.mcp[cat];
  if (!v) return "unset";
  if (v.mode === "providers") return v.providers.join(",");
  return v.mode;
}
async function main(argv) {
  const args = parseArgs(argv);
  const cmd = args._[0] || (args.version ? "version" : "help");
  const root = path.resolve(args.root || process.cwd());
  const hint = cliHint(root);
  if (cmd === "help" || args.help) {
    out(HELP);
    return 0;
  }
  if (cmd === "version" || args.version) {
    out(VERSION);
    return 0;
  }
  if (!fs.existsSync(root)) {
    err(`Folder not found: ${root}`);
    return 2;
  }
  const catalog = loadCatalog(SKILL_DIR);
  if (cmd === "init") {
    const interactive = Boolean(args.interactive) || !args.yes && !args.plan && !args["accept-recommended"] && process.stdin.isTTY && process.stdout.isTTY;
    const res = await runInit({ root, catalog, version: VERSION, flags: args, interactive, log: out, skillDir: SKILL_DIR });
    if (res.error) {
      err(res.error);
      return 2;
    }
    if (args.plan) {
      if (args.format === "json") out(JSON.stringify(res.plan, null, 2));
      else {
        out(`Init plan (${res.plan.questions.length} questions)`);
        for (const q of res.plan.questions) {
          if (q.skipInteractive) continue;
          out(`- ${q.id}: ${q.prompt}  [rec: ${q.recommended}]`);
        }
      }
      return 0;
    }
    const c = loadConfig(root);
    const req = Object.values(c.optional).filter((v) => v === "required").length;
    const sk = Object.values(Object.assign({}, c.skills, c.projectSkills)).filter((v) => v.mode === "custom" || v.mode === "named").length;
    const mcpOn = Object.values(c.mcp).filter((v) => v.mode === "providers").length;
    out("");
    out(`${res.existed ? "Updated" : "Created"} ${CONFIG_FILE} (skill v${VERSION}).`);
    out(`  stack: ${c.stack.join(", ") || "none"} | tools: ${c.tools.join(", ") || "all"} | CI: ${c.ci ? "yes" : "no"}`);
    out(`  mcp categories set: ${mcpOn} | optional checks required: ${req} | skills required: ${sk}`);
    if (res.scan && (res.scan.unknownFiles.length || res.scan.unknownMcp.length)) {
      out(`  unknown configs logged: ${res.scan.unknownFiles.length} file(s), ${res.scan.unknownMcp.length} MCP server(s) \u2192 .ai-sdlc/unknown-configs.json`);
    }
    out("");
    out("Next:");
    out(`  1. Review ${CONFIG_FILE}; it is commented and safe to edit by hand.`);
    out(`  2. Commit it. It is what other machines and CI are checked against.`);
    out(`  3. Run the audit: ${hint} audit`);
    if (c.ci) out("  4. CI: copy assets/ci-github-actions.yml from the skill into .github/workflows/");
    return 0;
  }
  if (cmd === "map") {
    const target = args._[1];
    if (!target) {
      err("Usage: map <slug>=<skill-name>   or   map <slug> --remove");
      return 2;
    }
    const eq = target.indexOf("=");
    const slug = eq < 0 ? target : target.slice(0, eq);
    const name = eq < 0 ? "" : target.slice(eq + 1);
    const known = /* @__PURE__ */ new Set([...catalog.skills.map((s) => s.slug), ...Object.keys(loadConfig(root).projectSkills)]);
    if (!known.has(slug)) {
      err(`Unknown skill slug "${slug}". Run "list" to see valid slugs.`);
      return 2;
    }
    if (!args.remove && !name) {
      err("Usage: map <slug>=<skill-name>");
      return 2;
    }
    local.setMapping(root, slug, args.remove ? null : name);
    out(args.remove ? `Removed mapping for ${slug}.` : `Mapped ${slug} -> ${name} (stored in .ai-sdlc/local.yaml, not committed).`);
    return 0;
  }
  if (cmd === "explain") {
    const slug = args._[1];
    const chk = catalog.checks.find((c) => c.slug === slug);
    const item = catalog.items.find((i) => i.slug === slug || i.key === slug);
    const sk = catalog.skills.find((s) => s.slug === slug);
    const cat = (catalog.mcpCategories || []).find((c) => c.key === slug);
    if (!chk && !item && !sk && !cat) {
      err(`Unknown slug "${slug}". Run "list".`);
      return 2;
    }
    const fill = (t) => String(t || "").replace(/\{\{skill_dir\}\}/g, SKILL_DIR);
    if (chk) {
      out(`${chk.slug}: ${chk.title}`);
      out(`  section: ${chk.section} | level: ${chk.level} | tier: ${chk.tier} | scope: ${chk.scope}${chk.soft ? " | heuristic (warns only)" : ""} | since v${chk.since}`);
      if (chk.group) out(`  part of optional item: ${chk.group}`);
      out(`  why: ${chk.why}`);
      out(`  detection: ${chk.tier === "chat" ? "chat only: " + (chk.chat_note || "") : JSON.stringify(chk.detect)}`);
      out("  fix:");
      out(fill(chk.fix).trim().split("\n").map((l) => "    " + l).join("\n"));
    } else if (cat) {
      out(`${cat.key}: ${cat.title} (MCP category)`);
      out(`  ${cat.description}`);
      out(`  providers: ${cat.providers.map((p) => p.key).join(", ")}`);
    } else if (item) {
      out(`${item.slug}: ${item.title} (${item.kind}, section ${item.section})`);
      out(`  ${item.description}`);
      out(`  includes checks: ${item.checks.join(", ")}`);
      if (item.setup) out(`  setup guide: ${path.join(SKILL_DIR, item.setup)}`);
    } else {
      out(`${sk.slug}: ${sk.title} (skill, ${sk.group}${sk.onboarding ? ", onboarding" : ""})`);
      out(`  ${sk.description}`);
      out("  values in .ai-sdlc.yaml: custom (any relevant skill) | <skill-name> | off | unset");
    }
    return 0;
  }
  if (cmd === "list") {
    const config = loadConfig(root);
    const repo = new Repo(root);
    const detected = detectStack(repo);
    const stack = config.stack.length ? config.stack : detected;
    if (args.format === "json") {
      out(JSON.stringify({
        skillVersion: VERSION,
        skillDir: SKILL_DIR,
        cli: hint,
        triggerPhrase: TRIGGER_PHRASE,
        configExists: config.exists,
        configVersion: config.version,
        detectedStack: detected,
        stack,
        tools: config.tools,
        ci: config.ci,
        mcp: Object.fromEntries((catalog.mcpCategories || []).map((c) => [c.key, mcpState(config, c.key)])),
        projectMcp: config.projectMcp,
        optionalItems: catalog.items.filter((i) => i.kind !== "mcp-provider").map((i) => ({ slug: i.slug, title: i.title, description: i.description, section: i.section, applicable: stackMatches(i.stack, stack), state: stateOf(config, i.slug) })),
        mcpProviders: (catalog.mcpProviders || []).map((p) => ({ key: p.key, slug: p.slug, category: p.category, title: p.title, required: providerRequired(config, catalog, p.slug) })),
        skills: catalog.skills.map((s) => ({ slug: s.slug, title: s.title, description: s.description, group: s.group, onboarding: Boolean(s.onboarding), applicable: stackMatches(s.stack, stack), state: skillState(config, s.slug) })),
        projectSkills: Object.entries(config.projectSkills).map(([slug, v]) => ({ slug, description: v.description, state: skillState(config, slug) })),
        mustChecks: catalog.checks.filter((c) => c.level === "must").map((c) => ({ slug: c.slug, title: c.title, section: c.section, tier: c.tier, scope: c.scope })),
        skillIndex: indexSkills(repo, config),
        localMappings: local.readLocal(root).skill_mappings
      }, null, 2));
      return 0;
    }
    for (const sec of catalog.sections) {
      out(`
${sec.title}  [${sec.level === "must" ? "always checked" : "optional"}]`);
      if (sec.kind === "skills") {
        for (const s of catalog.skills.filter((x) => x.section === sec.key)) out(`  ${s.slug.padEnd(34)} ${skillState(config, s.slug).padEnd(10)} ${s.title}${s.onboarding ? " *" : ""}`);
      } else if (sec.key === "integrations") {
        for (const c of catalog.mcpCategories || []) out(`  mcp.${c.key.padEnd(28)} ${mcpState(config, c.key).padEnd(10)} ${c.title}`);
        for (const i of catalog.items.filter((x) => x.section === sec.key && x.kind !== "mcp-provider")) out(`  ${i.slug.padEnd(34)} ${stateOf(config, i.slug).padEnd(10)} ${i.title}`);
      } else if (sec.level === "optional") {
        for (const i of catalog.items.filter((x) => x.section === sec.key)) out(`  ${i.slug.padEnd(34)} ${stateOf(config, i.slug).padEnd(10)} ${i.title}`);
      } else {
        for (const c of catalog.checks.filter((x) => x.section === sec.key)) out(`  ${c.slug.padEnd(34)} ${(c.scope === "local" ? "local" : c.tier).padEnd(10)} ${c.title}`);
      }
    }
    return 0;
  }
  if (cmd === "audit") {
    const config = loadConfig(root);
    if (!config.exists) {
      err(`This project has not been initialised: ${CONFIG_FILE} was not found.
Run init first:
  ${hint} init`);
      return 2;
    }
    if (config.errors.length) {
      err(`${CONFIG_FILE} has problems:
  - ${config.errors.join("\n  - ")}
Fix them, or run: ${hint} init --force`);
      return 2;
    }
    if (!config.version) {
      err(`${CONFIG_FILE} has no skill.version, so it was not created by init.
Run: ${hint} init   (your existing answers are kept)`);
      return 2;
    }
    const hs = handshake(config.version, VERSION);
    if (!hs.ok) {
      err(hs.msg);
      return 2;
    }
    const mode = pickMode(args);
    const now = /* @__PURE__ */ new Date();
    const res = runAudit({ root, config, catalog, mode, skillVersion: VERSION, skillDir: SKILL_DIR, all: Boolean(args.all), now, cliHint: hint });
    if (hs.newer) res.warnings.push(`skill v${VERSION} is newer than config v${config.version}: checks whose since version is newer warn instead of fail until you re-run init.`);
    if (mode === "ci" && !config.ci) res.warnings.push('running in CI mode although "ci" is false in .ai-sdlc.yaml');
    let savedTo = null;
    if (!args["no-save"]) {
      try {
        savedTo = local.saveReport(root, res, now);
      } catch (e) {
        res.warnings.push(`could not save the report: ${e.message}`);
      }
    }
    if (args.format === "json") out(JSON.stringify(Object.assign({ savedTo }, res), null, 2));
    else process.stdout.write(renderMarkdown(res, { skillDir: SKILL_DIR, savedTo }));
    return res.verdict.ready ? 0 : 1;
  }
  err(`Unknown command "${cmd}".
`);
  err(HELP);
  return 2;
}
main(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
}, (e) => {
  err(`Unexpected error: ${e && e.stack ? e.stack : e}`);
  process.exitCode = 2;
});
