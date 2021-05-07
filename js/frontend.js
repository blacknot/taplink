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
/**
 * @file postscribe
 * @description Asynchronously write javascript, even with document.write.
 * @version v2.0.8
 * @see {@link https://krux.github.io/postscribe}
 * @license MIT
 * @author Derek Brans
 * @copyright 2016 Krux Digital, Inc
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["postscribe"] = factory();
	else
		root["postscribe"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _postscribe = __webpack_require__(1);
	
	var _postscribe2 = _interopRequireDefault(_postscribe);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	module.exports = _postscribe2['default'];

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	exports['default'] = postscribe;
	
	var _writeStream = __webpack_require__(2);
	
	var _writeStream2 = _interopRequireDefault(_writeStream);
	
	var _utils = __webpack_require__(4);
	
	var utils = _interopRequireWildcard(_utils);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	/**
	 * A function that intentionally does nothing.
	 */
	function doNothing() {}
	
	/**
	 * Available options and defaults.
	 *
	 * @type {Object}
	 */
	var OPTIONS = {
	  /**
	   * Called when an async script has loaded.
	   */
	  afterAsync: doNothing,
	
	  /**
	   * Called immediately before removing from the write queue.
	   */
	  afterDequeue: doNothing,
	
	  /**
	   * Called sync after a stream's first thread release.
	   */
	  afterStreamStart: doNothing,
	
	  /**
	   * Called after writing buffered document.write calls.
	   */
	  afterWrite: doNothing,
	
	  /**
	   * Allows disabling the autoFix feature of prescribe
	   */
	  autoFix: true,
	
	  /**
	   * Called immediately before adding to the write queue.
	   */
	  beforeEnqueue: doNothing,
	
	  /**
	   * Called before writing a token.
	   *
	   * @param {Object} tok The token
	   */
	  beforeWriteToken: function beforeWriteToken(tok) {
	    return tok;
	  },
	
	  /**
	   * Called before writing buffered document.write calls.
	   *
	   * @param {String} str The string
	   */
	  beforeWrite: function beforeWrite(str) {
	    return str;
	  },
	
	  /**
	   * Called when evaluation is finished.
	   */
	  done: doNothing,
	
	  /**
	   * Called when a write results in an error.
	   *
	   * @param {Error} e The error
	   */
	  error: function error(e) {
	    throw new Error(e.msg);
	  },
	
	
	  /**
	   * Whether to let scripts w/ async attribute set fall out of the queue.
	   */
	  releaseAsync: false
	};
	
	var nextId = 0;
	var queue = [];
	var active = null;
	
	function nextStream() {
	  var args = queue.shift();
	  if (args) {
	    var options = utils.last(args);
	
	    options.afterDequeue();
	    args.stream = runStream.apply(undefined, args);
	    options.afterStreamStart();
	  }
	}
	
	function runStream(el, html, options) {
	  active = new _writeStream2['default'](el, options);
	
	  // Identify this stream.
	  active.id = nextId++;
	  active.name = options.name || active.id;
	  postscribe.streams[active.name] = active;
	
	  // Override document.write.
	  var doc = el.ownerDocument;
	
	  var stash = {
	    close: doc.close,
	    open: doc.open,
	    write: doc.write,
	    writeln: doc.writeln
	  };
	
	  function _write(str) {
	    str = options.beforeWrite(str);
	    active.write(str);
	    options.afterWrite(str);
	  }
	
	  _extends(doc, {
	    close: doNothing,
	    open: doNothing,
	    write: function write() {
	      for (var _len = arguments.length, str = Array(_len), _key = 0; _key < _len; _key++) {
	        str[_key] = arguments[_key];
	      }
	
	      return _write(str.join(''));
	    },
	    writeln: function writeln() {
	      for (var _len2 = arguments.length, str = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	        str[_key2] = arguments[_key2];
	      }
	
	      return _write(str.join('') + '\n');
	    }
	  });
	  
	  // Override window.onerror
	  var oldOnError = active.win.onerror || doNothing;
	
	  // This works together with the try/catch around WriteStream::insertScript
	  // In modern browsers, exceptions in tag scripts go directly to top level
	  active.win.onerror = function (msg, url, line) {
	    options.error({ msg: msg + ' - ' + url + ': ' + line });
	    oldOnError.apply(active.win, [msg, url, line]);
	  };
	
	  // Write to the stream
	  active.write(html, function () {
	    // restore document.write
	    _extends(doc, stash);
	
	    // restore window.onerror
	    active.win.onerror = oldOnError;
	
	    options.done();
	    active = null;
	    nextStream();
	  });
	
	  return active;
	}
	
	function postscribe(el, html, options) {
	  if (utils.isFunction(options)) {
	    options = { done: options };
	  } else if (options === 'clear') {
	    queue = [];
	    active = null;
	    nextId = 0;
	    return;
	  }
	
	  options = utils.defaults(options, OPTIONS);
	
	  // id selector
	  if (/^#/.test(el)) {
	    el = window.document.getElementById(el.substr(1));
	  } else {
	    el = el.jquery ? el[0] : el;
	  }
	
	  var args = [el, html, options];
	
	  el.postscribe = {
	    cancel: function cancel() {
	      if (args.stream) {
	        args.stream.abort();
	      } else {
	        args[1] = doNothing;
	      }
	    }
	  };
	
	  options.beforeEnqueue(args);
	  queue.push(args);
	
	  if (!active) {
	    nextStream();
	  }
	
	  return el.postscribe;
	}
	
	_extends(postscribe, {
	  // Streams by name.
	  streams: {},
	  // Queue of streams.
	  queue: queue,
	  // Expose internal classes.
	  WriteStream: _writeStream2['default']
	});

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _prescribe = __webpack_require__(3);
	
	var _prescribe2 = _interopRequireDefault(_prescribe);
	
	var _utils = __webpack_require__(4);
	
	var utils = _interopRequireWildcard(_utils);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	/**
	 * Turn on to debug how each chunk affected the DOM.
	 * @type {boolean}
	 */
	var DEBUG_CHUNK = false;
	
	/**
	 * Prefix for data attributes on DOM elements.
	 * @type {string}
	 */
	var BASEATTR = 'data-ps-';
	
	/**
	 * ID for the style proxy
	 * @type {string}
	 */
	var PROXY_STYLE = 'ps-style';
	
	/**
	 * ID for the script proxy
	 * @type {string}
	 */
	var PROXY_SCRIPT = 'ps-script';
	
	/**
	 * Get data attributes
	 *
	 * @param {Object} el The DOM element.
	 * @param {String} name The attribute name.
	 * @returns {String}
	 */
	function getData(el, name) {
	  var attr = BASEATTR + name;
	
	  var val = el.getAttribute(attr);
	
	  // IE 8 returns a number if it's a number
	  return !utils.existy(val) ? val : String(val);
	}
	
	/**
	 * Set data attributes
	 *
	 * @param {Object} el The DOM element.
	 * @param {String} name The attribute name.
	 * @param {null|*} value The attribute value.
	 */
	function setData(el, name) {
	  var value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
	
	  var attr = BASEATTR + name;
	
	  if (utils.existy(value) && value !== '') {
	    el.setAttribute(attr, value);
	  } else {
	    el.removeAttribute(attr);
	  }
	}
	
	/**
	 * Stream static html to an element, where "static html" denotes "html
	 * without scripts".
	 *
	 * This class maintains a *history of writes devoid of any attributes* or
	 * "proxy history".
	 *
	 * Injecting the proxy history into a temporary div has no side-effects,
	 * other than to create proxy elements for previously written elements.
	 *
	 * Given the `staticHtml` of a new write, a `tempDiv`'s innerHTML is set to
	 * `proxy_history + staticHtml`.
	 * The *structure* of `tempDiv`'s contents, (i.e., the placement of new nodes
	 * beside or inside of proxy elements), reflects the DOM structure that would
	 * have resulted if all writes had been squashed into a single write.
	 *
	 * For each descendent `node` of `tempDiv` whose parentNode is a *proxy*,
	 * `node` is appended to the corresponding *real* element within the DOM.
	 *
	 * Proxy elements are mapped to *actual* elements in the DOM by injecting a
	 * `data-id` attribute into each start tag in `staticHtml`.
	 *
	 */
	
	var WriteStream = function () {
	  /**
	   * Constructor.
	   *
	   * @param {Object} root The root element
	   * @param {?Object} options The options
	   */
	  function WriteStream(root) {
	    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	
	    _classCallCheck(this, WriteStream);
	
	    this.root = root;
	    this.options = options;
	    this.doc = root.ownerDocument;
	    this.win = this.doc.defaultView || this.doc.parentWindow;
	    this.parser = new _prescribe2['default']('', { autoFix: options.autoFix });
	
	    // Actual elements by id.
	    this.actuals = [root];
	
	    // Embodies the "structure" of what's been written so far,
	    // devoid of attributes.
	    this.proxyHistory = '';
	
	    // Create a proxy of the root element.
	    this.proxyRoot = this.doc.createElement(root.nodeName);
	
	    this.scriptStack = [];
	    this.writeQueue = [];
	
	    setData(this.proxyRoot, 'proxyof', 0);
	  }
	
	  /**
	   * Writes the given strings.
	   *
	   * @param {...String} str The strings to write
	   */
	
	
	  WriteStream.prototype.write = function write() {
	    var _writeQueue;
	
	    (_writeQueue = this.writeQueue).push.apply(_writeQueue, arguments);
	
	    // Process writes
	    // When new script gets pushed or pending this will stop
	    // because new writeQueue gets pushed
	    while (!this.deferredRemote && this.writeQueue.length) {
	      var arg = this.writeQueue.shift();
	
	      if (utils.isFunction(arg)) {
	        this._callFunction(arg);
	      } else {
	        this._writeImpl(arg);
	      }
	    }
	  };
	
	  /**
	   * Calls the given function.
	   *
	   * @param {Function} fn The function to call
	   * @private
	   */
	
	
	  WriteStream.prototype._callFunction = function _callFunction(fn) {
	    var tok = { type: 'function', value: fn.name || fn.toString() };
	    this._onScriptStart(tok);
	    fn.call(this.win, this.doc);
	    this._onScriptDone(tok);
	  };
	
	  /**
	   * The write implementation
	   *
	   * @param {String} html The HTML to write.
	   * @private
	   */
	
	
	  WriteStream.prototype._writeImpl = function _writeImpl(html) {
	    this.parser.append(html);
	
	    var tok = void 0;
	    var script = void 0;
	    var style = void 0;
	    var tokens = [];
	
	    // stop if we see a script token
	    while ((tok = this.parser.readToken()) && !(script = utils.isScript(tok)) && !(style = utils.isStyle(tok))) {
	      tok = this.options.beforeWriteToken(tok);
	
	      if (tok) {
	        tokens.push(tok);
	      }
	    }
	
	    if (tokens.length > 0) {
	      this._writeStaticTokens(tokens);
	    }
	
	    if (script) {
	      this._handleScriptToken(tok);
	    }
	
	    if (style) {
	      this._handleStyleToken(tok);
	    }
	  };
	
	  /**
	   * Write contiguous non-script tokens (a chunk)
	   *
	   * @param {Array<Object>} tokens The tokens
	   * @returns {{tokens, raw, actual, proxy}|null}
	   * @private
	   */
	
	
	  WriteStream.prototype._writeStaticTokens = function _writeStaticTokens(tokens) {
	    var chunk = this._buildChunk(tokens);
	
	    if (!chunk.actual) {
	      // e.g., no tokens, or a noscript that got ignored
	      return null;
	    }
	
	    chunk.html = this.proxyHistory + chunk.actual;
	    this.proxyHistory += chunk.proxy;
	    this.proxyRoot.innerHTML = chunk.html;
	
	    if (DEBUG_CHUNK) {
	      chunk.proxyInnerHTML = this.proxyRoot.innerHTML;
	    }
	
	    this._walkChunk();
	
	    if (DEBUG_CHUNK) {
	      chunk.actualInnerHTML = this.root.innerHTML;
	    }
	
	    return chunk;
	  };
	
	  /**
	   * Build a chunk.
	   *
	   * @param {Array<Object>} tokens The tokens to use.
	   * @returns {{tokens: *, raw: string, actual: string, proxy: string}}
	   * @private
	   */
	
	
	  WriteStream.prototype._buildChunk = function _buildChunk(tokens) {
	    var nextId = this.actuals.length;
	
	    // The raw html of this chunk.
	    var raw = [];
	
	    // The html to create the nodes in the tokens (with id's injected).
	    var actual = [];
	
	    // Html that can later be used to proxy the nodes in the tokens.
	    var proxy = [];
	
	    var len = tokens.length;
	    for (var i = 0; i < len; i++) {
	      var tok = tokens[i];
	      var tokenRaw = tok.toString();
	
	      raw.push(tokenRaw);
	
	      if (tok.attrs) {
	        // tok.attrs <==> startTag or atomicTag or cursor
	        // Ignore noscript tags. They are atomic, so we don't have to worry about children.
	        if (!/^noscript$/i.test(tok.tagName)) {
	          var id = nextId++;
	
	          // Actual: inject id attribute: replace '>' at end of start tag with id attribute + '>'
	          actual.push(tokenRaw.replace(/(\/?>)/, ' ' + BASEATTR + 'id=' + id + ' $1'));
	
	          // Don't proxy scripts: they have no bearing on DOM structure.
	          if (tok.attrs.id !== PROXY_SCRIPT && tok.attrs.id !== PROXY_STYLE) {
	            // Proxy: strip all attributes and inject proxyof attribute
	            proxy.push(
	            // ignore atomic tags (e.g., style): they have no "structural" effect
	            tok.type === 'atomicTag' ? '' : '<' + tok.tagName + ' ' + BASEATTR + 'proxyof=' + id + (tok.unary ? ' />' : '>'));
	          }
	        }
	      } else {
	        // Visit any other type of token
	        // Actual: append.
	        actual.push(tokenRaw);
	
	        // Proxy: append endTags. Ignore everything else.
	        proxy.push(tok.type === 'endTag' ? tokenRaw : '');
	      }
	    }
	
	    return {
	      tokens: tokens,
	      raw: raw.join(''),
	      actual: actual.join(''),
	      proxy: proxy.join('')
	    };
	  };
	
	  /**
	   * Walk the chunks.
	   *
	   * @private
	   */
	
	
	  WriteStream.prototype._walkChunk = function _walkChunk() {
	    var node = void 0;
	    var stack = [this.proxyRoot];
	
	    // use shift/unshift so that children are walked in document order
	    while (utils.existy(node = stack.shift())) {
	      var isElement = node.nodeType === 1;
	      var isProxy = isElement && getData(node, 'proxyof');
	
	      // Ignore proxies
	      if (!isProxy) {
	        if (isElement) {
	          // New actual element: register it and remove the the id attr.
	          this.actuals[getData(node, 'id')] = node;
	          setData(node, 'id');
	        }
	
	        // Is node's parent a proxy?
	        var parentIsProxyOf = node.parentNode && getData(node.parentNode, 'proxyof');
	        if (parentIsProxyOf) {
	          // Move node under actual parent.
	          this.actuals[parentIsProxyOf].appendChild(node);
	        }
	      }
	
	      // prepend childNodes to stack
	      stack.unshift.apply(stack, utils.toArray(node.childNodes));
	    }
	  };
	
	  /**
	   * Handles Script tokens
	   *
	   * @param {Object} tok The token
	   */
	
	
	  WriteStream.prototype._handleScriptToken = function _handleScriptToken(tok) {
	    var _this = this;
	
	    var remainder = this.parser.clear();
	
	    if (remainder) {
	      // Write remainder immediately behind this script.
	      this.writeQueue.unshift(remainder);
	    }
	
	    tok.src = tok.attrs.src || tok.attrs.SRC;
	
	    tok = this.options.beforeWriteToken(tok);
	    if (!tok) {
	      // User has removed this token
	      return;
	    }
	
	    if (tok.src && this.scriptStack.length) {
	      // Defer this script until scriptStack is empty.
	      // Assumption 1: This script will not start executing until
	      // scriptStack is empty.
	      this.deferredRemote = tok;
	    } else {
	      this._onScriptStart(tok);
	    }
	
	    // Put the script node in the DOM.
	    this._writeScriptToken(tok, function () {
	      _this._onScriptDone(tok);
	    });
	  };
	
	  /**
	   * Handles style tokens
	   *
	   * @param {Object} tok The token
	   */
	
	
	  WriteStream.prototype._handleStyleToken = function _handleStyleToken(tok) {
	    var remainder = this.parser.clear();
	
	    if (remainder) {
	      // Write remainder immediately behind this style.
	      this.writeQueue.unshift(remainder);
	    }
	
	    tok.type = tok.attrs.type || tok.attrs.TYPE || 'text/css';
	
	    tok = this.options.beforeWriteToken(tok);
	
	    if (tok) {
	      // Put the style node in the DOM.
	      this._writeStyleToken(tok);
	    }
	
	    if (remainder) {
	      this.write();
	    }
	  };
	
	  /**
	   * Build a style and insert it into the DOM.
	   *
	   * @param {Object} tok The token
	   */
	
	
	  WriteStream.prototype._writeStyleToken = function _writeStyleToken(tok) {
	    var el = this._buildStyle(tok);
	
	    this._insertCursor(el, PROXY_STYLE);
	
	    // Set content
	    if (tok.content) {
	      if (el.styleSheet && !el.sheet) {
	        el.styleSheet.cssText = tok.content;
	      } else {
	        el.appendChild(this.doc.createTextNode(tok.content));
	      }
	    }
	  };
	
	  /**
	   * Build a style element from an atomic style token.
	   *
	   * @param {Object} tok The token
	   * @returns {Element}
	   */
	
	
	  WriteStream.prototype._buildStyle = function _buildStyle(tok) {
	    var el = this.doc.createElement(tok.tagName);
	
	    el.setAttribute('type', tok.type);
	
	    // Set attributes
	    utils.eachKey(tok.attrs, function (name, value) {
	      el.setAttribute(name, value);
	    });
	
	    return el;
	  };
	
	  /**
	   * Append a span to the stream. That span will act as a cursor
	   * (i.e. insertion point) for the element.
	   *
	   * @param {Object} el The element
	   * @param {string} which The type of proxy element
	   */
	
	
	  WriteStream.prototype._insertCursor = function _insertCursor(el, which) {
	    this._writeImpl('<span id="' + which + '"/>');
	
	    var cursor = this.doc.getElementById(which);
	
	    if (cursor) {
	      cursor.parentNode.replaceChild(el, cursor);
	    }
	  };
	
	  /**
	   * Called when a script is started.
	   *
	   * @param {Object} tok The token
	   * @private
	   */
	
	
	  WriteStream.prototype._onScriptStart = function _onScriptStart(tok) {
	    tok.outerWrites = this.writeQueue;
	    this.writeQueue = [];
	    this.scriptStack.unshift(tok);
	  };
	
	  /**
	   * Called when a script is done.
	   *
	   * @param {Object} tok The token
	   * @private
	   */
	
	
	  WriteStream.prototype._onScriptDone = function _onScriptDone(tok) {
	    // Pop script and check nesting.
	    if (tok !== this.scriptStack[0]) {
	      this.options.error({ msg: 'Bad script nesting or script finished twice' });
	      return;
	    }
	
	    this.scriptStack.shift();
	
	    // Append outer writes to queue and process them.
	    this.write.apply(this, tok.outerWrites);
	
	    // Check for pending remote
	
	    // Assumption 2: if remote_script1 writes remote_script2 then
	    // the we notice remote_script1 finishes before remote_script2 starts.
	    // I think this is equivalent to assumption 1
	    if (!this.scriptStack.length && this.deferredRemote) {
	      this._onScriptStart(this.deferredRemote);
	      this.deferredRemote = null;
	    }
	  };
	
	  /**
	   * Build a script and insert it into the DOM.
	   * Done is called once script has executed.
	   *
	   * @param {Object} tok The token
	   * @param {Function} done The callback when complete
	   */
	
	
	  WriteStream.prototype._writeScriptToken = function _writeScriptToken(tok, done) {
	    var el = this._buildScript(tok);
	    var asyncRelease = this._shouldRelease(el);
	    var afterAsync = this.options.afterAsync;
	
	    if (tok.src) {
	      // Fix for attribute "SRC" (capitalized). IE does not recognize it.
	      el.src = tok.src;
	      this._scriptLoadHandler(el, !asyncRelease ? function () {
	        done();
	        afterAsync();
	      } : afterAsync);
	    }
	
	    try {
	      this._insertCursor(el, PROXY_SCRIPT);
	      if (!el.src || asyncRelease) {
	        done();
	      }
	    } catch (e) {
	      this.options.error(e);
	      done();
	    }
	  };
	
	  /**
	   * Build a script element from an atomic script token.
	   *
	   * @param {Object} tok The token
	   * @returns {Element}
	   */
	
	
	  WriteStream.prototype._buildScript = function _buildScript(tok) {
	    var el = this.doc.createElement(tok.tagName);
	
	    // Set attributes
	    utils.eachKey(tok.attrs, function (name, value) {
	      el.setAttribute(name, value);
	    });
	
	    // Set content
	    if (tok.content) {
	      el.text = tok.content;
	    }
	
	    return el;
	  };
	
	  /**
	   * Setup the script load handler on an element.
	   *
	   * @param {Object} el The element
	   * @param {Function} done The callback
	   * @private
	   */
	
	
	  WriteStream.prototype._scriptLoadHandler = function _scriptLoadHandler(el, done) {
	    function cleanup() {
	      el = el.onload = el.onreadystatechange = el.onerror = null;
	    }
	
	    var error = this.options.error;
	
	    function success() {
	      cleanup();
	      if (done != null) {
	        done();
	      }
	      done = null;
	    }
	
	    function failure(err) {
	      cleanup();
	      error(err);
	      if (done != null) {
	        done();
	      }
	      done = null;
	    }
	
	    function reattachEventListener(el, evt) {
	      var handler = el['on' + evt];
	      if (handler != null) {
	        el['_on' + evt] = handler;
	      }
	    }
	
	    reattachEventListener(el, 'load');
	    reattachEventListener(el, 'error');
	
	    _extends(el, {
	      onload: function onload() {
	        if (el._onload) {
	          try {
	            el._onload.apply(this, Array.prototype.slice.call(arguments, 0));
	          } catch (err) {
	            failure({ msg: 'onload handler failed ' + err + ' @ ' + el.src });
	          }
	        }
	        success();
	      },
	      onerror: function onerror() {
	        if (el._onerror) {
	          try {
	            el._onerror.apply(this, Array.prototype.slice.call(arguments, 0));
	          } catch (err) {
	            failure({ msg: 'onerror handler failed ' + err + ' @ ' + el.src });
	            return;
	          }
	        }
	        failure({ msg: 'remote script failed ' + el.src });
	      },
	      onreadystatechange: function onreadystatechange() {
	        if (/^(loaded|complete)$/.test(el.readyState)) {
	          success();
	        }
	      }
	    });
	  };
	
	  /**
	   * Determines whether to release.
	   *
	   * @param {Object} el The element
	   * @returns {boolean}
	   * @private
	   */
	
	
	  WriteStream.prototype._shouldRelease = function _shouldRelease(el) {
	    var isScript = /^script$/i.test(el.nodeName);
	    return !isScript || !!(this.options.releaseAsync && el.src && el.hasAttribute('async'));
	  };
	
	  return WriteStream;
	}();
	
	exports['default'] = WriteStream;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @file prescribe
	 * @description Tiny, forgiving HTML parser
	 * @version vundefined
	 * @see {@link https://github.com/krux/prescribe/}
	 * @license MIT
	 * @author Derek Brans
	 * @copyright 2016 Krux Digital, Inc
	 */
	(function webpackUniversalModuleDefinition(root, factory) {
		if(true)
			module.exports = factory();
		else if(typeof define === 'function' && define.amd)
			define([], factory);
		else if(typeof exports === 'object')
			exports["Prescribe"] = factory();
		else
			root["Prescribe"] = factory();
	})(this, function() {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};
	
	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {
	
	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId])
	/******/ 			return installedModules[moduleId].exports;
	
	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			exports: {},
	/******/ 			id: moduleId,
	/******/ 			loaded: false
	/******/ 		};
	
	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
	
	/******/ 		// Flag the module as loaded
	/******/ 		module.loaded = true;
	
	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}
	
	
	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;
	
	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;
	
	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";
	
	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(0);
	/******/ })
	/************************************************************************/
	/******/ ([
	/* 0 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
	
		var _HtmlParser = __webpack_require__(1);
	
		var _HtmlParser2 = _interopRequireDefault(_HtmlParser);
	
		function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
		module.exports = _HtmlParser2['default'];
	
	/***/ },
	/* 1 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
	
		exports.__esModule = true;
	
		var _supports = __webpack_require__(2);
	
		var supports = _interopRequireWildcard(_supports);
	
		var _streamReaders = __webpack_require__(3);
	
		var streamReaders = _interopRequireWildcard(_streamReaders);
	
		var _fixedReadTokenFactory = __webpack_require__(6);
	
		var _fixedReadTokenFactory2 = _interopRequireDefault(_fixedReadTokenFactory);
	
		var _utils = __webpack_require__(5);
	
		function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
		function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
		function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
		/**
		 * Detection regular expressions.
		 *
		 * Order of detection matters: detection of one can only
		 * succeed if detection of previous didn't
	
		 * @type {Object}
		 */
		var detect = {
		  comment: /^<!--/,
		  endTag: /^<\//,
		  atomicTag: /^<\s*(script|style|noscript|iframe|textarea)[\s\/>]/i,
		  startTag: /^</,
		  chars: /^[^<]/
		};
	
		/**
		 * HtmlParser provides the capability to parse HTML and return tokens
		 * representing the tags and content.
		 */
	
		var HtmlParser = function () {
		  /**
		   * Constructor.
		   *
		   * @param {string} stream The initial parse stream contents.
		   * @param {Object} options The options
		   * @param {boolean} options.autoFix Set to true to automatically fix errors
		   */
		  function HtmlParser() {
		    var _this = this;
	
		    var stream = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
		    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	
		    _classCallCheck(this, HtmlParser);
	
		    this.stream = stream;
	
		    var fix = false;
		    var fixedTokenOptions = {};
	
		    for (var key in supports) {
		      if (supports.hasOwnProperty(key)) {
		        if (options.autoFix) {
		          fixedTokenOptions[key + 'Fix'] = true; // !supports[key];
		        }
		        fix = fix || fixedTokenOptions[key + 'Fix'];
		      }
		    }
	
		    if (fix) {
		      this._readToken = (0, _fixedReadTokenFactory2['default'])(this, fixedTokenOptions, function () {
		        return _this._readTokenImpl();
		      });
		      this._peekToken = (0, _fixedReadTokenFactory2['default'])(this, fixedTokenOptions, function () {
		        return _this._peekTokenImpl();
		      });
		    } else {
		      this._readToken = this._readTokenImpl;
		      this._peekToken = this._peekTokenImpl;
		    }
		  }
	
		  /**
		   * Appends the given string to the parse stream.
		   *
		   * @param {string} str The string to append
		   */
	
	
		  HtmlParser.prototype.append = function append(str) {
		    this.stream += str;
		  };
	
		  /**
		   * Prepends the given string to the parse stream.
		   *
		   * @param {string} str The string to prepend
		   */
	
	
		  HtmlParser.prototype.prepend = function prepend(str) {
		    this.stream = str + this.stream;
		  };
	
		  /**
		   * The implementation of the token reading.
		   *
		   * @private
		   * @returns {?Token}
		   */
	
	
		  HtmlParser.prototype._readTokenImpl = function _readTokenImpl() {
		    var token = this._peekTokenImpl();
		    if (token) {
		      this.stream = this.stream.slice(token.length);
		      return token;
		    }
		  };
	
		  /**
		   * The implementation of token peeking.
		   *
		   * @returns {?Token}
		   */
	
	
		  HtmlParser.prototype._peekTokenImpl = function _peekTokenImpl() {
		    for (var type in detect) {
		      if (detect.hasOwnProperty(type)) {
		        if (detect[type].test(this.stream)) {
		          var token = streamReaders[type](this.stream);
	
		          if (token) {
		            if (token.type === 'startTag' && /script|style/i.test(token.tagName)) {
		              return null;
		            } else {
		              token.text = this.stream.substr(0, token.length);
		              return token;
		            }
		          }
		        }
		      }
		    }
		  };
	
		  /**
		   * The public token peeking interface.  Delegates to the basic token peeking
		   * or a version that performs fixups depending on the `autoFix` setting in
		   * options.
		   *
		   * @returns {object}
		   */
	
	
		  HtmlParser.prototype.peekToken = function peekToken() {
		    return this._peekToken();
		  };
	
		  /**
		   * The public token reading interface.  Delegates to the basic token reading
		   * or a version that performs fixups depending on the `autoFix` setting in
		   * options.
		   *
		   * @returns {object}
		   */
	
	
		  HtmlParser.prototype.readToken = function readToken() {
		    return this._readToken();
		  };
	
		  /**
		   * Read tokens and hand to the given handlers.
		   *
		   * @param {Object} handlers The handlers to use for the different tokens.
		   */
	
	
		  HtmlParser.prototype.readTokens = function readTokens(handlers) {
		    var tok = void 0;
		    while (tok = this.readToken()) {
		      // continue until we get an explicit "false" return
		      if (handlers[tok.type] && handlers[tok.type](tok) === false) {
		        return;
		      }
		    }
		  };
	
		  /**
		   * Clears the parse stream.
		   *
		   * @returns {string} The contents of the parse stream before clearing.
		   */
	
	
		  HtmlParser.prototype.clear = function clear() {
		    var rest = this.stream;
		    this.stream = '';
		    return rest;
		  };
	
		  /**
		   * Returns the rest of the parse stream.
		   *
		   * @returns {string} The contents of the parse stream.
		   */
	
	
		  HtmlParser.prototype.rest = function rest() {
		    return this.stream;
		  };
	
		  return HtmlParser;
		}();
	
		exports['default'] = HtmlParser;
	
	
		HtmlParser.tokenToString = function (tok) {
		  return tok.toString();
		};
	
		HtmlParser.escapeAttributes = function (attrs) {
		  var escapedAttrs = {};
	
		  for (var name in attrs) {
		    if (attrs.hasOwnProperty(name)) {
		      escapedAttrs[name] = (0, _utils.escapeQuotes)(attrs[name], null);
		    }
		  }
	
		  return escapedAttrs;
		};
	
		HtmlParser.supports = supports;
	
		for (var key in supports) {
		  if (supports.hasOwnProperty(key)) {
		    HtmlParser.browserHasFlaw = HtmlParser.browserHasFlaw || !supports[key] && key;
		  }
		}
	
	/***/ },
	/* 2 */
	/***/ function(module, exports) {
	
		'use strict';
	
		exports.__esModule = true;
		var tagSoup = false;
		var selfClose = false;
	
		var work = window.document.createElement('div');
	
		try {
		  var html = '<P><I></P></I>';
		  work.innerHTML = html;
		  exports.tagSoup = tagSoup = work.innerHTML !== html;
		} catch (e) {
		  exports.tagSoup = tagSoup = false;
		}
	
		try {
		  work.innerHTML = '<P><i><P></P></i></P>';
		  exports.selfClose = selfClose = work.childNodes.length === 2;
		} catch (e) {
		  exports.selfClose = selfClose = false;
		}
	
		work = null;
	
		exports.tagSoup = tagSoup;
		exports.selfClose = selfClose;
	
	/***/ },
	/* 3 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
	
		exports.__esModule = true;
	
		var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
		exports.comment = comment;
		exports.chars = chars;
		exports.startTag = startTag;
		exports.atomicTag = atomicTag;
		exports.endTag = endTag;
	
		var _tokens = __webpack_require__(4);
	
		/**
		 * Regular Expressions for parsing tags and attributes
		 *
		 * @type {Object}
		 */
		var REGEXES = {
		  startTag: /^<([\-A-Za-z0-9_]+)((?:\s+[\w\-]+(?:\s*=?\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
		  endTag: /^<\/([\-A-Za-z0-9_]+)[^>]*>/,
		  attr: /(?:([\-A-Za-z0-9_]+)\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))|(?:([\-A-Za-z0-9_]+)(\s|$)+)/g,
		  fillAttr: /^(checked|compact|declare|defer|disabled|ismap|multiple|nohref|noresize|noshade|nowrap|readonly|selected)$/i
		};
	
		/**
		 * Reads a comment token
		 *
		 * @param {string} stream The input stream
		 * @returns {CommentToken}
		 */
		function comment(stream) {
		  var index = stream.indexOf('-->');
		  if (index >= 0) {
		    return new _tokens.CommentToken(stream.substr(4, index - 1), index + 3);
		  }
		}
	
		/**
		 * Reads non-tag characters.
		 *
		 * @param {string} stream The input stream
		 * @returns {CharsToken}
		 */
		function chars(stream) {
		  var index = stream.indexOf('<');
		  return new _tokens.CharsToken(index >= 0 ? index : stream.length);
		}
	
		/**
		 * Reads start tag token.
		 *
		 * @param {string} stream The input stream
		 * @returns {StartTagToken}
		 */
		function startTag(stream) {
		  var endTagIndex = stream.indexOf('>');
		  if (endTagIndex !== -1) {
		    var match = stream.match(REGEXES.startTag);
		    if (match) {
		      var _ret = function () {
		        var attrs = {};
		        var booleanAttrs = {};
		        var rest = match[2];
	
		        match[2].replace(REGEXES.attr, function (match, name) {
		          if (!(arguments[2] || arguments[3] || arguments[4] || arguments[5])) {
		            attrs[name] = '';
		          } else if (arguments[5]) {
		            attrs[arguments[5]] = '';
		            booleanAttrs[arguments[5]] = true;
		          } else {
		            attrs[name] = arguments[2] || arguments[3] || arguments[4] || REGEXES.fillAttr.test(name) && name || '';
		          }
	
		          rest = rest.replace(match, '');
		        });
	
		        return {
		          v: new _tokens.StartTagToken(match[1], match[0].length, attrs, booleanAttrs, !!match[3], rest.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ''))
		        };
		      }();
	
		      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
		    }
		  }
		}
	
		/**
		 * Reads atomic tag token.
		 *
		 * @param {string} stream The input stream
		 * @returns {AtomicTagToken}
		 */
		function atomicTag(stream) {
		  var start = startTag(stream);
		  if (start) {
		    var rest = stream.slice(start.length);
		    // for optimization, we check first just for the end tag
		    if (rest.match(new RegExp('<\/\\s*' + start.tagName + '\\s*>', 'i'))) {
		      // capturing the content is inefficient, so we do it inside the if
		      var match = rest.match(new RegExp('([\\s\\S]*?)<\/\\s*' + start.tagName + '\\s*>', 'i'));
		      if (match) {
		        return new _tokens.AtomicTagToken(start.tagName, match[0].length + start.length, start.attrs, start.booleanAttrs, match[1]);
		      }
		    }
		  }
		}
	
		/**
		 * Reads an end tag token.
		 *
		 * @param {string} stream The input stream
		 * @returns {EndTagToken}
		 */
		function endTag(stream) {
		  var match = stream.match(REGEXES.endTag);
		  if (match) {
		    return new _tokens.EndTagToken(match[1], match[0].length);
		  }
		}
	
	/***/ },
	/* 4 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
	
		exports.__esModule = true;
		exports.EndTagToken = exports.AtomicTagToken = exports.StartTagToken = exports.TagToken = exports.CharsToken = exports.CommentToken = exports.Token = undefined;
	
		var _utils = __webpack_require__(5);
	
		function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
		/**
		 * Token is a base class for all token types parsed.  Note we don't actually
		 * use intheritance due to IE8's non-existent ES5 support.
		 */
		var Token =
		/**
		 * Constructor.
		 *
		 * @param {string} type The type of the Token.
		 * @param {Number} length The length of the Token text.
		 */
		exports.Token = function Token(type, length) {
		  _classCallCheck(this, Token);
	
		  this.type = type;
		  this.length = length;
		  this.text = '';
		};
	
		/**
		 * CommentToken represents comment tags.
		 */
	
	
		var CommentToken = exports.CommentToken = function () {
		  /**
		   * Constructor.
		   *
		   * @param {string} content The content of the comment
		   * @param {Number} length The length of the Token text.
		   */
		  function CommentToken(content, length) {
		    _classCallCheck(this, CommentToken);
	
		    this.type = 'comment';
		    this.length = length || (content ? content.length : 0);
		    this.text = '';
		    this.content = content;
		  }
	
		  CommentToken.prototype.toString = function toString() {
		    return '<!--' + this.content;
		  };
	
		  return CommentToken;
		}();
	
		/**
		 * CharsToken represents non-tag characters.
		 */
	
	
		var CharsToken = exports.CharsToken = function () {
		  /**
		   * Constructor.
		   *
		   * @param {Number} length The length of the Token text.
		   */
		  function CharsToken(length) {
		    _classCallCheck(this, CharsToken);
	
		    this.type = 'chars';
		    this.length = length;
		    this.text = '';
		  }
	
		  CharsToken.prototype.toString = function toString() {
		    return this.text;
		  };
	
		  return CharsToken;
		}();
	
		/**
		 * TagToken is a base class for all tag-based Tokens.
		 */
	
	
		var TagToken = exports.TagToken = function () {
		  /**
		   * Constructor.
		   *
		   * @param {string} type The type of the token.
		   * @param {string} tagName The tag name.
		   * @param {Number} length The length of the Token text.
		   * @param {Object} attrs The dictionary of attributes and values
		   * @param {Object} booleanAttrs If an entry has 'true' then the attribute
		   *                              is a boolean attribute
		   */
		  function TagToken(type, tagName, length, attrs, booleanAttrs) {
		    _classCallCheck(this, TagToken);
	
		    this.type = type;
		    this.length = length;
		    this.text = '';
		    this.tagName = tagName;
		    this.attrs = attrs;
		    this.booleanAttrs = booleanAttrs;
		    this.unary = false;
		    this.html5Unary = false;
		  }
	
		  /**
		   * Formats the given token tag.
		   *
		   * @param {TagToken} tok The TagToken to format.
		   * @param {?string} [content=null] The content of the token.
		   * @returns {string} The formatted tag.
		   */
	
	
		  TagToken.formatTag = function formatTag(tok) {
		    var content = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
	
		    var str = '<' + tok.tagName;
		    for (var key in tok.attrs) {
		      if (tok.attrs.hasOwnProperty(key)) {
		        str += ' ' + key;
	
		        var val = tok.attrs[key];
		        if (typeof tok.booleanAttrs === 'undefined' || typeof tok.booleanAttrs[key] === 'undefined') {
		          str += '="' + (0, _utils.escapeQuotes)(val) + '"';
		        }
		      }
		    }
	
		    if (tok.rest) {
		      str += ' ' + tok.rest;
		    }
	
		    if (tok.unary && !tok.html5Unary) {
		      str += '/>';
		    } else {
		      str += '>';
		    }
	
		    if (content !== undefined && content !== null) {
		      str += content + '</' + tok.tagName + '>';
		    }
	
		    return str;
		  };
	
		  return TagToken;
		}();
	
		/**
		 * StartTagToken represents a start token.
		 */
	
	
		var StartTagToken = exports.StartTagToken = function () {
		  /**
		   * Constructor.
		   *
		   * @param {string} tagName The tag name.
		   * @param {Number} length The length of the Token text
		   * @param {Object} attrs The dictionary of attributes and values
		   * @param {Object} booleanAttrs If an entry has 'true' then the attribute
		   *                              is a boolean attribute
		   * @param {boolean} unary True if the tag is a unary tag
		   * @param {string} rest The rest of the content.
		   */
		  function StartTagToken(tagName, length, attrs, booleanAttrs, unary, rest) {
		    _classCallCheck(this, StartTagToken);
	
		    this.type = 'startTag';
		    this.length = length;
		    this.text = '';
		    this.tagName = tagName;
		    this.attrs = attrs;
		    this.booleanAttrs = booleanAttrs;
		    this.html5Unary = false;
		    this.unary = unary;
		    this.rest = rest;
		  }
	
		  StartTagToken.prototype.toString = function toString() {
		    return TagToken.formatTag(this);
		  };
	
		  return StartTagToken;
		}();
	
		/**
		 * AtomicTagToken represents an atomic tag.
		 */
	
	
		var AtomicTagToken = exports.AtomicTagToken = function () {
		  /**
		   * Constructor.
		   *
		   * @param {string} tagName The name of the tag.
		   * @param {Number} length The length of the tag text.
		   * @param {Object} attrs The attributes.
		   * @param {Object} booleanAttrs If an entry has 'true' then the attribute
		   *                              is a boolean attribute
		   * @param {string} content The content of the tag.
		   */
		  function AtomicTagToken(tagName, length, attrs, booleanAttrs, content) {
		    _classCallCheck(this, AtomicTagToken);
	
		    this.type = 'atomicTag';
		    this.length = length;
		    this.text = '';
		    this.tagName = tagName;
		    this.attrs = attrs;
		    this.booleanAttrs = booleanAttrs;
		    this.unary = false;
		    this.html5Unary = false;
		    this.content = content;
		  }
	
		  AtomicTagToken.prototype.toString = function toString() {
		    return TagToken.formatTag(this, this.content);
		  };
	
		  return AtomicTagToken;
		}();
	
		/**
		 * EndTagToken represents an end tag.
		 */
	
	
		var EndTagToken = exports.EndTagToken = function () {
		  /**
		   * Constructor.
		   *
		   * @param {string} tagName The name of the tag.
		   * @param {Number} length The length of the tag text.
		   */
		  function EndTagToken(tagName, length) {
		    _classCallCheck(this, EndTagToken);
	
		    this.type = 'endTag';
		    this.length = length;
		    this.text = '';
		    this.tagName = tagName;
		  }
	
		  EndTagToken.prototype.toString = function toString() {
		    return '</' + this.tagName + '>';
		  };
	
		  return EndTagToken;
		}();
	
	/***/ },
	/* 5 */
	/***/ function(module, exports) {
	
		'use strict';
	
		exports.__esModule = true;
		exports.escapeQuotes = escapeQuotes;
	
		/**
		 * Escape quotes in the given value.
		 *
		 * @param {string} value The value to escape.
		 * @param {string} [defaultValue=''] The default value to return if value is falsy.
		 * @returns {string}
		 */
		function escapeQuotes(value) {
		  var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
	
		  // There's no lookback in JS, so /(^|[^\\])"/ only matches the first of two `"`s.
		  // Instead, just match anything before a double-quote and escape if it's not already escaped.
		  return !value ? defaultValue : value.replace(/([^"]*)"/g, function (_, prefix) {
		    return (/\\/.test(prefix) ? prefix + '"' : prefix + '\\"'
		    );
		  });
		}
	
	/***/ },
	/* 6 */
	/***/ function(module, exports) {
	
		'use strict';
	
		exports.__esModule = true;
		exports['default'] = fixedReadTokenFactory;
		/**
		 * Empty Elements - HTML 4.01
		 *
		 * @type {RegExp}
		 */
		var EMPTY = /^(AREA|BASE|BASEFONT|BR|COL|FRAME|HR|IMG|INPUT|ISINDEX|LINK|META|PARAM|EMBED)$/i;
	
		/**
		 * Elements that you can intentionally leave open (and which close themselves)
		 *
		 * @type {RegExp}
		 */
		var CLOSESELF = /^(COLGROUP|DD|DT|LI|OPTIONS|P|TD|TFOOT|TH|THEAD|TR)$/i;
	
		/**
		 * Corrects a token.
		 *
		 * @param {Token} tok The token to correct
		 * @returns {Token} The corrected token
		 */
		function correct(tok) {
		  if (tok && tok.type === 'startTag') {
		    tok.unary = EMPTY.test(tok.tagName) || tok.unary;
		    tok.html5Unary = !/\/>$/.test(tok.text);
		  }
		  return tok;
		}
	
		/**
		 * Peeks at the next token in the parser.
		 *
		 * @param {HtmlParser} parser The parser
		 * @param {Function} readTokenImpl The underlying readToken implementation
		 * @returns {Token} The next token
		 */
		function peekToken(parser, readTokenImpl) {
		  var tmp = parser.stream;
		  var tok = correct(readTokenImpl());
		  parser.stream = tmp;
		  return tok;
		}
	
		/**
		 * Closes the last token.
		 *
		 * @param {HtmlParser} parser The parser
		 * @param {Array<Token>} stack The stack
		 */
		function closeLast(parser, stack) {
		  var tok = stack.pop();
	
		  // prepend close tag to stream.
		  parser.prepend('</' + tok.tagName + '>');
		}
	
		/**
		 * Create a new token stack.
		 *
		 * @returns {Array<Token>}
		 */
		function newStack() {
		  var stack = [];
	
		  stack.last = function () {
		    return this[this.length - 1];
		  };
	
		  stack.lastTagNameEq = function (tagName) {
		    var last = this.last();
		    return last && last.tagName && last.tagName.toUpperCase() === tagName.toUpperCase();
		  };
	
		  stack.containsTagName = function (tagName) {
		    for (var i = 0, tok; tok = this[i]; i++) {
		      if (tok.tagName === tagName) {
		        return true;
		      }
		    }
		    return false;
		  };
	
		  return stack;
		}
	
		/**
		 * Return a readToken implementation that fixes input.
		 *
		 * @param {HtmlParser} parser The parser
		 * @param {Object} options Options for fixing
		 * @param {boolean} options.tagSoupFix True to fix tag soup scenarios
		 * @param {boolean} options.selfCloseFix True to fix self-closing tags
		 * @param {Function} readTokenImpl The underlying readToken implementation
		 * @returns {Function}
		 */
		function fixedReadTokenFactory(parser, options, readTokenImpl) {
		  var stack = newStack();
	
		  var handlers = {
		    startTag: function startTag(tok) {
		      var tagName = tok.tagName;
	
		      if (tagName.toUpperCase() === 'TR' && stack.lastTagNameEq('TABLE')) {
		        parser.prepend('<TBODY>');
		        prepareNextToken();
		      } else if (options.selfCloseFix && CLOSESELF.test(tagName) && stack.containsTagName(tagName)) {
		        if (stack.lastTagNameEq(tagName)) {
		          closeLast(parser, stack);
		        } else {
		          parser.prepend('</' + tok.tagName + '>');
		          prepareNextToken();
		        }
		      } else if (!tok.unary) {
		        stack.push(tok);
		      }
		    },
		    endTag: function endTag(tok) {
		      var last = stack.last();
		      if (last) {
		        if (options.tagSoupFix && !stack.lastTagNameEq(tok.tagName)) {
		          // cleanup tag soup
		          closeLast(parser, stack);
		        } else {
		          stack.pop();
		        }
		      } else if (options.tagSoupFix) {
		        // cleanup tag soup part 2: skip this token
		        readTokenImpl();
		        prepareNextToken();
		      }
		    }
		  };
	
		  function prepareNextToken() {
		    var tok = peekToken(parser, readTokenImpl);
		    if (tok && handlers[tok.type]) {
		      handlers[tok.type](tok);
		    }
		  }
	
		  return function fixedReadToken() {
		    prepareNextToken();
		    return correct(readTokenImpl());
		  };
		}
	
	/***/ }
	/******/ ])
	});
	;

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';
	
	exports.__esModule = true;
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	exports.existy = existy;
	exports.isFunction = isFunction;
	exports.each = each;
	exports.eachKey = eachKey;
	exports.defaults = defaults;
	exports.toArray = toArray;
	exports.last = last;
	exports.isTag = isTag;
	exports.isScript = isScript;
	exports.isStyle = isStyle;
	/**
	 * Determine if the thing is not undefined and not null.
	 *
	 * @param {*} thing The thing to test
	 * @returns {boolean} True if the thing is not undefined and not null.
	 */
	function existy(thing) {
	  return thing !== void 0 && thing !== null;
	}
	
	/**
	 * Is this a function?
	 *
	 * @param {*} x The variable to test
	 * @returns {boolean} True if the variable is a function
	 */
	function isFunction(x) {
	  return 'function' === typeof x;
	}
	
	/**
	 * Loop over each item in an array-like value.
	 *
	 * @param {Array<*>} arr The array to loop over
	 * @param {Function} fn The function to call
	 * @param {?Object} target The object to bind to the function
	 */
	function each(arr, fn, target) {
	  var i = void 0;
	  var len = arr && arr.length || 0;
	  for (i = 0; i < len; i++) {
	    fn.call(target, arr[i], i);
	  }
	}
	
	/**
	 * Loop over each key/value pair in a hash.
	 *
	 * @param {Object} obj The object
	 * @param {Function} fn The function to call
	 * @param {?Object} target The object to bind to the function
	 */
	function eachKey(obj, fn, target) {
	  for (var key in obj) {
	    if (obj.hasOwnProperty(key)) {
	      fn.call(target, key, obj[key]);
	    }
	  }
	}
	
	/**
	 * Set default options where some option was not specified.
	 *
	 * @param {Object} options The destination
	 * @param {Object} _defaults The defaults
	 * @returns {Object}
	 */
	function defaults(options, _defaults) {
	  options = options || {};
	  eachKey(_defaults, function (key, val) {
	    if (!existy(options[key])) {
	      options[key] = val;
	    }
	  });
	  return options;
	}
	
	/**
	 * Convert value (e.g., a NodeList) to an array.
	 *
	 * @param {*} obj The object
	 * @returns {Array<*>}
	 */
	function toArray(obj) {
	  try {
	    return Array.prototype.slice.call(obj);
	  } catch (e) {
	    var _ret = function () {
	      var ret = [];
	      each(obj, function (val) {
	        ret.push(val);
	      });
	      return {
	        v: ret
	      };
	    }();
	
	    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	  }
	}
	
	/**
	 * Get the last item in an array
	 *
	 * @param {Array<*>} array The array
	 * @returns {*} The last item in the array
	 */
	function last(array) {
	  return array[array.length - 1];
	}
	
	/**
	 * Test if token is a script tag.
	 *
	 * @param {Object} tok The token
	 * @param {String} tag The tag name
	 * @returns {boolean} True if the token is a script tag
	 */
	function isTag(tok, tag) {
	  return !tok || !(tok.type === 'startTag' || tok.type === 'atomicTag') || !('tagName' in tok) ? !1 : !!~tok.tagName.toLowerCase().indexOf(tag);
	}
	
	/**
	 * Test if token is a script tag.
	 *
	 * @param {Object} tok The token
	 * @returns {boolean} True if the token is a script tag
	 */
	function isScript(tok) {
	  return isTag(tok, 'script');
	}
	
	/**
	 * Test if token is a style tag.
	 *
	 * @param {Object} tok The token
	 * @returns {boolean} True if the token is a style tag
	 */
	function isStyle(tok) {
	  return isTag(tok, 'style');
	}

/***/ }
/******/ ])
});
;
(function(e, t) {
    "object" == typeof exports && "object" == typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define([], t) : "object" == typeof exports ? exports.VNumber = t() : e.VNumber = t()
})(this, function() {
    return function(e) {
        function t(r) {
            if (n[r]) return n[r].exports;
            var i = n[r] = {
                i: r,
                l: !1,
                exports: {}
            };
            return e[r].call(i.exports, i, i.exports, t), i.l = !0, i.exports
        }
        var n = {};
        return t.m = e, t.c = n, t.i = function(e) {
            return e
        }, t.d = function(e, n, r) {
            t.o(e, n) || Object.defineProperty(e, n, {
                configurable: !1,
                enumerable: !0,
                get: r
            })
        }, t.n = function(e) {
            var n = e && e.__esModule ? function() {
                return e.default
            } : function() {
                return e
            };
            return t.d(n, "a", n), n
        }, t.o = function(e, t) {
            return Object.prototype.hasOwnProperty.call(e, t)
        }, t.p = ".", t(t.s = 9)
    }([function(e, t, n) {
        "use strict";
        t.a = {
            prefix: "",
            suffix: "",
            thousands: ",",
            decimal: ".",
            precision: 2
        }
    }, function(e, t, n) {
        "use strict";
        var r = n(2),
            i = n(5),
            u = n(0);
        t.a = function(e, t) {
            if (t.value) {
                var o = n.i(i.a)(u.a, t.value);
                if ("INPUT" !== e.tagName.toLocaleUpperCase()) {
                    var a = e.getElementsByTagName("input");
                    1 !== a.length || (e = a[0])
                }
                e.oninput = function() {
                    var positionFromEnd = e.value.length - e.selectionEnd;
                    //e.value = n.i(r.a)(e.value, o), 
                    
                    
                    if(e.value == 'R$ 0,0' || !e.value){
				      e.value = ''
				    }else{
				      e.value = n.i(r.a)(e.value, o)
				    }
                    
                    positionFromEnd = Math.max(positionFromEnd, o.suffix.length), 
                    positionFromEnd = e.value.length - positionFromEnd, 
                    positionFromEnd = Math.max(positionFromEnd, o.prefix.length + 1), 
                    n.i(r.b)(e, positionFromEnd), 
                    e.dispatchEvent(n.i(r.c)("change"))
                }, e.onfocus = function() {
                    n.i(r.b)(e, e.value.length - o.suffix.length)
                }, e.oninput(), e.dispatchEvent(n.i(r.c)("input"))
            }
        }
    }, function(e, t, n) {
        "use strict";
        
        function format(input, opt = defaults) {
		   if ((typeof input === 'string') && (opt.precision == 0)) {
			   let i = input.indexOf('.');
			  if (i != -1) input = input.substring(0, i);
			}
			
		  if (typeof input === 'number') {
			//  console.log('|',fixed(opt.precision));
		    input = input.toFixed(fixed(opt.precision))
//		    input = input.toString();
//	        console.log('=2:', input);
		  }
		  
		  
		  
		  var negative = input.indexOf('-') >= 0 ? '-' : ''
		
		  var numbers = onlyNumbers(input)
		  var currency = numbersToCurrency(numbers, opt.precision)
		  var parts = toStr(currency).split('.')
		  var integer = parts[0]
		  var decimal = parts[1]
		  integer = addThousandSeparator(integer, opt.thousands)



		  var v = ((opt.prefix != undefined)?opt.prefix:'') + negative + joinIntegerAndDecimal(integer, decimal, opt.decimal) + ((opt.suffix != undefined)?opt.suffix:'');
		  return v;
		}
		
		function unformat (input, precision) {
		  var negative = input.indexOf('-') >= 0 ? -1 : 1
		  var numbers = onlyNumbers(input)
		  var currency = numbersToCurrency(numbers, precision)
		  return parseFloat(currency) * negative
		}
		
		function onlyNumbers (input) {
		  return toStr(input).replace(/\D+/g, '') || '0'
		}
		
		// Uncaught RangeError: toFixed() digits argument must be between 0 and 20 at Number.toFixed
		function fixed (precision) {
		  return between(0, precision, 20)
		}
		
		function between (min, n, max) {
		  return Math.max(min, Math.min(n, max))
		}
		
		function numbersToCurrency (numbers, precision) {
		  var exp = Math.pow(10, precision)
		  var float = parseFloat(numbers) / exp
		  return float.toFixed(fixed(precision))
		}
		
		function addThousandSeparator (integer, separator) {
		  return integer.replace(/(\d)(?=(?:\d{3})+\b)/gm, `$1${separator}`)
		}
		
		function currencyToIntegerAndDecimal (float) {
		  return toStr(float).split('.')
		}
		
		function joinIntegerAndDecimal (integer, decimal, separator) {
		  return decimal ? integer + separator + decimal : integer
		}
		
		function toStr (value) {
		  return value ? value.toString() : ''
		}
		
		function setCursor (el, position) {
		  var setSelectionRange = function () { el.setSelectionRange(position, position) }
		  if (el === document.activeElement) {
		    setSelectionRange()
		    setTimeout(setSelectionRange, 1) // Android Fix
		  }
		}
		
		// https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events#The_old-fashioned_way
		function event (name) {
		  var evt = document.createEvent('Event')
		  evt.initEvent(name, true, true)
		  return evt
		}
        
        
        
        window.number_format = format;
        
        
        
        var m = n(0);
        n.d(t, "a", function() {
            return format
        }), n.d(t, "d", function() {
            return unformat
        }), n.d(t, "b", function() {
            return setCursor
        }), n.d(t, "c", function() {
            return event
        })
    }, function(e, t, n) {
        "use strict";

        function r(e, t) {
            t && Object.keys(t).map(function(e) {
                a.a[e] = t[e]
            }), e.directive("number", o.a), e.component("number", u.a)
        }
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var i = n(6),
            u = n.n(i),
            o = n(1),
            a = n(0);
        n.d(t, "Number", function() {
            return u.a
        }), n.d(t, "VNumber", function() {
            return o.a
        }), n.d(t, "options", function() {
            return a.a
        });
        t.default = r, "undefined" != typeof window && window.Vue && window.Vue.use(r)
    }, function(e, t, n) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var r = n(1),
            i = n(0),
            u = n(2);
        t.default = {
            name: "Number",
            props: {
                value: {
                    required: !0,
                    default: 0
                },
                masked: {
                    type: Boolean,
                    default: 0
                },
                precision: {
                    type: Number,
                    default: function() {
	                    return Vue.prototype.$account.number.precision;
//                         return i.a.precision
                    }
                },
                decimal: {
                    type: String,
                    default: function() {
	                    return Vue.prototype.$account.number.decimal;
//                         return i.a.decimal
                    }
                },
                thousands: {
                    type: String,
                    default: function() {
	                    return Vue.prototype.$account.number.thousands;
//                         return i.a.thousands
                    }
                },
                prefix: {
                    type: String,
                    default: function() {
                        return i.a.prefix
                    }
                },
                suffix: {
                    type: String,
                    default: function() {
                        return i.a.suffix
                    }
                }
            },
            directives: {
                number: r.a
            },
            data: function() {
                return {
                    formattedValue: ""
                }
            },
            watch: {
                value: {
                    immediate: true,
                    handler: function(newValue, oldValue) {
                        //var r = n.i(u.a)(newValue, this.$props);
                        if(newValue === null || newValue === ''){
				          var formatted = '';
				        }else{
// 					        console.log(n.i(u.a));
				          var formatted = n.i(u.a)(newValue, this.$props)
				        }
						if (formatted !== this.formattedValue) {
						          this.formattedValue = formatted
						        }	
						        
//                         r !== this.formattedValue && (this.formattedValue = r)
                    }
                }
            },
            methods: {
                change: function(e) {
					this.$emit('input', this.masked ? e.target.value : ( (!e.target.value) ? e.target.value : n.i(u.d)(e.target.value, this.precision)))
                  //this.$emit("input", this.masked ? e.target.value : n.i(u.d)(e.target.value, this.precision))
                }
            }
        }
    }, function(e, t, n) {
        "use strict";
        t.a = function(e, t) {
            return e = e || {}, t = t || {}, Object.keys(e).concat(Object.keys(t)).reduce(function(n, r) {
                return n[r] = void 0 === t[r] ? e[r] : t[r], n
            }, {})
        }
    }, function(e, t, n) {
        var r = n(7)(n(4), n(8), null, null);
        e.exports = r.exports
    }, function(e, t) {
        e.exports = function(e, t, n, r) {
            var i, u = e = e || {},
                o = typeof e.default;
            "object" !== o && "function" !== o || (i = e, u = e.default);
            var a = "function" == typeof u ? u.options : u;
            if (t && (a.render = t.render, a.staticRenderFns = t.staticRenderFns), n && (a._scopeId = n), r) {
                var c = a.computed || (a.computed = {});
                Object.keys(r).forEach(function(e) {
                    var t = r[e];
                    c[e] = function() {
                        return t
                    }
                })
            }
            return {
                esModule: i,
                exports: u,
                options: a
            }
        }
    }, function(e, t) {
        e.exports = {
            render: function() {
                var e = this,
                    t = e.$createElement;
                return (e._self._c || t)("input", {
                    directives: [{
                        name: "number",
                        rawName: "v-number",
                        value: {
                            precision: e.precision,
                            decimal: e.decimal,
                            thousands: e.thousands,
                            prefix: e.prefix,
                            suffix: e.suffix
                        },
                        expression: "{precision, decimal, thousands, prefix, suffix}"
                    }],
                    staticClass: "v-number",
                    attrs: {
                        type: "text"
                    },
                    domProps: {
                        value: e.formattedValue
                    },
                    on: {
                        change: e.change
                    }
                })
            },
            staticRenderFns: []
        }
    }, function(e, t, n) {
        e.exports = n(3)
    }])
});
function date_format(format, timestamp) {
  var jsdate, f
  // Keep this here (works, but for code commented-out below for file size reasons)
  // var tal= [];
  var txtWords = [
    'Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  // trailing backslash -> (dropped)
  // a backslash followed by any character (including backslash) -> the character
  // empty string -> empty string
  var formatChr = /\\?(.?)/gi
  var formatChrCb = function (t, s) {
    return f[t] ? f[t]() : s
  }
  var _pad = function (n, c) {
    n = String(n)
    while (n.length < c) {
      n = '0' + n
    }
    return n
  }
  f = {
    // Day
    d: function () {
      // Day of month w/leading 0; 01..31
      return _pad(f.j(), 2)
    },
    D: function () {
      // Shorthand day name; Mon...Sun
      return f.l()
        .slice(0, 3)
    },
    j: function () {
      // Day of month; 1..31
      return jsdate.getDate()
    },
    l: function () {
      // Full day name; Monday...Sunday
      return txtWords[f.w()] + 'day'
    },
    N: function () {
      // ISO-8601 day of week; 1[Mon]..7[Sun]
      return f.w() || 7
    },
    S: function () {
      // Ordinal suffix for day of month; st, nd, rd, th
      var j = f.j()
      var i = j % 10
      if (i <= 3 && parseInt((j % 100) / 10, 10) === 1) {
        i = 0
      }
      return ['st', 'nd', 'rd'][i - 1] || 'th'
    },
    w: function () {
      // Day of week; 0[Sun]..6[Sat]
      return jsdate.getDay()
    },
    z: function () {
      // Day of year; 0..365
      var a = new Date(f.Y(), f.n() - 1, f.j())
      var b = new Date(f.Y(), 0, 1)
      return Math.round((a - b) / 864e5)
    },

    // Week
    W: function () {
      // ISO-8601 week number
      var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3)
      var b = new Date(a.getFullYear(), 0, 4)
      return _pad(1 + Math.round((a - b) / 864e5 / 7), 2)
    },

    // Month
    F: function () {
      // Full month name; January...December
      return txtWords[6 + f.n()]
    },
    m: function () {
      // Month w/leading 0; 01...12
      return _pad(f.n(), 2)
    },
    M: function () {
      // Shorthand month name; Jan...Dec
      return f.F()
        .slice(0, 3)
    },
    n: function () {
      // Month; 1...12
      return jsdate.getMonth() + 1
    },
    t: function () {
      // Days in month; 28...31
      return (new Date(f.Y(), f.n(), 0))
        .getDate()
    },

    // Year
    L: function () {
      // Is leap year?; 0 or 1
      var j = f.Y()
      return j % 4 === 0 & j % 100 !== 0 | j % 400 === 0
    },
    o: function () {
      // ISO-8601 year
      var n = f.n()
      var W = f.W()
      var Y = f.Y()
      return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0)
    },
    Y: function () {
      // Full year; e.g. 1980...2010
      return jsdate.getFullYear()
    },
    y: function () {
      // Last two digits of year; 00...99
      return f.Y()
        .toString()
        .slice(-2)
    },

    // Time
    a: function () {
      // am or pm
      return jsdate.getHours() > 11 ? 'pm' : 'am'
    },
    A: function () {
      // AM or PM
      return f.a()
        .toUpperCase()
    },
    B: function () {
      // Swatch Internet time; 000..999
      var H = jsdate.getUTCHours() * 36e2
      // Hours
      var i = jsdate.getUTCMinutes() * 60
      // Minutes
      // Seconds
      var s = jsdate.getUTCSeconds()
      return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3)
    },
    g: function () {
      // 12-Hours; 1..12
      return f.G() % 12 || 12
    },
    G: function () {
      // 24-Hours; 0..23
      return jsdate.getHours()
    },
    h: function () {
      // 12-Hours w/leading 0; 01..12
      return _pad(f.g(), 2)
    },
    H: function () {
      // 24-Hours w/leading 0; 00..23
      return _pad(f.G(), 2)
    },
    i: function () {
      // Minutes w/leading 0; 00..59
      return _pad(jsdate.getMinutes(), 2)
    },
    s: function () {
      // Seconds w/leading 0; 00..59
      return _pad(jsdate.getSeconds(), 2)
    },
    u: function () {
      // Microseconds; 000000-999000
      return _pad(jsdate.getMilliseconds() * 1000, 6)
    },

    // Timezone
    e: function () {
      // Timezone identifier; e.g. Atlantic/Azores, ...
      // The following works, but requires inclusion of the very large
      // timezone_abbreviations_list() function.
      /*              return that.date_default_timezone_get();
       */
      var msg = 'Not supported (see source code of date() for timezone on how to add support)'
      throw new Error(msg)
    },
    I: function () {
      // DST observed?; 0 or 1
      // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
      // If they are not equal, then DST is observed.
      var a = new Date(f.Y(), 0)
      // Jan 1
      var c = Date.UTC(f.Y(), 0)
      // Jan 1 UTC
      var b = new Date(f.Y(), 6)
      // Jul 1
      // Jul 1 UTC
      var d = Date.UTC(f.Y(), 6)
      return ((a - c) !== (b - d)) ? 1 : 0
    },
    O: function () {
      // Difference to GMT in hour format; e.g. +0200
      var tzo = jsdate.getTimezoneOffset()
      var a = Math.abs(tzo)
      return (tzo > 0 ? '-' : '+') + _pad(Math.floor(a / 60) * 100 + a % 60, 4)
    },
    P: function () {
      // Difference to GMT w/colon; e.g. +02:00
      var O = f.O()
      return (O.substr(0, 3) + ':' + O.substr(3, 2))
    },
    T: function () {
      // The following works, but requires inclusion of the very
      // large timezone_abbreviations_list() function.
      /*              var abbr, i, os, _default;
      if (!tal.length) {
        tal = that.timezone_abbreviations_list();
      }
      if ($locutus && $locutus.default_timezone) {
        _default = $locutus.default_timezone;
        for (abbr in tal) {
          for (i = 0; i < tal[abbr].length; i++) {
            if (tal[abbr][i].timezone_id === _default) {
              return abbr.toUpperCase();
            }
          }
        }
      }
      for (abbr in tal) {
        for (i = 0; i < tal[abbr].length; i++) {
          os = -jsdate.getTimezoneOffset() * 60;
          if (tal[abbr][i].offset === os) {
            return abbr.toUpperCase();
          }
        }
      }
      */
      return 'UTC'
    },
    Z: function () {
      // Timezone offset in seconds (-43200...50400)
      return -jsdate.getTimezoneOffset() * 60
    },

    // Full Date/Time
    c: function () {
      // ISO-8601 date.
      return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb)
    },
    r: function () {
      // RFC 2822
      return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb)
    },
    U: function () {
      // Seconds since UNIX epoch
      return jsdate / 1000 | 0
    }
  }

  var _date = function (format, timestamp) {
    jsdate = (timestamp === undefined ? new Date() // Not provided
      : (timestamp instanceof Date) ? new Date(timestamp) // JS Date()
      : new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
    )
    return format.replace(formatChr, formatChrCb)
  }

  return _date(format, timestamp)
}
/**
* Detect Element Resize
*
* https://github.com/sdecima/javascript-detect-element-resize
* Sebastian Decima
*
* version: 0.5.3
**/

(function () {
	var attachEvent = document.attachEvent,
		stylesCreated = false;
	
	if (!attachEvent) {
		var requestFrame = (function(){
			var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
								function(fn){ return window.setTimeout(fn, 20); };
			return function(fn){ return raf(fn); };
		})();
		
		var cancelFrame = (function(){
			var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame ||
								   window.clearTimeout;
		  return function(id){ return cancel(id); };
		})();

		var resetTriggers = function(element){
			var triggers = element.__resizeTriggers__,
				expand = triggers.firstElementChild,
				contract = triggers.lastElementChild,
				expandChild = expand.firstElementChild;
			contract.scrollLeft = contract.scrollWidth;
			contract.scrollTop = contract.scrollHeight;
			expandChild.style.width = expand.offsetWidth + 1 + 'px';
			expandChild.style.height = expand.offsetHeight + 1 + 'px';
			expand.scrollLeft = expand.scrollWidth;
			expand.scrollTop = expand.scrollHeight;
		};

		var checkTriggers = function(element){
			return element.offsetWidth != element.__resizeLast__.width ||
						 element.offsetHeight != element.__resizeLast__.height;
		}
		
		var scrollListener = function(e){
			var element = this;
			resetTriggers(this);
			if (this.__resizeRAF__) cancelFrame(this.__resizeRAF__);
			this.__resizeRAF__ = requestFrame(function(){
				if (checkTriggers(element)) {
					element.__resizeLast__.width = element.offsetWidth;
					element.__resizeLast__.height = element.offsetHeight;
					element.__resizeListeners__.forEach(function(fn){
						fn.call(element, e);
					});
				}
			});
		};
		
		/* Detect CSS Animations support to detect element display/re-attach */
		var animation = false,
			animationstring = 'animation',
			keyframeprefix = '',
			animationstartevent = 'animationstart',
			domPrefixes = 'Webkit Moz O ms'.split(' '),
			startEvents = 'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split(' '),
			pfx  = '';
		{
			var elm = document.createElement('fakeelement');
			if( elm.style.animationName !== undefined ) { animation = true; }    
			
			if( animation === false ) {
				for( var i = 0; i < domPrefixes.length; i++ ) {
					if( elm.style[ domPrefixes[i] + 'AnimationName' ] !== undefined ) {
						pfx = domPrefixes[ i ];
						animationstring = pfx + 'Animation';
						keyframeprefix = '-' + pfx.toLowerCase() + '-';
						animationstartevent = startEvents[ i ];
						animation = true;
						break;
					}
				}
			}
		}
		
		var animationName = 'resizeanim';
		var animationKeyframes = '@' + keyframeprefix + 'keyframes ' + animationName + ' { from { opacity: 0; } to { opacity: 0; } } ';
		var animationStyle = keyframeprefix + 'animation: 1ms ' + animationName + '; ';
	}
	
	function createStyles() {
		if (!stylesCreated) {
			//opacity:0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
			var css = (animationKeyframes ? animationKeyframes : '') +
					'.resize-triggers { ' + (animationStyle ? animationStyle : '') + 'visibility: hidden; opacity: 0; } ' +
					'.resize-triggers, .resize-triggers > div, .contract-trigger:before { content: \" \"; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }',
				head = document.head || document.getElementsByTagName('head')[0],
				style = document.createElement('style');
			
			style.type = 'text/css';
			if (style.styleSheet) {
				style.styleSheet.cssText = css;
			} else {
				style.appendChild(document.createTextNode(css));
			}

			head.appendChild(style);
			stylesCreated = true;
		}
	}
	
	window.addResizeListener = function(element, fn){
		if (attachEvent) element.attachEvent('onresize', fn);
		else {
			if (!element.__resizeTriggers__) {
				if (getComputedStyle(element).position == 'static') element.style.position = 'relative';
				createStyles();
				element.__resizeLast__ = {};
				element.__resizeListeners__ = [];
				(element.__resizeTriggers__ = document.createElement('div')).className = 'resize-triggers';
				element.__resizeTriggers__.innerHTML = '<div class="expand-trigger"><div></div></div>' +
																						'<div class="contract-trigger"></div>';
				element.appendChild(element.__resizeTriggers__);
				resetTriggers(element);
				element.addEventListener('scroll', scrollListener, true);
				
				/* Listen for a css animation to detect element display/re-attach */
				animationstartevent && element.__resizeTriggers__.addEventListener(animationstartevent, function(e) {
					if(e.animationName == animationName)
						resetTriggers(element);
				});
			}
			element.__resizeListeners__.push(fn);
		}
	};
	
	window.removeResizeListener = function(element, fn){
		if (attachEvent) element.detachEvent('onresize', fn);
		else {
			element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
			if (!element.__resizeListeners__.length) {
					element.removeEventListener('scroll', scrollListener);
					element.__resizeTriggers__ = !element.removeChild(element.__resizeTriggers__);
			}
		}
	}
})();
window.modules_loaded = {};
window.components_hooks = {};
window.modules_hooks = {};


var App = {
	modules: {},
	endpoints: {},
	components: {},
	defineModuleLazy: [],
	data: [],
	
	loadModule(module) {
		$mx.lazy('vue.'+module+'.js', 'vue.'+module+'.css');
		window.modules_loaded[module] = true;
/*
	    var link = document.createElement('link');
	    link.href = '/s/css/vue.'+module+'.css'+scriptsVersion;
	    link.type = 'text/css';
	    link.rel = 'stylesheet';
	    document.body.appendChild(link);	
		
		var script = document.createElement('script');
	    script.src = '/s/js/vue.'+module+'.js'+scriptsVersion;
	    script.async = true;
	    script.onload = function() {
		   window.$vue.$forceUpdate();
	    }
	    
		document.body.appendChild(script);  
*/
	},
	
	loadComponent(name) {
		return new Promise((resolve, reject) => {
			var m = /^vue\-([^-]+)/ig;
			var t = m.exec(name);
			
			if (Vue.options.components[name] != undefined) {
		   	 	resolve(Vue.options.components[name]);
			} else {			

				if (Vue.options.components[name] == undefined) {
					Vue.component(name, function(resolve) {
						//todo: Загрузка модуля — показать спиннер, а также без этого не работают addons в блоках
						window.components_hooks[name] = resolve;
					});
				}
			
				if (t) {
					window.components_hooks[name] = resolve;

					var module = t[1];
					if (window.modules_loaded[module] == undefined) {
						this.loadModule(module);
					}
				} else {
					reject();
				}
			}
		
		});
	},
	
	
	defineComponent(module, name, options) {
		if (this.components[module] == undefined) this.components[module] = {};
		this.components[module][name] = [name, options];
		window.modules_loaded[module] = true;
		Vue.component(name, options);
	},
	
	defineModuleComplete() {
		_.each(this.defineModuleLazy, (v) => {
			this.defineModule(v[0], v[1], true);
		});
		
		this.defineModuleLazy = [];
	},
	
	defineModule(module, routes, force) {
		if (window.$vue == undefined && force == undefined) {
			this.defineModuleLazy.push([module, routes]);
			return;
		}
		
		if (module == 'index' || module == 'frontend') {
			let _walk = (routes) => {
				_.each(routes, (item) => {
					item.pathToRegexpOptions = { strict: true };
					
					if (window.account != undefined && window.account.custom_domain && ['index', 'inner'].indexOf(item.name) != -1) {
						item.path = '/';
					}

					if (typeof item.component == 'string') {
						item.componentName = item.component;
						item.component = function(resolve, reject) { App.loadComponent(item.componentName).then(resolve, reject) }
					} else if (item.component == undefined) {
						item.component = {template: '<router-view></router-view>'};
					}
					
					if (item.children != undefined && item.children.length) _walk(item.children);
				});
			}
			
			_walk(routes);
			
			router_options.routes = routes;
			
			router = new VueRouter(router_options);
			router.getRoute = function(conditions) {
				let find = (routes, conditions) => {
					r = _.find(routes, conditions);
					if (r) return r;
					
					for (let i = 0; i < routes.length; i++) {
						if (routes[i].children != undefined) r = find(routes[i].children, conditions);
						if (r) return r;
					}
					
					return null;
				}
				
				return find(this.options.routes, conditions);
			}
			
			router.beforeEach((to, from, next) => {
				window.$events.fire('beforeNavigate', from);
				next();
			});
			

			router.afterEach((to) => { 
				window.$events.fire('navigate', to);
			});
			
			router.beforeResolve((to, from, next) => {
				var m = /^\/[0-9]+\/([^\/]+)\//ig;
				var t = m.exec(to.path);
				
				if (t && t.length) {
					let module = t[1];
					if (window.modules_loaded[module] == undefined) {
						window.components_hooks[module] = () => { 
							next(); 
							router.replace(router.currentRoute);
						};
						
						this.loadModule(module);
					} else {
						next();
					}
				} else {
					next();
				}
			});
			
			window.vue_options.router = router;
		} else {
			$mx.get('/api/permissions/get.json', {module: module}).then(({data}) => {
				
				let endpoints = data.response.endpoints[module];
				this.endpoints[module] = endpoints;
				
				let _walk = (routes) => {
					_.each(routes, (item) => {
						item.pathToRegexpOptions = { strict: true };

						if (item.meta == undefined) item.meta = {};
						item.meta.module = module;
						
						if (item.children != undefined) {
							item.children = _.filter(item.children, (o) => {
								if (o.meta == undefined || o.meta.endpoint == undefined) return true;
								let ep = o.meta.endpoint.split('/');
								let m = this.endpoints;
								
								let allow = true;
								for (var i in ep) {
									if (m[ep[i]] != undefined || (_.findIndex(m, ep[i]) != -1) || (_.isArray(m) && m.indexOf(ep[i]) != -1)) {
										m = _.isArray(m)?null:m[ep[i]];
									} else {
										allow = false;
										break;
									}
								}
								
								return allow;
							});
							
							if (item.children != undefined && item.children.length) {
								_walk(item.children);
							}
						}
						
						if (item.children != undefined && item.children.length && item.component == undefined && item.redirect == undefined) {
							item.redirect = item.path + item.children[0].path;
						}
						
						if (typeof item.component == 'string') {
							item.componentName = item.component;
							item.component = function(resolve, reject) { App.loadComponent(item.componentName).then(resolve, reject) }
	//						item.component = Vue.options.components[item.component];
						} else if (item.component == undefined) {
							item.component = {template: '<router-view></router-view>'};
						}
						
						if (router == null && base) {
							item.path = base + item.path.substring(1);
						}
					});
				}
				
				_walk(routes);
				
				this.modules[module] = routes;
				
				_.each(this.components[module], (c) => {
					if (window.components_hooks[c[0]] != undefined) {
						window.components_hooks[c[0]](c[1]);
					}
				});
				
				delete this.components[module];
				
				if (router != null  && routes.length) {
					
					let parent = router.getRoute({name: module});
					if (parent) parent.children = routes;
					
					router_options.routes = router.options.routes;
					let tmp = new VueRouter(router_options);
					router.matcher = tmp.matcher;
				}
				
				if (window.components_hooks[module] != undefined) {
					window.components_hooks[module](routes);
				}
			});
		}
	},
	


/*
	defineDayNames(locale) {
		let daysNames = [];
		let date = new Date();
		date.setDate(17);
		let n = date.getDate() - date.getDay();
		date.setDate(n);
		
		for (var i = 0; i < 7; i++) {
			date.setDate(n + i);
			daysNames.push(new Intl.DateTimeFormat(locale, {
				weekday: "short"
			}).format(date).toUpperCase());
		}
		
		console.log(daysNames);
		
// 		i18n.daysNames[locale] = daysNames;
	},
	
	defineMonths(locale) {
	    var format = new Intl.DateTimeFormat(locale, { month: 'long' })
	    var months = []
	    for (var month = 0; month < 12; month++) {
	        var testDate = new Date(Date.UTC(2000, month, 1, 0, 0, 0));
	        let s = format.format(testDate);
	        s = s.charAt(0).toUpperCase() + s.slice(1);
	        months.push(s)
	    }
	    
	    console.log(months);
// 	    i18n.monthsNames[locale] = months;
	},
*/

/*
	defineCountries(counties) {
		alert(1);
		console.log(counties);
		i18n.counties = counties;
	},
*/
	
	defineLanguage(locale, first_day_week, phrases) {
		i18n.phrases[locale] = phrases;
		i18n.first_day_week[locale] = first_day_week;
// 		this.defineDayNames(locale);
// 		this.defineMonths(locale);
		
		if (window.$vue) window.$vue.$forceUpdate();
	}
}
	
window.$app = App;
var i18n = {
	locale: '',
	formats: {},
	phrases: {},
	counties: {},
/*
	daysNames: {},
	monthsNames: {},
*/
	first_day_week: {ru: 1},
	
	init(options) {
		if (options.locales != undefined) window.locales = options.locales;
		
		let html = $mx('html');
		
		this.locale = html.attr('lang');//(options.current != undefined)?options.current:$mx('html').attr('lang');
		this.formats = {date: html.data('format-date'), datetime: html.data('format-datetime')};
// 		if (options.formats != undefined) this.formats = options.formats;

		
		if (this.phrases[this.locale] == undefined /* && this.locale != 'ru' */) {
			this.phrases[this.locale] = [];
			$mx.lazy('locales.'+this.locale+'.js');
/*
	        var script = document.createElement('script');
	        
	        script.src = '/s/js/locales.'+this.locale+'.js'+scriptsVersion;
	        script.async = true;
	        document.body.appendChild(script);			
*/
		}
	},
	
	extend(phrases) {
		this.phrases[this.locale] = Object.assign(this.phrases[this.locale], phrases);
	},
	
	install(Vue, options) {
		let gettext = (v, o) => {
			v = this.phrases[this.locale]?(this.phrases[this.locale][v] || v):v;
			return (typeof v == 'string')?v.split('|')[0]:v;
		}
		
		let plural = (v, i) => {
			var titles = this.phrases[this.locale]?(this.phrases[this.locale][v] || v):v;
			titles = titles.split('|');
			
			if (titles.length) {
				if (titles.length == 1) return i+' '+titles[0];
				i = Math.abs(i);
				if (i == 0) return titles[2];
				var cases = [2, 0, 1, 1, 1, 2];
		    	return i+' '+titles[((i%100>4 && i%100<20)? 2 : cases[Math.min(i%10, 5)])];
		    } else {
			    return i+' '+v;
		    }
		}
		
		let number = (v, precision) => {
// 			return _.isNumber(v)?(new Intl.NumberFormat(this.locale).format(v)):v;
			if (precision == undefined) precision = 0;
			let p = Vue.prototype.$account.number;
			return _.isNumber(v)?window.number_format(v, {decimal: p.decimal, thousands: p.thousands, precision: precision}):v;
		}
		
		let decimal = (v) => {
			return _.isNumber(v)?window.number_format(v, Vue.prototype.$account.number):v;
		}
		
		let weight = (v, with_unit) => {
			let w = Vue.prototype.$account.weight;
			return (_.isNumber(v)?window.number_format(v, w):v)+(with_unit?(' '+w.unit_title):'');
		}
		
		let currency = (v, currency, format) => {
			let obj = _.isObject(currency)?currency:Vue.prototype.$account.currency;
			if (currency == undefined || _.isObject(currency)) currency = obj.title;
			if (format == undefined) format = obj.format;
			
			return _.isNumber(v)?(format.replace('%p', window.number_format(v, obj)).replace('%c', currency).replace(/ /g, ' ')):v;
			
// 			return _.isNumber(v)?(new Intl.NumberFormat(this.locale, {style: 'currency', currency: currency}).format(v)):v;
		}
		
		let datetime = (v) => {
// 			.setUTCHours(Vue.prototype.$account.utc_timezone)
//			Vue.prototype.$account.utc_timezone * 3600 * 1000
			return v?date_format(this.formats.datetime, _.isNumber(v)?v:Date.parse(v) / 1000 | 0):v;
		}

		let date = (v) => {
			return v?date_format(this.formats.date, _.isNumber(v)?v:Date.parse(v) / 1000 | 0):v;
		}
		
		let sprintf = (v, format) => {
			return format.replace('%s', v);
		}
		
		let format = function() {
			var args = arguments;
			return args[0].replace(/{(\d+)}/g, function(match, number) { 
				return typeof args[number] != 'undefined' ? args[number] : match;
			});
		};
		
		let replace = function() {
			var args = arguments;
			return args[0].replace(args[1], args[2]);
		} 
		
		let nl2br = function(v) {
			return (typeof(v) == 'string')?v.replace(/\n/g, "<br>"):v;
		}
		
		let escape = function(v) {
			return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		}
		
		let nvl = function(a, b) {
			return (typeof(a) == 'undefined' || a == null || a === '')?b:a;
		}
		
		Vue.filter('gettext', gettext);
		Vue.prototype.$gettext = gettext;
		
		Vue.filter('plural', plural);
		Vue.prototype.$plural = plural;

		Vue.filter('number', number);
		Vue.filter('weight', weight);
		
		Vue.prototype.$number = number;
		
		Vue.filter('decimal', decimal);
		Vue.prototype.$decimal = decimal;

		Vue.filter('currency', currency);
		Vue.prototype.$currency = currency;
		
		Vue.filter('datetime', datetime);
		Vue.prototype.$datetime = datetime;

		Vue.filter('date', date);
		Vue.prototype.$date = date;

		Vue.filter('nvl', nvl);
		Vue.prototype.$nvl = nvl;
		
		Vue.filter('sprintf', sprintf);
		Vue.filter('replace', replace);
		Vue.filter('format', format);
		Vue.filter('nl2br', nl2br);
		Vue.filter('escape', escape);
		
		Vue.prototype.$nl2br = nl2br;
		Vue.prototype.$format = format;
		Vue.prototype.$escape = escape;
		
		Vue.prototype.$clone = (v) => {
			return JSON.parse(JSON.stringify(v));
		}
				
		Vue.filter('join', function(v, separator) {
			return v?v.join(separator):v;
		});

		Vue.prototype.$getDaysNames = () => {
			return _.map(["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"], Vue.prototype.$gettext);
// 			return this.daysNames[this.locale];
		}
		
		Vue.prototype.$getMonthsNames = () => {
			return _.map(["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"], Vue.prototype.$gettext)
// 			return this.monthsNames[this.locale];
		}

		Vue.prototype.$getFirstDayWeek = () => {
			//defaultFirstDayOfWeek
			return this.first_day_week[this.locale];
		}
	}
}

window.i18n = i18n;

Vue.use(i18n);
Vue.component('mx-phone', {
	data() {
		return {
			tmp: ''
		}
	},
	props: {value: String, disabled: Boolean, required: Boolean, isValid: Boolean, name: String, title: String},
	created() {
		this.tmp = this.value;
	},
	mounted() {
		$mx(this.$refs.hidden).on('change', (e) => {
			this.$emit('input', e.target.value/* e.target.value */)
		});
		
		$mx(this.$refs.valid).on('change', (v) => {
			this.$emit('update:isValid', parseInt(v.target.value)?true:false)
		});
	},
	template: '<div><input type="tel" :data-country="$account.client.country" :data-title="title" :value="tmp" :name="name" autocorrect="off" autocapitalize="none" :disabled="disabled" :required="required"><input type="hidden" ref="hidden" class="tel-code" v-model="tmp"><input type="hidden" ref="valid" class="tel-valid"></div>'	
});

Vue.component('mx-modal', {
    props: {
        active: Boolean,
        component: [Object, Function],
        content: String,
        programmatic: Boolean,
        props: Object,
        events: Object,
        width: {
            type: [String, Number],
            default: 960
        },
        hasModalCard: Boolean,
        animation: {
            type: String,
            default: 'zoom-out'
        },
        canCancel: {
            type: [Array, Boolean],
            default: () => {
                return ['outside', 'button']
            }
        },
        onCancel: {
            type: Function,
            default: () => {}
        },
        scroll: {
            type: String,
            default: () => {
                return 'clip'
            },
            validator: (value) => {
                return [
                    'clip',
                    'keep'
                ].indexOf(value) >= 0
            }
        }
    },
    data() {
        return {
            isActive: this.active || false,
            savedScrollTop: null,
            newWidth: typeof this.width === 'number'
                ? this.width + 'px'
                : this.width
        }
    },
    computed: {
        cancelOptions() {
            return typeof this.canCancel === 'boolean'
                ? this.canCancel
                    ? ['escape', 'x', 'outside', 'button']
                    : []
                : this.canCancel
        },
        showX() {
            return this.cancelOptions.indexOf('x') >= 0
        }
    },
    watch: {
        active(value) {
            this.isActive = value
        },
        isActive() {
            this.handleScroll()
        }
    },
    methods: {
        handleScroll() {
            if (typeof window === 'undefined') return
            if (this.scroll === 'clip') {
                if (this.isActive) {
                    document.documentElement.classList.add('is-clipped')
                } else {
                    document.documentElement.classList.remove('is-clipped')
                }
                return
            }
            this.savedScrollTop = !this.savedScrollTop
                ? document.documentElement.scrollTop
                : this.savedScrollTop
            if (this.isActive) {
                document.body.classList.add('is-noscroll')
            } else {
                document.body.classList.remove('is-noscroll')
            }
            if (this.isActive) {
                document.body.style.top = `-${this.savedScrollTop}px`
                return
            }
            document.documentElement.scrollTop = this.savedScrollTop
            document.body.style.top = null
            this.savedScrollTop = null
        },
        /**
         * Close the Modal if canCancel and call the onCancel prop (function).
         */
        cancel(method) {
            if (this.cancelOptions.indexOf(method) < 0) return
            this.onCancel.apply(null, arguments)
            this.close()
        },
        /**
         * Call the onCancel prop (function).
         * Emit events, and destroy modal if it's programmatic.
         */
        close() {
            this.$emit('close')
            this.$emit('update:active', false)
            // Timeout for the animation complete before destroying
            if (this.programmatic) {
                this.isActive = false
                setTimeout(() => {
                    this.$destroy()
                    removeElement(this.$el)
                }, 150)
            }
        },
        /**
         * Keypress event that is bound to the document.
         */
        keyPress(event) {
            // Esc key
            if (this.isActive && event.keyCode === 27) this.cancel('escape')
        }
    },
    created() {
        if (typeof window !== 'undefined') {
            document.addEventListener('keyup', this.keyPress)
        }
    },
    beforeMount() {
        // Insert the Modal component in body tag
        // only if it's programmatic
        this.programmatic && document.body.appendChild(this.$el)
    },
    mounted() {
        if (this.programmatic) this.isActive = true
        else if (this.isActive) this.handleScroll()
    },
    beforeDestroy() {
        if (typeof window !== 'undefined') {
            document.removeEventListener('keyup', this.keyPress)
            // reset scroll
            document.documentElement.classList.remove('is-clipped')
            const savedScrollTop = !this.savedScrollTop
                ? document.documentElement.scrollTop
                : this.savedScrollTop
            document.body.classList.remove('is-noscroll')
            document.documentElement.scrollTop = savedScrollTop
            document.body.style.top = null
        }
    },
    
    template: `
    <transition :name="animation">
        <div v-if="isActive" class="modal is-active">
            <div class="modal-background" @click="cancel('outside')"/>
            <div
                class="animation-content"
                :class="{ 'modal-content': !hasModalCard }"
                :style="{ maxWidth: newWidth }">
                <component
                    v-if="component"
                    v-bind="props"
                    v-on="events"
                    :is="component"
                    @close="close"/>
                <div
                    v-else-if="content"
                    v-html="content"/>
                <slot v-else/>
            </div>
            <button
                type="button"
                v-if="showX"
                class="modal-close is-large"
                @click="cancel('x')"/>
        </div>
    </transition>
    `
});
//Vue.prototype.$http = axios;

const scrollBehavior = function (to, from, savedPosition) {
  if (savedPosition) {
	return savedPosition
  } else {
	return {x: 0, y: 0}
  }
}

var router = null;
var router_options = {mode: 'history', scrollBehavior, routes: [], base: '/', linkExactActiveClass: 'active', linkActiveClass: 'active'};

window.vue_options = {};

Vue.use({
	install(Vue, options) {
		Vue.prototype.$history = new Vue({
			data: {
				stackBack: [], 
// 				stackForward: [],
			},
			created() {
				let compare = (a, b) => {
					return (a.path == b.path) && _.isEqual(a.params, b.params);
				}
				
				window.$events.on('navigate', (e, v) => {
					if (this.stackBack.length > 1 && compare(this.stackBack[this.stackBack.length - 2], v)) {
						// Назад
						this.stackBack.pop();
						//this.stackForward.push(v);
/*
					} else if (this.stackForward.length > 1 && compare(this.stackForward[this.stackForward.length - 2], v)) {
						// Вперед
						this.stackForward.pop();
						this.stackBack.push(v);
*/
					} else {
// 						this.stackForward = [];
						this.stackBack.push(v);
					}
				});
			},
			
			computed: {
				prevName() {
					return (this.stackBack.length > 1)?this.stackBack[this.stackBack.length-2].name:null;
				}
			}
		});
		
		Vue.prototype.$links = new Vue({
			data: {
				postfix: {},
				platform: '',
				cookies: {}
			},
			created() {
				window.$events.on("links_postfix.set", (e, v) => {
					this.postfix = Object.assign({}, this.postfix, v);
				})
				
				// Если была реклама, передаем ее дальше в своем параметре
				this.cookies = Cookies.get();
				if (this.cookies.clt != undefined && this.cookies.clid != undefined) this.postfix.tpclid = this.cookies.clt+'.'+this.cookies.clid;
				
				let ua = navigator.userAgent.toLowerCase();
				if (/iphone|ipad|ipod/.test(ua)) {
					this.platform = 'ios';
				} if (ua.indexOf('android') != -1) {
					this.platform = 'android';
				}
			},
			methods: {
/*
				process(link) {
					if (!link) return link;
					let protocol = link.split('//')[0].toLowerCase();
					
					return link +((['http:', 'https:'].indexOf(protocol) != -1)?(_.size(this.postfix)?(((link.indexOf('?') != -1)?'&':'?') + $mx.param(this.postfix)):''):'');
				},
*/
				checkVariables(link) {
					link = link.replace(/\%7B\%7B([a-z\_\-0-9]+)\%7D\%7D/g, (whole, p) => {
						return escape(this.cookies[p] || ('{{'+p+'}}'));
					});

					return link;
				},
				
				application(link) {
					return this.checkVariables((link.a != undefined && ((this.platform && (link.a[this.platform] != undefined)) || (link.a.default != undefined)))?(link.a[this.platform] || link.a.default):link.b);
				},
				
				deeplink(link) {
					if (link.a != undefined && ((this.platform && (link.a[this.platform] != undefined)) || (link.a.default != undefined))) {
						openUrlWithFallback(this.checkVariables(link.a[this.platform] || link.a.default), this.checkVariables(link.b));
					} else {
						window.top.location = this.checkVariables(link.b);
					}
					
/*
					if (link.a ) {
						openUrlWithFallback(link.application, link.browser)
					} else {
						window.top.location = link.browser;
					}
*/
				},
				
				resolve(link) {
					switch (link.type) {
						case 'sms':
							return 'sms:'+'+'+link.sms.toString().replace(/[^0-9]/, '')+((link.sms_text != undefined && link.sms_text.trim().length)?('?&body='+encodeURIComponent(link.sms_text)):'');
							break;
						case 'phone':
							return 'tel:'+'+'+link.phone.toString().replace(/[^0-9]/, '');
							break;
						case 'email':
							return 'mailto:'+link.email+((link.email_subject != undefined && link.email_subject.trim().length)?('?subject='+encodeURIComponent(link.email_subject)):'');
							break;
						case 'page':
							return (this.$account.page_id == link.link_page_id)?{name: 'index'}:{name: 'page', params: {page_id: parseInt(link.link_page_id).toString(16)}};
							break;
						case 'market':
							return {name: 'catalog'};
							break;
						case 'collection':
							return {name: 'collection', params: {collection_id: parseInt(link.collection).toString(16)}};
							break;
						case 'product':
							return {name: 'product', params: {product_id: parseInt(link.product).toString(16)}};
							break;
						case 'link':
							if (!link.link) return link.link;
							let protocol = link.link.split('//')[0].toLowerCase();
							
							return link.link +((['http:', 'https:'].indexOf(protocol) != -1)?(_.size(this.postfix)?(((link.link.indexOf('?') != -1)?'&':'?') + $mx.param(this.postfix)):''):'');
							break;
						default:
							return link.link;
							break;
					}
				}
			}
		});
	}
});

Vue.prototype.$auth = {
	isAllowTariff(tariff) {
		let tariffs = ['basic', 'plus', 'pro', 'business'];
		return tariffs.indexOf(Vue.prototype.$account.tariff_current) >= tariffs.indexOf(tariff);
	}
}

Vue.prototype.$actionbar = {
	info: {basket: {products: {},amount: 0}},
	
	init() {
		let s = Cookies.get('cart');
		this.info.basket.amount = 0;
		if (s) {
			s = s.split('.');
			for (let i = 0; i < s.length; i += 2) {
				let v = parseInt(s[i+1]);
// 				this.info.basket.products[parseInt(s[i])] = v;
				this.info.basket.products[s[i]] = v;
				this.info.basket.amount += v;
			}
		}
	},
	
	pack() {
		let s = [];
		let amount = 0;
		_.each(this.info.basket.products, (v, i) => {
			s.push(i);
			s.push(v);
			amount += v;
		})
		
		this.info.basket.amount = amount;
		
		let params = Object.assign(window.account.custom_domain?{domain: '.'+window.account.custom_domain, path: '/'}:{domain: '.taplink.cc', path: '/'+Vue.prototype.$account.nickname}, (window.location.protocol == 'http:')?{sameSite: 'Lax'}:{sameSite: 'None', secure: true}, {expires: 365});
		
		Cookies.set('cart', s.join('.'), params);
	},
	
	addToCart(id, n) {
		if (this.info.basket.products[id] == undefined) this.info.basket.products[id] = 0;
		this.info.basket.products[id] += n;
		this.info.basket.amount += n;
		this.pack();
	}
}

Vue.prototype.$actionbar.init();

/*
var MixPromise = function (cb) {
	this.cb_resolve = null;
	this.cb_resolve_value = null;

	var t = this;
	
	cb(
		function(v) { t.resolve(v); }, 
		function(v) { t.reject(v); }
	)
}

MixPromise.prototype = {
	then: function(cb) {
		if (this.cb_resolve_value) cb(this.cb_resolve_value);
		this.cb_resolve = cb;
	},
	
	resolve: function(v) {
		if (this.cb_resolve) this.cb_resolve(v);
		this.cb_resolve_value = v;
	},
	
	reject(e) {
		
	}
}
*/


Vue.prototype.$api = {
	get(name, params) {
		return this.request(name, 'get', params);
	},

	post(name, params) {
		return this.request(name, 'post', params);
	},
	
	request(name, method, params) {
		return new Promise((resolve, reject) => {
			params = params || {};
			params.params = params.params || {};
			return $mx.request({method: method, url: (window.account.custom_domain?'':('/'+(Vue.prototype.$account.nickname?Vue.prototype.$account.nickname:('id:'+Vue.prototype.$account.profile_id))))+'/api/'+name+'.json', json: params.params}).then((r) => {
				if (r.data.redirect != undefined) {
					if (r.data.redirect.indexOf('//') != -1) {
						window.top.location = r.data.redirect;
					} else {
						router.replace(r.data.redirect);
					}
					return;
				}
				resolve(r.data);
			}).catch(reject);
		})
	}
}

function openUrlWithFallback(url, fallbackUrl) {
	
    //window.top.location = url;

	var iframe = document.querySelector("#launcher");
	let isSafari = navigator.userAgent.indexOf('Safari/') != -1; // В Safari показывается ошибка что fb:// не доступен и не открывается сайт поэтому
	let isChrome = navigator.userAgent.indexOf('Chrome/') != -1;
	let isMobile = navigator.userAgent.indexOf('Mobile/') != -1;
	let isInstagram = navigator.userAgent.indexOf('Instagram') != -1; 
	
	let forceOpenWebsite = (isSafari || isInstagram) && isMobile;
	
	if (!iframe) {
		iframe = document.createElement('iframe');
		iframe.id = "launcher";
		iframe.style.display = "none";
		document.body.appendChild(iframe);
	}
	
    // Mobile detection
    if (fallbackUrl) {
	    var now = Date.now();
	    var needFallback = true;
	    
	    var localAppInstallTimeout = setTimeout(function() {
	        window.top.location = url;
	    }, 300);
		
	    var localAppInstallTimeoutFallback = setTimeout(function() {
	        if (!forceOpenWebsite && ((Date.now() - now > 1250) || !needFallback)) return;
	        window.top.location = fallbackUrl;
	    }, 1200);
	    
	    if (!forceOpenWebsite) {
		    var eventHidePage = function () {
			    
			    needFallback = false;
		        clearTimeout(localAppInstallTimeout);
		        clearTimeout(localAppInstallTimeoutFallback);
		        
		        window.removeEventListener('blur', eventHidePage, false);
		        window.removeEventListener('pagehide', eventHidePage, false);
		    }
		
		    // Desktop detection
		    window.addEventListener('blur', eventHidePage, false);
			window.addEventListener('pagehide', eventHidePage, false);   
		}
	}
	
	iframe.src = url; 
}

/*
function openDeeplink(r) {
	let link = r.response;
	if (link.application) {
		openUrlWithFallback(link.application, link.browser)
	} else {
		window.top.location = link.browser;
	}
*/
	
/*
	function redirectPage(redirect) {
		setTimeout(function() {
			if ((window.top == window.self) || (redirect.indexOf('//taplink.cc') !== -1)) {
				window.location = redirect;
			} else {
				window.top.location = redirect;
			}
		}, 100);
	}
	

	if (link.application) {
		var tm = null;

		var iframe = $('<iframe></iframe>');
		var b = $('<div style="display:none"></div>');
		b.appendTo(document.body);
		iframe.appendTo(b);
		
		let loaded = () => {
			if (tm) {
				clearTimeout(tm);
				b.remove();
				tm = null;
			}
		}
		
		iframe.onload = loaded;
		$(window).one('pagehide blur', loaded);
		
		setTimeout(() => { b.remove(); }, 1000);

		if (link.browser) {
			tm = setTimeout(() => {
				redirectPage(link.browser);
			}, 500);
		}
		
		iframe.attr('src', link.application);
	} else {
		redirectPage(link.browser);
	}
*/
// }
	
document.addEventListener("DOMContentLoaded", function() {
	if (window.$vue == undefined && window.account != undefined) {
		window.account.currency = Object.assign(_.clone(window.account.number), window.account.currency);
		window.account.weight = Object.assign(_.clone(window.account.number), window.account.weight);
		
		Vue.prototype.$account = Object.assign(window.account, {history: 0});
		Vue.prototype.$account.theme = StylesFactory.checkStyles(Vue.prototype.$account.theme);
		Vue.prototype.$account.styles = buildStyles(Vue.prototype.$account.theme, 'page');
		

			
// 		router_options.base = '/'+Vue.prototype.$account.nickname;
		App.defineModuleComplete();
		window.$vue = new Vue(window.vue_options).$mount(document.querySelector('.page'));
		i18n.init(window.account.locale);
		
		$mx('#loading-global').remove();
	}
}, {once: true});


window.$app.defineComponent("frontend", "vue-frontend-actionbar", {data() {
			return {
				page: '',
				data: null,
				isOpenModal: false
			}
		},
		
		created() {
			this.page = this.$router.currentRoute.name;
			
			window.$events.on('beforeNavigate', (e, v) => {
				this.page = null;
			});
			
			window.$events.on('navigate', (e, v) => {
// 				document.body.scrollTo(0, 0);
				this.page = this.$router.currentRoute.name;
				this.data = null;
			});
						
			window.$events.on('setpage', (e, v) => {
				this.data = v;
			});
		},
		
		computed: {
			disabled() {
				return (this.$account.readonly != undefined && this.$account.readonly);
			},
			
			isAllow() {
				let isCommon = ['product', 'basket'].indexOf(this.page) == -1;
				let isAllow = this.$auth.isAllowTariff('business') && ((isCommon && this.$actionbar.info.basket.amount > 0) || (!isCommon && this.data != null));
				$mx('body').toggleClass('has-actionbar', isAllow);
				return isAllow;
			},
			
			checkoutButtonTitle() {
				let titles = [
					this.$gettext('Оформить заказ'),
					this.$gettext('Подтвердить'),
					this.data.button
				];
				
				return titles[this.data.step];
			}
		},
		
		methods: {
			addToCart() {
				let offer_id = this.data.offer_id;
				
				if (window.fbq != undefined) {
					let price = this.data.price;
					let contents = [{
// 						id: 'offer:'+offer_id,
						id: parseInt(this.data.product_id, 16),
						quantity: 1,
						item_price: price
					}];
					
					_.each(this.data.options, (v, id) => {
						if (this.data.options_selected.indexOf(id) != -1) price += v.price;
						contents.push({
							id: 'option:'+id,
							quantity: 1,
							item_price: v.price
						});
					});
					
					
					fbq('track', 'AddToCart', {
						value: price,
						currency: this.$account.currency.code,
						content_type: 'product',
						contents: contents,
					});
				}
				
				
				
				if (this.data.options_selected.length) offer_id += '-'+this.data.options_selected.join('-');
				this.$actionbar.addToCart(offer_id, 1);
				this.isOpenModal = true;
				this.data.clearForm();
			},
			
			toBasket() {
				this.isOpenModal = false;
				this.$router.push({name: 'basket'});
			},
			
			marketAction() {
				if (window.fbq != undefined) {
					switch (this.data.step) {
						case 0:
							fbq('track', 'InitiateCheckout');
							break;
						case 2:
							fbq('track', 'Lead');
							break;
					}
				}
				
				this.data.action();
			},
			
			backToCatalog() {
				if (['catalog', 'collection'].indexOf(this.$history.prevName) != -1) {
					this.$router.go(-1)
				} else {
					this.$router.push({name: 'catalog'});
				}
			}
		}, template: `
	<div>
		<div class="action-panel-container in" v-if="isAllow">
		<div class="action-panel"> 
		<div class="page-container">
			<div  v-if="['product', 'basket', 'checkout'].indexOf(page) == -1 && $actionbar.info.basket.amount > 0">
				<div class="row row-small">
					<div class="col-xs-12 col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3"> 
						<router-link :to="{name: 'basket'}" class="button is-medium is-light is-fullwidth"><i class="fai fa-shopping-basket"></i><span class="tag is-danger" v-if="$actionbar.info.basket.amount">{{$actionbar.info.basket.amount}}</span> {{'Корзина'|gettext}}</router-link>
					</div> 
				</div>
			</div>
			
			<div  v-if="page == 'product' && data && !_.isEmpty(data.product)">
				<div class="row row-small" v-if="data.product.products_hide_checkout == 0">
					<div class="col-xs-2 col-sm-3"> 
						<a @click.prevent="backToCatalog()" class="button is-medium is-light is-fullwidth has-text-centered product-back-catalog"><i class="fai fa-th"></i></a>
					</div> 
	
					<div class="col-xs-8 col-sm-6"> 
						<button type="button" @click="addToCart" class="button is-medium is-primary is-fullwidth" :class="{disabled: !data.product.is_sellable || !data.offer_id}">{{'Добавить в корзину'|gettext}}</button>
					</div> 
		
					<div class="col-xs-2 col-sm-3"> 
						<router-link :to="{name: 'basket'}" class="button is-medium is-light is-fullwidth"><i class="fai fa-shopping-basket"></i><span class="tag is-danger" v-if="$actionbar.info.basket.amount">{{$actionbar.info.basket.amount}}</span></router-link>
					</div>
				</div>
				<div v-else class="row row-small"> 
					<div class="col-xs-12 col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
						<a @click.prevent="backToCatalog()" class="button is-medium is-light is-fullwidth has-text-centered"><i class="fai fa-th"></i></a>
					</div>
				</div> 
			</div>
			
			<div  v-if="['basket', 'checkout'].indexOf(page) != -1 && data">
				<div class="row row-small">
					<div class="col-xs-3 col-sm-6"> 
						<a @click.prevent="backToCatalog()" class="button is-medium is-light is-fullwidth has-text-centered"><i class="fai fa-th"></i><span class="is-hidden-mobile has-ml-1"> {{'Вернуться в каталог'|gettext}}</span></a>
					</div> 
					<div class="col-xs-9 col-sm-6"> 
<!-- 						<router-link :to="{name: 'checkout'}" class="button is-medium is-success is-fullwidth" v-if="data.step == 0">{{'Оформить заказ'|gettext}}</router-link> -->
<!-- 						<router-link :to="{name: 'checkout'}" class="button is-medium is-success is-fullwidth" v-if="data.step == 1">{{'Подтвердить'|gettext}}</router-link> -->
						<button type="button" class="button is-medium is-success is-fullwidth" :class="{'is-loading': data.isFetching}" :disabled="!data.isAllowAction || disabled" @click="marketAction">{{checkoutButtonTitle}}</button>
<!-- checkout_active -->
					</div> 
				</div>

			</div>
			
		</div>
		</div>
		</div>
		
		<mx-modal :active.sync="isOpenModal" :has-modal-card="true" :can-cancel="['outside']" class="modal-bottom">
            <div class="modal-card modal-card-little" style="justify-content: flex-end;padding: 0">
	            <section class="modal-card-body">
		            <div class="media">
			            <div class="media-left" style="align-self: center">
			            <div class="sa-icon sa-success animate" style="display: block;">
					      <span class="sa-line sa-tip animateSuccessTip"></span>
					      <span class="sa-line sa-long animateSuccessLong"></span>
					      <div class="sa-placeholder"></div>
					      <div class="sa-fix"></div>
					    </div>
			            </div>
			            
			            <div class="media-content has-text-black" style="align-self: center">
				            <h2>{{'Товар добавлен в корзину'|gettext}}</h2>
			            </div>
		            </div>

		            <button class="button is-medium is-fullwidth is-primary has-mb-2" @click="toBasket">{{'Перейти в корзину'|gettext}}</button>
		            <button class="button is-medium is-fullwidth is-light has-mb-2" @click="isOpenModal = false">{{'Продолжить покупки'|gettext}}</button>
	            </section>
            </div>
        </mx-modal>
		
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-addons-cookiepolicy-banner", {data() {
			return {
				cookieAgree: false,
				isOpenPolicy: false,
				isLoading: false,
				policyIndex: 0,
				policy: []
			}
		},
		
		props: ['value'],
		
		created() {
			this.cookieAgree = Storage.get('cookie_privacy.'+this.$account.profile_id, 0)?true:false;
			if (this.value.titles == undefined) this.value.titles = [this.value.title];
		},

		methods: {
			agreeCookie() {
				Storage.set('cookie_privacy.'+this.$account.profile_id, 1, 86400);
				this.cookieAgree = true;
			},
			
			click(e) {
				if ((e.target.tagName.toUpperCase() == 'A') && e.target.getAttribute('target') == '_blank') return;
				e.preventDefault();				
				
				if (e.target && e.target.tagName.toUpperCase() == 'A') {
					this.isOpenPolicy = true;
					
					let m = /\/a\/cookiepolicy\/([0-9]+)\//.exec(e.target.href);
					let idx = parseInt((m && m[1] != undefined)?m[1]:0);
					this.policyIndex = idx;

					if (this.policy[idx] == undefined) {
						this.policy[idx] = '';
						this.$api.get('addon/resolve', {params: {addon: 'cookiepolicy', request: 'body', params: {index: idx}}}).then((r) => {
							this.$set(this.policy, idx, r.response.body);
							this.isLoading = false;
						})
					}
				}
			},			
		}, template: `
	<div>
	<div class="footer-banner cookie-banner has-rtl" :class="{'is-closed': cookieAgree}" @click="click">
		<div class="container has-mb-2 has-mt-2">
			<div v-html="value.message"></div>
			<button class="button is-dark is-hidden-touch" @click="agreeCookie">{{'Я понял'|gettext}}</button>
			<button class="modal-close is-large is-hidden-desktop" @click="agreeCookie"></button>
		</div>
	</div>

	<mx-modal :active.sync="isOpenPolicy" :has-modal-card="true">
    	<div class="modal-card has-text-black" style="font-size: 1rem" v-if="isOpenPolicy">
        	<header class="modal-card-head"><p class="modal-card-title">{{value.titles[policyIndex]|gettext}}</p> <button type="button" class="modal-close is-large" @click="isOpenPolicy = false"></button></header>
            <section class="modal-card-body">
				<div class="border col-xs-12" v-if="isLoading"><div class="loading-overlay loading-block is-active"><div class="loading-icon"></div></div></div>
				<div v-html="policy[policyIndex]"></div>
            </section>
			<div class="modal-card-foot">
				<button type="button" class="button is-dark" @click="isOpenPolicy = false">{{'Закрыть'|gettext}}</button>
			</div>	
        </div>
    </mx-modal>
    	
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-auth", {data() {
			return {
				isChecking: false,
				error: '',
				
				
				fields: [
					{"type_id":6,"title":"Email","text":"","required":true,"idx":"1","typename":"email"},
					{"type_id":0,"title":"Password","text":"","required":true,"idx":"2","typename":"password"},
					{"title":"Войти","typename":"button"}
				]
			}
		},
		
		props: ['options', 'block_id', 'page_id'],
		
		methods: {
			apply() {
				let fields = this.$refs.form.getFields();
				let params = {};
				
				console.log(fields);
				
				_.each(fields, f => {
					params[(f.type == 0)?'password':'login'] = f.value;
				});
												
				this.isChecking = true;
				this.$api.post('auth/check', {params: params}).then(r => {
					if (r.result == 'success') {
						this.$emit('refreshPage');
					}

					this.isChecking = false;
				});
			}
		}, template: `
	<div class="block-auth">
		<form @submit.prevent="apply" class="block-form">
			<vue-frontend-form-elements :fields="fields" ref="form" :isLoading="isChecking"/>
		</form>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-avatar", {data() {
			return {
			}
		},
		props: {to: {type: Object, default: {name: 'index'}}, index: {type: Number, default: 0}},
		
		computed: {
			style() {
				return (this.index == 0)?'':'visibility:hidden';
			},
			
			backLink() {
				return (this.$history.stackBack.length < 2)?'':this.$history.stackBack[this.$history.stackBack.length-2].path;
			}
		}, template: `
	<div>
		<div class="block-avatar block-avatar-history">
			<div>
	<!-- 			<i class="fai fa-chevron-left avatar-history is-left has-p-2" style="padding-left:0 !important" @click="window.router.go(-1)" :class="{'is-hide': $history.stackBack.length < 2}" :style="style"></i> -->
				<router-link class="fai fa-chevron-left avatar-history is-left has-p-2" style="padding-left:0 !important" :to="backLink" :class="{'is-hide': $history.stackBack.length < 2}" :style="style"></router-link>
			</div>
			<router-link :to="to">
				<div class="has-text-centered"><img :src="'//{1}/a/{2}'|format($account.storage_domain, $account.avatar_url)" :class="'profile-avatar profile-avatar-{1}'|format($account.avatar_size)" :alt="$account.nickname"></div>
			</router-link>
			<div>
				<i class="fai fa-chevron-right avatar-history has-p-2" style="padding-right:0 !important;visibility:hidden" @click="$router.go(1)"></i>
			</div>
		</div>
		<div class="has-text-centered text-avatar" v-if="!$account.is_avatar_hide_text && account.has_nickname">{{account.nickname}}</div>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-banner", {data() {
			return {
			}
		},
		
		props: ['options', 'block'],
		
		computed: {
			style() {
				return 'padding-top: '+(this.options.p?(this.options.p.height / this.options.p.width * 100):50)+'%'+(this.options.p?(';background: url('+'//'+this.$account.storage_domain+'/p/'+this.options.p.filename+') 0 0 / 100% no-repeat'):'');
			},
			bannerInnerStyle() {
				let o = this.options;
				return (o.p && !o.is_stretch)?('width:'+((o.is_scale && o.width)?o.width:o.p.width)+'px'):'';
			}
		},
		
		methods: {
			isExternal(link) {
				return ['link', 'phone', 'sms', 'email', ''].indexOf(link.type) != -1;
			},
			
			link(link) {
				return this.$links.resolve(link);
/*
				switch (link.type) {
					case 'sms':
						return 'sms:'+'+'+link.sms.toString().replace(/[^0-9]/, '')+((link.sms_text != undefined && link.sms_text.trim().length)?('?&body='+encodeURIComponent(link.sms_text)):'');
						break;
					case 'phone':
						return 'tel:'+'+'+link.phone.toString().replace(/[^0-9]/, '');
						break;
					case 'email':
						return 'mailto:'+link.email+((link.email_subject != undefined && link.email_subject.trim().length)?('?subject='+encodeURIComponent(link.email_subject)):'');
						break;
					case 'page':
						return (this.$account.page_id == link.link_page_id)?{name: 'index'}:{name: 'page', params: {page_id: parseInt(link.link_page_id).toString(16)}};
						break;
					case 'market':
						return {name: 'catalog'};
						break;
					case 'collection':
						return {name: 'collection', params: {collection_id: parseInt(link.collection).toString(16)}};
						break;
					case 'product':
						return {name: 'product', params: {product_id: parseInt(link.product).toString(16)}};
						break;
					case 'link':
						return this.$links.process(link.link);
						break;
					default:
						return link.link;
						break;
				}
*/
			},
			
			click(f) {
				let link = this.$links.resolve(f.link);
				if (_.isObject(link) || link.substr(0, 1) != '#') {
					link = _.isObject(link)?this.$router.resolve(link).href:link;
					window.$events.fire('tap', {stat: this.block.block_id+'.'+this.block.stat, pixels: [{name: 'fb', event: 'taplink:'+f.link.type, param: link}], addons: (this.options.data != undefined && this.options.data.link != undefined)?this.options.data.link:null});
					if (this.isExternal(f.link)) document.location = this.link(f.link);
				} else {
					$mx('[name="'+link.substr(1)+'"]').scrollIt(500) 
				}
				
			}
		}, template: `
	<div :class="{'is-marginless': options.is_marginless && options.is_stretch}">
	<div v-if="options.is_link">
		<a v-if="isExternal(options.link)" rel="noopener" target="_top" :href='link(options.link)' @click.prevent="click(options)"><div class="block-banner-inner" :style="bannerInnerStyle"><div class="picture-container" :class="{'picture-container-empty': !options.p}" :style="style"></div></div></a>
		<router-link v-else rel="noopener" :to='link(options.link)' @click.native="click(options)"><div class="block-banner-inner" :style="bannerInnerStyle"><div class="picture-container" :class="{'picture-container-empty': !options.p}" :style="style"></div></div></router-link>
	</div>
	<div  v-else>
		<div class="block-banner-inner" :style="bannerInnerStyle"><div class="picture-container" :class="{'picture-container-empty': !options.p}" :style="style"></div></div>
	</div>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-break", {props: ['options'], template: `
	<div class='block-break'><div class='block-break-inner' :class="{'has-icon': options.icon, 'is-invisible': options.icon < 0, 'is-fullwidth': options.fullwidth, 'has-fading': options.fading}" :style="{'height': options.break_size + 'px'}"><span><i :class="['fa fai', 'fa-'+options.icon]" v-if="options.icon"></i></span></div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-collapse", {props: ['options', 'block_id'],
		
		created() {
			this.prepareCollapsed();
		},
		
		watch: {
			options() {
				this.prepareCollapsed();
			}
		},
		
		methods: {
			prepareCollapsed() {
				this.$set(this.options, 'collapsed', Array(this.options.fields.length).fill(false));
			},
			
			toggle(i) {
				this.$set(this.options.collapsed, i, !this.options.collapsed[i]);
			}
		}, template: `
	<div class="block-form has-rtl">
		<div ref='styles'></div>
		<div class="collapse-list">
			<div v-for="(f, i) in options.fields" class="collapse-item" :class="{in: options.collapsed[i]}">
			<div class="a" @click="toggle(i)" style="cursor: pointer">
				<span class="collapse-icon"></span>
				<span class="collapse-title" v-if="f.title">{{f.title}}</span>
				<span class="collapse-title" v-else>{{'Заголовок'|gettext}}</span>
			</div>
			<div class="collapse-text"><div class="collapse-text-inner" v-html="$nl2br(f.text)"></div></div>
			</div>
		</div>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-courses-feed", {data() {
			return {
				isFetching: true
			}
		},
		
		props: ['options', 'page_id'],
		
		created() {
			this.fetchData();
		},
		
		methods: {
			fetchData() {
				this.options.lessons = [{title: 'AAAAA', subtitle: 'AAAAAAA', lesson_id: 0}, {title: 'AAAAAAAA', subtitle: 'AAAAAAAAAAA', lesson_id: 0}, {title: 'AAAAA', subtitle: 'AAAA', lesson_id: 0},  {title: 'AAAAAAAAAAA', subtitle: 'AAAAAAA', lesson_id: 0}];
				this.$api.get('addon/resolve', {params: {addon: 'courses', request: 'feed', params: {id: parseInt(this.page_id, 16)}}}).then((r) => {
					if (r.result == 'success') {
						this.$set(this.options, 'lessons', r.response.lessons);
						window.$events.fire('courses:data', {data: r.response.data});
						this.isFetching = false;
					} else if (r.result == 'unauthorized') {
						this.$emit('refreshPage');
					}
				});
			}
		}, template: `
	<div class="block-course has-rtl">
		<div :class="{disabled: isFetching}">
		<router-link :to="{name: 'part', params: {part: 'f', page_id: l.lesson_id.toString(16)}}" v-for="l in options.lessons" class="course-lesson" :data-status="l.status">
			<div><b :class="{'is-fetching-block': isFetching}">{{l.title}}</b><br><span class="has-text-grey" style="font-size: 90%" :class="{'is-fetching-block': isFetching}">{{l.subtitle}}</span></div>
		</router-link>
		</div>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-courses-lesson", {data() {
			return {
				isFetching: true,
				isUpdating: false
			}
		},
		
		props: ['options', 'page_id'],
		
		created() {
			this.fetchData();
		},
		
		computed: {
			stylesheets() {
				let bg = '#257942';
				let text = '#ffffff';
				return {background: bg, borderColor: bg, color: text, '--color-text': text};
			},
			
			thumb() {
				let link = '//taplink.cc/s/icons/check.svg';
				let empty = '<img src="data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==">';
				return '<div class="is-icon" style="-webkit-mask-image:url('+link+');mask-image:url('+link+')">'+empty+'</div>';
			}
		},
		
		methods: {
			fetchData() {
				this.$api.get('addon/resolve', {params: {addon: 'courses', request: 'lesson', params: {id: parseInt(this.page_id, 16)}}}).then((r) => {
					if (r.result == 'success') {
						this.$set(this.options, 'body', r.response.body);
						this.$set(this.options, 'status', r.response.status);
						
						window.$events.fire('courses:data', {data: r.response.data});
						this.isFetching = false;
					} else if (r.result == 'unauthorized') {
						this.$emit('refreshPage');
					}
				});
			},
			
			done() {
				this.isUpdating = true;
				this.$api.post('addon/resolve', {params: {addon: 'courses', request: 'lesson.done', params: {id: parseInt(this.page_id, 16)}}}).then((r) => {
					if (r.result == 'success') {
						this.$router.push({name: 'part', params: {part: 'c', page_id: r.response.course_id.toString(16)}});
					}
				});
			}
		}, template: `
	<div>
		<div class="block-lesson has-rtl has-mb-2" :class="{'is-fetching-block': isFetching}">
			<div class="courses-lesson-done" v-if="options.status == 'done'">Задание выполнено</div>
			<vue-frontend-components-document v-if="options.body" v-model="options.body" class="has-p-3 hero-block blog-post hero-text"/>
<!-- 			<a @click="done" class="courses-lesson-done" v-if="options.status == 'new'">Отметить как выполненное</a> -->
		</div>
		
		<div class="block-link" :class="{'is-fetching-block': isFetching}" v-if="options.status == 'new'">
			<a class="button btn-link" :class="{'is-loading': isUpdating}" @click="done" :style="stylesheets"><figure class="thumb" v-html="thumb" v-if="thumb"></figure><div class="has-text-left"><div class="btn-link-title">{{'Отметить как выполненное'}}</div></div></a>
		</div>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-courses-navs", {data() {
			return {
				isFetching: true,
				data: {menu: {items: [{title: 'AAAAA'}, {title: 'AAAAAAAA'}]}}
			}
		},
		
		props: ['options', 'page_id'],
		
		created() {
			window.$events.on('courses:data', (e, r) => {
				this.data = r.data;
				this.isFetching = false;
			});
		},
		
		methods: {
		}, template: `
	<div class="block-course-navs has-rtl has-mb-1">
		<div v-for="f in data.menu.items"><router-link :to="f.link" v-if="f.link">{{f.title}}</router-link><span v-else :class="{'is-fetching-block': isFetching}">{{f.title}}</span></div>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-courses-progress", {data() {
			return {
				isFetching: true,
				data: null
			}
		},
		
		props: ['options', 'page_id'],
		
		created() {
			window.$events.on('courses:data', (e, r) => {
				this.data = r.data;
				this.isFetching = false;
			});
		},
		
		methods: {
		}, template: `
	<div class="block-course-progress has-rtl has-mb-1">
		<div class="course-progress-title">
			<div :class="{'is-fetching-block': isFetching}">Прогресс</div>
			<div v-if="data">{{data.progress.value}} из {{data.progress.total}}</div>
		</div>
		<div class="course-progress"><div :style="{width: (data.progress.value / data.progress.total * 100) + '%'}" v-if="data"></div></div>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-form", {data() {
			return {
				isLoading: false,
				isOpenModal: false,
			}
		},
		props: ['options', 'block'],
		
		watch: {
			options() {
				this.rebuildValues();
			}
		},

		mounted() {
			this.rebuildValues();
		},
		
		created() {
			let s = document.location.search;
			let r = s.match(/[\?|\&]form=([0-9]+)/);
			if (r && (r[1] == this.block.block_id)) {
				s = s.replace(/[\?|\&]form=[0-9]+/, '');
				this.isOpenModal = true;
				this.$router.replace(document.location.pathname + s);
			}
		},
		
		methods: {
			rebuildValues() {
				this.values = [];
				for (var i = 0; i < this.options.fields.length; i++) {
					let f = this.options.fields[i];
					this.$set(f, 'value', (f.typename == 'checkbox' && f.default)?1:(f.value?f.value:''));
					this.$set(f, 'valid', false);
				}
			},
			
			submit() {
				let fields = this.$refs.elements.getFields();
								
				if (fields != null) {
					this.isLoading = true;
					
					this.$api.post('form/push', {params: {fields: fields, block_id: this.block.block_id}}).then((r) => {
						if (r.result == 'success') {
							window.$events.fire('lead');
							
							if (r.response.redirect == 'https://www.messenger.com/closeWindow/') {
								//hack:
								window.location = r.response.redirect;
							} else {
								window.top.location = r.response.redirect;
							}
						}
						this.isLoading = false;
					});
				}
			}
		}, template: `
	<form @submit.prevent="submit" ref="form">
		<mx-modal :active.sync="isOpenModal" :has-modal-card="true">
            <div class="modal-card modal-card-little">
	            <section class="modal-card-body has-text-black">
	            <div class="has-text-centered">
					<div class="has-mb-2">
						<div class="sa-icon sa-success animate" style="display: block;">
					      <span class="sa-line sa-tip animateSuccessTip"></span>
					      <span class="sa-line sa-long animateSuccessLong"></span>
					      <div class="sa-placeholder"></div>
					      <div class="sa-fix"></div>
					    </div>
					</div>
					<h4 v-html="$nl2br($escape(options.form_text))"></h4>
				</div>
	            </section>
				<div class="modal-card-foot" style="justify-content: center">
					<button type="button" class="button is-dark" @click="isOpenModal = false">{{'Закрыть'|gettext}}</button>
				</div>	
            </div>
        </mx-modal>

		<vue-frontend-form-elements :fields="options.fields" :options="options" :isLoading.sync="isLoading" ref="elements" :block_id="block.block_id"></vue-frontend-form-elements>
	</form>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-html", {mounted() {
			this.refresh();
		},
		
		watch: {
			options() {
				this.refresh();
			}
		},
		
		props: ['options', 'block'],

		methods: {
			refresh() {
				if (this.block && !this.$auth.isAllowTariff(this.block.tariff)) return;
								
				this.$nextTick(() => {
					this.$el.innerHTML = '';
					let s = Firewall.checkHTML(this.options.html);
					
					postscribe(this.$el, s, {
			            done: () => {
				            window.dispatchEvent(new Event("load", {bubbles: false}));
							document.dispatchEvent(new Event("DOMContentLoaded", {bubbles: false}));
			            },
			            beforeWrite: Firewall.checkHTML
			        });
				});
			}
		}, template: `
	<div></div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-link", {data() {
			return {
				loading: ''
			}
		},
		
		props: ['options', 'block', 'section'],
		
		computed: {
			withoutThumb() {
				return (this.options.thumb == undefined);
			},
			
			thumb() {
				if (this.options.thumb == undefined) return null;
				let thumb = this.options.thumb;
				let type = thumb.t || 'i';
				let empty = '<img src="data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==">';
				let link = '';

				switch (type) {
					case 'i':
						if (thumb.i) {
							link = '//taplink.cc/s/icons/'+thumb.i+'.svg';
							return '<div class="is-icon" style="-webkit-mask-image:url('+link+');mask-image:url('+link+')">'+empty+'</div>';
						}
						break;
					case 'p':
						if (thumb.p) {
							link = '//'+this.$account.storage_domain+'/p/'+thumb.p;
							return '<div class="is-picture" style="background-image:url('+link+')">'+empty+'</div>';
						}
						break;
				}
				
				return null;
			},
			stylesheets() {
				let theme = this.$account.theme;
				let transparent = 0;
				
				if (this.section != undefined && this.section.link != undefined && this.section.link.transparent != undefined) {
					transparent = this.section.link.transparent;
				} else {
					transparent = theme.link.transparent;
				}

				// Для совместимости с старыми темами
				if (transparent == 100) transparent = 0;
				
				return (this.options.design && this.options.design.on)?{background: transparentColor(transparent, this.options.design.bg), borderColor: this.options.design.bg, color: this.options.design.text, '--color-text': this.options.design.text}:{};
			},
			
			classname() {
				return (this.options.animation != undefined && this.options.animation)?('has-animation has-animation-'+this.options.animation):'';
			},

			stylesheetsTitle() {
				return (this.options.design && this.options.design.on)?{color: this.options.design.text}:{};
			},

			stylesheetsSubtitle() {
				return (this.options.design && this.options.design.on)?{color: (this.options.design.subtitle != undefined)?this.options.design.subtitle:this.options.design.text}:{};
			},
			
			title() {
				return this.options.title?this.options.title:this.options.link;
			},
			
			isExternal() {
				return ['link', 'phone', 'email', 'sms'].indexOf(this.options.type) != -1;
			},
			
			isAnchor() {
				return (this.options.type == 'link' && this.link.substr(0, 1) == '#');
			},
			
			link() {
				return this.$links.resolve(this.options);
/*
				switch (this.options.type) {
					case 'link':
						return this.$links.process(this.options.link);
						break;
					case 'sms':
						return 'sms:'+'+'+this.options.sms.toString().replace(/[^0-9]/, '')+((this.options.sms_text != undefined && this.options.sms_text.trim().length)?('?&body='+encodeURIComponent(this.options.sms_text)):'');
						break;
					case 'phone':
						return 'tel:'+'+'+this.options.phone.toString().replace(/[^0-9]/, '');
						break;
					case 'email':
						return 'mailto:'+this.options.email+((this.options.email_subject != undefined && this.options.email_subject.trim().length)?('?subject='+encodeURIComponent(this.options.email_subject)):'');
						break;
					case 'page':
						return (this.$account.page_id == this.options.link_page_id)?{name: 'index'}:{name: 'page', params: {page_id: parseInt(this.options.link_page_id).toString(16)}};
						break;
					case 'market':
						return {name: 'catalog'};
						break;
					case 'collection':
						return {name: 'collection', params: {collection_id: parseInt(this.options.collection).toString(16)}};
						break;
					case 'product':
						return {name: 'product', params: {product_id: parseInt(this.options.product).toString(16)}};
						break;
					default:
						return '';
						break;
				}
*/
			}
		},
		
		methods: {
			click(e) {
				let link = _.isObject(this.link)?this.$router.resolve(this.link).href:this.link;
				
				if (!this.isAnchor) {
					this.loading = this.block.stat;
					window.$events.fire('tap', {stat: this.block.block_id+'.'+this.block.stat, pixels: [{name: 'fb', event: 'taplink:'+this.options.type, param: link}], addons: (this.options.data != undefined && this.options.data.link != undefined)?this.options.data.link:null});
					if (!this.isExternal) e.preventDefault();
					
					setTimeout(() => {
						this.loading = '';
					}, 2000)
				} else {
					$mx('[name="'+link.substr(1)+'"]').scrollIt(500);
					e.preventDefault();
				}
			}
		}, template: `
<!-- 	<a v-if="isAnchor" :href='link' class="button btn-link btn-link-styled" :class="{'is-loading': loading == block.stat}" :style="stylesheets"><div><div class="btn-link-title" :style="stylesheetsTitle">{{title}}</div><div v-if="options.subtitle" class="btn-link-subtitle" :style="stylesheetsSubtitle">{{options.subtitle}}</div></div></a> -->
	<a v-if="isExternal" rel="noopener" :href='link' target="_top" class="button btn-link btn-link-styled" :class="[{'without-thumb': withoutThumb, 'with-thumb': !withoutThumb, 'is-loading': loading == block.stat}, classname]" @click="click" :style="stylesheets"><figure class="thumb" v-html="thumb" v-if="thumb"></figure><div><div class="btn-link-title" :style="stylesheetsTitle">{{title}}</div><div v-if="options.subtitle" class="btn-link-subtitle" :style="stylesheetsSubtitle">{{options.subtitle}}</div></div></a>
	<router-link v-else rel="noopener" :to='link' class="button btn-link btn-link-styled" :class="[{'without-thumb': withoutThumb, 'with-thumb': !withoutThumb, 'is-loading': loading == block.stat}, classname]" @click.native="click" :style="stylesheets"><figure class="thumb" v-html="thumb" v-if="thumb"></figure><div><div class="btn-link-title" :style="stylesheetsTitle">{{title}}</div><div v-if="options.subtitle" class="btn-link-subtitle" :style="stylesheetsSubtitle">{{options.subtitle}}</div></div></router-link>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-map", {data() {
			return {
				loading: null
			}
		},
		
		props: ['options', 'block'],
		
		mounted() {
			this.rebuild();
		},
		
		watch: {
			options() {
				this.rebuild();
			}
		},
		
		computed: {
			styleSheets() {
				return (this.options.design && this.options.design.on)?('background:'+this.options.design.bg+';border-color:'+this.options.design.bg+';color:'+this.options.design.text):'';
			}
		},
		
		methods: {
			click(m, i) {
				this.loading = i;
				
				window.$events.fire('tap', {stat: this.block.block_id+'.'+this.block.stat[i], pixels: [{name: 'fb', event: 'taplink:map', param: m.lat+':'+m.lng}]});
				window.top.location = this.link(m);
				
				setTimeout(() => {
					this.loading = null;
				}, 2000)
			},
			
			rebuild() {
				$mx.lazy('map.js', 'map.css', () => {
					var options = this.options.bounds;
					var markers = this.options.markers;
					
					let isFixed = this.options.is_fixed;
				
// 					console.log('center: ', options.center.lat, ', ', options.center.lng);
					
					var map = L.map(this.$refs.map, {
						dragging: !isFixed,
						doubleClickZoom: !isFixed,
						boxZoom: !isFixed,
						touchZoom: !isFixed,
						scrollWheelZoom: !isFixed,
						doubleClickZoom: !isFixed,
						zoomControl: true,
						attributionControl: false,
					}).setView([options.center.lat, options.center.lng], options.zoom);
					
					if (options.bounds) map.fitBounds(options.bounds);
					
					L.control.attribution({prefix: ''}).addTo(map);
			
					L.tileLayer('/maps/{z}/{x}/{y}.png', {
				        attribution: '<a href="https://taplink.cc" target="_blank">Taplink</a> <span style="color:#ccc">|</span> <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
				        crossOrigin: true
					}).addTo(map);
					
					var icon = L.icon({
					    iconUrl: '/s/i/marker.png',
					    iconSize: [28, 37],
					    popupAnchor: [0, -10],
					    shadowUrl: '/s/i/marker-shadow.png',
					    shadowSize: [40, 50],
					    shadowAnchor: [12, 31]
					});
					
					let b = map.getBounds();
	
					_.each(markers, v => {
// 						console.log('marker: ', v.lat, ', ', v.lng);
						var marker = L.marker([v.lat, v.lng], {icon: icon}).addTo(map);
						marker.bindPopup("<b>"+v.title+"</b>"+(v.text?('<div>'+v.text.toString().replace(/\n/g, '<br>')+'</div>'):''));//.openPopup();
					});
				});
			},
			
			link(m) {
				return 'https://maps.google.com/?q='+m.lat+','+m.lng+'&z='+this.options.bounds.zoom;
			}
		}, template: `
	<div><!--  block-form  -->
		<div class="map-container btn-link-block">
			<div class="map-view" ref="map" :class="{'map-view-with-zoom-control': options.show_zoom}"></div>
		</div>
		
		<a v-if="options.show_buttons" v-for="(m, i) in options.markers" :href='link(m)' @click.prevent="click(m,i)" target="_top" class="button btn-link btn-link-block btn-map btn-link-styled btn-link-title" :class="{'is-loading': loading == i}" :style="styleSheets">
			<i class="fa fai fa-map-marker-alt"></i><span>{{m.title|nvl($gettext('Заголовок'))}}</span>
		</a>
		
<!-- 		data-stat='{$f.block_id}.{$f.stat[$i]}' -->
	</div>
	
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-messenger", {data() {
			return {
				loading: null
			}
		},
		
		props: ['options', 'block', 'section'],
		
		methods: {
			iconPaths(l) {
				let s = '';
				if (l.ip != undefined) for (i = 1; i <= l.ip; i++) s += '<span class="p'+i+'"></span>';
				return s;
			},

			click(e, item) {
				this.loading = item.n;
				
				let events = {fb: 'facebook', vk: 'vkontakte'};
				
				let pixels = [
					{name: 'fb', event: 'taplink:messengers', param: (events[item.n] || item.n)+':'+item.v},
					{name: 'fb', event: 'taplink:messengers:'+item.n, param: item.v}
				];
				
				$events.fire('tap', {stat: this.block.block_id+'.'+this.block.stat[item.n], pixels: pixels, addons: (this.options.data != undefined && this.options.data[item.n] != undefined)?this.options.data[item.n]:null});

				setTimeout(() => {
					this.loading = '';
				}, 2000);
				
				// Если ссылка указана заранее
				if (e.target.href == item.link.b) {
					return true;
				} else {
					event.preventDefault();
				}
								
				this.$links.deeplink(item.link)
				
// 				this.$api.get('link/'+this.block.block_id+'.'+this.block.hash+'/'+item.n+'/get').then(openDeeplink);
			},
			
			link(item) {
				return this.$links.application(item.link);
// 				return (item.link != undefined)?item.link:('/link/'+this.block.block_id+'.'+this.block.hash+'/'+item.n+'/');
// 				return (item.link.b != undefined)?item.link:('/link/'+this.block.block_id+'.'+this.block.hash+'/'+item.n+'/');
			},
			
			classname(item) {
				return ((this.loading == item.n)?'is-loading ':'') + ('btn-link-'+this.options.messenger_style+' '+((this.options.messenger_style != 'default')?('btn-socials btn-link-'+item.n):'')) + ((['default', 'block'].indexOf(this.options.messenger_style) != -1)?' btn-link-styled':'');;
			},
		},

		computed: {
			stylesheet() {
				let theme = this.$account.theme;
				let transparent = 0;

				if (this.section != undefined && this.section.link != undefined && this.section.link.transparent != undefined) {
					transparent = this.section.link.transparent;
				} else {
					transparent = theme.link.transparent;
				}

				// Для совместимости с старыми темами
				if (transparent == 100) transparent = 0;

				return (this.options.messenger_style != 'icon' && this.options.design && this.options.design.on)?('background: '+transparentColor(transparent, this.options.design.bg)+' !important;border-color: '+this.options.design.bg+' !important;color: '+this.options.design.text+' !important'):'';
			}
		}, template: `
	<div class="socials">
		<div class="row row-small">
			<div :class="{'col-xs': (options.messenger_style != 'default' && options.messenger_style != 'block'), 'col-xs-12': (options.messenger_style == 'default' || options.messenger_style == 'block')}" v-for="l in options.items">
				<a :href='link(l)' @click="click(event, l)" target="_top" :aria-label="l.t" class="button btn-link btn-link-title" :class="classname(l)" :style="stylesheet">
					<img :src="'/s/i/messengers/icons/{1}.svg'|format(l.n)" v-if="options.messenger_style == 'icon'">
					<i :class="'fa fab fa-{1}'|format(l.i)" v-else v-if="options.messenger_style != 'default' && options.messenger_style != 'icon'" v-html="iconPaths(l)"></i>
					<span v-if="['default', 'block'].indexOf(options.messenger_style) != -1">{{l.t}}</span>
				</a>
			</div>
		</div>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-pictures", {data() {
			return {
				hack: false,
				loading: '',
				index: 0
			}
		},
		props: ['options', 'block'],
		
		computed: {
			dataInterval() {
				return (this.options.carousel_ride && this.$auth.isAllowTariff('pro'))?this.options.carousel_interval:null;
			},
			colorClass() {
				let t = this.$account.theme;
				let color = this.options.design.on?this.options.design.bg:(((t.block == undefined)?StylesFactory.getBaseStyles():t).block.pictures.bg);
				return isLightColor(color)?'is-light':'is-dark';
			}
		},
		
		watch: {
			/*
				todo: Хак, когда идет переход между страницами — vue повторно использует DOM 
				и картинки не обновляются, потмоу что data-picture уже отработал
			*/
			block(v) {
				this.hack = true;
// 				let w = this.options;
// 				this.options = null;
				
				this.$nextTick(() => {
					this.hack = false;
				});
			}
		},
/*
		
		created() {
			this.$nextTick(() => {
				this.$forceUpdate();
			});
		},
*/
		
		methods: {
			stylesteetPicture(f, options) {
				let sizes = {
					100: 100,
					70: '70.6',
					50: 50,
					138: '141.4516'
				}
				var s =  "padding-top: "+sizes[options.picture_size]+"%";//;background-image:url(//"+this.$account.storage_domain+"/p/"+f.picture+")";
				return s;
			},
			
			urlPicture(item) {
				return item.picture?('//'+this.$account.storage_domain+'/p/'+item.picture):null;
			},
			
			isExternal(link) {
				return ['link', 'phone', 'email', ''].indexOf(link.type) != -1;
			},
			
			link(link) {
				return this.$links.resolve(link);
				
/*
				switch (link.type) {
					case 'page':
						return (this.$account.page_id == link.link_page_id)?{name: 'index'}:{name: 'page', params: {page_id: parseInt(link.link_page_id).toString(16)}};
						break;
					case 'market':
						return {name: 'catalog'};
						break;
					case 'collection':
						return {name: 'collection', params: {collection_id: parseInt(link.collection).toString(16)}};
						break;
					case 'product':
						return {name: 'product', params: {product_id: parseInt(link.product).toString(16)}};
						break;
					case 'link':
						return this.$links.process(link.link);
						break;
					default:
						return link.link;
						break;
				}
*/
			},
			
			click(f, i) {
				this.loading = this.block.stat[i];
				
				//addons: (this.options.data != undefined && this.options.data.link != undefined)?this.options.data.link:null}
				//+f.link.type
				
				let link = this.$links.resolve(f.link);
				link = _.isObject(link)?this.$router.resolve(link).href:link;
				window.$events.fire('tap', {stat: this.block.block_id+'.'+this.block.stat[i], pixels: [{name: 'fb', event: 'taplink:pictures', param: link}]});
				
				if (this.isExternal(f.link)) document.location = this.link(f.link);
				
				setTimeout(() => {
					this.loading = '';
				}, 2000)
			}
		}, template: `
	<div class="block-slider" :class="[{'is-allow-fullwidth': options.is_desktop_fullwidth}, colorClass]">
		<div class="block-slider-inner">
			<div ref='device' v-if="!hack" class="slider slider-pictures has-mb-2" :data-interval="dataInterval" :class="{'slider-has-text': options.options.text, 'slider-has-link': options.options.link, 'slider-has-border': !options.remove_border}">
				<div class="slider-inner">
					<div class="slider-slide" :class="{active: index == i}" v-for="(f, i) in options.list">
						<div class="picture-container" :class="{'picture-container-empty': !f.p}" :style="stylesteetPicture(f, options)" :data-picture="urlPicture(f)"></div>
						<div class="slider-slide-text has-rtl">
							<div class="slider-slide-title" v-if="f.t">{{f.t}}</div>
							<div class="slider-slide-title" v-else>{{'Заголовок'|gettext}}</div>
							<div class="slider-slide-snippet">{{f.s}}</div>
						</div>

						<a v-if="isExternal(f.link)" class="slider-slide-link" :class="{'is-loading': loading == block.stat[i]}" rel="noopener" target="_top" :href='link(f.link)' @click.prevent="click(f, i)">{{f.link.title|nvl($gettext('Открыть'))}}</a>
						<router-link v-else class="slider-slide-link" :class="{'is-loading': loading == block.stat[i]}" rel="noopener" :to='link(f.link)' @click.native="click(f, i)">{{f.link.title|nvl($gettext('Открыть'))}}</router-link>
					</div>
				</div>
				<div class="slider-nav" :class="{'is-hidden': options.list.length == 1}" ref='sliders'>
					<div v-for="(v, i) in options.list" class="slider-dot" :class="{active: index == i}" @click="index = i"></div>
				</div>
			</div>
		</div>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-socialnetworks", {data() {
			return {
				loading: null
			}
		},
		props: ['options', 'block', 'section'],
		methods: {
			iconPaths(l) {
				let s = '';
				if (l.ip != undefined) for (i = 1; i <= l.ip; i++) s += '<em class="p'+i+'"></em>';
				return s;
			},
			
			click(e, item) {
				this.loading = item.n;
				
				let events = {fb: 'facebook', vk: 'vkontakte', ok: 'odnoklassniki', ig: 'instagram', pt: 'pinterest', sn: 'snapchat', bh: 'behance', dr: 'dribbble'};
				
				let pixels = [
					{name: 'fb', event: 'taplink:socialnetworks', param: (events[item.n] || item.n)+':'+item.v},
					{name: 'fb', event: 'taplink:socialnetworks:'+item.n, param: item.v}
				];
				
				$events.fire('tap', {stat: this.block.block_id+'.'+this.block.stat[item.n], pixels: pixels, addons: (this.options.data != undefined && this.options.data[item.n] != undefined)?this.options.data[item.n]:null});

				setTimeout(() => {
					this.loading = null;
				}, 2000);

				// Если ссылка указана заранее
				if (e.target.href == item.link.b) {
					return true;
				} else {
					event.preventDefault();
				}
								
				this.$links.deeplink(item.link)				
/*
				if (item.link == undefined) {
					event.preventDefault();
				} else {
					return true;
				}
				
				this.$api.get('link/'+this.block.block_id+'.'+this.block.hash+'/'+item.n+'/get').then(openDeeplink);
*/
			},
			
			link(item) {
				return this.$links.application(item.link);
// 				return (item.link != undefined)?item.link:('/link/'+this.block.block_id+'.'+this.block.hash+'/'+item.n+'/');
			},
			
			classname(item) {
				return ('is-fullwidth '+((this.options.socials_style != 'default')?('btn-socials btn-socials-'+item.n):'')+((this.loading == item.n)?' is-loading':'')) + ((['default', 'block'].indexOf(this.options.socials_style) != -1)?' btn-link-styled':'');
			}
		},
		
		computed: {
			stylesheet() {
				let theme = this.$account.theme;
				let transparent = 0;

				if (this.section != undefined && this.section.link != undefined && this.section.link.transparent != undefined) {
					transparent = this.section.link.transparent;
				} else {
					transparent = theme.link.transparent;
				}

				// Для совместимости с старыми темами
				if (transparent == 100) transparent = 0;

				return (this.options.design && this.options.design.on)?('background:'+transparentColor(transparent, this.options.design.bg)+' !important;border-color:'+this.options.design.bg+' !important;color:'+this.options.design.text+' !important'):'';
				//{if isset($f.options.data[$item.n])}{foreach from=$f.options.data[$item.n] item=_v key=_k} data-addons-{$_k}='{$_v}'{/foreach}{/if}
			}
			
		}, template: `
	<div class="socials">
	<div class="row row-small">
		<div :class="{'col-xs': (options.socials_style != 'default' && options.socials_style != 'block'), 'col-xs-12': (options.socials_style == 'default' || options.socials_style == 'block')}" v-for="l in options.items">
			<a :href="link(l)" @click="click(event, l)" target="_top" :aria-label="l.t" class="button btn-link btn-link-title" :class="classname(l)" :style="stylesheet"><i v-if="options.socials_style != 'default'" :class="l.i" v-html="iconPaths(l)"></i> <span v-if="options.socials_style != 'compact'">{{l.t}}</span></a>
		</div>
	</div>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-text", {/*
		data() {
			return {
				text_sizes: {sm: '1.03', md: '1.26', lg: '1.48', h3: '1.71', h2: '2.2', h1: '3.5'}
			}
		},
*/
		props: ['options'],
		computed: {
			component() {
				return this.isHeading?this.options.text_size:'div';
			},
			
			isHeading() {
				return (this.options.text_size[0] == 'h');
			},
			
			html() {
				let s = this.options.text
					.replace(/(\s)([a-zA-Zа-яА-Я0-9\.\-\_\-]+@[0-9A-Za-z][0-9A-Za-zА-Яа-я\-\.]*\.[A-Za-zА-Яа-я]*)/g, '$1<a href="mailto:$2" target="_blank" class="link">$2</a>')
					.replace(/(\s)(http|https|ftp|ftps|tel)\:\/\/([а-яА-Яa-zA-Z0-9\-\.]+\.[а-яА-Яa-zA-Z]{2,})(\/[^\s"']*)?/g, '$1<a href="$2://$3$4" target="_blank" class="link">$2://$3$4</a>');
				
				return this.$nl2br(s);
			},
			
			style() {
// 				let lineHeights = {h2: 1.25, h1: 1.15};
				let r = {'text-align': this.options.text_align, 'line-height': FontsFactory.getLineHeight(this.options.text_size), 'font-size': FontsFactory.getTextSize(this.options.text_size), color: this.options.color+'!important'};
// 				let r = {"text-align": this.options.text_align + "!important", "line-height": (lineHeights[this.options.text_size] == undefined)?1.4:lineHeights[this.options.text_size], "font-size": this.text_sizes[this.options.text_size]+"rem !important", color: this.options.color};

				if (this.options.font) {
					Object.assign(r, {
						'font-family': FontsFactory.getFont(this.options.font)+" !important", 
// 						'text-transform': (FontsFactory.isUpperCaseHeading(this.options.font)?'uppercase':'none')+" !important",
						'font-weight': this.isHeading?FontsFactory.getWeight(this.options.font, this.$account.theme.heading.weight):null
					});
				}
				FontsFactory.check();
				return r;
			}
		}, template: `
	<component v-bind:is="component" class="block-text has-rtl" :class="{'is-heading': this.options.text_size[0] == 'h'}" :style='style' v-html="html"></component>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-timer", {props: ['options', 'block_id', 'page_id'],
		
		data: () => ({
			countdown: 0
		}),
		
		created() {
			let o = this.options;
			
			if (o.type == 2) {
				var key = 'timer'+this.block_id;
				var now = Math.round(new Date() / 1000);		
				var t = Cookies.get(key);

				o.tms = Math.min(o.tms, 8640000-1); /* 100 дней - 1 сек*/
				
				if (t) {
					o.tms = t - now;
				} else {
					Cookies.set(key, o.tms + now, { maxAge: now + o.expires * 86400, path: o.path?o.path:'/' });
				}
			}
			
			if (o.tms < 0) o.tms = 0;
			this.countdown = o.tms;
		}, template: `
	<div class="block-form">
		<center><vue-blocks-flipclock-countdown :countdown="countdown"></vue-blocks-flipclock-countdown></center>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-blocks-video", {data() {
	        return {
	            player: null,
	            isStarted: false
	        }
	    },

		props: ['options'],
		
		computed: {
			handler() {
				return (this.options.handler != undefined)?this.options.handler:'embeded';	
			},
			link() {
				let isStatic = (new RegExp('[\?|\&]static=1', 'i')).test(location.search);
				return isStatic?this.options.embeded.replace('autoplay=1', ''):this.options.embeded;
			},
			sources() {
				return [{src: this.options.url, type: this.options.type}]
			},
			posterStyle() {
				return this.options.poster?{'background-image': 'url('+this.options.poster+')'}:null;
			}
		},
		
		beforeDestroy() {
	        if (this.player) {
	            this.player.dispose()
	        }
	    },
		
		mounted() {
			let provider = VideoHelper.getProvider(this.options, true);

			if (provider) {
				if (provider.t != undefined) {
					if (this.options.poster) this.options.poster = '//'+this.$account.storage_domain+'/p/'+this.options.poster;
					if (this.options.is_autoplay) this.start();

		        } else {
			        this.options.embeded = provider.embeded(provider.match);
					this.options.handler = 'embeded';
				}
			} 
		},
		
		methods: {
			start() {
				if (this.isStarted) return;
				let provider = VideoHelper.getProvider(this.options, true);
				this.isStarted = true;
				
				this.$nextTick(() => {
					let scripts = [];
					if (provider.s) scripts.push(provider.s);
					
					$mx.lazy('//cdn.jsdelivr.net/combine/npm/video.js@7.1.0/dist/video.min.js,npm/videojs-resolution-switcher@0.4.2/lib/videojs-resolution-switcher.min.js,npm/videojs-playbackrate-adjuster', 'videoplayer.css', () => {
						$mx.lazy(scripts, [], () => {
							let sources = [{src: this.options.url, type: (typeof provider.t == 'function')?provider.t(provider.match[1]):provider.t}];
							let options = {/* playbackRates: [0.5, 1, 1.5, 2], */ poster: this.options.poster, controls: true, autoplay: false, playbackRates: [0.5, 1, 1.5, 2, 4], plugins: {videoJsResolutionSwitcher: {dynamicLabel: true}}, controlBar: {volumePanel: {inline: false}}, sources: sources};
							if (provider.techOrder != undefined) options.techOrder = provider.techOrder;
							
							this.player = videojs(this.$refs.videoPlayer, options);
							this.player.play();
						});
			        });
		        });
			}
		}, template: `
	<div class="video-container">
		<iframe frameborder="0" :src="link" allowfullscreen="1" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" v-if="handler == 'embeded'"></iframe>
		<div class="video-container-poster" :style="posterStyle" @click="start" :class="{'is-started': isStarted}"v-else>
			<video ref="videoPlayer" class="video-js vjs-fill" :class="{'vjs-hidden-control-bar':  this.options.is_autohide}" v-if="isStarted"><div class="video-container-poster-play"></div></video>
			<div class="video-container-poster-play" v-else></div>
		</div>

	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-brandlink", {computed: {
			brandlink() {
				return 'https://'+this.$account.domain+'?utm_source=pages&utm_medium='+this.$account.nickname;//+(this.$account.partner_id?('/invite/'+this.$account.partner_id+'.'+this.$account.partner_hash+'/'):'')+
			},
			
			title() {
				let s = this.$account.domain;
				return s[0].toUpperCase() + s.slice(1);
			}
		}, template: `
	<aside>
	<a v-if="!$account.is_hidelink && !$account.lock_message" :href='brandlink' target="_blank" rel="noopener" class="footer-link">
		{{'Сделано на'|gettext}}
		<svg version="1.1" width="16px" height="16px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 76 76" xml:space="preserve" style="fill:#000;position:relative;top:3px;margin:0 2px">
		<g><path d="M38,0C17,0,0,17,0,38s17,38,38,38s38-17,38-38S59,0,38,0z M38,72C19.2,72,4,56.8,4,38S19.2,4,38,4s34,15.2,34,34S56.8,72,38,72z M57.5,38c0,1.1-0.9,2-2,2h-35c-1.1,0-2-0.9-2-2s0.9-2,2-2h35C56.6,36,57.5,36.9,57.5,38z M57.5,50c0,1.1-0.9,2-2,2h-35c-1.1,0-2-0.9-2-2s0.9-2,2-2h35C56.6,48,57.5,48.9,57.5,50z M57.5,26c0,1.1-0.9,2-2,2h-35c-1.1,0-2-0.9-2-2s0.9-2,2-2h35C56.6,24,57.5,24.9,57.5,26z"/></g>
		</svg>
		<span>{{title}}</span>
	</a>
	</aside>
`});

window.$app.defineComponent("frontend", "vue-frontend-components-clockpicker-face", {//     name: 'BClockpickerFace',
    props: {
        pickerSize: Number,
        min: Number,
        max: Number,
        double: Boolean,
        value: Number,
        faceNumbers: Array,
        disabledValues: Function
    },
    data() {
        return {
            isDragging: false,
            inputValue: this.value,
            prevAngle: 720
        }
    },
    computed: {
        /**
        * How many number indicators are shown on the face
        */
        count() {
            return this.max - this.min + 1
        },
        /**
        * How many number indicators are shown per ring on the face
        */
        countPerRing() {
            return this.double ? (this.count / 2) : this.count
        },
        /**
        * Radius of the clock face
        */
        radius() {
            return this.pickerSize / 2
        },
        /**
        * Radius of the outer ring of number indicators
        */
        outerRadius() {
            return this.radius -
                5 -
                40 / 2
        },
        /**
        * Radius of the inner ring of number indicators
        */
        innerRadius() {
            return Math.max(this.outerRadius * 0.6,
                this.outerRadius - 5 - 40)
            // 48px gives enough room for the outer ring of numbers
        },
        /**
        * The angle for each selectable value
        * For hours this ends up being 30 degrees, for minutes 6 degrees
        */
        degreesPerUnit() {
            return 360 / this.countPerRing
        },
        /**
        * Used for calculating x/y grid location based on degrees
        */
        degrees() {
            return this.degreesPerUnit * Math.PI / 180
        },
        /**
        * Calculates the angle the clock hand should be rotated for the
        * selected value
        */
        handRotateAngle() {
            let currentAngle = this.prevAngle
            while (currentAngle < 0) currentAngle += 360
            let targetAngle = this.calcHandAngle(this.displayedValue)
            let degreesDiff = this.shortestDistanceDegrees(currentAngle, targetAngle)
            let angle = this.prevAngle + degreesDiff
            return angle
        },
        /**
        * Determines how long the selector hand is based on if the
        * selected value is located along the outer or inner ring
        */
        handScale() {
            return this.calcHandScale(this.displayedValue)
        },
        handStyle() {
            return {
                transform: `rotate(${this.handRotateAngle}deg) scaleY(${this.handScale})`,
                transition: '.3s cubic-bezier(.25,.8,.50,1)'
            }
        },
        /**
        * The value the hand should be pointing at
        */
        displayedValue() {
            return this.inputValue == null ? this.min : this.inputValue
        }
    },
    watch: {
        value(value) {
            if (value !== this.inputValue) {
                this.prevAngle = this.handRotateAngle
            }
            this.inputValue = value
        }
    },
    methods: {
        isDisabled(value) {
            return this.disabledValues && this.disabledValues(value)
        },
        /**
        * Calculates the distance between two points
        */
        euclidean(p0, p1) {
            const dx = p1.x - p0.x
            const dy = p1.y - p0.y

            return Math.sqrt(dx * dx + dy * dy)
        },
        shortestDistanceDegrees(start, stop) {
            const modDiff = (stop - start) % 360
            let shortestDistance = 180 - Math.abs(Math.abs(modDiff) - 180)
            return (modDiff + 360) % 360 < 180 ? shortestDistance * 1 : shortestDistance * -1
        },
        /**
        * Calculates the angle of the line from the center point
        * to the given point.
        */
        coordToAngle(center, p1) {
            const value = 2 *
                Math.atan2(p1.y - center.y - this.euclidean(center, p1), p1.x - center.x)
            return Math.abs(value * 180 / Math.PI)
        },
        /**
        * Generates the inline style translate() property for a
        * number indicator, which determines it's location on the
        * clock face
        */
        getNumberTranslate(value) {
            const { x, y } = this.getNumberCoords(value)
            return `translate(${x}px, ${y}px)`
        },
        /***
        * Calculates the coordinates on the clock face for a number
        * indicator value
        */
        getNumberCoords(value) {
            const radius = this.isInnerRing(value) ? this.innerRadius : this.outerRadius
            return {
                x: Math.round(radius * Math.sin((value - this.min) * this.degrees)),
                y: Math.round(-radius * Math.cos((value - this.min) * this.degrees))
            }
        },
        getFaceNumberClasses(num) {
            return {
                'active': num.value === this.displayedValue,
                'disabled': this.isDisabled(num.value)
            }
        },
        /**
        * Determines if a value resides on the inner ring
        */
        isInnerRing(value) {
            return this.double && (value - this.min >= this.countPerRing)
        },
        calcHandAngle(value) {
            let angle = this.degreesPerUnit * (value - this.min)
            if (this.isInnerRing(value)) angle -= 360
            return angle
        },
        calcHandScale(value) {
            return this.isInnerRing(value)
                ? ((this.innerRadius) / this.outerRadius)
                : 1
        },
        onMouseDown(e) {
            e.preventDefault()
            this.isDragging = true
            this.onDragMove(e)
        },
        onMouseUp() {
            this.isDragging = false
            if (!this.isDisabled(this.inputValue)) {
                this.$emit('change', this.inputValue)
            }
        },
        onDragMove(e) {
            e.preventDefault()
            if (!this.isDragging && e.type !== 'click') return

            const { width, top, left } = this.$refs.clock.getBoundingClientRect()
            const { clientX, clientY } = 'touches' in e ? e.touches[0] : e
            const center = { x: width / 2, y: -width / 2 }
            const coords = { x: clientX - left, y: top - clientY }
            const handAngle = Math.round(this.coordToAngle(center, coords) + 360) % 360
            const insideClick = this.double && this.euclidean(center, coords) <
                (this.outerRadius + this.innerRadius) / 2 - 16

            let value = Math.round(handAngle / this.degreesPerUnit) +
                this.min +
                (insideClick ? this.countPerRing : 0)

            // Necessary to fix edge case when selecting left part of max value
            if (handAngle >= (360 - this.degreesPerUnit / 2)) {
                value = insideClick ? this.max : this.min
            }
            this.update(value)
        },
        update(value) {
            if (this.inputValue !== value && !this.isDisabled(value)) {
                this.prevAngle = this.handRotateAngle
                this.inputValue = value
                this.$emit('input', value)
            }
        }
    }, template: `
    <div
        class="b-clockpicker-face"
        @mousedown="onMouseDown"
        @mouseup="onMouseUp"
        @mousemove="onDragMove"
        @touchstart="onMouseDown"
        @touchend="onMouseUp"
        @touchmove="onDragMove">
        <div
            class="b-clockpicker-face-outer-ring"
            ref="clock">
            <div
                class="b-clockpicker-face-hand"
                :style="handStyle" />
            <span
                v-for="(num, index) of faceNumbers"
                :key="index"
                class="b-clockpicker-face-number"
                :class="getFaceNumberClasses(num)"
                :style="{ transform: getNumberTranslate(num.value) }">
                <span>{{ num.label }}</span>
            </span>
        </div>
    </div>
`});

window.$app.defineComponent("frontend", "vue-frontend-components-clockpicker", {//     name: 'BClockpicker',
/*
    components: {
        [ClockpickerFace.name]: ClockpickerFace,
        [Input.name]: Input,
        [Field.name]: Field,
        [Icon.name]: Icon,
        [Dropdown.name]: Dropdown,
        [DropdownItem.name]: DropdownItem
    },
*/
//     mixins: [TimepickerMixin],
    props: {
        pickerSize: {
            type: Number,
            default: 290
        },
        hourFormat: {
            type: String,
            default: '12',
            validator: (value) => {
                return value === '24' || value === '12'
            }
        },
        mobileNative: {
            type: Boolean,
            default: true
        },
        incrementMinutes: {
            type: Number,
            default: 5
        },
        autoSwitch: {
            type: Boolean,
            default: true
        },
        type: {
            type: String,
            default: 'is-primary'
        },
        position: String,
            editable: Boolean,
	        rounded: Boolean,
        disabled: Boolean,
        inline: Boolean,
		minTime: Date,
        maxTime: Date,        
        placeholder: String,
	        loading: Boolean,
	        useHtml5Validation: {
	            type: Boolean,
	            default: true
	        },
		timeFormatter: {
            type: Function,
            default: (date, vm) => {
/*
                if (typeof config.defaultTimeFormatter === 'function') {
                    return config.defaultTimeFormatter(date)
                } else {
*/
					const defaultTimeFormatter = (date, vm) => {
					    let hours = date.getHours()
					    const minutes = date.getMinutes()
					    const seconds = date.getSeconds()
					    let period = ''
					    if (vm.hourFormat === '12') {
					        period = ' ' + (hours < 12 ? AM : PM)
					        if (hours > 12) {
					            hours -= 12
					        } else if (hours === 0) {
					            hours = 12
					        }
					    }
					    return vm.pad(hours) + ':' + vm.pad(minutes) +
					        (vm.enableSeconds ? (':' + vm.pad(seconds)) : '') + period
					}

                    return defaultTimeFormatter(date, vm)
//                 }
            }
        },	        

    },
    data() {
        return {
            isSelectingHour: true,
            isDragging: false,
            _isClockpicker: true,
            dateSelected: this.value,
            hoursSelected: null,
			minutesSelected: null,
            secondsSelected: null,
            meridienSelected: null,            
        }
    },
    computed: {
	    computedValue: {
            get() {
                return this.dateSelected
            },
            set(value) {
                this.dateSelected = value
                this.$emit('input', value)
            }
        },
		hours() {
            const hours = []
            const numberOfHours = this.isHourFormat24 ? 24 : 12
            for (let i = 0; i < numberOfHours; i++) {
                let value = i
                let label = value
                if (!this.isHourFormat24) {
                    value = (i + 1)
                    label = value
                    if (this.meridienSelected === this.AM) {
                        if (value === 12) {
                            value = 0
                        }
                    } else if (this.meridienSelected === this.PM) {
                        if (value !== 12) {
                            value += 12
                        }
                    }
                }
                hours.push({
                    label: this.formatNumber(label),
                    value: value
                })
            }
            return hours
        },

        minutes() {
            const minutes = []
            for (let i = 0; i < 60; i += this.incrementMinutes) {
                minutes.push({
                    label: this.formatNumber(i),
                    value: i
                })
            }
            return minutes
        },

        seconds() {
            const seconds = []
            for (let i = 0; i < 60; i += this.incrementSeconds) {
                seconds.push({
                    label: this.formatNumber(i),
                    value: i
                })
            }
            return seconds
        },

        meridiens() {
            return [AM, PM]
        },        
        hoursDisplay() {
            if (this.hoursSelected == null) return '--'
            if (this.isHourFormat24) return this.pad(this.hoursSelected)

            let display = this.hoursSelected
            if (this.meridienSelected === this.PM) display -= 12
            if (display === 0) display = 12
            return display
        },
        minutesDisplay() {
            return this.minutesSelected == null ? '--' : this.pad(this.minutesSelected)
        },
        minFaceValue() {
            return this.isSelectingHour &&
                !this.isHourFormat24 &&
            this.meridienSelected === this.PM ? 12 : 0
        },
        maxFaceValue() {
            return this.isSelectingHour
                ? (!this.isHourFormat24 && this.meridienSelected === this.AM ? 11 : 23)
                : 59
        },
        faceFormatter() {
            return this.isSelectingHour && !this.isHourFormat24
                ? (val) => val
                : this.formatNumber
        },
        faceSize() {
            return this.pickerSize - (12 * 2)
        },
        faceDisabledValues() {
            return this.isSelectingHour ? this.isHourDisabled : this.isMinuteDisabled
        },
        isMobile() {
            return this.mobileNative && (screen.width < 768); //todo: isMobile.any()
        },
		isHourFormat24() {
            return this.hourFormat === '24'
        }        
    },
    methods: {
        onClockInput(value) {
            if (this.isSelectingHour) {
                this.hoursSelected = value
                this.onHoursChange(value)
            } else {
                this.minutesSelected = value
                this.onMinutesChange(value)
            }
        },
        onHoursChange(value) {
            if (!this.minutesSelected && this.defaultMinutes) {
                this.minutesSelected = this.defaultMinutes
            }
            if (!this.secondsSelected && this.defaultSeconds) {
                this.secondsSelected = this.defaultSeconds
            }
            this.updateDateSelected(
                parseInt(value, 10),
                this.minutesSelected,
                this.enableSeconds ? this.secondsSelected : 0,
                this.meridienSelected
            )
        },

        onMinutesChange(value) {
            if (!this.secondsSelected && this.defaultSeconds) {
                this.secondsSelected = this.defaultSeconds
            }
            this.updateDateSelected(
                this.hoursSelected,
                parseInt(value, 10),
                this.enableSeconds ? this.secondsSelected : 0,
                this.meridienSelected
            )
        },

        onSecondsChange(value) {
            this.updateDateSelected(
                this.hoursSelected,
                this.minutesSelected,
                parseInt(value, 10),
                this.meridienSelected
            )
        },
        updateDateSelected(hours, minutes, seconds, meridiens) {
            if (hours != null && minutes != null &&
                ((!this.isHourFormat24 && meridiens !== null) || this.isHourFormat24)) {
                let time = null
                if (this.computedValue && !isNaN(this.computedValue)) {
                    time = new Date(this.computedValue)
                } else {
                    time = new Date()
                    time.setMilliseconds(0)
                }
                time.setHours(hours)
                time.setMinutes(minutes)
                time.setSeconds(seconds)
                this.computedValue = new Date(time.getTime())
            }
        },
         formatValue(date) {
            if (date && !isNaN(date)) {
                return this.timeFormatter(date, this)
            } else {
                return null
            }
        },
        onClockChange(value) {
            if (this.autoSwitch && this.isSelectingHour) {
                this.isSelectingHour = !this.isSelectingHour
            }
        },
        onMeridienClick(value) {
            if (this.meridienSelected !== value) {
                this.meridienSelected = value
                this.onMeridienChange(value)
            }
        },
		handleOnFocus() {
            this.onFocus()
            if (this.openOnFocus) {
                this.toggle(true)
            }
        },
		/*
        * Parse time from string
        */
        onChangeNativePicker(event) {
            const date = event.target.value
            if (date) {
                let time = null
                if (this.computedValue && !isNaN(this.computedValue)) {
                    time = new Date(this.computedValue)
                } else {
                    time = new Date()
                    time.setMilliseconds(0)
                }
                const t = date.split(':')
                time.setHours(parseInt(t[0], 10))
                time.setMinutes(parseInt(t[1], 10))
                time.setSeconds(t[2] ? parseInt(t[2], 10) : 0)
                this.computedValue = new Date(time.getTime())
            } else {
                this.computedValue = null
            }
        },        
        formatNumber(value, isMinute) {
            return this.isHourFormat24 || isMinute
                ? this.pad(value)
                : value
        },
		onBlur($event) {
	            this.isFocused = false
	            this.$emit('blur', $event)
	            this.checkHtml5Validity()
	        },
	
	        onFocus($event) {
	            this.isFocused = true
	            this.$emit('focus', $event)
	        },        
		pad(value) {
            return (value < 10 ? '0' : '') + value
        }, 
        
        /**
         * Check HTML5 validation, set isValid property.
         * If validation fail, send 'is-danger' type,
         * and error message to parent if it's a Field.
         */
        checkHtml5Validity() {
            if (!this.useHtml5Validation) return

            if (this.$refs[this.$data._elementRef] === undefined) return

            const el = this.$el.querySelector(this.$data._elementRef)

            let type = null
            let message = null
            let isValid = true
            if (!el.checkValidity()) {
                type = 'is-danger'
                message = el.validationMessage
                isValid = false
            }
            this.isValid = isValid

            this.$nextTick(() => {
                if (this.parentField) {
                    // Set type only if not defined
                    if (!this.parentField.type) {
                        this.parentField.newType = type
                    }
                    // Set message only if not defined
                    if (!this.parentField.message) {
                        this.parentField.newMessage = message
                    }
                }
            })

            return this.isValid
        },
		/*
        * Format date into string 'HH-MM-SS'
        */
        formatHHMMSS(value) {
            const date = new Date(value)
            if (value && !isNaN(date)) {
                const hours = date.getHours()
                const minutes = date.getMinutes()
                const seconds = date.getSeconds()
                return this.formatNumber(hours) + ':' +
                    this.formatNumber(minutes, true) + ':' +
                    this.formatNumber(seconds, true)
            }
            return ''
        },        
        
    }, template: `
<!-- :class="[size, type, {'is-expanded': expanded}]" -->
    <div class="b-clockpicker control1">
        <vue-frontend-components-dropdown
            v-if="!isMobile || inline"
            ref="dropdown"
            :position="position"
            :disabled="disabled"
            :inline="inline">
            <input
                v-if="!inline"
                ref="input"
                slot="trigger"
                autocomplete="off"
                type="text"
                :value="formatValue(computedValue)"
                :placeholder="placeholder"
                :loading="loading"
                :disabled="disabled"
                :readonly="!editable"
                :rounded="rounded"
                v-bind="$attrs"
                :use-html5-validation="useHtml5Validation"
                @click.native.stop="toggle(true)"
                @keyup.native.enter="toggle(true)"
                @change.native="onChangeNativePicker"
                @focus="handleOnFocus"
                @blur="onBlur() && checkHtml5Validity()"/>

            <div
                class="card"
                :disabled="disabled"
                custom>
                <header v-if="inline" class="card-header">
                    <div class="b-clockpicker-header card-header-title">
                        <div class="b-clockpicker-time">
                            <span
                                class="b-clockpicker-btn"
                                :class="{ active: isSelectingHour }"
                                @click="isSelectingHour = true">{{ hoursDisplay }}</span>
                            <span>:</span>
                            <span
                                class="b-clockpicker-btn"
                                :class="{ active: !isSelectingHour }"
                                @click="isSelectingHour = false">{{ minutesDisplay }}</span>
                        </div>
                        <div v-if="!isHourFormat24" class="b-clockpicker-period">
                            <div
                                class="b-clockpicker-btn"
                                :class="{ active: meridienSelected == AM }"
                                @click="onMeridienClick(AM)">am</div>
                            <div
                                class="b-clockpicker-btn"
                                :class="{ active: meridienSelected == PM }"
                                @click="onMeridienClick(PM)">pm</div>
                        </div>
                    </div>
                </header>
                <div class="card-content">
                    <div
                        class="b-clockpicker-body"
                        :style="{ width: faceSize + 'px', height: faceSize + 'px' }">
                        <div v-if="!inline" class="b-clockpicker-time">
                            <div
                                class="b-clockpicker-btn"
                                :class="{ active: isSelectingHour }"
                                @click="isSelectingHour = true">Hours</div>
                            <span
                                class="b-clockpicker-btn"
                                :class="{ active: !isSelectingHour }"
                                @click="isSelectingHour = false">Min</span>
                        </div>
                        <div v-if="!isHourFormat24 && !inline" class="b-clockpicker-period">
                            <div
                                class="b-clockpicker-btn"
                                :class="{ active: meridienSelected == AM }"
                                @click="onMeridienClick(AM)">{{ AM }}</div>
                            <div
                                class="b-clockpicker-btn"
                                :class="{ active: meridienSelected == PM }"
                                @click="onMeridienClick(PM)">{{ PM }}</div>
                        </div>
                        <vue-frontend-components-clockpicker-face
                            :picker-size="faceSize"
                            :min="minFaceValue"
                            :max="maxFaceValue"
                            :face-numbers="isSelectingHour ? hours : minutes"
                            :disabled-values="faceDisabledValues"
                            :double="isSelectingHour && isHourFormat24"
                            :value="isSelectingHour ? hoursSelected : minutesSelected"
                            @input="onClockInput"
                            @change="onClockChange" />
                    </div>
                </div>
                <footer
                    v-if="$slots.default !== undefined && $slots.default.length"
                    class="b-clockpicker-footer card-footer">
                    <slot/>
                </footer>
            </div>
        </vue-frontend-components-dropdown>
        <input
            v-else
            ref="input"
            type="time"
            autocomplete="off"
            :value="formatHHMMSS(computedValue)"
            :placeholder="placeholder"
            :loading="loading"
            :max="formatHHMMSS(maxTime)"
            :min="formatHHMMSS(minTime)"
            :disabled="disabled"
            :readonly="false"
            v-bind="$attrs"
            :use-html5-validation="useHtml5Validation"
            style="-webkit-appearance: none"
            @click.stop="toggle(true)"
            @keyup.enter="toggle(true)"
            @change="onChangeNativePicker"
            @focus="handleOnFocus"
            @blur="onBlur() && checkHtml5Validity()"/>
    </div>

`});

window.$app.defineComponent("frontend", "vue-frontend-components-datapicker", {//         name: 'BDatepicker',
//         mixins: [FormElementMixin],
        inheritAttrs: false,
        props: {
            value: Date,
            dayNames: {
                type: Array,
                default: () => {
	                return Vue.prototype.$getDaysNames();
                }
            },
            monthNames: {
                type: Array,
                default: () => {
	                return Vue.prototype.$getMonthsNames();
                }
            },
            firstDayOfWeek: {
                type: Number,
                default: () => {
	                return Vue.prototype.$getFirstDayWeek();
/*
                    if (typeof config.defaultFirstDayOfWeek === 'number') {
                        return config.defaultFirstDayOfWeek
                    } else {
                        return 0
                    }
*/
                }
            },
            inline: Boolean,
            minDate: Date,
            maxDate: Date,
            focusedDate: Date,
            placeholder: String,
            editable: Boolean,
            disabled: Boolean,
            unselectableDates: Array,
            unselectableDaysOfWeek: {
                type: Array,
                default: () => { return [];/*config.defaultUnselectableDaysOfWeek*/ }
            },
            selectableDates: Array,
            dateFormatter: {
                type: Function,
                default: (date) => date_format(window.i18n.formats.date, Date.parse(date) / 1000 | 0)
            },
            dateParser: {
                type: Function,
                default: (date) => {
                    return new Date(Date.parse(date))
                }
            },
            dateCreator: {
                type: Function,
                default: () => {
                    return new Date()
                }
            },
            mobileNative: {
                type: Boolean,
                default: true
            },
            position: String,
            events: Array,
            indicators: {
                type: String,
                default: 'dots'
            },
            required: {
                type: Boolean,
                default: false
            },
            
	        expanded: Boolean,
	        loading: Boolean,
	        rounded: Boolean,
	        // Native options to use in HTML5 validation
	        autocomplete: String,
	        maxlength: [Number, String],
	        useHtml5Validation: {
	            type: Boolean,
	            default: true
	        }
        },
        data() {
            const focusedDate = this.value || this.focusedDate || this.dateCreator()

            return {
                dateSelected: this.value,
                focusedDateData: {
                    month: focusedDate.getMonth(),
                    year: focusedDate.getFullYear()
                },
                _elementRef: 'input',
                _isDatepicker: true,
                 isValid: true,
				 isFocused: false,
				 newIconPack: 'fa'
            }
        },
        computed: {
            /*
            * Returns an array of years for the year dropdown. If earliest/latest
            * dates are set by props, range of years will fall within those dates.
            */
            listOfYears() {
                const latestYear = this.maxDate
                ? this.maxDate.getFullYear()
                    : (Math.max(
                        this.dateCreator().getFullYear(),
                        this.focusedDateData.year) + 3)

                const earliestYear = this.minDate
                ? this.minDate.getFullYear() : 1900

                const arrayOfYears = []
                for (let i = earliestYear; i <= latestYear; i++) {
                    arrayOfYears.push(i)
                }

                return arrayOfYears.reverse()
            },

            isFirstMonth() {
                if (!this.minDate) return false
                const dateToCheck = new Date(this.focusedDateData.year, this.focusedDateData.month)
                const date = new Date(this.minDate.getFullYear(), this.minDate.getMonth())
                return (dateToCheck <= date)
            },

            isLastMonth() {
                if (!this.maxDate) return false
                const dateToCheck = new Date(this.focusedDateData.year, this.focusedDateData.month)
                const date = new Date(this.maxDate.getFullYear(), this.maxDate.getMonth())
                return (dateToCheck >= date)
            },

            isMobile() {
                return this.mobileNative && (screen.width < 768); //todo: isMobile.any()
            },
            
            
            parentField() {
	            let parent = this.$parent
	            for (let i = 0; i < 3; i++) {
	                if (parent && !parent.$data._isField) {
	                    parent = parent.$parent
	                }
	            }
	            return parent
	        },
	
	        /**
	         * Get the type prop from parent if it's a Field.
	         */
	        statusType() {
	            if (!this.parentField) return
	            if (!this.parentField.newType) return
	            if (typeof this.parentField.newType === 'string') {
	                return this.parentField.newType
	            } else {
	                for (let key in this.parentField.newType) {
	                    if (this.parentField.newType[key]) {
	                        return key
	                    }
	                }
	            }
	        },
	
	        /**
	         * Get the message prop from parent if it's a Field.
	         */
	        statusMessage() {
	            if (!this.parentField) return
	
	            return this.parentField.newMessage
	        }
	
        },
        watch: {
            /*
            * Emit input event with selected date as payload, set isActive to false.
            * Update internal focusedDateData
            */
            dateSelected(value) {
                const currentDate = !value ? this.dateCreator() : value
                this.focusedDateData = {
                    month: currentDate.getMonth(),
                    year: currentDate.getFullYear()
                }
                this.$emit('input', value)
                if (this.$refs.dropdown) {
                    this.$refs.dropdown.isActive = false
                }
            },

            /**
             * When v-model is changed:
             *   1. Update internal value.
             *   2. If it's invalid, validate again.
             */
            value(value) {
                this.dateSelected = value

                !this.isValid && this.$refs.input.checkHtml5Validity()
            },

            focusedDate(value) {
                if (value) {
                    this.focusedDateData = {
                        month: value.getMonth(),
                        year: value.getFullYear()
                    }
                }
            },

            /*
            * Emit input event on month and/or year change
            */
            'focusedDateData.month'(value) {
                this.$emit('change-month', value)
            },
            'focusedDateData.year'(value) {
                this.$emit('change-year', value)
            }
        },
        methods: {
            /*
            * Emit input event with selected date as payload for v-model in parent
            */
            updateSelectedDate(date) {
                this.dateSelected = date
            },

            /*
            * Parse string into date
            */
            onChange(value) {
                const date = this.dateParser(value)
                if (date && !isNaN(date)) {
                    this.dateSelected = date
                } else {
                    // Force refresh input value when not valid date
                    this.dateSelected = null
                    this.$refs.input.newValue = this.dateSelected
                }
            },

            /*
            * Format date into string
            */
            formatValue(value) {
                if (value && !isNaN(value)) {
                    return this.dateFormatter(value)
                } else {
                    return null
                }
            },

            /*
            * Either decrement month by 1 if not January or decrement year by 1
            * and set month to 11 (December)
            */
            decrementMonth() {
                if (this.disabled) return

                if (this.focusedDateData.month > 0) {
                    this.focusedDateData.month -= 1
                } else {
                    this.focusedDateData.month = 11
                    this.focusedDateData.year -= 1
                }
            },

            /*
            * Either increment month by 1 if not December or increment year by 1
            * and set month to 0 (January)
            */
            incrementMonth() {
                if (this.disabled) return

                if (this.focusedDateData.month < 11) {
                    this.focusedDateData.month += 1
                } else {
                    this.focusedDateData.month = 0
                    this.focusedDateData.year += 1
                }
            },

            /*
            * Format date into string 'YYYY-MM-DD'
            */
            formatYYYYMMDD(value) {
                const date = new Date(value)
                if (value && !isNaN(date)) {
                    const year = date.getFullYear()
                    const month = date.getMonth() + 1
                    const day = date.getDate()
                    return year + '-' +
                        ((month < 10 ? '0' : '') + month) + '-' +
                        ((day < 10 ? '0' : '') + day)
                }
                return ''
            },

            /*
            * Parse date from string
            */
            onChangeNativePicker(event) {
                const date = event.target.value
                this.dateSelected = date ? new Date(date.replace(/-/g, '/')) : null
            },
            
            
            focus() {
	            if (this.$data._elementRef === undefined) return
	
	            this.$nextTick(() => this.$el.querySelector(this.$data._elementRef).focus())
	        },
	
	        onBlur($event) {
	            this.isFocused = false
	            this.$emit('blur', $event)
	            this.checkHtml5Validity()
	        },
	
	        onFocus($event) {
	            this.isFocused = true
	            this.$emit('focus', $event)
	        },
	
	        /**
	         * Check HTML5 validation, set isValid property.
	         * If validation fail, send 'is-danger' type,
	         * and error message to parent if it's a Field.
	         */
	        checkHtml5Validity() {
	            if (!this.useHtml5Validation) return
	
	            if (this.$refs[this.$data._elementRef] === undefined) return
	
	            const el = this.$el.querySelector(this.$data._elementRef)
	
	            let type = null
	            let message = null
	            let isValid = true
	            if (!el.checkValidity()) {
	                type = 'is-danger'
	                message = el.validationMessage
	                isValid = false
	            }
	            this.isValid = isValid
	
	            this.$nextTick(() => {
	                if (this.parentField) {
	                    // Set type only if not defined
	                    if (!this.parentField.type) {
	                        this.parentField.newType = type
	                    }
	                    // Set message only if not defined
	                    if (!this.parentField.message) {
	                        this.parentField.newMessage = message
	                    }
	                }
	            })
	
	            return this.isValid
	        }
        }, template: `
	<div class="has-feedback datepicker-container">
    <div class="datepicker" :class="{'is-expanded': expanded}">
        <vue-frontend-components-dropdown
            v-if="!isMobile || inline"
            ref="dropdown"
            :position="position"
            :disabled="disabled"
            :inline="inline">
            <input
                v-if="!inline"
                ref="input"
                :required="required"
                slot="trigger"
                type="text"
                autocomplete="off"
                :value="formatValue(dateSelected)"
                :placeholder="placeholder"
                :rounded="rounded"
                :loading="loading"
                :disabled="disabled"
                @keypress.prevent="" 
                @keyup.prevent=""
                @keydown.prevent=""
                v-bind="$attrs"
                @change.native="onChange($event.target.value)"
                @focus="$emit('focus', $event)"
                @blur="$emit('blur', $event) && checkHtml5Validity()"/>
            <vue-frontend-components-dropdown-item :disabled="disabled" custom>
                <header class="datepicker-header">
                    <template v-if="$slots.header !== undefined && $slots.header.length">
                        <slot name="header" />
                    </template>
                    <div
                        v-else
                        class="pagination field is-centered">
                        <a
                            v-show="!isFirstMonth && !disabled"
                            class="pagination-previous"
                            role="button"
                            href="#"
                            :disabled="disabled"
                            @click.prevent="decrementMonth"
                            @keydown.enter.prevent="decrementMonth"
                            @keydown.space.prevent="decrementMonth">

							<i class="fai fa-angle-left fa-lg"></i>
                        </a>
                        <a
                            v-show="!isLastMonth && !disabled"
                            class="pagination-next"
                            role="button"
                            href="#"
                            :disabled="disabled"
                            @click.prevent="incrementMonth"
                            @keydown.enter.prevent="incrementMonth"
                            @keydown.space.prevent="incrementMonth">

							<i class="fai fa-angle-right fa-lg"></i>
                        </a>
                        <div class="pagination-list">
                            <div class="field has-addons">
	                            <div class="control">
	                            <span class="select">
                                <select
                                    v-model="focusedDateData.month"
                                    :disabled="disabled">
                                    <option
                                        v-for="(month, index) in monthNames"
                                        :value="index"
                                        :key="month">
                                        {{ month }}
                                    </option>
                                </select>
	                            </span>
	                            </div>
	                            <div class="control">
								<span class="select">
                                <select
                                    v-model="focusedDateData.year"
                                    :disabled="disabled">
                                    <option
                                        v-for="year in listOfYears"
                                        :value="year"
                                        :key="year">
                                        {{ year }}
                                    </option>
                                </select>
								</span>
	                            </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div class="datepicker-content">
                    <vue-frontend-components-datepicker-table
                        v-model="dateSelected"
                        :day-names="dayNames"
                        :month-names="monthNames"
                        :first-day-of-week="firstDayOfWeek"
                        :min-date="minDate"
                        :max-date="maxDate"
                        :focused="focusedDateData"
                        :disabled="disabled"
                        :unselectable-dates="unselectableDates"
                        :unselectable-days-of-week="unselectableDaysOfWeek"
                        :selectable-dates="selectableDates"
                        :events="events"
                        :indicators="indicators"
                        :date-creator="dateCreator"
                        @close="$refs.dropdown.isActive = false"/>
                </div>

                <footer
                    v-if="$slots.default !== undefined && $slots.default.length"
                    class="datepicker-footer">
                    <slot/>
                </footer>
            </vue-frontend-components-dropdown-item>
        </vue-frontend-components-dropdown>

        <input
            v-else
            ref="input"
            type="date"
            :required="required"
            autocomplete="off"
            :value="formatYYYYMMDD(value)"
            :placeholder="placeholder"
            :loading="loading"
            :max="formatYYYYMMDD(maxDate)"
            :min="formatYYYYMMDD(minDate)"
            :disabled="disabled"
            v-bind="$attrs"
            @change="onChangeNativePicker"
            @focus="$emit('focus', $event)"
            @blur="$emit('blur', $event) && checkHtml5Validity()"/>
    </div>
	<a class="form-control-feedback has-text-grey" v-if="value" @click="value = null"><i class="fai fa-times"></i></a>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-components-datepicker-table-row", {props: {
            selectedDate: Date,
            week: {
                type: Array,
                required: true
            },
            month: {
                type: Number,
                required: true
            },
            minDate: Date,
            maxDate: Date,
            disabled: Boolean,
            unselectableDates: Array,
            unselectableDaysOfWeek: Array,
            selectableDates: Array,
            events: Array,
            indicators: String,
            dateCreator: Function
        },
        methods: {
            /*
            * Check that selected day is within earliest/latest params and
            * is within this month
            */
            selectableDate(day) {
                const validity = []

                if (this.minDate) {
                    validity.push(day >= this.minDate)
                }

                if (this.maxDate) {
                    validity.push(day <= this.maxDate)
                }

                validity.push(day.getMonth() === this.month)

                if (this.selectableDates) {
                    for (let i = 0; i < this.selectableDates.length; i++) {
                        const enabledDate = this.selectableDates[i]
                        if (day.getDate() === enabledDate.getDate() &&
                            day.getFullYear() === enabledDate.getFullYear() &&
                            day.getMonth() === enabledDate.getMonth()) {
                            return true
                        } else {
                            validity.push(false)
                        }
                    }
                }

                if (this.unselectableDates) {
                    for (let i = 0; i < this.unselectableDates.length; i++) {
                        const disabledDate = this.unselectableDates[i]
                        validity.push(
                            day.getDate() !== disabledDate.getDate() ||
                            day.getFullYear() !== disabledDate.getFullYear() ||
                            day.getMonth() !== disabledDate.getMonth()
                        )
                    }
                }

                if (this.unselectableDaysOfWeek) {
                    for (let i = 0; i < this.unselectableDaysOfWeek.length; i++) {
                        const dayOfWeek = this.unselectableDaysOfWeek[i]
                        validity.push(day.getDay() !== dayOfWeek)
                    }
                }

                return validity.indexOf(false) < 0
            },

            /*
            * Emit select event with chosen date as payload
            */
            emitChosenDate(day) {
                if (this.disabled) return

                if (this.selectableDate(day)) {
                    this.$emit('select', day)
                }
            },

            eventsDateMatch(day) {
                if (!this.events.length) return false

                const dayEvents = []

                for (let i = 0; i < this.events.length; i++) {
                    if (this.events[i].date.getDay() === day.getDay()) {
                        dayEvents.push(this.events[i])
                    }
                }

                if (!dayEvents.length) {
                    return false
                }

                return dayEvents
            },

            /*
            * Build classObject for cell using validations
            */
            classObject(day) {
                function dateMatch(dateOne, dateTwo) {
                    // if either date is null or undefined, return false
                    if (!dateOne || !dateTwo) {
                        return false
                    }

                    return (dateOne.getDate() === dateTwo.getDate() &&
                        dateOne.getFullYear() === dateTwo.getFullYear() &&
                        dateOne.getMonth() === dateTwo.getMonth())
                }

                return {
                    'is-selected': dateMatch(day, this.selectedDate),
                    'is-today': dateMatch(day, this.dateCreator()),
                    'is-selectable': this.selectableDate(day) && !this.disabled,
                    'is-unselectable': !this.selectableDate(day) || this.disabled
                }
            }
        }, template: `
    <div class="datepicker-row">
        <template v-for="(day, index) in week">
            <a
                v-if="selectableDate(day) && !disabled"
                :key="index"
                :class="[classObject(day), {'has-event':eventsDateMatch(day)}, indicators]"
                class="datepicker-cell"
                role="button"
                href="#"
                :disabled="disabled"
                @click.prevent="emitChosenDate(day)"
                @keydown.enter.prevent="emitChosenDate(day)"
                @keydown.space.prevent="emitChosenDate(day)">
                {{ day.getDate() }}

                <div class="events" v-if="eventsDateMatch(day)">
                    <div
                        class="event"
                        :class="event.type"
                        v-for="(event, index) in eventsDateMatch(day)"
                        :key="index"/>
                </div>

            </a>
            <div
                v-else
                :key="index"
                :class="classObject(day)"
                class="datepicker-cell">
                {{ day.getDate() }}
            </div>
        </template>
    </div>
`});

window.$app.defineComponent("frontend", "vue-frontend-components-datepicker-table", {props: {
            value: Date,
            dayNames: Array,
            monthNames: Array,
            firstDayOfWeek: Number,
            events: Array,
            indicators: String,
            minDate: Date,
            maxDate: Date,
            focused: Object,
            disabled: Boolean,
            dateCreator: Function,
            unselectableDates: Array,
            unselectableDaysOfWeek: Array,
            selectableDates: Array
        },
        computed: {
            visibleDayNames() {
                const visibleDayNames = []
                let index = this.firstDayOfWeek
                while (visibleDayNames.length < this.dayNames.length) {
                    const currentDayName = this.dayNames[(index % this.dayNames.length)]
                    visibleDayNames.push(currentDayName)
                    index++
                }
                return visibleDayNames
            },

            hasEvents() {
                return this.events && this.events.length
            },

            /*
            * Return array of all events in the specified month
            */
            eventsInThisMonth() {
                if (!this.events) return []

                const monthEvents = []

                for (let i = 0; i < this.events.length; i++) {
                    let event = this.events[i]

                    if (!event.hasOwnProperty('date')) {
                        event = { date: event }
                    }
                    if (!event.hasOwnProperty('type')) {
                        event.type = 'is-primary'
                    }
                    if (
                        event.date.getMonth() === this.focused.month &&
                        event.date.getFullYear() === this.focused.year
                    ) {
                        monthEvents.push(event)
                    }
                }

                return monthEvents
            }
        },
        methods: {
            /*
            * Emit input event with selected date as payload for v-model in parent
            */
            updateSelectedDate(date) {
                this.$emit('input', date)
            },

            /*
            * Return array of all days in the week that the startingDate is within
            */
            weekBuilder(startingDate, month, year) {
                const thisMonth = new Date(year, month)

                const thisWeek = []

                const dayOfWeek = new Date(year, month, startingDate).getDay()

                const end = dayOfWeek >= this.firstDayOfWeek
                    ? (dayOfWeek - this.firstDayOfWeek)
                    : ((7 - this.firstDayOfWeek) + dayOfWeek)

                let daysAgo = 1
                for (let i = 0; i < end; i++) {
                    thisWeek.unshift(new Date(
                        thisMonth.getFullYear(),
                        thisMonth.getMonth(),
                        startingDate - daysAgo)
                    )
                    daysAgo++
                }

                thisWeek.push(new Date(year, month, startingDate))

                let daysForward = 1
                while (thisWeek.length < 7) {
                    thisWeek.push(new Date(year, month, startingDate + daysForward))
                    daysForward++
                }

                return thisWeek
            },

            /*
            * Return array of all weeks in the specified month
            */
            weeksInThisMonth(month, year) {
                const weeksInThisMonth = []
                const daysInThisMonth = new Date(year, month + 1, 0).getDate()

                let startingDay = 1

                while (startingDay <= daysInThisMonth + 6) {
                    const newWeek = this.weekBuilder(startingDay, month, year)
                    let weekValid = false

                    newWeek.forEach((day) => {
                        if (day.getMonth() === month) {
                            weekValid = true
                        }
                    })

                    if (weekValid) {
                        weeksInThisMonth.push(newWeek)
                    }

                    startingDay += 7
                }

                return weeksInThisMonth
            },

            eventsInThisWeek(week, index) {
                if (!this.eventsInThisMonth.length) return []

                const weekEvents = []

                let weeksInThisMonth = []
                weeksInThisMonth = this.weeksInThisMonth(this.focused.month, this.focused.year)

                for (let d = 0; d < weeksInThisMonth[index].length; d++) {
                    for (let e = 0; e < this.eventsInThisMonth.length; e++) {
                        const eventsInThisMonth = this.eventsInThisMonth[e].date.getTime()
                        if (eventsInThisMonth === weeksInThisMonth[index][d].getTime()) {
                            weekEvents.push(this.eventsInThisMonth[e])
                        }
                    }
                }

                return weekEvents
            }
        }, template: `
    <section class="datepicker-table">
        <header class="datepicker-header">
            <div
                v-for="(day, index) in visibleDayNames"
                :key="index"
                class="datepicker-cell">
                {{ day }}
            </div>
        </header>
        <div class="datepicker-body" :class="{'has-events':hasEvents}">
            <vue-frontend-components-datepicker-table-row
                v-for="(week, index) in weeksInThisMonth(focused.month, focused.year)"
                :key="index"
                :selected-date="value"
                :week="week"
                :month="focused.month"
                :min-date="minDate"
                :max-date="maxDate"
                :disabled="disabled"
                :unselectable-dates="unselectableDates"
                :unselectable-days-of-week="unselectableDaysOfWeek"
                :selectable-dates="selectableDates"
                :events="eventsInThisWeek(week, index)"
                :indicators="indicators"
                :date-creator="dateCreator"
                @select="updateSelectedDate"/>
        </div>
    </section>
`});

window.$app.defineComponent("frontend", "vue-frontend-components-document", {data() {
			return {
			}
		},
		
		props: ['value'],
		
		methods: {
			showPicture(b) {
				const ImageModalForm = {
			        props: ['value'],
			        template: '<img :src="value">'
		        }
		        
				$mx.lazy('//cdn.jsdelivr.net/npm/basiclightbox@5.0.4/dist/basicLightbox.min.js', '//cdn.jsdelivr.net/npm/basiclightbox@5.0.4/dist/basicLightbox.min.css', () => {
					const instance = basicLightbox.create('<img src="'+b.data.file.url+'">');
					instance.show()
				})
				
/*
				Vue.prototype.$buefy.modal.open({
	                component: ImageModalForm,
	                props: {value: b.data.file.url},
	                width: 'auto',
	                trapFocus: true,
	                canCancel: ['outside'],
	                hasModalCard: true
				});
*/
			}
		}, template: `
	<div>
		<div v-for="b in value.blocks">
			<p v-if="b.type == 'paragraph'" v-html="b.data.text" />
			<component v-if="b.type == 'header'" v-bind:is="'h'+b.data.level" v-html="b.data.text" />
			<div v-if="b.type == 'image'" class="doc-image" :class="{'has-bordered': b.data.withBorder, 'has-stretched': b.data.stretched, 'has-background': b.data.withBackground}">	
				<img :src="b.data.file.url" :alt="b.data.caption" style="cursor: pointer" @click="showPicture(b)">
			</div>
			<component v-if="b.type == 'list'" v-bind:is="(b.data.style == 'ordered')?'ol':'ul'"><li v-for="item in b.data.items" v-html="item" /></component>
			<div v-if="b.type == 'embed'">
				<div v-if="['vimeo', 'youtube'].indexOf(b.data.service) != -1" class="video-container">
					<iframe :src="b.data.embed" frameborder="0" allowtransparency="true" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
<!-- 				<vue-component-video :options="{url: b.data.embed, is_autoplay: true, is_loop: true, is_playsinline: true, has_controls: false, is_autohide: false, poster: null, type: 'video/mp4', handler: 'player'}" style="pointer-events: none"></vue-component-video> -->
				</div>
			</div>
			<pre v-if="b.type == 'code'" class="highlightjs" :class="'lang-'+b.data.language">{{b.data.code}}</pre>
			<blockquote v-if="b.type == 'quote'" v-html="b.data.text"></blockquote>
			<table class="doc-table" v-if="b.type == 'table'">
				<tbody>
					<tr v-for="tr in b.data.content"><td v-for="td in tr" v-html="td"></td></tr>
				</tbody>
			</table>
		</div>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-components-dropdown-item", {props: {
            value: {
                type: [String, Number, Boolean, Object, Array, Function],
                default: null
            },
            separator: Boolean,
            disabled: Boolean,
            custom: Boolean,
            paddingless: Boolean,
            hasLink: Boolean,
            ariaRole: {
                type: String,
                default: ''
            }
        },
        computed: {
            anchorClasses() {
                return {
                    'is-disabled': this.$parent.disabled || this.disabled,
                    'is-paddingless': this.paddingless,
                    'is-active': this.value !== null && this.value === this.$parent.selected
                }
            },
            itemClasses() {
                return {
                    'dropdown-item': !this.hasLink,
                    'is-disabled': this.disabled,
                    'is-paddingless': this.paddingless,
                    'is-active': this.value !== null && this.value === this.$parent.selected,
                    'has-link': this.hasLink
                }
            },
            ariaRoleItem() {
                return this.ariaRole === 'menuitem' || this.ariaRole === 'listitem' ? this.ariaRole : null
            },
            /**
             * Check if item can be clickable.
             */
            isClickable() {
                return !this.$parent.disabled && !this.separator && !this.disabled && !this.custom
            }
        },
        methods: {
            /**
             * Click listener, select the item.
             */
            selectItem() {
                if (!this.isClickable) return

                this.$parent.selectItem(this.value)
                this.$emit('click')
            }
        },
        created() {
            if (!this.$parent.$data._isDropdown) {
                this.$destroy()
                throw new Error('You should wrap bDropdownItem on a bDropdown')
            }
        }, template: `
    <hr v-if="separator" class="dropdown-divider">
    <a
        v-else-if="!custom && !hasLink"
        class="dropdown-item"
        :class="anchorClasses"
        @click="selectItem"
        :role="ariaRoleItem">
        <slot/>
    </a>
    <div
        v-else
        :class="itemClasses"
        @click="selectItem"
        :role="ariaRoleItem">
        <slot/>
    </div>
`});

window.$app.defineComponent("frontend", "vue-frontend-components-dropdown", {props: {
            value: {
                type: [String, Number, Boolean, Object, Array, Function],
                default: null
            },
            disabled: Boolean,
            hoverable: Boolean,
            inline: Boolean,
            position: {
                type: String,
                validator(value) {
                    return [
                        'is-top-right',
                        'is-top-left',
                        'is-bottom-left'
                    ].indexOf(value) > -1
                }
            },
            mobileModal: {
                type: Boolean,
                default: true
            },
            ariaRole: {
                type: String,
                default: ''
            },
            animation: {
                type: String,
                default: 'fade'
            }
        },
        data() {
            return {
                selected: this.value,
                isActive: false,
                _isDropdown: true // Used internally by DropdownItem
            }
        },
        computed: {
            rootClasses() {
                return [this.position, {
                    'is-disabled': this.disabled,
                    'is-hoverable': this.hoverable,
                    'is-inline': this.inline,
                    'is-active': this.isActive || this.inline,
                    'is-mobile-modal': this.isMobileModal
                }]
            },
            isMobileModal() {
                return this.mobileModal && !this.inline && !this.hoverable
            },
            ariaRoleMenu() {
                return this.ariaRole === 'menu' || this.ariaRole === 'list' ? this.ariaRole : null
            }
        },
        watch: {
            /**
             * When v-model is changed set the new selected item.
             */
            value(value) {
                this.selected = value
            },

            /**
             * Emit event when isActive value is changed.
             */
            isActive(value) {
                this.$emit('active-change', value)
            }
        },
        methods: {
            /**
             * Click listener from DropdownItem.
             *   1. Set new selected item.
             *   2. Emit input event to update the user v-model.
             *   3. Close the dropdown.
             */
            selectItem(value) {
                if (this.selected !== value) {
                    this.$emit('change', value)
                    this.selected = value
                }
                this.$emit('input', value)
                this.isActive = false
            },

            /**
             * White-listed items to not close when clicked.
             */
            isInWhiteList(el) {
                if (el === this.$refs.dropdownMenu) return true
                if (el === this.$refs.trigger) return true
                // All chidren from dropdown
                if (this.$refs.dropdownMenu !== undefined) {
                    const children = this.$refs.dropdownMenu.querySelectorAll('*')
                    for (const child of children) {
                        if (el === child) {
                            return true
                        }
                    }
                }
                // All children from trigger
                if (this.$refs.trigger !== undefined) {
                    const children = this.$refs.trigger.querySelectorAll('*')
                    for (const child of children) {
                        if (el === child) {
                            return true
                        }
                    }
                }

                return false
            },

            /**
             * Close dropdown if clicked outside.
             */
            clickedOutside(event) {
                if (this.inline) return

                if (!this.isInWhiteList(event.target)) this.isActive = false
            },

            /**
             * Toggle dropdown if it's not disabled.
             */
            toggle() {
                if (this.disabled || this.hoverable) return

                if (!this.isActive) {
                    // if not active, toggle after clickOutside event
                    // this fixes toggling programmatic
                    this.$nextTick(() => { this.isActive = !this.isActive })
                } else {
                    this.isActive = !this.isActive
                }
            }
        },
        created() {
            if (typeof window !== 'undefined') {
                document.addEventListener('click', this.clickedOutside)
            }
        },
        beforeDestroy() {
            if (typeof window !== 'undefined') {
                document.removeEventListener('click', this.clickedOutside)
            }
        }, template: `
    <div class="dropdown" :class="rootClasses">
        <div
            v-if="!inline"
            role="button"
            ref="trigger"
            class="dropdown-trigger"
            @click="toggle"
            aria-haspopup="true">
            <slot name="trigger"/>
        </div>

        <transition :name="animation">
            <div
                v-if="isMobileModal"
                v-show="isActive"
                class="background"
                :aria-hidden="!isActive"
            />
        </transition>
        <transition :name="animation">
            <div
                v-show="(!disabled && (isActive || hoverable)) || inline"
                ref="dropdownMenu"
                class="dropdown-menu"
                :aria-hidden="!isActive">
                <div
                    class="dropdown-content"
                    :role="ariaRoleMenu">
                    <slot/>
                </div>
            </div>
        </transition>
    </div>
`});

window.$app.defineComponent("frontend", "vue-frontend-form-elements", {data() {
			return {
				isLoadingAgreement: true,
				isOpenAgreement: false,
				agreement: null
			}
		},
		
		props: ['options', 'fields', 'errors', 'isLoading', 'checkDepends', 'block_id'],
		
		mounted() {
			this.rebuildValues();
		},
		
		watch: {
			fields() {
				this.rebuildValues();
			}
		},
		
		computed: {
			disabled() {
				return (this.$account.readonly != undefined && this.$account.readonly) || this.isLoading;
			}
		},
		
		methods: {
			rebuildValues() {
				_.each(this.fields, (f) => {
					switch (f.typename) {
						case 'checkbox':
							if (f.default) f.value = 1;
							break;
						case 'country':
								$mx.lazy('countries.'+i18n.locale+'.js', () => {
									f.typename = 'select';
									f.variants = _.sortBy(_.filter(_.map(i18n.counties, (v, k) => { return (f.ids == undefined || !f.ids.length || f.ids.indexOf(parseInt(k)) != -1)?(_.isObject(v)?v:{k:k, v:v}):null; })), 'v');
									f.nulltitle = this.$gettext('-- Выберите страну --');
								});
							break;
						case 'select':
							f.variants = _.map(f.variants, (v, k) => { return _.isObject(v)?v:{k:k, v:v}; });
							break;
					}
				})
			},
			
			stylesheet(field) {
				return (this.options && this.options.design && this.options.design.on)?('background:'+this.options.design.bg+';border-color:'+this.options.design.bg+';color:'+this.options.design.text):'';
			},
			
			checkFieldDepends(field) {
				if (field.depends_name == undefined) return true;
				if (!this.checkDepends) return true;
				return this.checkDepends(field) || ((this.fields[field.depends_name] != undefined) && (field.depends_value.indexOf(this.fields[field.depends_name].value) != -1));
			},
			
			input_type(field) {
				let input_type = 'text';
				if (['password', 'number', 'email'].indexOf(field.typename) != -1) input_type = field.typename;
// 				if (field.typename == 'password') input_type = 'password';
// 				if (field.typename == 'number') input_type = 'number';
// 				if (field.typename == 'email') input_type = 'email';
				return input_type;
			},

			prepareParagraph(f) {
				return f.text;//.replace(/<a /, '<a onclick="return false" ');
			},
			
			clickParagraph(e) {
				if (e.target && e.target.tagName.toUpperCase() == 'A') {
					if (e.target.getAttribute('target') == '_blank') return;
					this.isOpenAgreement = true;
					
					if (!this.agreement) {
						let params = e.target.getAttribute('data-endpoint-params');
						params = params?JSON.parse(params):{};
						
						this.$api.get(e.target.getAttribute('data-endpoint'), {params: Object.assign(params, {request: 'body'})}).then((r) => {
							this.agreement = r.response.body;
							this.isLoadingAgreement = false;
						})
					}
				}
				
				e.preventDefault();	
			},
						
			selectStyle(f) {
				return (f.value)?'':'color:gray';
			},
			
			getFields() {
				let isValid = true;
				let fields = [];

// 				for (var i = 0; i < this.fields.length; i++) {
				for (i in this.fields) {
					let f = this.fields[i];
					if (!this.checkFieldDepends(f)) continue;
					if (['paragraph', 'button'].indexOf(f.typename) == -1) {
						switch (f.typename) {
							case 'date':
								// Дата
								f.value = f.value?date_format("d.m.Y", f.value / 1000 | 0):'';
								break;
							case 'time':
								// Дата
								f.value = f.value?date_format("H:i", f.value / 1000 | 0):'';
								break;
							default:
								if (f.value == undefined) f.value = '';
								switch (typeof f.value)
								{
									case 'number':
									case 'boolean':
										break;
									default:
										f.value = f.value.toString().trim();
										break;
								}
						}
						
						if (f.required && !f.value) {
							alert(this.$gettext("Необходимо заполнить поле"));
							isValid = false;
							break;
						}
						
						if ((f.typename == 'phone' && !f.valid && f.value) || (!f.value && f.required)) {
							alert(this.$gettext("Введите корректный номер телефона"));
							isValid = false;
							break;
						}
						
						if ((f.typename == 'email' && !f.valid && f.value) || (!f.value && f.required)) {
							let r = /^(([^а-я<>()[\]\\.,;:\s@\"]+(\.[^а-я<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
							if (!r.test(f.value)) {
								alert(this.$gettext('Введите корректный email'));
								isValid = false;
								break;
							}
						}

						fields[i] = {type: f.type_id, value: f.value, idx: (f.idx == undefined)?null:f.idx}
					}
				}
				
				return isValid?fields:null;
			}

		}, template: `
	<div class="has-rtl">
	<div v-for="(field, idx) in fields" v-if="checkFieldDepends(field)">
		<div v-if="field.typename == 'button'" class="form-field"><button type="submit" class="button btn-link btn-link-title" :style="stylesheet(field)" :class="{'is-loading': isLoading}">{{field.title}}</button></div>
		<div v-else-if="field.typename == 'paragraph'" class="form-field form-field-paragraph" style="font-size:1.9em !important" v-html="prepareParagraph(field)" @click="clickParagraph"></div>
		<div v-else class="form-field" :class="{'has-error': errors && errors[idx]}">
			<div v-if="field.typename == 'checkbox'" class="checkbox-list">
				<label class="checkbox">
					<input type="checkbox" :checked="field.default" v-model="field.value" :required="field.required == 1" :disabled="disabled"> {{field.title}}<sup class="required" v-if="field.required">*</sup>
				</label>
				<div class="form-field-desc" v-if="field.text">{{field.text}}</div>
			</div>
			<label v-else class="label" :for="'fid'+idx">{{field.title}}<sup class="required" v-if="field.required == 1">*</sup></label>
			<div v-if="(field.typename != 'checkbox') && field.text" class="form-field-desc">{{field.text}}</div>
			
			<input v-if="['name', 'text', 'email', 'number', 'password'].indexOf(field.typename) != -1" :name="field.typename" :type="input_type(field)" :disabled="disabled" v-model="field.value" :required="field.required == 1" :id="'fid'+idx">
			<mx-phone v-if="field.typename == 'phone'" :name="field.typename" v-model="field.value" :disabled="disabled" :required="field.required == 1" :isValid.sync="field.valid" :id="'fid'+idx" :title="'Страна'|gettext"></mx-phone>
			<textarea v-if="field.typename == 'textarea'" rows="4" :disabled="disabled" v-model="field.value" :required="field.required == 1" :id="'fid'+idx"></textarea>
			
			<div class="select" v-if="field.typename == 'select'"><select v-model="field.value" :required="field.required == 1" :disabled="disabled || field.disabled" :style="selectStyle(field)">
				<option value="" v-if="field.nulltitle">{{field.nulltitle}}</option>
				<option value="" v-else>{{'-- Не выбрано --'|gettext}}</option>
				<option v-for="v in field.variants" :value="v.k">{{v.v}}</option>
			</select></div>
			
			<div class="select" v-if="field.typename == 'country'"><select disabled><option v-if="field.nulltitle">{{field.nulltitle}}</option><option v-else>{{'-- Не выбрано --'|gettext}}</option></select></div>
			
			<div v-if="field.typename == 'date'">
				<vue-frontend-components-datapicker v-model='field.value' :required="field.required == 1" :disabled="disabled || field.disabled" :id="'fid'+idx"></vue-frontend-components-datapicker>
			</div>

			<div v-if="field.typename == 'time'">
				<vue-frontend-components-clockpicker v-model="field.value" :disabled="disabled || field.disabled" hour-format="24" :id="'fid'+idx"></vue-frontend-components-clockpicker>
			</div>

			<div class="radio-list" v-if="field.typename == 'radio'">
			<label v-for="v in field.variants" class="radio is-block">
				<input type="radio" :value="v" :disabled="disabled" v-model="field.value" :required="field.required == 1" :name="'b{1}f{2}'|format(block_id, idx)"> {{v}}
			</label>
			</div>
			
			<p class="help is-danger" v-if="errors && errors[idx]">{{errors[idx]}}</p>
		</div>
	</div>

	<mx-modal :active.sync="isOpenAgreement" :has-modal-card="true">
    	<div class="modal-card has-text-black" style="font-size: 1rem">
        	<header class="modal-card-head"><p class="modal-card-title">{{'Юридическая информация'|gettext}}</p> <button type="button" class="modal-close is-large" @click="isOpenAgreement = false"></button></header>
            <section class="modal-card-body">
				<div class="border col-xs-12" v-if="isLoadingAgreement"><div class="loading-overlay loading-block is-active"><div class="loading-icon"></div></div></div>
				<div v-html="agreement"></div>
            </section>
			<div class="modal-card-foot">
				<button type="button" class="button is-dark" @click="isOpenAgreement = false">{{'Закрыть'|gettext}}</button>
			</div>	
        </div>
    </mx-modal>

	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-index", {data() {
			return {
				inited: false
			}
		},
		
		methods: {
			reduildStyles() {
				StylesFactory.updateCSSBlock(this.$account.styles, this.$refs.styles);
			}
		},
		
		mounted() {
		    this.reduildStyles();
		    this.inited = true;
		}, template: `
	<div class="is-flex-fullheight theme-main" :class="StylesFactory.getPageClasses($account.theme, $account)">
		<div ref='styles'></div>
		<div v-for="a in $account.theme.extended.items" v-html="a.html"></div>

		<router-view v-if="inited"></router-view>
		<vue-frontend-actionbar></vue-frontend-actionbar>
		
		<component v-bind:is="'vue-frontend-addons-'+w.name" v-for="w in $account.widgets" v-model="w.data"></component>
		<vue-frontend-blocks-html v-if="$account.html" :options='$account'></vue-frontend-blocks-html>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-loading-blocks", {data() {
			return {
				products: [0,1,2,3,4]
			}
		},
		
		props: ['blocks'],
		
		computed: {
			avatarLink() {
				return '/'+this.$account.nickname+((this.$account.products_avatar == 2)?'/m/':'');
			},
			
			avatarClassname() {
				return 'profile-avatar profile-avatar-'+this.$account.avatar_size;
			},
		}, template: `
	<div>
		<div class="block-item" v-for="name in blocks">
			<div class="block-item block-avatar" v-if="name == 'avatar'">
				<div class="has-text-centered"><div :class="avatarClassname" class="is-fetching-block"></div></div>
				<div class="has-text-centered text-avatar" v-if="!$account.is_avatar_hide_text"><p class="is-fetching-block">@{{$account.nickname}}</p></div>
			</div>
			
			<div class="block-item" v-if="name == 'picture'">
				<div class="block-slider-inner">
				<div class="slider slider-pictures">
					<div class="slider-inner">
						<div class="slider-slide"><div class="picture-container picture-cover is-fetching-block" style="padding-top: 100%"><div></div></div></div>
					</div>
				</div>
				</div>
			</div>
			
			<div class="block-item" v-if="name == 'title'">
				<h3><p class="is-fetching-block">Product title</p></h3>
			</div>
			
			<div class="block-item" v-if="name == 'link'">
				<div class="button btn-link active block-link is-fetching-block">Link</div>
			</div>
			
			
			<div class="row row-small" v-if="name == 'products'">
				<div class="col-xs-6 col-sm-4 item" v-for="p in products">
					<div class="product-container-outer">
						<div class="product-container is-fetching-block">
						</div>
						<div class="product-container-text">
							<i style="width: 50%"><p class="is-fetching-block" style="display: block">Title</p></i>
							<b style="width: 30%"><p class="is-fetching-block" style="display: block">0.00</p></b>
						</div>
					</div>
				</div>
			</div>

		</div>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-market-basket", {data() {
			return {
				step: 0,
				cart: null,
				fields: null,
				fields_footer: null,
				shipping: null,
				discounts: null,
				hasPromocodes: false,
				confirm: null,
				button: null,
				isFetching: false,
				contacts: {},
				errors: {},
				failed: null,
				isOpenPromocodeForm: false,
				isCheckingPromocode: false,
				promocode: '',
				errorPromocode: ''
			}
		},

		mounted() {
			if (window.data) {
				this.initData(window.data);
				delete window.data;
			} else {
				this.fetchData();
			}
		},

		activated() {
			this.step = 0;
			this.fetchData();
// 			window.$events.fire('setpage', this);
		},

		computed: {
			discountValue() {
				let sum = 0;
				let done = [];
				let order_discount = false;
				
				_.each(this.discounts, (d) => {
					if (order_discount) return;
					
					
					switch (d.profit) {
						case "free_shipping":
//							return 0;
							break;
						default:
							switch (d.profit_apply) {
								case "order":
									let precisionNumber = Math.pow(10, this.$account.currency.precision);
									let round = (v) => {
										return Math.round(v * precisionNumber) / precisionNumber;
									}
									
									if (d.profit == "percentage") {
										sum += _.sumBy(this.cart, (v, k) => {
											if (done.indexOf(v.id) == -1) {
												done.push(v.id);
												return v.amount * round((d.apply_options?v.price:v.price_offer)/100 * d.profit_value)
											} else {
												return 0;
											}
										});
									} else {
										if (d.profit_value) {
											sum = d.profit_value;
											order_discount = true;
										}
									}
									break;
								case "offers":
									let o = d.profit_offers;
									sum += _.sumBy(this.cart, (v, k) => {
										if ((o[v.id] != undefined) && (done.indexOf(v.id) == -1)) {
											done.push(v.id);
											return v.amount * Math.max(0, (d.apply_options?v.price:v.price_offer) - o[v.id]);
										} else {
											return 0;
										}
									});
									break;
							}
							break;
					}
				});
				
				return sum;
			},
			
			shippingPrice() {
				for (i in this.discounts) {
					let o = this.discounts[i];
					if (o.profit == 'free_shipping') return 0;
				}
				
				return this.confirm.shipping.price; 				
// 				return (this.discounts && this.discount.profit == 'free_shipping')?0:this.confirm.shipping.price;
			},
			
			avatarLink() {
				return {name: (this.$account.products.avatar == 2)?'catalog':'index'};
			},
			
			avatarClassname() {
				return 'profile-avatar profile-avatar-'+this.$account.avatar_size;
			},
			
			total_compare() {
				return _.sumBy(this.cart, (f) => { return ((f.price_compare && f.price_compare > 0 && f.price_compare > f.price)?f.price_compare:f.price) * f.amount; });
			},

			total() {
				return _.sumBy(this.cart, (f) => { return f.price * f.amount; });
			},
			
			title_zones() {
				return (this.shipping.title_zones != undefined && this.shipping.title_zones)?this.shipping.title_zones:this.$gettext('Другие страны');
			},
			
			isSelfservice() {
				return (this.fields.shipping_method.value != '') && (this.fields.shipping_method.value.indexOf('selfservice:') == 0);
			},
			
			userShipping() {
				return (this.shipping.amount_methods > 1 || (this.shipping.amount_methods == 1 && !this.shipping.use_zones));
			},
			
			isAllowAction() {
				switch (this.step) {
					case 0:
						return this.cart && this.cart.length && (_.sum(this.cart, 'is_active') == this.cart.length);
						break;
					case 1:
						return Object.keys(this.errors).length == 0 && this.failed == null;
						break;
					case 2:
						return true;
				}
			}
		},
		
		methods: {
			setStep(step) {
				this.errors = [];
				this.failed = null;
				this.step = step;
			},
			
			promocodeFilter(e) {
				let charCode = (e.which) ? e.which : e.keyCode;
				if (charCode == 13) return true;
				var txt = String.fromCharCode(charCode).toUpperCase();
				if(!txt.match(/[A-ZА-Яa-zа-я0-9\-_]/)) e.preventDefault();
			},
			
			promocodeFilterAfter(e) {
				this.promocode = this.promocode.toUpperCase().replace(/[^A-ZА-Я0-9\-_ ]/g, '').trim().replace(/ /g, '_');
			},
			
			openPromocodeForm() {
				this.isOpenPromocodeForm = true;
				setTimeout(() => {
					this.$refs.inputPromocode.focus();
				}, 600)
			},
			
			closePromocodeForm() {
				this.promocode = this.errorPromocode = '';
				this.isOpenPromocodeForm = false;
			},
			
			applyPromocode() {
				this.isCheckingPromocode = true;
				
				this.$api.get('market/checkout/promocode', {params: {promocode: this.promocode}}, this).then((r) => {
					if (r.result == 'success') {
						this.discounts = r.response.discounts;
						this.closePromocodeForm();
					} else {
						this.errorPromocode = r.fail;
						this.$nextTick(() => { this.$refs.inputPromocode.focus(); });
					}
					
					this.isCheckingPromocode = false;
				}).catch(() => {
					this.isCheckingPromocode = false;
				});
			},
			
			clearPromocode() {
				this.$api.get('market/checkout/clearpromocode').then((r) => {
					if (r.result == 'success') {
						this.discounts = r.response.discounts;
					}
				});
			},

			checkFieldDepends(field) {
				return (this.fields[field.depends_name] != undefined) && field.depends_value.indexOf(this.fields[field.depends_name].value) != -1;
			},
			
			fetchData() {
			    this.isFetching = true;
			    this.$api.get('market/checkout/basket', {}).then((r) => {
				    if (r.result == 'success') this.initData(r.response);
				    this.isFetching = false;
			    });
			},
			
			amountFilter(e) {
				let charCode = (e.which) ? e.which : e.keyCode;
				if (charCode < 48 || charCode > 57) e.preventDefault();
			},
			
			amountFilterCheck(f) {
				f.amount = (f.amount === '')?0:parseInt(f.amount);
			},
			
			amountBlur(f, k) {
				if (!f.amount) this.cart.splice(k, 1);
				this.updateCart();
			},
			
			amountChange(f, k, n) {
				f.amount += n;
				this.amountBlur(f, k);
			},
			
			updateCart() {
				this.$actionbar.info.basket.products = {};
				_.each(this.cart, (v) => {
					this.$actionbar.info.basket.products[v.id] = v.amount;
				})
				
				this.$actionbar.pack();
				this.updateDiscount();
			},
			
			updateDiscount: _.debounce(function() {
				this.$api.get('market/checkout/discount', {}).then((r) => {
					if (r.result == 'success') {
						this.discounts = r.response.discounts;
					}
				});
			}, 500),
			
			initData(v) {
				this.cart = _.map(v.cart, (f, k) => {
					f.id = k;
					f.link = {name: 'product', params: {product_id: f.product_id.toString(16)}};
					f.style = f.picture?('background-image:url(//'+this.$account.storage_domain+'/p/'+f.picture+')'):'';
					f.subtitles = (f.subtitles != undefined)?f.subtitles.join(', '):'';
					return f;
				});
				
				this.discounts = v.discounts;
				this.hasPromocodes = v.has_promocodes;
				
				window.$events.fire('setpage', this);
			},
			
			getFields() {
				let list = [this.$refs.fields1, this.$refs.fields2, this.$refs.fields3];

				let fields = {};

				if (this.shipping.is_active) {				
					if (!this.userShipping && this.shipping.use_zones) this.fields.shipping_method.value = 'zones';
	
					if (this.userShipping && !this.fields.shipping_method.value) {
						alert(this.$gettext("Необходимо выбрать метод доставки"));
						return;
					}
					
					if (this.fields.shipping_method != undefined) fields.shipping_method = {value: this.fields.shipping_method.value};
				}
				
				
				for (var i=0; i <= 2; i++) {
					if (list[i] == undefined) continue;
					let tmp = list[i].getFields();
					if (tmp) {
						fields = Object.assign(fields, tmp);
					} else {
						fields = null;
						break;
					}
				}
				
				return fields;
			},
			
			submitCheckout() {
				this.contacts = this.getFields();

				if (this.contacts) {
					this.isFetching = true;
					this.errors = [];
					this.failed = null;
					this.$api.post('market/checkout/confirm', {params: {fields: this.contacts}}).then((r) => {
						if (r.result == 'success') {
							this.confirm = r.response;
							this.button = r.response.button;
							this.step++;
						} else this.checkResult(r);
						this.isFetching = false;
					});
				}
			},
			
			action() {
				switch (this.step) {
					case 0:
						this.isFetching = true;
						this.errors = [];
						this.failed = null;
						this.$api.get('market/checkout/checkout', {}).then((r) => {
							if (r.result == 'success') {
								let v = r.response;
								this.fields = v.fields;
								this.fields_footer = v.fields_footer;
								this.shipping = v.shipping;
							} else this.checkResult(r);
							this.isFetching = false;
							this.step++;
						});
						break;
					case 1:		
						this.$refs.submit.click();
						break;
					case 2:
						this.isFetching = true;
						this.$api.post('market/checkout/pay', {params: {fields: this.contacts}}).then((r) => {
							if (r.redirect != undefined) {
								window.top.location = r.redirect;
							} else this.checkResult(r);
						});
						break;
				}
			},
			
			checkResult(r) {
				this.errors = r.errors || [];
				this.failed = r.failed || null;
				
				this.isFetching = false;
					
				if (r.result == 'empty') {
					this.$actionbar.init();
					this.$router.replace({name: 'catalog'});
				}
			}
		}, template: `
	<div class="page-container has-pt-3">
<!-- 		<div class="row"> -->
<!-- 		<div class="col-xs-12 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2"> -->
			
			<mx-modal :active.sync="isOpenPromocodeForm" :has-modal-card="true">
			<form @submit.prevent="applyPromocode">
	            <div class="modal-card modal-card-little">
		            <header class="modal-card-head"><p class="modal-card-title">{{'Активировать промокод'|gettext}}</p> <button type="button" class="modal-close is-large" @click="closePromocodeForm"></button></header>
		            <section class="modal-card-body has-text-black">
			            <div class="field" :class="{'has-error': errorPromocode}">
				            <input type="text" class="input is-large has-rtl" maxlength="16" @keypress="promocodeFilter" @change="promocodeFilterAfter" @keyup="promocodeFilterAfter" placeholder="PROMOCODE" v-model="promocode" :disabled="isCheckingPromocode" ref="inputPromocode">
				            <p class="help">{{errorPromocode}}</p>
			            </div>
		            </section>
					<div class="modal-card-foot">
						<button type="submit" class="button is-primary" :class="{'is-loading': isCheckingPromocode}">{{'Применить'|gettext}}</button>
					</div>	
	            </div>
			</form>
	        </mx-modal>
				
			<vue-frontend-blocks-avatar v-if="$account.products.avatar" :to="avatarLink" class="has-mb-2"></vue-frontend-blocks-avatar>
	
			<div class="field has-addons basket-breadcrumbs has-mb-3" data-toggle="buttons">
				<div class="control is-expanded" style="width: 33%"><label class="button is-fullwidth" :class="{active: step >= 0}" @click="setStep(0)"><i>{{'Корзина'|gettext}}</i></label></div>
				<div class="control is-expanded" style="width: 33%"><label class="button is-fullwidth" :class="{active: step >= 1, 'is-disabled': step < 1}" @click="setStep(1)"><i>{{'Контакты'|gettext}}</i></label></div>
				<div class="control is-expanded" style="width: 33%"><label class="button is-fullwidth" :class="{active: step >= 2, 'is-disabled': step < 2}"><i>{{'Подтверждение'|gettext}}</i></label></div>
			</div>
			
			<div class="message is-danger" style="font-size: 1.9em !important;" v-if="failed">
				<div class="message-body">{{failed}}</div>
			</div>
				
			<div class="block-item has-mb-2" v-if="step == 0">
	
			<div class="has-pt-2 has-pb-2" v-if="isFetching">
				<div class="loading-overlay loading-block is-active"><div class="loading-icon"></div></div>
			</div>
	
			<div v-else>
				<div class="block-panel has-p-2 block-text" v-if="!cart || cart.length == 0">  
					<div class="border-vertical has-text-centered">{{'Корзина пуста'|gettext}}</div>  
				</div>
				<div class="block-panel block-text has-rtl" v-else>
					
					<div class="row row-small products-cart has-p-2" v-for="(f, k) in cart">
						<div class="col-sm-1 col-xs-2 block-xs"><div class="has-text-centered" style="width:100%"><router-link :to="f.link" class="product-container-outer"><div class='product-container' :class="{'product-container-empty': !f.picture}" :style="f.style"></div></router-link></div></div>
						<div class="col-sm col-xs-10 block-xs"><router-link :to="f.link">{{f.title}}</router-link><div v-if="f.subtitles" style="font-size: 70%;color: #777">{{f.subtitles}}</div></div>
						
						<div class="col-sm-3 col-xs-5">
							<div class="field has-addons field-price" :class="{error: !f.is_active}">
							<span class="control"><button class="button is-light" @click="amountChange(f, k, -1)"><i class="fai fa-minus"></i></button></span>
							<span class="control"><input type='number' class="input skip-enter" v-model="f.amount" min="0" @keypress="amountFilter" @keyup="amountFilterCheck(f)" @blur="amountBlur(f, k)"></span>
							<span class="control"><button class="button is-light" @click="amountChange(f, k, 1)"><i class="fai fa-plus"></i></button></span>
							</div>
						</div>
						
						<div class="col-sm-2 col-md-3 col-lg-2 col-xs-7 has-text-nowrap has-text-right"><div class="has-text-right" style="width:100%;font-size: 1.2rem">
							<div class="has-text-grey-lighter" v-if="f.price_compare && f.price_compare > f.price" style="font-size: 70%;"><span class="strikethrough">{{f.price_compare*f.amount|currency}}</span></div>
							{{f.price*f.amount|currency}}
						</div></div>
					</div>
					
					<vue-frontend-market-discount @openPromocodeForm="openPromocodeForm" @clearPromocode="clearPromocode" :hasPromocodes="hasPromocodes" :discountValue="discountValue" :discounts="discounts"></vue-frontend-market-discount>
			
					
					<div class="row row-small products-cart has-p-2">
					<div class="col-md-3 col-lg-3 col-xs-5"><div class="text-xs-left" style="width:100%;">{{'Итого'|gettext}}:</div></div>
					<div class="col-md-9 col-lg-9 col-xs-7"><div class="has-text-right has-text-nowrap" style="width:100%;">
	<!-- 					<span class="has-text-grey-lighter" v-if="total_compare && total_compare > total" style="font-size: 70%;"><span class="strikethrough">{{total_compare|currency}}</span></span> -->
						{{total - discountValue|currency}}
					</div></div>
					</div>
				</div>		
			</div>
			</div>
			
			<div class="block-item has-mb-2" v-if="step == 1">
				<form @submit.prevent="submitCheckout" class="block-form has-rtl">
					<button type="submit" ref='submit' style="display: none"></button>
					
					<vue-frontend-form-elements :fields="fields" v-if="fields" ref='fields1' :is-loading="isFetching"></vue-frontend-form-elements>
					
					<div v-if="shipping && shipping.is_active">
						<div v-if="userShipping">
							
							<div class="form-field">
							<label class="label">{{'Доставка'|gettext}}<sup class="required">*</sup></label>
							<div class="radio-list">
								<label class="radio is-block" v-if="shipping.use_selfservice" v-for="(c, i) in shipping.shipping">
									<input type="radio" name="dvField" :value="'selfservice:{1}'|format(i)" v-model="fields.shipping_method.value" required='on' :disabled="isFetching"> {{'Самовывоз'|gettext}} <span v-if="c.full" style="opacity: .5;padding-left: 8px">({{c.full}})</span>
								</label>
									
								<label class="radio is-block" v-if="method.on" v-for="method in shipping.custom">
									<input type="radio" name="dvField" :value="method.value" v-model="fields.shipping_method.value" required='on' :disabled="isFetching"> {{method.title}} <span style="opacity: .5;padding-left: 8px">({{method.price|currency}})</span>
								</label>
		
								<label class="radio is-block" v-if="shipping.use_zones">
									<input type="radio" name="dvField" value="zones" v-model="fields.shipping_method.value" required='on' :disabled="isFetching"> {{title_zones}}
								</label>
							</div>
							</div>
						</div>
						
						
						<vue-frontend-form-elements ref='fields2' :errors="errors" :fields="shipping.fields" :checkDepends="checkFieldDepends" :is-loading="isFetching" v-if="!isSelfservice && fields.shipping_method.value"></vue-frontend-form-elements>
	
					</div>
				
					<vue-frontend-form-elements ref='fields3' :fields="fields_footer" v-if="fields_footer" :is-loading="isFetching"></vue-frontend-form-elements>
				
				</form>
			</div>	
				
			<div class="block-item has-mb-2" v-if="step == 2">
				<div class="block-panel block-text">
					<div class="row row-small products-cart has-p-2" v-for="(f, k) in cart">
						<div class="col-sm-1 col-xs-2 block-xs"><div class="has-text-centered" style="width:100%"><router-link :to="f.link" class="product-container-outer"><div class='product-container' :class="{'product-container-empty': !f.picture}" :style="f.style"></div></router-link></div></div>
						<div class="col-sm col-xs-10 block-xs"><router-link :to="f.link">{{f.title}}</router-link><div v-if="f.subtitles" style="font-size: 70%;color: #777">{{f.subtitles}}</div></div>
						
						<div class="col-sm-2 col-xs-5">
							{{f.amount|number}} {{'шт.'|gettext}}
						</div>
						
						<div class="col-sm-3 col-md-3 col-lg-2 col-xs-7 has-text-nowrap has-text-right"><div class="has-text-right" style="width:100%;font-size: 1.2rem">
							{{f.price*f.amount|currency}}
						</div></div>
					</div>
					
					<div class="row row-small products-cart has-p-2">
						<div class="col-sm-1 col-xs-2" style="line-height: 0"><div class="product-container fa fai fa-user"></div></div>
						<div class="col-sm col-xs-10">{{'Контакты'|gettext}}<div style="font-size: 70%;color: #777">{{confirm.contacts}}</div></div>
					</div>
	
					<div class="row row-small products-cart has-p-2" v-if="confirm.shipping.is_active">
						<div class="col-sm-1 col-xs-2" style="line-height: 0"><div class="product-container fa fai fa-truck"></div></div>
						<div class="col-sm col-xs-6">{{'Доставка'|gettext}}<div style="font-size: 70%;color: #777">{{confirm.shipping.details}}</div></div>
						<div class="col-sm-3 col-xs-4 has-text-nowrap has-text-right">
							{{shippingPrice|currency}}
						</div>
					</div>
					
					<vue-frontend-market-discount @openPromocodeForm="openPromocodeForm" @clearPromocode="clearPromocode" :hasPromocodes="hasPromocodes" :discountValue="discountValue" :discounts="discounts"></vue-frontend-market-discount>
	
					<div class="row products-cart has-p-2" style="border-top: 1px solid #eee">
					<div class="col-md-3 col-lg-3 col-xs-5"><div class="text-xs-left" style="width:100%;">{{'Итого'|gettext}}:</div></div>
					<div class="col-md-9 col-lg-9 col-xs-7"><div class="has-text-right has-text-nowrap" style="width:100%;">
						{{total+shippingPrice-discountValue|currency}}
					</div></div>
					</div>
					
				</div>
			</div>
					
		
<!-- 			<vue-frontend-blocks-html v-if="$account.html" :options='$account'></vue-frontend-blocks-html> -->
<!-- 		</div> -->
<!-- 		</div> -->
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-market-catalog", {data() {
			return {
				next: 0,
				fields: [],
				collections: [],
				isFetching: false,
				isFlowFetching: false,
				bottom: false,
				filters: {
					query: ''
				}
			}
		},
		
		mounted() {
			if (window.data) {
				this.clearData();
				this.initData(window.data);
				delete window.data;
				
				this.$nextTick(() => {
					if (this.bottomVisible() && this.next) this.fetchData(false, true);
				})
				
				this.checkGUI();
			} else {
				this.fetchData(true);
			}
						
			window.addEventListener('scroll', () => {
				this.bottom = this.bottomVisible()
			});
		},
		props: ['username', 'collection_id'],

		computed: {
			avatarLink() {
				return {name: (this.$account.products.avatar == 2)?'catalog':'index'};
// 				return '/'+this.$account.nickname+((this.$account.products.avatar == 2)?'/m/':'');
			},
			
			avatarClassname() {
				return 'profile-avatar profile-avatar-'+this.$account.avatar_size;
			}
		},
		
		watch: {
			bottom(bottom) {
				if (bottom && !this.isFlowFetching && this.next) this.fetchData(false, true);
			},
			
			collection_id(v) {
/*
				if (v) {
					router.push({ name: 'collection', params: { collection: v } })
				} else {
					router.push({ name: 'catalog' })
				}
*/
				
				this.clearData();
				this.fetchData();
			}
		},
		
		methods: {
			collectionLink(id) {
				return (id == '*' || id == undefined)?{name: 'catalog'}:{name: 'collection', params: {collection_id: id}};
			},
			
			bottomVisible() {
				const scrollY = window.scrollY;
				const visible = document.documentElement.clientHeight;
				const pageHeight = document.documentElement.scrollHeight;
				
/*
				const os = getGlobalOffset(o).top;//.offsetTop;
				const hg = o.offsetHeight;
				console.log(os+ " = " + (hg+os) + ' = ' + (visible+scrollY)+" = "+pageHeight );
				const bottomOfPage = (hg+os - 200 < visible+scrollY)
*/

				return (/* bottomOfPage || */ pageHeight < visible+scrollY+200) && scrollY
		    },
		    
		    onFilter: _.debounce(function() {
				this.clearData();
				this.fetchData();
			}, 700),
		    
		    prepareFields(fields) {
			    this.next = (fields.length)?fields[fields.length-1].column_id:0;
			    
			    return _.map((fields), (f) => {
					f.classname = 'product-container '+(!f.picture?'product-container-empty':('picture-'+this.$account.products.pictures_placement));
					f.stylesheet = f.picture?('background-image:url(//'+this.$account.storage_domain+'/p/'+f.picture+');background-color: '+this.$account.products.pictures_background):'';
					return f;
				});
		    },
		    
		    clearData() {
				this.fields = [];
				this.next = 0;
		    },
		    
		    initData(v) {
			    let t = this.prepareFields(v.fields);
				this.fields = this.fields.concat(t);
				v.collections.unshift({collection_id: '*', collection: this.$gettext('Все товары')});
				this.collections = v.collections;
			},
		    
		    fetchData(isFirst, isFlow) {
			    if (isFlow) {
					this.isFlowFetching = true;
				} else {
			    	this.isFetching = true;
			    }
			    
			    if (this.filters.query && (window.fbq != undefined)) fbq('track', 'Search', { search_string: this.filters.query });
			    
			    this.$api.get('market/products/list', {params: {collection_id: (this.collection_id)?parseInt(this.collection_id, 16):null, next: this.next, filters: this.filters}}).then((r) => {
					this.initData(r.response);
					
					this.isFetching = false;
					this.isFlowFetching = false;

					this.$nextTick(() => {
						if (this.bottomVisible() && this.next) this.fetchData(false, true);
						if (isFirst) this.checkGUI();
					})
			    })
/*

			    this.$http.get('products.json', {params: {next: this.next, filters: this.filters}, paramsSerializer: param}).then((r) => {
				   if (r.data.result == 'success') {
					   this.fields = this.fields.concat(this.prepareFields(r.data.response.fields));
				   }
				   this.isFetching = false;
			    })
*/
		    },
		    
		    checkGUI() {
			    this.$nextTick(() => {
				    if (this.$refs.collections != undefined && this.$account.products.collections_view == 'row') {
		    			let e = this.$refs.collections.querySelector('.in');
						let offet = e.offsetLeft;
						let width = this.$refs.scroll.width;
						this.$refs.scroll.scrollTo(offet - (width / 2) + e.offsetWidth / 2, 0);
					}
				});
		    }
		}, template: `
	<div class="page-container has-pt-3">
<!-- 	<div class="row"> -->
<!-- 		<div class="col-xs-12 col-sm-10 col-sm-offset-1 col-md-10 col-md-offset-1"> -->
			<vue-frontend-blocks-avatar v-if="$account.products.avatar" :to='avatarLink' class="has-mb-2"></vue-frontend-blocks-avatar>
			<div class="block-form form-field" v-if="$account.products.show_search">
				<input type="search" inputmode="search" :placeholder="'Поиск по названию'|gettext" v-model="filters.query" @input="onFilter" class="has-rtl">
			</div>
			
			<div v-if="$account.products.show_filter && (collections.length > 1)">
				
				<div class="block-form form-field" v-if="$account.products.collections_view == 'dropdown'">
					<div class="select is-fullwidth">
					<select v-model="collection_id" @change="router.push(collectionLink(collection_id))">
						<option :value="undefined">-- {{'Все товары'|gettext}} --</option>
						<option v-for="c in collections" :value="c.collection_id" v-if="c.collection_id != '*'">{{c.collection}}</option>
					</select>
					</div>
				</div>
				
				<vue-frontend-vbar v-if="$account.products.collections_view == 'row'" class="collection-bar has-mb-2" ref='scroll' shadow="horizontal" :shadow-color="$account.theme.bg.color1">
					<div class="collection-list" ref='collections'>
						<router-link :to="collectionLink(c.collection_id)" v-for="c in collections" class="collection-item button" :class="{in: c.collection_id == collection_id || ((c.collection_id == '*') && !collection_id)}">{{c.collection}}</router-link>
					</div>
				</vue-frontend-vbar>
			</div>
			
			<vue-frontend-loading-blocks :blocks="['products']" v-if="isFetching"></vue-frontend-loading-blocks>

			<div class="row row-small" ref="products">
				
<!-- 			href="/{$account.nickname}/o/{$f.product_id|@dechex}/" -->
				<div v-for="f in fields" class="col-xs-6 col-sm-4 item">
					<router-link :to="{name: 'product', params: {product_id: f.product_id.toString(16)}}" class="product-container-outer">
						<div :class='f.classname' :style="f.stylesheet">
						<dl v-if="$account.products.show_snippet_overlay && ($account.products.show_snippet_title || $account.products.show_snippet_price)">
							<dt v-if="$account.products.show_snippet_title">{{f.title}}</dt>
							<dt v-else></dt>
							<dd v-if="$account.products.show_snippet_price"><span v-if="$account.products.show_snippet_compare_price && f.price_compare" class="strikethrough" style="font-size: 70%;opacity: .4">&nbsp;{{f.price_compare|currency}}&nbsp;</span> {{f.price|currency}}</dd>
						</dl>
						</div>
						<div v-if="!$account.products.show_snippet_overlay && ($account.products.show_snippet_title || $account.products.show_snippet_price)" class="product-container-text has-rtl"><i v-if="$account.products.show_snippet_title">{{f.title}}</i><b v-if="$account.products.show_snippet_price">{{f.price|currency}} <span v-if="$account.products.show_snippet_compare_price && f.price_compare" class="is-price strikethrough" style="font-size: 70%;opacity: .5">&nbsp;{{f.price_compare|currency}}&nbsp;</span></b></div>
					</router-link>
				</div>
			</div>
			
			<div class="block-item has-mb-2" v-if="!fields.length && !this.isFetching">
				<div class="block-field has-text-centered has-mt-2" style="font-size:2.2em !important;opacity: .5">
					{{'В магазине пока отсутствуют товары'|gettext}}
				</div>
			</div>
			
			
			<div class="border col-xs-12" v-if="isFlowFetching"><div class="loading-overlay loading-block is-active"><div class="loading-icon"></div></div></div>
			
<!-- 			<vue-frontend-blocks-html v-if="$account.html" :options='$account'></vue-frontend-blocks-html> -->
<!-- 		</div> -->
<!-- 	</div> -->

	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-market-discount", {props: ['hasPromocodes', 'discountValue', 'discounts'],
		
		computed: {
			promocode() {
				let v = null;
				for (i in this.discounts) {
					let o = this.discounts[i];
					if (o.promocode) {
						v = o.promocode;
						break;
					}
				}
				
				return v; 
			}
		}, template: `
	<transition name="fade">
	<div class="row row-small products-cart has-p-2" v-if="hasPromocodes || discountValue">
		<div class="col-sm-1 col-xs-2" style="line-height: 0"><div class="product-container fa fai fa-badge-percent"></div></div>
		<div class="col-sm col-xs-6">
			<span v-if="discountValue && !promocode">{{'Скидка'|gettext}}</span>
			<span v-else>{{'Промокод'|gettext}}</span>
			
			<div style="font-size: 70%;color: #777" v-if="hasPromocodes">
				<div class="tags has-addons" v-if="promocode"><span class="tag">{{promocode}}</span><a role="button"tabindex="0" class="tag is-delete" @click="$emit('clearPromocode')"></a></div>
				<a v-else style="text-decoration: underline;color: #7a7a7a !important" @click="$emit('openPromocodeForm')">{{'Активировать промокод'|gettext}}</a>
			</div>
		</div>
		<div class="col-sm-3 col-xs-4 has-text-nowrap has-text-right">
			<transition name="fade">
				<span v-if="discountValue">-&nbsp;{{discountValue|currency}}</span>
			</transition>
		</div>
	</div>
	</transition>
`});

window.$app.defineComponent("frontend", "vue-frontend-market-product", {data() {
			return {
				blocks: [],
				product: [],
				variants: [],
				variants_offers: [],
				variants_value: '',
				options_selected: [],
				options: [],
				min_price: 0,
				max_price: 0,
				offers_checked: {},
				
				isFetching: false
			}
		},
		
		props: ['product_id'],

		mounted() {
			if (window.data) {
				this.initData(window.data);
				delete window.data;
			} else {
				this.fetchData();
			}
		},
		
		activated() {
			this.clearForm();
			window.$events.fire('setpage', this);
		},
		
		computed: {
			variantsAll() {
				return _.size(this.variants_offers) == 0;
			},
			
			avatarLink() {
				return {name: (this.$account.products.avatar == 2)?'catalog':'index'};
//				return '/'+this.$account.nickname+((this.$account.products.avatar == 2)?'/m/':'');
			},
			
			avatarClassname() {
				return 'profile-avatar profile-avatar-'+this.$account.avatar_size;
			},
			
			price_html() {
				if (this.variants_offers.length == 0) return this.$currency(this.product.price);
				return (this.variants_offers[this.variants_value] != undefined)?this.$currency(this.variants_offers[this.variants_value].price):(((this.min_price == this.max_price)?'':(this.$currency(this.min_price)+'<span style="opacity:.5;" class="is-text">&nbsp;—&nbsp;</span>')) + this.$currency(this.max_price));
			},

			price() {
				if (this.variants_offers.length == 0) return this.product.price;
				return (this.variants_offers[this.variants_value] != undefined)?this.variants_offers[this.variants_value].price:((this.min_price == this.max_price)?this.max_price:null);
			},
			
			price_compare() {
				if (!this.product.price_compare) return null;
				if (this.variants_offers.length == 0) return (this.product.price_compare > this.product.price)?this.product.price_compare:null;
				return (this.variants_offers[this.variants_value] != undefined)?((this.variants_offers[this.variants_value].price < this.product.price_compare)?this.product.price_compare:null):this.product.price_compare;
			},
			
			offer_id() {
				if (this.variants_offers.length == 0 && !this.variants.length) return this.product.offer_id;
				
				if (_.size(this.variants_offers)) {
					return (this.variants_offers[this.variants_value] != undefined)?this.variants_offers[this.variants_value].offer_id:0;
				} else {
					let isAllow = true;
					_.each(this.variants, v => isAllow &= (v.value !== ''));
					return isAllow?(this.product.offer_id+'#'+this.variants_value):null;
				}
			}
		},
		
		watch: {
			product_id() {
				this.fetchData();
			}
		},

		methods: {
			prepareHTML(html) {
				let s = html?html.toString()
					.replace(/(\s)([a-zA-Zа-яА-Я0-9\.\-\_\-]+@[0-9A-Za-z][0-9A-Za-zА-Яа-я\-\.]*\.[A-Za-zА-Яа-я]*)/g, '$1<a href="mailto:$2" target="_blank" class="link">$2</a>')
					.replace(/(\s)(http|https|ftp|ftps|tel)\:\/\/([а-яА-Яa-zA-Z0-9\-\.]+\.[а-яА-Яa-zA-Z]{2,})(\/[^\s"']*)?/g, '$1<a href="$2://$3$4" target="_blank" class="link">$2://$3$4</a>'):'';
				
				return this.$nl2br(s);
			},
			clearForm() {
				_.each(this.variants, (v) => { v.value = ""; });
				this.changeVariant();
				this.options_selected = [];
			},

			urlPicture(item) {
				return 'background-image:url(//'+this.$account.storage_domain+'/p/'+item+';background-color: '+this.product.products_pictures_background+';padding-top:100%';
			},
			
			fetchData() {
			    this.isFetching = true;
			    this.$api.get('market/products/get', {params: {product_id: parseInt(this.product_id, 16)}}).then((r) => {
				    if (r.result == 'success') this.initData(r.response);
				    this.isFetching = false;
			    });
			},
						
			changeVariant() {
				this.variants_value = _.map(this.variants, (v) => {
					return v.variant_id+':'+v.value;
				}).join(':');

				// Скрываем другие варианты
				this.offers_checked = {};

				if (this.variantsAll) return;

				_.each(this.variants, (f, u) => {
					let mask = [];
					
					_.each(this.variants, (v) => {
						if (v.variant_id == f.variant_id) {
							mask.push(v.variant_id+':[0-9]+');
						} else {
							mask.push(v.variant_id+':'+((v.value !== '')?v.value:'[0-9]+'));
						}
					});
					
					mask = new RegExp(mask.join(':'), 'i');
					
					for (i in this.variants_offers) {
						if (mask.test(i)) {
							var v = i.split(':');
							for (j=0; j < v.length; j++) {
								let u = parseInt(v[j]);
								let t = parseInt(v[j+1]);

								if (f.variant_id == v[j]) {
									if (this.offers_checked[u] == undefined) this.offers_checked[u] = [];
									if (this.offers_checked[u].indexOf(t) == -1) this.offers_checked[u].push(t);
								}
								j++;
							}
						}
					}
				});
			},
			
			initData(v) {
				this.blocks = v.blocks;
				this.product = v.product;
				this.variants = v.variants;
				this.variants_offers = v.variants_offers;
				this.options = v.options;
				this.offers_checked = {};
				this.options_selected = [];
				
				this.variants_value = '';
				this.min_price = Number.MAX_SAFE_INTEGER;
				this.max_price = 0;
				
				if (_.size(this.variants_offers)) {
					var variants = {};
					_.each(this.variants_offers, (f, k) => {
						this.min_price = Math.min(this.min_price, f.price);
						this.max_price = Math.max(this.max_price, f.price);
						let tmp = k.split(':');
						for (i = 0; i < tmp.length; i += 2) {
							if (variants[tmp[i]] == undefined) variants[tmp[i]] = {};
							variants[tmp[i]][parseInt(tmp[i+1])] = true;
						}
					});
					
					
					// Убираем опции которых нет
					_.each(this.variants, (w) => {
						this.$set(w, 'value', '');
						let is_allow = true;
						
						w.variant_values = _.filter(_.map(w.variant_values, (v, i) => {
							if (v != '' && variants[w.variant_id][i] == undefined) {
								return false;
							} else {
								return {k: parseInt(i), v: v};
							}
						}));
					});
				} else {
					_.each(this.variants, (w) => {
						this.$set(w, 'value', '');
						w.variant_values = _.map(w.variant_values, (v, i) => { return {k: parseInt(i), v: v} });
					});
				}
				
				window.$events.fire('setpage', this);
				
				let price = (this.price != null)?this.price:this.min_price;
				
				// facebook pixel
				let contents = [{
					id: parseInt(this.product_id, 16),
					quantity: 1,
					item_price: price
				}];
				
				window.$events.fire('viewProduct', {
					value: price,
					currency: this.$account.currency.code,
					content_type: 'product',
					contents: contents,
				});
				
				this.changeVariant();
			},
			
			setVariant(f, v) {
				f.value = (f.value === v.k)?'':v.k;
				this.changeVariant();
			}
		}, template: `
	<div class="page-container has-pt-3 has-mb-2">
<!-- 		<div class="row has-mb-2"> -->
<!-- 		<div class="col-xs-12 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2"> -->
			
			<vue-frontend-loading-blocks :blocks="['avatar', 'picture', 'title']" v-if="isFetching"></vue-frontend-loading-blocks>

			<div v-for="block in blocks" v-else>
				<div class="block-item" v-if="block">

				<vue-frontend-blocks-avatar v-if="$account.products.avatar && block == 'avatar'" :to="avatarLink" class="has-mb-2"></vue-frontend-blocks-avatar>
				
				<div class="block-slider has-mb-2" v-if="block == 'media'">
					<div class="block-slider-inner">
					<div style="transform: translate(0, 0)" v-if="product.pictures.length"> <!-- margin:0 -1rem; -->
					<div class="slider slider-pictures is-clipped" data-allow-zoom="true">
						<div class="slider-inner">
							<div class="slider-slide" v-for="(f, i) in product.pictures" :class="{active: i == i}"><div :class="'picture-container product-container picture-{1}'|format(product.products_pictures_placement)" :style="urlPicture(f)"><div></div></div></div>
						</div>
						
						<div class="slider-nav" :class="{'is-hidden': product.pictures.length == 1}">
							<div class="slider-dot" :class="{active: i == 0}" v-for="(f, i) in product.pictures"></div>
						</div>
					</div>
					</div>
					</div>
				</div>
				
				<h2 v-if="block == 'title'" class="has-mb-1 has-rtl">{{product.title}}</h2>
				<h4 v-if="block == 'title'" class="has-mb-2 has-rtl">
					<span class="is-price" v-html="price_html"></span>
					<s class="has-ml-1" style="font-size: 70%;opacity:.5" v-if="price_compare && (price < price_compare)">&nbsp;{{price_compare|currency}}&nbsp;</s>
				</h4>

				<div class="block-text has-mb-2 has-rtl" v-if="block == 'description'" v-html="prepareHTML(product.description)"></div>
				
				<div v-if="block == 'offers' && (_.size(variants) || _.size(options))" class="has-mb-2">
				<div class="block-form">
					<div class="form-field" v-for="f in variants">
						<label class="label has-text-weight-semibold">{{f.variant_title}}</label>
						<component v-bind:is="($account.products.variants_view == 'row')?'vue-frontend-vbar':'div'" class="has-mb-2 collection-bar" :class="{'is-multiline': $account.products.variants_view == 'tags'}" ref='scroll' shadow="horizontal" :shadow-color="$account.theme.bg.color1" v-if="$account.products.variants_view != 'dropdown'">
						<div class="collection-list">
							<a class="button" v-for="v in f.variant_values" @click="setVariant(f, v)" :class="{in: v.k === f.value, disabled: (!variantsAll && (offers_checked[f.variant_id] == undefined || offers_checked[f.variant_id].indexOf(v.k) == -1))}">{{v.v}}</a>
						</div>
						</component>
						

						<div class="select" v-if="$account.products.variants_view == 'dropdown'"><select @change="changeVariant" v-model="f.value" :class="{'has-text-grey': f.value === ''}"><option value="">{{'-- Не выбрано --'|gettext}}</option>
						<option :value="v.k" v-for="v in f.variant_values" :disabled="!variantsAll && (offers_checked[f.variant_id] == undefined || offers_checked[f.variant_id].indexOf(v.k) == -1)">{{v.v}}</option>
						</select></div>

					</div>
				
					<div v-if="_.size(options)">
						<div class="block-text has-mb-2" v-if="product.products_description_before_options" v-html="prepareHTML(product.products_description_before_options)"></div>
						<div class="form-field">
						<div class="checkbox-list" id='productOptions' v-for="options">
							<label class="is-block checkbox" v-for="(f, option_id) in options">
								<input type="checkbox" :value="option_id" v-model="options_selected"> {{f.title}} <span style="opacity:.5">(<span v-if="f.price > 0">+</span>{{f.price|currency}})</span>
							</label>
						</div>
						</div>
					</div>
				
				</div>
				</div>
				</div>
			</div>
		
<!-- 			<vue-frontend-blocks-html v-if="$account.html" :options='$account'></vue-frontend-blocks-html> -->
<!-- 		</div> -->
<!-- 		</div> -->
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-page", {data() {
			return {
				showBlockedMessage: false,
				isWizard: false,
				wizzardClasses: '',
				fields: [],
				options: {},
				isFetching: false
			}
		},
		
		props: ['page_id', 'part'],

		created() {
			if (window.data) {
				this.fields = BlocksFactory.checkFields(window.data.fields);
				this.options = window.data.options;
				this.isWizard = (window.data.is_wizard == undefined)?false:window.data.is_wizard; 
				if (window.data.stat != undefined) $events.fire('hit', {hash: window.data.stat, tz: this.$account.utc_timezone});
				delete window.data;
			} else {
				this.fetchData();
			}
		},
		
		mounted() {
			this.prepareStyles();
		},

		watch: {
			page_id(v) {
				this.fields = [];
				this.fetchData();
			}
		},
		
		computed: {
			foundBlocked() {
				for (let i = 0; i < this.fields.length; i++) for (let j = 0; j < this.fields[i].items.length; j++) if (!this.$auth.isAllowTariff(this.fields[i].items[j].tariff)) return true;
				return false;
			},
			
			pageClasses() {
				let r = [];
				if (this.options) {
					if (this.options.max_width != undefined) r.push('max-page-container-'+this.options.max_width);
					if (this.options.valign != undefined) r.push('page-valign-'+this.options.valign);
				}
				return r;
			}
		},
		
		methods: {
			prepareStyles() {
				let styles = {};
				_.each(this.fields, (f, i) => {

					//this.$account.theme.sections[f.id]
					if (f.section) {
						if (f.section && f.section.bg && f.section.bg.picture) f.section.bg.picture.link = '//'+Vue.prototype.$account.storage_domain+'/p/'+f.section.bg.picture.filename+'?'+f.section.bg.picture.version;
						
						let s = StylesFactory.getDefaultSection(this.$account.theme);
						
						let section = _.merge((f.section.id && this.$account.theme.sections != undefined && this.$account.theme.sections[f.section.id] != undefined)?_.merge(s, this.$account.theme.sections[f.section.id], true):s, f.section, true);
						StylesFactory.prepareSectionStyles(section, i, this.$account.theme, styles);
					}
					
					_.each(f.items, (b) => {
						if (b.options != undefined) StylesFactory.prepareStyles(b.block_id, b.block_type_name, b.options, styles);
					})
				})
				
				StylesFactory.updateCSSBlock(styles, this.$refs.styles);
			},
			
			wizardClick() {
				if (this.isWizard) {
					this.wizzardClasses = 'shake animated';
					
					setTimeout(() => {
						this.wizzardClasses = '';
					}, 1000);	
				}
			},
			
			checkTariff(tariff) {
				if (!this.$auth.isAllowTariff(tariff)) this.showBlockedMessage = true;
			},
			
			fetchData() {
				if (!this.fields.length) this.isFetching = true;
				let t = setTimeout(() => { this.isFetching = true; }, 350);
				
				this.$api.get('page/get', {params: { part: this.part, page_id: this.page_id?parseInt(this.page_id, 16):null }}).then((r) => {
					clearTimeout(t);
					
					if (r.redirect != undefined) {
						this.$router.replace(r.redirect);
					} else {
						this.fields = BlocksFactory.checkFields(r.response.fields);
						this.options = r.response.options;
						
						window.hasAvatar = false;
						_.each(this.fields, b => {
							_.each(b.items, f => {
								window.hasAvatar |= f.block_type_name == 'avatar';
							});
						});
						
						this.prepareStyles();
						$events.fire('hit', {hash: r.response.stat, tz: this.$account.utc_timezone});
					}
					this.isFetching = false;
				});
			},
			
			loadEntry(name) {
				name = 'vue-frontend-blocks-'+name;
				window.$app.loadComponent(name);
				return name;
			},
		}, template: `
	<div class="is-flex-fullheight" :class="pageClasses">
		<div ref='styles'></div>

		<a class="header-banner lock-footer has-background-black" v-if="!$account.has_nickname && $account.allow_by_session && !$account.allow_by_token" style="position: inherit" target="_blank" :href="'https://'+this.$account.domain+'/profile/pages/#publish'"> 
			<div class="container has-mb-2 has-mt-2 is-text-centered" style="justify-content: center">{{'Страница недоступна для просмотра всем. Для решения этой проблемы вам необходимо подключить профиль или доменное имя'|gettext}}</div> 
		</a>

<!--
		<div class="header-banner header-banner-button header-banner-static has-background-black" style="visibility: hidden" v-if="isWizard">
			<div class="container has-mb-2 has-mt-2">
				<div>{{'На основе описания вашего профиля мы подготовили пример страницы'|gettext}}</div>
				<button class="button is-clear">{{'Редактировать страницу'|gettext}}</button>
			</div>
		</div>
		<div class="header-banner header-banner-button has-background-black" v-if="isWizard">
			<div class="container has-mb-2 has-mt-2">
				<div>{{'На основе описания вашего профиля мы подготовили пример страницы'|gettext}}</div>
				<a class="button is-clear" href="/login/instagram/" rel="noopener" :class="wizzardClasses">{{'Редактировать страницу'|gettext}}</a>
			</div>
		</div>
-->
			
		<div class="is-flex-fullheight" :class="{'wizard-container-example': isWizard}" @click="wizardClick">
			<div class="page-container block-item has-pb-1 has-pt-3" style="max-width: 1080px" v-if="isFetching">
<!-- 				<div class="row"> -->
<!-- 					<div class="col-xs-12 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2"> -->
						<vue-frontend-loading-blocks :blocks="['avatar', 'link', 'link', 'link']"></vue-frontend-loading-blocks>
<!-- 					</div> -->
<!-- 				</div> -->
			</div>
			<div class="is-flex-fullheight" v-else>
				<div class="container has-mt-3" v-if="$account.lock_message">
					<div class="message is-danger block-text has-text-centered"><div class="message-body">{{$account.lock_message}}</div></div>
				</div>
				
				<main class="is-flex-fullheight">
				<div v-for="(p, j) in fields" class="blocks-section" :class="[p.section?('has-s s-'+j):null, (fields[j+1] != undefined && fields[j+1].section)?('has-next-s'):null]">
					<div>
					<div class="page-container">
<!-- 					<div class="row"> -->
<!-- 						<div class="col-xs-12 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2"> -->
							<div class="section-main">
								<div>
									<div>
		<!-- 						'-webkit-transform-style': (f.block_type_name == 'pictures')?'preserve-3d':'', -->
									<!-- 		block-item has-pb-1 has-pt-1 -->
									<div class="block-item" v-for="(f, i) in p.items" :key="i" :class="{'block-item-locked': !$auth.isAllowTariff(f.tariff)}" :style="{transform: (f.block_type_name == 'pictures')?'translate(0, 0)':''}" @click="checkTariff(f.tariff)">
		<!-- 									<div class="row"> -->
										<div :class="'b-'+f.block_id">
											<component v-bind:is="loadEntry(f.block_type_name)" :options="f.options" :block_id="f.block_id" :block="f" :section="p.section" :index="i" :page_id="page_id" :class="'block-{1}'|format(f.block_type_name)" @refreshPage="fetchData"></component>
										</div>
		<!-- 									</div> -->
									</div>
									
									<vue-frontend-brandlink v-if="j == fields.length - 1"></vue-frontend-brandlink>
<!-- 									<vue-frontend-blocks-html v-if="(j == fields.length - 1) && $account.html" :options='$account'></vue-frontend-blocks-html> -->
									</div>
								</div>
							</div>
<!-- 						</div> -->
<!-- 					</div> -->
					</div>
					</div>
				</div>
				</main>
			</div>
		</div>
		
		<div class="footer-banner lock-footer has-background-black has-close" :class="{'is-closed': !showBlockedMessage}" @click="showBlockedMessage = false" v-if="foundBlocked"> 
			<div class="container has-mb-2 has-mt-2">{{'К сожалению эта функция была заблокирована, так как владелец страницы своевременно не оплатил ее. Если вас не затруднит, сообщите владельцу страницы о данной проблеме'|gettext}}</div> 
		</div>
	</div>
`});

window.$app.defineComponent("frontend", "vue-frontend-vbar", {data: () => ({
	        dragging: {
	            enable: false,
	            axis: '',
	            offset: ''
	        },
	        bars: {
	            horizontal: {
	                elm: '',
	                parent: '',
	                size: 0
	            },
	            vertical: {
	                elm: '',
	                parent: '',
	                size: 0
	            }
	        },
	        wrapperObj: {
	            elm: '',
	            scrollHeight: '',
	            scrollWidth: '',
	            scrollLeft: '',
	            scrollTop: ''
	        },
	        container: {
	            elm: '',
	            scrollHeight: '',
	            scrollWidth: ''
	        }
	    }),
	    mounted () {
	        addResizeListener(this.$refs.container, this.resize)
	        addResizeListener(this.$refs.wrapperRef.children[0], this.resize)
	        document.addEventListener('mousemove', this.onDrag)
	        document.addEventListener('touchmove', this.onDrag)
	        document.addEventListener('mouseup', this.stopDrag)
	        document.addEventListener('touchend', this.stopDrag)
	        this.getSizes()
	    },
	    beforeDestroy () {
	        removeResizeListener(this.$refs.container, this.resize)
	        removeResizeListener(this.$refs.wrapperRef.children[0], this.resize)
	        document.removeEventListener('mousemove', this.onDrag)
	        document.removeEventListener('touchmove', this.onDrag)
	        document.removeEventListener('mouseup', this.stopDrag)
	        document.removeEventListener('touchend', this.stopDrag)
	    },
	    computed: {
	        propWrapperSize () {
	            return this.wrapper ? this.wrapper : ''
	        },
	        propBarVertical () {
	            return this.vBar ? this.vBar : ''
	        },
	        propBarInternalVertical () {
	            return this.vBarInternal ? this.vBarInternal : ''
	        },
	        propBarHorizontal () {
	            return this.hBar ? this.hBar : ''
	        },
	        propBarInternalHorizontal () {
	            return this.hBarInternal ? this.hBarInternal : ''
	        },
	        barSizeVertical () {
	            if (this.bars.horizontal.size && this.bars.vertical.size) {
	                return {
	                    height: 'calc(100% - 16px)'
	                }
	            }
	        },
	        barSizeHorizontal () {
	            if (this.bars.horizontal.size && this.bars.vertical.size) {
	                return {
	                    width: 'calc(100% - 16px)'
	                }
	            }
	        },
	        barInternalVertical () {
	            let barTop = this.getBarInternal('Y')
	            return {
	                height: this.bars.vertical.size + 'px',
	                top: barTop + 'px'
	            }
	        },
	        barInternalHorizontal () {
	            let barLeft = this.getBarInternal('X')
	            return {
	                width: this.bars.horizontal.size + 'px',
	                left: barLeft + 'px'
	            }
	        },
	        validationScrolls () {
	            if (!this.bars.horizontal.size) {
	                return 'overflowX: hidden'
	            }
	            if (!this.bars.vertical.size) {
	                return 'overflowY: hidden'
	            }
	        },
	        width() {
		        let b = this.$refs.wrapperRef.getBoundingClientRect();
		        return b.width;
	        }
	    },

		methods: {
		    shadowStyle(pl) {
				return 'background: linear-gradient(to '+((pl == 'start')?'right':'left')+', '+this.shadowColor+' 0%, '+this.shadowColor+'00 100%)'
// 				return 'background: -webkit-linear-gradient('+((pl == 'start')?0:180)+'deg, '+this.shadowColor+' 0%, transparent 100%);';
		    },
	        scroll (e) {
	            const Y = 0,
	                X = 0
	            // let Y = e.layerX
	            //     ? e.layerX
	            //     : e.changedTouches
	            //     ? e.changedTouches[0].clientX * -1
	            //     : '',
	            //     X = e.layerY
	            //     ? e.layerY
	            //     : e.changedTouches
	            //     ? e.changedTouches[0].clientY * -1
	            //     : ''
	            this.getSizes(X, Y)
	        },
	        resize () {
	            this.getSizes()
	        },
	        getBarInternal (axis) {
	            let internalSize,
	                positionWrapper,
	                sizeWrapper,
	                sizeBar,
	                sizeContainer,
	                regulatorSize
	            if (this.bars.horizontal.size && this.bars.vertical.size) {
	                regulatorSize = 40
	            } else {
	                regulatorSize = 0 /* 32 */
	            }
	            if (axis === 'X') {
	                positionWrapper = this.wrapperObj.scrollLeft
	                sizeWrapper = this.wrapperObj.scrollWidth
	                sizeBar = this.bars.horizontal.size + regulatorSize
	                sizeContainer = this.container.scrollWidth
	            } else if (axis === 'Y') {
	                positionWrapper = this.wrapperObj.scrollTop
	                sizeWrapper = this.wrapperObj.scrollHeight
	                sizeBar = this.bars.vertical.size + regulatorSize
	                sizeContainer = this.container.scrollHeight
	            }
	            internalSize = (positionWrapper / (sizeWrapper - (sizeContainer))) * (sizeContainer - sizeBar)
	            return internalSize
	        },
	        getCoordinates (e, axis) {
	            let coordinate,
	                sizeWrapper,
	                sizeBar,
	                sizeContainer,
	                offsetContainer,
	                clientDirection
	            if (axis === 'X') {
	                sizeWrapper = this.wrapperObj.scrollWidth
	                sizeBar = this.bars.horizontal.size
	                sizeContainer = this.container.scrollWidth
	                offsetContainer = this.container.elm.offsetLeft
	                clientDirection = e.clientX - this.dragging.offset
	            } else if (axis === 'Y') {
	                sizeWrapper = this.wrapperObj.scrollHeight
	                sizeBar = this.bars.vertical.size
	                sizeContainer = this.container.scrollHeight
	                offsetContainer = this.container.elm.offsetTop - (this.bars.vertical.size * 1.4)
	                clientDirection = e.clientY - this.dragging.offset
	            }
	            coordinate = ((sizeWrapper - sizeContainer) * (clientDirection - offsetContainer)) / (sizeContainer - sizeBar)
	            return coordinate
	        },
	        startDrag (e) {
	            e.preventDefault()
	            e.stopPropagation()
	            e = e.changedTouches ? e.changedTouches[0] : e
	            const axis = e.target.getAttribute('data-axis'),
	                dataDrag = e.target.getAttribute('data-drag-source')
	            let offset,
	                elementOffset
	            if (axis === 'Y') {
	                if (dataDrag === 'bar') {
	                    elementOffset = e.explicitOriginalTarget.offsetTop + (this.bars.vertical.size * 1.4)
	                } else if (dataDrag === 'internal') {
	                    elementOffset = e.clientY - this.bars.vertical.elm.offsetTop
	                }
	            } else if (axis === 'X') {
	                if (dataDrag === 'bar') {
	                    elementOffset = e.explicitOriginalTarget.offsetLeft + (this.bars.horizontal.size * 1.4)
	                } else if (dataDrag === 'internal') {
	                    elementOffset = e.clientX - this.bars.horizontal.elm.offsetLeft
	                }
	            }
	            offset = elementOffset
	            this.dragging = {
	                enable: true,
	                axis: axis,
	                offset: offset
	            }
	        },
	        scrollTo(x, y) {
                const wrapper = this.$refs.wrapperRef;
                wrapper.scrollLeft = x;
                wrapper.scrollTop = y;
                this.getSizes();
	        },
	        onDrag (e) {
	            if (this.dragging.enable) {
	                e.preventDefault()
	                e.stopPropagation()
	                e = e.changedTouches ? e.changedTouches[0] : e
	                const wrapper = this.$refs.wrapperRef
	                if (this.dragging.axis === 'X') {
	                    wrapper.scrollLeft = this.getCoordinates(e, 'X')
	                } else if (this.dragging.axis === 'Y') {
	                    wrapper.scrollTop = this.getCoordinates(e, 'Y')
	                }
	                this.getSizes()
	            }
	        },
	        stopDrag (e) {
	            if (this.dragging.enable) {
	                this.dragging = {
	                    enable: false,
	                    axis: ''
	                }
	            }
	        },
	        getSizes (X, Y) {
	            const wrapperRef = this.$refs.wrapperRef,
	                containerRef = this.$refs.container,
	                verticalBarRef = this.$refs.verticalBar,
	                verticalInternalBarRef = this.$refs.verticalInternalBar,
	                horizontalBarRef = this.$refs.horizontalBar,
	                horizontalInternalBarRef = this.$refs.horizontalInternalBar
	            this.wrapperObj = {
	                elm: wrapperRef,
	                scrollHeight: wrapperRef.scrollHeight,
	                scrollWidth: wrapperRef.scrollWidth,
	                scrollLeft: wrapperRef.scrollLeft,
	                scrollTop: wrapperRef.scrollTop
	            }
	            this.container = {
	                elm: containerRef,
	                scrollHeight: containerRef.scrollHeight,
	                scrollWidth: containerRef.scrollWidth
	            }
	            this.bars.horizontal.elm = horizontalInternalBarRef
	            this.bars.horizontal.parent = horizontalBarRef
	            this.bars.horizontal.size = this.wrapperObj.scrollWidth - this.container.scrollWidth > 24 &&
	                this.wrapperObj.scrollWidth - this.container.scrollWidth !== 0
	                ? (this.container.scrollWidth / this.wrapperObj.scrollWidth) * this.container.scrollWidth
	                : 0;
	            this.bars.vertical.elm = verticalInternalBarRef
	            this.bars.vertical.parent = verticalBarRef
	            this.bars.vertical.size = this.wrapperObj.scrollHeight - this.container.scrollHeight > 24 &&
	                this.wrapperObj.scrollHeight - this.container.scrollHeight !== 0
	                ? (this.container.scrollHeight / this.wrapperObj.scrollHeight) * this.container.scrollHeight
	                : 0
	        }
	    },
	    props: ['wrapper', 'vBar', 'vBarInternal', 'hBar', 'hBarInternal', 'shadow', 'shadowColor'], template: `
<div id="vbar" :class="propWrapperSize">
    <div class="bar--container" ref="container" @wheel="scroll" @touchmove="scroll">
	    <div class="bar--shadow bar--shadow-start" :style="shadowStyle('start')" :data-axis="shadow" v-show="wrapperObj.scrollLeft > 0"></div>
	    <div class="bar--shadow bar--shadow-end" :style="shadowStyle('end')" :data-axis="shadow" v-show="wrapperObj.scrollLeft + container.scrollWidth < wrapperObj.scrollWidth - 15"></div>
        <div class="bar--vertical" ref="verticalBar" v-show="bars.vertical.size" :style="barSizeVertical" :class="propBarVertical" @touchstart="startDrag" @mousedown="startDrag" data-axis="Y" data-drag-source="bar">
            <div class="bar--vertical-internal" ref="verticalInternalBar" :style="barInternalVertical" :class="propBarInternalVertical" @touchstart="startDrag" @mousedown="startDrag" data-axis="Y" data-drag-source="internal"></div>
        </div>
        <div class="bar--horizontal" ref="horizontalBar" v-show="bars.horizontal.size" :style="barSizeHorizontal" :class="propBarHorizontal" @touchstart="startDrag" @mousedown="startDrag" data-axis="X" data-drag-source="bar">
            <div class="bar--horizontal-internal" ref="horizontalInternalBar" :style="barInternalHorizontal" :class="propBarInternalHorizontal" @touchstart="startDrag" @mousedown="startDrag" data-axis="X" data-drag-source="internal"></div>
        </div>
        <div class="bar--wrapper" ref="wrapperRef" :style="validationScrolls">
            <slot></slot>
        </div>
    </div>
</div>			
`});
window.$app.defineModule("frontend", [{ path: '/', props: true, component: 'vue-frontend-index', children: [
	{ path: '/:username', props: true, name: 'index', component: 'vue-frontend-page' },
	{ path: '/:lang/wizard/:username/', props: true, component: 'vue-frontend-page' },
	{ path: '/:username/', props: true, name: 'inner', component: { template: '<keep-alive><router-view></router-view><.keep-alive>'}, children: [
		{ path: 'p/:page_id/', component: 'vue-frontend-page', props: true, name: 'page'},
		{ path: 'm/', component: 'vue-frontend-market-catalog', props: true, name: 'catalog'},
		{ path: 'm/:collection_id/', component: 'vue-frontend-market-catalog', props: true, name: 'collection'},
		{ path: 'o/:product_id/', component: 'vue-frontend-market-product', props: true, name: 'product'},
		{ path: 'b/', component: 'vue-frontend-market-basket', props: true, name: 'basket'},
		{ path: ':part/:page_id/', component: 'vue-frontend-page', props: true, name: 'part'}
	]}
]}]);

window.$app.defineComponent("blocks", "vue-blocks-flipclock-countdown", {props: {countdown: Number, withDays: {type: Boolean, default: true}},
	
	data: () => ({
		timer: 0,
		time: null,
		i: 0,
		trackers: ['hours', 'minutes', 'seconds'],
		titles: {},
		numbers: [0,1],
		frame: null
	}),
	
	beforeDestroy(){
		if (window['cancelAnimationFrame']) cancelAnimationFrame(this.frame);
		if (this.timer) clearInterval(this.timer);
	},
	
	created() {
		this.titles = {days: this.$gettext('Дни'), hours: this.$gettext('Часы'), minutes: this.$gettext('Минуты'), seconds: this.$gettext('Секунды')};
		if (this.withDays) this.trackers.unshift('days');
		
		this.timer = setInterval(() => { if (this.countdown) this.countdown--; }, 1000);
		if (window['requestAnimationFrame']) this.update();
	},
	
	methods: {
		split(v) {
			return [v / 10 | 0, v % 10];
		},
	
		update() {
			this.frame = requestAnimationFrame(this.update.bind(this));
			if ( this.i++ % 10 ) { return; }
			
			
			let s = this.countdown;
			let d = Math.floor(s / (24*60*60));
			s -= d * (24*60*60);
			let h = Math.floor(s / (60*60));
			s -= h * (60*60);
			let m = Math.floor(s / (60));
			s -= m * (60);	      
			
			this.time = {
				days: this.split(d),
				hours: this.split(h),
				minutes: this.split(m),
				seconds: this.split(s)
			}
		}
	}, template: `
	<div class="flipclock">
	    <div v-for="tracker in trackers">
	    <span class="flipclock__slot">{{titles[tracker]}}</span>
	    <div v-if="time">
	      <vue-blocks-flipclock-tracker :time="time[tracker][i]" v-ref:trackers v-for="i in numbers"></vue-blocks-flipclock-tracker>
	      <div class="flipclock-dots"><em></em><em></em></div>
	    </div>
	    </div>
	</div>
`});

window.$app.defineComponent("blocks", "vue-blocks-flipclock-tracker", {props: ['time'],
		
		data: () => ({
			current: null,
			previous: null
		}),
		
		created() {
			this.update(this.time);
		},
		
		watch: {
			time(newValue) {
				if ( newValue === undefined ) return;
				this.update(newValue);
			}
		},
		
		methods: {
			update(newValue) {
				var val = newValue;
				
				val = ( val < 0 ? 0 : val );
				
				if ( val !== this.current || this.current === null ) {
					this.previous = (this.previous === null)?val:this.current;
					this.current = val;
					
					if (this.$el) {
						this.$el.classList.remove('flip');
						void this.$el.offsetWidth;
						this.$el.classList.add('flip');
					}
				}
			}
		}, template: `
  <span class="flipclock__piece">
    <span class="flipclock__card flip-card">
      <b class="flip-card__top">{{current}}</b>
      <b class="flip-card__bottom" :data-value="current"></b>
      <b class="flip-card__back" :data-value="previous"></b>
      <b class="flip-card__back-bottom" :data-value="previous"></b>
    </span>
  </span>
`});