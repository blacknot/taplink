$mx.observe('.screen-sliders', (o) => {
	var list = o.children();
	var direct = o.data('animation');
	if (!direct) direct = 'Up';
	var i = 0;
	
	if (list.length <= 1) return;
	
	let show = () => {
		var a = $mx(list[i]);
		i++;
		if (i > list.length-1) i = 0;
		var b = $mx(list[i]);
		
		list.removeClass('fadeIn'+direct+' fadeOut'+direct+' animated faster');
		list.addClass('is-hidden');

		a.removeClass('is-hidden').addClass('fadeOut'+direct+' animated faster');
		setTimeout(() => {b.removeClass('is-hidden').addClass('fadeIn'+direct+' animated faster');}, 100)
	}
	
	setInterval(show, 3000);
	show();
});

function getRandom(list) {
	var max = list.length;
	return Math.floor(Math.random() * Math.floor(max));
}

$mx.observe('.index-counter-more', o => {
	let hero = o.closest('.hero-block');
	
	let profiles = hero.find('iframe').map(v => $mx(v).data('profile'));
	let idx = 6;
	
	o.on('click', () => {
		idx++;
		
		function next() {
			let columns = hero.find('.examples-columns');
			columns.children().css('transform', 'translate(-14.2857%, 0)');
			setTimeout(() => {
				columns.css('transition', 'none');
				columns.children().css('transform', null);
				columns.children().eq(0).appendTo(columns).find('iframe').attr('src', '//taplink.cc/'+profiles[idx]+'?static=1');
				
				columns.css('transition', null);
			}, 250);
		}
		
		if (idx >= profiles.length) {
			var page = o.data('page')+1;
			o.data('page', page);
			
			$mx.get(o.data('prefix')+'/examples/get.json?page='+page).then(function(r) {
				profiles = profiles.concat(_.map(r.data, d => d.nickname));
				next();
			});
		} else {
			next();
		}
		
	}).on('click', '.index-container-welcome .btn-group-tariffs .button', function(e) { //, .index-welcome-device
		var o = $mx(this).parent();
		var hero = o.closest('.hero-block');
		
		var devices = hero.find('.device');
		
		var device = devices.removeClass('in').eq(o.index());
		var video = device.addClass('in').find('video');
		if (video.length) video[0].currentTime = 0;
		
		var buttons = hero.find('.btn-group-gray .button');
		buttons.removeClass('active').eq(o.index()).addClass('active');
		
		
	});
});


$mx.observe('.index-chatbot', (o) => {
	var names = o.data('names').split(',');
	var pages = o.data('pages').split(',');
	var prices = o.data('prices').split(',');
	var labels = o.data('labels').split(',');
	
	var container = o.find('.index-chatbot-container');
	
	function pushMessage() {
		var i = getRandom(pages);
		m = $mx('<div class="index-message is-prepare"><div><b>'+labels[0]+'</b><br>'+labels[1]+': '+names[getRandom(names)]+'<br>'+labels[2]+': '+pages[i]+'<br>'+labels[3]+': '+prices[i]+'</div></div>').appendTo(container);
		
		var height = m.outerHeight()+15;
		container.addClass('is-animated').css('transform', 'translate3d(0, -'+height+'px, 0)');
		m.css({transform: 'translate3d(0, '+height+'px, 0)', opacity: 0}).addClass('is-animated');
		
		let children = container.children();
		
		let f = (children.length > 3)?$mx(children.get(0)):null;
		if (f) f.css({transform: 'translate3d(0, 0, 0)', opacity: 1}).addClass('is-animated');
		
		setTimeout(() => {
			m.css({transform: '', opacity: 1});
			if (f) f.css({transform: 'translate3d(0, -'+f.outerHeight()+', 0)', opacity: 0});
			
			setTimeout(() => {
				m.removeClass('is-animated').removeClass('is-prepare');
				container.removeClass('is-animated').css('transform', '');
				if (f) f.remove();
				startNotify();
			}, 300);
		}, 10);
	}
	
	function startNotify() {
		setTimeout(function() {
			pushMessage();
		}, 2000);
	}

	pushMessage();
});

function indexAutomationBlocksRebuild(o) {
	let blocks = _.map(o.find('li.in'), b => {
		return $mx(b).data('name');
	});
	
	o.closest('.row').find('.index-automate-canvas [data-block]').each(b => {
		b = $mx(b);
		let v = blocks.indexOf(b.data('block')) == -1;
		if (v) {
			if (b.data('step') > 0) return;
			b.data('step', 1);
			setTimeout(() => {
				b.data('step', 2);
				setTimeout(() => {
					b.data('step', 3);
				}, 100);
			}, 50);
		} else {
			if (b.data('step') == 0) return;
			b.data('step', 2);
			setTimeout(() => {
				b.data('step', 1);
				setTimeout(() => {
					b.data('step', 0);
				}, 100);
			}, 50);
		}
	});
}

$mx.observe('.index-automation-blocks-list', (o) => {
	o.find('li').click(function(e) {
		$mx(this).toggleClass('in');
		indexAutomationBlocksRebuild(o);
	});

	indexAutomationBlocksRebuild(o);
});

$mx.observe('.index-design-cards', (parent) => {
	function nextDesignSlide() {
		parent.addClass('in');
		
		setTimeout(() => {
			parent.addClass('frized');
			setTimeout(() => {
				parent.removeClass('in');
				list = parent.find('.index-design-cards-container');
				let childrens = list.children();
				childrens.eq(childrens.length-1).prependTo(list);
				setTimeout(() => {
					parent.removeClass('frized');
					setTimeout(nextDesignSlide(), 1000);
				}, 100);
			}, 100);
		}, 1000)
	}
	
	setTimeout(nextDesignSlide, 1000);
});