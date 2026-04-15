"use strict";

(function (f) {
  if (typeof exports === "object" && typeof module !== "undefined") {
    module.exports = f();
  } else if (typeof define === "function" && define.amd) {
    define([], f);
  } else {
    var g;
    if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      g = this;
    }
    g.retoldDataBeacon = f();
  }
})(function () {
  var define, module, exports;
  return function () {
    function r(e, n, t) {
      function o(i, f) {
        if (!n[i]) {
          if (!e[i]) {
            var c = "function" == typeof require && require;
            if (!f && c) return c(i, !0);
            if (u) return u(i, !0);
            var a = new Error("Cannot find module '" + i + "'");
            throw a.code = "MODULE_NOT_FOUND", a;
          }
          var p = n[i] = {
            exports: {}
          };
          e[i][0].call(p.exports, function (r) {
            var n = e[i][1][r];
            return o(n || r);
          }, p, p.exports, r, e, n, t);
        }
        return n[i].exports;
      }
      for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
      return o;
    }
    return r;
  }()({
    1: [function (require, module, exports) {
      module.exports = {
        "name": "fable-serviceproviderbase",
        "version": "3.0.19",
        "description": "Simple base classes for fable services.",
        "main": "source/Fable-ServiceProviderBase.js",
        "scripts": {
          "start": "node source/Fable-ServiceProviderBase.js",
          "test": "npx quack test",
          "tests": "npx quack test -g",
          "coverage": "npx quack coverage",
          "build": "npx quack build",
          "types": "tsc -p ./tsconfig.build.json",
          "check": "tsc -p . --noEmit"
        },
        "types": "types/source/Fable-ServiceProviderBase.d.ts",
        "mocha": {
          "diff": true,
          "extension": ["js"],
          "package": "./package.json",
          "reporter": "spec",
          "slow": "75",
          "timeout": "5000",
          "ui": "tdd",
          "watch-files": ["source/**/*.js", "test/**/*.js"],
          "watch-ignore": ["lib/vendor"]
        },
        "repository": {
          "type": "git",
          "url": "https://github.com/stevenvelozo/fable-serviceproviderbase.git"
        },
        "keywords": ["entity", "behavior"],
        "author": "Steven Velozo <steven@velozo.com> (http://velozo.com/)",
        "license": "MIT",
        "bugs": {
          "url": "https://github.com/stevenvelozo/fable-serviceproviderbase/issues"
        },
        "homepage": "https://github.com/stevenvelozo/fable-serviceproviderbase",
        "devDependencies": {
          "@types/mocha": "^10.0.10",
          "fable": "^3.1.62",
          "quackage": "^1.0.58",
          "typescript": "^5.9.3"
        }
      };
    }, {}],
    2: [function (require, module, exports) {
      /**
      * Fable Service Base
      * @author <steven@velozo.com>
      */

      const libPackage = require('../package.json');
      class FableServiceProviderBase {
        /**
         * The constructor can be used in two ways:
         * 1) With a fable, options object and service hash (the options object and service hash are optional)a
         * 2) With an object or nothing as the first parameter, where it will be treated as the options object
         *
         * @param {import('fable')|Record<string, any>} [pFable] - (optional) The fable instance, or the options object if there is no fable
         * @param {Record<string, any>|string} [pOptions] - (optional) The options object, or the service hash if there is no fable
         * @param {string} [pServiceHash] - (optional) The service hash to identify this service instance
         */
        constructor(pFable, pOptions, pServiceHash) {
          /** @type {import('fable')} */
          this.fable;
          /** @type {string} */
          this.UUID;
          /** @type {Record<string, any>} */
          this.options;
          /** @type {Record<string, any>} */
          this.services;
          /** @type {Record<string, any>} */
          this.servicesMap;

          // Check if a fable was passed in; connect it if so
          if (typeof pFable === 'object' && pFable.isFable) {
            this.connectFable(pFable);
          } else {
            this.fable = false;
          }

          // Initialize the services map if it wasn't passed in
          /** @type {Record<string, any>} */
          this._PackageFableServiceProvider = libPackage;

          // initialize options and UUID based on whether the fable was passed in or not.
          if (this.fable) {
            this.UUID = pFable.getUUID();
            this.options = typeof pOptions === 'object' ? pOptions : {};
          } else {
            // With no fable, check to see if there was an object passed into either of the first two
            // Parameters, and if so, treat it as the options object
            this.options = typeof pFable === 'object' && !pFable.isFable ? pFable : typeof pOptions === 'object' ? pOptions : {};
            this.UUID = `CORE-SVC-${Math.floor(Math.random() * (99999 - 10000) + 10000)}`;
          }

          // It's expected that the deriving class will set this
          this.serviceType = `Unknown-${this.UUID}`;

          // The service hash is used to identify the specific instantiation of the service in the services map
          this.Hash = typeof pServiceHash === 'string' ? pServiceHash : !this.fable && typeof pOptions === 'string' ? pOptions : `${this.UUID}`;
        }

        /**
         * @param {import('fable')} pFable
         */
        connectFable(pFable) {
          if (typeof pFable !== 'object' || !pFable.isFable) {
            let tmpErrorMessage = `Fable Service Provider Base: Cannot connect to Fable, invalid Fable object passed in.  The pFable parameter was a [${typeof pFable}].}`;
            console.log(tmpErrorMessage);
            return new Error(tmpErrorMessage);
          }
          if (!this.fable) {
            this.fable = pFable;
          }
          if (!this.log) {
            this.log = this.fable.Logging;
          }
          if (!this.services) {
            this.services = this.fable.services;
          }
          if (!this.servicesMap) {
            this.servicesMap = this.fable.servicesMap;
          }
          return true;
        }
        static isFableService = true;
      }
      module.exports = FableServiceProviderBase;

      // This is left here in case we want to go back to having different code/base class for "core" services
      module.exports.CoreServiceProviderBase = FableServiceProviderBase;
    }, {
      "../package.json": 1
    }],
    3: [function (require, module, exports) {
      !function (t, n) {
        "object" == typeof exports && "object" == typeof module ? module.exports = n() : "function" == typeof define && define.amd ? define("Navigo", [], n) : "object" == typeof exports ? exports.Navigo = n() : t.Navigo = n();
      }("undefined" != typeof self ? self : this, function () {
        return function () {
          "use strict";

          var t = {
              407: function (t, n, e) {
                e.d(n, {
                  default: function () {
                    return N;
                  }
                });
                var o = /([:*])(\w+)/g,
                  r = /\*/g,
                  i = /\/\?/g;
                function a(t) {
                  return void 0 === t && (t = "/"), v() ? location.pathname + location.search + location.hash : t;
                }
                function s(t) {
                  return t.replace(/\/+$/, "").replace(/^\/+/, "");
                }
                function c(t) {
                  return "string" == typeof t;
                }
                function u(t) {
                  return t && t.indexOf("#") >= 0 && t.split("#").pop() || "";
                }
                function h(t) {
                  var n = s(t).split(/\?(.*)?$/);
                  return [s(n[0]), n.slice(1).join("")];
                }
                function f(t) {
                  for (var n = {}, e = t.split("&"), o = 0; o < e.length; o++) {
                    var r = e[o].split("=");
                    if ("" !== r[0]) {
                      var i = decodeURIComponent(r[0]);
                      n[i] ? (Array.isArray(n[i]) || (n[i] = [n[i]]), n[i].push(decodeURIComponent(r[1] || ""))) : n[i] = decodeURIComponent(r[1] || "");
                    }
                  }
                  return n;
                }
                function l(t, n) {
                  var e,
                    a = h(s(t.currentLocationPath)),
                    l = a[0],
                    p = a[1],
                    d = "" === p ? null : f(p),
                    v = [];
                  if (c(n.path)) {
                    if (e = "(?:/^|^)" + s(n.path).replace(o, function (t, n, e) {
                      return v.push(e), "([^/]+)";
                    }).replace(r, "?(?:.*)").replace(i, "/?([^/]+|)") + "$", "" === s(n.path) && "" === s(l)) return {
                      url: l,
                      queryString: p,
                      hashString: u(t.to),
                      route: n,
                      data: null,
                      params: d
                    };
                  } else e = n.path;
                  var g = new RegExp(e, ""),
                    m = l.match(g);
                  if (m) {
                    var y = c(n.path) ? function (t, n) {
                      return 0 === n.length ? null : t ? t.slice(1, t.length).reduce(function (t, e, o) {
                        return null === t && (t = {}), t[n[o]] = decodeURIComponent(e), t;
                      }, null) : null;
                    }(m, v) : m.groups ? m.groups : m.slice(1);
                    return {
                      url: s(l.replace(new RegExp("^" + t.instance.root), "")),
                      queryString: p,
                      hashString: u(t.to),
                      route: n,
                      data: y,
                      params: d
                    };
                  }
                  return !1;
                }
                function p() {
                  return !("undefined" == typeof window || !window.history || !window.history.pushState);
                }
                function d(t, n) {
                  return void 0 === t[n] || !0 === t[n];
                }
                function v() {
                  return "undefined" != typeof window;
                }
                function g(t, n) {
                  return void 0 === t && (t = []), void 0 === n && (n = {}), t.filter(function (t) {
                    return t;
                  }).forEach(function (t) {
                    ["before", "after", "already", "leave"].forEach(function (e) {
                      t[e] && (n[e] || (n[e] = []), n[e].push(t[e]));
                    });
                  }), n;
                }
                function m(t, n, e) {
                  var o = n || {},
                    r = 0;
                  !function n() {
                    t[r] ? Array.isArray(t[r]) ? (t.splice.apply(t, [r, 1].concat(t[r][0](o) ? t[r][1] : t[r][2])), n()) : t[r](o, function (t) {
                      void 0 === t || !0 === t ? (r += 1, n()) : e && e(o);
                    }) : e && e(o);
                  }();
                }
                function y(t, n) {
                  void 0 === t.currentLocationPath && (t.currentLocationPath = t.to = a(t.instance.root)), t.currentLocationPath = t.instance._checkForAHash(t.currentLocationPath), n();
                }
                function _(t, n) {
                  for (var e = 0; e < t.instance.routes.length; e++) {
                    var o = l(t, t.instance.routes[e]);
                    if (o && (t.matches || (t.matches = []), t.matches.push(o), "ONE" === t.resolveOptions.strategy)) return void n();
                  }
                  n();
                }
                function k(t, n) {
                  t.navigateOptions && (void 0 !== t.navigateOptions.shouldResolve && console.warn('"shouldResolve" is deprecated. Please check the documentation.'), void 0 !== t.navigateOptions.silent && console.warn('"silent" is deprecated. Please check the documentation.')), n();
                }
                function O(t, n) {
                  !0 === t.navigateOptions.force ? (t.instance._setCurrent([t.instance._pathToMatchObject(t.to)]), n(!1)) : n();
                }
                m.if = function (t, n, e) {
                  return Array.isArray(n) || (n = [n]), Array.isArray(e) || (e = [e]), [t, n, e];
                };
                var w = v(),
                  L = p();
                function b(t, n) {
                  if (d(t.navigateOptions, "updateBrowserURL")) {
                    var e = ("/" + t.to).replace(/\/\//g, "/"),
                      o = w && t.resolveOptions && !0 === t.resolveOptions.hash;
                    L ? (history[t.navigateOptions.historyAPIMethod || "pushState"](t.navigateOptions.stateObj || {}, t.navigateOptions.title || "", o ? "#" + e : e), location && location.hash && (t.instance.__freezeListening = !0, setTimeout(function () {
                      if (!o) {
                        var n = location.hash;
                        location.hash = "", location.hash = n;
                      }
                      t.instance.__freezeListening = !1;
                    }, 1))) : w && (window.location.href = t.to);
                  }
                  n();
                }
                function A(t, n) {
                  var e = t.instance;
                  e.lastResolved() ? m(e.lastResolved().map(function (n) {
                    return function (e, o) {
                      if (n.route.hooks && n.route.hooks.leave) {
                        var r = !1,
                          i = t.instance.matchLocation(n.route.path, t.currentLocationPath, !1);
                        r = "*" !== n.route.path ? !i : !(t.matches && t.matches.find(function (t) {
                          return n.route.path === t.route.path;
                        })), d(t.navigateOptions, "callHooks") && r ? m(n.route.hooks.leave.map(function (n) {
                          return function (e, o) {
                            return n(function (n) {
                              !1 === n ? t.instance.__markAsClean(t) : o();
                            }, t.matches && t.matches.length > 0 ? 1 === t.matches.length ? t.matches[0] : t.matches : void 0);
                          };
                        }).concat([function () {
                          return o();
                        }])) : o();
                      } else o();
                    };
                  }), {}, function () {
                    return n();
                  }) : n();
                }
                function P(t, n) {
                  d(t.navigateOptions, "updateState") && t.instance._setCurrent(t.matches), n();
                }
                var R = [function (t, n) {
                    var e = t.instance.lastResolved();
                    if (e && e[0] && e[0].route === t.match.route && e[0].url === t.match.url && e[0].queryString === t.match.queryString) return e.forEach(function (n) {
                      n.route.hooks && n.route.hooks.already && d(t.navigateOptions, "callHooks") && n.route.hooks.already.forEach(function (n) {
                        return n(t.match);
                      });
                    }), void n(!1);
                    n();
                  }, function (t, n) {
                    t.match.route.hooks && t.match.route.hooks.before && d(t.navigateOptions, "callHooks") ? m(t.match.route.hooks.before.map(function (n) {
                      return function (e, o) {
                        return n(function (n) {
                          !1 === n ? t.instance.__markAsClean(t) : o();
                        }, t.match);
                      };
                    }).concat([function () {
                      return n();
                    }])) : n();
                  }, function (t, n) {
                    d(t.navigateOptions, "callHandler") && t.match.route.handler(t.match), t.instance.updatePageLinks(), n();
                  }, function (t, n) {
                    t.match.route.hooks && t.match.route.hooks.after && d(t.navigateOptions, "callHooks") && t.match.route.hooks.after.forEach(function (n) {
                      return n(t.match);
                    }), n();
                  }],
                  S = [A, function (t, n) {
                    var e = t.instance._notFoundRoute;
                    if (e) {
                      t.notFoundHandled = !0;
                      var o = h(t.currentLocationPath),
                        r = o[0],
                        i = o[1],
                        a = u(t.to);
                      e.path = s(r);
                      var c = {
                        url: e.path,
                        queryString: i,
                        hashString: a,
                        data: null,
                        route: e,
                        params: "" !== i ? f(i) : null
                      };
                      t.matches = [c], t.match = c;
                    }
                    n();
                  }, m.if(function (t) {
                    return t.notFoundHandled;
                  }, R.concat([P]), [function (t, n) {
                    t.resolveOptions && !1 !== t.resolveOptions.noMatchWarning && void 0 !== t.resolveOptions.noMatchWarning || console.warn('Navigo: "' + t.currentLocationPath + "\" didn't match any of the registered routes."), n();
                  }, function (t, n) {
                    t.instance._setCurrent(null), n();
                  }])];
                function E() {
                  return (E = Object.assign || function (t) {
                    for (var n = 1; n < arguments.length; n++) {
                      var e = arguments[n];
                      for (var o in e) Object.prototype.hasOwnProperty.call(e, o) && (t[o] = e[o]);
                    }
                    return t;
                  }).apply(this, arguments);
                }
                function x(t, n) {
                  var e = 0;
                  A(t, function o() {
                    e !== t.matches.length ? m(R, E({}, t, {
                      match: t.matches[e]
                    }), function () {
                      e += 1, o();
                    }) : P(t, n);
                  });
                }
                function H(t) {
                  t.instance.__markAsClean(t);
                }
                function j() {
                  return (j = Object.assign || function (t) {
                    for (var n = 1; n < arguments.length; n++) {
                      var e = arguments[n];
                      for (var o in e) Object.prototype.hasOwnProperty.call(e, o) && (t[o] = e[o]);
                    }
                    return t;
                  }).apply(this, arguments);
                }
                var C = "[data-navigo]";
                function N(t, n) {
                  var e,
                    o = n || {
                      strategy: "ONE",
                      hash: !1,
                      noMatchWarning: !1,
                      linksSelector: C
                    },
                    r = this,
                    i = "/",
                    d = null,
                    w = [],
                    L = !1,
                    A = p(),
                    P = v();
                  function R(t) {
                    return t.indexOf("#") >= 0 && (t = !0 === o.hash ? t.split("#")[1] || "/" : t.split("#")[0]), t;
                  }
                  function E(t) {
                    return s(i + "/" + s(t));
                  }
                  function N(t, n, e, o) {
                    return t = c(t) ? E(t) : t, {
                      name: o || s(String(t)),
                      path: t,
                      handler: n,
                      hooks: g(e)
                    };
                  }
                  function U(t, n) {
                    if (!r.__dirty) {
                      r.__dirty = !0, t = t ? s(i) + "/" + s(t) : void 0;
                      var e = {
                        instance: r,
                        to: t,
                        currentLocationPath: t,
                        navigateOptions: {},
                        resolveOptions: j({}, o, n)
                      };
                      return m([y, _, m.if(function (t) {
                        var n = t.matches;
                        return n && n.length > 0;
                      }, x, S)], e, H), !!e.matches && e.matches;
                    }
                    r.__waiting.push(function () {
                      return r.resolve(t, n);
                    });
                  }
                  function q(t, n) {
                    if (r.__dirty) r.__waiting.push(function () {
                      return r.navigate(t, n);
                    });else {
                      r.__dirty = !0, t = s(i) + "/" + s(t);
                      var e = {
                        instance: r,
                        to: t,
                        navigateOptions: n || {},
                        resolveOptions: n && n.resolveOptions ? n.resolveOptions : o,
                        currentLocationPath: R(t)
                      };
                      m([k, O, _, m.if(function (t) {
                        var n = t.matches;
                        return n && n.length > 0;
                      }, x, S), b, H], e, H);
                    }
                  }
                  function F() {
                    if (P) return (P ? [].slice.call(document.querySelectorAll(o.linksSelector || C)) : []).forEach(function (t) {
                      "false" !== t.getAttribute("data-navigo") && "_blank" !== t.getAttribute("target") ? t.hasListenerAttached || (t.hasListenerAttached = !0, t.navigoHandler = function (n) {
                        if ((n.ctrlKey || n.metaKey) && "a" === n.target.tagName.toLowerCase()) return !1;
                        var e = t.getAttribute("href");
                        if (null == e) return !1;
                        if (e.match(/^(http|https)/) && "undefined" != typeof URL) try {
                          var o = new URL(e);
                          e = o.pathname + o.search;
                        } catch (t) {}
                        var i = function (t) {
                          if (!t) return {};
                          var n,
                            e = t.split(","),
                            o = {};
                          return e.forEach(function (t) {
                            var e = t.split(":").map(function (t) {
                              return t.replace(/(^ +| +$)/g, "");
                            });
                            switch (e[0]) {
                              case "historyAPIMethod":
                                o.historyAPIMethod = e[1];
                                break;
                              case "resolveOptionsStrategy":
                                n || (n = {}), n.strategy = e[1];
                                break;
                              case "resolveOptionsHash":
                                n || (n = {}), n.hash = "true" === e[1];
                                break;
                              case "updateBrowserURL":
                              case "callHandler":
                              case "updateState":
                              case "force":
                                o[e[0]] = "true" === e[1];
                            }
                          }), n && (o.resolveOptions = n), o;
                        }(t.getAttribute("data-navigo-options"));
                        L || (n.preventDefault(), n.stopPropagation(), r.navigate(s(e), i));
                      }, t.addEventListener("click", t.navigoHandler)) : t.hasListenerAttached && t.removeEventListener("click", t.navigoHandler);
                    }), r;
                  }
                  function I(t, n, e) {
                    var o = w.find(function (n) {
                        return n.name === t;
                      }),
                      r = null;
                    if (o) {
                      if (r = o.path, n) for (var a in n) r = r.replace(":" + a, n[a]);
                      r = r.match(/^\//) ? r : "/" + r;
                    }
                    return r && e && !e.includeRoot && (r = r.replace(new RegExp("^/" + i), "")), r;
                  }
                  function M(t) {
                    var n = h(s(t)),
                      o = n[0],
                      r = n[1],
                      i = "" === r ? null : f(r);
                    return {
                      url: o,
                      queryString: r,
                      hashString: u(t),
                      route: N(o, function () {}, [e], o),
                      data: null,
                      params: i
                    };
                  }
                  function T(t, n, e) {
                    return "string" == typeof n && (n = z(n)), n ? (n.hooks[t] || (n.hooks[t] = []), n.hooks[t].push(e), function () {
                      n.hooks[t] = n.hooks[t].filter(function (t) {
                        return t !== e;
                      });
                    }) : (console.warn("Route doesn't exists: " + n), function () {});
                  }
                  function z(t) {
                    return "string" == typeof t ? w.find(function (n) {
                      return n.name === E(t);
                    }) : w.find(function (n) {
                      return n.handler === t;
                    });
                  }
                  t ? i = s(t) : console.warn('Navigo requires a root path in its constructor. If not provided will use "/" as default.'), this.root = i, this.routes = w, this.destroyed = L, this.current = d, this.__freezeListening = !1, this.__waiting = [], this.__dirty = !1, this.__markAsClean = function (t) {
                    t.instance.__dirty = !1, t.instance.__waiting.length > 0 && t.instance.__waiting.shift()();
                  }, this.on = function (t, n, o) {
                    var r = this;
                    return "object" != typeof t || t instanceof RegExp ? ("function" == typeof t && (o = n, n = t, t = i), w.push(N(t, n, [e, o])), this) : (Object.keys(t).forEach(function (n) {
                      if ("function" == typeof t[n]) r.on(n, t[n]);else {
                        var o = t[n],
                          i = o.uses,
                          a = o.as,
                          s = o.hooks;
                        w.push(N(n, i, [e, s], a));
                      }
                    }), this);
                  }, this.off = function (t) {
                    return this.routes = w = w.filter(function (n) {
                      return c(t) ? s(n.path) !== s(t) : "function" == typeof t ? t !== n.handler : String(n.path) !== String(t);
                    }), this;
                  }, this.resolve = U, this.navigate = q, this.navigateByName = function (t, n, e) {
                    var o = I(t, n);
                    return null !== o && (q(o.replace(new RegExp("^/?" + i), ""), e), !0);
                  }, this.destroy = function () {
                    this.routes = w = [], A && window.removeEventListener("popstate", this.__popstateListener), this.destroyed = L = !0;
                  }, this.notFound = function (t, n) {
                    return r._notFoundRoute = N("*", t, [e, n], "__NOT_FOUND__"), this;
                  }, this.updatePageLinks = F, this.link = function (t) {
                    return "/" + i + "/" + s(t);
                  }, this.hooks = function (t) {
                    return e = t, this;
                  }, this.extractGETParameters = function (t) {
                    return h(R(t));
                  }, this.lastResolved = function () {
                    return d;
                  }, this.generate = I, this.getLinkPath = function (t) {
                    return t.getAttribute("href");
                  }, this.match = function (t) {
                    var n = {
                      instance: r,
                      currentLocationPath: t,
                      to: t,
                      navigateOptions: {},
                      resolveOptions: o
                    };
                    return _(n, function () {}), !!n.matches && n.matches;
                  }, this.matchLocation = function (t, n, e) {
                    void 0 === n || void 0 !== e && !e || (n = E(n));
                    var o = {
                      instance: r,
                      to: n,
                      currentLocationPath: n
                    };
                    return y(o, function () {}), "string" == typeof t && (t = void 0 === e || e ? E(t) : t), l(o, {
                      name: String(t),
                      path: t,
                      handler: function () {},
                      hooks: {}
                    }) || !1;
                  }, this.getCurrentLocation = function () {
                    return M(s(a(i)).replace(new RegExp("^" + i), ""));
                  }, this.addBeforeHook = T.bind(this, "before"), this.addAfterHook = T.bind(this, "after"), this.addAlreadyHook = T.bind(this, "already"), this.addLeaveHook = T.bind(this, "leave"), this.getRoute = z, this._pathToMatchObject = M, this._clean = s, this._checkForAHash = R, this._setCurrent = function (t) {
                    return d = r.current = t;
                  }, function () {
                    A && (this.__popstateListener = function () {
                      r.__freezeListening || U();
                    }, window.addEventListener("popstate", this.__popstateListener));
                  }.call(this), F.call(this);
                }
              }
            },
            n = {};
          function e(o) {
            if (n[o]) return n[o].exports;
            var r = n[o] = {
              exports: {}
            };
            return t[o](r, r.exports, e), r.exports;
          }
          return e.d = function (t, n) {
            for (var o in n) e.o(n, o) && !e.o(t, o) && Object.defineProperty(t, o, {
              enumerable: !0,
              get: n[o]
            });
          }, e.o = function (t, n) {
            return Object.prototype.hasOwnProperty.call(t, n);
          }, e(407);
        }().default;
      });
    }, {}],
    4: [function (require, module, exports) {
      module.exports = {
        "name": "pict-application",
        "version": "1.0.33",
        "description": "Application base class for a pict view-based application",
        "main": "source/Pict-Application.js",
        "scripts": {
          "test": "npx quack test",
          "start": "node source/Pict-Application.js",
          "coverage": "npx quack coverage",
          "build": "npx quack build",
          "docker-dev-build": "docker build ./ -f Dockerfile_LUXURYCode -t pict-application-image:local",
          "docker-dev-run": "docker run -it -d --name pict-application-dev -p 30001:8080 -p 38086:8086 -v \"$PWD/.config:/home/coder/.config\"  -v \"$PWD:/home/coder/pict-application\" -u \"$(id -u):$(id -g)\" -e \"DOCKER_USER=$USER\" pict-application-image:local",
          "docker-dev-shell": "docker exec -it pict-application-dev /bin/bash",
          "tests": "npx quack test -g",
          "lint": "eslint source/**",
          "types": "tsc -p ."
        },
        "types": "types/source/Pict-Application.d.ts",
        "repository": {
          "type": "git",
          "url": "git+https://github.com/stevenvelozo/pict-application.git"
        },
        "author": "steven velozo <steven@velozo.com>",
        "license": "MIT",
        "bugs": {
          "url": "https://github.com/stevenvelozo/pict-application/issues"
        },
        "homepage": "https://github.com/stevenvelozo/pict-application#readme",
        "devDependencies": {
          "@eslint/js": "^9.28.0",
          "browser-env": "^3.3.0",
          "eslint": "^9.28.0",
          "pict": "^1.0.348",
          "pict-provider": "^1.0.10",
          "pict-view": "^1.0.66",
          "quackage": "^1.0.58",
          "typescript": "^5.9.3"
        },
        "mocha": {
          "diff": true,
          "extension": ["js"],
          "package": "./package.json",
          "reporter": "spec",
          "slow": "75",
          "timeout": "5000",
          "ui": "tdd",
          "watch-files": ["source/**/*.js", "test/**/*.js"],
          "watch-ignore": ["lib/vendor"]
        },
        "dependencies": {
          "fable-serviceproviderbase": "^3.0.19"
        }
      };
    }, {}],
    5: [function (require, module, exports) {
      const libFableServiceBase = require('fable-serviceproviderbase');
      const libPackage = require('../package.json');
      const defaultPictSettings = {
        Name: 'DefaultPictApplication',
        // The main "viewport" is the view that is used to host our application
        MainViewportViewIdentifier: 'Default-View',
        MainViewportRenderableHash: false,
        MainViewportDestinationAddress: false,
        MainViewportDefaultDataAddress: false,
        // Whether or not we should automatically render the main viewport and other autorender views after we initialize the pict application
        AutoSolveAfterInitialize: true,
        AutoRenderMainViewportViewAfterInitialize: true,
        AutoRenderViewsAfterInitialize: false,
        AutoLoginAfterInitialize: false,
        AutoLoadDataAfterLogin: false,
        ConfigurationOnlyViews: [],
        Manifests: {},
        // The prefix to prepend on all template destination hashes
        IdentifierAddressPrefix: 'PICT-'
      };

      /**
       * Base class for pict applications.
       */
      class PictApplication extends libFableServiceBase {
        /**
         * @param {import('fable')} pFable
         * @param {Record<string, any>} [pOptions]
         * @param {string} [pServiceHash]
         */
        constructor(pFable, pOptions, pServiceHash) {
          let tmpCarryOverConfiguration = typeof pFable.settings.PictApplicationConfiguration === 'object' ? pFable.settings.PictApplicationConfiguration : {};
          let tmpOptions = Object.assign({}, JSON.parse(JSON.stringify(defaultPictSettings)), tmpCarryOverConfiguration, pOptions);
          super(pFable, tmpOptions, pServiceHash);

          /** @type {any} */
          this.options;
          /** @type {any} */
          this.log;
          /** @type {import('pict') & import('fable')} */
          this.fable;
          /** @type {string} */
          this.UUID;
          /** @type {string} */
          this.Hash;
          /**
           * @type {{ [key: string]: any }}
           */
          this.servicesMap;
          this.serviceType = 'PictApplication';
          /** @type {Record<string, any>} */
          this._Package = libPackage;

          // Convenience and consistency naming
          this.pict = this.fable;
          // Wire in the essential Pict state
          /** @type {Record<string, any>} */
          this.AppData = this.fable.AppData;
          /** @type {Record<string, any>} */
          this.Bundle = this.fable.Bundle;

          /** @type {number} */
          this.initializeTimestamp;
          /** @type {number} */
          this.lastSolvedTimestamp;
          /** @type {number} */
          this.lastLoginTimestamp;
          /** @type {number} */
          this.lastMarshalFromViewsTimestamp;
          /** @type {number} */
          this.lastMarshalToViewsTimestamp;
          /** @type {number} */
          this.lastAutoRenderTimestamp;
          /** @type {number} */
          this.lastLoadDataTimestamp;

          // Load all the manifests for the application
          let tmpManifestKeys = Object.keys(this.options.Manifests);
          if (tmpManifestKeys.length > 0) {
            for (let i = 0; i < tmpManifestKeys.length; i++) {
              // Load each manifest
              let tmpManifestKey = tmpManifestKeys[i];
              this.fable.instantiateServiceProvider('Manifest', this.options.Manifests[tmpManifestKey], tmpManifestKey);
            }
          }
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Solve All Views                          */
        /* -------------------------------------------------------------------------- */
        /**
         * @return {boolean}
         */
        onPreSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onPreSolve:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onPreSolveAsync(fCallback) {
          this.onPreSolve();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        onBeforeSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onBeforeSolve:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeSolveAsync(fCallback) {
          this.onBeforeSolve();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        onSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onSolve:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onSolveAsync(fCallback) {
          this.onSolve();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        solve() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} executing solve() function...`);
          }

          // Walk through any loaded providers and solve them as well.
          let tmpLoadedProviders = Object.keys(this.pict.providers);
          let tmpProvidersToSolve = [];
          for (let i = 0; i < tmpLoadedProviders.length; i++) {
            let tmpProvider = this.pict.providers[tmpLoadedProviders[i]];
            if (tmpProvider.options.AutoSolveWithApp) {
              tmpProvidersToSolve.push(tmpProvider);
            }
          }
          // Sort the providers by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
          tmpProvidersToSolve.sort((a, b) => {
            return a.options.AutoSolveOrdinal - b.options.AutoSolveOrdinal;
          });
          for (let i = 0; i < tmpProvidersToSolve.length; i++) {
            tmpProvidersToSolve[i].solve(tmpProvidersToSolve[i]);
          }
          this.onBeforeSolve();
          // Now walk through any loaded views and initialize them as well.
          let tmpLoadedViews = Object.keys(this.pict.views);
          let tmpViewsToSolve = [];
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            if (tmpView.options.AutoInitialize) {
              tmpViewsToSolve.push(tmpView);
            }
          }
          // Sort the views by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
          tmpViewsToSolve.sort((a, b) => {
            return a.options.AutoInitializeOrdinal - b.options.AutoInitializeOrdinal;
          });
          for (let i = 0; i < tmpViewsToSolve.length; i++) {
            tmpViewsToSolve[i].solve();
          }
          this.onSolve();
          this.onAfterSolve();
          this.lastSolvedTimestamp = this.fable.log.getTimeStamp();
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        solveAsync(fCallback) {
          let tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');
          tmpAnticipate.anticipate(this.onBeforeSolveAsync.bind(this));

          // Allow the callback to be passed in as the last parameter no matter what
          let tmpCallback = typeof fCallback === 'function' ? fCallback : false;
          if (!tmpCallback) {
            this.log.warn(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} solveAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions.`);
            tmpCallback = pError => {
              if (pError) {
                this.log.error(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} solveAsync Auto Callback Error: ${pError}`, pError);
              }
            };
          }
          // Walk through any loaded providers and solve them as well.
          let tmpLoadedProviders = Object.keys(this.pict.providers);
          let tmpProvidersToSolve = [];
          for (let i = 0; i < tmpLoadedProviders.length; i++) {
            let tmpProvider = this.pict.providers[tmpLoadedProviders[i]];
            if (tmpProvider.options.AutoSolveWithApp) {
              tmpProvidersToSolve.push(tmpProvider);
            }
          }
          // Sort the providers by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
          tmpProvidersToSolve.sort((a, b) => {
            return a.options.AutoSolveOrdinal - b.options.AutoSolveOrdinal;
          });
          for (let i = 0; i < tmpProvidersToSolve.length; i++) {
            tmpAnticipate.anticipate(tmpProvidersToSolve[i].solveAsync.bind(tmpProvidersToSolve[i]));
          }

          // Walk through any loaded views and solve them as well.
          let tmpLoadedViews = Object.keys(this.pict.views);
          let tmpViewsToSolve = [];
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            if (tmpView.options.AutoSolveWithApp) {
              tmpViewsToSolve.push(tmpView);
            }
          }
          // Sort the views by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
          tmpViewsToSolve.sort((a, b) => {
            return a.options.AutoSolveOrdinal - b.options.AutoSolveOrdinal;
          });
          for (let i = 0; i < tmpViewsToSolve.length; i++) {
            tmpAnticipate.anticipate(tmpViewsToSolve[i].solveAsync.bind(tmpViewsToSolve[i]));
          }
          tmpAnticipate.anticipate(this.onSolveAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterSolveAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} solveAsync() complete.`);
            }
            this.lastSolvedTimestamp = this.fable.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * @return {boolean}
         */
        onAfterSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onAfterSolve:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterSolveAsync(fCallback) {
          this.onAfterSolve();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Application Login                        */
        /* -------------------------------------------------------------------------- */

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeLoginAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onBeforeLoginAsync:`);
          }
          return fCallback();
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onLoginAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onLoginAsync:`);
          }
          return fCallback();
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        loginAsync(fCallback) {
          const tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');
          let tmpCallback = fCallback;
          if (typeof tmpCallback !== 'function') {
            this.log.warn(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} loginAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions.`);
            tmpCallback = pError => {
              if (pError) {
                this.log.error(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} loginAsync Auto Callback Error: ${pError}`, pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeLoginAsync.bind(this));
          tmpAnticipate.anticipate(this.onLoginAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterLoginAsync.bind(this));

          // check and see if we should automatically trigger a data load
          if (this.options.AutoLoadDataAfterLogin) {
            tmpAnticipate.anticipate(fNext => {
              if (!this.isLoggedIn()) {
                return fNext();
              }
              if (this.pict.LogNoisiness > 1) {
                this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} auto loading data after login...`);
              }
              //TODO: should data load errors funnel here? this creates a weird coupling between login and data load callbacks
              this.loadDataAsync(pError => {
                fNext(pError);
              });
            });
          }
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} loginAsync() complete.`);
            }
            this.lastLoginTimestamp = this.fable.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * Check if the application state is logged in. Defaults to true. Override this method in your application based on login requirements.
         *
         * @return {boolean}
         */
        isLoggedIn() {
          return true;
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterLoginAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onAfterLoginAsync:`);
          }
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Application LoadData                     */
        /* -------------------------------------------------------------------------- */

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeLoadDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onBeforeLoadDataAsync:`);
          }
          return fCallback();
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onLoadDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onLoadDataAsync:`);
          }
          return fCallback();
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        loadDataAsync(fCallback) {
          const tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');
          let tmpCallback = fCallback;
          if (typeof tmpCallback !== 'function') {
            this.log.warn(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} loadDataAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions.`);
            tmpCallback = pError => {
              if (pError) {
                this.log.error(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} loadDataAsync Auto Callback Error: ${pError}`, pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeLoadDataAsync.bind(this));

          // Walk through any loaded providers and load their data as well.
          let tmpLoadedProviders = Object.keys(this.pict.providers);
          let tmpProvidersToLoadData = [];
          for (let i = 0; i < tmpLoadedProviders.length; i++) {
            let tmpProvider = this.pict.providers[tmpLoadedProviders[i]];
            if (tmpProvider.options.AutoLoadDataWithApp) {
              tmpProvidersToLoadData.push(tmpProvider);
            }
          }
          // Sort the providers by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
          tmpProvidersToLoadData.sort((a, b) => {
            return a.options.AutoLoadDataOrdinal - b.options.AutoLoadDataOrdinal;
          });
          for (const tmpProvider of tmpProvidersToLoadData) {
            tmpAnticipate.anticipate(tmpProvider.onBeforeLoadDataAsync.bind(tmpProvider));
          }
          tmpAnticipate.anticipate(this.onLoadDataAsync.bind(this));

          //TODO: think about ways to parallelize these
          for (const tmpProvider of tmpProvidersToLoadData) {
            tmpAnticipate.anticipate(tmpProvider.onLoadDataAsync.bind(tmpProvider));
          }
          tmpAnticipate.anticipate(this.onAfterLoadDataAsync.bind(this));
          for (const tmpProvider of tmpProvidersToLoadData) {
            tmpAnticipate.anticipate(tmpProvider.onAfterLoadDataAsync.bind(tmpProvider));
          }
          tmpAnticipate.wait(/** @param {Error} [pError] */
          pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} loadDataAsync() complete.`);
            }
            this.lastLoadDataTimestamp = this.fable.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterLoadDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onAfterLoadDataAsync:`);
          }
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Application SaveData                     */
        /* -------------------------------------------------------------------------- */

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeSaveDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onBeforeSaveDataAsync:`);
          }
          return fCallback();
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onSaveDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onSaveDataAsync:`);
          }
          return fCallback();
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        saveDataAsync(fCallback) {
          const tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');
          let tmpCallback = fCallback;
          if (typeof tmpCallback !== 'function') {
            this.log.warn(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} saveDataAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions.`);
            tmpCallback = pError => {
              if (pError) {
                this.log.error(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} saveDataAsync Auto Callback Error: ${pError}`, pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeSaveDataAsync.bind(this));

          // Walk through any loaded providers and load their data as well.
          let tmpLoadedProviders = Object.keys(this.pict.providers);
          let tmpProvidersToSaveData = [];
          for (let i = 0; i < tmpLoadedProviders.length; i++) {
            let tmpProvider = this.pict.providers[tmpLoadedProviders[i]];
            if (tmpProvider.options.AutoSaveDataWithApp) {
              tmpProvidersToSaveData.push(tmpProvider);
            }
          }
          // Sort the providers by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
          tmpProvidersToSaveData.sort((a, b) => {
            return a.options.AutoSaveDataOrdinal - b.options.AutoSaveDataOrdinal;
          });
          for (const tmpProvider of tmpProvidersToSaveData) {
            tmpAnticipate.anticipate(tmpProvider.onBeforeSaveDataAsync.bind(tmpProvider));
          }
          tmpAnticipate.anticipate(this.onSaveDataAsync.bind(this));

          //TODO: think about ways to parallelize these
          for (const tmpProvider of tmpProvidersToSaveData) {
            tmpAnticipate.anticipate(tmpProvider.onSaveDataAsync.bind(tmpProvider));
          }
          tmpAnticipate.anticipate(this.onAfterSaveDataAsync.bind(this));
          for (const tmpProvider of tmpProvidersToSaveData) {
            tmpAnticipate.anticipate(tmpProvider.onAfterSaveDataAsync.bind(tmpProvider));
          }
          tmpAnticipate.wait(/** @param {Error} [pError] */
          pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} saveDataAsync() complete.`);
            }
            this.lastSaveDataTimestamp = this.fable.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterSaveDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onAfterSaveDataAsync:`);
          }
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Initialize Application                   */
        /* -------------------------------------------------------------------------- */
        /**
         * @return {boolean}
         */
        onBeforeInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onBeforeInitialize:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeInitializeAsync(fCallback) {
          this.onBeforeInitialize();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        onInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onInitialize:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onInitializeAsync(fCallback) {
          this.onInitialize();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        initialize() {
          if (this.pict.LogControlFlow) {
            this.log.trace(`PICT-ControlFlow APPLICATION [${this.UUID}]::[${this.Hash}] ${this.options.Name} initialize:`);
          }
          if (!this.initializeTimestamp) {
            this.onBeforeInitialize();
            if ('ConfigurationOnlyViews' in this.options) {
              // Load all the configuration only views
              for (let i = 0; i < this.options.ConfigurationOnlyViews.length; i++) {
                let tmpViewIdentifier = typeof this.options.ConfigurationOnlyViews[i].ViewIdentifier === 'undefined' ? `AutoView-${this.fable.getUUID()}` : this.options.ConfigurationOnlyViews[i].ViewIdentifier;
                this.log.info(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} adding configuration only view: ${tmpViewIdentifier}`);
                this.pict.addView(tmpViewIdentifier, this.options.ConfigurationOnlyViews[i]);
              }
            }
            this.onInitialize();

            // Walk through any loaded providers and initialize them as well.
            let tmpLoadedProviders = Object.keys(this.pict.providers);
            let tmpProvidersToInitialize = [];
            for (let i = 0; i < tmpLoadedProviders.length; i++) {
              let tmpProvider = this.pict.providers[tmpLoadedProviders[i]];
              if (tmpProvider.options.AutoInitialize) {
                tmpProvidersToInitialize.push(tmpProvider);
              }
            }
            // Sort the providers by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
            tmpProvidersToInitialize.sort((a, b) => {
              return a.options.AutoInitializeOrdinal - b.options.AutoInitializeOrdinal;
            });
            for (let i = 0; i < tmpProvidersToInitialize.length; i++) {
              tmpProvidersToInitialize[i].initialize();
            }

            // Now walk through any loaded views and initialize them as well.
            let tmpLoadedViews = Object.keys(this.pict.views);
            let tmpViewsToInitialize = [];
            for (let i = 0; i < tmpLoadedViews.length; i++) {
              let tmpView = this.pict.views[tmpLoadedViews[i]];
              if (tmpView.options.AutoInitialize) {
                tmpViewsToInitialize.push(tmpView);
              }
            }
            // Sort the views by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
            tmpViewsToInitialize.sort((a, b) => {
              return a.options.AutoInitializeOrdinal - b.options.AutoInitializeOrdinal;
            });
            for (let i = 0; i < tmpViewsToInitialize.length; i++) {
              tmpViewsToInitialize[i].initialize();
            }
            this.onAfterInitialize();
            if (this.options.AutoSolveAfterInitialize) {
              if (this.pict.LogNoisiness > 1) {
                this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} auto solving after initialization...`);
              }
              // Solve the template synchronously
              this.solve();
            }
            // Now check and see if we should automatically render as well
            if (this.options.AutoRenderMainViewportViewAfterInitialize) {
              if (this.pict.LogNoisiness > 1) {
                this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} auto rendering after initialization...`);
              }
              // Render the template synchronously
              this.render();
            }
            this.initializeTimestamp = this.fable.log.getTimeStamp();
            this.onCompletionOfInitialize();
            return true;
          } else {
            this.log.warn(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} initialize called but initialization is already completed.  Aborting.`);
            return false;
          }
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        initializeAsync(fCallback) {
          if (this.pict.LogControlFlow) {
            this.log.trace(`PICT-ControlFlow APPLICATION [${this.UUID}]::[${this.Hash}] ${this.options.Name} initializeAsync:`);
          }

          // Allow the callback to be passed in as the last parameter no matter what
          let tmpCallback = typeof fCallback === 'function' ? fCallback : false;
          if (!tmpCallback) {
            this.log.warn(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} initializeAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions.`);
            tmpCallback = pError => {
              if (pError) {
                this.log.error(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} initializeAsync Auto Callback Error: ${pError}`, pError);
              }
            };
          }
          if (!this.initializeTimestamp) {
            let tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');
            if (this.pict.LogNoisiness > 3) {
              this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} beginning initialization...`);
            }
            if ('ConfigurationOnlyViews' in this.options) {
              // Load all the configuration only views
              for (let i = 0; i < this.options.ConfigurationOnlyViews.length; i++) {
                let tmpViewIdentifier = typeof this.options.ConfigurationOnlyViews[i].ViewIdentifier === 'undefined' ? `AutoView-${this.fable.getUUID()}` : this.options.ConfigurationOnlyViews[i].ViewIdentifier;
                this.log.info(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} adding configuration only view: ${tmpViewIdentifier}`);
                this.pict.addView(tmpViewIdentifier, this.options.ConfigurationOnlyViews[i]);
              }
            }
            tmpAnticipate.anticipate(this.onBeforeInitializeAsync.bind(this));
            tmpAnticipate.anticipate(this.onInitializeAsync.bind(this));

            // Walk through any loaded providers and solve them as well.
            let tmpLoadedProviders = Object.keys(this.pict.providers);
            let tmpProvidersToInitialize = [];
            for (let i = 0; i < tmpLoadedProviders.length; i++) {
              let tmpProvider = this.pict.providers[tmpLoadedProviders[i]];
              if (tmpProvider.options.AutoInitialize) {
                tmpProvidersToInitialize.push(tmpProvider);
              }
            }
            // Sort the providers by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
            tmpProvidersToInitialize.sort((a, b) => {
              return a.options.AutoInitializeOrdinal - b.options.AutoInitializeOrdinal;
            });
            for (let i = 0; i < tmpProvidersToInitialize.length; i++) {
              tmpAnticipate.anticipate(tmpProvidersToInitialize[i].initializeAsync.bind(tmpProvidersToInitialize[i]));
            }

            // Now walk through any loaded views and initialize them as well.
            // TODO: Some optimization cleverness could be gained by grouping them into a parallelized async operation, by ordinal.
            let tmpLoadedViews = Object.keys(this.pict.views);
            let tmpViewsToInitialize = [];
            for (let i = 0; i < tmpLoadedViews.length; i++) {
              let tmpView = this.pict.views[tmpLoadedViews[i]];
              if (tmpView.options.AutoInitialize) {
                tmpViewsToInitialize.push(tmpView);
              }
            }
            // Sort the views by their priority
            // If they are all the default priority 0, it will end up being add order due to JSON Object Property Key order stuff
            tmpViewsToInitialize.sort((a, b) => {
              return a.options.AutoInitializeOrdinal - b.options.AutoInitializeOrdinal;
            });
            for (let i = 0; i < tmpViewsToInitialize.length; i++) {
              let tmpView = tmpViewsToInitialize[i];
              tmpAnticipate.anticipate(tmpView.initializeAsync.bind(tmpView));
            }
            tmpAnticipate.anticipate(this.onAfterInitializeAsync.bind(this));
            if (this.options.AutoLoginAfterInitialize) {
              if (this.pict.LogNoisiness > 1) {
                this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} auto login (asynchronously) after initialization...`);
              }
              tmpAnticipate.anticipate(this.loginAsync.bind(this));
            }
            if (this.options.AutoSolveAfterInitialize) {
              if (this.pict.LogNoisiness > 1) {
                this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} auto solving (asynchronously) after initialization...`);
              }
              tmpAnticipate.anticipate(this.solveAsync.bind(this));
            }
            if (this.options.AutoRenderMainViewportViewAfterInitialize) {
              if (this.pict.LogNoisiness > 1) {
                this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} auto rendering (asynchronously) after initialization...`);
              }
              tmpAnticipate.anticipate(this.renderMainViewportAsync.bind(this));
            }
            tmpAnticipate.wait(pError => {
              if (pError) {
                this.log.error(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} initializeAsync Error: ${pError.message || pError}`, {
                  stack: pError.stack
                });
              }
              this.initializeTimestamp = this.fable.log.getTimeStamp();
              if (this.pict.LogNoisiness > 2) {
                this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} initialization complete.`);
              }
              return tmpCallback();
            });
          } else {
            this.log.warn(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} async initialize called but initialization is already completed.  Aborting.`);
            // TODO: Should this be an error?
            return this.onCompletionOfInitializeAsync(tmpCallback);
          }
        }

        /**
         * @return {boolean}
         */
        onAfterInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onAfterInitialize:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterInitializeAsync(fCallback) {
          this.onAfterInitialize();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        onCompletionOfInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onCompletionOfInitialize:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onCompletionOfInitializeAsync(fCallback) {
          this.onCompletionOfInitialize();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Marshal Data From All Views              */
        /* -------------------------------------------------------------------------- */
        /**
         * @return {boolean}
         */
        onBeforeMarshalFromViews() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onBeforeMarshalFromViews:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeMarshalFromViewsAsync(fCallback) {
          this.onBeforeMarshalFromViews();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        onMarshalFromViews() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onMarshalFromViews:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onMarshalFromViewsAsync(fCallback) {
          this.onMarshalFromViews();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        marshalFromViews() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} executing marshalFromViews() function...`);
          }
          this.onBeforeMarshalFromViews();
          // Now walk through any loaded views and initialize them as well.
          let tmpLoadedViews = Object.keys(this.pict.views);
          let tmpViewsToMarshalFromViews = [];
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            tmpViewsToMarshalFromViews.push(tmpView);
          }
          for (let i = 0; i < tmpViewsToMarshalFromViews.length; i++) {
            tmpViewsToMarshalFromViews[i].marshalFromView();
          }
          this.onMarshalFromViews();
          this.onAfterMarshalFromViews();
          this.lastMarshalFromViewsTimestamp = this.fable.log.getTimeStamp();
          return true;
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        marshalFromViewsAsync(fCallback) {
          let tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');

          // Allow the callback to be passed in as the last parameter no matter what
          let tmpCallback = typeof fCallback === 'function' ? fCallback : false;
          if (!tmpCallback) {
            this.log.warn(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} marshalFromViewsAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions.`);
            tmpCallback = pError => {
              if (pError) {
                this.log.error(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} marshalFromViewsAsync Auto Callback Error: ${pError}`, pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeMarshalFromViewsAsync.bind(this));
          // Walk through any loaded views and marshalFromViews them as well.
          let tmpLoadedViews = Object.keys(this.pict.views);
          let tmpViewsToMarshalFromViews = [];
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            tmpViewsToMarshalFromViews.push(tmpView);
          }
          for (let i = 0; i < tmpViewsToMarshalFromViews.length; i++) {
            tmpAnticipate.anticipate(tmpViewsToMarshalFromViews[i].marshalFromViewAsync.bind(tmpViewsToMarshalFromViews[i]));
          }
          tmpAnticipate.anticipate(this.onMarshalFromViewsAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterMarshalFromViewsAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} marshalFromViewsAsync() complete.`);
            }
            this.lastMarshalFromViewsTimestamp = this.fable.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * @return {boolean}
         */
        onAfterMarshalFromViews() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onAfterMarshalFromViews:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterMarshalFromViewsAsync(fCallback) {
          this.onAfterMarshalFromViews();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Marshal Data To All Views                */
        /* -------------------------------------------------------------------------- */
        /**
         * @return {boolean}
         */
        onBeforeMarshalToViews() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onBeforeMarshalToViews:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeMarshalToViewsAsync(fCallback) {
          this.onBeforeMarshalToViews();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        onMarshalToViews() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onMarshalToViews:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onMarshalToViewsAsync(fCallback) {
          this.onMarshalToViews();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        marshalToViews() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} executing marshalToViews() function...`);
          }
          this.onBeforeMarshalToViews();
          // Now walk through any loaded views and initialize them as well.
          let tmpLoadedViews = Object.keys(this.pict.views);
          let tmpViewsToMarshalToViews = [];
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            tmpViewsToMarshalToViews.push(tmpView);
          }
          for (let i = 0; i < tmpViewsToMarshalToViews.length; i++) {
            tmpViewsToMarshalToViews[i].marshalToView();
          }
          this.onMarshalToViews();
          this.onAfterMarshalToViews();
          this.lastMarshalToViewsTimestamp = this.fable.log.getTimeStamp();
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        marshalToViewsAsync(fCallback) {
          let tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');

          // Allow the callback to be passed in as the last parameter no matter what
          let tmpCallback = typeof fCallback === 'function' ? fCallback : false;
          if (!tmpCallback) {
            this.log.warn(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} marshalToViewsAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions.`);
            tmpCallback = pError => {
              if (pError) {
                this.log.error(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} marshalToViewsAsync Auto Callback Error: ${pError}`, pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeMarshalToViewsAsync.bind(this));
          // Walk through any loaded views and marshalToViews them as well.
          let tmpLoadedViews = Object.keys(this.pict.views);
          let tmpViewsToMarshalToViews = [];
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            tmpViewsToMarshalToViews.push(tmpView);
          }
          for (let i = 0; i < tmpViewsToMarshalToViews.length; i++) {
            tmpAnticipate.anticipate(tmpViewsToMarshalToViews[i].marshalToViewAsync.bind(tmpViewsToMarshalToViews[i]));
          }
          tmpAnticipate.anticipate(this.onMarshalToViewsAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterMarshalToViewsAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} marshalToViewsAsync() complete.`);
            }
            this.lastMarshalToViewsTimestamp = this.fable.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * @return {boolean}
         */
        onAfterMarshalToViews() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onAfterMarshalToViews:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterMarshalToViewsAsync(fCallback) {
          this.onAfterMarshalToViews();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Render View                              */
        /* -------------------------------------------------------------------------- */
        /**
         * @return {boolean}
         */
        onBeforeRender() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onBeforeRender:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeRenderAsync(fCallback) {
          this.onBeforeRender();
          return fCallback();
        }

        /**
         * @param {string} [pViewIdentifier] - The hash of the view to render. By default, the main viewport view is rendered.
         * @param {string} [pRenderableHash] - The hash of the renderable to render.
         * @param {string} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string} [pTemplateDataAddress] - The address where the data for the template is stored.
         *
         * TODO: Should we support objects for pTemplateDataAddress for parity with pict-view?
         */
        render(pViewIdentifier, pRenderableHash, pRenderDestinationAddress, pTemplateDataAddress) {
          let tmpViewIdentifier = typeof pViewIdentifier !== 'string' ? this.options.MainViewportViewIdentifier : pViewIdentifier;
          let tmpRenderableHash = typeof pRenderableHash !== 'string' ? this.options.MainViewportRenderableHash : pRenderableHash;
          let tmpRenderDestinationAddress = typeof pRenderDestinationAddress !== 'string' ? this.options.MainViewportDestinationAddress : pRenderDestinationAddress;
          let tmpTemplateDataAddress = typeof pTemplateDataAddress !== 'string' ? this.options.MainViewportDefaultDataAddress : pTemplateDataAddress;
          if (this.pict.LogControlFlow) {
            this.log.trace(`PICT-ControlFlow APPLICATION [${this.UUID}]::[${this.Hash}] ${this.options.Name} VIEW Renderable[${tmpRenderableHash}] Destination[${tmpRenderDestinationAddress}] TemplateDataAddress[${tmpTemplateDataAddress}] render:`);
          }
          this.onBeforeRender();

          // Now get the view (by hash) from the loaded views
          let tmpView = typeof tmpViewIdentifier === 'string' ? this.servicesMap.PictView[tmpViewIdentifier] : false;
          if (!tmpView) {
            this.log.error(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} could not render from View ${tmpViewIdentifier} because it is not a valid view.`);
            return false;
          }
          this.onRender();
          tmpView.render(tmpRenderableHash, tmpRenderDestinationAddress, tmpTemplateDataAddress);
          this.onAfterRender();
          return true;
        }
        /**
         * @return {boolean}
         */
        onRender() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onRender:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onRenderAsync(fCallback) {
          this.onRender();
          return fCallback();
        }

        /**
         * @param {string|((error?: Error) => void)} pViewIdentifier - The hash of the view to render. By default, the main viewport view is rendered. (or the callback)
         * @param {string|((error?: Error) => void)} [pRenderableHash] - The hash of the renderable to render. (or the callback)
         * @param {string|((error?: Error) => void)} [pRenderDestinationAddress] - The address where the renderable will be rendered. (or the callback)
         * @param {string|((error?: Error) => void)} [pTemplateDataAddress] - The address where the data for the template is stored. (or the callback)
         * @param {(error?: Error) => void} [fCallback] - The callback, if all other parameters are provided.
         *
         * TODO: Should we support objects for pTemplateDataAddress for parity with pict-view?
         */
        renderAsync(pViewIdentifier, pRenderableHash, pRenderDestinationAddress, pTemplateDataAddress, fCallback) {
          let tmpViewIdentifier = typeof pViewIdentifier !== 'string' ? this.options.MainViewportViewIdentifier : pViewIdentifier;
          let tmpRenderableHash = typeof pRenderableHash !== 'string' ? this.options.MainViewportRenderableHash : pRenderableHash;
          let tmpRenderDestinationAddress = typeof pRenderDestinationAddress !== 'string' ? this.options.MainViewportDestinationAddress : pRenderDestinationAddress;
          let tmpTemplateDataAddress = typeof pTemplateDataAddress !== 'string' ? this.options.MainViewportDefaultDataAddress : pTemplateDataAddress;

          // Allow the callback to be passed in as the last parameter no matter what
          let tmpCallback = typeof fCallback === 'function' ? fCallback : typeof pTemplateDataAddress === 'function' ? pTemplateDataAddress : typeof pRenderDestinationAddress === 'function' ? pRenderDestinationAddress : typeof pRenderableHash === 'function' ? pRenderableHash : typeof pViewIdentifier === 'function' ? pViewIdentifier : false;
          if (!tmpCallback) {
            this.log.warn(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} renderAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions.`);
            tmpCallback = pError => {
              if (pError) {
                this.log.error(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} renderAsync Auto Callback Error: ${pError}`, pError);
              }
            };
          }
          if (this.pict.LogControlFlow) {
            this.log.trace(`PICT-ControlFlow APPLICATION [${this.UUID}]::[${this.Hash}] ${this.options.Name} VIEW Renderable[${tmpRenderableHash}] Destination[${tmpRenderDestinationAddress}] TemplateDataAddress[${tmpTemplateDataAddress}] renderAsync:`);
          }
          let tmpRenderAnticipate = this.fable.newAnticipate();
          tmpRenderAnticipate.anticipate(this.onBeforeRenderAsync.bind(this));
          let tmpView = typeof tmpViewIdentifier === 'string' ? this.servicesMap.PictView[tmpViewIdentifier] : false;
          if (!tmpView) {
            let tmpErrorMessage = `PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} could not asynchronously render from View ${tmpViewIdentifier} because it is not a valid view.`;
            if (this.pict.LogNoisiness > 3) {
              this.log.error(tmpErrorMessage);
            }
            return tmpCallback(new Error(tmpErrorMessage));
          }
          tmpRenderAnticipate.anticipate(this.onRenderAsync.bind(this));
          tmpRenderAnticipate.anticipate(fNext => {
            tmpView.renderAsync.call(tmpView, tmpRenderableHash, tmpRenderDestinationAddress, tmpTemplateDataAddress, fNext);
          });
          tmpRenderAnticipate.anticipate(this.onAfterRenderAsync.bind(this));
          return tmpRenderAnticipate.wait(tmpCallback);
        }

        /**
         * @return {boolean}
         */
        onAfterRender() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} onAfterRender:`);
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterRenderAsync(fCallback) {
          this.onAfterRender();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        renderMainViewport() {
          if (this.pict.LogControlFlow) {
            this.log.trace(`PICT-ControlFlow APPLICATION [${this.UUID}]::[${this.Hash}] ${this.options.Name} renderMainViewport:`);
          }
          return this.render();
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        renderMainViewportAsync(fCallback) {
          if (this.pict.LogControlFlow) {
            this.log.trace(`PICT-ControlFlow APPLICATION [${this.UUID}]::[${this.Hash}] ${this.options.Name} renderMainViewportAsync:`);
          }
          return this.renderAsync(fCallback);
        }
        /**
         * @return {void}
         */
        renderAutoViews() {
          if (this.pict.LogNoisiness > 0) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} beginning renderAutoViews...`);
          }
          // Now walk through any loaded views and sort them by the AutoRender ordinal
          let tmpLoadedViews = Object.keys(this.pict.views);
          // Sort the views by their priority
          // If they are all the default priority 0, it will end up being add order due to JSON Object Property Key order stuff
          tmpLoadedViews.sort((a, b) => {
            return this.pict.views[a].options.AutoRenderOrdinal - this.pict.views[b].options.AutoRenderOrdinal;
          });
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            if (tmpView.options.AutoRender) {
              tmpView.render();
            }
          }
          if (this.pict.LogNoisiness > 0) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} renderAutoViewsAsync complete.`);
          }
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        renderAutoViewsAsync(fCallback) {
          let tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');

          // Allow the callback to be passed in as the last parameter no matter what
          let tmpCallback = typeof fCallback === 'function' ? fCallback : false;
          if (!tmpCallback) {
            this.log.warn(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} renderAutoViewsAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions.`);
            tmpCallback = pError => {
              if (pError) {
                this.log.error(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} renderAutoViewsAsync Auto Callback Error: ${pError}`, pError);
              }
            };
          }
          if (this.pict.LogNoisiness > 0) {
            this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} beginning renderAutoViewsAsync...`);
          }

          // Now walk through any loaded views and sort them by the AutoRender ordinal
          // TODO: Some optimization cleverness could be gained by grouping them into a parallelized async operation, by ordinal.
          let tmpLoadedViews = Object.keys(this.pict.views);
          // Sort the views by their priority
          // If they are all the default priority 0, it will end up being add order due to JSON Object Property Key order stuff
          tmpLoadedViews.sort((a, b) => {
            return this.pict.views[a].options.AutoRenderOrdinal - this.pict.views[b].options.AutoRenderOrdinal;
          });
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            if (tmpView.options.AutoRender) {
              tmpAnticipate.anticipate(tmpView.renderAsync.bind(tmpView));
            }
          }
          tmpAnticipate.wait(pError => {
            this.lastAutoRenderTimestamp = this.fable.log.getTimeStamp();
            if (this.pict.LogNoisiness > 0) {
              this.log.trace(`PictApp [${this.UUID}]::[${this.Hash}] ${this.options.Name} renderAutoViewsAsync complete.`);
            }
            return tmpCallback(pError);
          });
        }

        /**
         * @return {boolean}
         */
        get isPictApplication() {
          return true;
        }
      }
      module.exports = PictApplication;
    }, {
      "../package.json": 4,
      "fable-serviceproviderbase": 2
    }],
    6: [function (require, module, exports) {
      module.exports = {
        "name": "pict-provider",
        "version": "1.0.12",
        "description": "Pict Provider Base Class",
        "main": "source/Pict-Provider.js",
        "scripts": {
          "start": "node source/Pict-Provider.js",
          "test": "npx quack test",
          "tests": "npx quack test -g",
          "coverage": "npx quack coverage",
          "build": "npx quack build",
          "docker-dev-build": "docker build ./ -f Dockerfile_LUXURYCode -t pict-provider-image:local",
          "docker-dev-run": "docker run -it -d --name pict-provider-dev -p 24125:8080 -p 30027:8086 -v \"$PWD/.config:/home/coder/.config\"  -v \"$PWD:/home/coder/pict-provider\" -u \"$(id -u):$(id -g)\" -e \"DOCKER_USER=$USER\" pict-provider-image:local",
          "docker-dev-shell": "docker exec -it pict-provider-dev /bin/bash",
          "lint": "eslint source/**",
          "types": "tsc -p ."
        },
        "types": "types/source/Pict-Provider.d.ts",
        "repository": {
          "type": "git",
          "url": "git+https://github.com/stevenvelozo/pict-provider.git"
        },
        "author": "steven velozo <steven@velozo.com>",
        "license": "MIT",
        "bugs": {
          "url": "https://github.com/stevenvelozo/pict-provider/issues"
        },
        "homepage": "https://github.com/stevenvelozo/pict-provider#readme",
        "devDependencies": {
          "@eslint/js": "^9.39.1",
          "eslint": "^9.39.1",
          "pict": "^1.0.351",
          "quackage": "^1.0.58",
          "typescript": "^5.9.3"
        },
        "dependencies": {
          "fable-serviceproviderbase": "^3.0.19"
        },
        "mocha": {
          "diff": true,
          "extension": ["js"],
          "package": "./package.json",
          "reporter": "spec",
          "slow": "75",
          "timeout": "5000",
          "ui": "tdd",
          "watch-files": ["source/**/*.js", "test/**/*.js"],
          "watch-ignore": ["lib/vendor"]
        }
      };
    }, {}],
    7: [function (require, module, exports) {
      const libFableServiceBase = require('fable-serviceproviderbase');
      const libPackage = require('../package.json');
      const defaultPictProviderSettings = {
        ProviderIdentifier: false,
        // If this is set to true, when the App initializes this will.
        // After the App initializes, initialize will be called as soon as it's added.
        AutoInitialize: true,
        AutoInitializeOrdinal: 0,
        AutoLoadDataWithApp: true,
        AutoLoadDataOrdinal: 0,
        AutoSolveWithApp: true,
        AutoSolveOrdinal: 0,
        Manifests: {},
        Templates: []
      };
      class PictProvider extends libFableServiceBase {
        /**
         * @param {import('fable')} pFable - The Fable instance.
         * @param {Record<string, any>} [pOptions] - The options for the provider.
         * @param {string} [pServiceHash] - The service hash for the provider.
         */
        constructor(pFable, pOptions, pServiceHash) {
          // Intersect default options, parent constructor, service information
          let tmpOptions = Object.assign({}, JSON.parse(JSON.stringify(defaultPictProviderSettings)), pOptions);
          super(pFable, tmpOptions, pServiceHash);

          /** @type {import('fable') & import('pict') & { instantiateServiceProviderWithoutRegistration(pServiceType: string, pOptions?: Record<string, any>, pCustomServiceHash?: string): any }} */
          this.fable;
          /** @type {import('fable') & import('pict') & { instantiateServiceProviderWithoutRegistration(pServiceType: string, pOptions?: Record<string, any>, pCustomServiceHash?: string): any }} */
          this.pict;
          /** @type {any} */
          this.log;
          /** @type {Record<string, any>} */
          this.options;
          /** @type {string} */
          this.UUID;
          /** @type {string} */
          this.Hash;
          if (!this.options.ProviderIdentifier) {
            this.options.ProviderIdentifier = `AutoProviderID-${this.fable.getUUID()}`;
          }
          this.serviceType = 'PictProvider';
          /** @type {Record<string, any>} */
          this._Package = libPackage;

          // Convenience and consistency naming
          this.pict = this.fable;

          // Wire in the essential Pict application state
          /** @type {Record<string, any>} */
          this.AppData = this.pict.AppData;
          /** @type {Record<string, any>} */
          this.Bundle = this.pict.Bundle;
          this.initializeTimestamp = false;
          this.lastSolvedTimestamp = false;
          for (let i = 0; i < this.options.Templates.length; i++) {
            let tmpDefaultTemplate = this.options.Templates[i];
            if (!tmpDefaultTemplate.hasOwnProperty('Postfix') || !tmpDefaultTemplate.hasOwnProperty('Template')) {
              this.log.error(`PictProvider [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} could not load Default Template ${i} in the options array.`, tmpDefaultTemplate);
            } else {
              if (!tmpDefaultTemplate.Source) {
                tmpDefaultTemplate.Source = `PictProvider [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} options object.`;
              }
              this.pict.TemplateProvider.addDefaultTemplate(tmpDefaultTemplate.Prefix, tmpDefaultTemplate.Postfix, tmpDefaultTemplate.Template, tmpDefaultTemplate.Source);
            }
          }
        }

        /* -------------------------------------------------------------------------- */
        /*                        Code Section: Initialization                        */
        /* -------------------------------------------------------------------------- */
        onBeforeInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictProvider [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} onBeforeInitialize:`);
          }
          return true;
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after pre-pinitialization.
         *
         * @return {void}
         */
        onBeforeInitializeAsync(fCallback) {
          this.onBeforeInitialize();
          return fCallback();
        }
        onInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictProvider [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} onInitialize:`);
          }
          return true;
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after initialization.
         *
         * @return {void}
         */
        onInitializeAsync(fCallback) {
          this.onInitialize();
          return fCallback();
        }
        initialize() {
          if (this.pict.LogControlFlow) {
            this.log.trace(`PICT-ControlFlow PROVIDER [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} initialize:`);
          }
          if (!this.initializeTimestamp) {
            this.onBeforeInitialize();
            this.onInitialize();
            this.onAfterInitialize();
            this.initializeTimestamp = this.pict.log.getTimeStamp();
            return true;
          } else {
            this.log.warn(`PictProvider [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} initialize called but initialization is already completed.  Aborting.`);
            return false;
          }
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after initialization.
         *
         * @return {void}
         */
        initializeAsync(fCallback) {
          if (this.pict.LogControlFlow) {
            this.log.trace(`PICT-ControlFlow PROVIDER [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} initializeAsync:`);
          }
          if (!this.initializeTimestamp) {
            let tmpAnticipate = this.pict.instantiateServiceProviderWithoutRegistration('Anticipate');
            if (this.pict.LogNoisiness > 0) {
              this.log.info(`PictProvider [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} beginning initialization...`);
            }
            tmpAnticipate.anticipate(this.onBeforeInitializeAsync.bind(this));
            tmpAnticipate.anticipate(this.onInitializeAsync.bind(this));
            tmpAnticipate.anticipate(this.onAfterInitializeAsync.bind(this));
            tmpAnticipate.wait(pError => {
              this.initializeTimestamp = this.pict.log.getTimeStamp();
              if (pError) {
                this.log.error(`PictProvider [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} initialization failed: ${pError.message || pError}`, {
                  Stack: pError.stack
                });
              } else if (this.pict.LogNoisiness > 0) {
                this.log.info(`PictProvider [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} initialization complete.`);
              }
              return fCallback();
            });
          } else {
            this.log.warn(`PictProvider [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} async initialize called but initialization is already completed.  Aborting.`);
            // TODO: Should this be an error?
            return fCallback();
          }
        }
        onAfterInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictProvider [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} onAfterInitialize:`);
          }
          return true;
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after initialization.
         *
         * @return {void}
         */
        onAfterInitializeAsync(fCallback) {
          this.onAfterInitialize();
          return fCallback();
        }
        onPreRender() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictProvider [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} onPreRender:`);
          }
          return true;
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after pre-render.
         *
         * @return {void}
         */
        onPreRenderAsync(fCallback) {
          this.onPreRender();
          return fCallback();
        }
        render() {
          return this.onPreRender();
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after render.
         *
         * @return {void}
         */
        renderAsync(fCallback) {
          this.onPreRender();
          return fCallback();
        }
        onPreSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictProvider [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} onPreSolve:`);
          }
          return true;
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after pre-solve.
         *
         * @return {void}
         */
        onPreSolveAsync(fCallback) {
          this.onPreSolve();
          return fCallback();
        }
        solve() {
          return this.onPreSolve();
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after solve.
         *
         * @return {void}
         */
        solveAsync(fCallback) {
          this.onPreSolve();
          return fCallback();
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after the data pre-load.
         */
        onBeforeLoadDataAsync(fCallback) {
          return fCallback();
        }

        /**
         * Hook to allow the provider to load data during application data load.
         *
         * @param {(pError?: Error) => void} fCallback - The callback to call after the data load.
         */
        onLoadDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictProvider [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} onLoadDataAsync:`);
          }
          return fCallback();
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after the data post-load.
         */
        onAfterLoadDataAsync(fCallback) {
          return fCallback();
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after the data pre-load.
         *
         * @return {void}
         */
        onBeforeSaveDataAsync(fCallback) {
          return fCallback();
        }

        /**
         * Hook to allow the provider to load data during application data load.
         *
         * @param {(pError?: Error) => void} fCallback - The callback to call after the data load.
         *
         * @return {void}
         */
        onSaveDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictProvider [${this.UUID}]::[${this.Hash}] ${this.options.ProviderIdentifier} onSaveDataAsync:`);
          }
          return fCallback();
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after the data post-load.
         *
         * @return {void}
         */
        onAfterSaveDataAsync(fCallback) {
          return fCallback();
        }
      }
      module.exports = PictProvider;
    }, {
      "../package.json": 6,
      "fable-serviceproviderbase": 2
    }],
    8: [function (require, module, exports) {
      const libPictProvider = require('pict-provider');
      const libNavigo = require('navigo');
      const _DEFAULT_PROVIDER_CONFIGURATION = {
        ProviderIdentifier: 'Pict-Router',
        AutoInitialize: true,
        AutoInitializeOrdinal: 0,
        // When true, addRoute() will NOT auto-resolve after each route is added.
        // This is useful in auth-gated SPAs where routes should only resolve after
        // the DOM is ready (e.g. after login).  Can also be set globally via
        // pict.settings.RouterSkipRouteResolveOnAdd — either one enables the skip.
        SkipRouteResolveOnAdd: false
      };
      class PictRouter extends libPictProvider {
        constructor(pFable, pOptions, pServiceHash) {
          let tmpOptions = Object.assign({}, _DEFAULT_PROVIDER_CONFIGURATION, pOptions);
          super(pFable, tmpOptions, pServiceHash);

          // Initialize the navigo router and set the base path to '/'
          this.router = new libNavigo('/', {
            strategy: 'ONE',
            hash: true
          });
          if (this.options.Routes) {
            for (let i = 0; i < this.options.Routes.length; i++) {
              if (this.options.Routes[i].path && this.options.Routes[i].template) {
                this.addRoute(this.options.Routes[i].path, this.options.Routes[i].template);
              } else if (this.options.Routes[i].path && this.options.Routes[i].render) {
                this.addRoute(this.options.Routes[i].path, this.options.Routes[i].render);
              } else {
                this.pict.log.warn(`Route ${i} is missing a render function or template string.`);
              }
            }
          }

          // This is the route to render after load
          this.afterPersistView = '/Manyfest/Overview';
        }
        get currentScope() {
          return this.AppData?.ManyfestRecord?.Scope ?? 'Default';
        }
        forwardToScopedRoute(pData) {
          this.navigate(`${pData.url}/${this.currentScope}`);
        }
        onInitializeAsync(fCallback) {
          return super.onInitializeAsync(fCallback);
        }

        /**
         * Add a route to the router.
         */
        addRoute(pRoute, pRenderable) {
          if (typeof pRenderable === 'function') {
            this.router.on(pRoute, pRenderable);
          } else if (typeof pRenderable === 'string') {
            // Run this as a template, allowing some whack things with functions in template expressions.
            this.router.on(pRoute, pData => {
              this.pict.parseTemplate(pRenderable, pData, null, this.pict);
            });
          } else {
            // renderable isn't usable!
            this.pict.log.warn(`Route ${pRoute} has an invalid renderable.`);
            return;
          }

          // By default, resolve after each route is added (legacy behavior).
          // Applications can skip this by setting SkipRouteResolveOnAdd: true in
          // the provider config JSON, or globally via
          // pict.settings.RouterSkipRouteResolveOnAdd.  Either one will prevent
          // premature route resolution before views are rendered.
          if (!this.options.SkipRouteResolveOnAdd && !this.pict.settings.RouterSkipRouteResolveOnAdd) {
            this.resolve();
          }
        }

        /**
         * Navigate to a given route (set the browser URL string, add to history, trigger router)
         * 
         * @param {string} pRoute - The route to navigate to
         */
        navigate(pRoute) {
          this.router.navigate(pRoute);
        }

        /**
         * Navigate to the route currently in the browser's location hash.
         *
         * This is useful in auth-gated SPAs: when the user pastes a deep-link
         * (e.g. #/Books) and then logs in, calling navigateCurrent() will force
         * the router to fire the handler for whatever hash is already in the URL.
         * Unlike resolve(), navigate() always triggers the handler even if Navigo
         * has already "consumed" that URL.
         *
         * If the hash is empty or just "#/", this is a no-op and returns false.
         *
         * @returns {boolean} true if a route was navigated to, false otherwise
         */
        navigateCurrent() {
          let tmpHash = typeof window !== 'undefined' && window.location ? window.location.hash : '';
          if (tmpHash && tmpHash.length > 2 && tmpHash !== '#/') {
            let tmpRoute = tmpHash.replace(/^#/, '');
            this.navigate(tmpRoute);
            return true;
          }
          return false;
        }

        /**
         * Trigger the router resolving logic; this is expected to be called after all routes are added (to go to the default route).
         *
         */
        resolve() {
          this.router.resolve();
        }
      }
      module.exports = PictRouter;
      module.exports.default_configuration = _DEFAULT_PROVIDER_CONFIGURATION;
    }, {
      "navigo": 3,
      "pict-provider": 7
    }],
    9: [function (require, module, exports) {
      /**
       * Simple syntax highlighter for use with CodeJar.
       *
       * Provides basic keyword/string/number/comment highlighting for common languages.
       * Can be replaced with Prism.js or highlight.js for more sophisticated highlighting
       * by passing a custom highlight function to the view options.
       *
       * @module Pict-Code-Highlighter
       */

      // Language definition map
      const _LanguageDefinitions = {
        'javascript': {
          // Combined regex to tokenize: comments, strings, template literals, regex, then everything else
          tokenizer: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(["'])(?:(?!\2|\\).|\\.)*?\2|(`(?:[^`\\]|\\.)*?`)|(\/(?![/*])(?:\\.|\[(?:\\.|[^\]])*\]|[^/\\\n])+\/[gimsuvy]*)/g,
          keywords: /\b(async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|get|if|import|in|instanceof|let|new|of|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/g,
          builtins: /\b(true|false|null|undefined|NaN|Infinity|console|window|document|Math|JSON|Array|Object|String|Number|Boolean|Date|RegExp|Map|Set|Promise|Error|Symbol|parseInt|parseFloat|require|module|exports)\b/g,
          numbers: /\b(\d+\.?\d*(?:e[+-]?\d+)?|0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+)\b/g
        },
        'json': {
          tokenizer: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*")/g,
          keywords: /\b(true|false|null)\b/g,
          numbers: /-?\b\d+\.?\d*(?:e[+-]?\d+)?\b/g
        },
        'html': {
          // Tokenizer captures: (1) comments, (2) strings, (3) tags with attributes
          tokenizer: /(<!--[\s\S]*?-->)|(["'])(?:(?!\2|\\).|\\.)*?\2|(<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s+[a-zA-Z-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*))?)*\s*\/?>)/g,
          // tagToken group index for identifying tag matches
          tagGroupIndex: 3
        },
        'css': {
          tokenizer: /(\/\*[\s\S]*?\*\/)|(["'])(?:(?!\2|\\).|\\.)*?\2/g,
          selectors: /([.#]?[a-zA-Z_][\w-]*(?:\s*[>+~]\s*[.#]?[a-zA-Z_][\w-]*)*)\s*\{/g,
          properties: /\b([a-zA-Z-]+)\s*:/g,
          numbers: /\b(\d+\.?\d*)(px|em|rem|%|vh|vw|s|ms|deg|fr)?\b/g,
          keywords: /\b(important|inherit|initial|unset|none|auto|block|inline|flex|grid)\b/g
        },
        'sql': {
          tokenizer: /(--[^\n]*|\/\*[\s\S]*?\*\/)|(["'])(?:(?!\2|\\).|\\.)*?\2/g,
          keywords: /\b(SELECT|FROM|WHERE|AND|OR|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|ADD|COLUMN|INDEX|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|COUNT|SUM|AVG|MIN|MAX|NOT|NULL|IS|IN|BETWEEN|LIKE|EXISTS|CASE|WHEN|THEN|ELSE|END|PRIMARY|KEY|FOREIGN|REFERENCES|CONSTRAINT|DEFAULT|CHECK|UNIQUE|CASCADE|GRANT|REVOKE|COMMIT|ROLLBACK|BEGIN|TRANSACTION|INT|VARCHAR|DATETIME|AUTO_INCREMENT|CURRENT_TIMESTAMP)\b/gi,
          numbers: /\b\d+\.?\d*\b/g
        }
      };

      // Alias some common language names
      _LanguageDefinitions['js'] = _LanguageDefinitions['javascript'];
      _LanguageDefinitions['htm'] = _LanguageDefinitions['html'];

      /**
       * Escape HTML special characters to prevent XSS when inserting into innerHTML.
       *
       * @param {string} pString - The string to escape
       * @returns {string} The escaped string
       */
      function escapeHTML(pString) {
        return pString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      /**
       * Highlight a segment of code that is NOT inside a string or comment.
       * This applies keyword, number, and structural highlighting.
       *
       * @param {string} pCode - The code segment to highlight (already HTML-escaped)
       * @param {object} pLanguageDef - The language definition
       * @returns {string} The highlighted HTML
       */
      function highlightCodeSegment(pCode, pLanguageDef) {
        let tmpResult = pCode;

        // CSS selectors
        if (pLanguageDef.selectors) {
          pLanguageDef.selectors.lastIndex = 0;
          tmpResult = tmpResult.replace(pLanguageDef.selectors, '<span class="function-name">$1</span>{');
        }

        // CSS properties
        if (pLanguageDef.properties) {
          pLanguageDef.properties.lastIndex = 0;
          tmpResult = tmpResult.replace(pLanguageDef.properties, '<span class="property">$1</span>:');
        }

        // Keywords
        if (pLanguageDef.keywords) {
          pLanguageDef.keywords.lastIndex = 0;
          tmpResult = tmpResult.replace(pLanguageDef.keywords, '<span class="keyword">$1</span>');
        }

        // Builtins
        if (pLanguageDef.builtins) {
          pLanguageDef.builtins.lastIndex = 0;
          tmpResult = tmpResult.replace(pLanguageDef.builtins, '<span class="keyword">$1</span>');
        }

        // Numbers (CSS numbers may have units as a capture group, others do not)
        if (pLanguageDef.numbers) {
          pLanguageDef.numbers.lastIndex = 0;
          tmpResult = tmpResult.replace(pLanguageDef.numbers, pMatch => {
            return `<span class="number">${pMatch}</span>`;
          });
        }
        return tmpResult;
      }

      /**
       * Highlight an HTML tag token, applying tag name, attribute name, and attribute value colors.
       *
       * The approach: parse the raw tag into structured pieces first, then build the
       * highlighted output from those pieces. This avoids mixing raw text with HTML span
       * tags, which would cause regex replacements to match span attributes on subsequent passes.
       *
       * @param {string} pTag - The raw (unescaped) tag string
       * @returns {string} The highlighted HTML
       */
      function highlightHTMLTag(pTag) {
        let tmpResult = '';
        let tmpRest = pTag;

        // 1. Extract the opening bracket and tag name: < or </  followed by tagname
        let tmpTagNameMatch = tmpRest.match(/^(<\/?)([a-zA-Z][a-zA-Z0-9-]*)/);
        if (!tmpTagNameMatch) {
          // Not a recognizable tag, just escape the whole thing
          return escapeHTML(pTag);
        }
        tmpResult += escapeHTML(tmpTagNameMatch[1]);
        tmpResult += '<span class="tag">' + escapeHTML(tmpTagNameMatch[2]) + '</span>';
        tmpRest = tmpRest.substring(tmpTagNameMatch[0].length);

        // 2. Parse attributes from the remaining text (before the closing > or />)
        // Repeatedly match: whitespace + attr-name + optional =value
        let tmpAttrRegex = /^(\s+)([a-zA-Z-]+)(?:(\s*=\s*)(["'])([^"']*?)\4)?/;
        let tmpAttrMatch;
        while ((tmpAttrMatch = tmpRest.match(tmpAttrRegex)) !== null) {
          // Whitespace before the attribute
          tmpResult += tmpAttrMatch[1];
          // Attribute name
          tmpResult += '<span class="attr-name">' + escapeHTML(tmpAttrMatch[2]) + '</span>';

          // If there's an = value part
          if (tmpAttrMatch[3]) {
            tmpResult += escapeHTML(tmpAttrMatch[3]);
            tmpResult += '<span class="attr-value">' + escapeHTML(tmpAttrMatch[4]) + escapeHTML(tmpAttrMatch[5]) + escapeHTML(tmpAttrMatch[4]) + '</span>';
          }
          tmpRest = tmpRest.substring(tmpAttrMatch[0].length);
        }

        // 3. Whatever remains (whitespace, />, >) — escape it all
        tmpResult += escapeHTML(tmpRest);
        return tmpResult;
      }

      /**
       * Create a highlight function for a given language.
       *
       * The approach: use a single tokenizer regex to split the code into protected tokens
       * (comments, strings) and code segments. Process each segment independently.
       * This avoids placeholder/sentinel issues entirely.
       *
       * @param {string} pLanguage - The language identifier (e.g. "javascript", "json", "html")
       * @returns {function} A function that takes an element and highlights its textContent
       */
      function createHighlighter(pLanguage) {
        return function highlightElement(pElement) {
          let tmpCode = pElement.textContent;
          let tmpLanguageName = typeof pLanguage === 'string' ? pLanguage.toLowerCase() : 'javascript';
          let tmpLanguageDef = _LanguageDefinitions[tmpLanguageName];
          if (!tmpLanguageDef) {
            // No highlighting rules for this language; just escape and return
            pElement.innerHTML = escapeHTML(tmpCode);
            return;
          }
          if (!tmpLanguageDef.tokenizer) {
            // No tokenizer; just escape and apply keyword highlighting
            pElement.innerHTML = highlightCodeSegment(escapeHTML(tmpCode), tmpLanguageDef);
            return;
          }

          // Split the code into tokens using the tokenizer regex.
          // The tokenizer captures comments and strings as groups.
          // We process everything between matches as code.
          let tmpResult = '';
          let tmpLastIndex = 0;
          let tmpTagGroupIndex = tmpLanguageDef.tagGroupIndex || 0;
          tmpLanguageDef.tokenizer.lastIndex = 0;
          let tmpMatch;
          while ((tmpMatch = tmpLanguageDef.tokenizer.exec(tmpCode)) !== null) {
            // Add the code segment before this match
            if (tmpMatch.index > tmpLastIndex) {
              let tmpSegment = tmpCode.substring(tmpLastIndex, tmpMatch.index);
              tmpResult += highlightCodeSegment(escapeHTML(tmpSegment), tmpLanguageDef);
            }
            let tmpFullMatch = tmpMatch[0];

            // Determine token type from capture groups
            // Group 1 is always comments, Group 2+ are strings/template literals/regex
            if (tmpMatch[1]) {
              // Comment
              tmpResult += `<span class="comment">${escapeHTML(tmpFullMatch)}</span>`;
            } else if (tmpTagGroupIndex > 0 && tmpMatch[tmpTagGroupIndex]) {
              // HTML tag — highlight tag name, attributes, and values
              tmpResult += highlightHTMLTag(tmpFullMatch);
            } else {
              // String, template literal, or regex
              tmpResult += `<span class="string">${escapeHTML(tmpFullMatch)}</span>`;
            }
            tmpLastIndex = tmpLanguageDef.tokenizer.lastIndex;
          }

          // Add any remaining code after the last match
          if (tmpLastIndex < tmpCode.length) {
            let tmpSegment = tmpCode.substring(tmpLastIndex);
            tmpResult += highlightCodeSegment(escapeHTML(tmpSegment), tmpLanguageDef);
          }
          pElement.innerHTML = tmpResult;
        };
      }
      module.exports = createHighlighter;
      module.exports.LanguageDefinitions = _LanguageDefinitions;
    }, {}],
    10: [function (require, module, exports) {
      module.exports = {
        "RenderOnLoad": true,
        "DefaultRenderable": "CodeEditor-Wrap",
        "DefaultDestinationAddress": "#CodeEditor-Container-Div",
        "Templates": [{
          "Hash": "CodeEditor-Container",
          "Template": "<!-- CodeEditor-Container Rendering Soon -->"
        }],
        "Renderables": [{
          "RenderableHash": "CodeEditor-Wrap",
          "TemplateHash": "CodeEditor-Container",
          "DestinationAddress": "#CodeEditor-Container-Div"
        }],
        "TargetElementAddress": "#CodeEditor-Container-Div",
        // Address in AppData or other Pict address space to read/write code content
        "CodeDataAddress": false,
        // The language for syntax highlighting (e.g. "javascript", "html", "css", "json")
        "Language": "javascript",
        // Whether the editor is read-only
        "ReadOnly": false,
        // Tab character: use tab or spaces
        "Tab": "\t",
        // Whether to indent with the same whitespace as the previous line
        "IndentOn": /[({[]$/,
        // Whether to add a closing bracket/paren/brace
        "MoveToNewLine": /^[)}\]]/,
        // Whether to handle the closing character
        "AddClosing": true,
        // Whether to preserve indentation on new lines
        "CatchTab": true,
        // Whether to show line numbers
        "LineNumbers": true,
        // Default code content if no address is provided
        "DefaultCode": "// Enter your code here\n",
        // CSS for the code editor
        "CSS": `.pict-code-editor-wrap
{
	display: flex;
	font-family: 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
	font-size: 14px;
	line-height: 1.5;
	border: 1px solid #D0D0D0;
	border-radius: 4px;
	overflow: hidden;
}
.pict-code-editor-wrap .pict-code-line-numbers
{
	width: 40px;
	min-width: 40px;
	padding: 10px 0;
	text-align: right;
	background: #F5F5F5;
	border-right: 1px solid #D0D0D0;
	color: #999;
	font-size: 13px;
	line-height: 1.5;
	user-select: none;
	pointer-events: none;
	box-sizing: border-box;
}
.pict-code-editor-wrap .pict-code-line-numbers span
{
	display: block;
	padding: 0 8px 0 0;
}
.pict-code-editor-wrap .pict-code-editor
{
	margin: 0;
	padding: 10px 10px 10px 8px;
	min-height: 100px;
	flex: 1;
	min-width: 0;
	outline: none;
	tab-size: 4;
	white-space: pre;
	overflow-wrap: normal;
	color: #383A42;
	background: #FAFAFA;
	caret-color: #526FFF;
	border-radius: 0 4px 4px 0;
}
.pict-code-editor-wrap .pict-code-editor.pict-code-no-line-numbers
{
	padding-left: 10px;
	border-radius: 4px;
}
.pict-code-editor-wrap .pict-code-editor .keyword { color: #A626A4; }
.pict-code-editor-wrap .pict-code-editor .string { color: #50A14F; }
.pict-code-editor-wrap .pict-code-editor .number { color: #986801; }
.pict-code-editor-wrap .pict-code-editor .comment { color: #A0A1A7; font-style: italic; }
.pict-code-editor-wrap .pict-code-editor .operator { color: #0184BC; }
.pict-code-editor-wrap .pict-code-editor .punctuation { color: #383A42; }
.pict-code-editor-wrap .pict-code-editor .function-name { color: #4078F2; }
.pict-code-editor-wrap .pict-code-editor .property { color: #E45649; }
.pict-code-editor-wrap .pict-code-editor .tag { color: #E45649; }
.pict-code-editor-wrap .pict-code-editor .attr-name { color: #986801; }
.pict-code-editor-wrap .pict-code-editor .attr-value { color: #50A14F; }
`
      };
    }, {}],
    11: [function (require, module, exports) {
      const libPictViewClass = require('pict-view');
      const libCreateHighlighter = require('./Pict-Code-Highlighter.js');
      const _DefaultConfiguration = require('./Pict-Section-Code-DefaultConfiguration.js');
      class PictSectionCode extends libPictViewClass {
        constructor(pFable, pOptions, pServiceHash) {
          let tmpOptions = Object.assign({}, _DefaultConfiguration, pOptions);
          super(pFable, tmpOptions, pServiceHash);
          this.initialRenderComplete = false;

          // The CodeJar instance
          this.codeJar = null;

          // The highlight function (can be overridden)
          this._highlightFunction = null;

          // The current language
          this._language = this.options.Language || 'javascript';
        }
        onBeforeInitialize() {
          super.onBeforeInitialize();
          this._codeJarPrototype = null;
          this.targetElement = false;

          // Build the default highlight function for the configured language
          this._highlightFunction = libCreateHighlighter(this._language);
          return super.onBeforeInitialize();
        }

        /**
         * Connect the CodeJar prototype.  If not passed explicitly, try to find it
         * as a global (window.CodeJar) or require it from the npm package.
         *
         * @param {function} [pCodeJarPrototype] - The CodeJar constructor function
         * @returns {boolean|void}
         */
        connectCodeJarPrototype(pCodeJarPrototype) {
          if (typeof pCodeJarPrototype === 'function') {
            this._codeJarPrototype = pCodeJarPrototype;
            return;
          }

          // Try to find CodeJar in global scope
          if (typeof window !== 'undefined') {
            if (typeof window.CodeJar === 'function') {
              this.log.trace(`PICT-Code Found CodeJar in window.CodeJar.`);
              this._codeJarPrototype = window.CodeJar;
              return;
            }
          }
          this.log.error(`PICT-Code No CodeJar prototype found. Include codejar via script tag or call connectCodeJarPrototype(CodeJar) explicitly.`);
          return false;
        }
        onAfterRender(pRenderable) {
          // Ensure the CSS from all registered views is injected into the DOM
          this.pict.CSSMap.injectCSS();
          if (!this.initialRenderComplete) {
            this.onAfterInitialRender();
            this.initialRenderComplete = true;
          }
          return super.onAfterRender(pRenderable);
        }
        onAfterInitialRender() {
          // Resolve the CodeJar prototype if not already set
          if (!this._codeJarPrototype) {
            this.connectCodeJarPrototype();
          }
          if (!this._codeJarPrototype) {
            this.log.error(`PICT-Code Cannot initialize editor; no CodeJar prototype available.`);
            return false;
          }
          if (this.codeJar) {
            this.log.error(`PICT-Code editor is already initialized!`);
            return false;
          }

          // Find the target element
          let tmpTargetElementSet = this.services.ContentAssignment.getElement(this.options.TargetElementAddress);
          if (!tmpTargetElementSet || tmpTargetElementSet.length < 1) {
            this.log.error(`PICT-Code Could not find target element [${this.options.TargetElementAddress}]!`);
            this.targetElement = false;
            return false;
          }
          this.targetElement = tmpTargetElementSet[0];

          // Build the editor DOM structure
          this._buildEditorDOM();

          // Get initial code content
          let tmpCode = this._resolveCodeContent();

          // Create the CodeJar options
          let tmpCodeJarOptions = {};
          if (this.options.Tab) {
            tmpCodeJarOptions.tab = this.options.Tab;
          }
          if (this.options.IndentOn) {
            tmpCodeJarOptions.indentOn = this.options.IndentOn;
          }
          if (this.options.MoveToNewLine) {
            tmpCodeJarOptions.moveToNewLine = this.options.MoveToNewLine;
          }
          if (typeof this.options.AddClosing !== 'undefined') {
            tmpCodeJarOptions.addClosing = this.options.AddClosing;
          }
          if (typeof this.options.CatchTab !== 'undefined') {
            tmpCodeJarOptions.catchTab = this.options.CatchTab;
          }
          this.customConfigureEditorOptions(tmpCodeJarOptions);

          // Instantiate CodeJar on the editor element
          let tmpEditorElement = this._editorElement;
          this.codeJar = this._codeJarPrototype(tmpEditorElement, this._highlightFunction, tmpCodeJarOptions);

          // CodeJar forces white-space:pre-wrap and overflow-wrap:break-word
          // via inline styles, which causes line wrapping that breaks the
          // line-number alignment.  Override back to non-wrapping so the
          // wrap container scrolls horizontally instead.
          this._resetEditorWrapStyles();

          // Set the initial code
          if (tmpCode) {
            this.codeJar.updateCode(tmpCode);
          }

          // Wire up the change handler
          this.codeJar.onUpdate(pCode => {
            this._updateLineNumbers();
            this.onCodeChange(pCode);
          });

          // Initial line number render
          this._updateLineNumbers();

          // Handle read-only
          if (this.options.ReadOnly) {
            tmpEditorElement.setAttribute('contenteditable', 'false');
          }
        }

        /**
         * Build the editor DOM elements inside the target container.
         */
        _buildEditorDOM() {
          // Clear the target
          this.targetElement.innerHTML = '';

          // Create wrapper
          let tmpWrap = document.createElement('div');
          tmpWrap.className = 'pict-code-editor-wrap';

          // Create line numbers container
          if (this.options.LineNumbers) {
            let tmpLineNumbers = document.createElement('div');
            tmpLineNumbers.className = 'pict-code-line-numbers';
            tmpWrap.appendChild(tmpLineNumbers);
            this._lineNumbersElement = tmpLineNumbers;
          }

          // Create the editor element (CodeJar needs a pre or div)
          let tmpEditor = document.createElement('div');
          tmpEditor.className = 'pict-code-editor language-' + this._language;
          if (!this.options.LineNumbers) {
            tmpEditor.className += ' pict-code-no-line-numbers';
          }
          tmpWrap.appendChild(tmpEditor);
          this.targetElement.appendChild(tmpWrap);
          this._editorElement = tmpEditor;
          this._wrapElement = tmpWrap;
        }

        /**
         * Update the line numbers display based on current code content.
         */
        _updateLineNumbers() {
          if (!this.options.LineNumbers || !this._lineNumbersElement || !this._editorElement) {
            return;
          }
          let tmpCode = this._editorElement.textContent || '';
          let tmpLineCount = tmpCode.split('\n').length;
          let tmpHTML = '';
          for (let i = 1; i <= tmpLineCount; i++) {
            tmpHTML += `<span>${i}</span>`;
          }
          this._lineNumbersElement.innerHTML = tmpHTML;
        }

        /**
         * Reset inline styles that CodeJar sets on the editor element.
         *
         * CodeJar forces white-space:pre-wrap and overflow-wrap:break-word so
         * long lines wrap visually.  That breaks line-number alignment because
         * each wrapped visual row is not a logical line.  Resetting to pre /
         * normal makes the outer .pict-code-editor-wrap scroll horizontally.
         */
        _resetEditorWrapStyles() {
          if (!this._editorElement) {
            return;
          }
          this._editorElement.style.whiteSpace = 'pre';
          this._editorElement.style.overflowWrap = 'normal';
        }

        /**
         * Resolve the initial code content from address or default.
         *
         * @returns {string} The code content
         */
        _resolveCodeContent() {
          if (this.options.CodeDataAddress) {
            const tmpAddressSpace = {
              Fable: this.fable,
              Pict: this.fable,
              AppData: this.AppData,
              Bundle: this.Bundle,
              Options: this.options
            };
            let tmpAddressedData = this.fable.manifest.getValueByHash(tmpAddressSpace, this.options.CodeDataAddress);
            if (typeof tmpAddressedData === 'string') {
              return tmpAddressedData;
            } else {
              this.log.warn(`PICT-Code Address [${this.options.CodeDataAddress}] did not return a string; it was ${typeof tmpAddressedData}.`);
            }
          }
          return this.options.DefaultCode || '';
        }

        /**
         * Hook for subclasses to customize CodeJar options before instantiation.
         *
         * @param {object} pOptions - The CodeJar options object to modify
         */
        customConfigureEditorOptions(pOptions) {
          // Override in subclass to tweak options
        }

        /**
         * Called when the code content changes.  Override in subclasses to handle changes.
         *
         * @param {string} pCode - The new code content
         */
        onCodeChange(pCode) {
          // Write back to data address if configured
          if (this.options.CodeDataAddress) {
            const tmpAddressSpace = {
              Fable: this.fable,
              Pict: this.fable,
              AppData: this.AppData,
              Bundle: this.Bundle,
              Options: this.options
            };
            this.fable.manifest.setValueByHash(tmpAddressSpace, this.options.CodeDataAddress, pCode);
          }
        }

        // -- Public API Methods --

        /**
         * Get the current code content.
         *
         * @returns {string} The current code
         */
        getCode() {
          if (!this.codeJar) {
            this.log.warn('PICT-Code getCode called before editor initialized.');
            return '';
          }
          return this.codeJar.toString();
        }

        /**
         * Set the code content.
         *
         * @param {string} pCode - The code to set
         */
        setCode(pCode) {
          if (!this.codeJar) {
            this.log.warn('PICT-Code setCode called before editor initialized.');
            return;
          }
          this.codeJar.updateCode(pCode);
          this._updateLineNumbers();
        }

        /**
         * Change the editor language and re-highlight.
         *
         * @param {string} pLanguage - The language identifier
         */
        setLanguage(pLanguage) {
          this._language = pLanguage;
          this._highlightFunction = libCreateHighlighter(pLanguage);
          if (this._editorElement) {
            // Update the class
            this._editorElement.className = 'pict-code-editor language-' + pLanguage;
            if (!this.options.LineNumbers) {
              this._editorElement.className += ' pict-code-no-line-numbers';
            }
          }
          if (this.codeJar) {
            // Re-create the editor with the new highlight function
            let tmpCode = this.codeJar.toString();
            this.codeJar.destroy();
            this.codeJar = this._codeJarPrototype(this._editorElement, this._highlightFunction, {
              tab: this.options.Tab,
              catchTab: this.options.CatchTab,
              addClosing: this.options.AddClosing
            });
            this._resetEditorWrapStyles();
            this.codeJar.updateCode(tmpCode);
            this.codeJar.onUpdate(pCode => {
              this._updateLineNumbers();
              this.onCodeChange(pCode);
            });
          }
        }

        /**
         * Set a custom highlight function to replace the built-in highlighter.
         * Useful for integrating Prism.js, highlight.js, or any other library.
         *
         * @param {function} pHighlightFunction - A function that takes a DOM element and highlights its textContent
         */
        setHighlightFunction(pHighlightFunction) {
          if (typeof pHighlightFunction !== 'function') {
            this.log.error('PICT-Code setHighlightFunction requires a function.');
            return;
          }
          this._highlightFunction = pHighlightFunction;
          if (this.codeJar) {
            let tmpCode = this.codeJar.toString();
            this.codeJar.destroy();
            this.codeJar = this._codeJarPrototype(this._editorElement, this._highlightFunction, {
              tab: this.options.Tab,
              catchTab: this.options.CatchTab,
              addClosing: this.options.AddClosing
            });
            this._resetEditorWrapStyles();
            this.codeJar.updateCode(tmpCode);
            this.codeJar.onUpdate(pCode => {
              this._updateLineNumbers();
              this.onCodeChange(pCode);
            });
          }
        }

        /**
         * Set the read-only state of the editor.
         *
         * @param {boolean} pReadOnly - Whether the editor should be read-only
         */
        setReadOnly(pReadOnly) {
          this.options.ReadOnly = pReadOnly;
          if (this._editorElement) {
            this._editorElement.setAttribute('contenteditable', pReadOnly ? 'false' : 'true');
          }
        }

        /**
         * Destroy the editor and clean up.
         */
        destroy() {
          if (this.codeJar) {
            this.codeJar.destroy();
            this.codeJar = null;
          }
        }

        /**
         * Marshal code content from the data address into the view.
         */
        marshalToView() {
          super.marshalToView();
          if (this.codeJar && this.options.CodeDataAddress) {
            let tmpCode = this._resolveCodeContent();
            if (typeof tmpCode === 'string') {
              this.codeJar.updateCode(tmpCode);
              this._updateLineNumbers();
            }
          }
        }

        /**
         * Marshal the current code content back to the data address.
         */
        marshalFromView() {
          super.marshalFromView();
          if (this.codeJar && this.options.CodeDataAddress) {
            this.onCodeChange(this.codeJar.toString());
          }
        }
      }
      module.exports = PictSectionCode;
      module.exports.default_configuration = _DefaultConfiguration;
      module.exports.createHighlighter = libCreateHighlighter;
    }, {
      "./Pict-Code-Highlighter.js": 9,
      "./Pict-Section-Code-DefaultConfiguration.js": 10,
      "pict-view": 21
    }],
    12: [function (require, module, exports) {
      /**
       * Pict-Modal-Confirm
       *
       * Builds confirm and double-confirm dialog DOM, returns Promises.
       */
      class PictModalConfirm {
        constructor(pModal) {
          this._modal = pModal;
        }

        /**
         * Show a single-step confirmation dialog.
         *
         * @param {string} pMessage - The confirmation message
         * @param {object} [pOptions] - Options (title, confirmLabel, cancelLabel, dangerous)
         * @returns {Promise<boolean>}
         */
        confirm(pMessage, pOptions) {
          let tmpOptions = Object.assign({}, this._modal.options.DefaultConfirmOptions, pOptions);
          return new Promise(fResolve => {
            let tmpDialog = this._buildDialog(tmpOptions.title, pMessage, fResolve, tmpOptions);
            this._showDialog(tmpDialog, fResolve);
          });
        }

        /**
         * Show a two-step confirmation dialog.
         *
         * If confirmPhrase is provided, user must type it to enable the confirm button.
         * Otherwise, first click changes button text, second click confirms.
         *
         * @param {string} pMessage - The confirmation message
         * @param {object} [pOptions] - Options (title, confirmPhrase, phrasePrompt, confirmLabel, cancelLabel)
         * @returns {Promise<boolean>}
         */
        doubleConfirm(pMessage, pOptions) {
          let tmpOptions = Object.assign({}, this._modal.options.DefaultDoubleConfirmOptions, pOptions);
          return new Promise(fResolve => {
            let tmpDialog = this._buildDoubleConfirmDialog(tmpOptions.title, pMessage, fResolve, tmpOptions);
            this._showDialog(tmpDialog, fResolve);
          });
        }

        /**
         * Build a standard confirm dialog element.
         *
         * @param {string} pTitle
         * @param {string} pMessage
         * @param {function} fResolve - Promise resolver
         * @param {object} pOptions
         * @returns {HTMLElement}
         */
        _buildDialog(pTitle, pMessage, fResolve, pOptions) {
          let tmpId = this._modal._nextId();
          let tmpBtnStyle = pOptions.dangerous ? 'danger' : 'primary';
          let tmpDialog = document.createElement('div');
          tmpDialog.className = 'pict-modal-dialog';
          tmpDialog.id = 'pict-modal-' + tmpId;
          tmpDialog.setAttribute('role', 'dialog');
          tmpDialog.setAttribute('aria-modal', 'true');
          tmpDialog.style.width = '420px';
          tmpDialog.innerHTML = '<div class="pict-modal-dialog-header">' + '<span class="pict-modal-dialog-title">' + this._escapeHTML(pTitle) + '</span>' + '<button class="pict-modal-dialog-close" aria-label="Close">&times;</button>' + '</div>' + '<div class="pict-modal-dialog-body">' + '<p>' + this._escapeHTML(pMessage) + '</p>' + '</div>' + '<div class="pict-modal-dialog-footer">' + '<button class="pict-modal-btn" data-action="cancel">' + this._escapeHTML(pOptions.cancelLabel) + '</button>' + '<button class="pict-modal-btn pict-modal-btn--' + tmpBtnStyle + '" data-action="confirm">' + this._escapeHTML(pOptions.confirmLabel) + '</button>' + '</div>';
          let tmpCloseBtn = tmpDialog.querySelector('.pict-modal-dialog-close');
          let tmpCancelBtn = tmpDialog.querySelector('[data-action="cancel"]');
          let tmpConfirmBtn = tmpDialog.querySelector('[data-action="confirm"]');
          let tmpDismiss = pResult => {
            this._dismissDialog(tmpDialog, pResult, fResolve);
          };
          tmpCloseBtn.addEventListener('click', () => {
            tmpDismiss(false);
          });
          tmpCancelBtn.addEventListener('click', () => {
            tmpDismiss(false);
          });
          tmpConfirmBtn.addEventListener('click', () => {
            tmpDismiss(true);
          });
          tmpDialog._dismiss = tmpDismiss;
          tmpDialog._focusTarget = tmpCancelBtn;
          return tmpDialog;
        }

        /**
         * Build a double-confirm dialog element.
         *
         * @param {string} pTitle
         * @param {string} pMessage
         * @param {function} fResolve - Promise resolver
         * @param {object} pOptions
         * @returns {HTMLElement}
         */
        _buildDoubleConfirmDialog(pTitle, pMessage, fResolve, pOptions) {
          let tmpId = this._modal._nextId();
          let tmpHasPhrase = typeof pOptions.confirmPhrase === 'string' && pOptions.confirmPhrase.length > 0;
          let tmpDialog = document.createElement('div');
          tmpDialog.className = 'pict-modal-dialog';
          tmpDialog.id = 'pict-modal-' + tmpId;
          tmpDialog.setAttribute('role', 'dialog');
          tmpDialog.setAttribute('aria-modal', 'true');
          tmpDialog.style.width = '420px';
          let tmpBodyContent = '<p>' + this._escapeHTML(pMessage) + '</p>';
          if (tmpHasPhrase) {
            let tmpPromptText = pOptions.phrasePrompt.replace('{phrase}', pOptions.confirmPhrase);
            tmpBodyContent += '<div class="pict-modal-confirm-prompt">' + this._escapeHTML(tmpPromptText) + '</div>' + '<input type="text" class="pict-modal-confirm-input" autocomplete="off" spellcheck="false" />';
          }
          tmpDialog.innerHTML = '<div class="pict-modal-dialog-header">' + '<span class="pict-modal-dialog-title">' + this._escapeHTML(pTitle) + '</span>' + '<button class="pict-modal-dialog-close" aria-label="Close">&times;</button>' + '</div>' + '<div class="pict-modal-dialog-body">' + tmpBodyContent + '</div>' + '<div class="pict-modal-dialog-footer">' + '<button class="pict-modal-btn" data-action="cancel">' + this._escapeHTML(pOptions.cancelLabel) + '</button>' + '<button class="pict-modal-btn pict-modal-btn--danger" data-action="confirm" disabled>' + this._escapeHTML(pOptions.confirmLabel) + '</button>' + '</div>';
          let tmpCloseBtn = tmpDialog.querySelector('.pict-modal-dialog-close');
          let tmpCancelBtn = tmpDialog.querySelector('[data-action="cancel"]');
          let tmpConfirmBtn = tmpDialog.querySelector('[data-action="confirm"]');
          let tmpDismiss = pResult => {
            this._dismissDialog(tmpDialog, pResult, fResolve);
          };
          tmpCloseBtn.addEventListener('click', () => {
            tmpDismiss(false);
          });
          tmpCancelBtn.addEventListener('click', () => {
            tmpDismiss(false);
          });
          if (tmpHasPhrase) {
            // Phrase-based: enable confirm button when input matches
            let tmpInput = tmpDialog.querySelector('.pict-modal-confirm-input');
            tmpInput.addEventListener('input', () => {
              tmpConfirmBtn.disabled = tmpInput.value !== pOptions.confirmPhrase;
            });
            tmpConfirmBtn.addEventListener('click', () => {
              if (!tmpConfirmBtn.disabled) {
                tmpDismiss(true);
              }
            });
            tmpDialog._focusTarget = tmpInput;
          } else {
            // Two-click: first click changes label, second click confirms
            let tmpClickCount = 0;
            let tmpOriginalLabel = pOptions.confirmLabel;
            tmpConfirmBtn.disabled = false;
            tmpConfirmBtn.addEventListener('click', () => {
              tmpClickCount++;
              if (tmpClickCount === 1) {
                tmpConfirmBtn.textContent = 'Click again to confirm';
              } else {
                tmpDismiss(true);
              }
            });
            tmpDialog._focusTarget = tmpCancelBtn;
          }
          tmpDialog._dismiss = tmpDismiss;
          return tmpDialog;
        }

        /**
         * Show a dialog element: append to body, show overlay, animate in.
         *
         * @param {HTMLElement} pDialog
         * @param {function} fResolve - Promise resolver (for overlay click dismiss)
         */
        _showDialog(pDialog, fResolve) {
          let tmpModalEntry = {
            element: pDialog,
            dismiss: pDialog._dismiss,
            type: 'confirm'
          };

          // Show overlay
          let tmpOverlayClickHandler = null;
          if (this._modal.options.OverlayClickDismisses) {
            tmpOverlayClickHandler = () => {
              pDialog._dismiss(false);
            };
          }
          this._modal._overlay.show(tmpOverlayClickHandler);

          // Append to body
          document.body.appendChild(pDialog);

          // Track active modal
          this._modal._activeModals.push(tmpModalEntry);

          // Animate in
          void pDialog.offsetHeight;
          pDialog.classList.add('pict-modal-visible');

          // Focus
          if (pDialog._focusTarget) {
            pDialog._focusTarget.focus();
          }

          // Keyboard handler
          pDialog._keyHandler = pEvent => {
            if (pEvent.key === 'Escape') {
              pDialog._dismiss(false);
            }
          };
          document.addEventListener('keydown', pDialog._keyHandler);
        }

        /**
         * Dismiss a dialog: animate out, remove from DOM, hide overlay.
         *
         * @param {HTMLElement} pDialog
         * @param {*} pResult - Value to resolve the promise with
         * @param {function} fResolve - Promise resolver
         */
        _dismissDialog(pDialog, pResult, fResolve) {
          // Prevent double-dismiss
          if (pDialog._dismissed) {
            return;
          }
          pDialog._dismissed = true;

          // Remove keyboard handler
          if (pDialog._keyHandler) {
            document.removeEventListener('keydown', pDialog._keyHandler);
          }

          // Animate out
          pDialog.classList.remove('pict-modal-visible');

          // Remove from active modals
          this._modal._activeModals = this._modal._activeModals.filter(pEntry => {
            return pEntry.element !== pDialog;
          });

          // Update overlay click handler to point to new topmost modal
          if (this._modal._activeModals.length > 0) {
            let tmpTopModal = this._modal._activeModals[this._modal._activeModals.length - 1];
            this._modal._overlay.updateClickHandler(this._modal.options.OverlayClickDismisses ? tmpTopModal.dismiss : null);
          }

          // Hide overlay
          this._modal._overlay.hide();

          // Remove from DOM after transition
          setTimeout(() => {
            if (pDialog.parentNode) {
              pDialog.parentNode.removeChild(pDialog);
            }
          }, 220);

          // Resolve promise
          fResolve(pResult);
        }

        /**
         * Escape HTML special characters.
         *
         * @param {string} pText
         * @returns {string}
         */
        _escapeHTML(pText) {
          if (typeof pText !== 'string') {
            return '';
          }
          return pText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
      }
      module.exports = PictModalConfirm;
    }, {}],
    13: [function (require, module, exports) {
      /**
       * Pict-Modal-Overlay
       *
       * Manages a shared backdrop overlay element appended to document.body.
       * Reference-counted — created on first modal open, removed when last closes.
       */
      class PictModalOverlay {
        constructor(pModal) {
          this._modal = pModal;
          this._element = null;
          this._refCount = 0;
        }

        /**
         * Show the overlay (incrementing reference count).
         * Creates the DOM element on first call.
         *
         * @param {function} [fOnClick] - Optional click handler (e.g. dismiss topmost modal)
         */
        show(fOnClick) {
          this._refCount++;
          if (!this._element) {
            this._element = document.createElement('div');
            this._element.className = 'pict-modal-overlay';
            document.body.appendChild(this._element);

            // Force reflow so the transition animates
            void this._element.offsetHeight;
            this._element.classList.add('pict-modal-visible');
          }
          if (fOnClick) {
            // Store the latest click handler (for the topmost modal)
            this._currentClickHandler = fOnClick;
            this._element.onclick = pEvent => {
              if (pEvent.target === this._element && this._currentClickHandler) {
                this._currentClickHandler();
              }
            };
          }
        }

        /**
         * Update the overlay click handler (e.g. when topmost modal changes).
         *
         * @param {function} [fOnClick] - New click handler
         */
        updateClickHandler(fOnClick) {
          this._currentClickHandler = fOnClick || null;
        }

        /**
         * Hide the overlay (decrementing reference count).
         * Removes the DOM element when reference count reaches zero.
         */
        hide() {
          this._refCount--;
          if (this._refCount <= 0) {
            this._refCount = 0;
            if (this._element) {
              this._element.classList.remove('pict-modal-visible');
              let tmpElement = this._element;
              // Remove after transition
              setTimeout(() => {
                if (tmpElement.parentNode) {
                  tmpElement.parentNode.removeChild(tmpElement);
                }
              }, 220);
              this._element = null;
              this._currentClickHandler = null;
            }
          }
        }

        /**
         * Force-remove the overlay regardless of reference count.
         */
        destroy() {
          this._refCount = 0;
          if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
          }
          this._element = null;
          this._currentClickHandler = null;
        }
      }
      module.exports = PictModalOverlay;
    }, {}],
    14: [function (require, module, exports) {
      /**
       * Pict-Modal-Panel
       *
       * Adds resizable and collapsible panel behavior to any DOM element.
       * Follows the handler composition pattern used by the other modal
       * handlers (confirm, window, toast, tooltip).
       *
       * Usage:
       *   let handle = modal.panel('#my-panel', { position: 'right', width: 340 });
       *   handle.toggle();
       *   handle.destroy();
       */
      class PictModalPanel {
        constructor(pModal) {
          this._modal = pModal;
          this._panels = [];
        }

        /**
         * Attach resizable/collapsible panel behavior to an element.
         *
         * @param {string} pTargetSelector - CSS selector for the panel element
         * @param {object} [pOptions] - Panel options
         * @returns {{ collapse, expand, toggle, setWidth, destroy }} Panel handle
         */
        create(pTargetSelector, pOptions) {
          let tmpDefaults = this._modal && this._modal.options && this._modal.options.DefaultPanelOptions || {};
          let tmpOptions = Object.assign({}, {
            position: 'right',
            width: 340,
            minWidth: 200,
            maxWidth: 600,
            collapsible: true,
            collapsed: false,
            persist: false,
            persistKey: '',
            onResize: null,
            onToggle: null
          }, tmpDefaults, pOptions);
          if (typeof document === 'undefined') return this._nullHandle();
          let tmpTarget = document.querySelector(pTargetSelector);
          if (!tmpTarget) return this._nullHandle();
          let tmpId = this._modal._nextId();
          let tmpIsRight = tmpOptions.position === 'right';
          let tmpIsCollapsed = false;
          let tmpCurrentWidth = tmpOptions.width;
          let tmpDestroyed = false;

          // Restore persisted state
          if (tmpOptions.persist && tmpOptions.persistKey) {
            try {
              let tmpStored = localStorage.getItem('pict-panel-' + tmpOptions.persistKey);
              if (tmpStored) {
                let tmpParsed = JSON.parse(tmpStored);
                if (typeof tmpParsed.width === 'number') tmpCurrentWidth = tmpParsed.width;
                if (typeof tmpParsed.collapsed === 'boolean') tmpOptions.collapsed = tmpParsed.collapsed;
              }
            } catch (e) {/* ignore */}
          }

          // Apply classes and initial width
          tmpTarget.classList.add('pict-panel');
          tmpTarget.classList.add(tmpIsRight ? 'pict-panel-right' : 'pict-panel-left');
          tmpTarget.style.width = tmpCurrentWidth + 'px';

          // Remove display:none if present — panel uses width collapse instead
          if (tmpTarget.style.display === 'none') {
            tmpTarget.style.display = '';
          }

          // ── Create the edge container ───────────────────────
          let tmpEdge = document.createElement('div');
          tmpEdge.className = 'pict-panel-edge ' + (tmpIsRight ? 'pict-panel-edge-right' : 'pict-panel-edge-left');

          // Resize handle
          let tmpResize = document.createElement('div');
          tmpResize.className = 'pict-panel-resize';
          tmpEdge.appendChild(tmpResize);

          // Collapse tab (chevron SVG)
          let tmpTab = null;
          if (tmpOptions.collapsible) {
            tmpTab = document.createElement('div');
            tmpTab.className = 'pict-panel-tab';
            tmpTab.title = 'Toggle panel';
            tmpEdge.appendChild(tmpTab);
          }

          // Insert edge as a sibling so it is not clipped by the
          // panel's own overflow (e.g. overflow-y: auto for scrolling).
          // Right panels: edge goes BEFORE the panel (left side).
          // Left panels: edge goes AFTER the panel (right side).
          if (tmpTarget.parentNode) {
            if (tmpIsRight) {
              tmpTarget.parentNode.insertBefore(tmpEdge, tmpTarget);
            } else {
              tmpTarget.parentNode.insertBefore(tmpEdge, tmpTarget.nextSibling);
            }
          } else {
            tmpTarget.insertBefore(tmpEdge, tmpTarget.firstChild);
          }

          // ── Chevron SVG helper ──────────────────────────────
          let tmpChevronRight = '<svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6,3 11,8 6,13"/></svg>';
          let tmpChevronLeft = '<svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="10,3 5,8 10,13"/></svg>';
          let tmpUpdateChevron = () => {
            if (!tmpTab) return;
            if (tmpIsRight) {
              tmpTab.innerHTML = tmpIsCollapsed ? tmpChevronLeft : tmpChevronRight;
            } else {
              tmpTab.innerHTML = tmpIsCollapsed ? tmpChevronRight : tmpChevronLeft;
            }
          };

          // ── Persist helper ──────────────────────────────────
          let tmpPersist = () => {
            if (!tmpOptions.persist || !tmpOptions.persistKey) return;
            try {
              localStorage.setItem('pict-panel-' + tmpOptions.persistKey, JSON.stringify({
                width: tmpCurrentWidth,
                collapsed: tmpIsCollapsed
              }));
            } catch (e) {/* ignore */}
          };

          // ── Collapse / expand ───────────────────────────────
          let tmpCollapse = () => {
            if (tmpIsCollapsed || tmpDestroyed) return;
            tmpIsCollapsed = true;
            tmpTarget.classList.add('pict-panel-collapsed');
            tmpEdge.classList.add('pict-panel-edge-collapsed');
            tmpUpdateChevron();
            tmpPersist();
            if (typeof tmpOptions.onToggle === 'function') tmpOptions.onToggle(true);
          };
          let tmpExpand = () => {
            if (!tmpIsCollapsed || tmpDestroyed) return;
            tmpIsCollapsed = false;
            tmpEdge.classList.remove('pict-panel-edge-collapsed');
            tmpTarget.classList.remove('pict-panel-collapsed');
            tmpTarget.style.width = tmpCurrentWidth + 'px';
            tmpUpdateChevron();
            tmpPersist();
            if (typeof tmpOptions.onToggle === 'function') tmpOptions.onToggle(false);
          };
          let tmpToggle = () => {
            if (tmpIsCollapsed) tmpExpand();else tmpCollapse();
          };
          let tmpSetWidth = pWidth => {
            if (tmpDestroyed) return;
            let tmpWidth = Math.max(tmpOptions.minWidth, Math.min(tmpOptions.maxWidth, pWidth));
            tmpCurrentWidth = tmpWidth;
            if (!tmpIsCollapsed) {
              tmpTarget.style.width = tmpWidth + 'px';
            }
            tmpPersist();
            if (typeof tmpOptions.onResize === 'function') tmpOptions.onResize(tmpWidth);
          };

          // ── Tab click ───────────────────────────────────────
          if (tmpTab) {
            tmpTab.addEventListener('click', pEvent => {
              pEvent.stopPropagation();
              tmpToggle();
            });
          }

          // ── Resize drag ─────────────────────────────────────
          let tmpOnMouseDown = pEvent => {
            if (tmpIsCollapsed) return;
            pEvent.preventDefault();
            let tmpStartX = pEvent.clientX;
            let tmpStartWidth = tmpTarget.offsetWidth;
            tmpResize.classList.add('dragging');
            tmpTarget.style.transition = 'none';
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
            let tmpOnMouseMove = pMoveEvent => {
              let tmpDelta = tmpIsRight ? tmpStartX - pMoveEvent.clientX : pMoveEvent.clientX - tmpStartX;
              let tmpNewWidth = Math.max(tmpOptions.minWidth, Math.min(tmpOptions.maxWidth, tmpStartWidth + tmpDelta));
              tmpTarget.style.width = tmpNewWidth + 'px';
            };
            let tmpOnMouseUp = pUpEvent => {
              document.removeEventListener('mousemove', tmpOnMouseMove);
              document.removeEventListener('mouseup', tmpOnMouseUp);
              tmpResize.classList.remove('dragging');
              tmpTarget.style.transition = '';
              document.body.style.userSelect = '';
              document.body.style.cursor = '';

              // Capture the final width
              tmpCurrentWidth = tmpTarget.offsetWidth;
              tmpPersist();
              if (typeof tmpOptions.onResize === 'function') tmpOptions.onResize(tmpCurrentWidth);
            };
            document.addEventListener('mousemove', tmpOnMouseMove);
            document.addEventListener('mouseup', tmpOnMouseUp);
          };
          tmpResize.addEventListener('mousedown', tmpOnMouseDown);

          // ── Initial state ───────────────────────────────────
          tmpUpdateChevron();
          if (tmpOptions.collapsed) {
            tmpIsCollapsed = true;
            tmpTarget.classList.add('pict-panel-collapsed');
            tmpEdge.classList.add('pict-panel-edge-collapsed');
            tmpUpdateChevron();
          }

          // ── Destroy ─────────────────────────────────────────
          let tmpDestroy = () => {
            if (tmpDestroyed) return;
            tmpDestroyed = true;
            tmpResize.removeEventListener('mousedown', tmpOnMouseDown);
            if (tmpEdge.parentNode) tmpEdge.remove();
            tmpTarget.classList.remove('pict-panel', 'pict-panel-right', 'pict-panel-left', 'pict-panel-collapsed');
            tmpTarget.style.width = '';
            tmpTarget.style.transition = '';
            let tmpIdx = this._panels.indexOf(tmpHandle);
            if (tmpIdx >= 0) this._panels.splice(tmpIdx, 1);
          };

          // ── Return handle ───────────────────────────────────
          let tmpHandle = {
            id: tmpId,
            collapse: tmpCollapse,
            expand: tmpExpand,
            toggle: tmpToggle,
            setWidth: tmpSetWidth,
            destroy: tmpDestroy
          };
          this._panels.push(tmpHandle);
          return tmpHandle;
        }

        /**
         * Return a no-op handle for server-side or missing-element cases.
         */
        _nullHandle() {
          return {
            id: 0,
            collapse: () => {},
            expand: () => {},
            toggle: () => {},
            setWidth: () => {},
            destroy: () => {}
          };
        }

        /**
         * Destroy all active panels.
         */
        destroyAll() {
          let tmpPanels = this._panels.slice();
          for (let i = 0; i < tmpPanels.length; i++) {
            tmpPanels[i].destroy();
          }
        }
      }
      module.exports = PictModalPanel;
    }, {}],
    15: [function (require, module, exports) {
      /**
       * Pict-Modal-Toast
       *
       * Manages toast notification elements with auto-dismiss and stacking.
       */
      class PictModalToast {
        constructor(pModal) {
          this._modal = pModal;
          this._containers = {};
        }

        /**
         * Show a toast notification.
         *
         * @param {string} pMessage - Toast message text
         * @param {object} [pOptions] - Options (type, duration, position, dismissible)
         * @returns {{ dismiss: function }} Handle with dismiss method
         */
        toast(pMessage, pOptions) {
          let tmpOptions = Object.assign({}, this._modal.options.DefaultToastOptions, pOptions);
          let tmpContainer = this._getContainer(tmpOptions.position);
          let tmpId = this._modal._nextId();
          let tmpToast = document.createElement('div');
          tmpToast.className = 'pict-modal-toast pict-modal-toast--' + tmpOptions.type;
          tmpToast.id = 'pict-modal-toast-' + tmpId;
          let tmpContent = '<span class="pict-modal-toast-message">' + this._escapeHTML(pMessage) + '</span>';
          if (tmpOptions.dismissible) {
            tmpContent += '<button class="pict-modal-toast-dismiss" aria-label="Dismiss">&times;</button>';
          }
          tmpToast.innerHTML = tmpContent;

          // Create handle
          let tmpDismissed = false;
          let tmpTimeoutHandle = null;
          let tmpDismiss = () => {
            if (tmpDismissed) {
              return;
            }
            tmpDismissed = true;
            if (tmpTimeoutHandle) {
              clearTimeout(tmpTimeoutHandle);
            }

            // Exit animation
            tmpToast.classList.remove('pict-modal-visible');
            tmpToast.classList.add('pict-modal-toast-exit');

            // Remove from active list
            this._modal._activeToasts = this._modal._activeToasts.filter(pEntry => {
              return pEntry.element !== tmpToast;
            });

            // Remove from DOM after transition
            setTimeout(() => {
              if (tmpToast.parentNode) {
                tmpToast.parentNode.removeChild(tmpToast);
              }
              this._cleanupContainer(tmpOptions.position);
            }, 220);
          };
          let tmpHandle = {
            dismiss: tmpDismiss
          };

          // Wire dismiss button
          if (tmpOptions.dismissible) {
            let tmpDismissBtn = tmpToast.querySelector('.pict-modal-toast-dismiss');
            if (tmpDismissBtn) {
              tmpDismissBtn.addEventListener('click', tmpDismiss);
            }
          }

          // Append to container
          tmpContainer.appendChild(tmpToast);

          // Track
          let tmpEntry = {
            element: tmpToast,
            dismiss: tmpDismiss,
            handle: tmpHandle
          };
          this._modal._activeToasts.push(tmpEntry);

          // Animate in
          void tmpToast.offsetHeight;
          tmpToast.classList.add('pict-modal-visible');

          // Auto-dismiss
          if (tmpOptions.duration > 0) {
            tmpTimeoutHandle = setTimeout(tmpDismiss, tmpOptions.duration);
          }
          return tmpHandle;
        }

        /**
         * Get or create a toast container for the given position.
         *
         * @param {string} pPosition - Position key (e.g. 'top-right')
         * @returns {HTMLElement}
         */
        _getContainer(pPosition) {
          if (this._containers[pPosition]) {
            return this._containers[pPosition];
          }
          let tmpContainer = document.createElement('div');
          tmpContainer.className = 'pict-modal-toast-container pict-modal-toast-container--' + pPosition;
          document.body.appendChild(tmpContainer);
          this._containers[pPosition] = tmpContainer;
          return tmpContainer;
        }

        /**
         * Remove a container if it has no more toasts.
         *
         * @param {string} pPosition
         */
        _cleanupContainer(pPosition) {
          let tmpContainer = this._containers[pPosition];
          if (tmpContainer && tmpContainer.children.length === 0) {
            if (tmpContainer.parentNode) {
              tmpContainer.parentNode.removeChild(tmpContainer);
            }
            delete this._containers[pPosition];
          }
        }

        /**
         * Dismiss all active toasts.
         */
        dismissAll() {
          let tmpToasts = this._modal._activeToasts.slice();
          for (let i = 0; i < tmpToasts.length; i++) {
            tmpToasts[i].dismiss();
          }
        }

        /**
         * Destroy all containers.
         */
        destroy() {
          this.dismissAll();
          let tmpPositions = Object.keys(this._containers);
          for (let i = 0; i < tmpPositions.length; i++) {
            let tmpContainer = this._containers[tmpPositions[i]];
            if (tmpContainer && tmpContainer.parentNode) {
              tmpContainer.parentNode.removeChild(tmpContainer);
            }
          }
          this._containers = {};
        }

        /**
         * Escape HTML special characters.
         *
         * @param {string} pText
         * @returns {string}
         */
        _escapeHTML(pText) {
          if (typeof pText !== 'string') {
            return '';
          }
          return pText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
      }
      module.exports = PictModalToast;
    }, {}],
    16: [function (require, module, exports) {
      /**
       * Pict-Modal-Tooltip
       *
       * Manages simple text and rich HTML tooltips with positioning and auto-flip.
       */
      class PictModalTooltip {
        constructor(pModal) {
          this._modal = pModal;
        }

        /**
         * Attach a simple text tooltip to an element.
         *
         * @param {HTMLElement} pElement - Target element
         * @param {string} pText - Tooltip text
         * @param {object} [pOptions] - Options (position, delay, maxWidth)
         * @returns {{ destroy: function }} Handle to remove the tooltip
         */
        tooltip(pElement, pText, pOptions) {
          let tmpOptions = Object.assign({}, this._modal.options.DefaultTooltipOptions, pOptions);
          return this._attachTooltip(pElement, pText, false, tmpOptions);
        }

        /**
         * Attach a rich HTML tooltip to an element.
         *
         * @param {HTMLElement} pElement - Target element
         * @param {string} pHTMLContent - HTML content for the tooltip
         * @param {object} [pOptions] - Options (position, delay, maxWidth, interactive)
         * @returns {{ destroy: function }} Handle to remove the tooltip
         */
        richTooltip(pElement, pHTMLContent, pOptions) {
          let tmpOptions = Object.assign({}, this._modal.options.DefaultTooltipOptions, pOptions);
          return this._attachTooltip(pElement, pHTMLContent, true, tmpOptions);
        }

        /**
         * Internal: attach tooltip event listeners to an element.
         *
         * @param {HTMLElement} pElement
         * @param {string} pContent
         * @param {boolean} pIsHTML
         * @param {object} pOptions
         * @returns {{ destroy: function }}
         */
        _attachTooltip(pElement, pContent, pIsHTML, pOptions) {
          let tmpTooltipElement = null;
          let tmpShowTimeout = null;
          let tmpHideTimeout = null;
          let tmpDestroyed = false;
          let tmpId = this._modal._nextId();
          let tmpShow = () => {
            if (tmpDestroyed || tmpTooltipElement) {
              return;
            }
            tmpTooltipElement = document.createElement('div');
            tmpTooltipElement.className = 'pict-modal-tooltip pict-modal-tooltip--' + pOptions.position;
            tmpTooltipElement.id = 'pict-modal-tooltip-' + tmpId;
            tmpTooltipElement.setAttribute('role', 'tooltip');
            tmpTooltipElement.style.maxWidth = pOptions.maxWidth;
            if (pOptions.interactive) {
              tmpTooltipElement.classList.add('pict-modal-tooltip-interactive');
            }

            // Arrow
            let tmpArrow = document.createElement('div');
            tmpArrow.className = 'pict-modal-tooltip-arrow';

            // Content
            let tmpContentDiv = document.createElement('div');
            if (pIsHTML) {
              tmpContentDiv.innerHTML = pContent;
            } else {
              tmpContentDiv.textContent = pContent;
            }
            tmpTooltipElement.appendChild(tmpArrow);
            tmpTooltipElement.appendChild(tmpContentDiv);
            document.body.appendChild(tmpTooltipElement);

            // Set aria-describedby on target
            pElement.setAttribute('aria-describedby', tmpTooltipElement.id);

            // Position
            this._positionTooltip(tmpTooltipElement, pElement, pOptions.position);

            // Animate in
            void tmpTooltipElement.offsetHeight;
            tmpTooltipElement.classList.add('pict-modal-visible');

            // Track
            this._modal._activeTooltips.push({
              element: tmpTooltipElement,
              targetElement: pElement,
              destroy: tmpDestroy
            });

            // For interactive tooltips, allow hovering over the tooltip itself
            if (pOptions.interactive && tmpTooltipElement) {
              tmpTooltipElement.addEventListener('mouseenter', () => {
                if (tmpHideTimeout) {
                  clearTimeout(tmpHideTimeout);
                  tmpHideTimeout = null;
                }
              });
              tmpTooltipElement.addEventListener('mouseleave', () => {
                tmpHide();
              });
            }
          };
          let tmpHide = () => {
            if (!tmpTooltipElement) {
              return;
            }
            tmpTooltipElement.classList.remove('pict-modal-visible');
            let tmpEl = tmpTooltipElement;
            tmpTooltipElement = null;

            // Remove aria
            pElement.removeAttribute('aria-describedby');

            // Remove from tracking
            this._modal._activeTooltips = this._modal._activeTooltips.filter(pEntry => {
              return pEntry.element !== tmpEl;
            });
            setTimeout(() => {
              if (tmpEl.parentNode) {
                tmpEl.parentNode.removeChild(tmpEl);
              }
            }, 220);
          };
          let tmpOnMouseEnter = () => {
            if (tmpHideTimeout) {
              clearTimeout(tmpHideTimeout);
              tmpHideTimeout = null;
            }
            tmpShowTimeout = setTimeout(tmpShow, pOptions.delay);
          };
          let tmpOnMouseLeave = () => {
            if (tmpShowTimeout) {
              clearTimeout(tmpShowTimeout);
              tmpShowTimeout = null;
            }
            // Small delay before hiding to allow moving to interactive tooltip
            if (pOptions.interactive) {
              tmpHideTimeout = setTimeout(tmpHide, 100);
            } else {
              tmpHide();
            }
          };
          let tmpOnFocusIn = () => {
            tmpShowTimeout = setTimeout(tmpShow, pOptions.delay);
          };
          let tmpOnFocusOut = () => {
            if (tmpShowTimeout) {
              clearTimeout(tmpShowTimeout);
              tmpShowTimeout = null;
            }
            tmpHide();
          };

          // Attach listeners
          pElement.addEventListener('mouseenter', tmpOnMouseEnter);
          pElement.addEventListener('mouseleave', tmpOnMouseLeave);
          pElement.addEventListener('focusin', tmpOnFocusIn);
          pElement.addEventListener('focusout', tmpOnFocusOut);
          let tmpDestroy = () => {
            if (tmpDestroyed) {
              return;
            }
            tmpDestroyed = true;
            if (tmpShowTimeout) {
              clearTimeout(tmpShowTimeout);
            }
            if (tmpHideTimeout) {
              clearTimeout(tmpHideTimeout);
            }
            tmpHide();
            pElement.removeEventListener('mouseenter', tmpOnMouseEnter);
            pElement.removeEventListener('mouseleave', tmpOnMouseLeave);
            pElement.removeEventListener('focusin', tmpOnFocusIn);
            pElement.removeEventListener('focusout', tmpOnFocusOut);
          };
          return {
            destroy: tmpDestroy
          };
        }

        /**
         * Position a tooltip element relative to the target element.
         * Flips direction if the tooltip would overflow the viewport.
         *
         * @param {HTMLElement} pTooltip
         * @param {HTMLElement} pTarget
         * @param {string} pPosition - 'top', 'bottom', 'left', 'right'
         */
        _positionTooltip(pTooltip, pTarget, pPosition) {
          let tmpTargetRect = pTarget.getBoundingClientRect();
          let tmpTooltipRect = pTooltip.getBoundingClientRect();
          let tmpGap = 8;
          let tmpPosition = pPosition;

          // Flip if needed
          if (tmpPosition === 'top' && tmpTargetRect.top < tmpTooltipRect.height + tmpGap) {
            tmpPosition = 'bottom';
          } else if (tmpPosition === 'bottom' && window.innerHeight - tmpTargetRect.bottom < tmpTooltipRect.height + tmpGap) {
            tmpPosition = 'top';
          } else if (tmpPosition === 'left' && tmpTargetRect.left < tmpTooltipRect.width + tmpGap) {
            tmpPosition = 'right';
          } else if (tmpPosition === 'right' && window.innerWidth - tmpTargetRect.right < tmpTooltipRect.width + tmpGap) {
            tmpPosition = 'left';
          }

          // Update class for arrow direction
          pTooltip.className = pTooltip.className.replace(/pict-modal-tooltip--\w+/, 'pict-modal-tooltip--' + tmpPosition);
          let tmpTop = 0;
          let tmpLeft = 0;
          switch (tmpPosition) {
            case 'top':
              tmpTop = tmpTargetRect.top - tmpTooltipRect.height - tmpGap;
              tmpLeft = tmpTargetRect.left + tmpTargetRect.width / 2 - tmpTooltipRect.width / 2;
              break;
            case 'bottom':
              tmpTop = tmpTargetRect.bottom + tmpGap;
              tmpLeft = tmpTargetRect.left + tmpTargetRect.width / 2 - tmpTooltipRect.width / 2;
              break;
            case 'left':
              tmpTop = tmpTargetRect.top + tmpTargetRect.height / 2 - tmpTooltipRect.height / 2;
              tmpLeft = tmpTargetRect.left - tmpTooltipRect.width - tmpGap;
              break;
            case 'right':
              tmpTop = tmpTargetRect.top + tmpTargetRect.height / 2 - tmpTooltipRect.height / 2;
              tmpLeft = tmpTargetRect.right + tmpGap;
              break;
          }

          // Clamp to viewport
          tmpLeft = Math.max(4, Math.min(tmpLeft, window.innerWidth - tmpTooltipRect.width - 4));
          tmpTop = Math.max(4, Math.min(tmpTop, window.innerHeight - tmpTooltipRect.height - 4));
          pTooltip.style.top = tmpTop + 'px';
          pTooltip.style.left = tmpLeft + 'px';
        }

        /**
         * Dismiss all active tooltips.
         */
        dismissAll() {
          let tmpTooltips = this._modal._activeTooltips.slice();
          for (let i = 0; i < tmpTooltips.length; i++) {
            tmpTooltips[i].destroy();
          }
        }
      }
      module.exports = PictModalTooltip;
    }, {}],
    17: [function (require, module, exports) {
      /**
       * Pict-Modal-Window
       *
       * Builds custom floating modal windows with arbitrary content and buttons.
       */
      class PictModalWindow {
        constructor(pModal) {
          this._modal = pModal;
        }

        /**
         * Show a custom modal window.
         *
         * @param {object} [pOptions] - Options
         * @param {string} [pOptions.title] - Dialog title
         * @param {string} [pOptions.content] - HTML content for the body
         * @param {Array} [pOptions.buttons] - Array of { Hash, Label, Style }
         * @param {boolean} [pOptions.closeable] - Whether the close button and overlay dismiss are enabled
         * @param {string} [pOptions.width] - CSS width value
         * @param {function} [pOptions.onOpen] - Called after dialog is shown, receives dialog element
         * @param {function} [pOptions.onClose] - Called after dialog is dismissed
         * @returns {Promise<string|null>} Resolves with clicked button Hash, or null on close
         */
        show(pOptions) {
          let tmpOptions = Object.assign({}, this._modal.options.DefaultModalOptions, pOptions);
          return new Promise(fResolve => {
            let tmpDialog = this._buildDialog(tmpOptions, fResolve);
            this._showDialog(tmpDialog, tmpOptions, fResolve);
          });
        }

        /**
         * Build the modal dialog element.
         *
         * @param {object} pOptions
         * @param {function} fResolve
         * @returns {HTMLElement}
         */
        _buildDialog(pOptions, fResolve) {
          let tmpId = this._modal._nextId();
          let tmpDialog = document.createElement('div');
          tmpDialog.className = 'pict-modal-dialog';
          tmpDialog.id = 'pict-modal-' + tmpId;
          tmpDialog.setAttribute('role', 'dialog');
          tmpDialog.setAttribute('aria-modal', 'true');
          tmpDialog.style.width = pOptions.width;

          // Header
          let tmpHeaderHTML = '';
          if (pOptions.title || pOptions.closeable) {
            tmpHeaderHTML = '<div class="pict-modal-dialog-header">';
            tmpHeaderHTML += '<span class="pict-modal-dialog-title">' + this._escapeHTML(pOptions.title) + '</span>';
            if (pOptions.closeable) {
              tmpHeaderHTML += '<button class="pict-modal-dialog-close" aria-label="Close">&times;</button>';
            }
            tmpHeaderHTML += '</div>';
          }

          // Body
          let tmpBodyHTML = '<div class="pict-modal-dialog-body">' + (pOptions.content || '') + '</div>';

          // Footer with buttons
          let tmpFooterHTML = '';
          if (pOptions.buttons && pOptions.buttons.length > 0) {
            tmpFooterHTML = '<div class="pict-modal-dialog-footer">';
            for (let i = 0; i < pOptions.buttons.length; i++) {
              let tmpButton = pOptions.buttons[i];
              let tmpBtnClass = 'pict-modal-btn';
              if (tmpButton.Style) {
                tmpBtnClass += ' pict-modal-btn--' + tmpButton.Style;
              }
              tmpFooterHTML += '<button class="' + tmpBtnClass + '" data-hash="' + this._escapeHTML(tmpButton.Hash) + '">' + this._escapeHTML(tmpButton.Label) + '</button>';
            }
            tmpFooterHTML += '</div>';
          }
          tmpDialog.innerHTML = tmpHeaderHTML + tmpBodyHTML + tmpFooterHTML;
          let tmpDismiss = pResult => {
            this._dismissDialog(tmpDialog, pResult, fResolve, pOptions);
          };

          // Wire close button
          if (pOptions.closeable) {
            let tmpCloseBtn = tmpDialog.querySelector('.pict-modal-dialog-close');
            if (tmpCloseBtn) {
              tmpCloseBtn.addEventListener('click', () => {
                tmpDismiss(null);
              });
            }
          }

          // Wire action buttons
          let tmpActionButtons = tmpDialog.querySelectorAll('[data-hash]');
          for (let i = 0; i < tmpActionButtons.length; i++) {
            let tmpBtn = tmpActionButtons[i];
            tmpBtn.addEventListener('click', () => {
              tmpDismiss(tmpBtn.getAttribute('data-hash'));
            });
          }
          tmpDialog._dismiss = tmpDismiss;
          return tmpDialog;
        }

        /**
         * Show the dialog: append to body, show overlay, animate in.
         *
         * @param {HTMLElement} pDialog
         * @param {object} pOptions
         * @param {function} fResolve
         */
        _showDialog(pDialog, pOptions, fResolve) {
          let tmpModalEntry = {
            element: pDialog,
            dismiss: pDialog._dismiss,
            type: 'window'
          };

          // Show overlay
          let tmpOverlayClickHandler = null;
          if (this._modal.options.OverlayClickDismisses && pOptions.closeable) {
            tmpOverlayClickHandler = () => {
              pDialog._dismiss(null);
            };
          }
          this._modal._overlay.show(tmpOverlayClickHandler);

          // Append to body
          document.body.appendChild(pDialog);

          // Track
          this._modal._activeModals.push(tmpModalEntry);

          // Animate in
          void pDialog.offsetHeight;
          pDialog.classList.add('pict-modal-visible');

          // Focus first button or close button
          let tmpFocusTarget = pDialog.querySelector('.pict-modal-btn') || pDialog.querySelector('.pict-modal-dialog-close');
          if (tmpFocusTarget) {
            tmpFocusTarget.focus();
          }

          // Keyboard handler
          pDialog._keyHandler = pEvent => {
            if (pEvent.key === 'Escape' && pOptions.closeable) {
              pDialog._dismiss(null);
            }
          };
          document.addEventListener('keydown', pDialog._keyHandler);

          // onOpen callback
          if (typeof pOptions.onOpen === 'function') {
            pOptions.onOpen(pDialog);
          }
        }

        /**
         * Dismiss the dialog: animate out, remove from DOM, hide overlay.
         *
         * @param {HTMLElement} pDialog
         * @param {*} pResult
         * @param {function} fResolve
         * @param {object} pOptions
         */
        _dismissDialog(pDialog, pResult, fResolve, pOptions) {
          if (pDialog._dismissed) {
            return;
          }
          pDialog._dismissed = true;
          if (pDialog._keyHandler) {
            document.removeEventListener('keydown', pDialog._keyHandler);
          }
          pDialog.classList.remove('pict-modal-visible');
          this._modal._activeModals = this._modal._activeModals.filter(pEntry => {
            return pEntry.element !== pDialog;
          });
          if (this._modal._activeModals.length > 0) {
            let tmpTopModal = this._modal._activeModals[this._modal._activeModals.length - 1];
            this._modal._overlay.updateClickHandler(this._modal.options.OverlayClickDismisses ? tmpTopModal.dismiss : null);
          }
          this._modal._overlay.hide();
          setTimeout(() => {
            if (pDialog.parentNode) {
              pDialog.parentNode.removeChild(pDialog);
            }
          }, 220);
          if (typeof pOptions.onClose === 'function') {
            pOptions.onClose(pResult);
          }
          fResolve(pResult);
        }

        /**
         * Escape HTML special characters.
         *
         * @param {string} pText
         * @returns {string}
         */
        _escapeHTML(pText) {
          if (typeof pText !== 'string') {
            return '';
          }
          return pText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
      }
      module.exports = PictModalWindow;
    }, {}],
    18: [function (require, module, exports) {
      module.exports = {
        "AutoInitialize": true,
        "AutoRender": false,
        "AutoSolveWithApp": false,
        "ViewIdentifier": "Pict-Section-Modal",
        "OverlayClickDismisses": true,
        "DefaultConfirmOptions": {
          "title": "Confirm",
          "confirmLabel": "OK",
          "cancelLabel": "Cancel",
          "dangerous": false
        },
        "DefaultDoubleConfirmOptions": {
          "title": "Are you sure?",
          "confirmLabel": "Confirm",
          "cancelLabel": "Cancel",
          "phrasePrompt": "Type \"{phrase}\" to confirm:",
          "confirmPhrase": ""
        },
        "DefaultModalOptions": {
          "title": "",
          "content": "",
          "buttons": [],
          "closeable": true,
          "width": "480px"
        },
        "DefaultTooltipOptions": {
          "position": "top",
          "delay": 200,
          "maxWidth": "300px",
          "interactive": false
        },
        "DefaultToastOptions": {
          "type": "info",
          "duration": 3000,
          "position": "top-right",
          "dismissible": true
        },
        "DefaultPanelOptions": {
          "position": "right",
          "width": 340,
          "minWidth": 200,
          "maxWidth": 600,
          "collapsible": true,
          "collapsed": false,
          "persist": false,
          "persistKey": ""
        },
        "Templates": [],
        "Renderables": [],
        "CSS": /*css*/`
/* pict-section-modal */
.pict-modal-root
{
	/* Overlay */
	--pict-modal-overlay-bg: rgba(0, 0, 0, 0.5);

	/* Dialog */
	--pict-modal-bg: #ffffff;
	--pict-modal-fg: #1a1a1a;
	--pict-modal-border: #e0e0e0;
	--pict-modal-border-radius: 8px;
	--pict-modal-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
	--pict-modal-header-bg: #f5f5f5;
	--pict-modal-header-fg: #1a1a1a;
	--pict-modal-header-border: #e0e0e0;

	/* Buttons */
	--pict-modal-btn-bg: #e0e0e0;
	--pict-modal-btn-fg: #1a1a1a;
	--pict-modal-btn-hover-bg: #d0d0d0;
	--pict-modal-btn-primary-bg: #2563eb;
	--pict-modal-btn-primary-fg: #ffffff;
	--pict-modal-btn-primary-hover-bg: #1d4ed8;
	--pict-modal-btn-danger-bg: #dc2626;
	--pict-modal-btn-danger-fg: #ffffff;
	--pict-modal-btn-danger-hover-bg: #b91c1c;
	--pict-modal-btn-border-radius: 4px;

	/* Toast */
	--pict-modal-toast-bg: #333333;
	--pict-modal-toast-fg: #ffffff;
	--pict-modal-toast-success-bg: #16a34a;
	--pict-modal-toast-warning-bg: #d97706;
	--pict-modal-toast-error-bg: #dc2626;
	--pict-modal-toast-info-bg: #2563eb;
	--pict-modal-toast-border-radius: 6px;
	--pict-modal-toast-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);

	/* Tooltip */
	--pict-modal-tooltip-bg: #1a1a1a;
	--pict-modal-tooltip-fg: #ffffff;
	--pict-modal-tooltip-border-radius: 4px;
	--pict-modal-tooltip-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

	/* Typography */
	--pict-modal-font-family: system-ui, -apple-system, sans-serif;
	--pict-modal-font-size: 14px;
	--pict-modal-title-font-size: 16px;

	/* Animation */
	--pict-modal-transition-duration: 200ms;
}

/* Overlay */
.pict-modal-overlay
{
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 1000;
	background: var(--pict-modal-overlay-bg);
	opacity: 0;
	transition: opacity var(--pict-modal-transition-duration) ease;
}

.pict-modal-overlay.pict-modal-visible
{
	opacity: 1;
}

/* Dialog */
.pict-modal-dialog
{
	position: fixed;
	z-index: 1010;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%) translateY(-20px);
	opacity: 0;
	transition: opacity var(--pict-modal-transition-duration) ease,
	            transform var(--pict-modal-transition-duration) ease;

	max-width: 90vw;
	max-height: 90vh;
	display: flex;
	flex-direction: column;

	background: var(--pict-modal-bg);
	color: var(--pict-modal-fg);
	border: 1px solid var(--pict-modal-border);
	border-radius: var(--pict-modal-border-radius);
	box-shadow: var(--pict-modal-shadow);
	font-family: var(--pict-modal-font-family);
	font-size: var(--pict-modal-font-size);
}

.pict-modal-dialog.pict-modal-visible
{
	opacity: 1;
	transform: translate(-50%, -50%) translateY(0);
}

.pict-modal-dialog-header
{
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	background: var(--pict-modal-header-bg);
	color: var(--pict-modal-header-fg);
	border-bottom: 1px solid var(--pict-modal-header-border);
	border-radius: var(--pict-modal-border-radius) var(--pict-modal-border-radius) 0 0;
}

.pict-modal-dialog-title
{
	font-size: var(--pict-modal-title-font-size);
	font-weight: 600;
}

.pict-modal-dialog-close
{
	background: none;
	border: none;
	font-size: 20px;
	cursor: pointer;
	color: var(--pict-modal-fg);
	padding: 0 4px;
	line-height: 1;
	opacity: 0.6;
}

.pict-modal-dialog-close:hover
{
	opacity: 1;
}

.pict-modal-dialog-body
{
	padding: 16px;
	overflow-y: auto;
	flex: 1;
}

.pict-modal-dialog-footer
{
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	padding: 12px 16px;
	border-top: 1px solid var(--pict-modal-border);
}

/* Buttons */
.pict-modal-btn
{
	padding: 8px 16px;
	border: none;
	border-radius: var(--pict-modal-btn-border-radius);
	font-family: var(--pict-modal-font-family);
	font-size: var(--pict-modal-font-size);
	cursor: pointer;
	background: var(--pict-modal-btn-bg);
	color: var(--pict-modal-btn-fg);
	transition: background var(--pict-modal-transition-duration) ease;
}

.pict-modal-btn:hover
{
	background: var(--pict-modal-btn-hover-bg);
}

.pict-modal-btn:disabled
{
	opacity: 0.5;
	cursor: not-allowed;
}

.pict-modal-btn--primary
{
	background: var(--pict-modal-btn-primary-bg);
	color: var(--pict-modal-btn-primary-fg);
}

.pict-modal-btn--primary:hover
{
	background: var(--pict-modal-btn-primary-hover-bg);
}

.pict-modal-btn--danger
{
	background: var(--pict-modal-btn-danger-bg);
	color: var(--pict-modal-btn-danger-fg);
}

.pict-modal-btn--danger:hover
{
	background: var(--pict-modal-btn-danger-hover-bg);
}

/* Double confirm input */
.pict-modal-confirm-input
{
	width: 100%;
	padding: 8px 12px;
	margin-top: 12px;
	border: 1px solid var(--pict-modal-border);
	border-radius: var(--pict-modal-btn-border-radius);
	font-family: var(--pict-modal-font-family);
	font-size: var(--pict-modal-font-size);
	box-sizing: border-box;
}

.pict-modal-confirm-input:focus
{
	outline: 2px solid var(--pict-modal-btn-primary-bg);
	outline-offset: -1px;
}

.pict-modal-confirm-prompt
{
	margin-top: 12px;
	font-size: 13px;
	color: var(--pict-modal-fg);
	opacity: 0.7;
}

/* Toast container */
.pict-modal-toast-container
{
	position: fixed;
	z-index: 1030;
	display: flex;
	flex-direction: column;
	gap: 8px;
	pointer-events: none;
	max-width: 400px;
}

.pict-modal-toast-container--top-right
{
	top: 16px;
	right: 16px;
}

.pict-modal-toast-container--top-left
{
	top: 16px;
	left: 16px;
}

.pict-modal-toast-container--bottom-right
{
	bottom: 16px;
	right: 16px;
}

.pict-modal-toast-container--bottom-left
{
	bottom: 16px;
	left: 16px;
}

.pict-modal-toast-container--top-center
{
	top: 16px;
	left: 50%;
	transform: translateX(-50%);
}

.pict-modal-toast-container--bottom-center
{
	bottom: 16px;
	left: 50%;
	transform: translateX(-50%);
}

/* Toast */
.pict-modal-toast
{
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 12px 16px;
	border-radius: var(--pict-modal-toast-border-radius);
	box-shadow: var(--pict-modal-toast-shadow);
	font-family: var(--pict-modal-font-family);
	font-size: var(--pict-modal-font-size);
	background: var(--pict-modal-toast-bg);
	color: var(--pict-modal-toast-fg);
	pointer-events: auto;
	opacity: 0;
	transform: translateX(100%);
	transition: opacity var(--pict-modal-transition-duration) ease,
	            transform var(--pict-modal-transition-duration) ease;
}

.pict-modal-toast.pict-modal-visible
{
	opacity: 1;
	transform: translateX(0);
}

.pict-modal-toast.pict-modal-toast-exit
{
	opacity: 0;
	transform: translateX(100%);
}

.pict-modal-toast--info
{
	background: var(--pict-modal-toast-info-bg);
}

.pict-modal-toast--success
{
	background: var(--pict-modal-toast-success-bg);
}

.pict-modal-toast--warning
{
	background: var(--pict-modal-toast-warning-bg);
}

.pict-modal-toast--error
{
	background: var(--pict-modal-toast-error-bg);
}

.pict-modal-toast-message
{
	flex: 1;
}

.pict-modal-toast-dismiss
{
	background: none;
	border: none;
	color: inherit;
	font-size: 18px;
	cursor: pointer;
	padding: 0 2px;
	line-height: 1;
	opacity: 0.7;
}

.pict-modal-toast-dismiss:hover
{
	opacity: 1;
}

/* Tooltip */
.pict-modal-tooltip
{
	position: fixed;
	z-index: 1020;
	padding: 6px 10px;
	border-radius: var(--pict-modal-tooltip-border-radius);
	box-shadow: var(--pict-modal-tooltip-shadow);
	background: var(--pict-modal-tooltip-bg);
	color: var(--pict-modal-tooltip-fg);
	font-family: var(--pict-modal-font-family);
	font-size: 13px;
	pointer-events: none;
	opacity: 0;
	transition: opacity var(--pict-modal-transition-duration) ease;
	white-space: normal;
	word-wrap: break-word;
}

.pict-modal-tooltip.pict-modal-tooltip-interactive
{
	pointer-events: auto;
}

.pict-modal-tooltip.pict-modal-visible
{
	opacity: 1;
}

.pict-modal-tooltip-arrow
{
	position: absolute;
	width: 8px;
	height: 8px;
	background: var(--pict-modal-tooltip-bg);
	transform: rotate(45deg);
}

.pict-modal-tooltip--top .pict-modal-tooltip-arrow
{
	bottom: -4px;
	left: 50%;
	margin-left: -4px;
}

.pict-modal-tooltip--bottom .pict-modal-tooltip-arrow
{
	top: -4px;
	left: 50%;
	margin-left: -4px;
}

.pict-modal-tooltip--left .pict-modal-tooltip-arrow
{
	right: -4px;
	top: 50%;
	margin-top: -4px;
}

.pict-modal-tooltip--right .pict-modal-tooltip-arrow
{
	left: -4px;
	top: 50%;
	margin-top: -4px;
}

/* ── Resizable / Collapsible Panels ──────────────── */
.pict-panel
{
	position: relative;
	transition: width 0.2s ease;
	flex-shrink: 0;
	overflow: visible;
}
.pict-panel-collapsed
{
	width: 0 !important;
	min-width: 0 !important;
	overflow: visible;
}
.pict-panel-collapsed > *:not(.pict-panel-edge)
{
	display: none;
}

/* Edge container — zero-width flex sibling of the panel.
   Sits next to the panel in the flex layout; children
   use absolute positioning to overlap the panel boundary. */
.pict-panel-edge
{
	position: relative;
	width: 0;
	flex-shrink: 0;
	z-index: 50;
	overflow: visible;
}

/* Resize handle — thin strip on the panel boundary */
.pict-panel-resize
{
	position: absolute;
	top: 0;
	bottom: 0;
	width: 4px;
	cursor: col-resize;
	background: transparent;
	transition: background 0.15s, width 0.15s;
}
.pict-panel-edge-right .pict-panel-resize
{
	right: 0;
	border-right: 1px solid var(--pict-panel-border, #DDD6CA);
}
.pict-panel-edge-left .pict-panel-resize
{
	left: 0;
	border-left: 1px solid var(--pict-panel-border, #DDD6CA);
}
.pict-panel-resize:hover,
.pict-panel-edge:hover .pict-panel-resize
{
	width: 5px;
	background: var(--pict-panel-accent, #2E7D74);
	opacity: 0.5;
}
.pict-panel-resize.dragging
{
	width: 5px;
	background: var(--pict-panel-accent, #2E7D74);
	opacity: 1;
	transition: none;
}
.pict-panel-edge-collapsed .pict-panel-resize
{
	display: none;
}

/* Collapse tab — tucked sliver at rest, slides out on hover */
.pict-panel-tab
{
	position: absolute;
	top: 8px;
	width: 8px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	background: var(--pict-panel-border, #DDD6CA);
	border: 1px solid var(--pict-panel-border, #DDD6CA);
	cursor: pointer;
	color: var(--pict-panel-fg, #8A7F72);
	font-size: 10px;
	line-height: 1;
	opacity: 0.5;
	transition: opacity 0.25s, width 0.2s ease, height 0.2s ease, left 0.2s ease, right 0.2s ease, background 0.2s;
	z-index: 51;
}
.pict-panel-edge:hover .pict-panel-tab,
.pict-panel-tab:hover
{
	width: 20px;
	height: 32px;
	opacity: 1;
	overflow: visible;
	background: var(--pict-panel-bg, #FAF8F4);
}
/* Right panel: tab to the left of the edge */
.pict-panel-edge-right .pict-panel-tab
{
	right: 0;
	border-right: none;
	border-radius: 4px 0 0 4px;
}
.pict-panel-edge-right:hover .pict-panel-tab,
.pict-panel-edge-right .pict-panel-tab:hover
{
	right: 0;
}
/* Left panel: tab to the right of the edge */
.pict-panel-edge-left .pict-panel-tab
{
	left: 0;
	border-left: none;
	border-radius: 0 4px 4px 0;
}
.pict-panel-edge-left:hover .pict-panel-tab,
.pict-panel-edge-left .pict-panel-tab:hover
{
	left: 0;
}
/* When collapsed — more visible */
.pict-panel-edge-collapsed .pict-panel-tab
{
	width: 10px;
	height: 28px;
	opacity: 0.6;
}
.pict-panel-edge-collapsed .pict-panel-tab:hover,
.pict-panel-edge-collapsed:hover .pict-panel-tab
{
	width: 20px;
	height: 32px;
	opacity: 1;
	overflow: visible;
	background: var(--pict-panel-bg, #FAF8F4);
}
`
      };
    }, {}],
    19: [function (require, module, exports) {
      const libPictViewClass = require('pict-view');
      const libPictModalOverlay = require('./Pict-Modal-Overlay.js');
      const libPictModalConfirm = require('./Pict-Modal-Confirm.js');
      const libPictModalWindow = require('./Pict-Modal-Window.js');
      const libPictModalToast = require('./Pict-Modal-Toast.js');
      const libPictModalTooltip = require('./Pict-Modal-Tooltip.js');
      const libPictModalPanel = require('./Pict-Modal-Panel.js');
      const _DefaultConfiguration = require('./Pict-Section-Modal-DefaultConfiguration.js');
      class PictSectionModal extends libPictViewClass {
        constructor(pFable, pOptions, pServiceHash) {
          let tmpOptions = Object.assign({}, _DefaultConfiguration, pOptions);
          super(pFable, tmpOptions, pServiceHash);
          this._activeModals = [];
          this._activeTooltips = [];
          this._activeToasts = [];
          this._idCounter = 0;
          this._overlay = new libPictModalOverlay(this);
          this._confirm = new libPictModalConfirm(this);
          this._window = new libPictModalWindow(this);
          this._toast = new libPictModalToast(this);
          this._tooltip = new libPictModalTooltip(this);
          this._panel = new libPictModalPanel(this);
        }
        onBeforeInitialize() {
          super.onBeforeInitialize();

          // Ensure the root class is on the body for CSS variable scoping
          if (typeof document !== 'undefined' && document.body) {
            if (!document.body.classList.contains('pict-modal-root')) {
              document.body.classList.add('pict-modal-root');
            }
          }
          return super.onBeforeInitialize();
        }

        /**
         * Generate a unique ID for DOM elements.
         *
         * @returns {number}
         */
        _nextId() {
          this._idCounter++;
          return this._idCounter;
        }

        // -- Confirm API --

        /**
         * Show a confirmation dialog.
         *
         * @param {string} pMessage - The confirmation message
         * @param {object} [pOptions] - Options { title, confirmLabel, cancelLabel, dangerous }
         * @returns {Promise<boolean>}
         */
        confirm(pMessage, pOptions) {
          return this._confirm.confirm(pMessage, pOptions);
        }

        /**
         * Show a two-step confirmation dialog.
         *
         * If confirmPhrase is set, the user must type it to enable the confirm button.
         * If no confirmPhrase, the first click changes the button text and the second click confirms.
         *
         * @param {string} pMessage - The confirmation message
         * @param {object} [pOptions] - Options { title, confirmPhrase, phrasePrompt, confirmLabel, cancelLabel }
         * @returns {Promise<boolean>}
         */
        doubleConfirm(pMessage, pOptions) {
          return this._confirm.doubleConfirm(pMessage, pOptions);
        }

        // -- Modal Window API --

        /**
         * Show a custom modal window.
         *
         * @param {object} [pOptions] - Options { title, content, buttons, closeable, width, onOpen, onClose }
         * @returns {Promise<string|null>} Resolves with the clicked button Hash, or null on close
         */
        show(pOptions) {
          return this._window.show(pOptions);
        }

        // -- Tooltip API --

        /**
         * Attach a simple text tooltip to an element.
         *
         * @param {HTMLElement} pElement - Target element
         * @param {string} pText - Tooltip text
         * @param {object} [pOptions] - Options { position, delay, maxWidth }
         * @returns {{ destroy: function }}
         */
        tooltip(pElement, pText, pOptions) {
          return this._tooltip.tooltip(pElement, pText, pOptions);
        }

        /**
         * Attach a rich HTML tooltip to an element.
         *
         * @param {HTMLElement} pElement - Target element
         * @param {string} pHTMLContent - HTML content
         * @param {object} [pOptions] - Options { position, delay, maxWidth, interactive }
         * @returns {{ destroy: function }}
         */
        richTooltip(pElement, pHTMLContent, pOptions) {
          return this._tooltip.richTooltip(pElement, pHTMLContent, pOptions);
        }

        // -- Toast API --

        /**
         * Show a toast notification.
         *
         * @param {string} pMessage - Toast message
         * @param {object} [pOptions] - Options { type, duration, position, dismissible }
         * @returns {{ dismiss: function }}
         */
        toast(pMessage, pOptions) {
          return this._toast.toast(pMessage, pOptions);
        }

        // -- Panel API --

        /**
         * Attach resizable/collapsible panel behavior to a DOM element.
         *
         * @param {string} pTargetSelector - CSS selector for the panel element
         * @param {object} [pOptions] - Options { position, width, minWidth, maxWidth, collapsible, collapsed, persist, persistKey, onResize, onToggle }
         * @returns {{ collapse, expand, toggle, setWidth, destroy }} Panel handle
         */
        panel(pTargetSelector, pOptions) {
          return this._panel.create(pTargetSelector, pOptions);
        }

        // -- Cleanup API --

        /**
         * Dismiss all open modals.
         */
        dismissModals() {
          let tmpModals = this._activeModals.slice();
          for (let i = tmpModals.length - 1; i >= 0; i--) {
            tmpModals[i].dismiss(null);
          }
        }

        /**
         * Dismiss all active tooltips.
         */
        dismissTooltips() {
          this._tooltip.dismissAll();
        }

        /**
         * Dismiss all active toasts.
         */
        dismissToasts() {
          this._toast.dismissAll();
        }

        /**
         * Dismiss everything: modals, tooltips, and toasts.
         */
        dismissAll() {
          this.dismissModals();
          this.dismissTooltips();
          this.dismissToasts();
        }

        /**
         * Clean up all DOM elements when the view is destroyed.
         */
        /**
         * Destroy all active panels.
         */
        destroyPanels() {
          this._panel.destroyAll();
        }
        destroy() {
          this.dismissAll();
          this.destroyPanels();
          this._overlay.destroy();
          this._toast.destroy();
          if (typeof super.destroy === 'function') {
            return super.destroy();
          }
        }
      }
      module.exports = PictSectionModal;
      module.exports.default_configuration = _DefaultConfiguration;
    }, {
      "./Pict-Modal-Confirm.js": 12,
      "./Pict-Modal-Overlay.js": 13,
      "./Pict-Modal-Panel.js": 14,
      "./Pict-Modal-Toast.js": 15,
      "./Pict-Modal-Tooltip.js": 16,
      "./Pict-Modal-Window.js": 17,
      "./Pict-Section-Modal-DefaultConfiguration.js": 18,
      "pict-view": 21
    }],
    20: [function (require, module, exports) {
      module.exports = {
        "name": "pict-view",
        "version": "1.0.68",
        "description": "Pict View Base Class",
        "main": "source/Pict-View.js",
        "scripts": {
          "test": "npx quack test",
          "tests": "npx quack test -g",
          "start": "node source/Pict-View.js",
          "coverage": "npx quack coverage",
          "build": "npx quack build",
          "docker-dev-build": "docker build ./ -f Dockerfile_LUXURYCode -t pict-view-image:local",
          "docker-dev-run": "docker run -it -d --name pict-view-dev -p 30001:8080 -p 38086:8086 -v \"$PWD/.config:/home/coder/.config\"  -v \"$PWD:/home/coder/pict-view\" -u \"$(id -u):$(id -g)\" -e \"DOCKER_USER=$USER\" pict-view-image:local",
          "docker-dev-shell": "docker exec -it pict-view-dev /bin/bash",
          "types": "tsc -p .",
          "lint": "eslint source/**"
        },
        "types": "types/source/Pict-View.d.ts",
        "repository": {
          "type": "git",
          "url": "git+https://github.com/stevenvelozo/pict-view.git"
        },
        "author": "steven velozo <steven@velozo.com>",
        "license": "MIT",
        "bugs": {
          "url": "https://github.com/stevenvelozo/pict-view/issues"
        },
        "homepage": "https://github.com/stevenvelozo/pict-view#readme",
        "devDependencies": {
          "@eslint/js": "^9.39.1",
          "browser-env": "^3.3.0",
          "eslint": "^9.39.1",
          "pict": "^1.0.363",
          "quackage": "^1.0.65",
          "typescript": "^5.9.3"
        },
        "mocha": {
          "diff": true,
          "extension": ["js"],
          "package": "./package.json",
          "reporter": "spec",
          "slow": "75",
          "timeout": "5000",
          "ui": "tdd",
          "watch-files": ["source/**/*.js", "test/**/*.js"],
          "watch-ignore": ["lib/vendor"]
        },
        "dependencies": {
          "fable": "^3.1.67",
          "fable-serviceproviderbase": "^3.0.19"
        }
      };
    }, {}],
    21: [function (require, module, exports) {
      const libFableServiceBase = require('fable-serviceproviderbase');
      const libPackage = require('../package.json');
      const defaultPictViewSettings = {
        DefaultRenderable: false,
        DefaultDestinationAddress: false,
        DefaultTemplateRecordAddress: false,
        ViewIdentifier: false,
        // If this is set to true, when the App initializes this will.
        // After the App initializes, initialize will be called as soon as it's added.
        AutoInitialize: true,
        AutoInitializeOrdinal: 0,
        // If this is set to true, when the App autorenders (on load) this will.
        // After the App initializes, render will be called as soon as it's added.
        AutoRender: true,
        AutoRenderOrdinal: 0,
        AutoSolveWithApp: true,
        AutoSolveOrdinal: 0,
        CSSHash: false,
        CSS: false,
        CSSProvider: false,
        CSSPriority: 500,
        Templates: [],
        DefaultTemplates: [],
        Renderables: [],
        Manifests: {}
      };

      /** @typedef {(error?: Error) => void} ErrorCallback */
      /** @typedef {number | boolean} PictTimestamp */

      /**
       * @typedef {'replace' | 'append' | 'prepend' | 'append_once' | 'virtual-assignment'} RenderMethod
       */
      /**
       * @typedef {Object} Renderable
       *
       * @property {string} RenderableHash - A unique hash for the renderable.
       * @property {string} TemplateHash - The hash of the template to use for rendering this renderable.
       * @property {string} [DefaultTemplateRecordAddress] - The default address for resolving the data record for this renderable.
       * @property {string} [ContentDestinationAddress] - The default address (DOM CSS selector) for rendering the content of this renderable.
       * @property {RenderMethod} [RenderMethod=replace] - The method to use when projecting the renderable to the DOM ('replace', 'append', 'prepend', 'append_once', 'virtual-assignment').
       * @property {string} [TestAddress] - The address to use for testing the renderable.
       * @property {string} [TransactionHash] - The transaction hash for the root renderable.
       * @property {string} [RootRenderableViewHash] - The hash of the root renderable.
       * @property {string} [Content] - The rendered content for this renderable, if applicable.
       */

      /**
       * Represents a view in the Pict ecosystem.
       */
      class PictView extends libFableServiceBase {
        /**
         * @param {any} pFable - The Fable object that this service is attached to.
         * @param {any} [pOptions] - (optional) The options for this service.
         * @param {string} [pServiceHash] - (optional) The hash of the service.
         */
        constructor(pFable, pOptions, pServiceHash) {
          // Intersect default options, parent constructor, service information
          let tmpOptions = Object.assign({}, JSON.parse(JSON.stringify(defaultPictViewSettings)), pOptions);
          super(pFable, tmpOptions, pServiceHash);
          //FIXME: add types to fable and ancillaries
          /** @type {any} */
          this.fable;
          /** @type {any} */
          this.options;
          /** @type {String} */
          this.UUID;
          /** @type {String} */
          this.Hash;
          /** @type {any} */
          this.log;
          const tmpHashIsUUID = this.Hash === this.UUID;
          //NOTE: since many places are using the view UUID as the HTML element ID, we prefix it to avoid starting with a number
          this.UUID = `V-${this.UUID}`;
          if (tmpHashIsUUID) {
            this.Hash = this.UUID;
          }
          if (!this.options.ViewIdentifier) {
            this.options.ViewIdentifier = `AutoViewID-${this.fable.getUUID()}`;
          }
          this.serviceType = 'PictView';
          /** @type {Record<string, any>} */
          this._Package = libPackage;
          // Convenience and consistency naming
          /** @type {import('pict') & { log: any, instantiateServiceProviderWithoutRegistration: (hash: String) => any, instantiateServiceProviderIfNotExists: (hash: string) => any, TransactionTracking: import('pict/types/source/services/Fable-Service-TransactionTracking') }} */
          this.pict = this.fable;
          // Wire in the essential Pict application state
          this.AppData = this.pict.AppData;
          this.Bundle = this.pict.Bundle;

          /** @type {PictTimestamp} */
          this.initializeTimestamp = false;
          /** @type {PictTimestamp} */
          this.lastSolvedTimestamp = false;
          /** @type {PictTimestamp} */
          this.lastRenderedTimestamp = false;
          /** @type {PictTimestamp} */
          this.lastMarshalFromViewTimestamp = false;
          /** @type {PictTimestamp} */
          this.lastMarshalToViewTimestamp = false;
          this.pict.instantiateServiceProviderIfNotExists('TransactionTracking');

          // Load all templates from the array in the options
          // Templates are in the form of {Hash:'Some-Template-Hash',Template:'Template content',Source:'TemplateSource'}
          for (let i = 0; i < this.options.Templates.length; i++) {
            let tmpTemplate = this.options.Templates[i];
            if (!('Hash' in tmpTemplate) || !('Template' in tmpTemplate)) {
              this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not load Template ${i} in the options array.`, tmpTemplate);
            } else {
              if (!tmpTemplate.Source) {
                tmpTemplate.Source = `PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} options object.`;
              }
              this.pict.TemplateProvider.addTemplate(tmpTemplate.Hash, tmpTemplate.Template, tmpTemplate.Source);
            }
          }

          // Load all default templates from the array in the options
          // Templates are in the form of {Prefix:'',Postfix:'-List-Row',Template:'Template content',Source:'TemplateSourceString'}
          for (let i = 0; i < this.options.DefaultTemplates.length; i++) {
            let tmpDefaultTemplate = this.options.DefaultTemplates[i];
            if (!('Postfix' in tmpDefaultTemplate) || !('Template' in tmpDefaultTemplate)) {
              this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not load Default Template ${i} in the options array.`, tmpDefaultTemplate);
            } else {
              if (!tmpDefaultTemplate.Source) {
                tmpDefaultTemplate.Source = `PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} options object.`;
              }
              this.pict.TemplateProvider.addDefaultTemplate(tmpDefaultTemplate.Prefix, tmpDefaultTemplate.Postfix, tmpDefaultTemplate.Template, tmpDefaultTemplate.Source);
            }
          }

          // Load the CSS if it's available
          if (this.options.CSS) {
            let tmpCSSHash = this.options.CSSHash ? this.options.CSSHash : `View-${this.options.ViewIdentifier}`;
            let tmpCSSProvider = this.options.CSSProvider ? this.options.CSSProvider : tmpCSSHash;
            this.pict.CSSMap.addCSS(tmpCSSHash, this.options.CSS, tmpCSSProvider, this.options.CSSPriority);
          }

          // Load all renderables
          // Renderables are launchable renderable instructions with templates
          // They look as such: {Identifier:'ContentEntry', TemplateHash:'Content-Entry-Section-Main', ContentDestinationAddress:'#ContentSection', RecordAddress:'AppData.Content.DefaultText', ManifestTransformation:'ManyfestHash', ManifestDestinationAddress:'AppData.Content.DataToTransformContent'}
          // The only parts that are necessary are Identifier and Template
          // A developer can then do render('ContentEntry') and it just kinda works.  Or they can override the ContentDestinationAddress
          /** @type {Record<String, Renderable>} */
          this.renderables = {};
          for (let i = 0; i < this.options.Renderables.length; i++) {
            /** @type {Renderable} */
            let tmpRenderable = this.options.Renderables[i];
            this.addRenderable(tmpRenderable);
          }
        }

        /**
         * Adds a renderable to the view.
         *
         * @param {string | Renderable} pRenderableHash - The hash of the renderable, or a renderable object.
         * @param {string} [pTemplateHash] - (optional) The hash of the template for the renderable.
         * @param {string} [pDefaultTemplateRecordAddress] - (optional) The default data address for the template.
         * @param {string} [pDefaultDestinationAddress] - (optional) The default destination address for the renderable.
         * @param {RenderMethod} [pRenderMethod=replace] - (optional) The method to use when rendering the renderable (ex. 'replace').
         */
        addRenderable(pRenderableHash, pTemplateHash, pDefaultTemplateRecordAddress, pDefaultDestinationAddress, pRenderMethod) {
          /** @type {Renderable} */
          let tmpRenderable;
          if (typeof pRenderableHash == 'object') {
            // The developer passed in the renderable as an object.
            // Use theirs instead!
            tmpRenderable = pRenderableHash;
          } else {
            /** @type {RenderMethod} */
            let tmpRenderMethod = typeof pRenderMethod !== 'string' ? pRenderMethod : 'replace';
            tmpRenderable = {
              RenderableHash: pRenderableHash,
              TemplateHash: pTemplateHash,
              DefaultTemplateRecordAddress: pDefaultTemplateRecordAddress,
              ContentDestinationAddress: pDefaultDestinationAddress,
              RenderMethod: tmpRenderMethod
            };
          }
          if (typeof tmpRenderable.RenderableHash != 'string' || typeof tmpRenderable.TemplateHash != 'string') {
            this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not load Renderable; RenderableHash or TemplateHash are invalid.`, tmpRenderable);
          } else {
            if (this.pict.LogNoisiness > 0) {
              this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} adding renderable [${tmpRenderable.RenderableHash}] pointed to template ${tmpRenderable.TemplateHash}.`);
            }
            this.renderables[tmpRenderable.RenderableHash] = tmpRenderable;
          }
        }

        /* -------------------------------------------------------------------------- */
        /*                        Code Section: Initialization                        */
        /* -------------------------------------------------------------------------- */
        /**
         * Lifecycle hook that triggers before the view is initialized.
         */
        onBeforeInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onBeforeInitialize:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers before the view is initialized (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onBeforeInitializeAsync(fCallback) {
          this.onBeforeInitialize();
          return fCallback();
        }

        /**
         * Lifecycle hook that triggers when the view is initialized.
         */
        onInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onInitialize:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers when the view is initialized (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onInitializeAsync(fCallback) {
          this.onInitialize();
          return fCallback();
        }

        /**
         * Performs view initialization.
         */
        initialize() {
          if (this.pict.LogControlFlow) {
            this.log.trace(`PICT-ControlFlow VIEW [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} initialize:`);
          }
          if (!this.initializeTimestamp) {
            this.onBeforeInitialize();
            this.onInitialize();
            this.onAfterInitialize();
            this.initializeTimestamp = this.pict.log.getTimeStamp();
            return true;
          } else {
            this.log.warn(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} initialize called but initialization is already completed.  Aborting.`);
            return false;
          }
        }

        /**
         * Performs view initialization (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        initializeAsync(fCallback) {
          if (this.pict.LogControlFlow) {
            this.log.trace(`PICT-ControlFlow VIEW [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} initializeAsync:`);
          }
          if (!this.initializeTimestamp) {
            let tmpAnticipate = this.pict.instantiateServiceProviderWithoutRegistration('Anticipate');
            if (this.pict.LogNoisiness > 0) {
              this.log.info(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} beginning initialization...`);
            }
            tmpAnticipate.anticipate(this.onBeforeInitializeAsync.bind(this));
            tmpAnticipate.anticipate(this.onInitializeAsync.bind(this));
            tmpAnticipate.anticipate(this.onAfterInitializeAsync.bind(this));
            tmpAnticipate.wait(/** @param {Error} pError */
            pError => {
              if (pError) {
                this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} initialization failed: ${pError.message || pError}`, {
                  stack: pError.stack
                });
              }
              this.initializeTimestamp = this.pict.log.getTimeStamp();
              if (this.pict.LogNoisiness > 0) {
                this.log.info(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} initialization complete.`);
              }
              return fCallback();
            });
          } else {
            this.log.warn(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} async initialize called but initialization is already completed.  Aborting.`);
            // TODO: Should this be an error?
            return fCallback();
          }
        }
        onAfterInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onAfterInitialize:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers after the view is initialized (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onAfterInitializeAsync(fCallback) {
          this.onAfterInitialize();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                            Code Section: Render                            */
        /* -------------------------------------------------------------------------- */
        /**
         * Lifecycle hook that triggers before the view is rendered.
         *
         * @param {Renderable} pRenderable - The renderable that will be rendered.
         */
        onBeforeRender(pRenderable) {
          // Overload this to mess with stuff before the content gets generated from the template
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onBeforeRender:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers before the view is rendered (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         * @param {Renderable} pRenderable - The renderable that will be rendered.
         */
        onBeforeRenderAsync(fCallback, pRenderable) {
          this.onBeforeRender(pRenderable);
          return fCallback();
        }

        /**
         * Lifecycle hook that triggers before the view is projected into the DOM.
         *
         * @param {Renderable} pRenderable - The renderable that will be projected.
         */
        onBeforeProject(pRenderable) {
          // Overload this to mess with stuff before the content gets generated from the template
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onBeforeProject:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers before the view is projected into the DOM (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         * @param {Renderable} pRenderable - The renderable that will be projected.
         */
        onBeforeProjectAsync(fCallback, pRenderable) {
          this.onBeforeProject(pRenderable);
          return fCallback();
        }

        /**
         * Builds the render options for a renderable.
         *
         * For DRY purposes on the three flavors of render.
         *
         * @param {string|ErrorCallback} [pRenderableHash] - The hash of the renderable to render.
         * @param {string|ErrorCallback} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|object|ErrorCallback} [pTemplateRecordAddress] - The address of (or actual obejct) where the data for the template is stored.
         */
        buildRenderOptions(pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress) {
          let tmpRenderOptions = {
            Valid: true
          };
          tmpRenderOptions.RenderableHash = typeof pRenderableHash === 'string' ? pRenderableHash : typeof this.options.DefaultRenderable == 'string' ? this.options.DefaultRenderable : false;
          if (!tmpRenderOptions.RenderableHash) {
            this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not find a suitable RenderableHash ${tmpRenderOptions.RenderableHash} (param ${pRenderableHash}because it is not a valid renderable.`);
            tmpRenderOptions.Valid = false;
          }
          tmpRenderOptions.Renderable = this.renderables[tmpRenderOptions.RenderableHash];
          if (!tmpRenderOptions.Renderable) {
            this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render ${tmpRenderOptions.RenderableHash} (param ${pRenderableHash}) because it does not exist.`);
            tmpRenderOptions.Valid = false;
          }
          tmpRenderOptions.DestinationAddress = typeof pRenderDestinationAddress === 'string' ? pRenderDestinationAddress : typeof tmpRenderOptions.Renderable.ContentDestinationAddress === 'string' ? tmpRenderOptions.Renderable.ContentDestinationAddress : typeof this.options.DefaultDestinationAddress === 'string' ? this.options.DefaultDestinationAddress : false;
          if (!tmpRenderOptions.DestinationAddress) {
            this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render ${tmpRenderOptions.RenderableHash} (param ${pRenderableHash}) because it does not have a valid destination address (param ${pRenderDestinationAddress}).`);
            tmpRenderOptions.Valid = false;
          }
          if (typeof pTemplateRecordAddress === 'object') {
            tmpRenderOptions.RecordAddress = 'Passed in as object';
            tmpRenderOptions.Record = pTemplateRecordAddress;
          } else {
            tmpRenderOptions.RecordAddress = typeof pTemplateRecordAddress === 'string' ? pTemplateRecordAddress : typeof tmpRenderOptions.Renderable.DefaultTemplateRecordAddress === 'string' ? tmpRenderOptions.Renderable.DefaultTemplateRecordAddress : typeof this.options.DefaultTemplateRecordAddress === 'string' ? this.options.DefaultTemplateRecordAddress : false;
            tmpRenderOptions.Record = typeof tmpRenderOptions.RecordAddress === 'string' ? this.pict.DataProvider.getDataByAddress(tmpRenderOptions.RecordAddress) : undefined;
          }
          return tmpRenderOptions;
        }

        /**
         * Assigns the content to the destination address.
         *
         * For DRY purposes on the three flavors of render.
         *
         * @param {Renderable} pRenderable - The renderable to render.
         * @param {string} pRenderDestinationAddress - The address where the renderable will be rendered.
         * @param {string} pContent - The content to render.
         * @returns {boolean} - Returns true if the content was assigned successfully.
         * @memberof PictView
         */
        assignRenderContent(pRenderable, pRenderDestinationAddress, pContent) {
          return this.pict.ContentAssignment.projectContent(pRenderable.RenderMethod, pRenderDestinationAddress, pContent, pRenderable.TestAddress);
        }

        /**
         * Render a renderable from this view.
         *
         * @param {string} [pRenderableHash] - The hash of the renderable to render.
         * @param {string} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|object} [pTemplateRecordAddress] - The address where the data for the template is stored.
         * @param {Renderable} [pRootRenderable] - The root renderable for the render operation, if applicable.
         * @return {boolean}
         */
        render(pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, pRootRenderable) {
          return this.renderWithScope(this, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, pRootRenderable);
        }

        /**
         * Render a renderable from this view, providing a specifici scope for the template.
         *
         * @param {any} pScope - The scope to use for the template rendering.
         * @param {string} [pRenderableHash] - The hash of the renderable to render.
         * @param {string} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|object} [pTemplateRecordAddress] - The address where the data for the template is stored.
         * @param {Renderable} [pRootRenderable] - The root renderable for the render operation, if applicable.
         * @return {boolean}
         */
        renderWithScope(pScope, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, pRootRenderable) {
          let tmpRenderableHash = typeof pRenderableHash === 'string' ? pRenderableHash : typeof this.options.DefaultRenderable == 'string' ? this.options.DefaultRenderable : false;
          if (!tmpRenderableHash) {
            this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render ${tmpRenderableHash} (param ${pRenderableHash}) because it is not a valid renderable.`);
            return false;
          }

          /** @type {Renderable} */
          let tmpRenderable;
          if (tmpRenderableHash == '__Virtual') {
            tmpRenderable = {
              RenderableHash: '__Virtual',
              TemplateHash: this.renderables[this.options.DefaultRenderable].TemplateHash,
              ContentDestinationAddress: typeof pRenderDestinationAddress === 'string' ? pRenderDestinationAddress : typeof tmpRenderable.ContentDestinationAddress === 'string' ? tmpRenderable.ContentDestinationAddress : typeof this.options.DefaultDestinationAddress === 'string' ? this.options.DefaultDestinationAddress : null,
              RenderMethod: 'virtual-assignment',
              TransactionHash: pRootRenderable && pRootRenderable.TransactionHash,
              RootRenderableViewHash: pRootRenderable && pRootRenderable.RootRenderableViewHash
            };
          } else {
            tmpRenderable = Object.assign({}, this.renderables[tmpRenderableHash]);
            tmpRenderable.ContentDestinationAddress = typeof pRenderDestinationAddress === 'string' ? pRenderDestinationAddress : typeof tmpRenderable.ContentDestinationAddress === 'string' ? tmpRenderable.ContentDestinationAddress : typeof this.options.DefaultDestinationAddress === 'string' ? this.options.DefaultDestinationAddress : null;
          }
          if (!tmpRenderable.TransactionHash) {
            tmpRenderable.TransactionHash = `ViewRender-V-${this.options.ViewIdentifier}-R-${tmpRenderableHash}-U-${this.pict.getUUID()}`;
            tmpRenderable.RootRenderableViewHash = this.Hash;
            this.pict.TransactionTracking.registerTransaction(tmpRenderable.TransactionHash);
          }
          if (!tmpRenderable) {
            this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render ${tmpRenderableHash} (param ${pRenderableHash}) because it does not exist.`);
            return false;
          }
          if (!tmpRenderable.ContentDestinationAddress) {
            this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render ${tmpRenderableHash} (param ${pRenderableHash}) because it does not have a valid destination address.`);
            return false;
          }
          let tmpRecordAddress;
          let tmpRecord;
          if (typeof pTemplateRecordAddress === 'object') {
            tmpRecord = pTemplateRecordAddress;
            tmpRecordAddress = 'Passed in as object';
          } else {
            tmpRecordAddress = typeof pTemplateRecordAddress === 'string' ? pTemplateRecordAddress : typeof tmpRenderable.DefaultTemplateRecordAddress === 'string' ? tmpRenderable.DefaultTemplateRecordAddress : typeof this.options.DefaultTemplateRecordAddress === 'string' ? this.options.DefaultTemplateRecordAddress : false;
            tmpRecord = typeof tmpRecordAddress === 'string' ? this.pict.DataProvider.getDataByAddress(tmpRecordAddress) : undefined;
          }

          // Execute the developer-overridable pre-render behavior
          this.onBeforeRender(tmpRenderable);
          if (this.pict.LogControlFlow) {
            this.log.trace(`PICT-ControlFlow VIEW [${this.UUID}]::[${this.Hash}] Renderable[${tmpRenderableHash}] Destination[${tmpRenderable.ContentDestinationAddress}] TemplateRecordAddress[${tmpRecordAddress}] render:`);
          }
          if (this.pict.LogNoisiness > 0) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} Beginning Render of Renderable[${tmpRenderableHash}] to Destination [${tmpRenderable.ContentDestinationAddress}]...`);
          }
          // Generate the content output from the template and data
          tmpRenderable.Content = this.pict.parseTemplateByHash(tmpRenderable.TemplateHash, tmpRecord, null, [this], pScope, {
            RootRenderable: typeof pRootRenderable === 'object' ? pRootRenderable : tmpRenderable
          });
          if (this.pict.LogNoisiness > 0) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} Assigning Renderable[${tmpRenderableHash}] content length ${tmpRenderable.Content.length} to Destination [${tmpRenderable.ContentDestinationAddress}] using render method [${tmpRenderable.RenderMethod}].`);
          }
          this.onBeforeProject(tmpRenderable);
          this.onProject(tmpRenderable);
          if (tmpRenderable.RenderMethod !== 'virtual-assignment') {
            this.onAfterProject(tmpRenderable);

            // Execute the developer-overridable post-render behavior
            this.onAfterRender(tmpRenderable);
          }
          return true;
        }

        /**
         * Render a renderable from this view.
         *
         * @param {string|ErrorCallback} [pRenderableHash] - The hash of the renderable to render.
         * @param {string|ErrorCallback} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|object|ErrorCallback} [pTemplateRecordAddress] - The address where the data for the template is stored.
         * @param {Renderable|ErrorCallback} [pRootRenderable] - The root renderable for the render operation, if applicable.
         * @param {ErrorCallback} [fCallback] - The callback to call when the async operation is complete.
         *
         * @return {void}
         */
        renderAsync(pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, pRootRenderable, fCallback) {
          return this.renderWithScopeAsync(this, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, pRootRenderable, fCallback);
        }

        /**
         * Render a renderable from this view.
         *
         * @param {any} pScope - The scope to use for the template rendering.
         * @param {string|ErrorCallback} [pRenderableHash] - The hash of the renderable to render.
         * @param {string|ErrorCallback} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|object|ErrorCallback} [pTemplateRecordAddress] - The address where the data for the template is stored.
         * @param {Renderable|ErrorCallback} [pRootRenderable] - The root renderable for the render operation, if applicable.
         * @param {ErrorCallback} [fCallback] - The callback to call when the async operation is complete.
         *
         * @return {void}
         */
        renderWithScopeAsync(pScope, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, pRootRenderable, fCallback) {
          let tmpRenderableHash = typeof pRenderableHash === 'string' ? pRenderableHash : typeof this.options.DefaultRenderable == 'string' ? this.options.DefaultRenderable : false;

          // Allow the callback to be passed in as the last parameter no matter what
          /** @type {ErrorCallback} */
          let tmpCallback = typeof fCallback === 'function' ? fCallback : typeof pTemplateRecordAddress === 'function' ? pTemplateRecordAddress : typeof pRenderDestinationAddress === 'function' ? pRenderDestinationAddress : typeof pRenderableHash === 'function' ? pRenderableHash : typeof pRootRenderable === 'function' ? pRootRenderable : null;
          if (!tmpCallback) {
            this.log.warn(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.Name} renderAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions.`);
            tmpCallback = pError => {
              if (pError) {
                this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.Name} renderAsync Auto Callback Error: ${pError}`, pError);
              }
            };
          }
          if (!tmpRenderableHash) {
            this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not asynchronously render ${tmpRenderableHash} (param ${pRenderableHash}because it is not a valid renderable.`);
            return tmpCallback(new Error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not asynchronously render ${tmpRenderableHash} (param ${pRenderableHash}because it is not a valid renderable.`));
          }

          /** @type {Renderable} */
          let tmpRenderable;
          if (tmpRenderableHash == '__Virtual') {
            tmpRenderable = {
              RenderableHash: '__Virtual',
              TemplateHash: this.renderables[this.options.DefaultRenderable].TemplateHash,
              ContentDestinationAddress: typeof pRenderDestinationAddress === 'string' ? pRenderDestinationAddress : typeof this.options.DefaultDestinationAddress === 'string' ? this.options.DefaultDestinationAddress : null,
              RenderMethod: 'virtual-assignment',
              TransactionHash: pRootRenderable && typeof pRootRenderable !== 'function' && pRootRenderable.TransactionHash,
              RootRenderableViewHash: pRootRenderable && typeof pRootRenderable !== 'function' && pRootRenderable.RootRenderableViewHash
            };
          } else {
            tmpRenderable = Object.assign({}, this.renderables[tmpRenderableHash]);
            tmpRenderable.ContentDestinationAddress = typeof pRenderDestinationAddress === 'string' ? pRenderDestinationAddress : typeof tmpRenderable.ContentDestinationAddress === 'string' ? tmpRenderable.ContentDestinationAddress : typeof this.options.DefaultDestinationAddress === 'string' ? this.options.DefaultDestinationAddress : null;
          }
          if (!tmpRenderable.TransactionHash) {
            tmpRenderable.TransactionHash = `ViewRender-V-${this.options.ViewIdentifier}-R-${tmpRenderableHash}-U-${this.pict.getUUID()}`;
            tmpRenderable.RootRenderableViewHash = this.Hash;
            this.pict.TransactionTracking.registerTransaction(tmpRenderable.TransactionHash);
          }
          if (!tmpRenderable) {
            this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render ${tmpRenderableHash} (param ${pRenderableHash}) because it does not exist.`);
            return tmpCallback(new Error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render ${tmpRenderableHash} (param ${pRenderableHash}) because it does not exist.`));
          }
          if (!tmpRenderable.ContentDestinationAddress) {
            this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render ${tmpRenderableHash} (param ${pRenderableHash}) because it does not have a valid destination address.`);
            return tmpCallback(new Error(`Could not render ${tmpRenderableHash}`));
          }
          let tmpRecordAddress;
          let tmpRecord;
          if (typeof pTemplateRecordAddress === 'object') {
            tmpRecord = pTemplateRecordAddress;
            tmpRecordAddress = 'Passed in as object';
          } else {
            tmpRecordAddress = typeof pTemplateRecordAddress === 'string' ? pTemplateRecordAddress : typeof tmpRenderable.DefaultTemplateRecordAddress === 'string' ? tmpRenderable.DefaultTemplateRecordAddress : typeof this.options.DefaultTemplateRecordAddress === 'string' ? this.options.DefaultTemplateRecordAddress : false;
            tmpRecord = typeof tmpRecordAddress === 'string' ? this.pict.DataProvider.getDataByAddress(tmpRecordAddress) : undefined;
          }
          if (this.pict.LogControlFlow) {
            this.log.trace(`PICT-ControlFlow VIEW [${this.UUID}]::[${this.Hash}] Renderable[${tmpRenderableHash}] Destination[${tmpRenderable.ContentDestinationAddress}] TemplateRecordAddress[${tmpRecordAddress}] renderAsync:`);
          }
          if (this.pict.LogNoisiness > 2) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} Beginning Asynchronous Render (callback-style)...`);
          }
          let tmpAnticipate = this.fable.newAnticipate();
          tmpAnticipate.anticipate(fOnBeforeRenderCallback => {
            this.onBeforeRenderAsync(fOnBeforeRenderCallback, tmpRenderable);
          });
          tmpAnticipate.anticipate(fAsyncTemplateCallback => {
            // Render the template (asynchronously)
            this.pict.parseTemplateByHash(tmpRenderable.TemplateHash, tmpRecord, (pError, pContent) => {
              if (pError) {
                this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render (asynchronously) ${tmpRenderableHash} (param ${pRenderableHash}) because it did not parse the template.`, pError);
                return fAsyncTemplateCallback(pError);
              }
              tmpRenderable.Content = pContent;
              return fAsyncTemplateCallback();
            }, [this], pScope, {
              RootRenderable: typeof pRootRenderable === 'object' ? pRootRenderable : tmpRenderable
            });
          });
          tmpAnticipate.anticipate(fNext => {
            this.onBeforeProjectAsync(fNext, tmpRenderable);
          });
          tmpAnticipate.anticipate(fNext => {
            this.onProjectAsync(fNext, tmpRenderable);
          });
          if (tmpRenderable.RenderMethod !== 'virtual-assignment') {
            tmpAnticipate.anticipate(fNext => {
              this.onAfterProjectAsync(fNext, tmpRenderable);
            });

            // Execute the developer-overridable post-render behavior
            tmpAnticipate.anticipate(fNext => {
              this.onAfterRenderAsync(fNext, tmpRenderable);
            });
          }
          tmpAnticipate.wait(tmpCallback);
        }

        /**
         * Renders the default renderable.
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        renderDefaultAsync(fCallback) {
          // Render the default renderable
          this.renderAsync(fCallback);
        }

        /**
         * @param {string} [pRenderableHash] - The hash of the renderable to render.
         * @param {string} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|object} [pTemplateRecordAddress] - The address of (or actual obejct) where the data for the template is stored.
         */
        basicRender(pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress) {
          return this.basicRenderWithScope(this, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress);
        }

        /**
         * @param {any} pScope - The scope to use for the template rendering.
         * @param {string} [pRenderableHash] - The hash of the renderable to render.
         * @param {string} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|object} [pTemplateRecordAddress] - The address of (or actual obejct) where the data for the template is stored.
         */
        basicRenderWithScope(pScope, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress) {
          let tmpRenderOptions = this.buildRenderOptions(pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress);
          if (tmpRenderOptions.Valid) {
            this.assignRenderContent(tmpRenderOptions.Renderable, tmpRenderOptions.DestinationAddress, this.pict.parseTemplateByHash(tmpRenderOptions.Renderable.TemplateHash, tmpRenderOptions.Record, null, [this], pScope, {
              RootRenderable: tmpRenderOptions.Renderable
            }));
            return true;
          } else {
            this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not perform a basic render of ${tmpRenderOptions.RenderableHash} because it is not valid.`);
            return false;
          }
        }

        /**
         * @param {string|ErrorCallback} [pRenderableHash] - The hash of the renderable to render.
         * @param {string|ErrorCallback} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|Object|ErrorCallback} [pTemplateRecordAddress] - The address of (or actual obejct) where the data for the template is stored.
         * @param {ErrorCallback} [fCallback] - The callback to call when the async operation is complete.
         */
        basicRenderAsync(pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, fCallback) {
          return this.basicRenderWithScopeAsync(this, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, fCallback);
        }

        /**
         * @param {any} pScope - The scope to use for the template rendering.
         * @param {string|ErrorCallback} [pRenderableHash] - The hash of the renderable to render.
         * @param {string|ErrorCallback} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|Object|ErrorCallback} [pTemplateRecordAddress] - The address of (or actual obejct) where the data for the template is stored.
         * @param {ErrorCallback} [fCallback] - The callback to call when the async operation is complete.
         */
        basicRenderWithScopeAsync(pScope, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, fCallback) {
          // Allow the callback to be passed in as the last parameter no matter what
          /** @type {ErrorCallback} */
          let tmpCallback = typeof fCallback === 'function' ? fCallback : typeof pTemplateRecordAddress === 'function' ? pTemplateRecordAddress : typeof pRenderDestinationAddress === 'function' ? pRenderDestinationAddress : typeof pRenderableHash === 'function' ? pRenderableHash : null;
          if (!tmpCallback) {
            this.log.warn(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.Name} basicRenderAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions.`);
            tmpCallback = pError => {
              if (pError) {
                this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.Name} basicRenderAsync Auto Callback Error: ${pError}`, pError);
              }
            };
          }
          const tmpRenderOptions = this.buildRenderOptions(pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress);
          if (tmpRenderOptions.Valid) {
            this.pict.parseTemplateByHash(tmpRenderOptions.Renderable.TemplateHash, tmpRenderOptions.Record,
            /**
             * @param {Error} [pError] - The error that occurred during template parsing.
             * @param {string} [pContent] - The content that was rendered from the template.
             */
            (pError, pContent) => {
              if (pError) {
                this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render (asynchronously) ${tmpRenderOptions.RenderableHash} because it did not parse the template.`, pError);
                return tmpCallback(pError);
              }
              this.assignRenderContent(tmpRenderOptions.Renderable, tmpRenderOptions.DestinationAddress, pContent);
              return tmpCallback();
            }, [this], pScope, {
              RootRenderable: tmpRenderOptions.Renderable
            });
          } else {
            let tmpErrorMessage = `PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not perform a basic render of ${tmpRenderOptions.RenderableHash} because it is not valid.`;
            this.log.error(tmpErrorMessage);
            return tmpCallback(new Error(tmpErrorMessage));
          }
        }

        /**
         * @param {Renderable} pRenderable - The renderable that was rendered.
         */
        onProject(pRenderable) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onProject:`);
          }
          if (pRenderable.RenderMethod === 'virtual-assignment') {
            this.pict.TransactionTracking.pushToTransactionQueue(pRenderable.TransactionHash, {
              ViewHash: this.Hash,
              Renderable: pRenderable
            }, 'Deferred-Post-Content-Assignment');
          }
          if (this.pict.LogNoisiness > 0) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} Assigning Renderable[${pRenderable.RenderableHash}] content length ${pRenderable.Content.length} to Destination [${pRenderable.ContentDestinationAddress}] using Async render method ${pRenderable.RenderMethod}.`);
          }

          // Assign the content to the destination address
          this.pict.ContentAssignment.projectContent(pRenderable.RenderMethod, pRenderable.ContentDestinationAddress, pRenderable.Content, pRenderable.TestAddress);
          this.lastRenderedTimestamp = this.pict.log.getTimeStamp();
        }

        /**
         * Lifecycle hook that triggers after the view is projected into the DOM (async flow).
         *
         * @param {(error?: Error, content?: string) => void} fCallback - The callback to call when the async operation is complete.
         * @param {Renderable} pRenderable - The renderable that is being projected.
         */
        onProjectAsync(fCallback, pRenderable) {
          this.onProject(pRenderable);
          return fCallback();
        }

        /**
         * Lifecycle hook that triggers after the view is rendered.
         *
         * @param {Renderable} pRenderable - The renderable that was rendered.
         */
        onAfterRender(pRenderable) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onAfterRender:`);
          }
          if (pRenderable && pRenderable.RootRenderableViewHash === this.Hash) {
            const tmpTransactionQueue = this.pict.TransactionTracking.clearTransactionQueue(pRenderable.TransactionHash) || [];
            for (const tmpEvent of tmpTransactionQueue) {
              const tmpView = this.pict.views[tmpEvent.Data.ViewHash];
              if (!tmpView) {
                this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onAfterRender: Could not find view for transaction hash ${pRenderable.TransactionHash} and ViewHash ${tmpEvent.Data.ViewHash}.`);
                continue;
              }
              tmpView.onAfterProject();

              // Execute the developer-overridable post-render behavior
              tmpView.onAfterRender(tmpEvent.Data.Renderable);
            }
            // Queue is drained and nested child renders have each cleaned up
            // their own transactions; remove this root render's entry from
            // the tracking map so it does not leak.
            this.pict.TransactionTracking.unregisterTransaction(pRenderable.TransactionHash);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers after the view is rendered (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         * @param {Renderable} pRenderable - The renderable that was rendered.
         */
        onAfterRenderAsync(fCallback, pRenderable) {
          // NOTE: this.onAfterRender(pRenderable) will itself clear the
          // transaction queue and unregister the transaction if this view is
          // the root renderable - see onAfterRender above. So by the time the
          // loop below runs, the queue is already empty and there is nothing
          // to drain. Keeping the async queue walk here defensively in case
          // future subclasses override onAfterRender in ways that skip the
          // drain, but the common path is now "sync drain, async no-op".
          this.onAfterRender(pRenderable);
          const tmpAnticipate = this.fable.newAnticipate();
          const tmpIsRootRenderable = pRenderable && pRenderable.RootRenderableViewHash === this.Hash;
          if (tmpIsRootRenderable) {
            const queue = this.pict.TransactionTracking.clearTransactionQueue(pRenderable.TransactionHash) || [];
            for (const event of queue) {
              /** @type {PictView} */
              const tmpView = this.pict.views[event.Data.ViewHash];
              if (!tmpView) {
                this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onAfterRenderAsync: Could not find view for transaction hash ${pRenderable.TransactionHash} and ViewHash ${event.Data.ViewHash}.`);
                continue;
              }
              tmpAnticipate.anticipate(tmpView.onAfterProjectAsync.bind(tmpView));
              tmpAnticipate.anticipate(fNext => {
                tmpView.onAfterRenderAsync(fNext, event.Data.Renderable);
              });

              // Execute the developer-overridable post-render behavior
            }
          }
          return tmpAnticipate.wait(pError => {
            // Nested virtual-assignment children have now settled their own
            // onAfterRenderAsync chains (and unregistered their own
            // transactions along the way). Ensure this root render's entry
            // is also gone - unregisterTransaction is a no-op if the sync
            // onAfterRender above already removed it, so this is safe to
            // call unconditionally on the root path.
            if (tmpIsRootRenderable && pRenderable && pRenderable.TransactionHash) {
              this.pict.TransactionTracking.unregisterTransaction(pRenderable.TransactionHash);
            }
            return fCallback(pError);
          });
        }

        /**
         * Lifecycle hook that triggers after the view is projected into the DOM.
         *
         * @param {Renderable} pRenderable - The renderable that was projected.
         */
        onAfterProject(pRenderable) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onAfterProject:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers after the view is projected into the DOM (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         * @param {Renderable} pRenderable - The renderable that was projected.
         */
        onAfterProjectAsync(fCallback, pRenderable) {
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                            Code Section: Solver                            */
        /* -------------------------------------------------------------------------- */
        /**
         * Lifecycle hook that triggers before the view is solved.
         */
        onBeforeSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onBeforeSolve:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers before the view is solved (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onBeforeSolveAsync(fCallback) {
          this.onBeforeSolve();
          return fCallback();
        }

        /**
         * Lifecycle hook that triggers when the view is solved.
         */
        onSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onSolve:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers when the view is solved (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onSolveAsync(fCallback) {
          this.onSolve();
          return fCallback();
        }

        /**
         * Performs view solving and triggers lifecycle hooks.
         *
         * @return {boolean} - True if the view was solved successfully, false otherwise.
         */
        solve() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} executing solve() function...`);
          }
          this.onBeforeSolve();
          this.onSolve();
          this.onAfterSolve();
          this.lastSolvedTimestamp = this.pict.log.getTimeStamp();
          return true;
        }

        /**
         * Performs view solving and triggers lifecycle hooks (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        solveAsync(fCallback) {
          let tmpAnticipate = this.pict.instantiateServiceProviderWithoutRegistration('Anticipate');

          /** @type {ErrorCallback} */
          let tmpCallback = typeof fCallback === 'function' ? fCallback : null;
          if (!tmpCallback) {
            this.log.warn(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.Name} solveAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions.`);
            tmpCallback = pError => {
              if (pError) {
                this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.Name} solveAsync Auto Callback Error: ${pError}`, pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeSolveAsync.bind(this));
          tmpAnticipate.anticipate(this.onSolveAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterSolveAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} solveAsync() complete.`);
            }
            this.lastSolvedTimestamp = this.pict.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * Lifecycle hook that triggers after the view is solved.
         */
        onAfterSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onAfterSolve:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers after the view is solved (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onAfterSolveAsync(fCallback) {
          this.onAfterSolve();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Marshal From View                        */
        /* -------------------------------------------------------------------------- */
        /**
         * Lifecycle hook that triggers before data is marshaled from the view.
         *
         * @return {boolean} - True if the operation was successful, false otherwise.
         */
        onBeforeMarshalFromView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onBeforeMarshalFromView:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers before data is marshaled from the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onBeforeMarshalFromViewAsync(fCallback) {
          this.onBeforeMarshalFromView();
          return fCallback();
        }

        /**
         * Lifecycle hook that triggers when data is marshaled from the view.
         */
        onMarshalFromView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onMarshalFromView:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers when data is marshaled from the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onMarshalFromViewAsync(fCallback) {
          this.onMarshalFromView();
          return fCallback();
        }

        /**
         * Marshals data from the view.
         *
         * @return {boolean} - True if the operation was successful, false otherwise.
         */
        marshalFromView() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} executing solve() function...`);
          }
          this.onBeforeMarshalFromView();
          this.onMarshalFromView();
          this.onAfterMarshalFromView();
          this.lastMarshalFromViewTimestamp = this.pict.log.getTimeStamp();
          return true;
        }

        /**
         * Marshals data from the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        marshalFromViewAsync(fCallback) {
          let tmpAnticipate = this.pict.instantiateServiceProviderWithoutRegistration('Anticipate');

          /** @type {ErrorCallback} */
          let tmpCallback = typeof fCallback === 'function' ? fCallback : null;
          if (!tmpCallback) {
            this.log.warn(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.Name} marshalFromViewAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions.`);
            tmpCallback = pError => {
              if (pError) {
                this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.Name} marshalFromViewAsync Auto Callback Error: ${pError}`, pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeMarshalFromViewAsync.bind(this));
          tmpAnticipate.anticipate(this.onMarshalFromViewAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterMarshalFromViewAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} marshalFromViewAsync() complete.`);
            }
            this.lastMarshalFromViewTimestamp = this.pict.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * Lifecycle hook that triggers after data is marshaled from the view.
         */
        onAfterMarshalFromView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onAfterMarshalFromView:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers after data is marshaled from the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onAfterMarshalFromViewAsync(fCallback) {
          this.onAfterMarshalFromView();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Marshal To View                          */
        /* -------------------------------------------------------------------------- */
        /**
         * Lifecycle hook that triggers before data is marshaled into the view.
         */
        onBeforeMarshalToView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onBeforeMarshalToView:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers before data is marshaled into the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onBeforeMarshalToViewAsync(fCallback) {
          this.onBeforeMarshalToView();
          return fCallback();
        }

        /**
         * Lifecycle hook that triggers when data is marshaled into the view.
         */
        onMarshalToView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onMarshalToView:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers when data is marshaled into the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onMarshalToViewAsync(fCallback) {
          this.onMarshalToView();
          return fCallback();
        }

        /**
         * Marshals data into the view.
         *
         * @return {boolean} - True if the operation was successful, false otherwise.
         */
        marshalToView() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} executing solve() function...`);
          }
          this.onBeforeMarshalToView();
          this.onMarshalToView();
          this.onAfterMarshalToView();
          this.lastMarshalToViewTimestamp = this.pict.log.getTimeStamp();
          return true;
        }

        /**
         * Marshals data into the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        marshalToViewAsync(fCallback) {
          let tmpAnticipate = this.pict.instantiateServiceProviderWithoutRegistration('Anticipate');

          /** @type {ErrorCallback} */
          let tmpCallback = typeof fCallback === 'function' ? fCallback : null;
          if (!tmpCallback) {
            this.log.warn(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.Name} marshalToViewAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions.`);
            tmpCallback = pError => {
              if (pError) {
                this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.Name} marshalToViewAsync Auto Callback Error: ${pError}`, pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeMarshalToViewAsync.bind(this));
          tmpAnticipate.anticipate(this.onMarshalToViewAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterMarshalToViewAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} marshalToViewAsync() complete.`);
            }
            this.lastMarshalToViewTimestamp = this.pict.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * Lifecycle hook that triggers after data is marshaled into the view.
         */
        onAfterMarshalToView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onAfterMarshalToView:`);
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers after data is marshaled into the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onAfterMarshalToViewAsync(fCallback) {
          this.onAfterMarshalToView();
          return fCallback();
        }

        /** @return {boolean} - True if the object is a PictView. */
        get isPictView() {
          return true;
        }
      }
      module.exports = PictView;
    }, {
      "../package.json": 20,
      "fable-serviceproviderbase": 2
    }],
    22: [function (require, module, exports) {
      /**
       * Retold DataBeacon — Pict Application
       *
       * Main web application class for the DataBeacon web UI. Registers
       * providers and views; boots AppData; delegates navigation to the
       * Layout view.
       */
      const libPictApplication = require('pict-application');
      const libPictSectionModal = require('pict-section-modal');
      const libPictSectionCode = require('pict-section-code');
      const libDataBeaconProvider = require('./providers/Pict-Provider-DataBeacon.js');
      const libDataBeaconIconsProvider = require('./providers/Pict-Provider-DataBeacon-Icons.js');
      const libDataBeaconThemeProvider = require('./providers/Pict-Provider-DataBeacon-Theme.js');
      const libDataBeaconExportProvider = require('./providers/Pict-Provider-DataBeacon-Export.js');
      const libDataBeaconSavedQueriesProvider = require('./providers/Pict-Provider-DataBeacon-SavedQueries.js');

      // Page / container views
      const libViewLayout = require('./views/PictView-DataBeacon-Layout.js');
      const libViewDashboard = require('./views/PictView-DataBeacon-Dashboard.js');
      const libViewConnections = require('./views/PictView-DataBeacon-Connections.js');
      const libViewIntrospection = require('./views/PictView-DataBeacon-Introspection.js');
      const libViewEndpoints = require('./views/PictView-DataBeacon-Endpoints.js');
      const libViewRecords = require('./views/PictView-DataBeacon-Records.js');
      const libViewSQL = require('./views/PictView-DataBeacon-SQL.js');

      // Sub-views composed into the container pages
      const libViewConnectionForm = require('./views/PictView-DataBeacon-ConnectionForm.js');
      const libViewConnectionList = require('./views/PictView-DataBeacon-ConnectionList.js');
      const libViewIntrospectionControls = require('./views/PictView-DataBeacon-IntrospectionControls.js');
      const libViewIntrospectionTables = require('./views/PictView-DataBeacon-IntrospectionTables.js');
      const libViewRecordBrowser = require('./views/PictView-DataBeacon-RecordBrowser.js');
      const libViewQueryPanel = require('./views/PictView-DataBeacon-QueryPanel.js');
      const libViewThemeSwitcher = require('./views/PictView-DataBeacon-ThemeSwitcher.js');
      const libViewSavedQueriesList = require('./views/PictView-DataBeacon-SavedQueriesList.js');
      class DataBeaconApplication extends libPictApplication {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
          this.serviceType = 'DataBeaconApplication';

          // Providers — Theme comes first so the body data-attributes are
          // applied before any view renders (no flash of un-themed content).
          this.pict.addProvider('DataBeacon-Theme', libDataBeaconThemeProvider.default_configuration, libDataBeaconThemeProvider);
          this.pict.addProvider('DataBeaconProvider', libDataBeaconProvider.default_configuration, libDataBeaconProvider);
          this.pict.addProvider('DataBeacon-Icons', libDataBeaconIconsProvider.default_configuration, libDataBeaconIconsProvider);
          this.pict.addProvider('DataBeacon-Export', libDataBeaconExportProvider.default_configuration, libDataBeaconExportProvider);
          this.pict.addProvider('DataBeacon-SavedQueries', libDataBeaconSavedQueriesProvider.default_configuration, libDataBeaconSavedQueriesProvider);

          // Shell + page views
          this.pict.addView('Layout', libViewLayout.default_configuration, libViewLayout);
          this.pict.addView('Dashboard', libViewDashboard.default_configuration, libViewDashboard);
          this.pict.addView('Connections', libViewConnections.default_configuration, libViewConnections);
          this.pict.addView('Introspection', libViewIntrospection.default_configuration, libViewIntrospection);
          this.pict.addView('Endpoints', libViewEndpoints.default_configuration, libViewEndpoints);
          this.pict.addView('Records', libViewRecords.default_configuration, libViewRecords);
          this.pict.addView('SQL', libViewSQL.default_configuration, libViewSQL);

          // Sub-views
          this.pict.addView('ConnectionForm', libViewConnectionForm.default_configuration, libViewConnectionForm);
          this.pict.addView('ConnectionList', libViewConnectionList.default_configuration, libViewConnectionList);
          this.pict.addView('IntrospectionControls', libViewIntrospectionControls.default_configuration, libViewIntrospectionControls);
          this.pict.addView('IntrospectionTables', libViewIntrospectionTables.default_configuration, libViewIntrospectionTables);
          this.pict.addView('RecordBrowser', libViewRecordBrowser.default_configuration, libViewRecordBrowser);
          this.pict.addView('QueryPanel', libViewQueryPanel.default_configuration, libViewQueryPanel);
          this.pict.addView('ThemeSwitcher', libViewThemeSwitcher.default_configuration, libViewThemeSwitcher);
          this.pict.addView('SavedQueriesList', libViewSavedQueriesList.default_configuration, libViewSavedQueriesList);

          // SQL code editor (pict-section-code + CodeJar) — registered separately so the
          // QueryPanel view can mount it into its editor slot each time it renders.
          this.pict.addView('SQLEditor', {
            ViewIdentifier: 'SQLEditor',
            TargetElementAddress: '#DataBeacon-QueryPanel-Editor',
            Language: 'sql',
            LineNumbers: true,
            ReadOnly: false,
            CodeDataAddress: 'AppData.QueryPanel.SQL',
            DefaultCode: '',
            AutoRender: false
          }, libPictSectionCode);

          // Modal service (pict-section-modal exposes show/confirm/toast via pict.views.PictSectionModal)
          this.pict.addView('PictSectionModal', libPictSectionModal.default_configuration, libPictSectionModal);
        }
        onAfterInitializeAsync(fCallback) {
          // Set up application state.
          if (!this.pict.AppData) this.pict.AppData = {};
          this.pict.AppData.Connections = [];
          this.pict.AppData.AvailableTypes = [];
          this.pict.AppData.AvailableTypesForForm = [];
          this.pict.AppData.Tables = [];
          this.pict.AppData.Endpoints = [];
          this.pict.AppData.SelectedConnectionID = null;
          this.pict.AppData.SelectedTableName = null;
          this.pict.AppData.Records = [];
          this.pict.AppData.BeaconStatus = {
            Connected: false
          };
          this.pict.AppData.CurrentView = 'Dashboard';

          // Seed the view-shape AppData branches so the first render of each
          // screen has something to bind against (providers overwrite these
          // as soon as API responses arrive).
          this.pict.AppData.Dashboard = {
            TotalConnections: 0,
            ActiveConnections: 0,
            TotalEndpoints: 0,
            BeaconStatusLabel: 'Unknown',
            BeaconBadgeClass: 'badge-neutral',
            BeaconName: 'retold-databeacon',
            ConnectionSummary: []
          };
          this.pict.AppData.Introspection = {
            ConnectedList: [],
            ShowPlaceholder: true,
            HasSelection: false,
            SelectedBanner: null,
            RunDisabled: true,
            AllDisabled: true,
            State: 'NoConnections',
            TablesView: [],
            TablesHeader: null,
            DetailModalColumns: []
          };
          this.pict.AppData.QueryPanel = {
            SQL: ''
          };
          this.pict.AppData.RecordBrowser = {
            TableOptions: [],
            PageSizeOptions: [],
            SelectedTableName: '',
            TableName: '',
            CursorStart: 0,
            PageSize: 50,
            PrevDisabled: true,
            NextDisabled: true,
            LoadDisabled: true,
            RangeLabel: '',
            State: 'NoSelection',
            ColumnList: [],
            Rows: []
          };

          // Keep a window handle for legacy/debug access only; views do NOT rely on it.
          if (typeof window !== 'undefined') window.DataBeaconApp = this;

          // Render the shell.
          this.pict.views.Layout.render();

          // Load initial data.
          let tmpProvider = this.pict.providers.DataBeaconProvider;
          if (tmpProvider) {
            tmpProvider.loadConnections();
            tmpProvider.loadAvailableTypes();
            tmpProvider.loadEndpoints();
            tmpProvider.loadBeaconStatus();
          }

          // Land on the dashboard.
          this.navigateTo('Dashboard');
          return super.onAfterInitializeAsync(fCallback);
        }

        /**
         * Public navigation hook (also exposed on `window.DataBeaconApp` for legacy).
         * Delegates to the Layout view which owns the active-panel state.
         * @param {string} pViewName
         */
        navigateTo(pViewName) {
          if (this.pict.views.Layout && typeof this.pict.views.Layout.setActiveView === 'function') {
            this.pict.views.Layout.setActiveView(pViewName);
          }
        }
      }
      module.exports = DataBeaconApplication;
      module.exports.default_configuration = {};
    }, {
      "./providers/Pict-Provider-DataBeacon-Export.js": 24,
      "./providers/Pict-Provider-DataBeacon-Icons.js": 25,
      "./providers/Pict-Provider-DataBeacon-SavedQueries.js": 26,
      "./providers/Pict-Provider-DataBeacon-Theme.js": 28,
      "./providers/Pict-Provider-DataBeacon.js": 29,
      "./views/PictView-DataBeacon-ConnectionForm.js": 30,
      "./views/PictView-DataBeacon-ConnectionList.js": 31,
      "./views/PictView-DataBeacon-Connections.js": 32,
      "./views/PictView-DataBeacon-Dashboard.js": 33,
      "./views/PictView-DataBeacon-Endpoints.js": 34,
      "./views/PictView-DataBeacon-Introspection.js": 35,
      "./views/PictView-DataBeacon-IntrospectionControls.js": 36,
      "./views/PictView-DataBeacon-IntrospectionTables.js": 37,
      "./views/PictView-DataBeacon-Layout.js": 38,
      "./views/PictView-DataBeacon-QueryPanel.js": 39,
      "./views/PictView-DataBeacon-RecordBrowser.js": 40,
      "./views/PictView-DataBeacon-Records.js": 41,
      "./views/PictView-DataBeacon-SQL.js": 42,
      "./views/PictView-DataBeacon-SavedQueriesList.js": 43,
      "./views/PictView-DataBeacon-ThemeSwitcher.js": 44,
      "pict-application": 5,
      "pict-section-code": 11,
      "pict-section-modal": 19
    }],
    23: [function (require, module, exports) {
      /**
       * Retold DataBeacon — Browser Bundle Entry
       *
       * This file is the entry point for the Pict web application bundle.
       * Quackage (browserify) processes this file to produce retold-databeacon.js.
       */
      let libPictApplication = require('pict-application');
      let libPictView = require('pict-view');
      let libPictRouter = require('pict-router');
      let libPictSectionCode = require('pict-section-code');

      // Application
      let libDataBeaconApplication = require('./Pict-Application-DataBeacon.js');

      // Providers
      let libDataBeaconProvider = require('./providers/Pict-Provider-DataBeacon.js');
      let libDataBeaconIconsProvider = require('./providers/Pict-Provider-DataBeacon-Icons.js');
      let libDataBeaconThemeProvider = require('./providers/Pict-Provider-DataBeacon-Theme.js');
      let libDataBeaconExportProvider = require('./providers/Pict-Provider-DataBeacon-Export.js');
      let libDataBeaconSavedQueriesProvider = require('./providers/Pict-Provider-DataBeacon-SavedQueries.js');

      // Views — Layout + page/container views
      let libViewLayout = require('./views/PictView-DataBeacon-Layout.js');
      let libViewDashboard = require('./views/PictView-DataBeacon-Dashboard.js');
      let libViewConnections = require('./views/PictView-DataBeacon-Connections.js');
      let libViewIntrospection = require('./views/PictView-DataBeacon-Introspection.js');
      let libViewEndpoints = require('./views/PictView-DataBeacon-Endpoints.js');
      let libViewRecords = require('./views/PictView-DataBeacon-Records.js');
      let libViewSQL = require('./views/PictView-DataBeacon-SQL.js');

      // Views — sub-views that make up the page containers
      let libViewConnectionForm = require('./views/PictView-DataBeacon-ConnectionForm.js');
      let libViewConnectionList = require('./views/PictView-DataBeacon-ConnectionList.js');
      let libViewIntrospectionControls = require('./views/PictView-DataBeacon-IntrospectionControls.js');
      let libViewIntrospectionTables = require('./views/PictView-DataBeacon-IntrospectionTables.js');
      let libViewRecordBrowser = require('./views/PictView-DataBeacon-RecordBrowser.js');
      let libViewQueryPanel = require('./views/PictView-DataBeacon-QueryPanel.js');
      let libViewThemeSwitcher = require('./views/PictView-DataBeacon-ThemeSwitcher.js');
      let libViewSavedQueriesList = require('./views/PictView-DataBeacon-SavedQueriesList.js');

      // Expose the application class on window for Pict.safeLoadPictApplication
      window.DataBeaconApplication = libDataBeaconApplication;
    }, {
      "./Pict-Application-DataBeacon.js": 22,
      "./providers/Pict-Provider-DataBeacon-Export.js": 24,
      "./providers/Pict-Provider-DataBeacon-Icons.js": 25,
      "./providers/Pict-Provider-DataBeacon-SavedQueries.js": 26,
      "./providers/Pict-Provider-DataBeacon-Theme.js": 28,
      "./providers/Pict-Provider-DataBeacon.js": 29,
      "./views/PictView-DataBeacon-ConnectionForm.js": 30,
      "./views/PictView-DataBeacon-ConnectionList.js": 31,
      "./views/PictView-DataBeacon-Connections.js": 32,
      "./views/PictView-DataBeacon-Dashboard.js": 33,
      "./views/PictView-DataBeacon-Endpoints.js": 34,
      "./views/PictView-DataBeacon-Introspection.js": 35,
      "./views/PictView-DataBeacon-IntrospectionControls.js": 36,
      "./views/PictView-DataBeacon-IntrospectionTables.js": 37,
      "./views/PictView-DataBeacon-Layout.js": 38,
      "./views/PictView-DataBeacon-QueryPanel.js": 39,
      "./views/PictView-DataBeacon-RecordBrowser.js": 40,
      "./views/PictView-DataBeacon-Records.js": 41,
      "./views/PictView-DataBeacon-SQL.js": 42,
      "./views/PictView-DataBeacon-SavedQueriesList.js": 43,
      "./views/PictView-DataBeacon-ThemeSwitcher.js": 44,
      "pict-application": 5,
      "pict-router": 8,
      "pict-section-code": 11,
      "pict-view": 21
    }],
    24: [function (require, module, exports) {
      /**
       * Retold DataBeacon — Export Provider
       *
       * Converts an in-memory row set into JSON (array), JSON (Meadow
       * Comprehension), CSV, or TSV and triggers a browser download. Shared by
       * the RecordBrowser (paginated table page) and QueryPanel (SQL result set)
       * views — any new view that shows tabular data can call the same entry
       * point.
       */
      const libPictProvider = require('pict-provider');
      const _ProviderConfiguration = {
        ProviderIdentifier: 'DataBeacon-Export',
        AutoInitialize: true,
        AutoInitializeOrdinal: 0
      };
      const _SupportedFormats = ['json', 'json-comp', 'csv', 'tsv'];
      class PictProviderDataBeaconExport extends libPictProvider {
        constructor(pFable, pOptions, pServiceHash) {
          let tmpOptions = Object.assign({}, _ProviderConfiguration, pOptions);
          super(pFable, tmpOptions, pServiceHash);
          this.serviceType = 'PictProviderDataBeaconExport';
        }

        /**
         * Public entry point. Converts pRows to the requested format and kicks
         * off a browser download.
         *
         * @param {string} pFormat - 'json' | 'json-comp' | 'csv' | 'tsv'
         * @param {Array<Object>} pRows
         * @param {Object} [pOptions]
         * @param {string} [pOptions.BaseName]   - Filename stem (default "databeacon-export").
         * @param {string} [pOptions.EntityName] - Top-level key for Comprehension exports (default "Record").
         * @param {string} [pOptions.KeyField]   - Row field used as the Comprehension map key. Falls back to row index.
         * @returns {boolean} true on success, false when the format is unknown or the download fails.
         */
        exportRows(pFormat, pRows, pOptions) {
          if (_SupportedFormats.indexOf(pFormat) === -1) {
            this.log.warn(`PictProviderDataBeaconExport: unsupported format [${pFormat}]`);
            return false;
          }
          let tmpOptions = pOptions || {};
          let tmpBase = tmpOptions.BaseName || 'databeacon-export';
          let tmpRows = Array.isArray(pRows) ? pRows : [];
          let tmpContent;
          let tmpMime;
          let tmpExt;
          let tmpSuffix = '';
          switch (pFormat) {
            case 'json':
              tmpContent = this.formatJSONArray(tmpRows);
              tmpMime = 'application/json';
              tmpExt = 'json';
              break;
            case 'json-comp':
              tmpContent = this.formatJSONComprehension(tmpRows, tmpOptions.EntityName || 'Record', tmpOptions.KeyField);
              tmpMime = 'application/json';
              tmpExt = 'json';
              tmpSuffix = '-comprehension';
              break;
            case 'csv':
              tmpContent = this.formatCSV(tmpRows);
              tmpMime = 'text/csv';
              tmpExt = 'csv';
              break;
            case 'tsv':
              tmpContent = this.formatTSV(tmpRows);
              tmpMime = 'text/tab-separated-values';
              tmpExt = 'tsv';
              break;
          }
          let tmpFilename = `${tmpBase}${tmpSuffix}-${this._timestamp()}.${tmpExt}`;
          return this._download(tmpContent, tmpMime, tmpFilename);
        }

        // ================================================================
        // Format helpers (pure — exposed for test / reuse)
        // ================================================================

        formatJSONArray(pRows) {
          return JSON.stringify(pRows || [], null, '\t');
        }

        /**
         * Emit a Meadow-style Comprehension:
         *   { [EntityName]: { [KeyValue]: { ...record }, ... } }
         * Rows missing pKeyField fall back to 1-based row index as the map key.
         */
        formatJSONComprehension(pRows, pEntityName, pKeyField) {
          let tmpEntity = pEntityName || 'Record';
          let tmpRows = pRows || [];
          let tmpMap = {};
          for (let i = 0; i < tmpRows.length; i++) {
            let tmpRow = tmpRows[i];
            let tmpKey;
            if (pKeyField && tmpRow && tmpRow[pKeyField] !== null && tmpRow[pKeyField] !== undefined && tmpRow[pKeyField] !== '') {
              tmpKey = String(tmpRow[pKeyField]);
            } else {
              tmpKey = String(i + 1);
            }
            // Disambiguate duplicates by suffixing — Comprehension map keys must be unique.
            let tmpCandidate = tmpKey;
            let tmpCollisionIndex = 1;
            while (Object.prototype.hasOwnProperty.call(tmpMap, tmpCandidate)) {
              tmpCollisionIndex++;
              tmpCandidate = `${tmpKey}#${tmpCollisionIndex}`;
            }
            tmpMap[tmpCandidate] = tmpRow;
          }
          let tmpOut = {};
          tmpOut[tmpEntity] = tmpMap;
          return JSON.stringify(tmpOut, null, '\t');
        }
        formatCSV(pRows) {
          // RFC 4180: comma-separated, CRLF line endings, double-quote wrap
          // when a field contains a delimiter / quote / newline.
          return this._buildDelimited(pRows, ',', '\r\n', true);
        }
        formatTSV(pRows) {
          // Classic TSV — tabs separate fields, LF separates rows. Tabs and
          // newlines inside values are replaced with spaces because the TSV
          // spec has no escape mechanism.
          return this._buildDelimited(pRows, '\t', '\n', false);
        }
        _buildDelimited(pRows, pFieldSep, pRowSep, pQuote) {
          let tmpRows = pRows || [];
          let tmpColumns = this._collectColumns(tmpRows);
          if (tmpColumns.length === 0) return '';
          let tmpLines = [];
          let tmpHeader = [];
          for (let h = 0; h < tmpColumns.length; h++) {
            tmpHeader.push(this._escapeField(tmpColumns[h], pFieldSep, pRowSep, pQuote));
          }
          tmpLines.push(tmpHeader.join(pFieldSep));
          for (let r = 0; r < tmpRows.length; r++) {
            let tmpRow = tmpRows[r] || {};
            let tmpCells = [];
            for (let c = 0; c < tmpColumns.length; c++) {
              tmpCells.push(this._escapeField(tmpRow[tmpColumns[c]], pFieldSep, pRowSep, pQuote));
            }
            tmpLines.push(tmpCells.join(pFieldSep));
          }
          return tmpLines.join(pRowSep);
        }

        /**
         * Walk every row and record column names in first-seen order so a union
         * of sparse rows exports cleanly.
         */
        _collectColumns(pRows) {
          let tmpSeen = {};
          let tmpOrdered = [];
          for (let i = 0; i < pRows.length; i++) {
            let tmpRow = pRows[i];
            if (!tmpRow || typeof tmpRow !== 'object') continue;
            let tmpKeys = Object.keys(tmpRow);
            for (let k = 0; k < tmpKeys.length; k++) {
              if (!tmpSeen[tmpKeys[k]]) {
                tmpSeen[tmpKeys[k]] = true;
                tmpOrdered.push(tmpKeys[k]);
              }
            }
          }
          return tmpOrdered;
        }
        _escapeField(pValue, pFieldSep, pRowSep, pQuote) {
          if (pValue === null || pValue === undefined) return '';
          let tmpStr;
          if (typeof pValue === 'object') {
            try {
              tmpStr = JSON.stringify(pValue);
            } catch (pError) {
              tmpStr = String(pValue);
            }
          } else {
            tmpStr = String(pValue);
          }
          if (pQuote) {
            let tmpNeedsQuote = tmpStr.indexOf(pFieldSep) !== -1 || tmpStr.indexOf('"') !== -1 || tmpStr.indexOf('\n') !== -1 || tmpStr.indexOf('\r') !== -1;
            if (tmpNeedsQuote) tmpStr = '"' + tmpStr.replace(/"/g, '""') + '"';
            return tmpStr;
          }
          return tmpStr.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
        }
        _timestamp() {
          let tmpDate = new Date();
          let tmpPad = n => String(n).padStart(2, '0');
          return tmpDate.getFullYear() + tmpPad(tmpDate.getMonth() + 1) + tmpPad(tmpDate.getDate()) + '-' + tmpPad(tmpDate.getHours()) + tmpPad(tmpDate.getMinutes()) + tmpPad(tmpDate.getSeconds());
        }
        _download(pContent, pMime, pFilename) {
          if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') {
            this.log.warn('PictProviderDataBeaconExport: no browser APIs available; cannot download.');
            return false;
          }
          try {
            let tmpBlob = new Blob([pContent], {
              type: `${pMime};charset=utf-8`
            });
            let tmpUrl = URL.createObjectURL(tmpBlob);
            let tmpAnchor = document.createElement('a');
            tmpAnchor.href = tmpUrl;
            tmpAnchor.download = pFilename;
            tmpAnchor.style.display = 'none';
            document.body.appendChild(tmpAnchor);
            tmpAnchor.click();
            setTimeout(() => {
              if (tmpAnchor.parentNode) tmpAnchor.parentNode.removeChild(tmpAnchor);
              URL.revokeObjectURL(tmpUrl);
            }, 0);
            return true;
          } catch (pError) {
            this.log.error(`PictProviderDataBeaconExport: download failed: ${pError && pError.message ? pError.message : pError}`);
            return false;
          }
        }
      }
      module.exports = PictProviderDataBeaconExport;
      module.exports.default_configuration = _ProviderConfiguration;
    }, {
      "pict-provider": 7
    }],
    25: [function (require, module, exports) {
      /**
       * Retold DataBeacon — Icon Provider
       *
       * Centralized SVG icon library. All icons share a 24x24 viewBox and use
       * currentColor for stroke so they inherit the surrounding text color via CSS.
       *
       * Each icon is registered as a pict template with hash `DataBeacon-Icon-{key}`,
       * so templates can emit `{~Template:DataBeacon-Icon-plus:~}` inline. Views can
       * also inject at custom sizes via `getIconSVGMarkup(key, size)` into
       * `<span data-databeacon-icon="key" data-icon-size="N"></span>` placeholders.
       */
      const libPictProvider = require('pict-provider');
      const _ProviderConfiguration = {
        ProviderIdentifier: 'DataBeacon-Icons',
        AutoInitialize: true,
        AutoInitializeOrdinal: 0
      };

      // Default rendered size (pixels) when a placeholder does not specify one.
      const _DefaultSize = 16;

      // Icon library. The `{IconSize}` placeholder is replaced at render time.
      const _DefaultIcons = {
        // ── Navigation ─────────────────────────────────────────────────────────

        'dashboard': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/></svg>',
        'connections': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="2.5"/><path d="M4 5v14c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5"/><path d="M4 10c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"/><path d="M4 15c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"/></svg>',
        'introspection': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/><path d="M8 11h6M11 8v6"/></svg>',
        'endpoints': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M7.2 10.8l9.6-3.6M7.2 13.2l9.6 3.6"/></svg>',
        'records': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/></svg>',
        'terminal': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/></svg>',
        'chevron-left': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
        'chevron-right': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
        'download': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
        'save': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
        'chevron-up': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
        'chevron-down': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
        'tag': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
        // ── Row / button actions ──────────────────────────────────────────────

        'plus': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
        'trash': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/><path d="M10 11v6M14 11v6"/></svg>',
        'test': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
        'connect': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a5 5 0 0 1 0-7l3-3a5 5 0 0 1 7 7l-1.5 1.5"/><path d="M14 10a5 5 0 0 1 0 7l-3 3a5 5 0 0 1-7-7l1.5-1.5"/></svg>',
        'disconnect': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 7l3-3M4 20l3-3M15 5l-2 2M9 19l2-2"/><path d="M10 14a5 5 0 0 1 0-7l1.5-1.5"/><path d="M14 10a5 5 0 0 1 0 7l-1.5 1.5"/></svg>',
        'refresh': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
        'eye': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>',
        'external-link': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>',
        'play': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
        'info': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
        // ── Status / misc ─────────────────────────────────────────────────────

        'check': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
        'x': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        'warning': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
        'database': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="2.5"/><path d="M4 5v14c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5"/><path d="M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"/></svg>',
        'key': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L21 2M17 6l3 3M14 9l3 3"/></svg>',
        // ── Theme / mode switcher ─────────────────────────────────────────────

        'sun': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
        'moon': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
        'monitor': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
        'palette': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.66 0 3-1.34 3-3v-.5a2.5 2.5 0 0 1 2.5-2.5H19a3 3 0 0 0 3-3 9 9 0 0 0-10-9z"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor"/><circle cx="10.5" cy="7" r="1" fill="currentColor"/><circle cx="14.5" cy="7" r="1" fill="currentColor"/><circle cx="17.5" cy="10.5" r="1" fill="currentColor"/></svg>',
        // ── Fallback ──────────────────────────────────────────────────────────

        'default': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="2"/></svg>'
      };
      class PictProviderDataBeaconIcons extends libPictProvider {
        constructor(pFable, pOptions, pServiceHash) {
          let tmpOptions = Object.assign({}, _ProviderConfiguration, pOptions);
          super(pFable, tmpOptions, pServiceHash);
          this.serviceType = 'PictProviderDataBeaconIcons';

          // Deep copy the default icon set so consumer registrations do not mutate it.
          this._Icons = JSON.parse(JSON.stringify(_DefaultIcons));
        }
        onAfterInitialize() {
          this._registerIconTemplates();
          return super.onAfterInitialize();
        }

        /**
         * Register each icon as a pict template so it can be emitted inline via
         * `{~Template:DataBeacon-Icon-<key>:~}` from any other template.
         * Templates are registered at the default size (16px).
         */
        _registerIconTemplates() {
          if (!this.pict || !this.pict.TemplateProvider || typeof this.pict.TemplateProvider.addTemplate !== 'function') {
            this.log.warn('PictProviderDataBeaconIcons: TemplateProvider not available; icon templates not registered.');
            return;
          }
          let tmpKeys = Object.keys(this._Icons);
          for (let i = 0; i < tmpKeys.length; i++) {
            let tmpHash = `DataBeacon-Icon-${tmpKeys[i]}`;
            let tmpMarkup = this._Icons[tmpKeys[i]].replace(/\{IconSize\}/g, String(_DefaultSize));
            this.pict.TemplateProvider.addTemplate(tmpHash, tmpMarkup);
          }
        }

        /**
         * Resolve an icon key to SVG markup at a specific pixel size.
         * Unknown keys fall back to the `default` icon.
         *
         * @param {string} pIconKey
         * @param {number} [pSize]
         * @returns {string}
         */
        getIconSVGMarkup(pIconKey, pSize) {
          let tmpSize = pSize || _DefaultSize;
          let tmpKey = pIconKey && this._Icons.hasOwnProperty(pIconKey) ? pIconKey : 'default';
          return this._Icons[tmpKey].replace(/\{IconSize\}/g, String(tmpSize));
        }

        /**
         * Fill every `<span data-databeacon-icon="key" [data-icon-size="N"]>` placeholder
         * within `pRootSelector` with the matching SVG. Called by views from onAfterRender
         * so templates can stay declarative.
         *
         * @param {string} pRootSelector - CSS selector of the container to scan.
         */
        injectIconPlaceholders(pRootSelector) {
          if (!this.pict || !this.pict.ContentAssignment) return;
          let tmpRootList = this.pict.ContentAssignment.getElement(pRootSelector);
          if (!tmpRootList || tmpRootList.length === 0) return;
          let tmpRoot = tmpRootList[0];
          let tmpPlaceholders = tmpRoot.querySelectorAll('[data-databeacon-icon]');
          for (let i = 0; i < tmpPlaceholders.length; i++) {
            let tmpEl = tmpPlaceholders[i];
            if (tmpEl.getAttribute('data-databeacon-icon-rendered') === 'true') continue;
            let tmpKey = tmpEl.getAttribute('data-databeacon-icon');
            let tmpSize = parseInt(tmpEl.getAttribute('data-icon-size'), 10) || _DefaultSize;
            tmpEl.innerHTML = this.getIconSVGMarkup(tmpKey, tmpSize);
            tmpEl.setAttribute('data-databeacon-icon-rendered', 'true');
          }
        }
        hasIcon(pIconKey) {
          return this._Icons.hasOwnProperty(pIconKey);
        }
        registerIcon(pIconKey, pSVGMarkup) {
          if (!pIconKey || !pSVGMarkup) return false;
          this._Icons[pIconKey] = pSVGMarkup;
          if (this.pict && this.pict.TemplateProvider) {
            this.pict.TemplateProvider.addTemplate(`DataBeacon-Icon-${pIconKey}`, pSVGMarkup.replace(/\{IconSize\}/g, String(_DefaultSize)));
          }
          return true;
        }
      }
      module.exports = PictProviderDataBeaconIcons;
      module.exports.default_configuration = _ProviderConfiguration;
    }, {
      "pict-provider": 7
    }],
    26: [function (require, module, exports) {
      /**
       * Retold DataBeacon — Saved Queries Provider
       *
       * localStorage-backed library of reusable SQL queries. Each record has a
       * stable GUIDSavedQuery (Meadow's GUID${Entity} convention), a Name,
       * free-form Documentation, the SQL body, an optional associated connection,
       * freeform Tags, create/update timestamps, and a last-run timestamp +
       * row count populated by QueryPanel.execute.
       *
       * Storage envelope:
       *   localStorage[databeacon.savedQueries] = JSON.stringify({
       *     Version: 1,
       *     Records: { [GUID]: { ...record } }
       *   })
       *
       * Exposes view-ready data at AppData.SavedQueries for the
       * SavedQueriesList view and QueryPanel to bind against.
       */
      const libPictProvider = require('pict-provider');
      const _ProviderConfiguration = {
        ProviderIdentifier: 'DataBeacon-SavedQueries',
        AutoInitialize: true,
        AutoInitializeOrdinal: 0
      };
      const _StorageKey = 'databeacon.savedQueries';
      const _SchemaVersion = 1;
      class PictProviderDataBeaconSavedQueries extends libPictProvider {
        constructor(pFable, pOptions, pServiceHash) {
          let tmpOptions = Object.assign({}, _ProviderConfiguration, pOptions);
          super(pFable, tmpOptions, pServiceHash);
          this.serviceType = 'PictProviderDataBeaconSavedQueries';
          this._Records = {};
        }
        onAfterInitialize() {
          this._load();
          if (!this.pict.AppData.SavedQueries) {
            this.pict.AppData.SavedQueries = {
              List: [],
              Count: 0,
              IsEmpty: true,
              Expanded: false,
              ActiveGUID: null,
              ToggleIcon: 'chevron-right'
            };
          }
          this._recomputeViewData();
          return super.onAfterInitialize();
        }

        // ================================================================
        // Public CRUD
        // ================================================================

        list() {
          let tmpOut = [];
          let tmpKeys = Object.keys(this._Records);
          for (let i = 0; i < tmpKeys.length; i++) tmpOut.push(this._Records[tmpKeys[i]]);
          tmpOut.sort((a, b) => String(b.DateUpdated || '').localeCompare(String(a.DateUpdated || '')));
          return tmpOut;
        }
        get(pGUID) {
          if (!pGUID) return null;
          return this._Records[pGUID] || null;
        }
        create(pDraft) {
          let tmpDraft = pDraft || {};
          let tmpGUID = this._generateGUID();
          let tmpNow = new Date().toISOString();
          let tmpRecord = {
            GUIDSavedQuery: tmpGUID,
            Name: typeof tmpDraft.Name === 'string' && tmpDraft.Name.length > 0 ? tmpDraft.Name : 'Untitled Query',
            Documentation: typeof tmpDraft.Documentation === 'string' ? tmpDraft.Documentation : '',
            SQL: typeof tmpDraft.SQL === 'string' ? tmpDraft.SQL : '',
            IDBeaconConnection: this._normalizeConnectionID(tmpDraft.IDBeaconConnection),
            Tags: this._normalizeTags(tmpDraft.Tags),
            DateCreated: tmpNow,
            DateUpdated: tmpNow,
            DateLastRun: null,
            LastRowCount: null
          };
          this._Records[tmpGUID] = tmpRecord;
          this._persist();
          this._broadcast();
          return tmpRecord;
        }
        update(pGUID, pPatch) {
          let tmpExisting = this._Records[pGUID];
          if (!tmpExisting) return null;
          let tmpNext = Object.assign({}, tmpExisting);
          if (pPatch) {
            if (typeof pPatch.Name === 'string' && pPatch.Name.length > 0) tmpNext.Name = pPatch.Name;
            if (typeof pPatch.Documentation === 'string') tmpNext.Documentation = pPatch.Documentation;
            if (typeof pPatch.SQL === 'string') tmpNext.SQL = pPatch.SQL;
            if ('IDBeaconConnection' in pPatch) tmpNext.IDBeaconConnection = this._normalizeConnectionID(pPatch.IDBeaconConnection);
            if ('Tags' in pPatch) tmpNext.Tags = this._normalizeTags(pPatch.Tags);
          }
          tmpNext.DateUpdated = new Date().toISOString();
          this._Records[pGUID] = tmpNext;
          this._persist();
          this._broadcast();
          return tmpNext;
        }
        remove(pGUID) {
          if (!this._Records[pGUID]) return false;
          delete this._Records[pGUID];
          // If the deleted query was the active one, clear the active pointer.
          if (this.pict.AppData.SavedQueries && this.pict.AppData.SavedQueries.ActiveGUID === pGUID) {
            this.pict.AppData.SavedQueries.ActiveGUID = null;
          }
          this._persist();
          this._broadcast();
          return true;
        }

        /**
         * Record a successful execution against a saved query. Invoked from
         * QueryPanel._execute after the server responds.
         */
        noteRun(pGUID, pRowCount) {
          if (!pGUID || !this._Records[pGUID]) return false;
          this._Records[pGUID].DateLastRun = new Date().toISOString();
          this._Records[pGUID].LastRowCount = typeof pRowCount === 'number' && isFinite(pRowCount) ? pRowCount : null;
          this._persist();
          this._broadcast();
          return true;
        }
        setActiveGUID(pGUID) {
          if (!this.pict.AppData.SavedQueries) this.pict.AppData.SavedQueries = {};
          this.pict.AppData.SavedQueries.ActiveGUID = pGUID || null;
          this._broadcast();
        }
        getActiveGUID() {
          return this.pict.AppData.SavedQueries && this.pict.AppData.SavedQueries.ActiveGUID || null;
        }
        setExpanded(pExpanded) {
          if (!this.pict.AppData.SavedQueries) this.pict.AppData.SavedQueries = {};
          this.pict.AppData.SavedQueries.Expanded = !!pExpanded;
          this._broadcast();
        }
        toggleExpanded() {
          this.setExpanded(!(this.pict.AppData.SavedQueries && this.pict.AppData.SavedQueries.Expanded));
        }

        // ================================================================
        // Internal
        // ================================================================

        _broadcast() {
          this._recomputeViewData();
          if (this.pict.views.SavedQueriesList && typeof this.pict.views.SavedQueriesList.render === 'function') {
            this.pict.views.SavedQueriesList.render();
          }
        }
        _recomputeViewData() {
          let tmpItems = this.list();
          let tmpConnections = this.pict.AppData.Connections || [];
          let tmpPrev = this.pict.AppData.SavedQueries || {};
          let tmpActiveGUID = tmpPrev.ActiveGUID || null;
          let tmpExpanded = !!tmpPrev.Expanded;
          let tmpList = [];
          for (let i = 0; i < tmpItems.length; i++) {
            let tmpR = tmpItems[i];
            let tmpConn = this._findConnection(tmpConnections, tmpR.IDBeaconConnection);
            let tmpIsActive = tmpR.GUIDSavedQuery === tmpActiveGUID;
            tmpList.push({
              GUIDSavedQuery: tmpR.GUIDSavedQuery,
              Name: tmpR.Name,
              Documentation: tmpR.Documentation,
              DocumentationPreview: this._truncate(tmpR.Documentation, 80),
              SQL: tmpR.SQL,
              IDBeaconConnection: tmpR.IDBeaconConnection,
              Tags: tmpR.Tags,
              TagsDisplay: Array.isArray(tmpR.Tags) && tmpR.Tags.length > 0 ? tmpR.Tags.join(', ') : '—',
              ConnectionLabel: tmpConn ? `${tmpConn.Name} (${tmpConn.Type})` : '—',
              DateCreated: tmpR.DateCreated,
              DateUpdated: tmpR.DateUpdated,
              DateLastRun: tmpR.DateLastRun,
              DateUpdatedDisplay: this._formatDate(tmpR.DateUpdated),
              DateLastRunDisplay: tmpR.DateLastRun ? this._formatDate(tmpR.DateLastRun) : '—',
              LastRowCount: tmpR.LastRowCount,
              LastRowCountDisplay: tmpR.LastRowCount !== null && tmpR.LastRowCount !== undefined ? String(tmpR.LastRowCount) : '—',
              IsActive: tmpIsActive,
              ActiveClass: tmpIsActive ? 'is-active-query' : ''
            });
          }
          this.pict.AppData.SavedQueries = {
            List: tmpList,
            Count: tmpList.length,
            IsEmpty: tmpList.length === 0,
            Expanded: tmpExpanded,
            ActiveGUID: tmpActiveGUID,
            ToggleIcon: tmpExpanded ? 'chevron-down' : 'chevron-right',
            ToggleLabel: tmpExpanded ? 'Hide' : 'Show'
          };
        }
        _findConnection(pConnections, pID) {
          if (pID === null || pID === undefined) return null;
          for (let i = 0; i < pConnections.length; i++) {
            if (pConnections[i].IDBeaconConnection === pID) return pConnections[i];
          }
          return null;
        }
        _truncate(pStr, pMax) {
          if (!pStr) return '';
          let tmpS = String(pStr);
          return tmpS.length <= pMax ? tmpS : tmpS.substring(0, pMax - 1) + '…';
        }
        _formatDate(pISO) {
          if (!pISO) return '';
          try {
            let tmpD = new Date(pISO);
            if (isNaN(tmpD.getTime())) return pISO;
            let tmpPad = n => String(n).padStart(2, '0');
            return tmpD.getFullYear() + '-' + tmpPad(tmpD.getMonth() + 1) + '-' + tmpPad(tmpD.getDate()) + ' ' + tmpPad(tmpD.getHours()) + ':' + tmpPad(tmpD.getMinutes());
          } catch (pError) {
            return pISO;
          }
        }
        _normalizeTags(pTags) {
          if (Array.isArray(pTags)) {
            let tmpOut = [];
            for (let i = 0; i < pTags.length; i++) {
              let tmpT = String(pTags[i] || '').trim();
              if (tmpT.length > 0) tmpOut.push(tmpT);
            }
            return tmpOut;
          }
          if (typeof pTags === 'string') {
            let tmpParts = pTags.split(',');
            let tmpOut = [];
            for (let i = 0; i < tmpParts.length; i++) {
              let tmpT = tmpParts[i].trim();
              if (tmpT.length > 0) tmpOut.push(tmpT);
            }
            return tmpOut;
          }
          return [];
        }
        _normalizeConnectionID(pID) {
          if (pID === null || pID === undefined || pID === '') return null;
          let tmpN = parseInt(pID, 10);
          return isNaN(tmpN) ? null : tmpN;
        }
        _generateGUID() {
          if (this.pict && typeof this.pict.getUUID === 'function') {
            try {
              let tmpUUID = this.pict.getUUID();
              if (tmpUUID) return tmpUUID;
            } catch (pError) {/* fall through */}
          }
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, pChar => {
            let tmpR = Math.random() * 16 | 0;
            let tmpV = pChar === 'x' ? tmpR : tmpR & 0x3 | 0x8;
            return tmpV.toString(16);
          });
        }
        _load() {
          try {
            if (typeof localStorage === 'undefined') return;
            let tmpRaw = localStorage.getItem(_StorageKey);
            if (!tmpRaw) return;
            let tmpParsed = JSON.parse(tmpRaw);
            if (tmpParsed && tmpParsed.Version === _SchemaVersion && tmpParsed.Records && typeof tmpParsed.Records === 'object') {
              this._Records = tmpParsed.Records;
            }
          } catch (pError) {
            this.log.warn(`SavedQueries load failed: ${pError && pError.message ? pError.message : pError}`);
            this._Records = {};
          }
        }
        _persist() {
          try {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem(_StorageKey, JSON.stringify({
              Version: _SchemaVersion,
              Records: this._Records
            }));
          } catch (pError) {
            this.log.warn(`SavedQueries persist failed: ${pError && pError.message ? pError.message : pError}`);
          }
        }
      }
      module.exports = PictProviderDataBeaconSavedQueries;
      module.exports.default_configuration = _ProviderConfiguration;
    }, {
      "pict-provider": 7
    }],
    27: [function (require, module, exports) {
      /**
       * Retold DataBeacon — Theme CSS
       *
       * Defines the CSS custom-property palette for every (theme x mode) combo.
       * Component styles in databeacon.css reference the variables defined here,
       * so swapping the body[data-theme][data-mode-effective] attributes re-tints
       * the entire UI instantly.
       *
       * Variables every theme must define:
       *   --bg-primary, --bg-secondary, --bg-card, --bg-input
       *   --text-primary, --text-secondary, --text-muted, --text-on-accent
       *   --accent-primary, --accent-primary-hover
       *   --accent-success, --accent-warning, --accent-danger, --accent-info
       *   --border-color
       */
      module.exports = /*css*/`
/* ──────────────────────────────────────────────────────────────────────
 * 1997 — Windows 95 / 98 retro
 * Light: beige / grey / navy / maroon
 * Dark : indigo-grey / sky / coral / cream
 * ────────────────────────────────────────────────────────────────────── */

body[data-theme="nineteen-97"][data-mode-effective="light"]
{
	--bg-primary: #ece9d8;
	--bg-secondary: #d8d3b8;
	--bg-card: #fffbf0;
	--bg-input: #ffffff;
	--text-primary: #1a1a1a;
	--text-secondary: #4a4a4a;
	--text-muted: #7a7a7a;
	--text-on-accent: #ffffff;
	--accent-primary: #000080;
	--accent-primary-hover: #0000cc;
	--accent-success: #008000;
	--accent-warning: #808000;
	--accent-danger: #800000;
	--accent-info: #000080;
	--border-color: #808080;
}

body[data-theme="nineteen-97"][data-mode-effective="dark"]
{
	--bg-primary: #1e1e2e;
	--bg-secondary: #26263a;
	--bg-card: #2a2a3a;
	--bg-input: #343450;
	--text-primary: #ece9d8;
	--text-secondary: #b8b6a8;
	--text-muted: #7e7c70;
	--text-on-accent: #1a1a1a;
	--accent-primary: #80a0ff;
	--accent-primary-hover: #a0b8ff;
	--accent-success: #80ff80;
	--accent-warning: #ffcc00;
	--accent-danger: #ff8080;
	--accent-info: #80c0ff;
	--border-color: #4e4e68;
}

/* ──────────────────────────────────────────────────────────────────────
 * Mac Classic — Mac OS 8 / 9 Platinum
 * ────────────────────────────────────────────────────────────────────── */

body[data-theme="mac-classic"][data-mode-effective="light"]
{
	--bg-primary: #dddddd;
	--bg-secondary: #cccccc;
	--bg-card: #f0f0f0;
	--bg-input: #ffffff;
	--text-primary: #000000;
	--text-secondary: #444444;
	--text-muted: #777777;
	--text-on-accent: #ffffff;
	--accent-primary: #4080ff;
	--accent-primary-hover: #60a0ff;
	--accent-success: #339933;
	--accent-warning: #cc6600;
	--accent-danger: #cc0000;
	--accent-info: #4080ff;
	--border-color: #999999;
}

body[data-theme="mac-classic"][data-mode-effective="dark"]
{
	--bg-primary: #202020;
	--bg-secondary: #2a2a2a;
	--bg-card: #2e2e2e;
	--bg-input: #3a3a3a;
	--text-primary: #dddddd;
	--text-secondary: #b0b0b0;
	--text-muted: #777777;
	--text-on-accent: #0a0a0a;
	--accent-primary: #60a0ff;
	--accent-primary-hover: #80b8ff;
	--accent-success: #60cc60;
	--accent-warning: #ff9933;
	--accent-danger: #ff4060;
	--accent-info: #60a0ff;
	--border-color: #555555;
}

/* ──────────────────────────────────────────────────────────────────────
 * NeXT — NeXTSTEP stone + purple
 * ────────────────────────────────────────────────────────────────────── */

body[data-theme="next"][data-mode-effective="light"]
{
	--bg-primary: #e8e6dd;
	--bg-secondary: #d6d3c8;
	--bg-card: #f5f3ed;
	--bg-input: #ffffff;
	--text-primary: #1e1a26;
	--text-secondary: #4c465a;
	--text-muted: #7a7488;
	--text-on-accent: #ffffff;
	--accent-primary: #6a3fa0;
	--accent-primary-hover: #8557c0;
	--accent-success: #3a7a3a;
	--accent-warning: #b88a00;
	--accent-danger: #aa2c3a;
	--accent-info: #6a3fa0;
	--border-color: #9a96a6;
}

body[data-theme="next"][data-mode-effective="dark"]
{
	--bg-primary: #1a1420;
	--bg-secondary: #221a2c;
	--bg-card: #251c2e;
	--bg-input: #2f253a;
	--text-primary: #e8e6dd;
	--text-secondary: #b8b4c6;
	--text-muted: #7a7488;
	--text-on-accent: #1a1420;
	--accent-primary: #b090e0;
	--accent-primary-hover: #c8aef0;
	--accent-success: #7acc7a;
	--accent-warning: #ffcf4a;
	--accent-danger: #ff6a80;
	--accent-info: #b090e0;
	--border-color: #5e5468;
}

/* ──────────────────────────────────────────────────────────────────────
 * BeOS — teal + orange
 * ────────────────────────────────────────────────────────────────────── */

body[data-theme="beos"][data-mode-effective="light"]
{
	--bg-primary: #e0e8ec;
	--bg-secondary: #c8d6de;
	--bg-card: #f0f4f6;
	--bg-input: #ffffff;
	--text-primary: #101820;
	--text-secondary: #40525e;
	--text-muted: #6e828e;
	--text-on-accent: #ffffff;
	--accent-primary: #3a7a8a;
	--accent-primary-hover: #4e98aa;
	--accent-success: #2a7a4a;
	--accent-warning: #cc9930;
	--accent-danger: #cc5530;
	--accent-info: #3a7a8a;
	--border-color: #8ba3b0;
}

body[data-theme="beos"][data-mode-effective="dark"]
{
	--bg-primary: #0a1a22;
	--bg-secondary: #102530;
	--bg-card: #142430;
	--bg-input: #1b313f;
	--text-primary: #b0d0e0;
	--text-secondary: #7a98a8;
	--text-muted: #556a78;
	--text-on-accent: #0a1a22;
	--accent-primary: #60b0c0;
	--accent-primary-hover: #80ccdc;
	--accent-success: #4ac06a;
	--accent-warning: #ffc860;
	--accent-danger: #ff8060;
	--accent-info: #60b0c0;
	--border-color: #466070;
}

/* ──────────────────────────────────────────────────────────────────────
 * SGI — Indy / IRIX magenta + cyan
 * ────────────────────────────────────────────────────────────────────── */

body[data-theme="sgi"][data-mode-effective="light"]
{
	--bg-primary: #c8c8c8;
	--bg-secondary: #b8b8b8;
	--bg-card: #dcdcdc;
	--bg-input: #ffffff;
	--text-primary: #202020;
	--text-secondary: #4a4a4a;
	--text-muted: #6e6e6e;
	--text-on-accent: #ffffff;
	--accent-primary: #c82080;
	--accent-primary-hover: #e040a0;
	--accent-success: #208040;
	--accent-warning: #e8a818;
	--accent-danger: #e83018;
	--accent-info: #3080c0;
	--border-color: #808080;
}

body[data-theme="sgi"][data-mode-effective="dark"]
{
	--bg-primary: #1a1a1a;
	--bg-secondary: #232323;
	--bg-card: #252525;
	--bg-input: #2e2e2e;
	--text-primary: #e0e0e0;
	--text-secondary: #a8a8a8;
	--text-muted: #707070;
	--text-on-accent: #0a0a0a;
	--accent-primary: #ff60b0;
	--accent-primary-hover: #ff80c8;
	--accent-success: #50d080;
	--accent-warning: #ffd050;
	--accent-danger: #ff6060;
	--accent-info: #60c0ff;
	--border-color: #505050;
}
`;
    }, {}],
    28: [function (require, module, exports) {
      /**
       * Retold DataBeacon — Theme Provider
       *
       * Owns the palette registry, the (theme, mode) state, and the body
       * data-attributes that drive the CSS variable cascade defined in
       * Pict-Provider-DataBeacon-Theme-CSS.js. Listens to the OS
       * prefers-color-scheme media query so "system" mode stays live.
       *
       * Exposes public methods that the ThemeSwitcher view calls:
       *   getThemes(), getCurrentTheme(), getCurrentMode(), getEffectiveMode(),
       *   setTheme(key), setMode(mode), cycleMode().
       */
      const libPictProvider = require('pict-provider');
      const libThemeCSS = require('./Pict-Provider-DataBeacon-Theme-CSS.js');
      const _ProviderConfiguration = {
        ProviderIdentifier: 'DataBeacon-Theme',
        AutoInitialize: true,
        AutoInitializeOrdinal: -10 // run before everything else so the body attrs are set
      };
      const _StorageKeyTheme = 'databeacon.theme';
      const _StorageKeyMode = 'databeacon.mode';
      const _DefaultThemeKey = 'nineteen-97';
      const _DefaultMode = 'system';
      const _Modes = ['light', 'dark', 'system'];
      const _Themes = [{
        Key: 'nineteen-97',
        Label: '1997',
        EraLabel: 'Windows 95 / 98',
        LightSwatch: ['#ece9d8', '#808080', '#000080', '#800000'],
        DarkSwatch: ['#1e1e2e', '#80a0ff', '#ff8080', '#ece9d8']
      }, {
        Key: 'mac-classic',
        Label: 'Mac Classic',
        EraLabel: 'Mac OS 8 / 9 Platinum',
        LightSwatch: ['#dddddd', '#999999', '#4080ff', '#cc0000'],
        DarkSwatch: ['#202020', '#60a0ff', '#ff4060', '#dddddd']
      }, {
        Key: 'next',
        Label: 'NeXT',
        EraLabel: 'NeXTSTEP',
        LightSwatch: ['#e8e6dd', '#9a96a6', '#6a3fa0', '#aa2c3a'],
        DarkSwatch: ['#1a1420', '#b090e0', '#ff6a80', '#e8e6dd']
      }, {
        Key: 'beos',
        Label: 'BeOS',
        EraLabel: 'BeOS R5',
        LightSwatch: ['#e0e8ec', '#8ba3b0', '#3a7a8a', '#cc5530'],
        DarkSwatch: ['#0a1a22', '#60b0c0', '#ffc860', '#ff8060']
      }, {
        Key: 'sgi',
        Label: 'SGI',
        EraLabel: 'SGI Indy / IRIX',
        LightSwatch: ['#c8c8c8', '#c82080', '#3080c0', '#202020'],
        DarkSwatch: ['#1a1a1a', '#ff60b0', '#60c0ff', '#e0e0e0']
      }];
      class PictProviderDataBeaconTheme extends libPictProvider {
        constructor(pFable, pOptions, pServiceHash) {
          let tmpOptions = Object.assign({}, _ProviderConfiguration, pOptions);
          super(pFable, tmpOptions, pServiceHash);
          this.serviceType = 'PictProviderDataBeaconTheme';
          this._CurrentTheme = _DefaultThemeKey;
          this._CurrentMode = _DefaultMode;
          this._MediaQueryList = null;
          this._MediaQueryHandler = null;
        }
        onAfterInitialize() {
          // Register the palette CSS. Priority 100 is below the default 500
          // so the variable definitions are injected early in the cascade.
          if (this.pict && this.pict.CSSMap && typeof this.pict.CSSMap.addCSS === 'function') {
            this.pict.CSSMap.addCSS('DataBeacon-Themes', libThemeCSS, 100);
          }

          // Restore persisted choice (if any) before any view renders.
          this._CurrentTheme = this._readStorage(_StorageKeyTheme, _DefaultThemeKey);
          this._CurrentMode = this._readStorage(_StorageKeyMode, _DefaultMode);
          if (!this._isValidThemeKey(this._CurrentTheme)) this._CurrentTheme = _DefaultThemeKey;
          if (_Modes.indexOf(this._CurrentMode) === -1) this._CurrentMode = _DefaultMode;

          // Subscribe to OS preference changes so "system" mode stays live.
          if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
            this._MediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
            this._MediaQueryHandler = () => {
              if (this._CurrentMode === 'system') this._applyToDOM();
            };
            if (typeof this._MediaQueryList.addEventListener === 'function') {
              this._MediaQueryList.addEventListener('change', this._MediaQueryHandler);
            } else if (typeof this._MediaQueryList.addListener === 'function') {
              // Safari < 14 fallback.
              this._MediaQueryList.addListener(this._MediaQueryHandler);
            }
          }

          // Expose the theme list to AppData so templates can iterate via {~TS:~}.
          if (!this.pict.AppData.ThemeSwitcher) this.pict.AppData.ThemeSwitcher = {};
          this.pict.AppData.ThemeSwitcher.Themes = this._buildThemeViewData();

          // Paint the body immediately so the first render is already themed.
          this._applyToDOM();
          return super.onAfterInitialize();
        }

        // ================================================================
        // Public accessors
        // ================================================================

        getThemes() {
          return _Themes;
        }
        getCurrentTheme() {
          return this._CurrentTheme;
        }
        getCurrentMode() {
          return this._CurrentMode;
        }
        getEffectiveMode() {
          return this._resolveEffectiveMode();
        }

        // ================================================================
        // Public mutators
        // ================================================================

        setTheme(pKey) {
          if (!this._isValidThemeKey(pKey)) return false;
          this._CurrentTheme = pKey;
          this._writeStorage(_StorageKeyTheme, pKey);
          this.pict.AppData.ThemeSwitcher.Themes = this._buildThemeViewData();
          this._applyToDOM();
          if (this.pict.views.ThemeSwitcher) this.pict.views.ThemeSwitcher.render();
          return true;
        }
        setMode(pMode) {
          if (_Modes.indexOf(pMode) === -1) return false;
          this._CurrentMode = pMode;
          this._writeStorage(_StorageKeyMode, pMode);
          this._applyToDOM();
          if (this.pict.views.ThemeSwitcher) this.pict.views.ThemeSwitcher.render();
          return true;
        }
        cycleMode() {
          let tmpIdx = _Modes.indexOf(this._CurrentMode);
          let tmpNext = _Modes[(tmpIdx + 1) % _Modes.length];
          return this.setMode(tmpNext);
        }

        // ================================================================
        // Internal helpers
        // ================================================================

        _isValidThemeKey(pKey) {
          for (let i = 0; i < _Themes.length; i++) {
            if (_Themes[i].Key === pKey) return true;
          }
          return false;
        }
        _resolveEffectiveMode() {
          if (this._CurrentMode === 'system') {
            if (this._MediaQueryList && typeof this._MediaQueryList.matches === 'boolean') {
              return this._MediaQueryList.matches ? 'dark' : 'light';
            }
            return 'dark';
          }
          return this._CurrentMode;
        }
        _applyToDOM() {
          if (typeof document === 'undefined' || !document.body) return;
          document.body.setAttribute('data-theme', this._CurrentTheme);
          document.body.setAttribute('data-mode-effective', this._resolveEffectiveMode());
          document.body.setAttribute('data-mode', this._CurrentMode);
        }
        _readStorage(pKey, pDefault) {
          try {
            if (typeof localStorage === 'undefined') return pDefault;
            let tmpValue = localStorage.getItem(pKey);
            return tmpValue === null || tmpValue === undefined ? pDefault : tmpValue;
          } catch (pError) {
            return pDefault;
          }
        }
        _writeStorage(pKey, pValue) {
          try {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem(pKey, pValue);
          } catch (pError) {
            // Ignore — quota errors, privacy mode, etc. Theme still applies in-memory.
          }
        }

        /**
         * Build the template-ready theme list. Each entry has:
         *  - Key, Label, EraLabel
         *  - Swatch1..Swatch4 (flat for easy template binding)
         *  - IsCurrent (boolean — view uses TRUE/FALSE conditional)
         *  - SelectedClass (space-appended class name for CSS)
         */
        _buildThemeViewData() {
          let tmpEffectiveMode = this._resolveEffectiveMode();
          let tmpResult = [];
          for (let i = 0; i < _Themes.length; i++) {
            let tmpTheme = _Themes[i];
            let tmpSwatch = tmpEffectiveMode === 'dark' ? tmpTheme.DarkSwatch : tmpTheme.LightSwatch;
            let tmpIsCurrent = tmpTheme.Key === this._CurrentTheme;
            tmpResult.push({
              Key: tmpTheme.Key,
              Label: tmpTheme.Label,
              EraLabel: tmpTheme.EraLabel,
              Swatch1: tmpSwatch[0],
              Swatch2: tmpSwatch[1],
              Swatch3: tmpSwatch[2],
              Swatch4: tmpSwatch[3],
              IsCurrent: tmpIsCurrent,
              SelectedClass: tmpIsCurrent ? 'is-current' : ''
            });
          }
          return tmpResult;
        }
      }
      module.exports = PictProviderDataBeaconTheme;
      module.exports.default_configuration = _ProviderConfiguration;
    }, {
      "./Pict-Provider-DataBeacon-Theme-CSS.js": 27,
      "pict-provider": 7
    }],
    29: [function (require, module, exports) {
      /**
       * Retold DataBeacon — API Provider
       *
       * Calls the DataBeacon REST API, stores results in AppData, and pre-computes
       * render-ready view data (status labels, badge classes, per-row flags, etc.)
       * so the Pict templates can stay declarative. After each API response the
       * appropriate sub-views are re-rendered.
       */
      const libPictProvider = require('pict-view');
      class DataBeaconProvider extends libPictProvider {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
          this.serviceType = 'DataBeaconProvider';
        }
        _apiCall(pMethod, pPath, pBody, fCallback) {
          let tmpOptions = {
            method: pMethod,
            headers: {
              'Content-Type': 'application/json'
            }
          };
          if (pBody && pMethod !== 'GET') {
            tmpOptions.body = JSON.stringify(pBody);
          }
          fetch(pPath, tmpOptions).then(pResponse => pResponse.json()).then(pData => {
            if (fCallback) fCallback(null, pData);
          }).catch(pError => {
            if (fCallback) fCallback(pError);
          });
        }

        // ================================================================
        // Connections
        // ================================================================

        loadConnections(fCallback) {
          this._apiCall('GET', '/beacon/connections', null, (pError, pData) => {
            if (!pError && pData) {
              this.pict.AppData.Connections = this._decorateConnections(pData.Connections || []);
            }
            this._recomputeDashboard();
            this.refreshIntrospectionViewData();
            this.refreshRecordBrowserViewData();
            this._renderConnectionViews();
            this._renderDashboard();
            this._renderIntrospectionViews();
            if (fCallback) fCallback(pError, pData);
          });
        }
        createConnection(pConnectionData, fCallback) {
          this._apiCall('POST', '/beacon/connection', pConnectionData, (pError, pData) => {
            if (!pError && pData && pData.Success) this.loadConnections();
            if (fCallback) fCallback(pError, pData);
          });
        }
        updateConnection(pID, pConnectionData, fCallback) {
          this._apiCall('PUT', `/beacon/connection/${pID}`, pConnectionData, (pError, pData) => {
            if (!pError && pData && pData.Success) this.loadConnections();
            if (fCallback) fCallback(pError, pData);
          });
        }
        deleteConnection(pID, fCallback) {
          this._apiCall('DELETE', `/beacon/connection/${pID}`, null, (pError, pData) => {
            if (!pError && pData && pData.Success) this.loadConnections();
            if (fCallback) fCallback(pError, pData);
          });
        }
        testConnection(pID, fCallback) {
          this._apiCall('POST', `/beacon/connection/${pID}/test`, null, (pError, pData) => {
            this.loadConnections();
            if (fCallback) fCallback(pError, pData);
          });
        }
        connectConnection(pID, fCallback) {
          this._apiCall('POST', `/beacon/connection/${pID}/connect`, null, (pError, pData) => {
            this.loadConnections();
            if (fCallback) fCallback(pError, pData);
          });
        }
        disconnectConnection(pID, fCallback) {
          this._apiCall('POST', `/beacon/connection/${pID}/disconnect`, null, (pError, pData) => {
            this.loadConnections();
            if (fCallback) fCallback(pError, pData);
          });
        }
        loadAvailableTypes(fCallback) {
          this._apiCall('GET', '/beacon/connection/available-types', null, (pError, pData) => {
            if (!pError && pData) {
              this.pict.AppData.AvailableTypes = pData.Types || [];
              this.pict.AppData.AvailableTypesForForm = this._buildAvailableTypesForForm(this.pict.AppData.AvailableTypes);
            }
            if (this.pict.views.ConnectionForm) this.pict.views.ConnectionForm.render();
            if (fCallback) fCallback(pError, pData);
          });
        }

        // ================================================================
        // Introspection
        // ================================================================

        introspect(pConnectionID, fCallback) {
          this._apiCall('POST', `/beacon/connection/${pConnectionID}/introspect`, null, (pError, pData) => {
            if (!pError && pData && pData.Success) {
              this.loadTables(pConnectionID);
            }
            if (fCallback) fCallback(pError, pData);
          });
        }
        loadTables(pConnectionID, fCallback) {
          this._apiCall('GET', `/beacon/connection/${pConnectionID}/tables`, null, (pError, pData) => {
            if (!pError && pData) {
              this.pict.AppData.Tables = pData.Tables || [];
              this.pict.AppData.SelectedConnectionID = pConnectionID;
            }
            this.refreshIntrospectionViewData();
            this._renderIntrospectionViews();
            if (fCallback) fCallback(pError, pData);
          });
        }
        loadTableDetails(pConnectionID, pTableName, fCallback) {
          this._apiCall('GET', `/beacon/connection/${pConnectionID}/table/${pTableName}`, null, (pError, pData) => {
            if (fCallback) fCallback(pError, pData);
          });
        }
        executeQuery(pConnectionID, pSQL, fCallback) {
          this._apiCall('POST', `/beacon/connection/${pConnectionID}/query`, {
            SQL: pSQL
          }, (pError, pData) => {
            if (fCallback) fCallback(pError, pData);
          });
        }

        // ================================================================
        // Endpoints
        // ================================================================

        enableEndpoint(pConnectionID, pTableName, fCallback) {
          this._apiCall('POST', `/beacon/endpoint/${pConnectionID}/${pTableName}/enable`, null, (pError, pData) => {
            this.loadEndpoints();
            this.loadTables(pConnectionID);
            if (fCallback) fCallback(pError, pData);
          });
        }
        disableEndpoint(pConnectionID, pTableName, fCallback) {
          this._apiCall('POST', `/beacon/endpoint/${pConnectionID}/${pTableName}/disable`, null, (pError, pData) => {
            this.loadEndpoints();
            this.loadTables(pConnectionID);
            if (fCallback) fCallback(pError, pData);
          });
        }
        loadEndpoints(fCallback) {
          this._apiCall('GET', '/beacon/endpoints', null, (pError, pData) => {
            if (!pError && pData) {
              this.pict.AppData.Endpoints = this._decorateEndpoints(pData.Endpoints || []);
            }
            this._recomputeDashboard();
            this.refreshRecordBrowserViewData();
            if (this.pict.views.Endpoints) this.pict.views.Endpoints.render();
            this._renderDashboard();
            if (this.pict.views.RecordBrowser) this.pict.views.RecordBrowser.render();
            if (fCallback) fCallback(pError, pData);
          });
        }

        // ================================================================
        // Records
        // ================================================================

        loadRecords(pTableName, pStart, pCap, fCallback) {
          let tmpStart = this._toNonNegativeInt(pStart, 0);
          let tmpCap = this._toPositiveInt(pCap, 50);

          // Track the fetch intent so the view-data computation can decide the
          // Prev/Next state + range label even if the response is empty.
          if (!this.pict.AppData.RecordBrowser) this.pict.AppData.RecordBrowser = {};
          this.pict.AppData.RecordBrowser.CursorStart = tmpStart;
          this.pict.AppData.RecordBrowser.PageSize = tmpCap;
          this._apiCall('GET', `/1.0/${pTableName}s/${tmpStart}/${tmpCap}`, null, (pError, pData) => {
            if (!pError && pData) {
              this.pict.AppData.Records = Array.isArray(pData) ? pData : pData.Records || [];
              this.pict.AppData.SelectedTableName = pTableName;
            }
            this.refreshRecordBrowserViewData();
            if (this.pict.views.RecordBrowser) this.pict.views.RecordBrowser.render();
            if (fCallback) fCallback(pError, pData);
          });
        }
        _toNonNegativeInt(pValue, pDefault) {
          let tmpN = parseInt(pValue, 10);
          if (isNaN(tmpN) || tmpN < 0) return pDefault;
          return tmpN;
        }
        _toPositiveInt(pValue, pDefault) {
          let tmpN = parseInt(pValue, 10);
          if (isNaN(tmpN) || tmpN < 1) return pDefault;
          return tmpN;
        }

        // ================================================================
        // Beacon
        // ================================================================

        connectBeacon(pConfig, fCallback) {
          this._apiCall('POST', '/beacon/ultravisor/connect', pConfig, (pError, pData) => {
            this.loadBeaconStatus();
            if (fCallback) fCallback(pError, pData);
          });
        }
        disconnectBeacon(fCallback) {
          this._apiCall('POST', '/beacon/ultravisor/disconnect', null, (pError, pData) => {
            this.loadBeaconStatus();
            if (fCallback) fCallback(pError, pData);
          });
        }
        loadBeaconStatus(fCallback) {
          this._apiCall('GET', '/beacon/ultravisor/status', null, (pError, pData) => {
            if (!pError && pData) this.pict.AppData.BeaconStatus = pData;
            this._recomputeDashboard();
            this._renderDashboard();
            if (fCallback) fCallback(pError, pData);
          });
        }

        // ================================================================
        // View data computation (public helpers + internal)
        // ================================================================

        /**
         * Recompute AppData.Introspection based on current Connections/Tables.
         * Auto-selects the sole connected database when nothing is selected.
         * Safe to call repeatedly and in response to any data change.
         */
        refreshIntrospectionViewData() {
          let tmpConns = this.pict.AppData.Connections || [];
          let tmpTables = this.pict.AppData.Tables || [];
          let tmpCID = this.pict.AppData.SelectedConnectionID;

          // Connected-only list for the picker.
          let tmpConnectedList = [];
          for (let i = 0; i < tmpConns.length; i++) {
            if (tmpConns[i].Connected) tmpConnectedList.push(tmpConns[i]);
          }

          // Auto-select sole connection.
          if (!tmpCID && tmpConnectedList.length === 1) {
            tmpCID = tmpConnectedList[0].IDBeaconConnection;
            this.pict.AppData.SelectedConnectionID = tmpCID;
          }

          // Decorate connection list with SelectedAttr for the dropdown.
          let tmpListForTemplate = [];
          for (let i = 0; i < tmpConnectedList.length; i++) {
            let tmpConn = tmpConnectedList[i];
            tmpListForTemplate.push({
              IDBeaconConnection: tmpConn.IDBeaconConnection,
              Name: tmpConn.Name,
              Type: tmpConn.Type,
              SelectedAttr: tmpConn.IDBeaconConnection === tmpCID ? 'selected' : ''
            });
          }
          let tmpSelectedConn = null;
          for (let i = 0; i < tmpConns.length; i++) {
            if (tmpConns[i].IDBeaconConnection === tmpCID) {
              tmpSelectedConn = tmpConns[i];
              break;
            }
          }
          let tmpBanner = null;
          if (tmpSelectedConn) {
            tmpBanner = {
              Name: tmpSelectedConn.Name,
              Type: tmpSelectedConn.Type,
              StatusLabel: tmpSelectedConn.StatusLabel,
              StatusBadgeClass: tmpSelectedConn.StatusBadgeClass,
              Description: tmpSelectedConn.Description || '',
              HasDescription: !!tmpSelectedConn.Description
            };
          }

          // Table rows view shape.
          let tmpTablesView = [];
          for (let i = 0; i < tmpTables.length; i++) {
            let tmpTable = tmpTables[i];
            tmpTablesView.push({
              ConnectionID: tmpCID,
              TableName: tmpTable.TableName,
              ColumnCount: tmpTable.ColumnCount,
              RowCountDisplay: tmpTable.RowCountEstimate === null || tmpTable.RowCountEstimate === undefined ? '--' : tmpTable.RowCountEstimate,
              EndpointsEnabled: !!tmpTable.EndpointsEnabled
            });
          }
          let tmpState;
          if (tmpConnectedList.length === 0) tmpState = 'NoConnections';else if (!tmpCID) tmpState = 'NoSelection';else if (tmpTablesView.length === 0) tmpState = 'Empty';else tmpState = 'HasTables';
          let tmpTablesHeader = null;
          if (tmpState === 'HasTables' && tmpSelectedConn) {
            let tmpCount = tmpTablesView.length;
            tmpTablesHeader = {
              ConnectionName: tmpSelectedConn.Name,
              Subline: `${tmpSelectedConn.Type} \u00B7 ${tmpCount} table${tmpCount !== 1 ? 's' : ''} discovered`
            };
          }
          let tmpShowPlaceholder = tmpConnectedList.length !== 1 || !tmpCID;
          this.pict.AppData.Introspection = {
            ConnectedList: tmpListForTemplate,
            ShowPlaceholder: tmpShowPlaceholder,
            HasSelection: !!tmpSelectedConn,
            SelectedBanner: tmpBanner,
            RunDisabled: !tmpCID,
            AllDisabled: tmpConnectedList.length === 0,
            State: tmpState,
            TablesView: tmpTablesView,
            TablesHeader: tmpTablesHeader,
            DetailModalColumns: this.pict.AppData.Introspection && this.pict.AppData.Introspection.DetailModalColumns || []
          };
        }

        /**
         * Recompute AppData.RecordBrowser based on current Endpoints/Records
         * and the persisted CursorStart / PageSize. Preserves the caller's
         * cursor/size preferences across fetches.
         */
        refreshRecordBrowserViewData() {
          let tmpEndpoints = this.pict.AppData.Endpoints || [];
          let tmpRecords = this.pict.AppData.Records || [];
          let tmpSelectedTable = this.pict.AppData.SelectedTableName || '';
          let tmpPrev = this.pict.AppData.RecordBrowser || {};
          let tmpCursorStart = this._toNonNegativeInt(tmpPrev.CursorStart, 0);
          let tmpPageSize = this._toPositiveInt(tmpPrev.PageSize, 50);
          let tmpTableOptions = [];
          for (let i = 0; i < tmpEndpoints.length; i++) {
            tmpTableOptions.push({
              TableName: tmpEndpoints[i].TableName,
              SelectedAttr: tmpEndpoints[i].TableName === tmpSelectedTable ? 'selected' : ''
            });
          }
          let tmpPageSizeOptions = this._buildPageSizeOptions(tmpPageSize);
          let tmpState;
          let tmpColumnList = [];
          let tmpRows = [];
          let tmpFetched = tmpRecords.length;
          if (!tmpSelectedTable) tmpState = 'NoSelection';else if (tmpFetched === 0) tmpState = 'Empty';else {
            tmpState = 'HasRows';
            let tmpColumnNames = Object.keys(tmpRecords[0] || {});
            for (let c = 0; c < tmpColumnNames.length; c++) tmpColumnList.push({
              Name: tmpColumnNames[c]
            });
            for (let r = 0; r < tmpFetched; r++) {
              let tmpCells = [];
              for (let c = 0; c < tmpColumnNames.length; c++) {
                tmpCells.push({
                  CellHTML: this._formatCellValue(tmpRecords[r][tmpColumnNames[c]])
                });
              }
              tmpRows.push({
                Cells: tmpCells
              });
            }
          }
          let tmpPrevDisabled = !tmpSelectedTable || tmpCursorStart === 0;
          // "Probably more pages" when the server returned a full page. An
          // exactly-full last page over-counts by one page and shows an empty
          // Next; that's an acceptable trade for not needing a COUNT(*) call.
          let tmpNextDisabled = !tmpSelectedTable || tmpFetched < tmpPageSize;
          let tmpRangeLabel;
          if (!tmpSelectedTable) tmpRangeLabel = '';else if (tmpFetched === 0) tmpRangeLabel = `No records at start ${tmpCursorStart}.`;else tmpRangeLabel = `Showing records ${tmpCursorStart + 1}–${tmpCursorStart + tmpFetched} · Page size ${tmpPageSize}`;
          this.pict.AppData.RecordBrowser = {
            TableOptions: tmpTableOptions,
            PageSizeOptions: tmpPageSizeOptions,
            SelectedTableName: tmpSelectedTable,
            TableName: tmpSelectedTable,
            CursorStart: tmpCursorStart,
            PageSize: tmpPageSize,
            PrevDisabled: tmpPrevDisabled,
            NextDisabled: tmpNextDisabled,
            LoadDisabled: !tmpSelectedTable,
            RangeLabel: tmpRangeLabel,
            State: tmpState,
            ColumnList: tmpColumnList,
            Rows: tmpRows
          };
        }
        _buildPageSizeOptions(pCurrent) {
          let tmpChoices = [10, 25, 50, 100, 200, 500];
          if (tmpChoices.indexOf(pCurrent) === -1) tmpChoices.push(pCurrent);
          tmpChoices.sort((a, b) => a - b);
          let tmpResult = [];
          for (let i = 0; i < tmpChoices.length; i++) {
            tmpResult.push({
              Value: tmpChoices[i],
              SelectedAttr: tmpChoices[i] === pCurrent ? 'selected' : ''
            });
          }
          return tmpResult;
        }

        /**
         * Build a view-ready AppData.QueryPanel structure from raw rows returned
         * by executeQuery(). Called by the QueryPanel view after a successful
         * response.
         * @param {Array<Object>} pRows
         * @returns {Object}
         */
        buildQueryResultViewData(pRows) {
          let tmpColumnList = [];
          let tmpRowList = [];
          let tmpColumnNames = pRows && pRows.length > 0 ? Object.keys(pRows[0]) : [];
          for (let c = 0; c < tmpColumnNames.length; c++) tmpColumnList.push({
            Name: tmpColumnNames[c]
          });
          let tmpLimit = Math.min(pRows.length, 100);
          for (let r = 0; r < tmpLimit; r++) {
            let tmpCells = [];
            for (let c = 0; c < tmpColumnNames.length; c++) {
              tmpCells.push({
                CellHTML: this._formatCellValue(pRows[r][tmpColumnNames[c]])
              });
            }
            tmpRowList.push({
              Cells: tmpCells
            });
          }
          return {
            ColumnList: tmpColumnList,
            Rows: tmpRowList,
            // RawRows keeps the unformatted response so the export provider
            // can serialize to JSON/CSV/TSV without having to reverse the
            // cell-HTML formatting. Limited to the same display window the
            // user actually sees.
            RawRows: pRows.slice(0, tmpLimit),
            DisplayCount: tmpLimit,
            TotalCount: pRows.length,
            IsTruncated: pRows.length > 100
          };
        }

        /**
         * HTML-escape a string. Exposed so views can safely interpolate error
         * messages into error banners.
         * @param {string} pValue
         * @returns {string}
         */
        escapeHTML(pValue) {
          let tmpStr = pValue === null || pValue === undefined ? '' : String(pValue);
          return tmpStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        // ================================================================
        // Private decorators
        // ================================================================

        _decorateConnections(pConnections) {
          let tmpResult = [];
          for (let i = 0; i < pConnections.length; i++) {
            let tmpConn = pConnections[i];
            let tmpIsConnected = !!tmpConn.Connected;
            let tmpStatusLabel;
            let tmpStatusBadgeClass;
            if (tmpIsConnected) {
              tmpStatusLabel = 'Connected';
              tmpStatusBadgeClass = 'badge-success';
            } else if (tmpConn.Status === 'OK') {
              tmpStatusLabel = 'OK';
              tmpStatusBadgeClass = 'badge-info';
            } else if (tmpConn.Status === 'Failed') {
              tmpStatusLabel = 'Failed';
              tmpStatusBadgeClass = 'badge-error';
            } else {
              tmpStatusLabel = tmpConn.Status || 'Unknown';
              tmpStatusBadgeClass = 'badge-neutral';
            }
            tmpResult.push(Object.assign({}, tmpConn, {
              Connected: tmpIsConnected,
              StatusLabel: tmpStatusLabel,
              StatusBadgeClass: tmpStatusBadgeClass,
              Description: tmpConn.Description || ''
            }));
          }
          return tmpResult;
        }
        _decorateEndpoints(pEndpoints) {
          let tmpResult = [];
          for (let i = 0; i < pEndpoints.length; i++) {
            let tmpEP = pEndpoints[i];
            let tmpBase = tmpEP.EndpointBase || '';
            tmpResult.push(Object.assign({}, tmpEP, {
              EndpointAPIURL: `${tmpBase}s/0/50`
            }));
          }
          return tmpResult;
        }
        _buildAvailableTypesForForm(pTypes) {
          let tmpInstalled = [];
          for (let i = 0; i < pTypes.length; i++) {
            if (pTypes[i].Installed) tmpInstalled.push({
              Type: pTypes[i].Type
            });
          }
          if (tmpInstalled.length === 0) {
            tmpInstalled = [{
              Type: 'MySQL'
            }, {
              Type: 'PostgreSQL'
            }, {
              Type: 'MSSQL'
            }, {
              Type: 'SQLite'
            }];
          }
          return tmpInstalled;
        }
        _recomputeDashboard() {
          let tmpConns = this.pict.AppData.Connections || [];
          let tmpEndpoints = this.pict.AppData.Endpoints || [];
          let tmpBeaconStatus = this.pict.AppData.BeaconStatus || {};
          let tmpActive = 0;
          let tmpSummary = [];
          for (let i = 0; i < tmpConns.length; i++) {
            if (tmpConns[i].Connected) tmpActive++;
            tmpSummary.push({
              Name: tmpConns[i].Name,
              Type: tmpConns[i].Type,
              StatusLabel: tmpConns[i].StatusLabel,
              StatusBadgeClass: tmpConns[i].StatusBadgeClass,
              Description: tmpConns[i].Description
            });
          }
          this.pict.AppData.Dashboard = {
            TotalConnections: tmpConns.length,
            ActiveConnections: tmpActive,
            TotalEndpoints: tmpEndpoints.length,
            BeaconStatusLabel: tmpBeaconStatus.Connected ? 'Connected' : 'Not Connected',
            BeaconBadgeClass: tmpBeaconStatus.Connected ? 'badge-success' : 'badge-neutral',
            BeaconName: tmpBeaconStatus.BeaconName || 'retold-databeacon',
            ConnectionSummary: tmpSummary
          };
        }
        _formatCellValue(pValue) {
          if (pValue === null || pValue === undefined) {
            return '<span class="null-value">NULL</span>';
          }
          if (typeof pValue === 'object') {
            let tmpText = JSON.stringify(pValue);
            if (tmpText.length > 80) tmpText = tmpText.substring(0, 80) + '...';
            return `<code>${this.escapeHTML(tmpText)}</code>`;
          }
          let tmpStr = String(pValue);
          if (tmpStr.length > 100) tmpStr = tmpStr.substring(0, 100) + '...';
          return this.escapeHTML(tmpStr);
        }
        _renderConnectionViews() {
          if (this.pict.views.ConnectionList) this.pict.views.ConnectionList.render();
        }
        _renderDashboard() {
          if (this.pict.views.Dashboard) this.pict.views.Dashboard.render();
        }
        _renderIntrospectionViews() {
          if (this.pict.views.IntrospectionControls) this.pict.views.IntrospectionControls.render();
          if (this.pict.views.IntrospectionTables) this.pict.views.IntrospectionTables.render();
        }
      }
      module.exports = DataBeaconProvider;
      module.exports.default_configuration = {
        ProviderIdentifier: 'DataBeaconProvider',
        AutoInitialize: true,
        AutoRender: false
      };
    }, {
      "pict-view": 21
    }],
    30: [function (require, module, exports) {
      /**
       * DataBeacon ConnectionForm View
       *
       * Renders the "Add Connection" form. Iterates over AppData.AvailableTypesForForm
       * (computed by the provider from loadAvailableTypes) for the Type dropdown.
       * On submit, reads inputs via ContentAssignment and delegates to the provider.
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'ConnectionForm',
        DefaultRenderable: 'DataBeacon-ConnectionForm',
        DefaultDestinationAddress: '#DataBeacon-ConnectionForm-Slot',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-ConnectionForm-Template',
          Template: /*html*/`
<div id="DataBeacon-ConnectionForm-Root" class="section">
	<h2>Add Connection</h2>
	<div class="form-grid">
		<div class="form-group"><label>Name</label><input type="text" id="databeacon-connform-name" placeholder="My Database" /></div>
		<div class="form-group">
			<label>Type</label>
			<select id="databeacon-connform-type">{~TS:DataBeacon-ConnectionForm-TypeOption:AppData.AvailableTypesForForm~}</select>
		</div>
		<div class="form-group"><label>Host</label><input type="text" id="databeacon-connform-host" placeholder="localhost" /></div>
		<div class="form-group"><label>Port</label><input type="number" id="databeacon-connform-port" placeholder="3306" /></div>
		<div class="form-group"><label>Database</label><input type="text" id="databeacon-connform-database" placeholder="mydb" /></div>
		<div class="form-group"><label>Username</label><input type="text" id="databeacon-connform-user" placeholder="root" /></div>
		<div class="form-group"><label>Password</label><input type="password" id="databeacon-connform-password" /></div>
		<div class="form-group"><label>Description</label><input type="text" id="databeacon-connform-description" /></div>
		<div class="form-group checkbox-group"><label><input type="checkbox" id="databeacon-connform-autoconnect" /> Auto-connect on startup</label></div>
	</div>
	<div class="button-row">
		<button class="btn btn-primary" data-databeacon-action="create-connection">
			<span data-databeacon-icon="plus" data-icon-size="16"></span>
			Add Connection
		</button>
	</div>
</div>`
        }, {
          Hash: 'DataBeacon-ConnectionForm-TypeOption',
          Template: `<option value="{~D:Record.Type~}">{~D:Record.Type~}</option>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-ConnectionForm',
          TemplateHash: 'DataBeacon-ConnectionForm-Template',
          ContentDestinationAddress: '#DataBeacon-ConnectionForm-Slot',
          RenderMethod: 'replace'
        }]
      };
      class PictViewDataBeaconConnectionForm extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          let tmpIcons = this.pict.providers['DataBeacon-Icons'];
          if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-ConnectionForm-Root');
          let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-ConnectionForm-Root');
          if (tmpRootList && tmpRootList.length > 0) {
            tmpRootList[0].addEventListener('click', pEvent => {
              let tmpBtn = pEvent.target.closest('[data-databeacon-action]');
              if (!tmpBtn) return;
              this._handleAction(tmpBtn.getAttribute('data-databeacon-action'));
            });
          }
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
        _handleAction(pAction) {
          if (pAction === 'create-connection') this._createConnection();
        }
        _readValue(pSelector) {
          let tmpList = this.pict.ContentAssignment.getElement(pSelector);
          if (!tmpList || tmpList.length === 0) return '';
          return tmpList[0].value;
        }
        _readChecked(pSelector) {
          let tmpList = this.pict.ContentAssignment.getElement(pSelector);
          if (!tmpList || tmpList.length === 0) return false;
          return !!tmpList[0].checked;
        }
        _createConnection() {
          let tmpType = this._readValue('#databeacon-connform-type');
          let tmpName = this._readValue('#databeacon-connform-name') || 'Untitled';
          let tmpDescription = this._readValue('#databeacon-connform-description');
          let tmpAutoConnect = this._readChecked('#databeacon-connform-autoconnect');
          let tmpConfig;
          if (tmpType === 'SQLite') {
            tmpConfig = {
              SQLiteFilePath: this._readValue('#databeacon-connform-database')
            };
          } else {
            let tmpPort = parseInt(this._readValue('#databeacon-connform-port'), 10);
            tmpConfig = {
              host: this._readValue('#databeacon-connform-host') || 'localhost',
              port: isNaN(tmpPort) ? undefined : tmpPort,
              database: this._readValue('#databeacon-connform-database'),
              user: this._readValue('#databeacon-connform-user'),
              password: this._readValue('#databeacon-connform-password')
            };
          }
          this.pict.providers.DataBeaconProvider.createConnection({
            Name: tmpName,
            Type: tmpType,
            Config: tmpConfig,
            AutoConnect: tmpAutoConnect,
            Description: tmpDescription
          });
        }
      }
      module.exports = PictViewDataBeaconConnectionForm;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    31: [function (require, module, exports) {
      /**
       * DataBeacon ConnectionList View
       *
       * Renders saved connections as a table with per-row actions. The provider
       * pre-computes per-row display flags (StatusLabel, StatusBadgeClass, etc.)
       * into AppData.Connections so this template stays declarative.
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'ConnectionList',
        DefaultRenderable: 'DataBeacon-ConnectionList',
        DefaultDestinationAddress: '#DataBeacon-ConnectionList-Slot',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-ConnectionList-Template',
          Template: /*html*/`
<div id="DataBeacon-ConnectionList-Root" class="section">
	<h2>Saved Connections ({~D:AppData.Connections.length:0~})</h2>
	{~TemplateIfAbsolute:DataBeacon-ConnectionList-Empty:AppData.Connections:AppData.Connections.length^==^0~}
	{~TemplateIfAbsolute:DataBeacon-ConnectionList-Table:AppData.Connections:AppData.Connections.length^>^0~}
</div>`
        }, {
          Hash: 'DataBeacon-ConnectionList-Empty',
          Template: `<p class="empty-state">No connections yet.</p>`
        }, {
          Hash: 'DataBeacon-ConnectionList-Table',
          Template: /*html*/`
<table class="data-table">
	<thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Description</th><th>Actions</th></tr></thead>
	<tbody>{~TS:DataBeacon-ConnectionList-Row:AppData.Connections~}</tbody>
</table>`
        }, {
          Hash: 'DataBeacon-ConnectionList-Row',
          Template: /*html*/`
<tr>
	<td><strong>{~D:Record.Name~}</strong></td>
	<td>{~D:Record.Type~}</td>
	<td><span class="badge {~D:Record.StatusBadgeClass~}">{~D:Record.StatusLabel~}</span></td>
	<td>{~D:Record.Description~}</td>
	<td class="actions-cell">
		{~TIf:DataBeacon-ConnectionList-Row-ConnectedActions::Record.Connected^TRUE^x~}
		{~TIf:DataBeacon-ConnectionList-Row-DisconnectedActions::Record.Connected^FALSE^x~}
		<button class="btn btn-small btn-danger" data-databeacon-action="delete" data-connection-id="{~D:Record.IDBeaconConnection~}">
			<span data-databeacon-icon="trash" data-icon-size="14"></span> Delete
		</button>
	</td>
</tr>`
        }, {
          Hash: 'DataBeacon-ConnectionList-Row-ConnectedActions',
          Template: /*html*/`
<button class="btn btn-small btn-secondary" data-databeacon-action="introspect" data-connection-id="{~D:Record.IDBeaconConnection~}">
	<span data-databeacon-icon="introspection" data-icon-size="14"></span> Introspect
</button>
<button class="btn btn-small btn-warning" data-databeacon-action="disconnect" data-connection-id="{~D:Record.IDBeaconConnection~}">
	<span data-databeacon-icon="disconnect" data-icon-size="14"></span> Disconnect
</button>`
        }, {
          Hash: 'DataBeacon-ConnectionList-Row-DisconnectedActions',
          Template: /*html*/`
<button class="btn btn-small btn-primary" data-databeacon-action="connect" data-connection-id="{~D:Record.IDBeaconConnection~}">
	<span data-databeacon-icon="connect" data-icon-size="14"></span> Connect
</button>
<button class="btn btn-small btn-secondary" data-databeacon-action="test" data-connection-id="{~D:Record.IDBeaconConnection~}">
	<span data-databeacon-icon="test" data-icon-size="14"></span> Test
</button>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-ConnectionList',
          TemplateHash: 'DataBeacon-ConnectionList-Template',
          ContentDestinationAddress: '#DataBeacon-ConnectionList-Slot',
          RenderMethod: 'replace'
        }]
      };
      class PictViewDataBeaconConnectionList extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          let tmpIcons = this.pict.providers['DataBeacon-Icons'];
          if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-ConnectionList-Root');
          let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-ConnectionList-Root');
          if (tmpRootList && tmpRootList.length > 0) {
            tmpRootList[0].addEventListener('click', pEvent => {
              let tmpBtn = pEvent.target.closest('[data-databeacon-action]');
              if (!tmpBtn) return;
              this._handleAction(tmpBtn.getAttribute('data-databeacon-action'), tmpBtn.dataset);
            });
          }
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
        _handleAction(pAction, pData) {
          let tmpID = parseInt(pData.connectionId, 10);
          if (isNaN(tmpID)) return;
          let tmpProvider = this.pict.providers.DataBeaconProvider;
          let tmpModal = this.pict.views.PictSectionModal;
          switch (pAction) {
            case 'test':
              tmpProvider.testConnection(tmpID, (pError, pData) => {
                if (pData && pData.Success) {
                  tmpModal.toast('Connection test succeeded.', {
                    type: 'success'
                  });
                } else {
                  tmpModal.toast('Connection test failed: ' + (pData ? pData.Error : 'Unknown error'), {
                    type: 'error'
                  });
                }
              });
              break;
            case 'connect':
              tmpProvider.connectConnection(tmpID);
              break;
            case 'disconnect':
              tmpProvider.disconnectConnection(tmpID);
              break;
            case 'delete':
              tmpModal.confirm('Are you sure you want to delete this connection?', {
                title: 'Delete Connection',
                confirmLabel: 'Delete',
                cancelLabel: 'Cancel',
                dangerous: true
              }).then(pConfirmed => {
                if (pConfirmed) tmpProvider.deleteConnection(tmpID);
              });
              break;
            case 'introspect':
              tmpProvider.introspect(tmpID, (pError, pData) => {
                if (pData && pData.Success) {
                  this.pict.AppData.SelectedConnectionID = tmpID;
                  if (this.pict.views.Layout) this.pict.views.Layout.setActiveView('Introspection');
                } else {
                  tmpModal.toast('Introspection failed: ' + (pData ? pData.Error : 'Unknown error'), {
                    type: 'error'
                  });
                }
              });
              break;
          }
        }
      }
      module.exports = PictViewDataBeaconConnectionList;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    32: [function (require, module, exports) {
      /**
       * DataBeacon Connections Page (container view)
       *
       * Thin container: renders two slot divs, then cascades a render call to
       * the ConnectionForm and ConnectionList sub-views. New sections for the
       * Connections screen can be added as additional sub-views without touching
       * this file or growing it.
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'Connections',
        DefaultRenderable: 'DataBeacon-ConnectionsPage',
        DefaultDestinationAddress: '#DataBeacon-View-Connections',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-ConnectionsPage-Template',
          Template: /*html*/`
<div class="connections-view">
	<h1>Database Connections</h1>
	<div id="DataBeacon-ConnectionForm-Slot"></div>
	<div id="DataBeacon-ConnectionList-Slot"></div>
</div>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-ConnectionsPage',
          TemplateHash: 'DataBeacon-ConnectionsPage-Template',
          ContentDestinationAddress: '#DataBeacon-View-Connections',
          RenderMethod: 'replace'
        }]
      };
      class PictViewDataBeaconConnections extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          if (this.pict.views.ConnectionForm) this.pict.views.ConnectionForm.render();
          if (this.pict.views.ConnectionList) this.pict.views.ConnectionList.render();
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
      }
      module.exports = PictViewDataBeaconConnections;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    33: [function (require, module, exports) {
      /**
       * DataBeacon Dashboard View
       *
       * Overview screen: stats cards (connection counts, endpoint count, beacon
       * status), a quick-actions block, and a summary table of all connections.
       * All HTML is declarative; per-row fields are pre-computed by the
       * DataBeacon provider into AppData.Dashboard.*.
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'Dashboard',
        DefaultRenderable: 'DataBeacon-Dashboard',
        DefaultDestinationAddress: '#DataBeacon-View-Dashboard',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-Dashboard-Template',
          Template: /*html*/`
<div id="DataBeacon-Dashboard-Root" class="dashboard-view">
	<h1>DataBeacon Dashboard</h1>

	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-value">{~D:AppData.Dashboard.TotalConnections:0~}</div>
			<div class="stat-label">Database Connections</div>
			<div class="stat-detail">{~D:AppData.Dashboard.ActiveConnections:0~} active</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{~D:AppData.Dashboard.TotalEndpoints:0~}</div>
			<div class="stat-label">Active Endpoints</div>
			<div class="stat-detail">REST API routes</div>
		</div>
		<div class="stat-card">
			<div class="stat-value"><span class="badge {~D:AppData.Dashboard.BeaconBadgeClass~}">{~D:AppData.Dashboard.BeaconStatusLabel~}</span></div>
			<div class="stat-label">Ultravisor Beacon</div>
			<div class="stat-detail">{~D:AppData.Dashboard.BeaconName:retold-databeacon~}</div>
		</div>
	</div>

	<div class="section">
		<h2>Quick Actions</h2>
		<div class="button-row">
			<button class="btn btn-primary" data-databeacon-action="navigate" data-view="Connections">
				<span data-databeacon-icon="connections" data-icon-size="16"></span>
				Manage Connections
			</button>
			<button class="btn btn-secondary" data-databeacon-action="navigate" data-view="Endpoints">
				<span data-databeacon-icon="endpoints" data-icon-size="16"></span>
				View Endpoints
			</button>
		</div>
	</div>

	{~TemplateIfAbsolute:DataBeacon-Dashboard-ConnectionSummary-Table:AppData.Dashboard:AppData.Dashboard.TotalConnections^>^0~}
</div>`
        }, {
          Hash: 'DataBeacon-Dashboard-ConnectionSummary-Table',
          Template: /*html*/`
<div class="section">
	<h2>Connections</h2>
	<table class="data-table">
		<thead><tr><th>Name</th><th>Type</th><th>Status</th></tr></thead>
		<tbody>{~TS:DataBeacon-Dashboard-ConnectionSummary-Row:AppData.Dashboard.ConnectionSummary~}</tbody>
	</table>
</div>`
        }, {
          Hash: 'DataBeacon-Dashboard-ConnectionSummary-Row',
          Template: /*html*/`
<tr>
	<td>{~D:Record.Name~}</td>
	<td>{~D:Record.Type~}</td>
	<td><span class="badge {~D:Record.StatusBadgeClass~}">{~D:Record.StatusLabel~}</span></td>
</tr>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-Dashboard',
          TemplateHash: 'DataBeacon-Dashboard-Template',
          ContentDestinationAddress: '#DataBeacon-View-Dashboard',
          RenderMethod: 'replace'
        }]
      };
      class PictViewDataBeaconDashboard extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          let tmpIcons = this.pict.providers['DataBeacon-Icons'];
          if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-View-Dashboard');
          let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-Dashboard-Root');
          if (tmpRootList && tmpRootList.length > 0) {
            // A fresh DOM node is produced on every render, so we always attach.
            tmpRootList[0].addEventListener('click', pEvent => {
              let tmpBtn = pEvent.target.closest('[data-databeacon-action]');
              if (!tmpBtn) return;
              this._handleAction(tmpBtn.getAttribute('data-databeacon-action'), tmpBtn.dataset);
            });
          }
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
        _handleAction(pAction, pData) {
          if (pAction === 'navigate' && pData.view && this.pict.views.Layout) {
            this.pict.views.Layout.setActiveView(pData.view);
          }
        }
      }
      module.exports = PictViewDataBeaconDashboard;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    34: [function (require, module, exports) {
      /**
       * DataBeacon Endpoints View
       *
       * Lists active REST endpoints with Browse / API / Refresh actions. The
       * provider pre-computes each endpoint's API URL (EndpointAPIURL) so the
       * template can emit `data-api-url` without JS concatenation.
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'Endpoints',
        DefaultRenderable: 'DataBeacon-Endpoints',
        DefaultDestinationAddress: '#DataBeacon-View-Endpoints',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-Endpoints-Template',
          Template: /*html*/`
<div id="DataBeacon-Endpoints-Root" class="endpoints-view">
	<h1>Active REST Endpoints</h1>
	<div class="section">
		<div class="button-row">
			<button class="btn btn-secondary" data-databeacon-action="refresh">
				<span data-databeacon-icon="refresh" data-icon-size="16"></span>
				Refresh
			</button>
		</div>
	</div>
	{~TemplateIfAbsolute:DataBeacon-Endpoints-Empty:AppData.Endpoints:AppData.Endpoints.length^==^0~}
	{~TemplateIfAbsolute:DataBeacon-Endpoints-Table:AppData.Endpoints:AppData.Endpoints.length^>^0~}
</div>`
        }, {
          Hash: 'DataBeacon-Endpoints-Empty',
          Template: `<p class="empty-state">No dynamic endpoints enabled yet.</p>`
        }, {
          Hash: 'DataBeacon-Endpoints-Table',
          Template: /*html*/`
<div class="section">
	<h2>Endpoints ({~D:AppData.Endpoints.length:0~})</h2>
	<table class="data-table">
		<thead><tr><th>Table</th><th>Type</th><th>Base</th><th>Actions</th></tr></thead>
		<tbody>{~TS:DataBeacon-Endpoints-Row:AppData.Endpoints~}</tbody>
	</table>
	<div class="help-text">
		<p>CRUD: GET /1.0/{Table}s/{Begin}/{Cap}, GET /1.0/{Table}/{ID}, POST/PUT/DEL /1.0/{Table}</p>
	</div>
</div>`
        }, {
          Hash: 'DataBeacon-Endpoints-Row',
          Template: /*html*/`
<tr>
	<td><strong>{~D:Record.TableName~}</strong></td>
	<td>{~D:Record.ConnectionType~}</td>
	<td><code>{~D:Record.EndpointBase~}</code></td>
	<td class="actions-cell">
		<button class="btn btn-small btn-primary" data-databeacon-action="browse" data-table-name="{~D:Record.TableName~}">
			<span data-databeacon-icon="eye" data-icon-size="14"></span> Browse
		</button>
		<button class="btn btn-small btn-secondary" data-databeacon-action="open-api" data-api-url="{~D:Record.EndpointAPIURL~}">
			<span data-databeacon-icon="external-link" data-icon-size="14"></span> API
		</button>
	</td>
</tr>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-Endpoints',
          TemplateHash: 'DataBeacon-Endpoints-Template',
          ContentDestinationAddress: '#DataBeacon-View-Endpoints',
          RenderMethod: 'replace'
        }]
      };
      class PictViewDataBeaconEndpoints extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          let tmpIcons = this.pict.providers['DataBeacon-Icons'];
          if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-Endpoints-Root');
          let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-Endpoints-Root');
          if (tmpRootList && tmpRootList.length > 0) {
            tmpRootList[0].addEventListener('click', pEvent => {
              let tmpBtn = pEvent.target.closest('[data-databeacon-action]');
              if (!tmpBtn) return;
              this._handleAction(tmpBtn.getAttribute('data-databeacon-action'), tmpBtn.dataset);
            });
          }
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
        _handleAction(pAction, pData) {
          let tmpProvider = this.pict.providers.DataBeaconProvider;
          switch (pAction) {
            case 'refresh':
              tmpProvider.loadEndpoints();
              break;
            case 'browse':
              if (pData.tableName) {
                this.pict.AppData.SelectedTableName = pData.tableName;
                // Always restart paging from row 0 when jumping from Endpoints.
                if (!this.pict.AppData.RecordBrowser) this.pict.AppData.RecordBrowser = {};
                this.pict.AppData.RecordBrowser.CursorStart = 0;
                let tmpPageSize = this.pict.AppData.RecordBrowser.PageSize || 50;
                tmpProvider.loadRecords(pData.tableName, 0, tmpPageSize);
                if (this.pict.views.Layout) this.pict.views.Layout.setActiveView('Records');
              }
              break;
            case 'open-api':
              if (pData.apiUrl) window.open(pData.apiUrl, '_blank');
              break;
          }
        }
      }
      module.exports = PictViewDataBeaconEndpoints;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    35: [function (require, module, exports) {
      /**
       * DataBeacon Introspection Page (container view)
       *
       * Hosts two sub-views: IntrospectionControls (picker + buttons + banner)
       * and IntrospectionTables (table grid + per-table detail modal).
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'Introspection',
        DefaultRenderable: 'DataBeacon-IntrospectionPage',
        DefaultDestinationAddress: '#DataBeacon-View-Introspection',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-IntrospectionPage-Template',
          Template: /*html*/`
<div class="introspection-view">
	<h1>Schema Introspection</h1>
	<div id="DataBeacon-IntrospectionControls-Slot"></div>
	<div id="DataBeacon-IntrospectionTables-Slot"></div>
</div>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-IntrospectionPage',
          TemplateHash: 'DataBeacon-IntrospectionPage-Template',
          ContentDestinationAddress: '#DataBeacon-View-Introspection',
          RenderMethod: 'replace'
        }]
      };
      class PictViewDataBeaconIntrospection extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onBeforeRender(pRenderable) {
          // Ask the provider to refresh its view-shape for the Introspection
          // screen (auto-select single connection, compute banner, etc.)
          // before the sub-views attempt to read AppData.Introspection.
          let tmpProvider = this.pict.providers.DataBeaconProvider;
          if (tmpProvider && typeof tmpProvider.refreshIntrospectionViewData === 'function') {
            tmpProvider.refreshIntrospectionViewData();
          }
          return super.onBeforeRender(pRenderable);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          if (this.pict.views.IntrospectionControls) this.pict.views.IntrospectionControls.render();
          if (this.pict.views.IntrospectionTables) this.pict.views.IntrospectionTables.render();
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
      }
      module.exports = PictViewDataBeaconIntrospection;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    36: [function (require, module, exports) {
      /**
       * DataBeacon IntrospectionControls View
       *
       * Connection picker + Introspect / Introspect All buttons + a connection
       * banner showing the current selection. The dropdown only lists connected
       * databases; the provider pre-computes AppData.Introspection.ConnectedList
       * and AppData.Introspection.SelectedBanner for this view.
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'IntrospectionControls',
        DefaultRenderable: 'DataBeacon-IntrospectionControls',
        DefaultDestinationAddress: '#DataBeacon-IntrospectionControls-Slot',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-IntrospectionControls-Template',
          Template: /*html*/`
<div id="DataBeacon-IntrospectionControls-Root" class="section">
	<div class="form-row">
		<div class="form-group">
			<label>Connection</label>
			<select id="databeacon-introspect-connection" data-databeacon-action="select-connection">
				{~TemplateIfAbsolute:DataBeacon-IntrospectionControls-PlaceholderOption:AppData.Introspection:AppData.Introspection.ShowPlaceholder^TRUE^x~}
				{~TS:DataBeacon-IntrospectionControls-ConnectionOption:AppData.Introspection.ConnectedList~}
			</select>
		</div>
		<div class="form-group">
			<button class="btn btn-primary" data-databeacon-action="run-introspect" data-databeacon-disabled="{~D:AppData.Introspection.RunDisabled~}">
				<span data-databeacon-icon="introspection" data-icon-size="16"></span>
				Introspect
			</button>
		</div>
		<div class="form-group">
			<button class="btn btn-secondary" data-databeacon-action="introspect-all" data-databeacon-disabled="{~D:AppData.Introspection.AllDisabled~}">
				<span data-databeacon-icon="refresh" data-icon-size="16"></span>
				Introspect All
			</button>
		</div>
	</div>
	{~TemplateIfAbsolute:DataBeacon-IntrospectionControls-Banner:AppData.Introspection.SelectedBanner:AppData.Introspection.HasSelection^TRUE^x~}
</div>`
        }, {
          Hash: 'DataBeacon-IntrospectionControls-PlaceholderOption',
          Template: `<option value="">-- Select Connection --</option>`
        }, {
          Hash: 'DataBeacon-IntrospectionControls-ConnectionOption',
          Template: `<option value="{~D:Record.IDBeaconConnection~}" {~D:Record.SelectedAttr~}>{~D:Record.Name~} ({~D:Record.Type~})</option>`
        }, {
          Hash: 'DataBeacon-IntrospectionControls-Banner',
          Template: /*html*/`
<div class="connection-banner">
	<span class="connection-banner-name">{~D:AppData.Introspection.SelectedBanner.Name~}</span>
	<span class="badge {~D:AppData.Introspection.SelectedBanner.StatusBadgeClass~}">{~D:AppData.Introspection.SelectedBanner.StatusLabel~}</span>
	<span class="connection-banner-type">{~D:AppData.Introspection.SelectedBanner.Type~}</span>
	{~TemplateIfAbsolute:DataBeacon-IntrospectionControls-BannerDesc:AppData.Introspection.SelectedBanner:AppData.Introspection.SelectedBanner.HasDescription^TRUE^x~}
</div>`
        }, {
          Hash: 'DataBeacon-IntrospectionControls-BannerDesc',
          Template: `<span class="connection-banner-desc">{~D:AppData.Introspection.SelectedBanner.Description~}</span>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-IntrospectionControls',
          TemplateHash: 'DataBeacon-IntrospectionControls-Template',
          ContentDestinationAddress: '#DataBeacon-IntrospectionControls-Slot',
          RenderMethod: 'replace'
        }]
      };
      class PictViewDataBeaconIntrospectionControls extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          let tmpIcons = this.pict.providers['DataBeacon-Icons'];
          if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-IntrospectionControls-Root');
          this._applyDisabledAttributes();
          let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-IntrospectionControls-Root');
          if (tmpRootList && tmpRootList.length > 0) {
            let tmpRoot = tmpRootList[0];
            tmpRoot.addEventListener('click', pEvent => {
              let tmpBtn = pEvent.target.closest('[data-databeacon-action]');
              if (!tmpBtn || tmpBtn.tagName !== 'BUTTON') return;
              this._handleAction(tmpBtn.getAttribute('data-databeacon-action'), tmpBtn.dataset);
            });
            tmpRoot.addEventListener('change', pEvent => {
              let tmpSelect = pEvent.target.closest('[data-databeacon-action="select-connection"]');
              if (!tmpSelect) return;
              this._handleSelection(tmpSelect.value);
            });
          }
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
        _applyDisabledAttributes() {
          let tmpIntrospection = this.pict.AppData.Introspection || {};
          let tmpRunList = this.pict.ContentAssignment.getElement('[data-databeacon-action="run-introspect"]');
          if (tmpRunList && tmpRunList.length > 0) {
            tmpRunList[0].disabled = !!tmpIntrospection.RunDisabled;
          }
          let tmpAllList = this.pict.ContentAssignment.getElement('[data-databeacon-action="introspect-all"]');
          if (tmpAllList && tmpAllList.length > 0) {
            tmpAllList[0].disabled = !!tmpIntrospection.AllDisabled;
          }
        }
        _handleAction(pAction) {
          let tmpProvider = this.pict.providers.DataBeaconProvider;
          let tmpSelectedID = this.pict.AppData.SelectedConnectionID;
          if (pAction === 'run-introspect') {
            if (tmpSelectedID) tmpProvider.introspect(tmpSelectedID);
          } else if (pAction === 'introspect-all') {
            this._introspectAll();
          }
        }
        _handleSelection(pRawValue) {
          let tmpID = parseInt(pRawValue, 10);
          if (isNaN(tmpID)) tmpID = null;
          this.pict.AppData.SelectedConnectionID = tmpID;
          let tmpProvider = this.pict.providers.DataBeaconProvider;
          if (tmpID) {
            tmpProvider.loadTables(tmpID);
          } else {
            this.pict.AppData.Tables = [];
            if (tmpProvider.refreshIntrospectionViewData) tmpProvider.refreshIntrospectionViewData();
            if (this.pict.views.IntrospectionControls) this.pict.views.IntrospectionControls.render();
            if (this.pict.views.IntrospectionTables) this.pict.views.IntrospectionTables.render();
          }
        }
        _introspectAll() {
          let tmpConns = this.pict.AppData.Connections || [];
          let tmpProvider = this.pict.providers.DataBeaconProvider;
          let tmpConnectedIDs = [];
          for (let i = 0; i < tmpConns.length; i++) {
            if (tmpConns[i].Connected) tmpConnectedIDs.push(tmpConns[i].IDBeaconConnection);
          }
          let tmpIdx = 0;
          let tmpDoNext = () => {
            if (tmpIdx >= tmpConnectedIDs.length) {
              if (this.pict.AppData.SelectedConnectionID) {
                tmpProvider.loadTables(this.pict.AppData.SelectedConnectionID);
              }
              return;
            }
            tmpProvider.introspect(tmpConnectedIDs[tmpIdx], () => {
              tmpIdx++;
              tmpDoNext();
            });
          };
          tmpDoNext();
        }
      }
      module.exports = PictViewDataBeaconIntrospectionControls;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    37: [function (require, module, exports) {
      /**
       * DataBeacon IntrospectionTables View
       *
       * Renders the schema tables list for the currently selected connection.
       * Each row shows column count, row estimate, endpoint status, and an
       * Enable/Disable action. Clicking a table name opens a pict-section-modal
       * with full column details.
       *
       * The provider pre-computes `AppData.Introspection.TablesView` (with
       * per-row display flags) and `AppData.Introspection.TablesHeader`
       * (heading + subline) so this view stays declarative.
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'IntrospectionTables',
        DefaultRenderable: 'DataBeacon-IntrospectionTables',
        DefaultDestinationAddress: '#DataBeacon-IntrospectionTables-Slot',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-IntrospectionTables-Template',
          Template: /*html*/`
<div id="DataBeacon-IntrospectionTables-Root">
	{~TemplateIfAbsolute:DataBeacon-IntrospectionTables-NoConnections:AppData.Introspection:AppData.Introspection.State^==^NoConnections~}
	{~TemplateIfAbsolute:DataBeacon-IntrospectionTables-NoSelection:AppData.Introspection:AppData.Introspection.State^==^NoSelection~}
	{~TemplateIfAbsolute:DataBeacon-IntrospectionTables-Empty:AppData.Introspection:AppData.Introspection.State^==^Empty~}
	{~TemplateIfAbsolute:DataBeacon-IntrospectionTables-Table:AppData.Introspection:AppData.Introspection.State^==^HasTables~}
</div>`
        }, {
          Hash: 'DataBeacon-IntrospectionTables-NoConnections',
          Template: /*html*/`
<p class="empty-state">
	No databases connected. Go to
	<a href="javascript:void(0)" data-databeacon-action="goto-connections">Connections</a>
	to add and connect a database first.
</p>`
        }, {
          Hash: 'DataBeacon-IntrospectionTables-NoSelection',
          Template: `<p class="empty-state">Select a connected database above and click Introspect.</p>`
        }, {
          Hash: 'DataBeacon-IntrospectionTables-Empty',
          Template: `<p class="empty-state">No tables discovered yet. Click <strong>Introspect</strong> to scan the database.</p>`
        }, {
          Hash: 'DataBeacon-IntrospectionTables-Table',
          Template: /*html*/`
<div class="section">
	<h2>Tables from <strong>{~D:AppData.Introspection.TablesHeader.ConnectionName~}</strong></h2>
	<span class="section-subline">{~D:AppData.Introspection.TablesHeader.Subline~}</span>
	<table class="data-table" style="margin-top:12px;">
		<thead><tr><th>Table</th><th>Columns</th><th>Est. Rows</th><th>Endpoint</th><th>Actions</th></tr></thead>
		<tbody>{~TS:DataBeacon-IntrospectionTables-Row:AppData.Introspection.TablesView~}</tbody>
	</table>
</div>`
        }, {
          Hash: 'DataBeacon-IntrospectionTables-Row',
          Template: /*html*/`
<tr>
	<td><a href="javascript:void(0)" data-databeacon-action="view-table" data-connection-id="{~D:Record.ConnectionID~}" data-table-name="{~D:Record.TableName~}">{~D:Record.TableName~}</a></td>
	<td>{~D:Record.ColumnCount~}</td>
	<td>{~D:Record.RowCountDisplay~}</td>
	<td>{~TIf:DataBeacon-IntrospectionTables-Row-EndpointBadge::Record.EndpointsEnabled^TRUE^x~}</td>
	<td class="actions-cell">
		{~TIf:DataBeacon-IntrospectionTables-Row-Disable::Record.EndpointsEnabled^TRUE^x~}
		{~TIf:DataBeacon-IntrospectionTables-Row-Enable::Record.EndpointsEnabled^FALSE^x~}
	</td>
</tr>`
        }, {
          Hash: 'DataBeacon-IntrospectionTables-Row-EndpointBadge',
          Template: `<span class="badge badge-success">Active</span>`
        }, {
          Hash: 'DataBeacon-IntrospectionTables-Row-Enable',
          Template: /*html*/`
<button class="btn btn-small btn-primary" data-databeacon-action="enable-endpoint" data-connection-id="{~D:Record.ConnectionID~}" data-table-name="{~D:Record.TableName~}">
	<span data-databeacon-icon="check" data-icon-size="14"></span> Enable
</button>`
        }, {
          Hash: 'DataBeacon-IntrospectionTables-Row-Disable',
          Template: /*html*/`
<button class="btn btn-small btn-warning" data-databeacon-action="disable-endpoint" data-connection-id="{~D:Record.ConnectionID~}" data-table-name="{~D:Record.TableName~}">
	<span data-databeacon-icon="x" data-icon-size="14"></span> Disable
</button>`
        }, {
          Hash: 'DataBeacon-IntrospectionTables-DetailModal',
          Template: /*html*/`
<table class="data-table">
	<thead><tr><th>Column</th><th>Native Type</th><th>Meadow Type</th><th>Nullable</th><th>Default</th></tr></thead>
	<tbody>{~TS:DataBeacon-IntrospectionTables-DetailModal-Row:AppData.Introspection.DetailModalColumns~}</tbody>
</table>`
        }, {
          Hash: 'DataBeacon-IntrospectionTables-DetailModal-Row',
          Template: /*html*/`
<tr>
	<td>
		<strong>{~D:Record.Name~}</strong>
		{~TIf:DataBeacon-IntrospectionTables-DetailModal-Row-PK::Record.IsPrimaryKey^TRUE^x~}
		{~TIf:DataBeacon-IntrospectionTables-DetailModal-Row-Auto::Record.IsAutoIncrement^TRUE^x~}
	</td>
	<td>{~D:Record.NativeTypeDisplay~}</td>
	<td>{~D:Record.MeadowType~}</td>
	<td>{~D:Record.NullableDisplay~}</td>
	<td>{~D:Record.DefaultValueDisplay~}</td>
</tr>`
        }, {
          Hash: 'DataBeacon-IntrospectionTables-DetailModal-Row-PK',
          Template: `<span class="badge badge-info">PK</span>`
        }, {
          Hash: 'DataBeacon-IntrospectionTables-DetailModal-Row-Auto',
          Template: `<span class="badge badge-neutral">AUTO</span>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-IntrospectionTables',
          TemplateHash: 'DataBeacon-IntrospectionTables-Template',
          ContentDestinationAddress: '#DataBeacon-IntrospectionTables-Slot',
          RenderMethod: 'replace'
        }]
      };
      class PictViewDataBeaconIntrospectionTables extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          let tmpIcons = this.pict.providers['DataBeacon-Icons'];
          if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-IntrospectionTables-Root');
          let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-IntrospectionTables-Root');
          if (tmpRootList && tmpRootList.length > 0) {
            tmpRootList[0].addEventListener('click', pEvent => {
              let tmpEl = pEvent.target.closest('[data-databeacon-action]');
              if (!tmpEl) return;
              pEvent.preventDefault();
              this._handleAction(tmpEl.getAttribute('data-databeacon-action'), tmpEl.dataset);
            });
          }
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
        _handleAction(pAction, pData) {
          let tmpProvider = this.pict.providers.DataBeaconProvider;
          let tmpCID = parseInt(pData.connectionId, 10);
          let tmpTable = pData.tableName;
          switch (pAction) {
            case 'goto-connections':
              if (this.pict.views.Layout) this.pict.views.Layout.setActiveView('Connections');
              break;
            case 'enable-endpoint':
              if (!isNaN(tmpCID) && tmpTable) tmpProvider.enableEndpoint(tmpCID, tmpTable);
              break;
            case 'disable-endpoint':
              if (!isNaN(tmpCID) && tmpTable) tmpProvider.disableEndpoint(tmpCID, tmpTable);
              break;
            case 'view-table':
              if (!isNaN(tmpCID) && tmpTable) this._showDetail(tmpCID, tmpTable);
              break;
          }
        }
        _showDetail(pConnectionID, pTableName) {
          let tmpProvider = this.pict.providers.DataBeaconProvider;
          let tmpModal = this.pict.views.PictSectionModal;
          if (!tmpModal) return;
          tmpProvider.loadTableDetails(pConnectionID, pTableName, (pError, pData) => {
            if (pError || !pData || !pData.Columns) {
              tmpModal.toast('Failed to load table details.', {
                type: 'error'
              });
              return;
            }

            // Pre-compute display-ready column records and stash them in AppData
            // so parseTemplateByHash can resolve {~D:AppData.Introspection.DetailModalColumns~}.
            if (!this.pict.AppData.Introspection) this.pict.AppData.Introspection = {};
            this.pict.AppData.Introspection.DetailModalColumns = this._buildDetailRows(pData.Columns);
            let tmpContent = this.pict.parseTemplateByHash('DataBeacon-IntrospectionTables-DetailModal', null);
            let tmpConn = this._getSelectedConnection();
            let tmpTitle = tmpConn ? `${pTableName} — ${tmpConn.Name}` : pTableName;
            tmpModal.show({
              title: tmpTitle,
              content: tmpContent,
              closeable: true,
              width: '720px',
              buttons: [{
                Hash: 'close',
                Label: 'Close',
                Style: 'primary'
              }]
            });
          });
        }
        _buildDetailRows(pColumns) {
          let tmpRows = [];
          for (let i = 0; i < pColumns.length; i++) {
            let tmpCol = pColumns[i];
            tmpRows.push({
              Name: tmpCol.Name,
              IsPrimaryKey: !!tmpCol.IsPrimaryKey,
              IsAutoIncrement: !!tmpCol.IsAutoIncrement,
              NativeTypeDisplay: tmpCol.NativeType + (tmpCol.MaxLength ? `(${tmpCol.MaxLength})` : ''),
              MeadowType: tmpCol.MeadowType || '',
              NullableDisplay: tmpCol.Nullable ? 'YES' : 'NO',
              DefaultValueDisplay: tmpCol.DefaultValue === null || tmpCol.DefaultValue === undefined ? '--' : String(tmpCol.DefaultValue)
            });
          }
          return tmpRows;
        }
        _getSelectedConnection() {
          let tmpCID = this.pict.AppData.SelectedConnectionID;
          if (!tmpCID) return null;
          let tmpConns = this.pict.AppData.Connections || [];
          for (let i = 0; i < tmpConns.length; i++) {
            if (tmpConns[i].IDBeaconConnection === tmpCID) return tmpConns[i];
          }
          return null;
        }
      }
      module.exports = PictViewDataBeaconIntrospectionTables;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    38: [function (require, module, exports) {
      /**
       * DataBeacon Layout View
       *
       * Shell: fixed left sidebar with navigation, plus a set of mount-point
       * panels for each page view. Each page view renders into its dedicated
       * `#DataBeacon-View-<Name>` panel.
       *
       * Navigation, active-state tracking, and CSS injection live here (the
       * layout is the only view that owns the chrome).
       */
      const libPictView = require('pict-view');
      const _NavItems = [{
        View: 'Dashboard',
        Label: 'Dashboard',
        Icon: 'dashboard'
      }, {
        View: 'Connections',
        Label: 'Connections',
        Icon: 'connections'
      }, {
        View: 'Introspection',
        Label: 'Introspection',
        Icon: 'introspection'
      }, {
        View: 'Endpoints',
        Label: 'Endpoints',
        Icon: 'endpoints'
      }, {
        View: 'Records',
        Label: 'Records',
        Icon: 'records'
      }, {
        View: 'SQL',
        Label: 'SQL',
        Icon: 'terminal'
      }];
      const _ViewConfiguration = {
        ViewIdentifier: 'Layout',
        DefaultRenderable: 'DataBeacon-Layout',
        DefaultDestinationAddress: '#DataBeacon-App',
        AutoRender: false,
        CSS: /*css*/`
		.sidebar-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
		.sidebar-header-text { flex: 1 1 auto; min-width: 0; }
		.sidebar-header-controls { flex: 0 0 auto; }
		.nav-item { display: flex; align-items: center; gap: 10px; }
		.nav-icon { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; }
		.nav-icon svg { display: block; }
		.nav-label { line-height: 1; }
		.btn [data-databeacon-icon] { display: inline-flex; align-items: center; margin-right: 6px; vertical-align: middle; }
		.btn [data-databeacon-icon] svg { display: block; }
		.actions-cell .btn { display: inline-flex; align-items: center; }
	`,
        Templates: [{
          Hash: 'DataBeacon-Layout-Shell',
          Template: /*html*/`
<div class="app-container">
	<div class="sidebar">
		<div class="sidebar-header">
			<div class="sidebar-header-text">
				<h2>DataBeacon</h2>
				<span class="version">v0.0.1</span>
			</div>
			<div class="sidebar-header-controls" id="DataBeacon-ThemeSwitcher-Slot"></div>
		</div>
		<nav class="sidebar-nav" id="DataBeacon-Sidebar-Nav">{~TS:DataBeacon-Layout-NavItem:AppData.Layout.NavItems~}</nav>
	</div>
	<div class="main-content">
		<div id="DataBeacon-View-Dashboard" class="view-panel"></div>
		<div id="DataBeacon-View-Connections" class="view-panel" style="display:none;"></div>
		<div id="DataBeacon-View-Introspection" class="view-panel" style="display:none;"></div>
		<div id="DataBeacon-View-Endpoints" class="view-panel" style="display:none;"></div>
		<div id="DataBeacon-View-Records" class="view-panel" style="display:none;"></div>
		<div id="DataBeacon-View-SQL" class="view-panel" style="display:none;"></div>
	</div>
</div>`
        }, {
          Hash: 'DataBeacon-Layout-NavItem',
          Template: /*html*/`
<div class="nav-item" data-databeacon-action="navigate" data-view="{~D:Record.View~}" data-view-nav="{~D:Record.View~}">
	<span class="nav-icon" data-databeacon-icon="{~D:Record.Icon~}" data-icon-size="20"></span>
	<span class="nav-label">{~D:Record.Label~}</span>
</div>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-Layout',
          TemplateHash: 'DataBeacon-Layout-Shell',
          ContentDestinationAddress: '#DataBeacon-App',
          RenderMethod: 'replace'
        }]
      };
      class PictViewDataBeaconLayout extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onBeforeRender(pRenderable) {
          // Publish the nav-item list so the template can iterate over it.
          if (!this.pict.AppData.Layout) this.pict.AppData.Layout = {};
          this.pict.AppData.Layout.NavItems = _NavItems;
          return super.onBeforeRender(pRenderable);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          // Fill SVG icon placeholders in the sidebar (and anywhere else the layout owns).
          let tmpIcons = this.pict.providers['DataBeacon-Icons'];
          if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-App');

          // Mount the theme-switcher widget into its sidebar-header slot.
          if (this.pict.views.ThemeSwitcher) this.pict.views.ThemeSwitcher.render();

          // Wire a single delegated click handler on the sidebar; the layout
          // only renders when navigation state changes, so attaching on every
          // render is cheap and correct (previous nav DOM is gone).
          let tmpNavList = this.pict.ContentAssignment.getElement('#DataBeacon-Sidebar-Nav');
          if (tmpNavList && tmpNavList.length > 0) {
            tmpNavList[0].addEventListener('click', pEvent => {
              let tmpBtn = pEvent.target.closest('[data-databeacon-action="navigate"]');
              if (!tmpBtn) return;
              let tmpViewName = tmpBtn.getAttribute('data-view');
              if (tmpViewName) this.setActiveView(tmpViewName);
            });
          }

          // Ensure every view's CSS (including pict-section-modal's) is in the DOM.
          if (this.pict.CSSMap && typeof this.pict.CSSMap.injectCSS === 'function') {
            this.pict.CSSMap.injectCSS();
          }
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }

        /**
         * Switch the visible page panel and nav highlight, then trigger
         * the target view's render so it has fresh data on display.
         * @param {string} pViewName
         */
        setActiveView(pViewName) {
          this.pict.AppData.CurrentView = pViewName;

          // Toggle panel visibility.
          for (let i = 0; i < _NavItems.length; i++) {
            let tmpName = _NavItems[i].View;
            let tmpPanelList = this.pict.ContentAssignment.getElement(`#DataBeacon-View-${tmpName}`);
            if (tmpPanelList && tmpPanelList.length > 0) {
              tmpPanelList[0].style.display = tmpName === pViewName ? 'block' : 'none';
            }
          }

          // Toggle .active on the nav items.
          let tmpNavItems = this.pict.ContentAssignment.getElement('[data-view-nav]');
          if (tmpNavItems && tmpNavItems.length) {
            for (let i = 0; i < tmpNavItems.length; i++) {
              let tmpName = tmpNavItems[i].getAttribute('data-view-nav');
              if (tmpName === pViewName) tmpNavItems[i].classList.add('active');else tmpNavItems[i].classList.remove('active');
            }
          }

          // Render the active page view (container pages cascade to sub-views).
          let tmpView = this.pict.views[pViewName];
          if (tmpView && typeof tmpView.render === 'function') {
            tmpView.render();
          }
        }
      }
      module.exports = PictViewDataBeaconLayout;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    39: [function (require, module, exports) {
      /**
       * DataBeacon QueryPanel View
       *
       * SQL input (pict-section-code CodeJar editor, SQL syntax highlighting) +
       * Execute button + result table. Operates against the currently selected
       * connection (AppData.SelectedConnectionID). Results are stashed into
       * AppData.QueryPanel.* by the view before rendering the results area.
       *
       * The editor instance lives in the 'SQLEditor' view (registered in the
       * application) and is mounted into this view's editor slot on every render.
       * Because QueryPanel's root is replaced on each render, the editor's
       * CodeJar instance is destroyed and the initial-render flag is reset so
       * pict-section-code reinitialises cleanly into the fresh target div.
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'QueryPanel',
        DefaultRenderable: 'DataBeacon-QueryPanel',
        DefaultDestinationAddress: '#DataBeacon-QueryPanel-Slot',
        AutoRender: false,
        CSS: /*css*/`
		#DataBeacon-QueryPanel-Editor { min-height: 140px; }
		#DataBeacon-QueryPanel-Editor .pict-code-editor-wrap
		{
			border: 1px solid var(--border-color);
			border-radius: 4px;
			background: var(--bg-input);
		}
		#DataBeacon-QueryPanel-Editor .pict-code-editor
		{
			background: var(--bg-input) !important;
			color: var(--text-primary) !important;
			font-family: 'SFMono-Regular', 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
			font-size: 13px;
			min-height: 120px;
		}
		#DataBeacon-QueryPanel-Editor .pict-code-line-numbers
		{
			background: var(--bg-card) !important;
			color: var(--text-muted) !important;
			border-right: 1px solid var(--border-color) !important;
		}
		#DataBeacon-QueryPanel-Editor .keyword { color: var(--accent-primary); font-weight: 600; }
		#DataBeacon-QueryPanel-Editor .string { color: var(--accent-success); }
		#DataBeacon-QueryPanel-Editor .number { color: var(--accent-warning); }
		#DataBeacon-QueryPanel-Editor .comment { color: var(--text-muted); font-style: italic; }
		#DataBeacon-QueryPanel-Editor .operator { color: var(--accent-info); }
		#DataBeacon-QueryPanel-Editor .function-name { color: var(--accent-info); }
		#DataBeacon-QueryPanel-Root .databeacon-export-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 10px; }
		#DataBeacon-QueryPanel-Root .databeacon-export-bar .databeacon-export-label { color: var(--text-muted); font-size: 12px; margin-right: 4px; }
	`,
        Templates: [{
          Hash: 'DataBeacon-QueryPanel-Template',
          Template: /*html*/`
<div id="DataBeacon-QueryPanel-Root" class="section">
	<h2>Query Panel</h2>
	<div class="form-group">
		<label>{~D:AppData.QueryPanel.EditorLabel:SQL (SELECT only)~}</label>
		<div id="DataBeacon-QueryPanel-Editor"></div>
		<div class="help-text" id="DataBeacon-QueryPanel-EditorHint">{~D:AppData.QueryPanel.EditorHint~}</div>
	</div>
	<div class="button-row">
		<button class="btn btn-primary" data-databeacon-action="execute">
			<span data-databeacon-icon="play" data-icon-size="16"></span>
			Execute
		</button>
		<button class="btn btn-secondary" data-databeacon-action="save-query">
			<span data-databeacon-icon="save" data-icon-size="16"></span>
			Save…
		</button>
	</div>
	<div id="DataBeacon-QueryPanel-Results"></div>
</div>`
        }, {
          Hash: 'DataBeacon-QueryPanel-ResultsTable',
          Template: /*html*/`
<div class="table-scroll">
	<table class="data-table">
		<thead><tr>{~TS:DataBeacon-QueryPanel-HeaderCell:AppData.QueryPanel.ColumnList~}</tr></thead>
		<tbody>{~TS:DataBeacon-QueryPanel-Row:AppData.QueryPanel.Rows~}</tbody>
	</table>
</div>
{~TemplateIfAbsolute:DataBeacon-QueryPanel-TruncationNote:AppData.QueryPanel:AppData.QueryPanel.IsTruncated^TRUE^x~}
{~Template:DataBeacon-QueryPanel-ExportBar:~}`
        }, {
          Hash: 'DataBeacon-QueryPanel-ExportBar',
          Template: /*html*/`
<div class="databeacon-export-bar">
	<span class="databeacon-export-label">Export result:</span>
	<button class="btn btn-small btn-secondary" data-databeacon-action="export" data-export-format="json">
		<span data-databeacon-icon="download" data-icon-size="14"></span> JSON
	</button>
	<button class="btn btn-small btn-secondary" data-databeacon-action="export" data-export-format="json-comp">
		<span data-databeacon-icon="download" data-icon-size="14"></span> JSON Comprehension
	</button>
	<button class="btn btn-small btn-secondary" data-databeacon-action="export" data-export-format="csv">
		<span data-databeacon-icon="download" data-icon-size="14"></span> CSV
	</button>
	<button class="btn btn-small btn-secondary" data-databeacon-action="export" data-export-format="tsv">
		<span data-databeacon-icon="download" data-icon-size="14"></span> TSV
	</button>
</div>`
        }, {
          Hash: 'DataBeacon-QueryPanel-HeaderCell',
          Template: `<th>{~D:Record.Name~}</th>`
        }, {
          Hash: 'DataBeacon-QueryPanel-Row',
          Template: `<tr>{~TS:DataBeacon-QueryPanel-Cell:Record.Cells~}</tr>`
        }, {
          Hash: 'DataBeacon-QueryPanel-Cell',
          Template: `<td>{~D:Record.CellHTML~}</td>`
        }, {
          Hash: 'DataBeacon-QueryPanel-TruncationNote',
          Template: `<p class="help-text">Showing {~D:AppData.QueryPanel.DisplayCount~} of {~D:AppData.QueryPanel.TotalCount~}</p>`
        }, {
          Hash: 'DataBeacon-QueryPanel-EmptyResults',
          Template: `<p class="empty-state">No results.</p>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-QueryPanel',
          TemplateHash: 'DataBeacon-QueryPanel-Template',
          ContentDestinationAddress: '#DataBeacon-QueryPanel-Slot',
          RenderMethod: 'replace'
        }]
      };
      class PictViewDataBeaconQueryPanel extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onBeforeRender(pRenderable) {
          // Refresh the editor label/hint/language metadata based on the
          // current connection type so the declarative template bindings
          // (`AppData.QueryPanel.EditorLabel` etc.) have the latest values
          // before the root renders.
          this._applyDriverProfile();
          return super.onBeforeRender(pRenderable);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          let tmpIcons = this.pict.providers['DataBeacon-Icons'];
          if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-QueryPanel-Root');

          // QueryPanel's root DOM is replaced on every render, so a previously
          // mounted CodeJar instance is orphaned against a detached div.
          // Tear it down (if present) and rebuild into the fresh target.
          this._mountEditor();
          let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-QueryPanel-Root');
          if (tmpRootList && tmpRootList.length > 0) {
            tmpRootList[0].addEventListener('click', pEvent => {
              let tmpBtn = pEvent.target.closest('[data-databeacon-action]');
              if (!tmpBtn) return;
              this._handleAction(tmpBtn.getAttribute('data-databeacon-action'), tmpBtn.dataset);
            });
          }
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
        _mountEditor() {
          let tmpEditor = this.pict.views.SQLEditor;
          if (!tmpEditor) return;
          // Align CodeJar's language BEFORE (re)creating its instance so the
          // appropriate highlighter is compiled at init time.
          let tmpLanguage = this._resolveEditorLanguage();
          if (tmpEditor._language !== tmpLanguage && typeof tmpEditor.setLanguage === 'function') {
            try {
              tmpEditor.setLanguage(tmpLanguage);
            } catch (pError) {
              tmpEditor._language = tmpLanguage;
            }
          }
          if (tmpEditor.codeJar) tmpEditor.destroy();
          tmpEditor.initialRenderComplete = false;
          tmpEditor.render();
          // Wire a defensive Enter handler that guarantees a '\n' insertion in
          // every browser. In Firefox >= 136, contentEditable="plaintext-only"
          // is disabled and CodeJar's legacy fallback only triggers when its
          // indent branch doesn't match — non-indent Enter keys fall through
          // to the browser's default, which on some platforms splits the line
          // into <div> wrappers whose textContent doesn't preserve newlines.
          // Handling Enter explicitly in the capture phase bypasses that.
          this._wireEnterSafety();
        }
        _wireEnterSafety() {
          let tmpEditor = this.pict.views.SQLEditor;
          if (!tmpEditor || !tmpEditor._editorElement) return;
          let tmpEl = tmpEditor._editorElement;

          // Guaranteed-newline Enter handler. Some browsers insert <br> or <div>
          // on Enter even when contenteditable is plaintext-only; when CodeJar's
          // highlighter re-renders innerHTML from textContent, those non-'\n'
          // structures collapse and the visual line break disappears ("line
          // numbers don't increment, typing another char joins them back").
          // Inserting a literal '\n' as a Text node bypasses the browser's
          // default Enter behavior entirely.
          let fHandler = pEvent => {
            if (pEvent.key !== 'Enter') return;
            if (pEvent.defaultPrevented) return;
            if (pEvent.ctrlKey || pEvent.metaKey || pEvent.altKey) return;
            pEvent.preventDefault();
            pEvent.stopPropagation();
            pEvent.stopImmediatePropagation();
            let tmpPadding = this._computeCurrentLinePadding(tmpEl);
            // When Enter lands at end-of-content, the next keystroke would
            // otherwise target a DOM "flag" position (between-nodes) which
            // Chrome resolves into the preceding span — the next character
            // appears joined to the previous line. Mirror the browser's
            // own end-of-content placeholder pattern: insert '\n\n' when
            // there's nothing after the cursor, and pin the caret between
            // the two newlines. CodeJar's highlighter then re-renders into
            // a single trailing text node whose contents are addressable.
            let tmpAtEnd = this._isCursorAtEnd(tmpEl);
            let tmpInsert = '\n' + tmpPadding + (tmpAtEnd ? '\n' : '');
            let tmpInserted = this._manualInsertText(tmpEl, tmpInsert);
            if (tmpAtEnd && tmpInserted) {
              this._placeCaretInTextNode(tmpInserted, tmpPadding.length + 1);
            }

            // Do NOT call codeJar.updateCode here — it resets textContent
            // which loses the cursor position we just placed. CodeJar's
            // keyup handler (unaffected by our keydown preventDefault) will
            // fire debounceHighlight + onUpdate shortly; that drives line
            // numbers and the AppData write through the normal path.
          };
          tmpEl.addEventListener('keydown', fHandler, true);
        }
        _computeCurrentLinePadding(pEditor) {
          let tmpSel = window.getSelection();
          if (!tmpSel || tmpSel.rangeCount === 0) return '';
          let tmpRange = tmpSel.getRangeAt(0);
          let tmpPre = document.createRange();
          tmpPre.selectNodeContents(pEditor);
          tmpPre.setEnd(tmpRange.startContainer, tmpRange.startOffset);
          let tmpText = tmpPre.toString();
          let tmpLineStart = tmpText.lastIndexOf('\n') + 1;
          let tmpLine = tmpText.substring(tmpLineStart);
          let tmpMatch = tmpLine.match(/^[ \t]*/);
          return tmpMatch ? tmpMatch[0] : '';
        }
        _manualInsertText(pEditor, pText) {
          let tmpSel = window.getSelection();
          if (!tmpSel || tmpSel.rangeCount === 0) {
            let tmpNode = document.createTextNode(pText);
            pEditor.appendChild(tmpNode);
            return tmpNode;
          }
          let tmpRange = tmpSel.getRangeAt(0);
          tmpRange.deleteContents();
          let tmpNode = document.createTextNode(pText);
          tmpRange.insertNode(tmpNode);
          // Place caret INSIDE the newly-inserted text node at its end by
          // default. Caller may reposition via _placeCaretInTextNode.
          let tmpCollapse = document.createRange();
          tmpCollapse.setStart(tmpNode, tmpNode.length);
          tmpCollapse.setEnd(tmpNode, tmpNode.length);
          tmpSel.removeAllRanges();
          tmpSel.addRange(tmpCollapse);
          return tmpNode;
        }
        _placeCaretInTextNode(pTextNode, pOffset) {
          if (!pTextNode || pTextNode.nodeType !== Node.TEXT_NODE) return;
          let tmpSel = window.getSelection();
          if (!tmpSel) return;
          let tmpOffset = Math.max(0, Math.min(pOffset, pTextNode.length));
          let tmpRange = document.createRange();
          tmpRange.setStart(pTextNode, tmpOffset);
          tmpRange.setEnd(pTextNode, tmpOffset);
          tmpSel.removeAllRanges();
          tmpSel.addRange(tmpRange);
        }
        _isCursorAtEnd(pEditor) {
          let tmpSel = window.getSelection();
          if (!tmpSel || tmpSel.rangeCount === 0) return true;
          let tmpRange = tmpSel.getRangeAt(0);
          let tmpAfter = document.createRange();
          tmpAfter.selectNodeContents(pEditor);
          tmpAfter.setStart(tmpRange.endContainer, tmpRange.endOffset);
          return tmpAfter.toString().length === 0;
        }
        _handleAction(pAction, pData) {
          if (pAction === 'execute') this._execute();else if (pAction === 'export') this._export(pData && pData.exportFormat);else if (pAction === 'save-query') this._openSaveModal();
        }
        _openSaveModal() {
          let tmpList = this.pict.views.SavedQueriesList;
          let tmpProvider = this.pict.providers['DataBeacon-SavedQueries'];
          if (!tmpList || !tmpProvider) return;
          let tmpSQL = this._readSQL();
          let tmpActiveGUID = tmpProvider.getActiveGUID();
          tmpList.openSaveFormModal({
            GUID: tmpActiveGUID,
            SQL: tmpSQL,
            EditMetadataOnly: false
          });
        }
        _export(pFormat) {
          let tmpExport = this.pict.providers['DataBeacon-Export'];
          if (!tmpExport) return;
          let tmpQP = this.pict.AppData.QueryPanel || {};
          let tmpRows = Array.isArray(tmpQP.RawRows) ? tmpQP.RawRows : [];
          if (tmpRows.length === 0) return;

          // Query results have no table-of-origin — autodetect a Comprehension
          // key by looking for Meadow's GUID${Entity} convention. Any column
          // whose name starts with "GUID" wins; otherwise fall through to the
          // exporter's 1-based row-index fallback.
          let tmpKeyField = null;
          if (tmpRows[0] && typeof tmpRows[0] === 'object') {
            let tmpKeys = Object.keys(tmpRows[0]);
            for (let k = 0; k < tmpKeys.length; k++) {
              if (/^GUID[A-Z]/.test(tmpKeys[k])) {
                tmpKeyField = tmpKeys[k];
                break;
              }
            }
          }
          tmpExport.exportRows(pFormat, tmpRows, {
            BaseName: 'query-result',
            EntityName: 'QueryResult',
            KeyField: tmpKeyField
          });
        }
        _readSQL() {
          let tmpEditor = this.pict.views.SQLEditor;
          if (tmpEditor && typeof tmpEditor.getCode === 'function') {
            let tmpCode = tmpEditor.getCode();
            if (typeof tmpCode === 'string' && tmpCode.length > 0) return tmpCode;
          }
          // Fallback to the data-bound AppData address in case the editor was
          // never initialised (headless context, no CodeJar, etc.).
          let tmpAppData = this.pict.AppData.QueryPanel || {};
          return typeof tmpAppData.SQL === 'string' ? tmpAppData.SQL : '';
        }
        _execute() {
          let tmpModal = this.pict.views.PictSectionModal;
          let tmpSQL = this._readSQL().trim();
          let tmpCID = this.pict.AppData.SelectedConnectionID;
          if (!tmpSQL) {
            let tmpProfile = this._currentDriverProfile();
            let tmpMessage = tmpProfile.IsSQL ? 'Please enter a SQL query.' : `Please enter a ${tmpProfile.Label} query.`;
            if (tmpModal) tmpModal.toast(tmpMessage, {
              type: 'warning'
            });
            return;
          }
          if (!tmpCID) {
            if (tmpModal) tmpModal.toast('Select a connection in Introspection first.', {
              type: 'warning'
            });
            return;
          }
          let tmpProvider = this.pict.providers.DataBeaconProvider;
          tmpProvider.executeQuery(tmpCID, tmpSQL, (pError, pData) => {
            let tmpResultsSelector = '#DataBeacon-QueryPanel-Results';
            if (pError || !pData || !pData.Success) {
              let tmpMessage = pData ? pData.Error : pError ? pError.message : 'Unknown error';
              this.pict.ContentAssignment.assignContent(tmpResultsSelector, `<p class="error">${tmpProvider.escapeHTML ? tmpProvider.escapeHTML(tmpMessage) : tmpMessage}</p>`);
              return;
            }
            let tmpRows = pData.Rows || [];
            if (tmpRows.length === 0) {
              let tmpHTML = this.pict.parseTemplateByHash('DataBeacon-QueryPanel-EmptyResults', null);
              this.pict.ContentAssignment.assignContent(tmpResultsSelector, tmpHTML);
              return;
            }
            this.pict.AppData.QueryPanel = Object.assign({}, this.pict.AppData.QueryPanel, tmpProvider.buildQueryResultViewData(tmpRows));
            let tmpHTML = this.pict.parseTemplateByHash('DataBeacon-QueryPanel-ResultsTable', null);
            this.pict.ContentAssignment.assignContent(tmpResultsSelector, tmpHTML);
            // The results fragment contains fresh data-databeacon-icon
            // placeholders (export-bar buttons) — fill them in now since
            // the view's initial icon pass ran before these elements existed.
            let tmpIcons = this.pict.providers['DataBeacon-Icons'];
            if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-QueryPanel-Root');

            // If a saved query is currently loaded, record this successful
            // execution on it (timestamp + row count).
            let tmpSavedProvider = this.pict.providers['DataBeacon-SavedQueries'];
            if (tmpSavedProvider) {
              let tmpGUID = tmpSavedProvider.getActiveGUID();
              if (tmpGUID) tmpSavedProvider.noteRun(tmpGUID, tmpRows.length);
            }
          });
        }

        // ================================================================
        // Driver-aware editor profile (SQL vs Mongo/Solr/RocksDB JSON)
        // ================================================================

        _currentDriverProfile() {
          let tmpConn = this._currentConnection();
          let tmpType = tmpConn ? tmpConn.Type : null;
          switch (tmpType) {
            case 'MongoDB':
              return {
                Type: 'MongoDB',
                IsSQL: false,
                Language: 'json',
                Label: 'MongoDB (JSON descriptor)',
                Hint: 'Example: {"op":"find","collection":"users","filter":{"active":true},"limit":50} · also supports "aggregate" and "runCommand"'
              };
            case 'Solr':
              return {
                Type: 'Solr',
                IsSQL: false,
                Language: 'json',
                Label: 'Solr (JSON descriptor or query string)',
                Hint: 'JSON: {"q":"title:foo","rows":50} · or raw: q=title:foo&rows=50'
              };
            case 'RocksDB':
              return {
                Type: 'RocksDB',
                IsSQL: false,
                Language: 'json',
                Label: 'RocksDB (JSON descriptor)',
                Hint: 'Example: {"op":"scan","start":"user/","end":"user/~","limit":50} · also supports {"op":"get","key":"user/1"}'
              };
            case 'MySQL':
            case 'PostgreSQL':
            case 'MSSQL':
            case 'SQLite':
            default:
              return {
                Type: tmpType || 'SQL',
                IsSQL: true,
                Language: 'sql',
                Label: 'SQL (SELECT only)',
                Hint: 'SELECT ... — other statement types are rejected server-side.'
              };
          }
        }
        _resolveEditorLanguage() {
          return this._currentDriverProfile().Language;
        }
        _applyDriverProfile() {
          let tmpProfile = this._currentDriverProfile();
          if (!this.pict.AppData.QueryPanel) this.pict.AppData.QueryPanel = {
            SQL: ''
          };
          this.pict.AppData.QueryPanel.EditorLabel = tmpProfile.Label;
          this.pict.AppData.QueryPanel.EditorHint = tmpProfile.Hint;
          this.pict.AppData.QueryPanel.EditorLanguage = tmpProfile.Language;
          this.pict.AppData.QueryPanel.DriverType = tmpProfile.Type;
        }
        _currentConnection() {
          let tmpID = this.pict.AppData.SelectedConnectionID;
          if (tmpID === null || tmpID === undefined) return null;
          let tmpConns = this.pict.AppData.Connections || [];
          for (let i = 0; i < tmpConns.length; i++) {
            if (tmpConns[i].IDBeaconConnection === tmpID) return tmpConns[i];
          }
          return null;
        }
      }
      module.exports = PictViewDataBeaconQueryPanel;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    40: [function (require, module, exports) {
      /**
       * DataBeacon RecordBrowser View
       *
       * Table picker + paginated record table. Users pick a page size, a
       * cursor-start offset, and page forward/backward through the underlying
       * endpoint. The provider populates AppData.RecordBrowser with render-ready
       * fields (ColumnList, Rows, CursorStart, PageSize, PrevDisabled,
       * NextDisabled, RangeLabel, PageSizeOptions) so templates stay declarative.
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'RecordBrowser',
        DefaultRenderable: 'DataBeacon-RecordBrowser',
        DefaultDestinationAddress: '#DataBeacon-RecordBrowser-Slot',
        AutoRender: false,
        CSS: /*css*/`
		.databeacon-records-toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
		.databeacon-records-toolbar .form-group { margin: 0; }
		.databeacon-records-pager-buttons { display: flex; gap: 6px; }
		.databeacon-records-start-input { width: 100px; }
		.databeacon-records-pagesize-select { width: 90px; }
		.databeacon-records-range { margin-top: 8px; color: var(--text-muted); font-size: 12px; }
		.databeacon-export-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 10px; }
		.databeacon-export-bar .databeacon-export-label { color: var(--text-muted); font-size: 12px; margin-right: 4px; }
	`,
        Templates: [{
          Hash: 'DataBeacon-RecordBrowser-Template',
          Template: /*html*/`
<div id="DataBeacon-RecordBrowser-Root" class="section">
	<div class="databeacon-records-toolbar">
		<div class="form-group">
			<label>Table</label>
			<select id="databeacon-records-table" data-databeacon-action="select-table">
				<option value="">-- Select Table --</option>
				{~TS:DataBeacon-RecordBrowser-TableOption:AppData.RecordBrowser.TableOptions~}
			</select>
		</div>
		<div class="form-group">
			<label>Page Size</label>
			<select class="databeacon-records-pagesize-select" data-databeacon-action="select-page-size">
				{~TS:DataBeacon-RecordBrowser-PageSizeOption:AppData.RecordBrowser.PageSizeOptions~}
			</select>
		</div>
		<div class="form-group">
			<label>Start</label>
			<input type="number" class="databeacon-records-start-input" min="0" step="1" value="{~D:AppData.RecordBrowser.CursorStart:0~}" data-databeacon-action="change-start" />
		</div>
		<div class="form-group">
			<label>&nbsp;</label>
			<div class="databeacon-records-pager-buttons">
				<button class="btn btn-small btn-secondary" data-databeacon-action="prev">
					<span data-databeacon-icon="chevron-left" data-icon-size="14"></span> Prev
				</button>
				<button class="btn btn-small btn-secondary" data-databeacon-action="next">
					Next <span data-databeacon-icon="chevron-right" data-icon-size="14"></span>
				</button>
			</div>
		</div>
		<div class="form-group">
			<label>&nbsp;</label>
			<button class="btn btn-small btn-primary" data-databeacon-action="load">
				<span data-databeacon-icon="refresh" data-icon-size="14"></span> Reload
			</button>
		</div>
	</div>
	<div class="databeacon-records-range">{~D:AppData.RecordBrowser.RangeLabel~}</div>
	{~TemplateIfAbsolute:DataBeacon-RecordBrowser-Empty:AppData.RecordBrowser:AppData.RecordBrowser.State^==^Empty~}
	{~TemplateIfAbsolute:DataBeacon-RecordBrowser-NoSelection:AppData.RecordBrowser:AppData.RecordBrowser.State^==^NoSelection~}
	{~TemplateIfAbsolute:DataBeacon-RecordBrowser-Table:AppData.RecordBrowser:AppData.RecordBrowser.State^==^HasRows~}
	{~TemplateIfAbsolute:DataBeacon-RecordBrowser-ExportBar:AppData.RecordBrowser:AppData.RecordBrowser.State^==^HasRows~}
</div>`
        }, {
          Hash: 'DataBeacon-RecordBrowser-ExportBar',
          Template: /*html*/`
<div class="databeacon-export-bar">
	<span class="databeacon-export-label">Export current page:</span>
	<button class="btn btn-small btn-secondary" data-databeacon-action="export" data-export-format="json">
		<span data-databeacon-icon="download" data-icon-size="14"></span> JSON
	</button>
	<button class="btn btn-small btn-secondary" data-databeacon-action="export" data-export-format="json-comp">
		<span data-databeacon-icon="download" data-icon-size="14"></span> JSON Comprehension
	</button>
	<button class="btn btn-small btn-secondary" data-databeacon-action="export" data-export-format="csv">
		<span data-databeacon-icon="download" data-icon-size="14"></span> CSV
	</button>
	<button class="btn btn-small btn-secondary" data-databeacon-action="export" data-export-format="tsv">
		<span data-databeacon-icon="download" data-icon-size="14"></span> TSV
	</button>
</div>`
        }, {
          Hash: 'DataBeacon-RecordBrowser-TableOption',
          Template: `<option value="{~D:Record.TableName~}" {~D:Record.SelectedAttr~}>{~D:Record.TableName~}</option>`
        }, {
          Hash: 'DataBeacon-RecordBrowser-PageSizeOption',
          Template: `<option value="{~D:Record.Value~}" {~D:Record.SelectedAttr~}>{~D:Record.Value~}</option>`
        }, {
          Hash: 'DataBeacon-RecordBrowser-NoSelection',
          Template: `<p class="empty-state">Select an enabled table and click Reload.</p>`
        }, {
          Hash: 'DataBeacon-RecordBrowser-Empty',
          Template: `<p class="empty-state">No records in this page.</p>`
        }, {
          Hash: 'DataBeacon-RecordBrowser-Table',
          Template: /*html*/`
<div class="section">
	<h2>{~D:AppData.RecordBrowser.TableName~}</h2>
	<div class="table-scroll">
		<table class="data-table">
			<thead><tr>{~TS:DataBeacon-RecordBrowser-HeaderCell:AppData.RecordBrowser.ColumnList~}</tr></thead>
			<tbody>{~TS:DataBeacon-RecordBrowser-Row:AppData.RecordBrowser.Rows~}</tbody>
		</table>
	</div>
</div>`
        }, {
          Hash: 'DataBeacon-RecordBrowser-HeaderCell',
          Template: `<th>{~D:Record.Name~}</th>`
        }, {
          Hash: 'DataBeacon-RecordBrowser-Row',
          Template: `<tr>{~TS:DataBeacon-RecordBrowser-Cell:Record.Cells~}</tr>`
        }, {
          Hash: 'DataBeacon-RecordBrowser-Cell',
          Template: `<td>{~D:Record.CellHTML~}</td>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-RecordBrowser',
          TemplateHash: 'DataBeacon-RecordBrowser-Template',
          ContentDestinationAddress: '#DataBeacon-RecordBrowser-Slot',
          RenderMethod: 'replace'
        }]
      };
      class PictViewDataBeaconRecordBrowser extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          let tmpIcons = this.pict.providers['DataBeacon-Icons'];
          if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-RecordBrowser-Root');
          this._applyDisabledAttributes();
          let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-RecordBrowser-Root');
          if (tmpRootList && tmpRootList.length > 0) {
            let tmpRoot = tmpRootList[0];
            tmpRoot.addEventListener('click', pEvent => {
              let tmpBtn = pEvent.target.closest('[data-databeacon-action]');
              if (!tmpBtn || tmpBtn.tagName !== 'BUTTON') return;
              this._handleAction(tmpBtn.getAttribute('data-databeacon-action'), tmpBtn.dataset);
            });
            tmpRoot.addEventListener('change', pEvent => {
              let tmpEl = pEvent.target.closest('[data-databeacon-action]');
              if (!tmpEl) return;
              this._handleChange(tmpEl.getAttribute('data-databeacon-action'), tmpEl.value);
            });
          }
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
        _applyDisabledAttributes() {
          let tmpBrowser = this.pict.AppData.RecordBrowser || {};
          let tmpList = this.pict.ContentAssignment.getElement('[data-databeacon-action="load"]');
          if (tmpList && tmpList.length > 0) tmpList[0].disabled = !!tmpBrowser.LoadDisabled;
          let tmpPrev = this.pict.ContentAssignment.getElement('[data-databeacon-action="prev"]');
          if (tmpPrev && tmpPrev.length > 0) tmpPrev[0].disabled = !!tmpBrowser.PrevDisabled;
          let tmpNext = this.pict.ContentAssignment.getElement('[data-databeacon-action="next"]');
          if (tmpNext && tmpNext.length > 0) tmpNext[0].disabled = !!tmpBrowser.NextDisabled;
        }
        _handleAction(pAction, pData) {
          let tmpProvider = this.pict.providers.DataBeaconProvider;
          let tmpBrowser = this.pict.AppData.RecordBrowser || {};
          let tmpTable = this.pict.AppData.SelectedTableName;
          let tmpStart = this._clampStart(tmpBrowser.CursorStart);
          let tmpSize = this._clampSize(tmpBrowser.PageSize);
          switch (pAction) {
            case 'load':
              if (tmpTable) tmpProvider.loadRecords(tmpTable, tmpStart, tmpSize);
              break;
            case 'prev':
              if (!tmpTable || tmpBrowser.PrevDisabled) return;
              this.pict.AppData.RecordBrowser.CursorStart = Math.max(0, tmpStart - tmpSize);
              tmpProvider.loadRecords(tmpTable, this.pict.AppData.RecordBrowser.CursorStart, tmpSize);
              break;
            case 'next':
              if (!tmpTable || tmpBrowser.NextDisabled) return;
              this.pict.AppData.RecordBrowser.CursorStart = tmpStart + tmpSize;
              tmpProvider.loadRecords(tmpTable, this.pict.AppData.RecordBrowser.CursorStart, tmpSize);
              break;
            case 'export':
              this._export(pData && pData.exportFormat, tmpTable, tmpStart, tmpSize);
              break;
          }
        }
        _export(pFormat, pTable, pStart, pSize) {
          let tmpExport = this.pict.providers['DataBeacon-Export'];
          if (!tmpExport) return;
          let tmpRows = Array.isArray(this.pict.AppData.Records) ? this.pict.AppData.Records : [];
          if (tmpRows.length === 0) return;
          let tmpEntity = pTable || 'Record';
          let tmpKeyField = this._findGUIDField(tmpEntity, tmpRows);
          let tmpBase = `${tmpEntity}-${pStart}-${pStart + tmpRows.length - 1}`;
          tmpExport.exportRows(pFormat, tmpRows, {
            BaseName: tmpBase,
            EntityName: tmpEntity,
            KeyField: tmpKeyField
          });
        }

        /**
         * Resolve the Comprehension key column for the selected table.
         *
         * Meadow's Comprehension format keys records by a GUID column, not the
         * numeric primary key. The default GUIDName is `GUID${Entity}` (e.g.
         * `GUIDUser` for the `User` entity). We try, in order:
         *   1) Exact match `GUID${Entity}` on the first row.
         *   2) Exact match `GUID${Entity}` in the introspected column list.
         *   3) Any column whose name starts with `GUID[A-Z]` in the first row.
         *   4) null — the exporter then falls back to 1-based row index.
         */
        _findGUIDField(pEntityName, pRows) {
          let tmpFirstRow = pRows && pRows.length > 0 && typeof pRows[0] === 'object' && pRows[0] !== null ? pRows[0] : null;
          if (pEntityName && tmpFirstRow) {
            let tmpExpected = `GUID${pEntityName}`;
            if (Object.prototype.hasOwnProperty.call(tmpFirstRow, tmpExpected)) {
              return tmpExpected;
            }
          }
          if (pEntityName) {
            let tmpTables = this.pict.AppData.Tables || [];
            let tmpExpected = `GUID${pEntityName}`;
            for (let i = 0; i < tmpTables.length; i++) {
              if (tmpTables[i].TableName !== pEntityName) continue;
              let tmpColumns = tmpTables[i].Columns || [];
              for (let c = 0; c < tmpColumns.length; c++) {
                if (tmpColumns[c].Name === tmpExpected) return tmpExpected;
              }
              break;
            }
          }
          if (tmpFirstRow) {
            let tmpKeys = Object.keys(tmpFirstRow);
            for (let k = 0; k < tmpKeys.length; k++) {
              if (/^GUID[A-Z]/.test(tmpKeys[k])) return tmpKeys[k];
            }
          }
          return null;
        }
        _handleChange(pAction, pRawValue) {
          let tmpProvider = this.pict.providers.DataBeaconProvider;
          let tmpTable = this.pict.AppData.SelectedTableName;
          switch (pAction) {
            case 'select-table':
              {
                let tmpNext = pRawValue || null;
                this.pict.AppData.SelectedTableName = tmpNext;
                this.pict.AppData.RecordBrowser.CursorStart = 0;
                if (tmpNext) {
                  tmpProvider.loadRecords(tmpNext, 0, this._clampSize(this.pict.AppData.RecordBrowser.PageSize));
                } else {
                  this.pict.AppData.Records = [];
                  tmpProvider.refreshRecordBrowserViewData();
                  this.render();
                }
                break;
              }
            case 'select-page-size':
              {
                let tmpSize = this._clampSize(parseInt(pRawValue, 10));
                this.pict.AppData.RecordBrowser.PageSize = tmpSize;
                // Reset to start of range when page size changes — keeps behavior predictable.
                this.pict.AppData.RecordBrowser.CursorStart = 0;
                if (tmpTable) {
                  tmpProvider.loadRecords(tmpTable, 0, tmpSize);
                } else {
                  tmpProvider.refreshRecordBrowserViewData();
                  this.render();
                }
                break;
              }
            case 'change-start':
              {
                let tmpStart = this._clampStart(parseInt(pRawValue, 10));
                this.pict.AppData.RecordBrowser.CursorStart = tmpStart;
                if (tmpTable) {
                  tmpProvider.loadRecords(tmpTable, tmpStart, this._clampSize(this.pict.AppData.RecordBrowser.PageSize));
                } else {
                  tmpProvider.refreshRecordBrowserViewData();
                  this.render();
                }
                break;
              }
          }
        }
        _clampStart(pValue) {
          let tmpN = parseInt(pValue, 10);
          if (isNaN(tmpN) || tmpN < 0) return 0;
          return tmpN;
        }
        _clampSize(pValue) {
          let tmpN = parseInt(pValue, 10);
          if (isNaN(tmpN) || tmpN < 1) return 50;
          if (tmpN > 1000) return 1000;
          return tmpN;
        }
      }
      module.exports = PictViewDataBeaconRecordBrowser;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    41: [function (require, module, exports) {
      /**
       * DataBeacon Records Page (container view)
       *
       * Dedicated page for paging through table records. Hosts the RecordBrowser
       * sub-view only — SQL execution lives on its own page (see
       * PictView-DataBeacon-SQL.js) so the two workflows don't crowd each other.
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'Records',
        DefaultRenderable: 'DataBeacon-RecordsPage',
        DefaultDestinationAddress: '#DataBeacon-View-Records',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-RecordsPage-Template',
          Template: /*html*/`
<div class="records-view">
	<h1>Record Browser</h1>
	<div id="DataBeacon-RecordBrowser-Slot"></div>
</div>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-RecordsPage',
          TemplateHash: 'DataBeacon-RecordsPage-Template',
          ContentDestinationAddress: '#DataBeacon-View-Records',
          RenderMethod: 'replace'
        }]
      };
      class PictViewDataBeaconRecords extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onBeforeRender(pRenderable) {
          let tmpProvider = this.pict.providers.DataBeaconProvider;
          if (tmpProvider && typeof tmpProvider.refreshRecordBrowserViewData === 'function') {
            tmpProvider.refreshRecordBrowserViewData();
          }
          return super.onBeforeRender(pRenderable);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          if (this.pict.views.RecordBrowser) this.pict.views.RecordBrowser.render();
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
      }
      module.exports = PictViewDataBeaconRecords;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    42: [function (require, module, exports) {
      /**
       * DataBeacon SQL Page (container view)
       *
       * Dedicated page for ad-hoc SQL execution. Hosts the QueryPanel sub-view
       * so it has its own nav item (separated from record browsing).
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'SQL',
        DefaultRenderable: 'DataBeacon-SQLPage',
        DefaultDestinationAddress: '#DataBeacon-View-SQL',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-SQLPage-Template',
          Template: /*html*/`
<div class="sql-view">
	<h1>SQL Query</h1>
	<div id="DataBeacon-SavedQueries-Slot"></div>
	<div id="DataBeacon-QueryPanel-Slot"></div>
</div>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-SQLPage',
          TemplateHash: 'DataBeacon-SQLPage-Template',
          ContentDestinationAddress: '#DataBeacon-View-SQL',
          RenderMethod: 'replace'
        }]
      };
      class PictViewDataBeaconSQL extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          if (this.pict.views.SavedQueriesList) this.pict.views.SavedQueriesList.render();
          if (this.pict.views.QueryPanel) this.pict.views.QueryPanel.render();
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
      }
      module.exports = PictViewDataBeaconSQL;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    43: [function (require, module, exports) {
      /**
       * DataBeacon SavedQueriesList View
       *
       * Collapsible panel above the QueryPanel that lists saved SQL queries.
       * Handles Load / Edit / Delete actions and opens the shared save/edit
       * form modal (also used by QueryPanel's Save button). Persists via the
       * DataBeacon-SavedQueries provider.
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'SavedQueriesList',
        DefaultRenderable: 'DataBeacon-SavedQueriesList',
        DefaultDestinationAddress: '#DataBeacon-SavedQueries-Slot',
        AutoRender: false,
        CSS: /*css*/`
		.databeacon-saved-panel { padding: 0; }
		.databeacon-saved-header
		{
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			padding: 14px 20px;
			cursor: pointer;
			user-select: none;
		}
		.databeacon-saved-header h2 { margin: 0; font-size: 16px; font-weight: 600; }
		.databeacon-saved-header-right { display: flex; align-items: center; gap: 10px; color: var(--text-muted); font-size: 13px; }
		.databeacon-saved-body { padding: 0 20px 20px 20px; border-top: 1px solid var(--border-color); }
		.databeacon-saved-empty { color: var(--text-muted); padding: 16px 0; font-style: italic; }
		.databeacon-saved-row { }
		.databeacon-saved-row.is-active-query { background: color-mix(in srgb, var(--accent-primary) 15%, transparent); }
		.databeacon-saved-name { font-weight: 600; }
		.databeacon-saved-docpreview { color: var(--text-muted); font-size: 12px; margin-top: 2px; }
		.databeacon-saved-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
		.databeacon-saved-form-grid .full { grid-column: 1 / span 2; }
		.databeacon-saved-form-grid label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
		.databeacon-saved-form-grid input,
		.databeacon-saved-form-grid textarea,
		.databeacon-saved-form-grid select { width: 100%; }
		.databeacon-saved-form-grid textarea { min-height: 80px; resize: vertical; }
		.databeacon-saved-form-sqlpreview
		{
			background: var(--bg-input);
			color: var(--text-primary);
			border: 1px solid var(--border-color);
			border-radius: 4px;
			padding: 8px;
			font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
			font-size: 12px;
			max-height: 160px;
			overflow: auto;
			white-space: pre-wrap;
		}
	`,
        Templates: [{
          Hash: 'DataBeacon-SavedQueriesList-Template',
          Template: /*html*/`
<div id="DataBeacon-SavedQueries-Root" class="section databeacon-saved-panel">
	<div class="databeacon-saved-header" data-databeacon-action="toggle-panel">
		<h2>Saved Queries ({~D:AppData.SavedQueries.Count:0~})</h2>
		<div class="databeacon-saved-header-right">
			<span>{~D:AppData.SavedQueries.ToggleLabel~}</span>
			<span data-databeacon-icon="{~D:AppData.SavedQueries.ToggleIcon~}" data-icon-size="16"></span>
		</div>
	</div>
	{~TemplateIfAbsolute:DataBeacon-SavedQueriesList-Body:AppData.SavedQueries:AppData.SavedQueries.Expanded^TRUE^x~}
</div>`
        }, {
          Hash: 'DataBeacon-SavedQueriesList-Body',
          Template: /*html*/`
<div class="databeacon-saved-body">
	{~TemplateIfAbsolute:DataBeacon-SavedQueriesList-Empty:AppData.SavedQueries:AppData.SavedQueries.IsEmpty^TRUE^x~}
	{~TemplateIfAbsolute:DataBeacon-SavedQueriesList-Table:AppData.SavedQueries:AppData.SavedQueries.IsEmpty^FALSE^x~}
</div>`
        }, {
          Hash: 'DataBeacon-SavedQueriesList-Empty',
          Template: `<p class="databeacon-saved-empty">No saved queries yet. Write a query in the editor below and click <strong>Save</strong> to add one.</p>`
        }, {
          Hash: 'DataBeacon-SavedQueriesList-Table',
          Template: /*html*/`
<table class="data-table">
	<thead><tr><th>Name</th><th>Tags</th><th>Connection</th><th>Updated</th><th>Last Run</th><th>Rows</th><th>Actions</th></tr></thead>
	<tbody>{~TS:DataBeacon-SavedQueriesList-Row:AppData.SavedQueries.List~}</tbody>
</table>`
        }, {
          Hash: 'DataBeacon-SavedQueriesList-Row',
          Template: /*html*/`
<tr class="databeacon-saved-row {~D:Record.ActiveClass~}">
	<td>
		<div class="databeacon-saved-name">{~D:Record.Name~}</div>
		<div class="databeacon-saved-docpreview">{~D:Record.DocumentationPreview~}</div>
	</td>
	<td>{~D:Record.TagsDisplay~}</td>
	<td>{~D:Record.ConnectionLabel~}</td>
	<td>{~D:Record.DateUpdatedDisplay~}</td>
	<td>{~D:Record.DateLastRunDisplay~}</td>
	<td>{~D:Record.LastRowCountDisplay~}</td>
	<td class="actions-cell">
		<button class="btn btn-small btn-primary" data-databeacon-action="load" data-guid="{~D:Record.GUIDSavedQuery~}">
			<span data-databeacon-icon="play" data-icon-size="14"></span> Load
		</button>
		<button class="btn btn-small btn-secondary" data-databeacon-action="edit" data-guid="{~D:Record.GUIDSavedQuery~}">
			<span data-databeacon-icon="info" data-icon-size="14"></span> Edit
		</button>
		<button class="btn btn-small btn-danger" data-databeacon-action="delete" data-guid="{~D:Record.GUIDSavedQuery~}">
			<span data-databeacon-icon="trash" data-icon-size="14"></span> Delete
		</button>
	</td>
</tr>`
        }, {
          Hash: 'DataBeacon-SavedQueryForm-Body',
          Template: /*html*/`
<div class="databeacon-saved-form-grid">
	<div class="full">
		<label for="databeacon-savedform-name">Name</label>
		<input type="text" id="databeacon-savedform-name" value="{~D:AppData.SavedQueryForm.Name~}" placeholder="e.g. Active users in last 30 days" />
	</div>
	<div class="full">
		<label for="databeacon-savedform-doc">Documentation</label>
		<textarea id="databeacon-savedform-doc" placeholder="What does this query do? Parameters, edge cases, notes.">{~D:AppData.SavedQueryForm.Documentation~}</textarea>
	</div>
	<div>
		<label for="databeacon-savedform-tags">Tags / Folder (comma-separated)</label>
		<input type="text" id="databeacon-savedform-tags" value="{~D:AppData.SavedQueryForm.TagsDisplay~}" placeholder="analytics, users" />
	</div>
	<div>
		<label for="databeacon-savedform-conn">Associated Connection</label>
		<select id="databeacon-savedform-conn">
			<option value="">— None —</option>
			{~TS:DataBeacon-SavedQueryForm-ConnectionOption:AppData.SavedQueryForm.ConnectionOptions~}
		</select>
	</div>
	<div class="full">
		<label>SQL</label>
		<div class="databeacon-saved-form-sqlpreview">{~D:AppData.SavedQueryForm.SQLDisplay~}</div>
	</div>
</div>`
        }, {
          Hash: 'DataBeacon-SavedQueryForm-ConnectionOption',
          Template: `<option value="{~D:Record.IDBeaconConnection~}" {~D:Record.SelectedAttr~}>{~D:Record.Label~}</option>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-SavedQueriesList',
          TemplateHash: 'DataBeacon-SavedQueriesList-Template',
          ContentDestinationAddress: '#DataBeacon-SavedQueries-Slot',
          RenderMethod: 'replace'
        }]
      };
      class PictViewDataBeaconSavedQueriesList extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          let tmpIcons = this.pict.providers['DataBeacon-Icons'];
          if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-SavedQueries-Root');
          let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-SavedQueries-Root');
          if (tmpRootList && tmpRootList.length > 0) {
            tmpRootList[0].addEventListener('click', pEvent => {
              let tmpTarget = pEvent.target.closest('[data-databeacon-action]');
              if (!tmpTarget) return;
              this._handleAction(tmpTarget.getAttribute('data-databeacon-action'), tmpTarget.dataset);
            });
          }
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
        _handleAction(pAction, pData) {
          let tmpProvider = this.pict.providers['DataBeacon-SavedQueries'];
          if (!tmpProvider) return;
          switch (pAction) {
            case 'toggle-panel':
              tmpProvider.toggleExpanded();
              break;
            case 'load':
              this._loadRecord(pData && pData.guid);
              break;
            case 'edit':
              this.openEditModal(pData && pData.guid);
              break;
            case 'delete':
              this._deleteRecord(pData && pData.guid);
              break;
          }
        }
        _loadRecord(pGUID) {
          let tmpProvider = this.pict.providers['DataBeacon-SavedQueries'];
          let tmpRecord = tmpProvider ? tmpProvider.get(pGUID) : null;
          if (!tmpRecord) return;
          // Push SQL into editor + active-query pointer.
          let tmpEditor = this.pict.views.SQLEditor;
          if (tmpEditor && typeof tmpEditor.setCode === 'function') {
            tmpEditor.setCode(tmpRecord.SQL || '');
          }
          if (!this.pict.AppData.QueryPanel) this.pict.AppData.QueryPanel = {
            SQL: ''
          };
          this.pict.AppData.QueryPanel.SQL = tmpRecord.SQL || '';
          tmpProvider.setActiveGUID(pGUID);
          // Auto-select the associated connection, if any.
          if (tmpRecord.IDBeaconConnection !== null && tmpRecord.IDBeaconConnection !== undefined) {
            this.pict.AppData.SelectedConnectionID = tmpRecord.IDBeaconConnection;
            let tmpDBProvider = this.pict.providers.DataBeaconProvider;
            if (tmpDBProvider && typeof tmpDBProvider.refreshIntrospectionViewData === 'function') {
              tmpDBProvider.refreshIntrospectionViewData();
            }
          }
          let tmpModal = this.pict.views.PictSectionModal;
          if (tmpModal && typeof tmpModal.toast === 'function') {
            tmpModal.toast(`Loaded “${tmpRecord.Name}” into the editor.`, {
              type: 'success'
            });
          }
        }
        _deleteRecord(pGUID) {
          let tmpProvider = this.pict.providers['DataBeacon-SavedQueries'];
          let tmpRecord = tmpProvider ? tmpProvider.get(pGUID) : null;
          if (!tmpRecord) return;
          let tmpModal = this.pict.views.PictSectionModal;
          if (!tmpModal || typeof tmpModal.confirm !== 'function') {
            tmpProvider.remove(pGUID);
            return;
          }
          tmpModal.confirm(`Delete saved query “${tmpRecord.Name}”?`, {
            title: 'Delete Saved Query',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            dangerous: true
          }).then(pConfirmed => {
            if (pConfirmed) tmpProvider.remove(pGUID);
          });
        }

        // ================================================================
        // Save / Edit form modal (shared entry — QueryPanel calls openSaveModal)
        // ================================================================

        /**
         * Open the save modal. If pSQL is provided it will be used as the SQL
         * to persist (Save case from QueryPanel). If pGUID is provided and
         * matches a saved record, the form pre-fills from it and defaults to
         * updating that record (unless pForceNew is true).
         *
         * @param {Object} pOptions
         * @param {string} [pOptions.GUID]     - Existing GUID when updating.
         * @param {string} [pOptions.SQL]      - Override SQL; defaults to the record's SQL (Edit) or current editor text (Save).
         * @param {boolean} [pOptions.EditMetadataOnly] - true = Edit mode (SQL read-only, metadata only); false = Save mode (SQL becomes record's SQL).
         */
        openSaveFormModal(pOptions) {
          let tmpOptions = pOptions || {};
          this._openForm({
            Mode: tmpOptions.EditMetadataOnly ? 'edit' : 'save',
            GUID: tmpOptions.GUID || null,
            SQL: typeof tmpOptions.SQL === 'string' ? tmpOptions.SQL : ''
          });
        }
        openEditModal(pGUID) {
          let tmpProvider = this.pict.providers['DataBeacon-SavedQueries'];
          let tmpRecord = tmpProvider ? tmpProvider.get(pGUID) : null;
          if (!tmpRecord) return;
          this._openForm({
            Mode: 'edit',
            GUID: pGUID,
            SQL: tmpRecord.SQL
          });
        }
        _openForm(pContext) {
          let tmpProvider = this.pict.providers['DataBeacon-SavedQueries'];
          let tmpModal = this.pict.views.PictSectionModal;
          if (!tmpProvider || !tmpModal) return;
          let tmpExisting = pContext.GUID ? tmpProvider.get(pContext.GUID) : null;
          let tmpIsEdit = pContext.Mode === 'edit';
          let tmpTitle = tmpIsEdit ? 'Edit Saved Query' : tmpExisting ? 'Save Query' : 'Save Query';

          // Seed the form's AppData branch so the template can read it.
          this.pict.AppData.SavedQueryForm = {
            Mode: pContext.Mode,
            GUID: pContext.GUID,
            Name: tmpExisting && tmpExisting.Name || '',
            Documentation: tmpExisting && tmpExisting.Documentation || '',
            TagsDisplay: tmpExisting && Array.isArray(tmpExisting.Tags) ? tmpExisting.Tags.join(', ') : '',
            SelectedConnectionID: tmpExisting && tmpExisting.IDBeaconConnection !== undefined ? tmpExisting.IDBeaconConnection : this.pict.AppData.SelectedConnectionID || null,
            SQLDisplay: pContext.SQL || tmpExisting && tmpExisting.SQL || '',
            ConnectionOptions: this._buildConnectionOptions(tmpExisting && tmpExisting.IDBeaconConnection !== undefined ? tmpExisting.IDBeaconConnection : this.pict.AppData.SelectedConnectionID || null)
          };
          let tmpContent = this.pict.parseTemplateByHash('DataBeacon-SavedQueryForm-Body', null);
          let tmpButtons;
          if (tmpIsEdit) {
            tmpButtons = [{
              Hash: 'save',
              Label: 'Save Changes',
              Style: 'primary'
            }, {
              Hash: 'cancel',
              Label: 'Cancel',
              Style: 'secondary'
            }];
          } else if (tmpExisting) {
            // Save-with-loaded-query: offer both update-in-place and save-as-new.
            tmpButtons = [{
              Hash: 'save-update',
              Label: 'Save Changes',
              Style: 'primary'
            }, {
              Hash: 'save-new',
              Label: 'Save as New',
              Style: 'secondary'
            }, {
              Hash: 'cancel',
              Label: 'Cancel',
              Style: 'secondary'
            }];
          } else {
            tmpButtons = [{
              Hash: 'save-new',
              Label: 'Save',
              Style: 'primary'
            }, {
              Hash: 'cancel',
              Label: 'Cancel',
              Style: 'secondary'
            }];
          }

          // After the modal renders, fill icon placeholders that may be inside the form body.
          let tmpIcons = this.pict.providers['DataBeacon-Icons'];
          tmpModal.show({
            title: tmpTitle,
            content: tmpContent,
            width: '620px',
            closeable: true,
            buttons: tmpButtons,
            onOpen: () => {
              if (tmpIcons) tmpIcons.injectIconPlaceholders('body');
            }
          }).then(pButtonHash => {
            if (!pButtonHash || pButtonHash === 'cancel') return;
            this._applyFormSubmission(pButtonHash, pContext, tmpExisting);
          });
        }
        _applyFormSubmission(pButtonHash, pContext, pExisting) {
          let tmpProvider = this.pict.providers['DataBeacon-SavedQueries'];
          if (!tmpProvider) return;
          let tmpName = this._readValue('#databeacon-savedform-name', pExisting && pExisting.Name || '');
          let tmpDoc = this._readValue('#databeacon-savedform-doc', pExisting && pExisting.Documentation || '');
          let tmpTagsRaw = this._readValue('#databeacon-savedform-tags', '');
          let tmpConnRaw = this._readValue('#databeacon-savedform-conn', '');
          let tmpConnID = tmpConnRaw === '' || tmpConnRaw === null ? null : parseInt(tmpConnRaw, 10);
          if (isNaN(tmpConnID)) tmpConnID = null;
          if (pButtonHash === 'save-update' && pExisting) {
            tmpProvider.update(pExisting.GUIDSavedQuery, {
              Name: tmpName,
              Documentation: tmpDoc,
              Tags: tmpTagsRaw,
              IDBeaconConnection: tmpConnID,
              SQL: pContext.SQL
            });
            tmpProvider.setActiveGUID(pExisting.GUIDSavedQuery);
          } else if (pButtonHash === 'save-new') {
            let tmpNew = tmpProvider.create({
              Name: tmpName,
              Documentation: tmpDoc,
              Tags: tmpTagsRaw,
              IDBeaconConnection: tmpConnID,
              SQL: pContext.SQL
            });
            if (tmpNew) tmpProvider.setActiveGUID(tmpNew.GUIDSavedQuery);
          } else if (pButtonHash === 'save' && pContext.Mode === 'edit' && pExisting) {
            // Edit mode — metadata only, SQL is not touched.
            tmpProvider.update(pExisting.GUIDSavedQuery, {
              Name: tmpName,
              Documentation: tmpDoc,
              Tags: tmpTagsRaw,
              IDBeaconConnection: tmpConnID
            });
          }
        }
        _readValue(pSelector, pFallback) {
          let tmpList = this.pict.ContentAssignment.getElement(pSelector);
          if (!tmpList || tmpList.length === 0) return pFallback || '';
          let tmpVal = tmpList[0].value;
          return typeof tmpVal === 'string' ? tmpVal : pFallback || '';
        }
        _buildConnectionOptions(pSelectedID) {
          let tmpConns = this.pict.AppData.Connections || [];
          let tmpOut = [];
          for (let i = 0; i < tmpConns.length; i++) {
            tmpOut.push({
              IDBeaconConnection: tmpConns[i].IDBeaconConnection,
              Label: `${tmpConns[i].Name} (${tmpConns[i].Type})`,
              SelectedAttr: tmpConns[i].IDBeaconConnection === pSelectedID ? 'selected' : ''
            });
          }
          return tmpOut;
        }
      }
      module.exports = PictViewDataBeaconSavedQueriesList;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    44: [function (require, module, exports) {
      /**
       * DataBeacon ThemeSwitcher View
       *
       * Sidebar-header widget with two icon buttons:
       *   - mode toggle  (sun / moon / monitor, cycles light/dark/system)
       *   - palette      (opens a pict-section-modal with theme tiles)
       *
       * Selecting a theme tile in the modal applies it via the Theme provider
       * and dismisses the modal. All DOM/event work flows through ContentAssignment
       * and data-databeacon-action delegation.
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'ThemeSwitcher',
        DefaultRenderable: 'DataBeacon-ThemeSwitcher',
        DefaultDestinationAddress: '#DataBeacon-ThemeSwitcher-Slot',
        AutoRender: false,
        CSS: /*css*/`
		.databeacon-theme-switcher
		{
			display: inline-flex;
			align-items: center;
			gap: 4px;
		}
		.databeacon-theme-switcher-btn
		{
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 28px;
			height: 28px;
			padding: 0;
			border: 1px solid var(--border-color);
			background: var(--bg-card);
			color: var(--text-secondary);
			border-radius: 4px;
			cursor: pointer;
			transition: background 0.12s, color 0.12s, border-color 0.12s;
		}
		.databeacon-theme-switcher-btn:hover
		{
			background: var(--bg-input);
			color: var(--text-primary);
			border-color: var(--accent-primary);
		}
		.databeacon-theme-switcher-btn svg { display: block; }

		.databeacon-theme-picker
		{
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 12px;
		}
		.databeacon-theme-tile
		{
			display: flex;
			flex-direction: column;
			gap: 6px;
			padding: 12px;
			border: 1px solid var(--border-color);
			background: var(--bg-card);
			color: var(--text-primary);
			border-radius: 6px;
			cursor: pointer;
			text-align: left;
			transition: border-color 0.12s, transform 0.12s;
		}
		.databeacon-theme-tile:hover
		{
			border-color: var(--accent-primary);
			transform: translateY(-1px);
		}
		.databeacon-theme-tile.is-current
		{
			border-color: var(--accent-primary);
			box-shadow: inset 0 0 0 1px var(--accent-primary);
		}
		.databeacon-theme-tile-header
		{
			display: flex;
			align-items: baseline;
			justify-content: space-between;
			gap: 8px;
		}
		.databeacon-theme-tile-name
		{
			font-weight: 600;
			font-size: 14px;
			color: var(--text-primary);
		}
		.databeacon-theme-tile-era
		{
			font-size: 11px;
			color: var(--text-muted);
		}
		.databeacon-theme-tile-swatches
		{
			display: flex;
			gap: 4px;
		}
		.databeacon-theme-tile-swatch
		{
			flex: 1;
			height: 24px;
			border: 1px solid var(--border-color);
			border-radius: 3px;
		}
		.databeacon-theme-tile-current-badge
		{
			font-size: 10px;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			color: var(--accent-primary);
		}
	`,
        Templates: [{
          Hash: 'DataBeacon-ThemeSwitcher-Template',
          Template: /*html*/`
<div id="DataBeacon-ThemeSwitcher-Root" class="databeacon-theme-switcher">
	<button type="button" class="databeacon-theme-switcher-btn" data-databeacon-action="cycle-mode" title="{~D:AppData.ThemeSwitcher.ModeTitle~}">
		<span data-databeacon-icon="{~D:AppData.ThemeSwitcher.ModeIcon~}" data-icon-size="16"></span>
	</button>
	<button type="button" class="databeacon-theme-switcher-btn" data-databeacon-action="open-theme-picker" title="Choose theme">
		<span data-databeacon-icon="palette" data-icon-size="16"></span>
	</button>
</div>`
        }, {
          Hash: 'DataBeacon-ThemeSwitcher-Modal',
          Template: /*html*/`
<div class="databeacon-theme-picker">{~TS:DataBeacon-ThemeSwitcher-Tile:AppData.ThemeSwitcher.Themes~}</div>`
        }, {
          Hash: 'DataBeacon-ThemeSwitcher-Tile',
          Template: /*html*/`
<button type="button" class="databeacon-theme-tile {~D:Record.SelectedClass~}" data-databeacon-action="apply-theme" data-theme-key="{~D:Record.Key~}">
	<div class="databeacon-theme-tile-header">
		<span class="databeacon-theme-tile-name">{~D:Record.Label~}</span>
		{~TIf:DataBeacon-ThemeSwitcher-Tile-CurrentBadge::Record.IsCurrent^TRUE^x~}
	</div>
	<div class="databeacon-theme-tile-era">{~D:Record.EraLabel~}</div>
	<div class="databeacon-theme-tile-swatches">
		<span class="databeacon-theme-tile-swatch" style="background: {~D:Record.Swatch1~};"></span>
		<span class="databeacon-theme-tile-swatch" style="background: {~D:Record.Swatch2~};"></span>
		<span class="databeacon-theme-tile-swatch" style="background: {~D:Record.Swatch3~};"></span>
		<span class="databeacon-theme-tile-swatch" style="background: {~D:Record.Swatch4~};"></span>
	</div>
</button>`
        }, {
          Hash: 'DataBeacon-ThemeSwitcher-Tile-CurrentBadge',
          Template: `<span class="databeacon-theme-tile-current-badge">Current</span>`
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-ThemeSwitcher',
          TemplateHash: 'DataBeacon-ThemeSwitcher-Template',
          ContentDestinationAddress: '#DataBeacon-ThemeSwitcher-Slot',
          RenderMethod: 'replace'
        }]
      };
      const _ModeIcons = {
        'light': {
          Icon: 'sun',
          Next: 'dark',
          Title: 'Light mode (click for dark)'
        },
        'dark': {
          Icon: 'moon',
          Next: 'system',
          Title: 'Dark mode (click for system)'
        },
        'system': {
          Icon: 'monitor',
          Next: 'light',
          Title: 'System mode (click for light)'
        }
      };
      class PictViewDataBeaconThemeSwitcher extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
          this._ModalListenerAttached = false;
        }
        onBeforeRender(pRenderable) {
          let tmpTheme = this.pict.providers['DataBeacon-Theme'];
          if (tmpTheme) {
            let tmpMode = tmpTheme.getCurrentMode();
            let tmpModeInfo = _ModeIcons[tmpMode] || _ModeIcons.system;
            if (!this.pict.AppData.ThemeSwitcher) this.pict.AppData.ThemeSwitcher = {};
            this.pict.AppData.ThemeSwitcher.ModeIcon = tmpModeInfo.Icon;
            this.pict.AppData.ThemeSwitcher.ModeTitle = tmpModeInfo.Title;
            this.pict.AppData.ThemeSwitcher.Themes = tmpTheme._buildThemeViewData();
          }
          return super.onBeforeRender(pRenderable);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          let tmpIcons = this.pict.providers['DataBeacon-Icons'];
          if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-ThemeSwitcher-Root');
          let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-ThemeSwitcher-Root');
          if (tmpRootList && tmpRootList.length > 0) {
            tmpRootList[0].addEventListener('click', pEvent => {
              let tmpBtn = pEvent.target.closest('[data-databeacon-action]');
              if (!tmpBtn) return;
              this._handleAction(tmpBtn.getAttribute('data-databeacon-action'), tmpBtn.dataset);
            });
          }

          // Delegate clicks on theme tiles inside the pict-section-modal.
          // The modal dialog lives at document.body level and is re-created on
          // each open/close, but its container element stays around; attaching
          // once on document is the most robust wiring.
          if (!this._ModalListenerAttached && typeof document !== 'undefined') {
            document.addEventListener('click', pEvent => {
              let tmpTile = pEvent.target.closest('[data-databeacon-action="apply-theme"]');
              if (!tmpTile) return;
              let tmpKey = tmpTile.getAttribute('data-theme-key');
              this._applyThemeFromTile(tmpKey);
            });
            this._ModalListenerAttached = true;
          }
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
        _handleAction(pAction) {
          let tmpTheme = this.pict.providers['DataBeacon-Theme'];
          if (!tmpTheme) return;
          if (pAction === 'cycle-mode') tmpTheme.cycleMode();else if (pAction === 'open-theme-picker') this._openPicker();
        }
        _openPicker() {
          let tmpModal = this.pict.views.PictSectionModal;
          if (!tmpModal) return;
          let tmpContent = this.pict.parseTemplateByHash('DataBeacon-ThemeSwitcher-Modal', null);
          tmpModal.show({
            title: 'Choose Theme',
            content: tmpContent,
            closeable: true,
            width: '560px'
          });
        }
        _applyThemeFromTile(pKey) {
          let tmpTheme = this.pict.providers['DataBeacon-Theme'];
          if (!tmpTheme || !pKey) return;
          tmpTheme.setTheme(pKey);
          let tmpModal = this.pict.views.PictSectionModal;
          if (tmpModal && typeof tmpModal.dismissModals === 'function') {
            tmpModal.dismissModals();
          }
        }
      }
      module.exports = PictViewDataBeaconThemeSwitcher;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }]
  }, {}, [23])(23);
});
//# sourceMappingURL=retold-databeacon.js.map
