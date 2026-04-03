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
      module.exports = {
        "name": "pict-view",
        "version": "1.0.67",
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
          "pict": "^1.0.348",
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
          "fable": "^3.1.63",
          "fable-serviceproviderbase": "^3.0.19"
        }
      };
    }, {}],
    10: [function (require, module, exports) {
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
          this.onAfterRender(pRenderable);
          const tmpAnticipate = this.fable.newAnticipate();
          if (pRenderable && pRenderable.RootRenderableViewHash === this.Hash) {
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
          return tmpAnticipate.wait(fCallback);
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
      "../package.json": 9,
      "fable-serviceproviderbase": 2
    }],
    11: [function (require, module, exports) {
      /**
       * Retold DataBeacon — Pict Application
       *
       * Main web application class for the DataBeacon web UI.
       */
      const libPictApplication = require('pict-application');
      const libDataBeaconProvider = require('./providers/Pict-Provider-DataBeacon.js');
      const libViewLayout = require('./views/PictView-DataBeacon-Layout.js');
      const libViewDashboard = require('./views/PictView-DataBeacon-Dashboard.js');
      const libViewConnections = require('./views/PictView-DataBeacon-Connections.js');
      const libViewIntrospection = require('./views/PictView-DataBeacon-Introspection.js');
      const libViewEndpoints = require('./views/PictView-DataBeacon-Endpoints.js');
      const libViewRecords = require('./views/PictView-DataBeacon-Records.js');
      class DataBeaconApplication extends libPictApplication {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
          this.serviceType = 'DataBeaconApplication';

          // Register the API provider
          this.pict.addProvider('DataBeaconProvider', libDataBeaconProvider.default_configuration, libDataBeaconProvider);

          // Register views
          this.pict.addView('Layout', libViewLayout.default_configuration, libViewLayout);
          this.pict.addView('Dashboard', libViewDashboard.default_configuration, libViewDashboard);
          this.pict.addView('Connections', libViewConnections.default_configuration, libViewConnections);
          this.pict.addView('Introspection', libViewIntrospection.default_configuration, libViewIntrospection);
          this.pict.addView('Endpoints', libViewEndpoints.default_configuration, libViewEndpoints);
          this.pict.addView('Records', libViewRecords.default_configuration, libViewRecords);
        }
        onAfterInitializeAsync(fCallback) {
          // Set up application state
          if (!this.pict.AppData) this.pict.AppData = {};
          this.pict.AppData.Connections = [];
          this.pict.AppData.AvailableTypes = [];
          this.pict.AppData.Tables = [];
          this.pict.AppData.Endpoints = [];
          this.pict.AppData.SelectedConnectionID = null;
          this.pict.AppData.SelectedTableName = null;
          this.pict.AppData.Records = [];
          this.pict.AppData.BeaconStatus = {
            Connected: false
          };
          this.pict.AppData.CurrentView = 'Dashboard';

          // Store reference on window for onclick handlers
          window.DataBeaconApp = this;

          // Render layout
          this.pict.views.Layout.render();

          // Load initial data
          let tmpProvider = this.pict.providers.DataBeaconProvider;
          if (tmpProvider) {
            tmpProvider.loadConnections();
            tmpProvider.loadAvailableTypes();
            tmpProvider.loadEndpoints();
            tmpProvider.loadBeaconStatus();
          }

          // Show dashboard by default
          this.navigateTo('Dashboard');
          return super.onAfterInitializeAsync(fCallback);
        }
        navigateTo(pViewName) {
          this.pict.AppData.CurrentView = pViewName;

          // Hide all content views, show the requested one
          let tmpViews = ['Dashboard', 'Connections', 'Introspection', 'Endpoints', 'Records'];
          for (let i = 0; i < tmpViews.length; i++) {
            let tmpEl = document.getElementById(`DataBeacon-View-${tmpViews[i]}`);
            if (tmpEl) {
              tmpEl.style.display = tmpViews[i] === pViewName ? 'block' : 'none';
            }
          }

          // Update nav active state
          let tmpNavItems = document.querySelectorAll('.nav-item');
          for (let i = 0; i < tmpNavItems.length; i++) {
            tmpNavItems[i].classList.remove('active');
            if (tmpNavItems[i].dataset.view === pViewName) {
              tmpNavItems[i].classList.add('active');
            }
          }

          // Trigger view-specific refresh
          if (this.pict.views[pViewName] && this.pict.views[pViewName].render) {
            this.pict.views[pViewName].render();
          }
        }
      }
      module.exports = DataBeaconApplication;
      module.exports.default_configuration = {};
    }, {
      "./providers/Pict-Provider-DataBeacon.js": 13,
      "./views/PictView-DataBeacon-Connections.js": 14,
      "./views/PictView-DataBeacon-Dashboard.js": 15,
      "./views/PictView-DataBeacon-Endpoints.js": 16,
      "./views/PictView-DataBeacon-Introspection.js": 17,
      "./views/PictView-DataBeacon-Layout.js": 18,
      "./views/PictView-DataBeacon-Records.js": 19,
      "pict-application": 5
    }],
    12: [function (require, module, exports) {
      /**
       * Retold DataBeacon — Browser Bundle Entry
       *
       * This file is the entry point for the Pict web application bundle.
       * Quackage (browserify) processes this file to produce retold-databeacon.js.
       */
      let libPictApplication = require('pict-application');
      let libPictView = require('pict-view');
      let libPictRouter = require('pict-router');

      // Application
      let libDataBeaconApplication = require('./Pict-Application-DataBeacon.js');

      // Provider
      let libDataBeaconProvider = require('./providers/Pict-Provider-DataBeacon.js');

      // Views
      let libViewLayout = require('./views/PictView-DataBeacon-Layout.js');
      let libViewDashboard = require('./views/PictView-DataBeacon-Dashboard.js');
      let libViewConnections = require('./views/PictView-DataBeacon-Connections.js');
      let libViewIntrospection = require('./views/PictView-DataBeacon-Introspection.js');
      let libViewEndpoints = require('./views/PictView-DataBeacon-Endpoints.js');
      let libViewRecords = require('./views/PictView-DataBeacon-Records.js');

      // Expose the application class on window for Pict.safeLoadPictApplication
      window.DataBeaconApplication = libDataBeaconApplication;
    }, {
      "./Pict-Application-DataBeacon.js": 11,
      "./providers/Pict-Provider-DataBeacon.js": 13,
      "./views/PictView-DataBeacon-Connections.js": 14,
      "./views/PictView-DataBeacon-Dashboard.js": 15,
      "./views/PictView-DataBeacon-Endpoints.js": 16,
      "./views/PictView-DataBeacon-Introspection.js": 17,
      "./views/PictView-DataBeacon-Layout.js": 18,
      "./views/PictView-DataBeacon-Records.js": 19,
      "pict-application": 5,
      "pict-router": 8,
      "pict-view": 10
    }],
    13: [function (require, module, exports) {
      /**
       * Retold DataBeacon — API Provider
       *
       * Pict provider for making REST API calls to the DataBeacon server.
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
              this.pict.AppData.Connections = pData.Connections || [];
            }
            if (this.pict.views.Dashboard) this.pict.views.Dashboard.render();
            if (this.pict.views.Connections) this.pict.views.Connections.render();
            if (fCallback) fCallback(pError, pData);
          });
        }
        createConnection(pConnectionData, fCallback) {
          this._apiCall('POST', '/beacon/connection', pConnectionData, (pError, pData) => {
            if (!pError && pData && pData.Success) {
              this.loadConnections();
            }
            if (fCallback) fCallback(pError, pData);
          });
        }
        updateConnection(pID, pConnectionData, fCallback) {
          this._apiCall('PUT', `/beacon/connection/${pID}`, pConnectionData, (pError, pData) => {
            if (!pError && pData && pData.Success) {
              this.loadConnections();
            }
            if (fCallback) fCallback(pError, pData);
          });
        }
        deleteConnection(pID, fCallback) {
          this._apiCall('DELETE', `/beacon/connection/${pID}`, null, (pError, pData) => {
            if (!pError && pData && pData.Success) {
              this.loadConnections();
            }
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
            }
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
            if (this.pict.views.Introspection) this.pict.views.Introspection.render();
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
              this.pict.AppData.Endpoints = pData.Endpoints || [];
            }
            if (this.pict.views.Endpoints) this.pict.views.Endpoints.render();
            if (this.pict.views.Dashboard) this.pict.views.Dashboard.render();
            if (fCallback) fCallback(pError, pData);
          });
        }

        // ================================================================
        // Records
        // ================================================================

        loadRecords(pTableName, pCap, fCallback) {
          this._apiCall('GET', `/1.0/${pTableName}s/0/${pCap || 50}`, null, (pError, pData) => {
            if (!pError && pData) {
              this.pict.AppData.Records = Array.isArray(pData) ? pData : pData.Records || [];
              this.pict.AppData.SelectedTableName = pTableName;
            }
            if (this.pict.views.Records) this.pict.views.Records.render();
            if (fCallback) fCallback(pError, pData);
          });
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
            if (!pError && pData) {
              this.pict.AppData.BeaconStatus = pData;
            }
            if (this.pict.views.Dashboard) this.pict.views.Dashboard.render();
            if (fCallback) fCallback(pError, pData);
          });
        }
      }
      module.exports = DataBeaconProvider;
      module.exports.default_configuration = {
        ProviderIdentifier: 'DataBeaconProvider',
        AutoInitialize: true,
        AutoRender: false
      };
    }, {
      "pict-view": 10
    }],
    14: [function (require, module, exports) {
      /**
       * DataBeacon Connections View
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'Connections',
        DefaultRenderable: 'DataBeacon-Connections',
        DefaultDestinationAddress: '#DataBeacon-View-Connections',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-Connections-Template',
          Template: '<div id="DataBeacon-Connections-Content" class="connections-view"></div>'
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-Connections',
          TemplateHash: 'DataBeacon-Connections-Template',
          DestinationAddress: '#DataBeacon-View-Connections'
        }]
      };
      class PictViewDataBeaconConnections extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender() {
          let tmpConnections = this.pict.AppData.Connections || [];
          let tmpTypes = this.pict.AppData.AvailableTypes || [];
          let tmpTypeOptions = '';
          for (let i = 0; i < tmpTypes.length; i++) {
            if (tmpTypes[i].Installed) tmpTypeOptions += `<option value="${tmpTypes[i].Type}">${tmpTypes[i].Type}</option>`;
          }
          if (!tmpTypeOptions) tmpTypeOptions = '<option value="MySQL">MySQL</option><option value="PostgreSQL">PostgreSQL</option><option value="MSSQL">MSSQL</option><option value="SQLite">SQLite</option>';
          let tmpHTML = `
	<h1>Database Connections</h1>
	<div class="section">
		<h2>Add Connection</h2>
		<div class="form-grid">
			<div class="form-group"><label>Name</label><input type="text" id="conn-name" placeholder="My Database" /></div>
			<div class="form-group"><label>Type</label><select id="conn-type">${tmpTypeOptions}</select></div>
			<div class="form-group"><label>Host</label><input type="text" id="conn-host" placeholder="localhost" /></div>
			<div class="form-group"><label>Port</label><input type="number" id="conn-port" placeholder="3306" /></div>
			<div class="form-group"><label>Database</label><input type="text" id="conn-database" placeholder="mydb" /></div>
			<div class="form-group"><label>Username</label><input type="text" id="conn-user" placeholder="root" /></div>
			<div class="form-group"><label>Password</label><input type="password" id="conn-password" /></div>
			<div class="form-group"><label>Description</label><input type="text" id="conn-description" /></div>
			<div class="form-group checkbox-group"><label><input type="checkbox" id="conn-autoconnect" /> Auto-connect on startup</label></div>
		</div>
		<div class="button-row"><button class="btn btn-primary" onclick="DataBeacon_createConnection()">Add Connection</button></div>
	</div>
	<div class="section">
		<h2>Saved Connections (${tmpConnections.length})</h2>
		${this._renderList(tmpConnections)}
	</div>`;
          let tmpEl = document.getElementById('DataBeacon-Connections-Content');
          if (tmpEl) tmpEl.innerHTML = tmpHTML;
          window.DataBeacon_createConnection = () => {
            this._createConnection();
          };
          window.DataBeacon_testConnection = id => {
            this.pict.providers.DataBeaconProvider.testConnection(id, (e, d) => {
              alert(d && d.Success ? 'Test OK!' : 'Failed: ' + (d ? d.Error : '?'));
            });
          };
          window.DataBeacon_connectConnection = id => {
            this.pict.providers.DataBeaconProvider.connectConnection(id);
          };
          window.DataBeacon_disconnectConnection = id => {
            this.pict.providers.DataBeaconProvider.disconnectConnection(id);
          };
          window.DataBeacon_deleteConnection = id => {
            if (confirm('Delete?')) this.pict.providers.DataBeaconProvider.deleteConnection(id);
          };
          window.DataBeacon_introspectConnection = id => {
            this.pict.providers.DataBeaconProvider.introspect(id, (e, d) => {
              if (d && d.Success) {
                this.pict.AppData.SelectedConnectionID = id;
                window.DataBeaconApp.navigateTo('Introspection');
              } else alert('Failed: ' + (d ? d.Error : '?'));
            });
          };
          return super.onAfterRender();
        }
        _renderList(pConnections) {
          if (pConnections.length === 0) return '<p class="empty-state">No connections yet.</p>';
          let tmpRows = '';
          for (let i = 0; i < pConnections.length; i++) {
            let c = pConnections[i];
            let cls = c.Connected ? 'badge-success' : c.Status === 'OK' ? 'badge-info' : c.Status === 'Failed' ? 'badge-error' : 'badge-neutral';
            let lbl = c.Connected ? 'Connected' : c.Status;
            let acts = c.Connected ? `<button class="btn btn-small btn-secondary" onclick="DataBeacon_introspectConnection(${c.IDBeaconConnection})">Introspect</button><button class="btn btn-small btn-warning" onclick="DataBeacon_disconnectConnection(${c.IDBeaconConnection})">Disconnect</button>` : `<button class="btn btn-small btn-primary" onclick="DataBeacon_connectConnection(${c.IDBeaconConnection})">Connect</button><button class="btn btn-small btn-secondary" onclick="DataBeacon_testConnection(${c.IDBeaconConnection})">Test</button>`;
            acts += `<button class="btn btn-small btn-danger" onclick="DataBeacon_deleteConnection(${c.IDBeaconConnection})">Delete</button>`;
            tmpRows += `<tr><td><strong>${c.Name}</strong></td><td>${c.Type}</td><td><span class="badge ${cls}">${lbl}</span></td><td>${c.Description || ''}</td><td class="actions-cell">${acts}</td></tr>`;
          }
          return `<table class="data-table"><thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Description</th><th>Actions</th></tr></thead><tbody>${tmpRows}</tbody></table>`;
        }
        _createConnection() {
          let t = document.getElementById('conn-type').value;
          let cfg = t === 'SQLite' ? {
            SQLiteFilePath: document.getElementById('conn-database').value
          } : {
            host: document.getElementById('conn-host').value || 'localhost',
            port: parseInt(document.getElementById('conn-port').value, 10) || undefined,
            database: document.getElementById('conn-database').value,
            user: document.getElementById('conn-user').value,
            password: document.getElementById('conn-password').value
          };
          this.pict.providers.DataBeaconProvider.createConnection({
            Name: document.getElementById('conn-name').value || 'Untitled',
            Type: t,
            Config: cfg,
            AutoConnect: document.getElementById('conn-autoconnect').checked,
            Description: document.getElementById('conn-description').value
          });
        }
      }
      module.exports = PictViewDataBeaconConnections;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 10
    }],
    15: [function (require, module, exports) {
      /**
       * DataBeacon Dashboard View
       *
       * Status overview: connection count, table count, endpoint count, beacon status.
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'Dashboard',
        DefaultRenderable: 'DataBeacon-Dashboard',
        DefaultDestinationAddress: '#DataBeacon-View-Dashboard',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-Dashboard-Template',
          Template: '<div class="dashboard" id="DataBeacon-Dashboard-Content"></div>'
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-Dashboard',
          TemplateHash: 'DataBeacon-Dashboard-Template',
          DestinationAddress: '#DataBeacon-View-Dashboard'
        }]
      };
      class PictViewDataBeaconDashboard extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender() {
          let tmpConnections = this.pict.AppData.Connections || [];
          let tmpEndpoints = this.pict.AppData.Endpoints || [];
          let tmpBeaconStatus = this.pict.AppData.BeaconStatus || {};
          let tmpConnectedCount = 0;
          for (let i = 0; i < tmpConnections.length; i++) {
            if (tmpConnections[i].Connected) tmpConnectedCount++;
          }
          let tmpBeaconClass = tmpBeaconStatus.Connected ? 'status-connected' : 'status-disconnected';
          let tmpBeaconLabel = tmpBeaconStatus.Connected ? 'Connected' : 'Not Connected';
          let tmpHTML = `
	<h1>DataBeacon Dashboard</h1>

	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-value">${tmpConnections.length}</div>
			<div class="stat-label">Database Connections</div>
			<div class="stat-detail">${tmpConnectedCount} active</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">${tmpEndpoints.length}</div>
			<div class="stat-label">Active Endpoints</div>
			<div class="stat-detail">REST API routes</div>
		</div>
		<div class="stat-card">
			<div class="stat-value ${tmpBeaconClass}">${tmpBeaconLabel}</div>
			<div class="stat-label">Ultravisor Beacon</div>
			<div class="stat-detail">${tmpBeaconStatus.BeaconName || 'retold-databeacon'}</div>
		</div>
	</div>

	<div class="section">
		<h2>Quick Actions</h2>
		<div class="button-row">
			<button class="btn btn-primary" onclick="window.DataBeaconApp.navigateTo('Connections')">Manage Connections</button>
			<button class="btn btn-secondary" onclick="window.DataBeaconApp.navigateTo('Endpoints')">View Endpoints</button>
		</div>
	</div>

	${this._renderConnectionSummary(tmpConnections)}`;
          let tmpEl = document.getElementById('DataBeacon-Dashboard-Content');
          if (tmpEl) {
            tmpEl.innerHTML = tmpHTML;
          }
          return super.onAfterRender();
        }
        _renderConnectionSummary(pConnections) {
          if (pConnections.length === 0) return '';
          let tmpRows = '';
          for (let i = 0; i < pConnections.length; i++) {
            let tmpConn = pConnections[i];
            let tmpStatusClass = tmpConn.Connected ? 'badge-success' : 'badge-neutral';
            let tmpStatusLabel = tmpConn.Connected ? 'Connected' : tmpConn.Status;
            tmpRows += `<tr><td>${tmpConn.Name}</td><td>${tmpConn.Type}</td><td><span class="badge ${tmpStatusClass}">${tmpStatusLabel}</span></td></tr>`;
          }
          return `
	<div class="section">
		<h2>Connections</h2>
		<table class="data-table">
			<thead><tr><th>Name</th><th>Type</th><th>Status</th></tr></thead>
			<tbody>${tmpRows}</tbody>
		</table>
	</div>`;
        }
      }
      module.exports = PictViewDataBeaconDashboard;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 10
    }],
    16: [function (require, module, exports) {
      /**
       * DataBeacon Endpoints View
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'Endpoints',
        DefaultRenderable: 'DataBeacon-Endpoints',
        DefaultDestinationAddress: '#DataBeacon-View-Endpoints',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-Endpoints-Template',
          Template: '<div id="DataBeacon-Endpoints-Content" class="endpoints-view"></div>'
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-Endpoints',
          TemplateHash: 'DataBeacon-Endpoints-Template',
          DestinationAddress: '#DataBeacon-View-Endpoints'
        }]
      };
      class PictViewDataBeaconEndpoints extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender() {
          let tmpEndpoints = this.pict.AppData.Endpoints || [];
          let tmpHTML = `
	<h1>Active REST Endpoints</h1>
	<div class="section"><div class="button-row"><button class="btn btn-secondary" onclick="DataBeacon_refreshEndpoints()">Refresh</button></div></div>
	${tmpEndpoints.length > 0 ? this._renderList(tmpEndpoints) : '<p class="empty-state">No dynamic endpoints enabled yet.</p>'}`;
          let tmpEl = document.getElementById('DataBeacon-Endpoints-Content');
          if (tmpEl) tmpEl.innerHTML = tmpHTML;
          window.DataBeacon_refreshEndpoints = () => {
            this.pict.providers.DataBeaconProvider.loadEndpoints();
          };
          window.DataBeacon_browseEndpoint = t => {
            this.pict.AppData.SelectedTableName = t;
            this.pict.providers.DataBeaconProvider.loadRecords(t, 50);
            window.DataBeaconApp.navigateTo('Records');
          };
          window.DataBeacon_openEndpoint = u => {
            window.open(u, '_blank');
          };
          return super.onAfterRender();
        }
        _renderList(pEndpoints) {
          let rows = '';
          for (let i = 0; i < pEndpoints.length; i++) {
            let ep = pEndpoints[i];
            rows += `<tr><td><strong>${ep.TableName}</strong></td><td>${ep.ConnectionType}</td><td><code>${ep.EndpointBase}</code></td><td class="actions-cell"><button class="btn btn-small btn-primary" onclick="DataBeacon_browseEndpoint('${ep.TableName}')">Browse</button> <button class="btn btn-small btn-secondary" onclick="DataBeacon_openEndpoint('${ep.EndpointBase}s/0/50')">API</button></td></tr>`;
          }
          return `<div class="section"><h2>Endpoints (${pEndpoints.length})</h2><table class="data-table"><thead><tr><th>Table</th><th>Type</th><th>Base</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table><div class="help-text"><p>CRUD: GET /1.0/{Table}s/{Begin}/{Cap}, GET /1.0/{Table}/{ID}, POST/PUT/DEL /1.0/{Table}</p></div></div>`;
        }
      }
      module.exports = PictViewDataBeaconEndpoints;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 10
    }],
    17: [function (require, module, exports) {
      /**
       * DataBeacon Introspection View
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'Introspection',
        DefaultRenderable: 'DataBeacon-Introspection',
        DefaultDestinationAddress: '#DataBeacon-View-Introspection',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-Introspection-Template',
          Template: '<div id="DataBeacon-Introspection-Content" class="introspection-view"></div>'
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-Introspection',
          TemplateHash: 'DataBeacon-Introspection-Template',
          DestinationAddress: '#DataBeacon-View-Introspection'
        }]
      };
      class PictViewDataBeaconIntrospection extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender() {
          let tmpCID = this.pict.AppData.SelectedConnectionID;
          let tmpTables = this.pict.AppData.Tables || [];
          let tmpConns = this.pict.AppData.Connections || [];
          let tmpOpts = '<option value="">-- Select Connection --</option>';
          for (let i = 0; i < tmpConns.length; i++) {
            if (tmpConns[i].Connected) {
              let sel = tmpConns[i].IDBeaconConnection === tmpCID ? ' selected' : '';
              tmpOpts += `<option value="${tmpConns[i].IDBeaconConnection}"${sel}>${tmpConns[i].Name} (${tmpConns[i].Type})</option>`;
            }
          }
          let tmpTableHTML = tmpTables.length > 0 ? this._renderTables(tmpTables, tmpCID) : '<p class="empty-state">Select a connected database and click Introspect.</p>';
          let tmpHTML = `
	<h1>Schema Introspection</h1>
	<div class="section">
		<div class="form-row">
			<div class="form-group"><label>Connection</label><select id="introspect-connection" onchange="DataBeacon_selectIntConn(this.value)">${tmpOpts}</select></div>
			<div class="form-group"><button class="btn btn-primary" onclick="DataBeacon_runIntrospect()" ${tmpCID ? '' : 'disabled'}>Introspect</button></div>
		</div>
	</div>
	${tmpTableHTML}
	<div id="DataBeacon-TableDetail" class="section" style="display:none;"></div>`;
          let tmpEl = document.getElementById('DataBeacon-Introspection-Content');
          if (tmpEl) tmpEl.innerHTML = tmpHTML;
          window.DataBeacon_selectIntConn = id => {
            this.pict.AppData.SelectedConnectionID = parseInt(id, 10) || null;
            if (id) this.pict.providers.DataBeaconProvider.loadTables(parseInt(id, 10));
          };
          window.DataBeacon_runIntrospect = () => {
            if (this.pict.AppData.SelectedConnectionID) this.pict.providers.DataBeaconProvider.introspect(this.pict.AppData.SelectedConnectionID);
          };
          window.DataBeacon_enableEndpoint = (cid, t) => {
            this.pict.providers.DataBeaconProvider.enableEndpoint(cid, t);
          };
          window.DataBeacon_disableEndpoint = (cid, t) => {
            this.pict.providers.DataBeaconProvider.disableEndpoint(cid, t);
          };
          window.DataBeacon_viewTableDetail = (cid, t) => {
            this._showDetail(cid, t);
          };
          return super.onAfterRender();
        }
        _renderTables(pTables, pCID) {
          let rows = '';
          for (let i = 0; i < pTables.length; i++) {
            let t = pTables[i];
            let btn = t.EndpointsEnabled ? `<button class="btn btn-small btn-warning" onclick="DataBeacon_disableEndpoint(${pCID},'${t.TableName}')">Disable</button>` : `<button class="btn btn-small btn-primary" onclick="DataBeacon_enableEndpoint(${pCID},'${t.TableName}')">Enable</button>`;
            let badge = t.EndpointsEnabled ? '<span class="badge badge-success">Active</span>' : '';
            rows += `<tr><td><a href="javascript:void(0)" onclick="DataBeacon_viewTableDetail(${pCID},'${t.TableName}')">${t.TableName}</a></td><td>${t.ColumnCount}</td><td>${t.RowCountEstimate || '--'}</td><td>${badge}</td><td class="actions-cell">${btn}</td></tr>`;
          }
          return `<div class="section"><h2>Discovered Tables (${pTables.length})</h2><table class="data-table"><thead><tr><th>Table</th><th>Columns</th><th>Est. Rows</th><th>Endpoint</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        }
        _showDetail(pCID, pTableName) {
          this.pict.providers.DataBeaconProvider.loadTableDetails(pCID, pTableName, (e, d) => {
            let el = document.getElementById('DataBeacon-TableDetail');
            if (!el) return;
            if (e || !d || !d.Columns) {
              el.innerHTML = '<p class="error">Failed.</p>';
              el.style.display = 'block';
              return;
            }
            let rows = '';
            for (let i = 0; i < d.Columns.length; i++) {
              let c = d.Columns[i];
              let pk = c.IsPrimaryKey ? '<span class="badge badge-info">PK</span>' : '';
              let ai = c.IsAutoIncrement ? '<span class="badge badge-neutral">AUTO</span>' : '';
              rows += `<tr><td><strong>${c.Name}</strong> ${pk} ${ai}</td><td>${c.NativeType}${c.MaxLength ? '(' + c.MaxLength + ')' : ''}</td><td>${c.MeadowType}</td><td>${c.Nullable ? 'YES' : 'NO'}</td><td>${c.DefaultValue || '--'}</td></tr>`;
            }
            el.innerHTML = `<h2>Table: ${pTableName}</h2><table class="data-table"><thead><tr><th>Column</th><th>Native Type</th><th>Meadow Type</th><th>Nullable</th><th>Default</th></tr></thead><tbody>${rows}</tbody></table>`;
            el.style.display = 'block';
          });
        }
      }
      module.exports = PictViewDataBeaconIntrospection;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 10
    }],
    18: [function (require, module, exports) {
      /**
       * DataBeacon Layout View
       *
       * Shell layout with sidebar navigation and content container.
       */
      const libPictView = require('pict-view');
      const _LayoutTemplate = `
<div class="app-container">
	<div class="sidebar">
		<div class="sidebar-header">
			<h2>DataBeacon</h2>
			<span class="version">v0.0.1</span>
		</div>
		<nav class="sidebar-nav">
			<div class="nav-item active" data-view="Dashboard" onclick="window.DataBeaconApp.navigateTo('Dashboard')">
				<span class="nav-icon">&#9632;</span> Dashboard
			</div>
			<div class="nav-item" data-view="Connections" onclick="window.DataBeaconApp.navigateTo('Connections')">
				<span class="nav-icon">&#9672;</span> Connections
			</div>
			<div class="nav-item" data-view="Introspection" onclick="window.DataBeaconApp.navigateTo('Introspection')">
				<span class="nav-icon">&#9881;</span> Introspection
			</div>
			<div class="nav-item" data-view="Endpoints" onclick="window.DataBeaconApp.navigateTo('Endpoints')">
				<span class="nav-icon">&#9889;</span> Endpoints
			</div>
			<div class="nav-item" data-view="Records" onclick="window.DataBeaconApp.navigateTo('Records')">
				<span class="nav-icon">&#9776;</span> Records
			</div>
		</nav>
	</div>
	<div class="main-content">
		<div id="DataBeacon-View-Dashboard" class="view-panel"></div>
		<div id="DataBeacon-View-Connections" class="view-panel" style="display:none;"></div>
		<div id="DataBeacon-View-Introspection" class="view-panel" style="display:none;"></div>
		<div id="DataBeacon-View-Endpoints" class="view-panel" style="display:none;"></div>
		<div id="DataBeacon-View-Records" class="view-panel" style="display:none;"></div>
	</div>
</div>`;
      const _ViewConfiguration = {
        ViewIdentifier: 'Layout',
        DefaultRenderable: 'DataBeacon-Layout',
        DefaultDestinationAddress: '#DataBeacon-App',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-Layout-Template',
          Template: _LayoutTemplate
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-Layout',
          TemplateHash: 'DataBeacon-Layout-Template',
          DestinationAddress: '#DataBeacon-App'
        }]
      };
      class PictViewDataBeaconLayout extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
      }
      module.exports = PictViewDataBeaconLayout;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 10
    }],
    19: [function (require, module, exports) {
      /**
       * DataBeacon Records View
       */
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: 'Records',
        DefaultRenderable: 'DataBeacon-Records',
        DefaultDestinationAddress: '#DataBeacon-View-Records',
        AutoRender: false,
        Templates: [{
          Hash: 'DataBeacon-Records-Template',
          Template: '<div id="DataBeacon-Records-Content" class="records-view"></div>'
        }],
        Renderables: [{
          RenderableHash: 'DataBeacon-Records',
          TemplateHash: 'DataBeacon-Records-Template',
          DestinationAddress: '#DataBeacon-View-Records'
        }]
      };
      class PictViewDataBeaconRecords extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender() {
          let tmpRecords = this.pict.AppData.Records || [];
          let tmpTableName = this.pict.AppData.SelectedTableName || '';
          let tmpEndpoints = this.pict.AppData.Endpoints || [];
          let tmpOpts = '<option value="">-- Select Table --</option>';
          for (let i = 0; i < tmpEndpoints.length; i++) {
            let sel = tmpEndpoints[i].TableName === tmpTableName ? ' selected' : '';
            tmpOpts += `<option value="${tmpEndpoints[i].TableName}"${sel}>${tmpEndpoints[i].TableName}</option>`;
          }
          let tmpTableContent = tmpRecords.length > 0 ? `<div class="section"><h2>${tmpTableName} (${tmpRecords.length} records)</h2>${this._buildTable(tmpRecords)}</div>` : tmpTableName ? '<p class="empty-state">No records found.</p>' : '<p class="empty-state">Select an enabled table and click Load Records.</p>';
          let tmpHTML = `
	<h1>Record Browser</h1>
	<div class="section">
		<div class="form-row">
			<div class="form-group"><label>Table</label><select id="records-table" onchange="DataBeacon_selectRecordTable(this.value)">${tmpOpts}</select></div>
			<div class="form-group"><button class="btn btn-primary" onclick="DataBeacon_loadRecords()" ${tmpTableName ? '' : 'disabled'}>Load Records</button></div>
		</div>
	</div>
	${tmpTableContent}
	<div id="DataBeacon-QueryPanel" class="section">
		<h2>Query Panel</h2>
		<div class="form-group"><label>SQL (SELECT only)</label><textarea id="query-sql" rows="3" placeholder="SELECT * FROM tablename LIMIT 50" class="query-input"></textarea></div>
		<div class="button-row"><button class="btn btn-primary" onclick="DataBeacon_executeQuery()">Execute</button></div>
		<div id="DataBeacon-QueryResults"></div>
	</div>`;
          let tmpEl = document.getElementById('DataBeacon-Records-Content');
          if (tmpEl) tmpEl.innerHTML = tmpHTML;
          window.DataBeacon_selectRecordTable = t => {
            this.pict.AppData.SelectedTableName = t;
            if (t) this.pict.providers.DataBeaconProvider.loadRecords(t, 50);
          };
          window.DataBeacon_loadRecords = () => {
            let t = this.pict.AppData.SelectedTableName;
            if (t) this.pict.providers.DataBeaconProvider.loadRecords(t, 50);
          };
          window.DataBeacon_executeQuery = () => {
            let sql = document.getElementById('query-sql').value;
            let cid = this.pict.AppData.SelectedConnectionID;
            if (!sql) {
              alert('Enter SQL');
              return;
            }
            if (!cid) {
              alert('Select a connection in Introspection first');
              return;
            }
            this.pict.providers.DataBeaconProvider.executeQuery(cid, sql, (e, d) => {
              let el = document.getElementById('DataBeacon-QueryResults');
              if (!el) return;
              if (e || !d || !d.Success) {
                el.innerHTML = `<p class="error">${d ? d.Error : 'Error'}</p>`;
                return;
              }
              el.innerHTML = d.Rows && d.Rows.length > 0 ? this._buildTable(d.Rows) : '<p class="empty-state">No results.</p>';
            });
          };
          return super.onAfterRender();
        }
        _buildTable(pRows) {
          if (!pRows || pRows.length === 0) return '';
          let keys = Object.keys(pRows[0]);
          let hdr = '<tr>' + keys.map(k => `<th>${k}</th>`).join('') + '</tr>';
          let body = '';
          let limit = Math.min(pRows.length, 100);
          for (let r = 0; r < limit; r++) {
            body += '<tr>';
            for (let c = 0; c < keys.length; c++) {
              let v = pRows[r][keys[c]];
              if (v === null || v === undefined) v = '<span class="null-value">NULL</span>';else if (typeof v === 'object') v = '<code>' + JSON.stringify(v).substring(0, 80) + '</code>';else {
                let s = String(v);
                if (s.length > 100) s = s.substring(0, 100) + '...';
                v = s;
              }
              body += `<td>${v}</td>`;
            }
            body += '</tr>';
          }
          return `<div class="table-scroll"><table class="data-table"><thead>${hdr}</thead><tbody>${body}</tbody></table></div>${pRows.length > 100 ? '<p class="help-text">Showing 100 of ' + pRows.length + '</p>' : ''}`;
        }
      }
      module.exports = PictViewDataBeaconRecords;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 10
    }]
  }, {}, [12])(12);
});
//# sourceMappingURL=retold-databeacon.js.map
