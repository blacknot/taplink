/*
jQuery observe
Copyright 2014 Kevin Sylvestre
1.0.9
*/


(function() {
  "use strict";
  var Observer;

  Observer = (function() {
    Observer.settings = {
      interval: 800
    };

    function Observer(form, callback, settings) {
      if (settings == null) {
        settings = {};
      }
      this.form = form;
      this.callback = callback;
      this.settings = $mx.extend({}, Observer.settings, settings);
      this.observe();
    }

    Observer.prototype.observe = function() {
      var _this = this;
      
      var elements = $mx(this.form.elements).filter(function(i, o) {
	      return $mx(this).data('observe-skip')?0:1;
      });
      
      elements.change(function() {
        return _this.modified = new Date();
      });
      elements.keypress(function() {
        return _this.modified = new Date();
      });
      elements.keydown(function() {
        return _this.modified = new Date();
      });
      return this.every(this.settings.interval, function() {
        if (_this.modified != null) {
          _this.callback.call(_this.form);
        }
        return delete _this.modified;
      });
    };

    Observer.prototype.every = function(interval, callback) {
      return setInterval(callback, interval);
    };

    return Observer;

  })();

  $mx.fn.formObserve = function(callback, options) {
	  if (options == null) {
	    options = {};
	  }
	  return this.each(function() {
	    return new Observer(this, callback, options);
	  });
	}

}).call(this);
$mx.observe('#faqForm', function(o) {
	let faqContainer = $mx('#faqContainer');
	let btnClear = o.find('.form-control-feedback');
	let place = $mx('#filterPlace');
	let input = $mx('#faqSearchQuery');
	
	let update = () => {
		let query = input.val().trim();
		
		btnClear.addClass('is-hidden');

		if (query) {
			faqContainer.addClass('is-hidden');
			o.find('.menu').addClass('disabled');
			input.parent().addClass('is-loading');
			
			$mx.post('', {query: $mx('#faqSearchQuery').val(), action: 'search'}).then((s) => {
				place.html(s.data);
				input.parent().removeClass('is-loading');
				if (query) btnClear.removeClass('is-hidden');
			});
		} else {
			faqContainer.removeClass('is-hidden');
			o.find('.menu').removeClass('disabled');
			place.html('');
		}
	}
	
	btnClear.on('click', () => {
		input.val('');
		update();
	});
	
	o.formObserve(update);	
});