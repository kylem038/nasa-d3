// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"src/index.js":[function(require,module,exports) {
var endpoint = 'https://data.nasa.gov/resource/y77d-th95.json';
document.addEventListener("DOMContentLoaded", function (event) {
  fetch(endpoint).then(function (resp) {
    return resp.json();
  }).then(function (data) {
    var parsedData = parseData(data);
    drawChart(parsedData);
  }).catch(function (err) {
    console.log(err);
  });
});

var parseData = function parseData(data) {
  return data.map(function (impactData) {
    return {
      id: impactData.id,
      geolocation: impactData.geolocation,
      lat: impactData.reclat,
      long: impactData.reclong
    };
  });
};

var drawChart = function drawChart(parsedData) {
  console.log('draw chart'); // Set width and height of svg

  var svgWidth = 900;
  var svgHeight = 500;
  var scale = 153; // Set initial variables for zooming / panning

  var initX;
  var mouseClicked = false;
  var s = 1;
  var rotated = 90; //need to store this because on zoom end, using mousewheel, mouse position is NAN

  var mouse;
  var projection = d3.geoMercator().scale(scale).translate([svgWidth / 2, svgHeight / 1.5]);
  var path = d3.geoPath().projection(projection);
  var worldJSON = 'https://unpkg.com/world-atlas@1/world/110m.json';
  var zoom = d3.zoom().scaleExtent([1, 10]).on("zoom", zoomed).on('end', zoomended);
  var svg = d3.select('body').append('svg').attr('width', svgWidth).attr('height', svgHeight).on('wheel', function () {
    // zoomend needs mouse coords
    initX = d3.mouse(this)[0];
  }).on('mousedown', function () {
    if (s === 1) return;

    if (s > 1) {
      initX = d3.mouse(this)[0];
      mouseClicked = true;
    }
  }).call(zoom);
  var g = svg.append('g'); // Need to append containers in this order or the dots sit behind the map

  g.append('g').attr('class', 'boundary-container');
  g.append('g').attr('class', 'points-container');

  function rotateMap(endX) {
    projection.rotate([rotated + (endX - initX) * 360 / (s * svgWidth), 0, 0]);
    g.selectAll('path').attr('d', path);
  }

  function zoomed() {
    // Capture transform as list
    var t = [d3.event.transform.x, d3.event.transform.y]; // Reassign s to be value of k, which is the current zoom scale

    s = d3.event.transform.k; // Create height var

    var h = 0; // We want x to be the minimum value between the current zoom and the aspect ratio, the width * the zoom, or the current x

    t[0] = Math.min(svgWidth / svgHeight * (s - 1), Math.max(svgWidth * (1 - s), t[0])); // We want the y to be the min value of 0, the height minus the aspect ratio, or current y

    t[1] = Math.min(h * (s - 1) + h * s, Math.max(svgHeight * (1 - s) - h * s, t[1]));
    g.attr('transform', "translate(".concat(t, ")scale(").concat(s, ")"));
    d3.selectAll(".boundary").style("stroke-width", 1 / s);
    d3.selectAll('.point').attr('r', 0.01 / s);
    mouse = d3.mouse(this);

    if (s === 1 && mouseClicked) {
      rotateMap(mouse[0]);
      return;
    }
  }

  function zoomended() {
    if (s !== 1) return;
    rotated = rotated + (mouse[0] - initX) * 360 / (s * svgWidth);
    mouseClicked = false;
  }

  d3.json(worldJSON).then(function (world) {
    g.select('.boundary-container').append("g").attr("class", "boundary").selectAll("boundary").data(topojson.feature(world, world.objects.countries).features).enter().append("path").attr("d", path);
  }).catch(function (error) {
    return console.error(error);
  }); // Add points to the map with NASA data

  parsedData.forEach(function (point) {
    if (isNaN(point.long) || isNaN(point.lat)) return;
    g.select('.points-container').append('svg:circle').attr('r', 0.01).attr('class', 'point').attr('transform', "translate(".concat(projection([point.long, point.lat]), ")scale(").concat(scale, ")"));
  });
};
},{}],"../../../../../../usr/local/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "54354" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else {
        window.location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../../../../../usr/local/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","src/index.js"], null)
//# sourceMappingURL=/src.a2b27638.js.map