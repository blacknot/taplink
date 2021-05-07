
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