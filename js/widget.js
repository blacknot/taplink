w.taplink = {
	modal: null,
	shadow: null,
	opened: false,
	btn: null,
	iframe: null,
	part: '',
	backdrop: null,
	style: null,
	inited: false,
	msgs: [],
	
	createElement: function(name, attrs, text) {
		var e = document.createElement(name);
		for (var i in attrs) e.setAttribute(i, attrs[i]);
		if (text) e.innerHTML = text;
		return e;
	},
	
	postMessage: function(msg) {
		if (this.iframe) {
			this.iframe.postMessage(msg);
		} else {
			this.msgs.push(msg);
		}
	},
	
	getCookie: function(name) {
		var value = "; " + document.cookie;
		var parts = value.split("; " + name + "=");
		if (parts.length == 2) return parts.pop().split(";").shift();
	},
	
	toggleClass: function(o, name, state) {
		if (state == undefined) {
			if (o.className.indexOf(name) != -1) {
				this.removeClass(o, name);
			} else {
				this.addClass(o, name);
			}
		} else {
			if (state) {
				this.addClass(o, name);
			} else {
				this.removeClass(o, name);
			}
		}
	},
	
	addClass: function(o, name) {
		if (o.className.indexOf(name) == -1) o.className += ' '+name;
	},

	removeClass: function(o, name) {
		if (o) o.className = o.className.replace(' '+name, '');
	},
	
	open: function(part) {
		if (part == undefined) part = '/';
		if (typeof part == 'string') {
			this.part = part;
		} else {
			switch (part.part) {
				case 'market':
					this.part = '/m/';
					break;
				case 'product':
					this.part = '/o/'+part.id+'/';
					break;
				case 'page':
					this.part = '/p/'+part.id+'/';
					break;
				default:
					this.part = '/';
					break;
			}
		}

		if (this.iframe && part) this.reload();
		if (!this.opened) this.toggle();
	},

	close: function() {
		if (this.opened) this.toggle();
	},
	
	reload: function(cb) {
		if ((cb == undefined)) cb = () => { }
		var url = (p.domain?p.domain:('//taplink.cc/'+p.username))+((this.part != '/')?this.part:'');
		if (token) url += '?token='+token;
		var old = this.iframe.getAttribute('src');
/*
		var onLoaded = () => {
			this.iframe.removeEventListener('load', onLoaded);
			cb();
		}
		
		(old != 'about:blank')?cb():this.iframe.addEventListener('load', onLoaded, false);
*/
		
		(old != 'about:blank')?cb():setTimeout(() => { cb(); }, 750);
		
		if (old != url) this.iframe.setAttribute('src', url);
	},
	
	toggle: function() {
		if (!w.taplink.inited) w.taplink.completed();
		if (w.taplink.modal) {
			var m = this.modal;
			if (!this.opened) this.reload();
			w.taplink.toggleClass(d.body, 'is-taplink-opened');
		} else {
			var m = this.modal = this.createElement('div', {"class": 'taplink-widget-modal', 'style': p.style+';-webkit-overflow-scrolling: touch;-webkit-backface-visibility: hidden;-webkit-tap-highlight-color:rgba(0,0,0,0);overflow: hidden;overflow-y: scroll;height:100%;text-align:left'});
			this.iframe = this.createElement('iframe', {src:'about:blank', allowtransparency: true, frameborder: 0, border:0, style: '-webkit-overflow-scrolling:touch;-webkit-backface-visibility: hidden;-webkit-tap-highlight-color:rgba(0,0,0,0);'}); 
			m.appendChild(this.iframe);
			d.body.appendChild(m);
			
			this.reload(() => {
				w.taplink.toggleClass(d.body, 'is-taplink-opened');
				
				var close = this.createElement('a', {class: 'taplink-widget-close'});
				d.body.appendChild(close);
				
				close.onclick = function(e) {
					w.taplink.toggle();
				}
				
				
				switch (p.view) {
					case 'popup':
						this.shadow = this.createElement('div', {class: 'taplink-widget-shadow is-'+p.placement});
						break;
					case 'slideout':
						this.shadow = this.createElement('div', {class: 'taplink-widget-backdrop'});
						this.shadow.onclick = function() {
							w.taplink.close();
						}
						break;
				}
				
				d.body.appendChild(this.shadow);
			});
			
			this.iframe.onload = (e) => {
				for (let i = 0; i < this.msgs.length; i++) this.iframe.contentWindow.postMessage(this.msgs[i], "*");
			}
		}
		
		this.opened = !this.opened;
	},
	
	setColor: function(color) {
		color = color.replace('#', '');
		function hexToRgb(hex) {
		    var r = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		    return r ? {
		        r: parseInt(r[1], 16),
		        g: parseInt(r[2], 16),
		        b: parseInt(r[3], 16)
		    } : null;
		}
		
		function isLight(hex) {
			return ((hex.r * .299) + (hex.g * .587) + (hex.b * .114)) > 160;
		}
		
		var rgb = hexToRgb(color);
		
		if (rgb) {
			var styles = '.taplink-widget-btn { background-color: #'+color+'} .taplink-widget-btn:before, .taplink-widget-btn:after { border-color: #'+color+'}';

			if (!this.style) {
				this.style = w.taplink.createElement('link', {type: 'text/css', rel: 'stylesheet'});
			}

			w.taplink.toggleClass(w.taplink.btn, 'is-taplink-light', isLight(rgb));
			
			this.style.setAttribute('href', 'data:text/css;charset=UTF-8,' + encodeURIComponent(styles));
			d.body.appendChild(this.style);
		}		
	},
	
	completed: function() {
		if (w.taplink.inited) return;
		
		d.removeEventListener("DOMContentLoaded", w.taplink.completed, false);
		w.removeEventListener("load", w.taplink.completed, false);
		
		var o = w.taplink.createElement('link', {rel: "stylesheet", href: '//taplink.cc/s/css/widget.css?2'});
		d.body.appendChild(o);
	
		if (p.button == 1) {
			w.taplink.btn = w.taplink.createElement('label', {class: 'taplink-widget-btn'}, '<div class="taplink-widget-btn-inner"></div>');
			d.body.appendChild(w.taplink.btn);
			
			w.taplink.btn.onclick = function(e) {
				w.taplink.toggle();
			}
		}
		
		if (p.color != undefined) {
			w.taplink.setColor(p.color);
		}
		
		if (p.part != undefined) {
			w.taplink.part = p.part;
		}
		
		d.body.className += ' taplink-widget-view-'+p.view+' taplink-widget-placement-'+p.placement;
	
		var t = w.taplink.createElement('div', {class: 'taplink-widget-footer'});
		d.body.appendChild(t);
		
		w.taplink.inited = true;
	}
}

w.addEventListener("message", taplink.receiveMessage, false);

d.addEventListener('DOMContentLoaded', w.taplink.completed, false);
w.addEventListener('load', w.taplink.completed, false);