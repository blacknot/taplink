function setEventWrapper(t) {
	var tmp = t.addEventListener;
	t.addEventListener = function(on, fn, options) {
		var self = this;
		var fired = false;
		var cb = fn;
		
		if (['DOMContentLoaded', 'load'].indexOf(on) != -1) {
			fn = function(e) {
				if (fired) return;
				cb.call(self, e);
				fired = true;
			}
		}
		
		return tmp.call(self, on, fn, options);
	}
}

setEventWrapper(window);
setEventWrapper(document);

if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}
;(function() {
    // helpers
    var regExp = function(name) {
        return new RegExp('(^| )'+ name +'( |$)');
    };
    var forEach = function(list, fn, scope) {
        for (var i = 0; i < list.length; i++) {
            fn.call(scope, list[i]);
        }
    };

    // class list object with basic methods
    function ClassList(element) {
        this.element = element;
    }

    ClassList.prototype = {
        add: function() {
            forEach(arguments, function(name) {
                if (!this.contains(name)) {
                    this.element.className += ' '+ name;
                }
            }, this);
        },
        remove: function() {
            forEach(arguments, function(name) {
                this.element.className =
                    this.element.className.replace(regExp(name), '');
            }, this);
        },
        toggle: function(name, state) {
            return ((state == undefined && this.contains(name)) || state)
                ? (this.remove(name), false) : (this.add(name), true);
        },
        contains: function(name) {
            return regExp(name).test(this.element.className);
        }
        // bonus..
/*
        replace: function(oldName, newName) {
            this.remove(oldName), this.add(newName);
        }
*/
    };

    // IE8/9, Safari
    if (!('classList' in Element.prototype)) {
        Object.defineProperty(Element.prototype, 'classList', {
            get: function() {
                return new ClassList(this);
            }
        });
    }

    // replace() support for others
    if (window.DOMTokenList && DOMTokenList.prototype.replace == null) {
        DOMTokenList.prototype.replace = ClassList.prototype.replace;
    }
})();
(function () {
    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    }

    if (!Element.prototype.closest) {
        Element.prototype.closest = function (s) {
            var el = this;

            do {
                if (el.matches(s)) return el;
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        };
    }
})();
if (!Object.entries) {
  Object.entries = function( obj ){
    var ownProps = Object.keys( obj ),
        i = ownProps.length,
        resArray = new Array(i); // preallocate the Array
    while (i--)
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    
    return resArray;
  };
}
(function() {
  'use strict';

  if (self.fetch) {
    return
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = name.toString();
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = value.toString();
    }
    return value
  }

  function Headers(headers) {
    this.map = {}

    var self = this
    if (headers instanceof Headers) {
      headers.forEach(function(name, values) {
        values.forEach(function(value) {
          self.append(name, value)
        })
      })

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        self.append(name, headers[name])
      })
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  // Instead of iterable for now.
  Headers.prototype.forEach = function(callback) {
    var self = this
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      callback(name, self.map[name])
    })
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return fetch.Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new fetch.Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self
  }

  function Body() {
    this.bodyUsed = false


    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (!body) {
        this._bodyText = ''
      } else {
        throw new Error('unsupported BodyInit type')
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return fetch.Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return fetch.Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return fetch.Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : fetch.Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(function (text) {
          return JSON.parse(text);
      });
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(url, options) {
    options = options || {}
    this.url = url

    this.credentials = options.credentials || 'omit'
    this.headers = new Headers(options.headers)
    this.method = normalizeMethod(options.method || 'GET')
    this.mode = options.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && options.body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(options.body)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  var noXhrPatch =
    typeof window !== 'undefined' && !!window.ActiveXObject &&
      !(window.XMLHttpRequest && (new XMLHttpRequest).dispatchEvent);

  function getXhr() {
    // from backbone.js 1.1.2
    // https://github.com/jashkenas/backbone/blob/1.1.2/backbone.js#L1181
    if (noXhrPatch && !(/^(get|post|head|put|delete|options)$/i.test(this.method))) {
      this.usingActiveXhr = true;
      return new ActiveXObject("Microsoft.XMLHTTP");
    }
    return new XMLHttpRequest();
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this._initBody(bodyInit)
    this.type = 'default'
    this.url = null
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
  }

  Body.call(Response.prototype)

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    // TODO: Request constructor should accept input, init
    var request
    if (Request.prototype.isPrototypeOf(input) && !init) {
      request = input
    } else {
      request = new Request(input, init)
    }

    return new fetch.Promise(function(resolve, reject) {
      var xhr = getXhr();
      if (request.credentials === 'cors') {
        xhr.withCredentials = true;
      }

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return;
      }

      function onload() {
        if (xhr.readyState !== 4) {
          return
        }
        var status = (xhr.status === 1223) ? 204 : xhr.status
        if (status < 100 || status > 599) {
          reject(new TypeError('Network request failed'))
          return
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options))
      }
      xhr.onreadystatechange = onload;
      if (!self.usingActiveXhr) {
        xhr.onload = onload;
        xhr.onerror = function() {
          reject(new TypeError('Network request failed'))
        }
      }

      xhr.open(request.method, request.url, true)

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(name, values) {
        values.forEach(function(value) {
          xhr.setRequestHeader(name, value)
        })
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  fetch.Promise = self.Promise; // you could change it to your favorite alternative
  self.fetch.polyfill = true
})();
if (!Array.isArray) {
	Array.isArray = function(arg) {
		return Object.prototype.toString.call(arg) === '[object Array]';
	};
}
if (!Object.values) {
	Object.values = function values (object) {
	  return Object.keys(object).map(key => object[key]);
	};
}
(function(global){

//
// Check for native Promise and it has correct interface
//

var NativePromise = global['Promise'];
var nativePromiseSupported =
  NativePromise &&
  // Some of these methods are missing from
  // Firefox/Chrome experimental implementations
  'resolve' in NativePromise &&
  'reject' in NativePromise &&
  'all' in NativePromise &&
  'race' in NativePromise &&
  // Older version of the spec had a resolver object
  // as the arg rather than a function
  (function(){
    var resolve;
    new NativePromise(function(r){ resolve = r; });
    return typeof resolve === 'function';
  })();


//
// export if necessary
//

if (typeof exports !== 'undefined' && exports)
{
  // node.js
  exports.Promise = nativePromiseSupported ? NativePromise : Promise;
  exports.Polyfill = Promise;
}
else
{
  // AMD
  if (typeof define == 'function' && define.amd)
  {
    define(function(){
      return nativePromiseSupported ? NativePromise : Promise;
    });
  }
  else
  {
    // in browser add to global
    if (!nativePromiseSupported)
      global['Promise'] = Promise;
  }
}


//
// Polyfill
//

var PENDING = 'pending';
var SEALED = 'sealed';
var FULFILLED = 'fulfilled';
var REJECTED = 'rejected';
var NOOP = function(){};

function isArray(value) {
  return Object.prototype.toString.call(value) === '[object Array]';
}

// async calls
var asyncSetTimer = typeof setImmediate !== 'undefined' ? setImmediate : setTimeout;
var asyncQueue = [];
var asyncTimer;

function asyncFlush(){
  // run promise callbacks
  for (var i = 0; i < asyncQueue.length; i++)
    asyncQueue[i][0](asyncQueue[i][1]);

  // reset async asyncQueue
  asyncQueue = [];
  asyncTimer = false;
}

function asyncCall(callback, arg){
  asyncQueue.push([callback, arg]);

  if (!asyncTimer)
  {
    asyncTimer = true;
    asyncSetTimer(asyncFlush, 0);
  }
}


function invokeResolver(resolver, promise) {
  function resolvePromise(value) {
    resolve(promise, value);
  }

  function rejectPromise(reason) {
    reject(promise, reason);
  }

  try {
    resolver(resolvePromise, rejectPromise);
  } catch(e) {
    rejectPromise(e);
  }
}

function invokeCallback(subscriber){
  var owner = subscriber.owner;
  var settled = owner.state_;
  var value = owner.data_;  
  var callback = subscriber[settled];
  var promise = subscriber.then;

  if (typeof callback === 'function')
  {
    settled = FULFILLED;
    try {
      value = callback(value);
    } catch(e) {
      reject(promise, e);
    }
  }

  if (!handleThenable(promise, value))
  {
    if (settled === FULFILLED)
      resolve(promise, value);

    if (settled === REJECTED)
      reject(promise, value);
  }
}

function handleThenable(promise, value) {
  var resolved;

  try {
    if (promise === value)
      throw new TypeError('A promises callback cannot return that same promise.');

    if (value && (typeof value === 'function' || typeof value === 'object'))
    {
      var then = value.then;  // then should be retrived only once

      if (typeof then === 'function')
      {
        then.call(value, function(val){
          if (!resolved)
          {
            resolved = true;

            if (value !== val)
              resolve(promise, val);
            else
              fulfill(promise, val);
          }
        }, function(reason){
          if (!resolved)
          {
            resolved = true;

            reject(promise, reason);
          }
        });

        return true;
      }
    }
  } catch (e) {
    if (!resolved)
      reject(promise, e);

    return true;
  }

  return false;
}

function resolve(promise, value){
  if (promise === value || !handleThenable(promise, value))
    fulfill(promise, value);
}

function fulfill(promise, value){
  if (promise.state_ === PENDING)
  {
    promise.state_ = SEALED;
    promise.data_ = value;

    asyncCall(publishFulfillment, promise);
  }
}

function reject(promise, reason){
  if (promise.state_ === PENDING)
  {
    promise.state_ = SEALED;
    promise.data_ = reason;

    asyncCall(publishRejection, promise);
  }
}

function publish(promise) {
  var callbacks = promise.then_;
  promise.then_ = undefined;

  for (var i = 0; i < callbacks.length; i++) {
    invokeCallback(callbacks[i]);
  }
}

function publishFulfillment(promise){
  promise.state_ = FULFILLED;
  publish(promise);
}

function publishRejection(promise){
  promise.state_ = REJECTED;
  publish(promise);
}

/**
* @class
*/
function Promise(resolver){
  if (typeof resolver !== 'function')
    throw new TypeError('Promise constructor takes a function argument');

  if (this instanceof Promise === false)
    throw new TypeError('Failed to construct \'Promise\': Please use the \'new\' operator, this object constructor cannot be called as a function.');

  this.then_ = [];

  invokeResolver(resolver, this);
}

Promise.prototype = {
  constructor: Promise,

  state_: PENDING,
  then_: null,
  data_: undefined,

  then: function(onFulfillment, onRejection){
    var subscriber = {
      owner: this,
      then: new this.constructor(NOOP),
      fulfilled: onFulfillment,
      rejected: onRejection
    };

    if (this.state_ === FULFILLED || this.state_ === REJECTED)
    {
      // already resolved, call callback async
      asyncCall(invokeCallback, subscriber);
    }
    else
    {
      // subscribe
      this.then_.push(subscriber);
    }

    return subscriber.then;
  },

  'catch': function(onRejection) {
    return this.then(null, onRejection);
  }
};

Promise.all = function(promises){
  var Class = this;

  if (!isArray(promises))
    throw new TypeError('You must pass an array to Promise.all().');

  return new Class(function(resolve, reject){
    var results = [];
    var remaining = 0;

    function resolver(index){
      remaining++;
      return function(value){
        results[index] = value;
        if (!--remaining)
          resolve(results);
      };
    }

    for (var i = 0, promise; i < promises.length; i++)
    {
      promise = promises[i];

      if (promise && typeof promise.then === 'function')
        promise.then(resolver(i), reject);
      else
        results[i] = promise;
    }

    if (!remaining)
      resolve(results);
  });
};

Promise.race = function(promises){
  var Class = this;

  if (!isArray(promises))
    throw new TypeError('You must pass an array to Promise.race().');

  return new Class(function(resolve, reject) {
    for (var i = 0, promise; i < promises.length; i++)
    {
      promise = promises[i];

      if (promise && typeof promise.then === 'function')
        promise.then(resolve, reject);
      else
        resolve(promise);
    }
  });
};

Promise.resolve = function(value){
  var Class = this;

  if (value && typeof value === 'object' && value.constructor === Class)
    return value;

  return new Class(function(resolve){
    resolve(value);
  });
};

Promise.reject = function(reason){
  var Class = this;

  return new Class(function(resolve, reject){
    reject(reason);
  });
};

})(typeof window != 'undefined' ? window : typeof global != 'undefined' ? global : typeof self != 'undefined' ? self : this);
(function() { 'use strict';
	
Object.filter = (obj, predicate) => 
Object.keys(obj)
      .filter( key => predicate(obj[key]) )
      .reduce( (res, key) => Object.assign(res, { [key]: obj[key] }), {} );
      
      

let _ = {
	_checkIteratee(iteratee) {
		if (typeof iteratee != 'function') {
			let k = iteratee;
			iteratee = function(o) { return o[k]; }
		}
		
		return iteratee;
	},
	
	debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	},
	
	map(list, iteratee) {
		iteratee = this._checkIteratee(iteratee);
		
		let tmp = [];
		for(var i in list) if (list.hasOwnProperty(i)) tmp.push(iteratee(list[i], i));
		return tmp;
	},
	
	each(list, cb) {
		for(var i in list) if (list.hasOwnProperty(i)) cb(list[i], i);
	},
	
	size(list) {
		return Object.keys(list).length;
	},
	
	isNumber(n) {
		return this.isFloat(n) || this.isInteger(n);
	},

	isFloat(n) {
		return (n != null && n != undefined) && (parseFloat(n).toString() == n.toString());
	},

	isInteger(n) {
		return (n != null && n != undefined) && (parseInt(n).toString() == n.toString());
	},

	isObject(n) {
		return (n && typeof n === 'object' && !Array.isArray(n));
	},
	
	isArray(n) {
		return Array.isArray(n);
	},
	
	camelCase(value) {
		return value.replace( /-([a-z])/g, ( all, letter ) => {
			return letter.toUpperCase();
		});
	},
	
	isPlainObject(n) {
		let funcToString = Function.prototype.toString;
		var objectCtorString = funcToString.call(Object);
		
		let proto = Object.getPrototypeOf(n);
		if (proto === null) return true;
		let Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
		return typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
	},
	
	flatten(array, deep = false) {
      let result = [];
      this.each(array, v => {
	      if (Array.isArray(v)) {
		      result = this.concat(result, deep?this.flatten(v, deep):v);
	      } else {
		      result.push(v);
	      }
      })
      
      return result;
    },	
	
	has(o, key) {
		return o != null && hasOwnProperty.call(o, key);
	},
	
	clone(o) {
// 		return Object.assign({}, o);
		return JSON.parse(JSON.stringify(o));
	},
	
	uniq(o) {
		return o.filter((v, i, a) => a.indexOf(v) === i); 
	},
	
	concat() {
		if (!arguments.length) return undefined;
		
		let r = arguments[0];
		for (let i = 1; i < arguments.length; i++) r = r.concat(arguments[i]);
		return r;
	},
	
	intersect(a, b) {
		return Object.keys(a).filter(x => b.hasOwnProperty(x));
// 		return a.filter(x => b.includes(x));
	},
	
	intersection(a, b) {
		return Object.values(a).filter(x => b.indexOf(x));
	},
	
	compact(list) {
		var index = -1,
			length = list == null ? 0 : list.length,
			resIndex = 0,
			result = [];
		
		while (++index < length) {
			var value = list[index];
			if (value) result[resIndex++] = value;
		}
		return result;
	},
	
	pick(object, paths) {
		return this.pickBy(object, (v, k) => {
        	return paths.indexOf(k) != -1;
      	});
	},
	
	pickBy(object, predicate) {
		if (object == null) return {};
		let result = {};
		
		this.each(object, (v, k) => {
			if (predicate(v, k)) result[k] = v;
		});
		
		return result;
	},
	
	identity(value) {
		return value;
	},
	
	keys(o) {
		return Object.keys(o);
	},
	
	//target, ...source, deep = true
	merge() {
		let target = arguments[0];
		if (target == null) target = {};
// 		let output = this.clone(target); // Такой делать нельзя, так как если мы merge классов, то теряется prototype
		let output = Object.assign({}, target);
		let deep = false;
		
		if (typeof arguments[arguments.length - 1] == 'boolean') {
			deep = true;
			[].pop.apply(arguments);
		}
		
		for (let i = 1; i < arguments.length; i++) {
			let source = arguments[i];
			if (typeof target === 'object' && typeof source === 'object') {
// 			if (this.isObject(target) && this.isObject(source)) {
				_.each(source, (v, key) => { 
				//Object.keys(source).forEach(key => {
// 					if ((typeof v/* source[key] */ === 'object') && deep) {
					if (this.isObject(v) && deep) {
						if (!(key in output)) Object.assign(output, { [key]: v/* source[key] */ });
						else
							output[key] = this.merge(output[key], v/* source[key] */, deep);
					} else {
						Object.assign(output, { [key]: v/* source[key] */ });
					}
				});
			}
		}
		
		return output;
	},
	
	diff(a, b) {
		return Object.keys(a).filter(x => !b.hasOwnProperty(x));
//		return a.filter(x => !b.includes(x));
	},
	
	difference(a, b) {
		return a.filter(x => !b.includes(x));
	},
	
/*
	diff(a,b) {
	    let r = {};
	    _.each(a, (v, k) => {
	        if(b && b[k] != undefined && b[k] == v) return;
	        // but what if it returns an empty object? still attach?
	        r[k] = _.isObject(v) ? this.diff(v, b[k]) : v;

	        if (r[k] != undefined && _.isObject(r[k]) && _.size(r[k]) == 0) delete r[k];
        });
	    return r;
	},
*/	
	
	differenceWith(a, b, comparator) {
		if (comparator == undefined) comparator = this.isEqual;
		
		if (this.isObject(a)) {
		    let r = {};
		    _.each(a, (v,k) => {
		        if ((b[k] != undefined) && comparator(b[k], v)) return;
		        r[k] = (_.isObject(v) && b[k] != undefined) ? this.differenceWith(v, b[k], comparator) : v;
				
				if (r[k] != undefined && (_.isObject(r[k]) || _.isArray(r[k])) && _.size(r[k]) == 0) delete r[k];
	        });
	        
		    return r;
		} else {
			return a.filter(x => {
				for (let i in b) if (b.hasOwnProperty(i) && comparator(x, b[i])) return false;
				return true;
			});
		}
	},
	
	includes(collection, value, fromIndex) {
		collection = (typeof collection == 'object')?Object.values(collection):collection;
		fromIndex = fromIndex?fromIndex:0;
		
		return fromIndex <= collection.length && collection.indexOf(value, fromIndex) > -1;
	},
	
	symDiff(a, b) {
		return a.filter(x => !b.includes(x)).concat(b.filter(x => !a.includes(x)));
	},
	
	maxBy(array, iteratee) {
		iteratee = this._checkIteratee(iteratee);
		
		if (!array || !array.length) return undefined;
		
		let result = array[0];
		let key = iteratee(result);
		let tmp = null;
		for (let i = 1; i < array.length; i++) {
			if (key < (tmp = iteratee(array[i]))) {
				result = array[i];
				key = tmp;
			}
		}
		
		return result;
	},
	
	isEqual(a, b) {
        if ((typeof a == 'object') || (typeof a == 'array')) {
			return JSON.stringify(_.sort(a)) === JSON.stringify(_.sort(b));
		} else {
			return a === b;
		}
	},
	
	some(a, predicate) {
		if (typeof predicate == 'object') {
			let r = true;
			_.each(predicate, (v, k) => { r = r && (a[k] == v); })
			return r;
		} else {
			return (typeof predicate == 'function')?predicate(a):( (predicate == undefined)?a:(a == predicate) )
		}
	},
	
	filter(list, predicate) {
		let tmp = [];
		for (var i in list) if (list.hasOwnProperty(i) && this.some(list[i], predicate)) {
			tmp.push(list[i]);
		}
		
		return tmp;
	},
	
	find(list, predicate) {
		for (var i in list) if (list.hasOwnProperty(i) && this.some(list[i], predicate)) return list[i];
		return null;
	},
	
	findIndex(list, predicate) {
		for (var i in list) if (list.hasOwnProperty(i) && this.some(list[i], predicate)) return i;
		return -1;
	},
	
	sort(o) {
        let result = {};

        if (typeof o !== "object" || o === null) {
            if (parseInt(o) == o) return parseInt(o);
            return o;
        }

        Object.keys(o).sort().forEach((key) => {
            result[key] = this.sort(o[key]);
        });

        return result;
    },
	
	sortBy(list, key) {
		var keys = Object.keys(list);
		
		keys.sort(function(a, b) {
			let options = (typeof list[a][key] == typeof list[b][key] && typeof list[b][key] == 'number')?{'numeric': true}:undefined;
		    return list[a][key].toString().localeCompare(list[b][key].toString(), undefined, options);
		});
		
		let tmp = [];
		
		keys.forEach(function(k) {
		   tmp.push(list[k]);
		});
		
		return tmp;
	},
	
	sumBy(list, cb) {
		let tmp = 0;
		for(var i in list) if (list.hasOwnProperty(i)) tmp += cb(list[i], i);
		return tmp;
	},
	
	reduce(list, iteratee, accumulator) {
		for (var i in list) if (list.hasOwnProperty(i)) {
			accumulator = (accumulator == undefined)?list[i]:iteratee(accumulator, list[i]);
		}
		return accumulator;
	},
	
	sum(list, key = null) {
		return this.sumBy(list, (v, i) => { return key?v[key]:v; })
	},
	
	isEmpty(c) {
		return (c == null) || (c == '') || (Object.keys(c).length == 0);
	},
	
	values(obj) {
		var res = [];
	    for (var i in obj) {
	        if (obj.hasOwnProperty(i)) {
	            res.push(obj[i]);
	        }
	    }
		return res;
	}
}

window._ = _;

})();
(function( w, d ) { 'use strict';

let $mx = function(selector, context) {
	if (selector instanceof $mx) return selector;
	return new $mx.fn.init( selector, context );
}

let readyList = new Promise((resolve, reject) => {
	function completed() {
		d.removeEventListener( "DOMContentLoaded", completed );
		w.removeEventListener( "load", completed );
		resolve($mx);
		
		readyList = null;
	}
	
	d.addEventListener( "DOMContentLoaded", completed );
	w.addEventListener( "load", completed );
});

readyList.then(() => {
	$mx(document).trigger('ready');
});

let cssProps = { 
	float: "cssFloat" 
}

function checkSelector(selector) {
	selector = selector.replace(/\:(first|last)([\x20\t\r\n\f])?/ig, ':$1-child$2');
	selector = selector.replace(/\:(checkbox|password|radio|reset|submit|text)([\x20\t\r\n\f])?/ig, '[type=$1]$2');
	return selector;
}	

$mx.fn = $mx.prototype  = {
	length: 0,
	constructor: $mx,
	
	init: function(selector, context) {
		// Handle $(""), $(null), or $(undefined)
		if ( !selector ) return this;
		
		if (context instanceof $mx) context = context[0];
		if (selector instanceof $mx) return this.constructor(context).find(selector)

		if (typeof context == 'string') context = d.querySelector(checkSelector(context));

		// Handle $(DOMElement)
		let isWin = $mx.isWindow(selector);
		if ( selector.nodeType || isWin ) {
			if (selector.nodeType == 1 || selector.nodeType == 9 || isWin) {
				this[0] = selector;
				this.length = 1;
			}

			return this;
		}
		
		if (Array.isArray(selector) || (selector instanceof HTMLCollection)) {
			this.length = 0;
			for (let i = 0; i < selector.length; i++) {
				if (selector[i].nodeType == 1) {
					this[this.length] = selector[i];
					this.length++;
				}
			}
			return this;
		}
		
		if (typeof selector == 'function') {
			readyList?readyList.then(selector):selector($mx);
			return this;
		}		
		
		if (typeof selector == 'string') {
			
			let quickExpr = /^[^<]*(<[\w\W]+>)[^>]*$|^#([\w-]+)$/;
			let match = quickExpr.exec( selector );
						
			
			if (match && match[1]) {
				// HANDLE: $(html) -> $(array)
				let template = d.createElement('template');
				let html = selector.trim();
				template.innerHTML = html;
				this.length = 1;
				this[0] = template.content.firstChild;
			} else {
				if (!context || (context.nodeType != undefined)) {
					// HANDLE: $("#id")
// 						whitespace = "[\\x20\\t\\r\\n\\f]";
					let elem = (context || d).querySelectorAll(checkSelector(selector));
					
					if (elem && elem.length) {
						this.length = elem.length;
						for (let i = 0; i < elem.length; i++) this[i] = elem[i];
					}
				}
			}
			
			return this;
		}
		
		if (typeof selector == 'object') {
			this[this.length] = selector;
			this.length++;
			return this;
		}
	},
	
	children: function() {
		if (!this.length) return this;
		let childrens = [];
		
		this.each((elem) => {
			childrens = _.concat(childrens, Array.prototype.slice.call(elem.children));
		});		
		
		return $mx(childrens);
	},
	
	parent: function(selector) {
		if (!this.length) return this;
	    let parents = [];
		
		this.each((elem) => {
			if (selector) {
				while (elem = elem.parentNode) {
					if ((typeof elem.matches == 'function')?elem.matches(selector):elem.matchesSelector(selector)) break;
				}
			} else {
				elem = elem.parentNode;
			}
			
			parents.push(elem);
		})

		return $mx(parents);
	},
		
	parents: function() {
	    let parents = [];
		
		this.each((o) => {
		    let p = this[0].parentNode;
		    while (p !== document) {
		        var o = p;
		        parents.push(o);
		        p = o.parentNode;
		    }
		})

	    parents.push(document);
	    return $mx(_.uniq(parents));
	},
	
	find: function(selector) {
		return this.length?$mx(selector, this[0]):this;
	},
	
	closest: function(selector) {
		return $mx(this.length?this[0].closest(selector):null);
	},
	
	attr: function(name, value) {
		if (value) {
			this.each(o => o.setAttribute(name, value));
			return this;
		} else {
			return this.length?this[0].getAttribute(name):null;
		}
	},
	
	removeAttr: function(name) {
		this.each(o => o.removeAttribute(name));
		return this;
	},
	
	hasAttr: function(a) {
		return typeof(this.attr(a)) != 'undefined';
	},
	
	get: function(idx) {
		return (this.length > idx)?$mx(this[idx]):null;
	},
	
	first: function() {
		return this.get(0);
	},
	
	each: function(cb) {
		for (let i = 0; i < this.length; i++) cb.apply(this[i], [this[i]]);
	},

	addClass: function(value, timeout) {
		_.each((value || "").split(/\s+/), (s) => {
			this.each(elem => elem.classList.add(s));
		});
		
		if (timeout != undefined) setTimeout(() => this.removeClass(value), timeout);
		return this;
	},
	
	removeClass: function(value) {
		if (!Array.isArray(value)) value = [value];
		
		_.each(value, v => {
			_.each((v || "").split(/\s+/), (s) => {
				this.each(elem => elem.classList.remove(s));
			})
		});
		
		return this;
	},
	
	hasClass: function(selector) {
		return this.length && this[0].classList.contains(selector);
	},
	
	toggleClass: function(value, state) {
		_.each((value || "").split(/\s+/), (s) => {
			this.each(elem => elem.classList.toggle(s, state));
		})

		return this;
	},
	
	remove() {
		this.each((elem) => { elem.remove(); });
		return this;
	},
		
	append: function(obj) {
		if (this.length) $mx(obj).each(o => this[0].appendChild(o))
		return this;
	},
	
	prepend: function(obj) {
		if (this.length) $mx(obj).each(o => this[0].insertBefore(o, this[0].children[0]))
		return this;
	},
	
	insertBefore: function(obj) {
		let element = $mx(obj)[0];
		return this.insertBeforeAfter(element, element)
	},
	
	insertAfter: function(obj) {
		let element = $mx(obj)[0];
		return this.insertBeforeAfter(element, element.nextSibling)
	},
	
	insertBeforeAfter: function(element, reference) {
		this.each((o) => {
			element.parentNode.insertBefore(o, reference);
		});
		
		return this;
	},
	
	appendTo: function(obj) {
		// obj = $mx(obj);
		// 
		// this.each((o) => {
		// 	obj.append(o);
		// });
		
		$mx(obj).append(this);
		
		return this;
	},
	
	prependTo: function(obj) {
		// obj = $mx(obj);
		// 
		// this.each((o) => {
		// 	obj.prepend(o);
		// });
		
		$mx(obj).prepend(this);
		return this;
	},
	
	data: function(name, values) {
		if (values != undefined || typeof name == 'object') {
			values = (typeof name == 'object')?name:{[name]: values}

			_.each(values, (v, i) => {
				i = _.camelCase(i);
				this.each(o => o.dataset[i] = v);
			});
			
			return this;
		} else {
			if (this.length) {
				function checkType(v) {
					if (_.isInteger(v)) return parseInt(v);
					if (_.isFloat(v)) return parseFloat(v);
					return v;
				}
				
				if (name) {
					return checkType(this[0].dataset[_.camelCase(name)]);
				} else {
					let r = {};
					_.each(this[0].dataset, (v, i) => { r[i] = checkType(v); })
					return r;
				}
			} else {
				return [];
			}
			return this.length?(name?this[0].dataset[name]:this[0].dataset):[];
		}
	},
	
	index: function(elem) {
		if (!this.length) return -1;
		let nodes = null;
		
		if (elem) {
			nodes = elem.childNodes;
		} else {
			nodes = this[0].parentNode?this[0].parentNode.childNodes:[this[0]];
		}

		for (let i = 0; i < nodes.length; i++) {
			if (nodes[i] == this[0]) return i;
		}
		
		return -1;
	},
	
	triggerHandler: function(eventName, detail) {
		return this.trigger(eventName, detail, true)
	},
	
	trigger: function(eventName, detail, onlyHandler) {
		eventName = eventName.split('.')[0];
		this.each((o) => {
			let event;
			if (window.CustomEvent) {
				event = new CustomEvent(eventName, {detail: detail});
			} else {
				event = document.createEvent('CustomEvent');
				event.initCustomEvent(eventName, true, true, detail);
			}
			
			Object.defineProperty(event, 'target', {writable: false, value: o});		

			if (o.dispatchEvent != undefined && !onlyHandler) {
				o.dispatchEvent(event);
			} else {
				// Не DOM события
				if (o.$tinyquery != undefined && o.$tinyquery[eventName] != undefined) {
					_.each(o.$tinyquery[eventName], (o) => {
						if (!Array.isArray(detail)) detail = [detail];
						detail.unshift(event);
						o.cb.apply(this, detail);
					});
				}
			}
			
			// Для selector event
			document.body.dispatchEvent(event);
		});
		
		return this;
	},
	
	_triggerEvent: function(e) {
		let obj = this;

		_.each(obj.$tinyquery[e.type], (o) => {
			let result = true;
			let target = e.target;
			
			if (o.selector) {
				do {
					if (target.nodeType == 1) {
						let matches = (typeof target.matches == 'function')?target.matches(o.selector):target.matchesSelector(o.selector);
						if (matches) result = o.cb.apply(target, [e]);
					}
				} while ((target = target.parentNode) && (target.nodeType != 9))
			} else {
				result = o.cb.apply(obj, [e]);
			}
			
			if (result === false) {
				e.preventDefault();
				e.stopPropagation();
			}
		})
	},
	
	on: function(types, selector, cb) {
		if (typeof selector == 'function') {
			cb = selector;
			selector = null;
		}

		if (cb == null || cb == undefined) return;
		
		let self = this;

		_.each(types.replace(/[ ]+/, ' ').split(' '), name => {
			name = name.split('.')[0];
			this.each((o) => {
				if (o.$tinyquery == undefined) o.$tinyquery = {};
				if (o.$tinyquery[name] == undefined) o.$tinyquery[name] = [];
				
				if (selector) {
					selector = checkSelector(selector);
					_.each(selector.replace(/[ ]+/, ' ').split(','), (s) => o.$tinyquery[name].push({selector: s, cb: cb}));
				} else {
					o.$tinyquery[name].push({cb: cb})
				}

				if (o.addEventListener != undefined) {
					o.addEventListener(name, self._triggerEvent);
				}
			});
		});

		return this;
	},
	
	one: function(types, selector, cb) {
		if (typeof selector == 'function') {
			cb = selector;
			selector = null;
		}

		let self = this;
		
		let cb2 = (e) => {
			cb.apply(this, [e]);
			self.off(types, selector, cb2);
		}
		
		return this.on(types, selector, cb2);
	},
	
	off: function(types, selector, cb) {
		if (typeof selector == 'function') {
			cb = selector;
			selector = null;
		}
		
		let self = this;

		_.each(types.replace(/[ ]+/, ' ').split(' '), name => {
			name = name.split('.')[0];
			this.each((o) => {
				// нет selector и нет cb, тость убираем все
				if (!selector && !cb) {
					o.removeEventListener(name, self._triggerEvent);
					if (o.$tinyquery != undefined && o.$tinyquery[name] != undefined) delete o.$tinyquery[name];
				} else {
					if (selector) {
						_.each(selector.replace(/[ ]+/, ' ').split(','), (s) => {
							if (o.$tinyquery != undefined && o.$tinyquery[name] != undefined) {
								for (let i = 0; i < o.$tinyquery[name].length; i++) {
									let event = o.$tinyquery[name][i];
									if ((event.selector == s) && ((event.cb == cb) || !cb)) {
										o.$tinyquery[name].splice(i, 1);
										break;
									}
								}
							}
						});
					} else {
						if (o.$tinyquery != undefined && o.$tinyquery[name] != undefined) {
							for (let i = 0; i < o.$tinyquery[name].length; i++) {
								let event = o.$tinyquery[name][i];
								if ((event.cb == cb) || !cb) {
									o.$tinyquery[name].splice(i, 1);
									break;
								}
							}
						}
					}
					
					if (o.$tinyquery != undefined && o.$tinyquery[name] != undefined && !o.$tinyquery[name].length) {
						o.removeEventListener(name, self._triggerEvent);
						delete o.$tinyquery[name];
					}
				}
			});
		});

		return this;
	},
	
	delegate: function (selector, types, fn) {
		return this.on(types, selector, fn);
	},
	
	undelegate: function (selector, types, fn) {
		return this.off(types, selector, fn);	
	},
	
	val: function(v) {
		if (v == undefined) {
			return (this.length && ['INPUT', 'TEXTAREA'].indexOf(this[0].tagName) != -1)?this[0].value:null;
		} else {
			this.each((o) => {
				if (['INPUT', 'TEXTAREA'].indexOf(o.tagName) != -1) o.value = v;
			})
			
			return this;
		}
	},
	
	is: function(selector) {
		if (!this.length) return false;
		return (typeof this[0].matches == 'function')?this[0].matches(selector):((typeof this[0].matchesSelector == 'function')?this[0].matchesSelector(selector):false);
	},
	
	has: function(target) {
		return this.filter((i, elem) => {
			let targets = $mx(target, elem);
			for (let i = 0; i < targets.length; i++) {
				if (elem.contains(targets[i])) return elem; 
			}

			return false;
		});
	},
	
	filter: function(cb) {
		if (typeof cb != 'function') return this.has(cb);
		
		let result = [];
		for (let i = 0; i < this.length; i++) {
			if (cb.apply(this[i], [i, this[i]])) result.push(this[i]);
		}

		return $mx(result);
	},
		
	html: function(v) {
		if (v != undefined) {
			if (v instanceof $mx) v = v.length?v[0].outerHTML:'';
			if (v.outerHTML != undefined) v = v.outerHTML;

			this.each((o) => {
				o.innerHTML = v;
			});
			
			return this;
		} else {
			return this.length?this[0].innerHTML:null;
		}
	},
	
	text: function(v) {
		if (v != undefined) {
			this.each((o) => {
				o.innerText = v;
			});
			
			return this;
		} else {
			return this.length?((typeof this[0].textContent == 'string')?this[0].textContent:this[0].innerText):'';
		}
	},
	
	clone() {
		return $mx(this.map(o => o.cloneNode(true)));
	},
	
	empty: function() {
		return this.html('');
	},
	
	hide() {
		return this.toggle(false);
	},
	
	show() {
		return this.toggle(true);
	},
	
	toggle(state) {
		this.each((o) => {
			o.style.display = (state == undefined)?((o.style.display == 'none')?'block':'none'):(state?'block':'none');
		});
		
		return this;
	},
	
	focus() {
		this.length && this[0].focus();
//		return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
	},
	
	viewportOffset: function() {
		if (this.length) {
			return this[0].getBoundingClientRect();
		} else {
			return {x: null, y: null, width: null, height: null, left: null, top: null, right: null, bottom: null};
		}
	},

	offset: function() {
		if (this.length) {
			var left = 0, top = 0;
			
			let elem = this[0];
			while (elem) {
				left += elem.offsetLeft;
				top += elem.offsetTop;
				elem = elem.offsetParent;
			}

			return {left: left, top: top}
		} else {
			return {left: null, top: null}
		}
		
	},
		
	position: function() {
		return this.length?{left: this[0].offsetLeft, top: this[0].offsetTop}:{left: null, top: null}
	},
	
	_scrollValue: function(method) {
		let props = { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }
		let elem = this[0];
		let win = $mx.isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
		return  win?win[props[method]]:elem[method];
	},
	
	scrollTop: function() {
		return this._scrollValue('scrollTop');
	},

	scrollLeft: function() {
		return this._scrollValue('scrollLeft');
	},
	
	next: function() {
		return this.length?$mx(this[0].nextElementSibling || this[0].nextSibling):this;
	},
	
	prev: function() {
		return this.length?$mx(this[0].previousElementSibling || this[0].previousSibling):this;
	},
	
	eq: function(idx) {
		return $mx((this.length > idx)?this[idx]:null);
	},
	
	css: function(name, value) {
		let normalValue = (n, v) => {
			if (['width', 'height', 'left', 'top', 'right', 'bottom'].indexOf(n) != -1 && _.isNumber(v)) {
				v += 'px';
			}
			
			return v;
		}
		
		let normalName = (n) => {
			return (cssProps[n] != undefined)?cssProps[n]:_.camelCase(n);
		}
		
		if (_.isObject(name)) {
			for (let i in name) {
				let cc = normalName(i);
				let vv = normalValue(cc, name[i]);
				this.each((o) => o.style[cc] = vv);
			}
			return this;
		} else {
			name = normalName(name);
			
			if (value !== undefined) {
				value = normalValue(name, value);
				this.each((o) => {
					o.style[name] = value;
				})
				return this;
			} else {
				var view = this[0].ownerDocument.defaultView;

				if (!view || !view.opener) view = window;
				return this[0].style[name] || view.getComputedStyle(this[0]).getPropertyValue(name) || null;
			}
		}
	},
			
	map: function(cb) {
		return _.map($mx.makeArray(this), p => cb.apply(p, [p]));
	},
	
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	},
	
	outerHeight: function() {
		let styles = window.getComputedStyle(this[0]);
		let margin = parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']);
		return this[0].offsetHeight + margin;
	},
	
	outerWidth: function() {
		let styles = window.getComputedStyle(this[0]);
		let margin = parseFloat(styles['marginLeft']) + parseFloat(styles['marginRight']);
		return this[0].offsetWidth + margin;
	},
	
	submit: function() {
		this.length && this[0].submit();
		return this;
	}
}

_.each(['click', 'resize', 'scroll', 'keypress', 'keydown', 'keyup', 'change', 'mouseenter', 'mouseleave', 'ready', 'load'], (name) => {
	$mx.fn[name] = function(selector, cb) {
		if (selector == undefined && cb == undefined) {
			return this.trigger(name);
		} else {
			return this.on(name, selector, cb);
		}
	}
});


_.each(['height', 'width'], (name) => {
	//_.each(['inner', 'outer', ''], (prefix) => {
		let func = name;//prefix?(prefix+name.substr(0, 1).toUpperCase() + name.substr(1)):name;
		$mx.fn[func] = function() { 
			if (this.length == 0) return null;

			let elem = this[0];
			
			let type = name.substr(0, 1).toUpperCase() + name.substr(1);
			
			if ($mx.isWindow(elem)) {
				// const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
				return elem['innerHeight'];
			} else if (elem.nodeType == 9) {
				let doc = elem.documentElement;
				return Math.max(
					elem.body["scroll" + type], doc["scroll" + type],
					elem.body["offset" + type], doc["offset" + type],
					doc["client" + type]
				);			
			} else {
				let style = w.getComputedStyle(this[0], null);
				return parseInt(style.getPropertyValue(func));
			}
		}
	//});
});

$mx.contains = function (context, elem) {
	context.contains(elem);
}

$mx.isWindow = function(obj) {
	return obj != null && obj === obj.window;
}

$mx.isFunction = function (obj) {
	return typeof obj === "function" && typeof obj.nodeType !== "number";
}

$mx.isset = function (a) {
	return typeof(a) != 'undefined' && a != null;
}

$mx.nvl = function(a,b) {
	return (typeof(a) == 'undefined' || a == null)?b:a;
}

$mx.param = function(obj, prefix) {
	var str = [];
	for (let p in obj) {
	    if (obj.hasOwnProperty(p)) {	
		    if (obj[p] == undefined) obj[p] = '';
		    if (typeof obj[p] == 'boolean') obj[p] = obj[p]?1:0;
		    let k = prefix ? prefix + "[" + p + "]" : p,
	        v = obj[p];
			str.push((v !== null && typeof v === "object") ?
	        $mx.param(v, k) :
	        encodeURIComponent(k) + "=" + ((v !== null)?encodeURIComponent(v):''));
	    }
  	}

  	return str.join("&");
}

$mx.getScript = function(url) {
	var a = document.createElement('script');
	a.type = 'text/javascript';
	a.src = url;
	document.head.appendChild(a);
}

$mx.extend = $mx.fn.extend = function() {
	let deep = false;
	let i = 0;
	let length = arguments.length;
	let extended = this;

	if (typeof arguments[0] == 'boolean') {
		deep = arguments[0];
		i++;
	}
	
	if (length > i+1) {
		extended = arguments[i];
		i++;
	}
	
	return _.merge(extended, arguments[i], deep);
};

$mx.each = function(list, cb) {
	for(let i in list) if (list.hasOwnProperty(i)) cb(i, list[i]);
}

$mx.makeArray = function(o) {
	let r = [];
	for (let i = 0; i < o.length; i++) r.push(o[i]);
	return r;
}

$mx.proxy = function(fn, context) {
	let args = Array.prototype.slice.call(arguments, 2);
	return function() {
		return fn.apply(context, args.concat(Array.prototype.slice.call(arguments)));
	}
}

$mx.fn.init.prototype = $mx.fn;
w.$mx = $mx;

})(window, document);
(function( w, d ) {
/*
	url
	method
	data
	headers
	onUploadProgress
*/
$mx.request = function(options)	{
	return new Promise((resolve, reject) => {
		let data = {
			headers: Object.assign($mx.nvl(options.headers, {}), {'X-Requested-With': 'XMLHttpRequest'}),
			method: options.method || 'get',
			mode: options.mode || 'cors', // 'same-origin'
			credentials: options.credentials || 'include' //'same-origin'
		}
		
// 		let func = null;

		let url = options.url;

		switch (data.method) {
			case 'get':
				options.data = options.data || options.json;
				url = options.url + (_.isEmpty(options.data)?'':('?'+$mx.param(options.data)));
				break;
			case 'post':
				if (options.json != undefined) {
					data.body = JSON.stringify(options.json);
					data.headers['Content-Type'] = 'application/json';
				} else {
					if (options.data instanceof FormData) {
						data.body = options.data;
					} else if (typeof options.data == 'object') {
						data.body = $mx.param(options.data);
						data.headers['Content-Type'] = 'application/x-www-form-urlencoded';
					} else {
						data.body = options.data;
					}
					
					if (options.headers != undefined) data.headers = Object.assign(data.headers, options.headers);
				}
				break;
		}
		
		fetch(url, data).then((r) => {
			let contentType = r.headers.get('Content-Type');
			let cb = (data) => {
				resolve({data: data, headers: r.headers, status: r.status})
			}
			
			if (r.status == 429) {
				setTimeout(() => {
					this.request(options).then(resolve).catch(reject);
				}, 1000);
			} else {
				if (r.status >= 400) {
					reject();
				} else {
					if (contentType.split(';')[0] == 'application/json') {
						r.json().then(cb).catch(reject);
					} else {
						r.text().then(cb).catch(reject);
					}
				}
			}
		}).catch(reject);
	})
}

$mx.get = function(url, data) {
	return $mx.request({url: url, method: 'get', data: data});
}
	
$mx.post = function(url, data) {
	return $mx.request({url: url, method: 'post', data: data});
}

})(window, document);

+function (w) { "use strict";
	
$mx.lazyScripts = [];
$mx.lazyScriptsLoading = [];
$mx.lazyScriptsPrefix = null;

$mx(function() {
	let ld = $mx('meta[name="lazy-scripts-prefix"]');
	$mx.lazyScriptsPrefix = ld.length?ld.attr('content'):'/s';
	
	$mx.lazyScripts = _.filter(_.flatten([].concat(
		$mx.makeArray($mx('script[src]').map(function() { 
			if (this.src.indexOf('//cdn.jsdelivr.net/combine/') != -1) {
				let m = this.src.match(/\/js\/[^\/\?\,]+/g); 
				if (m) {
					return _.map(m, s => s.substr(4));
				}
				return null;
			} else {
				let m = this.src.match(/([^\/\?]+)(\?[0-9\.]+)?$/); 
				return m?m[1]:null; 
			}
		})),
		
		$mx.makeArray($mx('link[rel=stylesheet]').map(function() { var m = this.href.match(/([^\/\?]+)(\?[0-9\.]+)?$/); return m?m[1]:null; }))
	)));
});


$mx.lazy = function(scripts, styles, delegate, attributes) {
	if (typeof styles == "function") {
		delegate = styles;
		styles = null;
	}
	
	if (styles == null || styles == undefined) {
		styles = [];
	}
	
	let lazyAmount = 0;
	let m = document.querySelector("link[type='text/css']").href.match(/\?([0-9\.]+)/);
	let scriptsVersion = m?m[0]:'';
	
	let onCompleteLazy = () => {
		lazyAmount--;
	
		if ((lazyAmount == 0) && (typeof delegate == "function")) {
			delegate();
		}
	}	

	let onloadedLazy = (filename) => {
		for (let y in $mx.lazyScriptsLoading[filename]) {
			$mx.lazyScriptsLoading[filename][y].apply();
		}
		
		$mx.lazyScripts.push(filename);
		delete $mx.lazyScriptsLoading[filename];
	}
	
	let loadScript = (filename) => {
		if ($mx.lazyScripts.indexOf(filename) != -1) {
			onCompleteLazy();
		} else {
			if ($mx.lazyScriptsLoading[filename] == undefined) $mx.lazyScriptsLoading[filename] = [];
			$mx.lazyScriptsLoading[filename].push(onCompleteLazy);
	
			var a = document.createElement('script');
// 			a.async = true;
			a.type = 'text/javascript';
			if (filename.indexOf('//') != -1) {
				a.src = filename;
			} else {
				a.src = $mx.lazyScriptsPrefix+'/js/'+filename+scriptsVersion;
			}
			
			if (attributes != undefined) {
				_.each(attributes, (v, k) => {
					a.setAttribute(k, v);
				});
			}
			
			a.onload = () => { onloadedLazy(filename) };
			document.head.appendChild(a);
		}
	}

	let loadStyle = (filename) => {
		if ($mx.lazyScripts.indexOf(filename) != -1) {
			onCompleteLazy();
		} else {
			if ($mx.lazyScriptsLoading[filename] == undefined) $mx.lazyScriptsLoading[filename] = [];
			$mx.lazyScriptsLoading[filename].push(onCompleteLazy);

			var c = document.createElement('link');
			c.setAttribute("rel", "stylesheet");
			c.setAttribute("type", "text/css");
			if (filename.substring(0, 2) == '//') {
				c.setAttribute("href", filename);
			} else {
				c.setAttribute("href", $mx.lazyScriptsPrefix+'/css/'+filename+scriptsVersion);
			}
			c.onload = () => { onloadedLazy(filename) };
			document.head.appendChild(c);
		}
	}
	
	if (typeof scripts == 'string') scripts = [scripts];
	if (typeof styles == 'string') styles = [styles];
	
	lazyAmount = scripts.length + styles.length;
	
	if (lazyAmount) {
		for (i = 0; i < scripts.length; i++) loadScript(scripts[i]);
		for (i = 0; i < styles.length; i++) loadStyle(styles[i]);
	} else {
		delegate();
	}
}

}(window);
+function (d, w) { "use strict";
	
	var observer_list_add = [];
	var observer_list_remove = [];
	
	$mx.observe = function(selector, onAdd, onRemove) {
		$mx(function() {
			if (onAdd) {
				$mx(selector).each(function() { onAdd.call(this, $mx(this)); });
				observer_list_add.push([selector, onAdd]);
			}
			
			if (onRemove) {
				observer_list_remove.push([selector, onRemove]);
			}
		});
	}
		
	$mx(function() {
		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

		if (!$mx.isset(MutationObserver)) {
			MutationObserver = function(callback) {
				this.onAdded = function(e) {
					callback([{ addedNodes: [e.target], removedNodes: [] }])
				}
				this.onRemoved = function(e) {
					callback([{ addedNodes: [], removedNodes: [e.target] }])
				}
			}
			
			MutationObserver.prototype.observe = function(target) {
				target.addEventListener('DOMNodeInserted', this.onAdded)
				target.addEventListener('DOMNodeRemoved', this.onRemoved)
			}
		
		}

		function matches(el, selector) {
			var fn = el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector
			return fn ? fn.call(el, selector) : false
		}
		
		function apply(nodes, list) {
			for (let i=0; i < list.length; i++) {
				let selector = list[i][0];
				let result = [];
			
				for (var j=0; j < nodes.length; j++) {
					let node = nodes[j];
					
					if (node.nodeType !== 1) continue;
					
					if (matches(node, selector)) {
						result.push(node);
					}
					
					let childs = node.querySelectorAll(selector);
					for (let c=0; c < childs.length; c++) result.push(childs[c]);
				}
				
				if (!result.length) continue;
				
				result.filter(function(node, id, self) {
					// Убираем дубли
					return self.indexOf(node) === id
				}).forEach(function(node) {
					list[i][1].call(node, $mx(node));
				})
			}
		}		
		
		var observer = new MutationObserver(function(mutations) {
			
			var addedNodes   = []
			var removedNodes = []
			
			mutations.forEach(function(mutation) {
				addedNodes.push.apply(addedNodes, mutation.addedNodes)
				removedNodes.push.apply(removedNodes, mutation.removedNodes)
			})		
			
			// filter moved elements (removed and re-added)
			for (var i = 0, len = removedNodes.length; i < len; ++i) {
				var index = addedNodes.indexOf(removedNodes[i])
				if (index > -1) {
					addedNodes.splice(index, 1)
					removedNodes.splice(i--, 1)
				}
			}		
			
			apply(addedNodes, observer_list_add);
			apply(removedNodes, observer_list_remove);
			
			addedNodes.length   = 0
			removedNodes.length = 0					
		})

		observer.observe(d.body, { childList: true, subtree: true });
	});
		
}(document, window);
function scrollIt(destination, direction = 'y', o = null, duration = 300, easing = 'linear', callback) {
	if (o == null) o = window;
	
	function getGlobalOffset(el) {
	    var x = 0, y = 0
	    while (el) {
	        x += el.offsetLeft
	        y += el.offsetTop
	        el = el.offsetParent
	    }
	    return { x: x, y: y }
	}

  const easings = {
    linear(t) {
      return t;
    },
/*
    easeInQuad(t) {
      return t * t;
    },
    easeOutQuad(t) {
      return t * (2 - t);
    },
    easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    easeInCubic(t) {
      return t * t * t;
    },
    easeOutCubic(t) {
      return (--t) * t * t + 1;
    },
    easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    easeInQuart(t) {
      return t * t * t * t;
    },
    easeOutQuart(t) {
      return 1 - (--t) * t * t * t;
    },
    easeInOutQuart(t) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
    },
    easeInQuint(t) {
      return t * t * t * t * t;
    },
    easeOutQuint(t) {
      return 1 + (--t) * t * t * t * t;
    },
    easeInOutQuint(t) {
      return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
    }
*/
  };
  
  
  function getPosition() {
	  return (direction == 'y')?((o != window)?o.scrollTop:o.pageYOffset):((o != window)?o.scrollLeft:o.pageXOffset);
  }

  const start = getPosition();
  const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();

  //const documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
  //const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;

  const destinationOffset = Math.max(0, Math.floor( typeof destination === 'number' ? destination : getGlobalOffset(typeof destination == 'string' ? document.querySelector(destination) : destination)[direction] ));
  //const destinationOffsetToScroll = Math.round(destinationOffset - start);
 
  //const destinationOffsetToScroll = Math.round(documentHeight - destinationOffset < windowHeight ? documentHeight - windowHeight : destinationOffset);
  
  if (('requestAnimationFrame' in window === false) || !duration) {
  	if (direction == 'y') {
	    o.scroll(0, destinationOffset);
    } else {
	    o.scroll(destinationOffset, 0);
    }

    if (callback) {
      callback();
    }
    return;
  }

  function scroll() {
    const now = 'now' in window.performance ? performance.now() : new Date().getTime();
    const time = Math.min(1, ((now - startTime) / duration));
    const timeFunction = easings[easing](time);
    let v = (timeFunction * (destinationOffset - start)) + start;

    if (direction == 'y') {
	    o.scroll(0, v);
    } else {
	    o.scroll(v, 0);
    }
    
    if (Math.ceil(Math.floor(v - destinationOffset)) == 0) {
      if (callback) {
        callback();
      }
      return;
    }

    requestAnimationFrame(scroll);
  }

  scroll();
}

$mx.scrollIt = scrollIt;

$mx.fn.scrollIt = function(duration = 300, direction = 'y', container = null, easing = 'linear', callback) {
	scrollIt(this[0], direction, container, duration, easing, callback);
	return this;
}
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());


document.addEventListener("DOMContentLoaded", function() {
	/*
		Статистика кликов
	*/
	$events.on('tap', function(e, o) {
		if (window.account.tariff_current != 'basic') {
			if (o.stat) {
				if (navigator.sendBeacon != undefined) {
					navigator.sendBeacon('/api/stat/'+o.stat+'/ping.json');
				} else {
					$mx.get('/api/stat/'+o.stat+'/ping.json');
				}
			}
			
			if (o.pixels != undefined) {
				_.each(o.pixels, p => {
// 					console.log(p);
					switch (p.name) {
						case 'fb':
							if (window.fbq != undefined) window.fbq('trackCustom', p.event, p.param?{custom_param:p.param}:undefined);
							break;
					}
				});
			}
		}
	});
		
	let eventStack = {
		list: {},
		binds: {},
		
		push(part, name) {
			if (this.list[part] == undefined) this.list[part] = [];
			
			if (this.binds[part] != undefined) {
				_.each(this.binds[part], (cb) => {
					cb(name);
				})
			}
			
			this.list[part].push(name);
		},
		
		bind(part, cb) {
			if (this.binds[part] == undefined) this.binds[part] = [];
			
			if (this.list[part] != undefined) {
				_.each(this.list[part], (v) => {
					cb(v);
				});
			}
			
			this.binds[part].push(cb);
		}
	}
	
	window.eventStack = eventStack;
	
	var ecommerceEvent = null;
	
	// Отправляет данные в Facebook Pixel о продаже
	var m = document.location.hash.match(/#paid:([a-zA-Z0-9\+\/\\\=]+)/);
	
	if (m) {
		var s = decodeURIComponent(escape(window.atob(m[1]))).split(':');
		var products = [];
		if (s[3] != undefined) products.push({id: s[3], name: (s[4] == undefined)?s[3]:s[4]})
		ecommerceEvent = {type: 'purchase', id: s[0], budget: parseFloat(s[1]), currency: s[2], contents: products, content_type: 'product'};
		document.location.hash = document.location.hash.replace(/#paid:([a-zA-Z0-9]+)/, '');

		// Если затирать #paid меняется hash и форма закрывается
		// Какая форма?
		// document.location.hash = document.location.hash.replace(/#paid:([a-zA-Z0-9]+)/, '');
	}
/*
	 else {
		$mx('[data-ecommerce-event]').each(function() {
			let tariffs = _.map($mx(this).data('ecommerce-event').split(','), (o) => { return {id: o, name: o} });
			ecommerceEvent = {type: 'detail', products: tariffs};
		});
	}
*/
	
	var google_index = 64;
	var google_codes = [];

	var googleTagsLoadedUrl = null;

	$mx.observe('.googletags', (g) => {
		g.removeClass('googletags');

		var d = g.data();
		
		if (!googleTagsLoadedUrl) googleTagsLoadedUrl = '//googletagmanager.com/gtag/js?id='+d.id;

		$mx.lazy(googleTagsLoadedUrl, function() {
		   	console.log('Init googletag:', d.id);
			
			var is_customer = g.is('.googleanalytics-customer');
			gtag('config', d.id, is_customer?{}:{user_id: d.uid});
			
			$events.on('navigate', (e, to) => {
				gtag('config', d.id, {'page_path': to.path});
				gtag('event', 'page_view', {send_to: d.id});
			});
		    
		    if (is_customer) { 
				$events.on('tap', (e, o) => {
					if (o.addons && o.addons['googleanalytics-goal'] != undefined) {
						var ev = JSON.parse(o.addons['googleanalytics-goal']);
						
						gtag('event', ev.a, {
						  event_category: ev.c,
						  send_to: d.id
						});
					}
				});
			}
			
			var paidHandler = function(e, p) {
				let data = {
					transaction_id: p.id,
					affiliation: 'Taplink',
					value: p.budget,
					currency: p.currency,
					send_to: d.id
				};
				
				let domain = document.location.host.split('.');
				domain = domain[domain.length - 2]+'.'+domain[domain.length - 1];

// 				$mx.request({method: 'post', url: '/api/system/log.json', json: {data: data, domain: document.location.host, is_customer: is_customer}});
				
				let isTaplink = ['taplink.ru', 'taplink.at'].indexOf(domain) != -1;
				
				// Отправляем по API
/*
				if (isTaplink && !is_customer) {
					gtag('event', 'purchase', data);
				}
*/
				
				if (!isTaplink && is_customer) {
					gtag('event', 'purchase', data);
				}
			}
			
			$mx(document).on('paid', paidHandler);
			if (ecommerceEvent && ecommerceEvent.type == 'purchase') paidHandler(null, ecommerceEvent);
			
			
			eventStack.bind('google', (name) => { gtag('event', name); });
		});
	});

	$mx.observe('.googleanalytics', (g) => {
		g.removeClass('googleanalytics');

		$mx.lazy('//www.google-analytics.com/analytics.js', function() {
				if (window.ga == undefined) return;
			
				google_index++;
				var name = String.fromCharCode(google_index);
				var d = g.data();
				
				if (google_codes.indexOf(d.id) != -1) return;
				google_codes.push(d.id);
			   	console.log('Init google: ', d.id);
				
				var is_customer = g.is('.googleanalytics-customer');
				
				ga('create', d.id, 'auto', name, is_customer?undefined:d.uid);

				if (d.require != undefined) {
					require = d.require.split(',');
					for (i = 0; i < require.length; i++) {
						ga(name+'.require', require[i]);
					}
				}

				ga(name+'.send', 'pageview');
				
				var hit = function(e, to) {
					ga(name+'.set', 'page', to.path);
					ga(name+'.send', 'pageview');
				}
				
			    $events.on('navigate', hit);
			    
				if (is_customer) { 
					$events.on('tap', (e, o) => {
						if (o.addons && o.addons['googleanalytics-goal'] != undefined) {
							var ev = JSON.parse(o.addons['googleanalytics-goal']);
							ga(name+'.send', 'event', ev.c, ev.a);
						}
					});
				}
				
				eventStack.bind('google', (n) => { ga(name+'.send', 'event', n); });
				
				var paidHandler = function(e, p) {
					ga(name+'.require', 'ecommerce');
					ga(name+'.ecommerce:addTransaction', {
						id: p.id,
						affiliation: 'Taplink',
						revenue: p.budget,
						currency: p.currency
					});
					
					ga(name+'.ecommerce:send');
				}
				
				$mx(document).on('paid', paidHandler);
				if (ecommerceEvent && ecommerceEvent.type == 'purchase') paidHandler(null, ecommerceEvent);
		});
	});
	
	var metrika_index = 64;
	var metrika_codes = [];
	$mx.observe('.yandexmetrika', (m) => {
		m.removeClass('yandexmetrika');
	    let d = m.data();
	   	console.log('Init metrika: ', d.id);
	    
	    if (d.simple) {
			let hit = function(e, to) {
				// без ?блабла
				let img = $mx('<img class="stat" src="https://mc.yandex.ru/watch/'+d.id+'?page-ref='+encodeURIComponent(document.referrer)+'&page-url='+encodeURIComponent(document.location.origin+document.location.pathname)+'&rn='+Math.random()+'">').load(() => img.remove());
				img.appendTo(document.body);
		    }
		    				    
		    $events.on('navigate', hit);
		    hit();

	    } else {
			(function (doc, w, c, m) {
		    (w[c] = w[c] || []).push(function() {
		       try {
			       if (metrika_codes.indexOf(d.id) != -1) return;
				       metrika_codes.push(d.id);
				        metrika_index++;
				        d.ecommerce = 'dataLayer_'+String.fromCharCode(metrika_index);
				        window[d.ecommerce] = window[d.ecommerce] || [];
				        
				        var counter = new Ya.Metrika2(d);
				        w['yaCounter'+d.id] = counter;
				        
				        let hit = function(e, to) {
					        counter.hit(to.path);
					    }
					    				    
					    $events.on('navigate', hit);
					    
					    if (m.is('.yandexmetrika-customer')) { 
						    window.$events.on('tap', (e, o) => {
								if (o.addons && o.addons['yandexmetrika-goal']) {
									counter.reachGoal(o.addons['yandexmetrika-goal']);
								}
							});
						    
	/*
							$mx(document.body).on('click', '[data-addons-yandexmetrika-goal]', function() {
								counter.reachGoal($mx(this).data('addons-yandexmetrika-goal'));
							});
	*/
						} else {
							$mx(doc).on('click', '[data-track-event="payment"]', function() {
								counter.reachGoal('payment');
							});
							
							let setUser = () => {
								if (window.account != undefined && window.account.profile_id) {
// 									console.log('metrika: set user_id:', window.account.profile_id);
									counter.setUserID(window.account.profile_id);
								}
							}
							
							window.$events.on('account:refresh', () => {
								setUser();
							});

							setUser();
						}
						
						var paidHandler = function(e, p) {
							var obj = {ecommerce: {}}
							
							if (p.currency != undefined) obj.ecommerce.currencyCode = p.currency;
							
							obj.ecommerce[p.type] = {
								products: p.products
							}
							
							if (p.type == 'purchase') obj['ecommerce'][p.type]['actionField'] = {
								id: p.id,
								revenue: p.budget
							}						
							
							window[d.ecommerce].push(obj);
						}
						
						eventStack.bind('metrika', (name) => { counter.reachGoal(name); })
						
						$mx(doc).on('paid', paidHandler);
						if (ecommerceEvent && ecommerceEvent.type == 'purchase') paidHandler(null, ecommerceEvent);
						
						
	// 					$mx(document).on('startup', () => { counter.reachGoal('startup'); });
		       } catch(e) { }
		    });
		
			$mx.lazy("https://cdn.jsdelivr.net/npm/yandex-metrica-watch/tag.js");
			
			})(document, window, "yandex_metrika_callbacks2", m);
		}
	});	
	
	$mx.observe('.facebookpixel', (p) => {
		p.removeClass('facebookpixel');
		
		!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
		n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
		n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
		t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
		document,'script','https://connect.facebook.net/en_US/fbevents.js');
				
		p.each(function() { fbq('init', p.data('id')); });
		fbq('track', 'PageView');
		
		$mx(document).on('click', '[data-track-event="payment"]', function() {
			fbq('track', 'InitiateCheckout');
		});
		
		var hit = function(e, to) {
			fbq('track', 'PageView', {url: to.path});
		}
		
		var paidHandler = function(e, p) {
			if (window.fbq != undefined) {
				fbq('track', 'Purchase', {content_type: 'product', value: p.budget, currency: p.currency});
			}
		}

		if (ecommerceEvent && ecommerceEvent.type == 'purchase') paidHandler(null, ecommerceEvent);
		
		var leadHandler = function(e, p) {
			if (window.fbq != undefined) {
				fbq('track', 'Lead');
			}
		}
		
		$events.on('viewProduct', function(e, p) {
			fbq('track', 'ViewContent', p);
		}, true);
		
		$events.on('lead', leadHandler);
		
		$events.on('navigate', hit);
	});

}, {once: true});

/*
$.nvl = function(a,b) {
	return (typeof(a) == 'undefined' || a == null)?b:a;
}

$.isset = function (a) {
	return typeof(a) != 'undefined';
}

$.fn.hasAttr = function(a) {
	return typeof($(this).attr(a)) != 'undefined';
}
*/

String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
}

/*
$.app = {
	body: 'body',
	isApplication: false,
	domain: '',
	init: function () {	}
}
*/

//  navigator.sendBeacon('/analytics', data); <- стату отправлять так

/*

$.go = function(d, is_native, is_replace) {
	$('.modal.in').modal('hide');
// 	$($.app.body).removeClass('open-menu')

	if (typeof(d) == 'undefined') d = document.location.href;
	i = d.indexOf("#");
	if (i != -1) d = d.substr(0, i);
	if (is_native) {
		document.location = d;
	} else {
		$mx.router.open(d, 'replace', null, null, null, is_replace);
	}
}
*/



function go(d) {
	if (typeof(d) == 'undefined') d = document.location.href;
	i = d.indexOf("#");
	if (i != -1) d = d.substr(0, i);
	document.location = d;
}

$mx(function() {
	$mx(document.body).on('click', 'a[href="#"]', function(e) {
      e.preventDefault();
    });	

	if (document.location.hash.indexOf('#event=') != -1) {
		var p = document.location.hash.split('=');
		$mx('[href="#'+p[1]+'"]').click();
		
	} 
	
	$mx(document.body).on('keydown', '.skip-enter', function(e) {
		if (e.keyCode == 13) {
			e.preventDefault();
			return false;
		}
	});	
});

/*
function updateBlock(classname) {
	$('.'+classname).each(function() {
		var url = $(this).data('update-url');
		if (url) $(this).load(url);
	});
}
*/
/*

$.application = {
	name : null,
	topOffset: 0
}

$.layout = {
	current_path: '',

	isAuthorized: function() {
		return $('body').hasClass('authorized');
	},
	
	lang: function() {
		return $(document.body).data('lang');	
	},
	
	setCurrentPath: function(path) {
		if (path == undefined) path = document.location.pathname+document.location.search;
		$.layout.current_path = path;
	},
	
	hash: {
		current: '',
		inited: false,
		cb: null, 
		
		push: function(hash) {
			if (!$.layout.hash.inited) return;
			
			var h = document.location.hash;
			if (document.location.hash) h += ':';
			h += ((hash == undefined)?'none':hash);
			$.layout.hash.current = document.location.hash = h;
		},
		
		replace: function(hash) {
			var h = document.location.hash.split(':');
			h[h.length-1] = hash;
			
			$.layout.hash.current = document.location.hash = h.join(':');
		}	
	},
	
	isIOS: navigator.userAgent.match(/iphone|ipod|ipad/gi) != null,
	isTouch: 'ontouchstart' in window || 'onmsgesturechange' in window
};
*/



/*
$.window = {
	bindScroll: function(handler) {
		$($.window).bind('scroll', handler);
	},

	unbindScroll: function(handler) {
		$($.window).unbind('scroll', handler);
	},

	defaultHandler: function() {
		$($.window).triggerHandler('scroll', {scrollTop: this.pageYOffset, windowHeight:$(window).height()});
	},

	init: function() {
		$(window).bind('scroll resize', $.window.defaultHandler);
	}
}
*/


// Trick for mobile height: 100vh
// https://css-tricks.com/the-trick-to-viewport-units-on-mobile/

function checkHeightCSS() {
  // We execute the same script as before
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', checkHeightCSS);
window.addEventListener('touchmove', checkHeightCSS);
window.addEventListener('load', checkHeightCSS);

checkHeightCSS();
$mx(checkHeightCSS);
var BlocksFactory = {
	defaults: {
		1: {text:"",text_size:"md",text_align:"left",color:"",font:""},
		2: {title:"",subtitle:"",type:"link",link_type:"link",link:"",phone:"",sms:"",email:"",link_page_id:null,product:"",collection:"",style:"one",animation:""},
		3: {items:[],messenger_style:"block"},
		4: {url:"", is_autoplay:false,is_autohide:false,poster:null},
		5: {break_size:30,icon:0,fullwidth:false,fading:false},
		6: {socials_style:"block",items:[]},
		7: {html:""},
		8: {avatar_size:65},
		9: {list:[],picture_size:100,carousel_ride:false,carousel_interval:5,is_desktop_fullwidth:false,options:{text:0,link:0}},
		10: {fields:[],fields_idx:1,form_text:"Спасибо за вашу заявку",form_btn:"Отправить",order_budget:0,order_purpose:"",payment_object_id:1,"is_order":0,"form_type":"text","paid_status_id":3,"paid_change_status":true},
		11: {"link_page_id":null,"title":""},
		12: {bounds:[],markers:[],show_buttons:true,is_fixed:true,show_types:false,show_zoom:false,show_street:false},
		13: {type:"1",timer:{"1":{date:"",time:""},"2":{days:"",hours:"",minutes:"",expires:""},"3":{time:""}}},
		14: {fields:[{title:"",text:""}]},
		15: {link: {title:"", type:"link",link:"",link_page_id:null,product:"",collection:""},p:null,is_link:false,is_scale:false,width:""}
	},
	
	checkFields(fields) {
		_.each(fields, s => {
			_.each(s.items, f => {
				f.options = _.merge(this.getDefaults(f.block_type_id), f.options, true);
				
				switch (f.block_type_id) {
					case 9:
						f.options.list = _.map(f.options.list, f => _.merge({p: null, s:"",t:"",link: {title:"", type:"link",url:"",link:"",link_page_id:null,product:"",collection:""}}, f, true));
						break;
				}
			})
		})
/*
		for (let i = 0; i < fields.length; i++) 
		for (let j = 0; j < fields[i].items.length; j++) {
			fields[i].items[j].options = _.merge(this.getDefaults(fields[i].items[j].block_type_id), fields[i].items[j].options, true);
			if (fields[i].items[j].block_type_id == 9) {
				console.log(fields[i].items[j].block_type_id, ':', this.getDefaults(fields[i].items[j].block_type_id));
			}
		}
*/
		return fields;
	},
	
	/*
		Если функция вызывается для подготовки данных для редактирования, то необходимо передать account, 
		если для сохранения, то account не передаем
	*/
	getDefaults(type_id/* , account, is_edit */) {
		let defaults = this.defaults[type_id] || {};
/*
		
		if (account) {
			if (is_edit) {
				if (type_id == 10) defaults.fields = [];
			} else {
				if (type_id == 1 && account.locale.text_direction == 'rtl') defaults.text_align = 'right';
			}
		}
*/
		
		
		return Object.assign(defaults, {design:{on:false}});
		
		/*
			switch ($this->values['block_type_id'])
						{
							case 1: //text
								if (SessionService::$raw['text_direction'] == 'rtl') $defaults_options['text_align'] = 'right';
								break;
						}
		*/
	}
}
/*! js-cookie v3.0.0-rc.1 | MIT */
;
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, (function () {
    var current = global.Cookies;
    var exports = global.Cookies = factory();
    exports.noConflict = function () { global.Cookies = current; return exports; };
  }()));
}(this, (function () { 'use strict';

  function assign (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        target[key] = source[key];
      }
    }
    return target
  }

  var defaultConverter = {
    read: function (value) {
      return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
    },
    write: function (value) {
      return encodeURIComponent(value).replace(
        /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
        decodeURIComponent
      )
    }
  };

  function init (converter, defaultAttributes) {
    function set (key, value, attributes) {
      if (typeof document === 'undefined') {
        return
      }

      attributes = assign({}, defaultAttributes, attributes);

      if (typeof attributes.expires === 'number') {
        attributes.expires = new Date(Date.now() + attributes.expires * 864e5);
      }
      if (attributes.expires) {
        attributes.expires = attributes.expires.toUTCString();
      }

      key = encodeURIComponent(key)
        .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
        .replace(/[()]/g, escape);

      value = converter.write(value, key);
      
      var stringifiedAttributes = '';
      for (var attributeName in attributes) {
        if (!attributes[attributeName]) {
          continue
        }

        stringifiedAttributes += '; ' + attributeName;

        if (attributes[attributeName] === true) {
          continue
        }

        // Considers RFC 6265 section 5.2:
        // ...
        // 3.  If the remaining unparsed-attributes contains a %x3B (";")
        //     character:
        // Consume the characters of the unparsed-attributes up to,
        // not including, the first %x3B (";") character.
        // ...
        
        stringifiedAttributes += '=' + attributes[attributeName].toString().split(';')[0];
      }
      
      return (document.cookie = key + '=' + value + stringifiedAttributes)
    }

    function get (key) {
      if (typeof document === 'undefined' || (arguments.length && !key)) {
        return
      }

      // To prevent the for loop in the first place assign an empty array
      // in case there are no cookies at all.
      var cookies = document.cookie ? document.cookie.split('; ') : [];
      var jar = {};
      for (var i = 0; i < cookies.length; i++) {
        var parts = cookies[i].split('=');
        var value = parts.slice(1).join('=');

        if (value[0] === '"') {
          value = value.slice(1, -1);
        }

        try {
          var foundKey = defaultConverter.read(parts[0]);
          jar[foundKey] = converter.read(value, foundKey);

          if (key === foundKey) {
            break
          }
        } catch (e) {}
      }

      return key ? jar[key] : jar
    }

    return Object.create(
      {
        set: set,
        get: get,
        remove: function (key, attributes) {
          set(
            key,
            '',
            assign({}, attributes, {
              expires: -1
            })
          );
        },
        withAttributes: function (attributes) {
          return init(this.converter, assign({}, this.attributes, attributes))
        },
        withConverter: function (converter) {
          return init(assign({}, this.converter, converter), this.attributes)
        }
      },
      {
        attributes: { value: Object.freeze(defaultAttributes) },
        converter: { value: Object.freeze(converter) }
      }
    )
  }

  var api = init(defaultConverter, { path: '/', sameSite: 'lax' });

  return api;

})));
+function (d, w) { 'use strict';
	w.Firewall = {
		checkHTML: function(s) {
			s = s.replace(/data:text\/javascript;base64,(.*)?(['"])/g, 'data:text/javascript,void(null)$2');
			s = s.replace(/(document|window)\.location\.assign/g, 'void');
			s = s.replace(/(document|window)\.location\.replace/g, 'void');
			s = s.replace(/(document|window)\.location\.href\s*=/g, 'var href =');
			s = s.replace(/(document|window)\.location\s*=/g, 'var href =');
			s = s.replace(/http\-equiv=[\"\']?refresh[\"\']?/g, '');
			s = s.replace(/(<base)/g, '<div-base');
			

			if ($mx('html').is('.is-app')) {
				s = s.replace(/(<script)/g, '<div-script');
			}
			
			return s;		
		}
	};
	
	var base_atob = window.atob
	
	window.atob = function(s) {
		return w.Firewall.checkHTML(base_atob(s).replace(/(<script)/g, '<div-script'));
	};
	
	// Для хороших сайтов разрешаем eval, другим - нет
	if (w.account == undefined || w.account.status_id == undefined || w.account.status_id != 3) {
		window.eval = function(s) { }
	}
	
}(document, window);
var m = document.querySelector("link[type='text/css']").href.match(/\?([0-9\.]+)/);
var scriptsVersion = m?m[0]:'';

window.$events = {
	events: {},
	waits: {},
	
	on(name, cb, fireOld = false) {
		if (this.events[name] == undefined) this.events[name] = [];
		this.events[name].push(cb);
		
		// Если данные ушли раньше чем был .on, то выполняем их, но только первый .on заберет все данные
		if (fireOld && (this.waits[name] != undefined)) {
			_.each(this.waits[name], (v) => {
				cb(null, v);
			});
			
			delete this.waits[name];
		}
	},
	
	one(name, cb) {
		let cb2 = () => {
			cb();
			this.off(name, cb2);
		}

		this.on(name, cb2);
	},
	
	off(name, cb) {
		if (cb) {
			if (this.events[name] != undefined) {
				for (let i=this.events[name].length-1; i >= 0; i--) {
					if (this.events[name][i] === cb) {
						this.events[name].splice(i, 1);
						break;
					}
				}
			}
		} else {
			delete this.events[name];
		}
	},
	
	fire(name, o) {
		
		if (this.events[name] != undefined) {
			let tmp = _.map(this.events[name], v => v); // Чтобы off не удалял из списка и события не пропадали
			for (let i=0; i<tmp.length; i++) {
				tmp[i](null, o)
			}
		} else {
			if (this.waits[name] == undefined) this.waits[name] = [];
			this.waits[name].push(o)
		}
	}
}

$mx.observe('.map-view-init', function(o) {
	$mx.lazy('map.js', 'map.css', function() {
		var d = o.data();
		var options = JSON.parse(o.find('script[type="text/data"]').text());
		var markers = JSON.parse(o.find('script[type="text/markers"]').text());
		
		if (d.showZoom) o.addClass('map-view-with-zoom-control');
	
		var map = L.map(o[0], {
			dragging: !d.isFixed,
			doubleClickZoom: !d.isFixed,
			boxZoom: !d.isFixed,
			touchZoom: !d.isFixed,
			scrollWheelZoom: !d.isFixed,
			doubleClickZoom: !d.isFixed,
			zoomControl: true,
			attributionControl: false,
		}).setView([parseFloat(options.center.lat), parseFloat(options.center.lng)], options.zoom);
		
		if (options.bounds) map.fitBounds(options.bounds);
		
		L.control.attribution({prefix: ''}).addTo(map);

		//'https://maps.tilehosting.com/styles/basic/{z}/{x}/{y}.png?key=nN7lJ1jrAkjwLR6mBnns'
		L.tileLayer('/maps/{z}/{x}/{y}.png', {
	        attribution: '<a href="https://taplink.cc" target="_blank">Taplink</a> <span style="color:#ccc">|</span> <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
	        crossOrigin: true
		}).addTo(map);
		
		var icon = L.icon({
		    iconUrl: '/s/i/marker.png',
		    iconSize: [28, 37],
// 		    iconAnchor: [22, 94],
		    popupAnchor: [0, -10],
		    shadowUrl: '/s/i/marker-shadow.png',
		    shadowSize: [40, 50],
		    shadowAnchor: [12, 31]
		});
		
		let b = map.getBounds();
		
		//b = JSON.parse('{"_southWest":{"lat":58.00382307136166,"lng":56.2247657775879},"_northEast":{"lat":58.03418980610332,"lng":56.326904296875}}');
		//b = [[58.00382307136166, 56.2247657775879],[58.03418980610332,56.326904296875]];
		//map.fitBounds(b);
		
/*
		let resize = (e) => {
			let width = o.parent().width();
			console.log(width);
			console.log(width/548	);

			let sc = (548/width);
			let w = (sc*100);
			console.log(((1-sc)*100));
			
			map.fitBounds(b);
// 			o.css((sc < 1)?{transform:'scale(1)', width: '100%', left: '0'}:{transform:'scale('+sc+')', width: w+'%', left: '-'+((100-w)/2)+'%'});
//			map.setZoom(options.zoom+(e.newSize.x/548));
		}
*/
		
// 		map.on('resize', resize);
// 		resize({newSize: {x: o.width()}});
		
		for (var i = 0; i < markers.length; i++) {
			var v = markers[i];
			var marker = L.marker([parseFloat(v.lat), parseFloat(v.lng)], {icon: icon}).addTo(map);
			marker.bindPopup("<b>"+v.title+"</b>"+(v.text?('<div>'+v.text.replace(/\n/g, '<br>')+'</div>'):''));//.openPopup();
		}
	});
});  
$mx.observe('[type="tel"]', function(o) {
	if ((o.is('.skip-init') || !o.closest('.form-field').length) && !o.is('.need-init')) return;
	
	o.addClass('skip-init');
	
	let iti = null;
	let val = o.val();
	
	$mx.lazy('phone.js', () => {
		let country = o.data('country');
		
		iti = intlTelInput(o[0], {
			initialCountry: country?country:"auto",
			defaultCountry: country?country:"auto",
			preferredCountries: [country],//_.uniq([country, 'ru', 'ua', 'by', 'kz']),
			separateDialCode: true,
			autoHideDialCode: false,
			nationalMode: true,
		});
		
		o[0].iti = iti;
		
		o.on("open:countrydropdown", function() {
			let list = $mx('.iti--container').addClass('in');
			$mx('html').addClass('is-clipped');
			if (!$mx('.iti__country-list .iti__header').length) $mx('.iti__country-list').prepend($mx('<div class="iti__header"><div>'+o.data('title')+'</div><button type="button" class="modal-close is-small"></button></div>'));
		});

		o.on("close:countrydropdown", function() {
			$mx('.iti--container').removeClass('in');
			$mx('html').removeClass('is-clipped');
		});
		
		o.attr('mx-input-type', 'phone').addClass('mx-validate').on('change keyup keydown keypress countrychange', (e) => {
//			var val = iti.getNumber().toString().trim().replace(/[^0-9\+]/g, '');
			var val = e.target.value.trim().replace(/[^0-9\+]/g, '');
			val = val?val:'';
						
			
// 			var c = intlTelInput("getSelectedCountryData");
			var c = iti.getSelectedCountryData();
	
			// Если начинаетсяс кода — убираем код
//			if (c.dialCode != undefined && (val.substr(0, (c.dialCode.toString().length+1)*2) == '+'+c.dialCode+'+'+c.dialCode)) {

			if (c.dialCode != undefined && (val.substr(0, (c.dialCode.toString().length+1)) == '+'+c.dialCode)) {
				val = val.substr(c.dialCode.toString().length+1);
				iti.setNumber(val);
			}
/*
			else {
				iti.setNumber(val);
			}
*/

			
			// Если только код - зануляем, чтобы было пусто
			if (c.dialCode != undefined && ('+'+c.dialCode == val)) val = '';
			
			
	
//			var isValid = o.intlTelInput("isValidNumber") || (val == '');
			var isValid = iti.isValidNumber() || (val == '');

			var phone = o.closest('.iti').parent().find('.tel-phone');
			phone.val(val?(c.dialCode+val):val)

			
			var code = o.closest('.iti').parent().find('.tel-code');
			val = iti.getNumber().toString().trim().replace(/[^0-9\+]/g, '');
			
			code.val(val).trigger('change', {value: iti.getNumber().toString().trim().replace(/[^0-9\+]/g, '')});
			
			var valid = o.closest('.iti').parent().find('.tel-valid');
			valid.val(isValid?1:0).trigger('change');
		}).on('blur', (e) => {
			var val = e.target.value.trim().replace(/[^0-9\+]/g, '');
			iti.setNumber(val);
		}).trigger('countrychange');
	});
}, function(o) {
	if ((o[0].iti != undefined) && o[0].iti) o[0].iti.destroy();
});
$mx(function() {
	var body = $mx(document.body);
	var panZoomObject = null;
	
/*
	body.on('click', '.slider-arrow-right, .slider-arrow-left', function() {
		var p = $mx(this).parent();
		var idx = p.find('.slider-dot.active').index() + ($mx(this).is('.slider-arrow-right')?1:-1);
 		var dots = p.find('.slider-dot').removeClass('active');
 		if (idx >= dots.length) idx = 0;
 		if (idx < 0) idx = dots.length - 1
 		dots.eq(idx).addClass('active');
		p.find('.slider-slide').css({'transform': 'translateX(-'+idx*100+'%)'});
	});
*/
	function isMobile() {
		return window.matchMedia("(max-width: 767px)").matches?true:false;
	}

	function isDesktop(o) {
		return (window.matchMedia("(min-width: 1200px)").matches?true:false) && (o.closest('.is-allow-fullwidth').length > 0);
		//(o.closest('.main-block, .modal, [data-allow-zoom]').length == 0);
	}
	
/*
	function isTouch() {
		return ('ontouchstart' in window)?true:false;
	}
*/
	
	function checkPictureSrc(picture, is_second = false) {
		if (picture.attr('data-picture')) {
			if (picture.data('picture')) picture.css('background-image', 'url('+picture.data('picture')+')');
			picture.attr('data-picture', null);
		}
		
		// Если это не телефон, то картинку справа видно сразу и ее мы загружаем
		if (!is_second && (isMobile() || isDesktop(picture))) {
			checkPictureSrc(picture.closest('.slider-slide').next().find('.picture-container'), true);
			checkPictureSrc(picture.closest('.slider-slide').prev().find('.picture-container'), true);
		}
	}
	
	function moveSlide(o, user) {
		var idx = o.index();
		
		var p = o.closest('.slider');
		var slides = p.find('.slider-slide').removeClass('active');
		var dots = p.find('.slider-dot').removeClass('active');
		var picture = p.find('.picture-container').eq(idx);

		if (user) {
			var sp = o.closest('.slider-pictures[data-interval]');
			if (sp.length) {
				clearInterval(sp.attr('data-time'));
			}
		}

		var slider = picture.closest('.slider');
		
		if (!slider.length) return;
		
		var sc = $mx(document).scrollTop();
		var wn = $mx(window).height();
		
		var os = $mx(slider[0]).offset().top;//slider[0].offsetTop;
		var oh = slider[0].offsetHeight;
		
		if (os < sc+wn && (os+oh > sc)) {
			checkPictureSrc(picture);
		}
		
		dots.eq(idx).addClass('active');
		slides.eq(idx).addClass('active');
		
		slides.css({'transform': 'translateX(-'+idx*100+'%)'+(isDesktop(o)?' scale(.94)':'')});
		slides.eq(idx).css({'transform': 'translateX(-'+idx*100+'%)'+(isDesktop(o)?' scale(1)':'')});
		
		p.triggerHandler('change', [idx]);
		p.triggerHandler('changeindex', [idx]);
	}
	
	function setSliderInterval(o) {
		var dots = o.find('.slider-dot');
		
		var timeID = o.attr('data-time');
		if (timeID) {
			clearInterval(timeID);
		}
		
		var timeID = setInterval(function() {
			if (!o.data('is-sliding')) {
				var active = o.find('.slider-dot.active').index();
				moveSlide(dots.eq((active < dots.length-1)?(active+1):0), false);
			}
		}, Math.max(o.data('interval'), 1)*1000);
		
		o.attr('data-time', timeID);
	}

	body.on('click', '.slider-dot', function() {
		var o = $mx(this);
		//var p = o.closest('.slider-pictures[data-interval]');
		//if (p.length) setSliderInterval(p);
		moveSlide(o, true);
	}).on('click', '.slider-slide:not(.active)', function() {
		var o = $mx(this);
		if (isDesktop(o)) moveSlide(o, true);
	}).on('touchstart', '.slider', function(o) {
		var t = $mx(o.target);
		
		var p = t.closest('.slider');
		var sp = t.closest('.slider-pictures');
		var width = t.width(); 
		var height = t.height(); 
		var startX = o./* originalEvent. */touches[0].pageX;
		var startY = o./* originalEvent. */touches[0].pageY;
		var slides = p.find('.slider-slide');
		var dots = p.find('.slider-dot');
		var idx = p.find('.slider-dot.active').index();
		var amount = dots.length;
		var deltaX = 0;
		var deltaY = 0;
		var startTime = 0;
		var x = 0;
		var y = 0;
		
		var startZoomDeltaX = 0;
		var startZoomDeltaY = 0;
		var startZoomX = 0;
		var startZoomY = 0;
		
		var isAllowZoom = p.data('allow-zoom');
		
		var startDirection = null;
		
		sp.data('is-sliding', 1);
		
		slides.addClass('stop-transition');
		
// 		if (slides.length < 2) return;
		
		t.on('touchmove', function(e) {
			t = e./* originalEvent. */touches;
			x = t[0].pageX;
			y = t[0].pageY;
			
			deltaX = Math.ceil((x - startX) / width * 100);
			deltaY = Math.ceil((y - startY) / height * 100);
			
			if (t.length > 1 && !startDirection && isAllowZoom) {
				let b = e.target.getBoundingClientRect();

				if ($mx('.pan-zooming-background').length == 0) {
					$mx('<div class="pan-zooming-background"></div>').appendTo(body);
					$mx('html').addClass('is-clipped');
					panZoomObject = $mx(e.target).clone();
					panZoomObject.appendTo(body);
					panZoomObject.addClass('is-pan-zooming').css(b);
					
					startZoomX = t[1].pageX;
					startZoomY = t[1].pageY;
					startZoomDeltaX = Math.abs(x - startZoomX);
					startZoomDeltaY = Math.abs(y - startZoomY);
				}
				

				let scaleX = 1 + ((Math.abs(x - t[1].pageX) - startZoomDeltaX) / width);
				let scaleY = 1 + ((Math.abs(y - t[1].pageY) - startZoomDeltaY) / height);
				let scale = Math.max(scaleX, scaleY, 1);
				
				//let deltaZoomX = 
				// Тут сделано круто но с хамером https://codepen.io/bakho/pen/GBzvbB
				
				// translateX('+deltaX+'px) translateY('+deltaY+'px) translateZ(0px) 
				// translateX('+((x - startX) /* + (t[1].pageX - startZoomX) */)+'px) translateY('+((y - startY)/*  + (t[1].pageY - startZoomY) */)+'px) translateZ(0px)  
					
				panZoomObject.css('transform', 'translateX(0px) translateY(0px) translateZ(0px) scale('+scale+', '+scale+')');
			} else {
				startTime = e.timeStamp;
	
				if (Math.abs(deltaY) > Math.abs(deltaX) && (startDirection != 'x')) {
					startDirection = 'y';
					return true;
				} else {
					if (startDirection != 'y') {
						if (idx == 0 && deltaX > 0) deltaX = 0;
						if (idx == amount -1 && deltaX < 0) deltaX = 0;
						slides.css('transform', 'translateX('+(deltaX - (idx * 100))+'%)');
						startDirection = 'x';
					}
				}
			}			

			if (e.cancelable) {
				e.preventDefault();
				e.stopPropagation();
			}
		}).one('touchend touchcancel', function(e) {
			$mx(this).off('touchmove');
			slides.removeClass('stop-transition');
			sp.data('is-sliding', null);
			
			if ($mx('.pan-zooming-background').length) {
				$mx('.pan-zooming-background').remove();
				$mx('html').removeClass('is-clipped');
				panZoomObject.remove();
				panZoomObject = null;
			}
			
			if (startDirection != 'y') {
				var time = e.timeStamp - startTime;
				var velocityX = Math.abs(x - startX) / time;
				var direction = (Math.abs(x - startX) > Math.abs(y - startY))?'x':'y';
				var v = 0;
	
				if (velocityX > 0.4 && deltaX != 0 && direction == 'x') {
					deltaX = (deltaX > 0)?55:-55;
				}	
					
				if (deltaX < -50) moveSlide(dots.eq(idx+1), true);
				if (deltaX >  50) moveSlide(dots.eq(idx-1), true);
				if (deltaX < 50 && deltaX > -50) moveSlide(dots.eq(idx), false);
			}
		});
	});
	
	var scrollHandler = function() {
		$mx('.slider-pictures').each(function() {
			var os = $mx(this).offset().top;
			var oh = this.offsetHeight;
			
			var sc = $mx(document).scrollTop();
			var wn = $mx(window).height();

			if ((os - 200 < sc+wn) && (os+oh > sc)) {
				var picture = $mx(this).find('.slider-slide.active .picture-container');
				
				checkPictureSrc(picture);
			}
		});
	}
	
	$mx(document).on('scroll', scrollHandler);
// 	scrollHandler();
	
	$mx.observe('.slider-pictures', function() {
		scrollHandler();
	});
	
	$mx.observe('.slider-pictures[data-interval]', setSliderInterval, function(o) {
		clearInterval(o.attr('data-time'));
	});
});
Storage = {
	get(key, default_value) {
		let result = undefined;
		
		try {
			if (this.hasStorage()) {
				result = localStorage.getItem(key);
				
				if (result) {
					result = JSON.parse(result);
					
					if (result.expired_at && (result.expired_at < Date.now() / 1000 | 0)) {
						localStorage.removeItem(key);
						return undefined;
					}
					
					result = result.content;
				}
			} 
			
		} catch (e) {
	        result = undefined;
	    }
	    
		if (result == undefined) {
			result = Cookies.get(key);
		}
		
		return (result != undefined)?result:default_value;
	},
	
	set(key, value, expires, path) {
		try {
			if (this.hasStorage()) {
				let obj = { content: value }
				if (expires != undefined) obj.expired_at = (Date.now() / 1000 | 0) + expires; 
				localStorage.setItem(key, JSON.stringify(obj));
			} else {
				Cookies.set(key, value, { expires: expires, path: path?path:'/' });
			}
		} catch (e) { }
	},
	
	hasStorage() {
		return ("localStorage" in window && window.localStorage);
	}
}
/*
	screen 
		- bg
		- gradient
		- picture
		- bg_image
		- color
		- brightness
	avatar
		- color
	link
		- bg
		- color
		- border
		- radius
	bg
		- size: [width, cover, tile]
		- fixed
		- brightness
		- main_color
		
		
	mode:
		page, 
		design, 
		thumb, 
		view		Просмотр страницы в дизайнере (без редактирования)
*/

var globalFontsBase = {
	'Roboto': {f: 'sans-serif', w: '100,400,700'},
	'Lobster': {f:'cursive', w: '400,400,700'},
	'Pacifico': {f:'cursive', w: '400,400,700'},
	'Caveat': {f:'cursive', w: '400,400,700'},
	'Montserrat Alternates': {f:'sans-serif', heading_uppercase1: true},
	'Kelly Slab': {f:'cursive', w: '400,400,700'},
	'Pangolin': {f:'cursive', w: '400,400,700'},
	'Oswald': {f:'sans-serif', heading_uppercase1: true},
	'Open Sans Condensed': {f:'sans-serif', w: '300,300,700'},
	'Amatic SC': {f:'cursive', w: '400,400,700', heading_uppercase1: true},
	'Merriweather': {f:'serif', w: '300,400,700'},
	'Comfortaa': {f:'cursive', w: '300,500,700'},
	'PT Mono': {f:'monospace', w: '400,400,700'},
	'Open Sans': {f:'sans-serif', w: '300,400,700'},
	'Alice': {f: 'cursive', w: '400,400,700', heading_uppercase1: true},
	'IBM Plex Sans': {f:'sans-serif', heading_uppercase1: true},
	'Raleway': {f:'sans-serif', heading_uppercase1: true},

	'PT Sans': {f:'sans-serif', w: '400,400,700'},
	'PT Serif': {f:'serif', w: '400,400,700'},
	'Lato': {f:'sans-serif', w: '300,400,700'},
	'Open Sans': {f:'sans-serif', w: '300,400,700'},
	'Roboto Slab': {f:'serif', w: '200,400,700'},
	'Playfair Display': {f:'serif', w: '400,600,900'},
	'Cormorant Garamond': {f:'serif', w: '300,500,700'},
	'Russo One': {f:'sans-serif', w: '400,400,400', heading_uppercase1: true},
	'Source Sans Pro': {f:'sans-serif', w: '200,400,700'},
	'Montserrat': {f:'sans-serif', w: '200,400,700' },


	'Tajawal': {f:'sans-serif', w: '200,400,700' },
};

var globalFonts = Object.keys(globalFontsBase);
var globalFontsFallback = [];
for (i in globalFontsBase) {
	globalFontsFallback.push("'"+i+"', "+globalFontsBase[i].f);
	if (globalFontsBase[i].w == undefined) globalFontsBase[i].w = '200,400,700';
	globalFontsBase[i].ww = globalFontsBase[i].w.split(',');
	globalFontsBase[i].w = _.uniq(globalFontsBase[i].ww).join(',');
}

var FontsFactory = {
	used: {_:0},
	
	getFont(idx) {
		if (this.used[idx] == undefined) this.used[idx] = 1;
		return globalFontsFallback[idx];
	},
	
	getWeight(i, w) {
		return globalFontsBase[globalFonts[i]].ww[w];
	},
	
	getTransform(v) {
		let values = {
			n: 'none',
			u: 'uppercase'
		}
		
		return values[v];
	},
	
	isUpperCaseHeading(idx) {
		let f = globalFontsBase[globalFonts[idx]];
		return (f.heading_uppercase != undefined);
	},
	
	loadAll() {
		_.each(globalFonts, (v, i) => { if (this.used[i] == undefined) this.used[i] = 1; });
		this.check();
	},
	
	getTextSize(i) {
		let text_sizes = {sm: '1.03', md: '1.26', lg: '1.48', h3: '1.71', h2: '2.2', h1: '3.5'};
		return (text_sizes[i] || 1.26) + 'rem';
	},
	
	getLineHeight(i) {
		let lineHeights = {h2: 1.25, h1: 1.15};
		return (lineHeights[i] || 1.4);
	},
	
	check() {
		let need = [];
		_.each(this.used, (v, i) => {
			if ((i == '_') || !this.used[i] || i == undefined) return;
			need.push(globalFonts[i]+':'+globalFontsBase[globalFonts[i]].w);
			this.used[i] = 0;
		})
		
		if (need.length) {
			let link = '//fonts.googleapis.com/css?family='+_.map(need, v => { return v; }).join('|')+'&display=swap&subset=cyrillic,cyrillic-ext,latin-ext';
			$mx.lazy([], link);
		}
	}
}

var StylesFactory = {
	getBaseStyles() {
		return {
			heading: {font: 0, color: "#000000", transform: 'n', weight: 1},
			screen: {font:0, color: "#000000"},
			avatar: {color: "#777777"},
			link: {bg: "#7795f8", color: "#ffffff", transform: 'n', weight: 1, font: 0, subtitle: {color: "#ffffff", font: 0}, shadow: {x: 0, y: 0, b: 0, s: 0, color: '#000000', o: 20}, border: {width: 2}, radius: 3, align: "center", thumb: "left", hover: 1, transparent:0},
			bg: {position:"0% 0%",repeat: "repeat", opacity: 0, size: "tile", cover: false, fixed: 0, type: "solid", color1: "#eff2f7", color2: "", picture: null},
			block: {
				radius: 5,
// 				padding: 1,
				pictures: {title: '#000000', text: '#000000', button_text: '#0383de', bg: '#ffffff', nav: '#53a3e0'}
			},
			sections: {_: 0},
			extended: {items: [], base: {css: ''}}
		}
	},

	getDefaultSection(theme) {
		return _.clone({
			text: {color: theme.screen.color, font: theme.screen.font}, 
			heading: {color: theme.heading.color, font: theme.heading.font, weight: theme.heading.weight, transform: theme.heading.transform}, 
			link: {color: theme.link.color, bg: theme.link.bg, shadow: theme.link.shadow, weight: theme.link.weight, subtitle: {color: (theme.link.subtitle || theme.link).color}, transparent: theme.link.transparent, border: {width: theme.link.border.width}}, 
			bg: {type: 'solid', color1: theme.bg.color1, color2: '', picture: null, size: 'tile', repeat: 'repeat', position: '0% 0%'}, 
			indent: {on: false, radius: 20},
			padding: {top: 1, bottom: 1},
		});
	},
	
	checkStyles(theme) {
// 		if (theme.screen.font == undefined) theme.screen.font = 0; // Проверить чтолбы такого не было в БД	
		
/*
		console.log(this.getBaseStyles());
		console.log(theme);
		console.log(_.merge(this.getBaseStyles(), {link: {font: (theme.screen != undefined && theme.screen.font != undefined)?theme.screen.font:0}, heading: {font: (theme.screen != undefined && theme.screen != undefined)?theme.screen.font:0, color: (theme.screen != undefined && theme.screen.color != undefined)?theme.screen.color:'#000000'}}, theme, true));
*/

/*
		if ((theme.screen != undefined) && (theme.screen.font != undefined || theme.screen.color != undefined) && theme.heading == undefined) {
			theme.heading = {};
			if (theme.screen.font != undefined) theme.heading.font = theme.screen.font;
			if (theme.screen.color != undefined) theme.heading.color = theme.screen.color;
		}
*/
		
		if ((theme.link != undefined) && (theme.screen != undefined) && (theme.screen.font != undefined) && (theme.link.font == undefined)) {
			theme.link.font = theme.screen.font;
		}
		
		if ((theme.link != undefined) && (theme.link.transparent != undefined) && ((theme.link.transparent === true) || (theme.link.transparent === 1))) {
			theme.link.transparent = 100;
		}

/*
		if ((theme.link != undefined) && (theme.link.color != undefined || theme.link.font != undefined) && theme.link.subtitle == undefined) {
			theme.link.subtitle = {};
			if (theme.link.font != undefined) theme.link.subtitle.font = theme.link.font;
			if (theme.link.color != undefined) theme.link.subtitle.color = theme.link.color;
		}
*/
			
				
		theme = _.merge(this.getBaseStyles(), /*
{
			link:  {
				font: (theme.screen != undefined && theme.screen.font != undefined)?theme.screen.font:0, 
				subtitle: {font: (theme.screen != undefined && theme.screen.font != undefined)?theme.screen.font:0, color: (theme.link != undefined && theme.link.color != undefined)?theme.link.color:'#ffffff'}}, 
			heading: {
				font: (theme.screen != undefined && theme.screen.font != undefined)?theme.screen.font:0, 
				color: (theme.screen != undefined && theme.screen.color != undefined)?theme.screen.color:'#000000'}
		},
		*/ theme, true);
		
		if (theme.link.border == null || theme.link.border === "") theme.link.border = {width: 2};
		if (theme.link.radius == null || theme.link.radius === "") theme.link.radius = 3;
		
		if (typeof theme.link.radius == 'string') theme.link.radius = parseInt(theme.link.radius.replace('px', ''));
		if (typeof theme.link.border != 'object') theme.link.border = {width: parseInt(theme.link.border.replace('px', ''))};
		
		
		if (theme.html != undefined) {
			theme.extended.items.push({title: {en: ''}, html: theme.html, css: theme.css});
			delete theme.html;
			delete theme.css;
		}
		
		if (theme.animations != undefined) {
			theme.extended = theme.animations;
			delete theme.animations;
		}
		
		
		
/*
		_.each(theme.sections, (v, k) => {
			if (k == '_') return;
			if (!_.isObject(v.padding)) v.padding = {top: v.padding, bottom: 0};
		})
*/
		
		return theme;
	},
	
	getPageClasses(theme, account) {
		let r = [];
		
		if (theme && theme.bg != undefined) {
			
			let main_color = hexToRgb(theme.bg.color1, 'hash');
			main_color = _.sort(main_color);
			
			let main_color_values = Object.values(main_color);
			main_color = (main_color_values[0] > main_color_values[1]*1.2)?Object.keys(main_color)[0]:null;
			
			r = ['is-'+lightOrDark(theme.bg.color1), main_color?('is-bg-main-'+main_color):null];
		}
		
/*
		if (account != undefined && account.options != undefined) {
			if (account.options.max_width != undefined) r.push('max-page-container-'+account.options.max_width);
			if (account.options.valign != undefined) r.push('page-valign-'+account.options.valign);
		}
*/
		
		return r;
	},
	
	getShadow(v) {
		return (!(v.x + v.y + v.b + v.s) || !v.o)?'none':(v.x + 'px ' + v.y + 'px ' + v.b + 'px '+ v.s + 'px ' + transparentColor(100 - v.o, v.color));
	},
	
	properyChanged(base, section, name, revert = false, o) {
		if (!base || !section) return null;
		
		let props = {
			text: ['font', 'color'],
			heading: ['font', 'color', 'weight', 'transform'],
			link: ['color'],
			'link.subtitle': ['color'],
			'link.transparent': ['transparent'],
			'link.bg': ['bg'],
			'link.shadow': ['x', 'y', 's', 'b', 'o', 'color'],
			'link.border': ['width'],
			
			'bg.type': ['type'],
			'bg.color': ['color1', 'color2'],
			'bg.picture': ['picture'/* , 'link' */],
			'bg.size': ['size'],
			'bg.position': ['position'],
			'bg.repeat': ['repeat'],
			'bg.height': ['height'],
			'bg.opacity': ['opacity'],
			'indent': ['on'],
			'indent.radius': ['radius'],
			
			'padding.top': ['top'],
			'padding.bottom': ['bottom']
		}
		
		let r = false;
		
		_.each(props[name], v => { r |= !_.isEqual(base[v], section[v]); });
		
		if (revert) {
			if (r) {
				o.$confirm(o.$gettext('Вернуть по умолчанию?'), 'is-warning').then(() => {
					_.each(props[name], v => section[v] = base[v]);
				})
			}
		} else {
			return {'is-propery-changed': r}
		}
	},
	
	updateCSSBlock(css, parent) {
		if (typeof css != 'string') css = _.map(css, (o) => { return _.values(o).join("\n"); }).join("\n");
		
		const style = document.createElement('style');
	    const txtNode = document.createTextNode(css);
	    
	
	    style.appendChild(txtNode);
	    parent.innerHTML = '';
	    parent.appendChild(style);
	    
	    FontsFactory.check();
	},
	
	addStyle(styles, id, names, css, context) {
		if (styles['b:'+id] == undefined) styles['b:'+id] = [];
		styles['b:'+id].push(_.map(names?names:[''], (v) => { return context+'.b-'+id+' '+v}).join(',')+'{'+css.join(';')+'}');
	},
	
	prepareSectionStyles(section, idx, theme, styles, context, mode = 'page') {
		if (!_.size(section)) return;
		
		context = (context == undefined)?'':(context + ' ');
		let name = 's:'+idx;
		delete styles[name];
		
		//todo: убрать
		if (section.link.subtitle == undefined) section.link.subtitle = {color: section.link.color};
		
		let ss = [
			context+'.blocks-section.s-'+idx+(section.indent.on?' .section-main':'')+'{' + buildStylesBackground(section, 'html') + '}',
			context+'.blocks-section.s-'+idx+(section.indent.on?' .section-main':'')+' > div {' + buildStylesBackground(section, 'body') + '}',
// 			context+'.s-'+idx+'{ font-family: '+FontsFactory.getFont(section.text.font)+'}',

			context+'.blocks-section.s-'+idx+' .section-main > div {padding-top: '+(section.padding.top)+'rem;padding-bottom: '+(section.padding.bottom)+'rem;font-family: '+FontsFactory.getFont(section.text.font)+'}',

			context+'.s-'+idx+' .btn-link, '+context+'.s-'+idx+' .block-item .btn-link:hover, '+context+'.s-'+idx+' .block-item .btn-link:link, '+context+'.s-'+idx+' .block-item .btn-link:active, '+context+'.s-'+idx+' .block-item .btn-link:visited, .btn-socials-globe {--color-text:'+section.link.color+';background:'+transparentColor(section.link.transparent, section.link.bg)+
			
// 			(section.link.transparent?'':';border-width: 0')+
			(section.link.transparent?(';border-width:'+section.link.border.width+'px'):';border-width: 0')+
			
			((section.link.shadow == undefined)?'':(';box-shadow: ' + StylesFactory.getShadow(section.link.shadow)))+';color:'+section.link.color+';border-color:'+(section.link.bg)+'}',
			context+'.s-'+idx+' .btn-link-subtitle { color: '+section.link.subtitle.color+'}'
		];
		
/*
		if (section.bg.size == 'adaptive') {
			ss.push(context+'.blocks-section.s-'+idx+' { min-height: '+section.bg.height+'px }');
		}
*/
		
		if (section.indent.on) {
			ss.push(context+".s-"+idx+" .section-main {border-radius: "+section.indent.radius+"px}");
			ss.push(context+".s-"+idx+" .section-main > div {padding-left: 1rem;padding-right: 1rem;border-radius: "+section.indent.radius+"px}");

			switch (mode) {
				case 'view':
					// — это убрали, так как design режим мы знаем,стили не повторятся, зато во время редактирования работает
// 					ss.push(context+".s-"+idx+" .section-main {border-radius: "+section.indent.radius+"px;margin-left: 1rem;margin-right: 1rem}");
// 					ss.push(context+".s-"+idx+" .section-main > div {border-radius: "+section.indent.radius+"px}");
					break;
				case 'design':
// 					ss.push(context+".s-"+idx+" .section-main {border-radius: "+section.indent.radius+"px;margin-left: 1rem;margin-right: 1rem}");
// 					ss.push(context+".s-"+idx+" .section-main > div {border-radius: "+section.indent.radius+"px}");
					ss.push(context+".s-"+idx+" .block-handle {margin-left: -1rem}");
	// 				ss.push(context+".s-"+idx+" .block-handle-link {margin-right: -1rem}");
			
					ss.push("@media (max-width: 767px) { "+context+".s-"+idx+" .section-main:not(.handles-hidden) {margin-left: 3rem} }");
					ss.push("@media (max-width: 767px) { "+context+".s-"+idx+" .block-handle {margin-left: -4rem} }");
					ss.push("@media (max-width: 767px) { "+context+".s-"+idx+" .block-item:not(.is-readonly) > div, "+context+".s-"+idx+" .block-item:not(.is-readonly) > div { padding-left: 0 } }");
					break;
// 				default:
// 					ss.push(context+".s-"+idx+" .section-main {border-radius: "+section.indent.radius+"px}");
// 					ss.push(context+".s-"+idx+" .section-main > div {padding-left: 1rem;padding-right: 1rem;border-radius: "+section.indent.radius+"px}");
			}
			
			if (section.indent.radius) {
				switch (mode) {
					case 'view':
					case 'design':
						ss.push(context+".blocks-section.is-empty:first-child + .s-"+idx+" {margin-top: 1rem}");
						break;
					default:
						ss.push(context+".s-"+idx+":first-child {margin-top: 1rem}");
						ss.push(context+".s-"+idx+":last-child {margin-bottom: 1rem}");
						break;
				}
// 				ss.push(context+".s-"+idx+":first-child .section-main > div {margin-top: 1rem}");
			}
			
		}
		
		

		//if (section.heading != undefined && section.heading.font != undefined && section.heading.weight != undefined) 
		ss.push(context+".s-"+idx+" .is-heading {font-family: "+FontsFactory.getFont(section.heading.font)+";color:"+section.heading.color+";font-weight:"+FontsFactory.getWeight(section.heading.font, section.heading.weight)+";text-transform: "+FontsFactory.getTransform(section.heading.transform)+"}");
		styles[name] = ss.concat(buildTextColorStyles(section.text.color, '.s-'+idx));
	},
	
	prepareStyles(block_id, name, options, styles, context) {
		context = (context == undefined)?'':(context + ' ');
		delete styles[block_id];

		if (options.design != undefined && options.design.on) {
			let d = options.design;
			
			switch (name) {
				case 'collapse':
					if (d.color) {
						StylesFactory.addStyle(styles, block_id, ['.collapse-item', '.collapse-item > .a'], ['color:'+d.color+' !important'], context);
						StylesFactory.addStyle(styles, block_id, ['.collapse-icon:before', '.collapse-icon:after'], ['background:'+d.color+' !important'], context);
					}
					
					if (d.font) StylesFactory.addStyle(styles, block_id, null, ['font-family: '+FontsFactory.getFont(d.font)], context);
					break;
				case 'break':
					if (d.color) {
						StylesFactory.addStyle(styles, block_id, ['.block-break-inner'], ['color:'+d.color+' !important'], context);
						StylesFactory.addStyle(styles, block_id, ['.block-break-inner span:before', '.block-break-inner span:after'], ['background-color: '+d.color], context);
						StylesFactory.addStyle(styles, block_id, ['.block-break-inner.has-fading span:before'], ['background: linear-gradient(to left, '+d.color+' 0%, rgba(255,255,255,0) 100%)', 'background: -webkit-linear-gradient(right, '+d.color+' 0%,rgba(255,255,255,0) 100%)'], context);
						StylesFactory.addStyle(styles, block_id, ['.block-break-inner.has-fading span:after'], ['background: linear-gradient(to right, '+d.color+' 0%, rgba(255,255,255,0) 100%)', 'background: -webkit-linear-gradient(left, '+d.color+' 0%,rgba(255,255,255,0) 100%)'], context);
					}
					break;
				case 'pictures':
					StylesFactory.addStyle(styles, block_id, ['.slider-dot'], ['background-color:'+d.nav], context);
					StylesFactory.addStyle(styles, block_id, ['.slider-slide-title'], ['background-color:'+d.bg, 'color: '+d.title], context);
					StylesFactory.addStyle(styles, block_id, ['.slider-slide-text'], ['background-color:'+d.bg, 'color: '+d.text], context);
					StylesFactory.addStyle(styles, block_id, ['.slider-slide-link'], ['background-color:'+d.bg+' !important', 'color: '+d.button_text+' !important'], context);
					break;
			}
		}
	}
}

function hexToRgb(hex, return_type = 'string') {
	let result = [255,255,255];
	if (hex) {
		hex = hex.toString().trim().toLowerCase().replace('#', '');
		if (hex.length == 3) hex = hex+hex;
	    result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex);
	    result = result?[
	    	parseInt(result[1], 16), 
	    	parseInt(result[2], 16),
	    	parseInt(result[3], 16)]:[255,255,255];
    }
    
    switch (return_type) {
	    case 'hash':
	    	return {r: result[0], g: result[1], b: result[2]};
		case 'array':
			return result;
		default:
			return result.join(',');
    }
}

function lightOrDark(color) {
	if (typeof color != 'string') return 'light';
    var r, g, b, hsp;
    
    color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, '$&$&'));

    r = color >> 16;
    g = color >> 8 & 255;
    b = color & 255;
    
    hsp = Math.sqrt(
	    0.299 * (r * r) +
	    0.587 * (g * g) +
	    0.114 * (b * b)
    );

	return (hsp > 200)?'light':'dark';
}

function transparentColor(transparent, color) {
	if (transparent === 0) return color;
	if (transparent === 100) return 'transparent';

	if (color[0] == '#') color = color.substring(1);
	if (color.length == 3) color = color+color;
	return 'rgba('+hexToRgb(color)+','+(100-transparent)/100+')';
}


function isLightColor(color, lighterThan = 130) {
	color = hexToRgb(color, 'array');
    return color?(( color[0]*299 + color[0]*587 + color[0]*114 )/1000 > lighterThan):'is-light';
}


function buildStylesBackground(theme, part, mode) {
	bg = {};
	let b = theme.bg;
	let type = b.type;
	if (type == 'gradient' && (!b.color2 || (b.color1 == b.color2))) type = 'solid';
	
	if (b.picture != undefined && b.picture.link == undefined && b.picture.filename != undefined) {
		b.picture.link = '//'+Vue.prototype.$account.storage_domain+'/p/'+b.picture.filename+'?'+b.picture.version;
	} 
	
	switch (part) {
		case 'html':
			if (b.picture && b.picture.link) {
				bg = {p:'background-position:'+b.position, r:'background-repeat: '+b.repeat+'!important', i:'background-image:url('+b.picture.link+')'};
				
				bg.c = 'background-color: '+b.color1+' !important';
// 				if (b.opacity == 0) {
					switch (type) {
/*
						case 'solid':
							bg.c = 'background-color: '+b.color1+' !important';
							break;
*/
						case 'gradient':
							bg.i += ', linear-gradient('+b.color1+', '+(b.color2?b.color2:b.color1)+')';
							break;
					}
// 				}
				
				switch (b.size) {
					case 'width':
						bg.s = 'background-size: 100% auto !important';
						break;
					case 'cover':
						bg.s = 'background-size: cover !important';
						break;
					case 'adaptive':
						Object.assign(bg, {p:'background-position: 50% 0%', r: 'background-repeat:no-repeat', s: 'background-size: auto '+theme.bg.height+'px !important'})
						break;
					default:
						if (mode == 'thumb') bg.s = 'background-size: 100% !important';
						break;
				}
				
// 				if (b.fixed && (['design', 'thumb'].indexOf(mode) == -1)) bg.a = 'background-attachment: fixed';
			} else {
				if (b.opacity == 0) {
					switch (type) {
						case 'solid':
							bg.c = 'background-color: '+b.color1+' !important'; //background-image: unset;
							break;
						case 'gradient':
							bg.i = 'background-image: linear-gradient('+b.color1+', '+b.color2+')';
							break;
					}
				}
			}
			
			break;
		case 'body':
			if (b.opacity != 0) {
				if (type == 'gradient') {
					bg.i = 'background-image:linear-gradient('+((b.picture && b.picture.link)?('rgba('+hexToRgb(b.color1)+', '+(b.opacity/100)+'), rgba('+hexToRgb(b.color2)+', '+(b.opacity/100)+')'):(b.color1+', '+b.color2))+')';
				} else {
					bg.c = 'background-color: '+((b.picture && b.picture.link)?('rgba('+hexToRgb(b.color1)+', '+(b.opacity/100)+')'):b.color1);
				}
			}/*
 else {
				bg.c = 'background-color: unset;background-image: unset;';
			}
*/
			break;
	}
	
	if (((part == 'blocks'/*  && mode == 'design' */) /* || (part == 'body' && mode != 'design') */)) {
		if ((theme.screen != undefined) && (theme.screen.font != undefined)) {
			//let font = globalFonts[theme.screen.font];
			bg.f = "font-family: "+FontsFactory.getFont(theme.screen.font);
		}
// 		bg.c = 'color:'+theme.screen.color+' !important';

// 		body, button, input, select, textarea
	}
	
/*
	if (part == 'section') {
		bg.t = 'color: '+theme.text.color;
	}
*/
	
				
	return _.values(bg).join(';');
}


/*
function parseRule(css) {
	let tokenizer = /\s*([a-z\-]+)\s*:\s*((?:[^;]*url\(.*?\)[^;]*|[^;]*)*)\s*(?:;|$)/gi,
		obj = {},
		token;
	while ( (token=tokenizer.exec(css)) ) {
		obj[token[1].toLowerCase()] = token[2];
	}
	return obj;
}
*/

function applyCssContext(text, context) {
	context = context.trim();
	let mediaTokenizer = /(@media[^{]+)\{([\s\S]+?})\s*}/g;
	let keyframesTokenizer = /(@keyframes[^{]+)\{([\s\S]+?})\s*}/g;
	let tokenizer = /([\s\S]+?)\{([\s\S]*?)\}/gi;
	let media = [];
	let keyframes = [];
	let rules = [];
  
	text = text.replace(keyframesTokenizer, (m) => {
		keyframes.push(m);
		return '@@frame-'+keyframes.length+'{}';
    });
    
	text = text.replace(mediaTokenizer, (match, p1, p2) => {
		media.push(p1+'{'+applyCssContext(p2, context)+'}');
		return '@@'+media.length+'{}';
    });

	text = text.replace(/\/\*[\s\S]*?\*\//g, '');
	while ((token = tokenizer.exec(text))) {
		let rule = {
			selectorText : token[1].trim().split(/\s*\,\s*/g),
			style : token[2].trim()
		};
		rules.push(rule);
	}
	
	let s = _.map(rules, (rule) => { 
		let selector = _.map(rule.selectorText, s => {
    	s = s.trim();
		if (s.substr(0, 2) == '@@') return s; 
// 		return context + ' ' + s;
		return (s.indexOf('.device') == 0)?(context + s):(context + ' ' + s);
    });
		return selector + ' {' + rule.style + '}'  
	}).join("\n");
	
	for (let i = 1; i <= media.length; i++) s = s.replace('@@'+i+' {}', media[i-1]);
	for (let i = 1; i <= keyframes.length; i++) s = s.replace('@@frame-'+i+' {}', keyframes[i-1]);
	return s;
}


function buildTextColorStyles(color, context) {
	return [
		context+', '+context+' a, '+context+' a:hover, '+context+' span[href], '+context+' label, '+context+' .checkbox:hover, '+context+' .radio:hover, '+context+' .collapse-item .a, '+context+'.is-light .collection-bar .button, '+context+'.is-dark .collection-bar .button, '+context+'.is-light .collection-bar .button:hover, '+context+'.is-dark .collection-bar .button:hover {color:'+color+'}',
		context+' .block-break span:before, '+context+' .block-break span:after {background-color:'+color+'}',
		context+' .block-break-inner.has-fading span:before {background: linear-gradient(to left, '+color+' 0%, rgba(255,255,255,0) 100%); background: -webkit-linear-gradient(right, '+color+' 0%,rgba(255,255,255,0) 100%);}',
		context+' .block-break-inner.has-fading span:after {background: linear-gradient(to right, '+color+' 0%, rgba(255,255,255,0) 100%); background: -webkit-linear-gradient(left, '+color+' 0%,rgba(255,255,255,0) 100%);}',
		context+' .block-break:before {border-color: '+color+'}',
		context+' .collapse-icon::after, '+context+' .collapse-icon::before {background:'+color+'}',
		context+' .footer-link svg {fill: '+color+' !important}'
	];
}

function buildStyles(theme, mode, context) {
	context = (context == undefined)?'':(context + ' ');
	let container = (mode == 'design')?(context+'.screen'):'html';
	
	//todo: unpack темы
// 	theme = _.merge({block: {radius: 5, pictures: {title: '#000000', text: '#000000', button_text: '#0383de', bg: '#ffffff', nav: '#53a3e0'}}}, theme, true);
	
	let s =  [
// 		(theme.block != undefined && theme.block.radius != undefined && theme.block.radius)?(container+' { --block-radius: '+theme.block.radius+' }'):'',
		(context?context:container)+' { --block-radius: '+theme.block.radius+'px }',
// 		'.block-item a, .page a:hover, .block-item a:link, .block-item a:visited, .block-item a:active, .block-item span[href], .block-item label {color:'+theme.screen.color+'}',
		//transparentColor(theme.link.transparent?'transparent':theme.link.bg)
		context+'.block-item .btn-link, '+context+'.block-item .btn-link:hover, '+context+'.block-item .btn-link:link, '+context+'.block-item .btn-link:active, '+context+'.block-item .btn-link:visited, .btn-socials-globe {'+'background:'+transparentColor(theme.link.transparent, theme.link.bg)+';box-shadow: ' + StylesFactory.getShadow(theme.link.shadow)+';color:'+theme.link.color+';--color-text:'+theme.link.color+';'+
		'font-family: '+FontsFactory.getFont(theme.link.font)+';'+
		'font-weight:'+FontsFactory.getWeight(theme.link.font, theme.link.weight)+';'+
		'border-color:'+(theme.link.bg)+';border-radius:'+theme.link.radius+'px'+(((theme.link.border != undefined) && (theme.link.border.width != undefined) && (theme.link.border.width !== '') && (!(theme.link.transparent == false || theme.link.transparent == 0)))?(';border-width:'+theme.link.border.width+'px'):'')+'}',

		context+'.block-item .btn-link > .thumb > div.is-picture {border-radius:'+theme.link.radius+'px}',
		context+'.block-item .btn-link-title {text-transform: '+FontsFactory.getTransform(theme.link.transform)+';}',
		
		context+'.block-item .btn-link > div, '+context+'.btn-socials span {flex-grow: '+((theme.link.thumb == 'center')?0:1)+'}',
		
		context+'.slider-slide-text { background: '+theme.block.pictures.bg+'; color: '+theme.block.pictures.text+' }',
		context+'.slider-slide-title { color:  '+theme.block.pictures.title+' }',
		context+'.slider-slide-link { background: '+theme.block.pictures.bg+' !important;' +
			'font-family: '+FontsFactory.getFont(theme.link.font)+';'+
			'font-weight:'+FontsFactory.getWeight(theme.link.font, theme.link.weight)+';'+
			'text-transform: '+FontsFactory.getTransform(theme.link.transform)+';'+
			' color: '+theme.block.pictures.button_text+' !important}',
		
		context+'.slider-dot { background-color: '+theme.block.pictures.nav+'}',
		
		((theme.link.subtitle != undefined)?(context+'.btn-link-subtitle {color: '+theme.link.subtitle.color+';font-weight: normal;font-family: '+FontsFactory.getFont(theme.link.subtitle.font)+'}'):'')
		
	].concat(buildTextColorStyles(theme.screen.color, context.trim()?context:'.page'));
	
	if (mode != 'design') {
		switch (parseInt(theme.link.hover)) {
			case 1:
				s.push(context+'.btn-link:hover {opacity: 0.9}');
				break;
			case 2:
				s.push(context+'.btn-link {transition: transform .5s cubic-bezier(.2, 2, .2, 1)}');
				s.push(context+'.btn-link:hover {transform: scale(1.02)}');
				break;
		}
	}
	
	s.push(container + ' .theme-main:before, '+container+' .theme-main:after { background: none; }');
	
	if ((mode == 'page' || mode == 'design') && (theme.extended != undefined)) {
		if ((theme.extended.base != undefined) && theme.extended.base.css) {
			if (context) {
				s.push(applyCssContext(theme.extended.base.css, context));
			} else {
				s.push(theme.extended.base.css);
			}
		}

		if ((theme.extended.items != undefined) && _.size(theme.extended.items)) {
			_.each(theme.extended.items, a => {
				if (context) {
					s.push(applyCssContext(a.css, context));
				} else {
					s.push(a.css);
				}
			});
		}
	}
	
	if (theme.link.radius) {
		s.push(context+'.btn-link-style-two, '+context+'.btn-link-style-arr {;padding-left: 2rem !important;padding-right: 3rem !important; }');
		s.push(context+'.btn-link-style-two:before, '+context+'.btn-link-style-arr:before { right: 1.5rem }');
	}
	
	if ((mode == 'page') && theme.bg.fixed) {
		container = 'html:before';
		s.push(container+' { content:"";position:'+(theme.bg.fixed?'fixed':'absolute')+';top:0;left:0;width:100%;height:100%;z-index: -2 }');
	}
	
	
	s.push(container + '{' + buildStylesBackground(theme, 'html', mode) + ' }');
	
	if (mode == 'design') {
		s.push(context+'.page:before { content:""; }');
		s.push(context+' {' + buildStylesBackground(theme, 'blocks', mode) + ' }'); //.page-blocks
	}
		
	container = (mode == 'design')?(context+'.page:before'):'body';
	
	if ((mode == 'page') && theme.bg.fixed) {
		container = 'html:after';
		s.push('html:after { content:"";position:fixed;top:0;left:0;width:100%;height:100%;z-index: -1 }');
	}
	
	s.push(container + '{' + buildStylesBackground(theme, 'body', mode) + ' }');
	
	if (mode == 'page') {
		if ((theme.screen != undefined) && (theme.screen.font != undefined)) {
			let font = globalFonts[theme.screen.font];
			s.push("body, body button, body input, body select, body textarea, .iti__country {font-family: "+FontsFactory.getFont(theme.screen.font)+"}");
		}
	}
	
// 	s.push('.page, .block-text a, .block-form .form-field, .block-html a, .collapse-item a, .collapse-item .a, .footer-link, .footer-link:hover, .footer-link:link, .footer-link:visited, .footer-link:active, .product-container-text, .page .label, .flip-clock-label, .page .checkbox:hover, .page  .radio:hover, .collection-bar .button, .page .is-text {color:'+theme.screen.color+' !important}');
// 	s.push('.flip-clock-dot {background: '+theme.screen.color+'}');
	s.push(context+'.block-text {font-size:2.2em}');
	if (theme.heading != undefined && theme.heading.font != undefined) {
		s.push(context+".is-heading {font-family: "+FontsFactory.getFont(theme.heading.font)+";color:"+theme.heading.color+";font-weight:"+FontsFactory.getWeight(theme.heading.font, theme.heading.weight)+";text-transform: "+FontsFactory.getTransform(theme.heading.transform)+"}");
	}
	

	s.push(context+'.text-avatar {color:'+theme.avatar.color+' !important}');

	s.push(context+'.block-item .checkbox input:before, '+context+'.block-item .radio input:before {background:#fff;border-color:#d9d9d9;}');

	let border_checkbox_color = /* theme.link.border?theme.link.border: */theme.link.bg;
	if (theme.link.bg && (border_checkbox_color.toLowerCase() != '#ffffff')) {
		s.push(context+'.block-item .checkbox input:checked:before, '+context+'.block-item .radio input:checked:before {background:'+(theme.link.transparent?'transparent':theme.link.bg)+';border-color:'+border_checkbox_color+';}');
		s.push(context+'.block-item .checkbox input:after, '+context+'.block-item .radio input:after {border-color: '+theme.link.color+'}');
	} else {
		s.push(context+'.block-item .checkbox input:after, '+context+'.block-item .radio input:after {border-color: #333}');
	}


	s.push(context+'.basket-breadcrumbs {border-color:'+(/* theme.link.border?theme.link.border: */theme.link.bg)+'}');
	s.push(context+'.basket-breadcrumbs .button, '+context+'.basket-breadcrumbs label:after {background:transparent;border-color: '+(theme.link.bg)+' !important;color:'+theme.screen.color+'}');
	
	s.push(context+'.basket-breadcrumbs .active, '+context+'.basket-breadcrumbs label.active:after {background:'+(theme.link.transparent?'transparent':theme.link.bg)+';color:'+(theme.link.bg?theme.link.color:theme.screen.color)+' !important}');

	let border_color_focus = /* (theme.link.border && theme.link.border)?theme.link.border: */theme.link.bg;
	if (typeof border_color_focus == 'string' && border_color_focus.toLowerCase() != '#ffffff') s.push(context+'.block-form input[type="text"]:focus, '+context+'.block-form input[type="tel"]:focus, '+context+'.block-form input[type="email"]:focus, '+context+'.block-form input[type="number"]:focus, '+context+'.block-form textarea:focus, '+context+'.block-form .select select:focus, '+context+'.form-field .pagination-previous:focus, '+context+'.form-field .pagination-next:focus, '+context+'.form-field .pagination-link:focus {border-color: '+border_color_focus+' !important;box-shadow: 0 0px 0 1px '+border_color_focus+' !important;}');

	s.push(context+'.select-tap .button {' + (theme.link.bg?('border-color:'+theme.link.bg+' !important'):'') + '}');
	
	s.push(context+'.select-tap .button.in {border-color: '+(/* theme.link.border?theme.link.border: */theme.link.bg)+'!important;background:'+(theme.link.transparent?'transparent':theme.link.bg)+';color:'+theme.link.color+'}');
	 
	s.push(context+'.block-form .datepicker .datepicker-table .datepicker-body .datepicker-row .datepicker-cell.is-selected {background-color: '+(/* theme.link.border?theme.link.border: */theme.link.bg)+'}');
	s.push(context+'.block-form .datepicker .datepicker-table .datepicker-body .datepicker-row .datepicker-cell.is-today {background: whitesmoke;border-color: whitesmoke}');

	if (theme.link.align == 'left') {
		let offset = Math.max(16, Math.ceil(theme.link.radius / 2));
		s.push(context+'.btn-link-styled:before {right: '+offset+'px;content: "\\f054";}');
		s.push(context+'.btn-link-styled {text-align: left;padding-right: '+((offset*2)+16)+'px !important;justify-content: start;flex-direction: row !important;}');
		s.push(context+'.btn-link-styled.without-thumb {padding-left: '+offset+'px !important}');
	} else {
// 		s.push(context+'.btn-link .thumb {margin-right: -48px}');
// 		s.push(context+'.btn-link .thumb, '+context+'.btn-link .thumb > figure {width:unset !important}');
// 		s.push(context+'.btn-link .thumb > img {max-width:unset !important}');
	}
	
		
	return s.join("\n");
}
var VideoHelper = {
	matchers: [
		{r: /\.(mp4|m3u8|webm)/, p: 'file'},
		{r: /youtube\.com\/watch\?.*?v=([a-zA-Z0-9\-\_]+)/, p: 'youtube'},
		{r: /youtu\.be\/([a-zA-Z0-9\-\_]+)/, p: 'youtube'},
		{r: /youtube\.com\/embed\/([a-zA-Z0-9\-\_]+)/, p: 'youtube'},
		{r: /vimeo\.com\/(video\/)?([a-zA-Z0-9\-\_]+)/, p: 'vimeo'}
	],
	
	getProviderName: function(src) {
		for (i = 0; i < this.matchers.length; i++) {
			if (m = src.match(this.matchers[i].r)) {
				return this.matchers[i].p;
			}
		}
		
		return null;
	},
	
	getProvider: function(options, isAllowAutoplay) {
		let provider = null;
			
		let providers = {
// 				youtube: {s: '//cdn.jsdelivr.net/npm/videojs-youtube@2.6.1/dist/Youtube.min.js', t: 'video/youtube', techOrder:  ["youtube"]},
			youtube: {embeded: (m) => {
				let params = ['showinfo=0&rel=0&playsinline=0'];
				if (options.is_autoplay && isAllowAutoplay) params.push('autoplay=1&autohide=1');
				if (options.is_autohide) params.push('controls=0&disablekb=1');
				return 'https://www.youtube.com/embed/'+m[1]+'?'+params.join('&');
			}},
			vimeo: {embeded: (m) => {
				let params = [];
				if (options.is_autoplay && isAllowAutoplay) params.push('autoplay=1');
				if (options.is_autohide) params.push('title=0&byline=0&portrait=0');
				return 'https://player.vimeo.com/video/'+m[2]+'?'+params.join('&');
			}},
			file: {s: null, t: (filename) => {
				let formats = {
					'mp4': 'video/mp4',
					'm3u8': 'application/x-mpegURL',
					'webm': 'video/webm'
				}
			}}
		}

		for (i = 0; i < this.matchers.length; i++) {
			if (m = options.url.match(this.matchers[i].r)) {
				provider = providers[this.matchers[i].p];
				provider.match = m;
				break;
			}
		}
		
		return provider;
	}
};