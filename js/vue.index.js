
window.$app.defineComponent("index", "vue-index-affiliate-form", {data() {
			return {
				values: {name: '', email: '', message: ''},
				isUpdating: false,
				isSent: false
			}
		},
		
		mixins: [FormModel],
		
		methods: {
			submit() {
				this.isUpdating = true;
				
				this.$api.post('system/affiliate/push', this.values, this).then(d => {
					this.isUpdating = false;
					if (d.result == 'success') this.isSent = true;
				});
			}
		}, template: `
	<div v-if="isSent">
		<div class="sa-icon sa-success animate" style="display: block;"><span class="sa-line sa-tip animateSuccessTip"></span> <span class="sa-line sa-long animateSuccessLong"></span> <div class="sa-placeholder"></div> <div class="sa-fix"></div></div>
		<h3 class="has-text-centered">{{'Спасибо'|gettext}}</h3>
	</div>
	<div v-else>
<!-- 		<p>Tell more about what you do and how you see the promotion of Taplink so we could help you with advice and promotional materials</p> -->
		
		<form @submit.prevent="submit">
		<b-field :label="'Ваше имя'|gettext" :class="{'has-error': errors.name}" :message="errors.name">
			<input type="text" class="input is-large" v-model.trim="values.name" :disabled="isUpdating" maxlength="128">
		</b-field>
	
		<b-field :label="'Ваш email'|gettext" :class="{'has-error': errors.email}" :message="errors.email">
			<input type="email" class="input is-large" v-model.trim="values.email" :disabled="isUpdating" maxlength="128">
		</b-field>

		<b-field :label="'Сообщение'|gettext">
			<textarea type="text" class="input is-large" v-model.trim="values.message" :disabled="isUpdating" rows="6" maxlength="64000"></textarea>
		</b-field>
		
		<button type="submit" class="button is-primary is-medium" :class="{'is-loading': isUpdating}">{{'Отправить'|gettext}}</button>
		</form>
	</div>
`});

window.$app.defineComponent("index", "vue-index-appsumo-invite", {data() {
			return {
				isFetching: false,
				email: ''
			}
		},
		
		mixins: [FormModel],
		props: ['c'],
		
		methods: {
			send() {
				this.isFetching = true;
				this.$api.post('system/appsumo/send', {email: this.email, code: this.c.code}, this).then(d => {
					this.isFetching = false;	
					if (d.result == 'success') {
						this.c.sent = true;
						this.c.email = this.email;
						this.$parent.close();
					}
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">Send invite</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<b-field :class="{'has-error': errors.email}" :message="errors.email" :label="'Электронная почта'|gettext">
	            <input type="email" minlength="6" maxlength="128" v-model="email" class="input" :disabled="isFetching" v-focus required autocapitalize="off"></input>
	        </b-field>
		</section>
		<footer class="modal-card-foot">
			<div class="level-item">
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
				<button class="button is-primary" type="button" @click="send">{{'Отправить'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>		
	</div>
`});

window.$app.defineComponent("index", "vue-index-appsumo", {data() {
			return {
				values: {name: '', email: (this.$account.user != undefined)?this.$account.user.email:'', code: ''},
				codes: [],
				message: '',
				isUpdating: false,
				isSent: false
			}
		},
		
		props: ['hash'],
		
		mixins: [FormModel],
		
		created() {
			if (this.hash) {
				this.$api.get('system/appsumo/hash', {hash: this.hash}).then(d => {
					if (d.result == 'success') {
						this.codes = d.response.codes;
					} else {
						document.location = '../';
					}
				});
			}
		},
		
		methods: {
			submit() {
				this.isUpdating = true;
				
				this.$api.post('system/appsumo/check', this.values, this).then(d => {
					if (d.result == 'success') {
						if (!this.hash && d.response.link) {
							document.location = d.response.link;
						} else {
							this.codes = d.response.codes;
							this.values.code = '';
							this.isUpdating = false;

							if (d.response.message) {
								this.message = d.response.message
							}
						}
					} else {
						this.isUpdating = false;
					}
				});
			},
			
			invite(c) {
				console.log(c);
				this.$modal('vue-index-appsumo-invite', {c: c});
			}
		}, template: `
	<div>
<!--
		<b-field :label="'Ваше имя'|gettext" :class="{'has-error': errors.name}" :message="errors.name">
			<input type="text" class="input is-large" v-model.trim="values.name" :disabled="isUpdating" maxlength="128">
		</b-field>
-->
		<div class="message is-success has-mb-6 has-mt-2" v-if="message">
			<div class="message-body" v-html="message"></div>
		</div>
	
		<div class="has-mb-6" v-if="codes.length && (codes.length > 1 || !codes[0].profile_id)">
			<h5 class="has-text-centered">You are provided with codes to activate lifelong BUSINESS plan on other accounts:</h5>
			<div style="background:#f8f9f9" class="has-p-4 has-mb-6">
			<div v-for="(c, i) in codes">
				<div class="row" :class="{'has-mt-2': i}">
					<div class="col-xs-6"><vue-component-clipboard :text="c.code" class="has-mr-1"></vue-component-clipboard> <span :style="{'text-decoration': c.profile_id?'line-through':''}" :class="{'has-text-grey': c.profile_id}">{{c.code}}</span></div>
					<div class="col-xs-6 has-text-right" style="display: flex;align-items: center;justify-content: flex-end;">
						<i class="fas fa-info-circle has-mr-2" v-if="c.email" v-tippy="{ placement : 'top', content: 'The invite with this code was sent to '+c.email}"></i>
						<button class="button is-success" :disabled="c.profile_id != null || c.sent != 0" @click="invite(c)"><span class="is-hidden-mobile">Invite by email</span><span class="is-hidden-tablet">Invite</span></button>
					</div>
				</div>
			</div>
			</div>
			<hr>
			<h4>To activate these code:</h4>
			1. Sign in or sign up with the account for which the code will be activated<br>
			2. Go to the <a href="/tariffs/">Pricing page</a><br>
			3. Click on «Activate promo code» (Right under the plans)<br>
			4. Enter the code and click «Check»<br>
			5. Click «Activate» to get your Longlife BUSINESS<br><br>
			A permanent link to this page and instructions for activation codes has been sent to your mail! Have a nice day!
			<hr>
		</div>
		<h5 v-else class="has-text-centered">Welcome Sumo-lings! It's so lovely to see you here!</h5>
		
		<div style="background:#f8f9f9" class="has-p-4">
		<form @submit.prevent="submit">
		<b-field :label="'Ваш email'|gettext" :class="{'has-error': errors.email}" :message="errors.email">
			<input type="email" class="input is-large" v-model.trim="values.email" :disabled="isUpdating" maxlength="128">
		</b-field>

		<b-field label="AppSumo code" :class="{'has-error': errors.code}" :message="errors.code">
			<input type="text" class="input is-large" v-model.trim="values.code" :disabled="isUpdating" maxlength="128">
		</b-field>
		
		
		<button type="submit" class="button is-primary is-medium" :class="{'is-loading': isUpdating}">Activate</button>
		</form>
		</div>
	</div>
`});

window.$app.defineComponent("index", "vue-index-challenge-form", {data() {
			return {
				isFetching: false,
				isUpdating: false,
				isSendingCode: false,
				codeSent: false,
				code: '',
				values: [],
				activeTab: 'email',
				methods: ['email']
			}
		},
		
		mixins: [FormModel],
		
		props: ['account_token'],
		
		created() {
			
			this.isFetching = true;
			this.$api.get('system/challenge/prepare', {account_token: this.account_token}).then(d => {
				if (d.result =='success') {
					this.values = d.response.values;
					this.methods = d.response.methods;
					this.activeTab = this.methods[0];
				}
				this.isFetching = false;
			});
		},
		
		computed: {
			allowCheckCode() {
				return (this.activeTab == 'email' && this.codeSent) || (this.activeTab == 'authenticator');
			}
		},
		
		methods: {
			toggleTab(name) {
				this.activeTab = name;
			},
			
			sendCode() {
				this.isSendingCode = true;
				this.$api.get('system/challenge/send', {account_token: this.account_token}, this).then(d => {
					if (d.result == 'sent') {
						this.codeSent = true;
					}
					this.isSendingCode = false;
				});
			},
			
			checkCode() {
				
				this.isUpdating = true;
				this.$api.get('system/challenge/check', {code: this.code, method: this.activeTab, account_token: this.account_token}, this).then(d => {
					if (d.result == 'success') {
						this.$parent.$emit('result', d.response.code);
						this.$parent.close();
					}
					this.isUpdating = false;
				});
			}
		}, template: `
	<form @submit.prevent="checkCode" class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Подтверждение действия'|gettext}}</p>
			<button type="button" class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks" style="display: flex">
			<div class="publish-form-collapse">
				<div class="is-title" @click="toggleTab('authenticator')" :class="{in: activeTab == 'authenticator'}" v-if="methods.indexOf('authenticator') != -1">
					<span><i class="fal fa-chevron-right has-mr-2"></i>{{'Приложение для генерации кодов'|gettext}}</span>
				</div>
				<div v-if="methods.indexOf('authenticator') != -1">
					<div>
					<section>
					<div class="has-mb-2">{{'Введите код двухэтапной верификации, сгенерированный вашим приложением-аутентификатором'|gettext}}</div>
					<b-field :class="{'has-error': errors.code}" :message="errors.code">
						<vue-component-verifyfield v-model="code" :disabled="isUpdating" @keydown="errors.code = null" type="tel" style="max-width: 460px"></vue-component-verifyfield>
					</b-field>
					</section>
					</div>
				</div>

				<div class="is-title is-last-tab" @click="toggleTab('email')" :class="{in: activeTab == 'email'}" v-if="methods.indexOf('email') != -1 && methods.length > 1">
					<span><i class="fal fa-chevron-right has-mr-2"></i>{{'Электронная почта'|gettext}}</span>
				</div>
				<div v-if="methods.indexOf('email') != -1">
					<div>
					<section>
					<div class="message is-success" v-if="values.type == 'email' && codeSent">
						<div class="message-body">
						{{'Мы отправили проверочный код на вашу электронную почту. Введите его и нажмите кнопку "Продолжить"'|gettext}}
						</div>
					</div>
					
					
		
					<b-field :class="{'has-error': errors.email}" :message="errors.email" :label="'Электронная почта'|gettext" v-if="values.type == 'email'">
			            <input type="email" minlength="6" maxlength="40" v-model="values.email" class="input" required autocapitalize="off" disabled="on">
						<p class="control">
							<button type="button" class="button is-success" @click="sendCode" :disabled="codeSent" :class="{'is-loading': isSendingCode}">{{'Отправить код'|gettext}}</button>
			            </p>
			        </b-field>
			        
			        
					<b-field :class="{'has-error': errors.code}" :message="errors.code" :label="'Проверочный код'|gettext" v-if="codeSent">
						<vue-component-verifyfield v-model="code" :disabled="isUpdating" @keydown="errors.code = null" type="tel" style="max-width: 460px"></vue-component-verifyfield>
			        </b-field>
					</section>
					</div>
				</div>
			</div>
			
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" type="submit" :class="{'is-loading': isUpdating}" :disabled="!allowCheckCode || isSendingCode">{{'Проверить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>		
	</form>
`});

window.$app.defineComponent("index", "vue-index-downgrade-form", {data() {
			return {
				plan: 'business',
				isFetching: true,
				isUpdating: false,
				values: null
			}
		},
		
		created() {
			this.fetchData();
		},
		
		methods: {
			fetchData() {
				this.$api.get('pricing/downgrade/prepare').then(data => {
					if (data.result == 'success') {
						this.values = data.response.values;
					}
					this.isFetching = false;
				});
			},
			
			confirm() {
				this.isUpdating = true;
				
				this.$api.post('pricing/downgrade/confirm', {plan: this.plan}).then(data => {
					if (data.result == 'success') {
						this.$auth.refresh();
						this.$parent.close();
					}
					
					this.isUpdating = false;
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Смена тарифа'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			{{'Вы можете понизить свой тариф с пересчетом срока действия тарифа. Отменить это действие будет невозможно. Выберите тариф и нажмите кнопку "Подтвердить"'|gettext}}
			
			<ul class="downgrade-choose has-mt-1" v-if="values">
				<li :class="{in: plan == p.plan_name}" @click="plan = p.plan_name" v-for="p in values"><b>{{p.plan_name.toUpperCase()}}</b><br>{{'До {1}'|gettext|format($date(p.tms_until))}} <span class="has-text-success has-ml-1" v-if="p.days">(+{{'день'|plural(p.days)}})</span></li>
			</ul>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark level-item" type="button" @click="$parent.close()" :disabled="isUpdating">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" type="button" :class="{'is-loading': isUpdating}" :disabled="plan == $account.tariff" @click="confirm">{{'Подтвердить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>		
	</div>
`});

window.$app.defineComponent("index", "vue-index-footer", {methods: {
			checkUrlPrefix(s) {
				return window.base_path_prefix + s;
			}
		}, template: `
	<footer class="is-hidden-mobile">
		<div class="container">
			<div class="level">
				<div class="level-left">
					<a v-if="i18n.locale == 'ru'" @click="$events.fire('help:toggle', {active: true, target: {name: 'guides'}})">{{'Подробные инструкции'|gettext}}</a>
					<a v-else :href="checkUrlPrefix('/guide/')">{{'Подробные инструкции'|gettext}}</a>

					<a v-if="i18n.locale == 'ru'" @click="$events.fire('help:toggle', {active: true, target: {name: 'faq'}})">{{'Вопросы и ответы'|gettext}}</a>
					<a v-else :href="checkUrlPrefix('/faq/')">{{'Вопросы и ответы'|gettext}}</a>


					<a @click="Intercom('show')">{{'Задать вопрос'|gettext}}</a>
					<a :href="checkUrlPrefix('/about/affiliate.html')" v-if="i18n.locale != 'ru'">{{'Партнерская программа'|gettext}}</a>
					<a @click="$events.fire('help:toggle', {active: true, target: {name: 'academy'}})" v-if="i18n.locale == 'ru'">Академия Taplink</a>
					
					<a :href="checkUrlPrefix('/tariffs/')">{{'Цены и тарифы'|gettext}}</a>
				</div>
				
				<div class="level-right">
					<vue-component-locale-change></vue-component-locale-change>
				</div>
			</div>
		</div>
	</footer>
`});

window.$app.defineComponent("index", "vue-index-index", {data() {
			return {
				isAuth: false,
				current: null
			}
		},
		
		computed: {
			isShow() {
				return this.current && (((this.current.name == 'main') && this.isAuth) || (this.current.name != 'main'));
			}
		},

		created() {
			$mx('html').addClass('is-app');
			window.$events.on('navigate', this.navigate);
			this.navigate(null, this.$router.currentRoute);
			
			if (this.$account.profile_id == undefined) {
				if (this.$router.currentRoute.name == 'index') {
					window.$events.one('account:refresh', () => {
						this.$router.replace({name: 'pages', params: {page_id: this.$account.page_id}});
/*
						if (this.$account.user.email || 1) {
							this.$router.replace({name: 'pages', params: {page_id: this.$account.page_id}});
						} else {
							this.$router.replace({name: 'email'});
						}
*/
					});
				}

				this.$auth.refresh(null, null, () => {
					// Если ссылка была на внутреннюю страницу - созраняем ее в куках
					let location = document.location.href;
	
					if (location.indexOf('/auth/') == -1) {
						Cookies.set('auth-redirect', location);
					} else {
						Cookies.remove('auth-redirect');
					}
				});
			} else {
				this.isAuth = true;
			}
			
			window.$events.on('account:refresh', () => {
				if (!this.$account.user.email) return this.$router.replace({name: 'email'});
				this.isAuth = true;
			});
			
			this.$io.on('events:account:logout', this.logout);
			window.$events.on('account:logout', this.logout);

			this.$io.on('events:avatar:updated', this.avatarUpdated);
			
			let mainBlock = $mx('.main-block');
			
			mainBlock.on("scroll", (e) => {
				$mx(document.body).toggleClass('is-scrolled', mainBlock[0].scrollTop > 20);
			});
		},
		
		mounted() {
			window.scrollTo(0, 1);
		},
		
		destroyed() {
			window.$events.off('navigate', this.navigate);
			this.$io.off('events:account:logout', this.logout);
			this.$io.off('events:avatar:updated', this.avatarUpdated);
		},

		methods: {
			avatarUpdated(data) {
				this.$account.avatar.url = '//'+this.$account.storage_domain+data.pathname;
			},
			
			navigate(e, to) {
				this.current = to?((to.matched.length > 1)?to.matched[1]:to):null;
			},

			logout() {
				this.isAuth = false;
				this.$account.profile_id = null;
				if (['main', 'index'].indexOf(this.current.name) != -1) this.$router.replace({name: 'signin'});
			}
		}, template: `
	<router-view v-if="isShow" :class="{'has-auth':isAuth}"></router-view>
`});

window.$app.defineComponent("index", "vue-index-main", {data() {
			return {
				connection: 1,
				connectionTimer: null,
				online: true,
				isMounted: false
			}
		},
		props: ['page_id'],
		
		created() {
			$mx(window).on('online offline', this.updateIndicator);
			this.$events.on('theme:refresh', this.themeRefresh);
		},
		mounted() {
			this.isMounted = true;
			this.themeRefresh();	
		},
		destroyed() {
			$mx(window).off('online offline', this.updateIndicator);
			this.$events.off('theme:refresh', this.themeRefresh);
			this.isMounted = false;
		},
		methods: {
			themeRefresh() {
				if (this.isMounted) {
					StylesFactory.updateCSSBlock(this.$account.styles/* Object.assign({_:[this.$account.styles]}, this.$account.styles )*/, this.$refs.styles);
				}
			},
			updateIndicator() {
				this.online = navigator.onLine;
				if (this.online) this.$events.fire('online');
				
				if (this.online) {
					if (this.connectionTimer) {
						clearInterval(this.connectionTimer);
						this.connectionTimer = null;
					}
					$mx('html').removeClass('is-clipped');
				} else {
					this.connectionTimer = setInterval(() => {
						this.connection++;
						if (this.connection == 5) this.connection = 1;
					}, 1000);
					
					$mx('html').addClass('is-clipped');
				}

			},
			navigate(e, to) {
				this.current = to?((to.matched.length > 1)?to.matched[1]:to):null;
			}
		}, template: `
	<div style="display: flex;flex-direction: column;flex-shrink:0;flex-grow: 1">
		<div ref='styles'></div>
		<vue-index-menu :page_id="page_id"></vue-index-menu>
		<div v-if="$form.isOpened" style="flex-grow: 1">
			<component v-for="(s, i) in $form.stack" style="flex-grow: 1" v-bind="s.props" ref="form" v-show="i == $form.stack.length - 1"></component>
		</div>
<!-- 		v-bind:is="$form.name" -->
		<router-view style="flex-grow: 1" v-show="!$form.isOpened"></router-view>
		<vue-index-footer></vue-index-footer>
		
		<div class="network-status" v-if="!online">
			<div class="network-status-icon">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
					<g class="fa-group" v-if="connection == 1"><path class="fa-secondary" fill="currentColor" d="M634.9 154.9C457.7-9 182.2-8.9 5.1 154.9c-6.4 6-6.8 16-.9 22.5.2.2.3.4.5.5l34.2 34c6.2 6.1 16 6.2 22.4.4 145.9-133.7 371.3-133.7 517.2 0 6.4 5.9 16.2 5.7 22.4-.4l34.2-34c6.3-6.2 6.3-16.2.2-22.5 0-.2-.2-.4-.4-.5zM522.7 268.4c-115.3-101.9-290.2-101.8-405.3 0-6.5 5.8-7.1 15.8-1.4 22.3.3.3.5.6.8.8l34.4 34c6 5.9 15.6 6.3 22.1.8 83.9-72.6 209.7-72.4 293.5 0 6.4 5.5 16 5.2 22-.8l34.4-34c6.2-6.1 6.4-16.1.3-22.4-.3-.2-.5-.4-.8-.7z"></path><path class="fa-primary" fill="currentColor" d="M320 352c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64z"></path></g>
					<g class="fa-group" v-if="connection != 1"><path :class="{'fa-secondary': connection == 2 || connection == 4, 'fa-primary': connection == 3}" fill="currentColor" d="M635.3 177.9l-34.2 34c-6.2 6.1-16 6.2-22.4.4-146-133.7-371.3-133.7-517.2 0-6.4 5.9-16.2 5.7-22.4-.4l-34.2-34-.5-.5c-6-6.4-5.6-16.5.9-22.5C182.2-8.9 457.7-9 634.9 154.9c.2.2.4.3.5.5 6.2 6.3 6.1 16.3-.1 22.5z"></path><path class="fa-primary" fill="currentColor" d="M320 352c-35.3 0-64 28.7-64 64s28.7 64 64 64 64-28.7 64-64-28.7-64-64-64zm203.5-82.8l-.8-.8c-115.3-101.9-290.2-101.8-405.3 0-6.5 5.8-7.1 15.8-1.4 22.3.3.3.5.6.8.8l34.4 34c6 5.9 15.6 6.3 22 .8 84-72.6 209.7-72.4 293.5 0 6.4 5.5 16 5.2 22-.8l34.4-34c6.4-6 6.5-16 .4-22.3z"></path></g>
				</svg>
			</div>
			<h2 class="has-mb-2 has-text-centered">{{'Отсутствует соединение'|gettext}}</h2>
			<h3 class="has-text-centered">{{'Убедитесь, что ваше устройство подключено к интернету'|gettext}}</h3>
		</div>
	</div>
`});

window.$app.defineComponent("index", "vue-index-menu", {data() {
			return {
				favourites: [],
				standalone: window.standalone,
				title: '',
				currentRoute: null,
				menuOpened: false,
				isShowBanner: true
			}
		},
		
		props: {'page_id': Number},
		
		created() {
			this.fillTitle(this.currentRoute = this.$router.currentRoute);

			
			window.$events.on('navigate', (e, to) => {
				this.fillTitle(this.currentRoute = to);
// 				this.moveSubmenu(to.name);
			});
			
			$mx(document.body).on('touchstart', this.onTouchStart);			
		},
		
		computed: {
			ratePlanLink() {
				return window.base_path_prefix+'/tariffs/';
			},
			
			tariffEndsMessage() {
				return this.$format(this.$gettext('Через {1} истекает срок действия вашего тарифа, вам необходимо <a href="{2}">продлить ваш тариф</a>'), this.$plural('день', this.$account.tariff_ends_days), this.ratePlanLink);
			},
			
			menu() {
				return _.filter(this.$auth.prepareMenu(this.$router.getRoute({name: 'main'}).children), (m) => m.meta && (m.meta.icon || m.meta.icon_svg));
			}
		},

		mounted() {
			this.$io.on('events:menu.hits:changed', this.changedHits);
			this.$io.on('events:menu.hits:increment', this.incrementHits);
			this.$io.on('events:system:updated', this.updatedSystem);
			this.$io.on('events:profiles.favourites:refresh', this.refreshFavourites);
			
			NativeApplication.setBadge(this.calcHits());
// 			this.moveSubmenu(this.currentRoute.name, 0);
			
			window.$events.on('account:refresh', this.accountRefresh);
			window.$events.on('account:logout', this.accountLogout);
			window.$events.on('menu:close', () => {
				$mx('.projects-menu').css('pointer-events', 'none');
				this.menuOpened = false;
				setTimeout(function() { $mx('.projects-menu').css('pointer-events', 'all'); }, 50);
			});
		},
		
		destroyed() {
			this.$io.off('events:menu.hits:changed', this.changedHits);
			this.$io.off('events:menu.hits:increment', this.incrementHits);
			
			this.$io.off('events:system:updated', this.updatedSystem);
			this.$io.off('events:profiles.favourites:refresh', this.refreshFavourites);
			
			window.$events.off('account:refresh', this.accountRefresh);
			window.$events.off('account:logout', this.accountLogout);

			$mx(document.body).off('touchstart', this.onTouchStart);			
		},
		
		methods: {
			isActiveMenu(m) {
				for (i = this.currentRoute.matched.length - 1; i >= 0; i--) if (this.currentRoute.matched[i].name == m.name) return true;
				return false;	
			},
			accountRefresh() {
				NativeApplication.setBadge(this.calcHits());
			},
			accountLogout() {
				NativeApplication.setBadge(null);
			},
			onTouchStart(o) {
				var t = $mx(o.target);
				if ($mx('html').is('.is-dragging') || $mx('html').is('.is-clipped') || t.closest('.b-slider').length || this.$form.isOpened || this.$form.isOpenedHeader) return;

				if (!this.$device.mobile) return;
				
				var resp = t.closest('.main');
				var is_stop = resp.length;
		
				var maxX = screen.width / 100 * 85;
				var startX = o.touches[0].pageX;
				var startY = o.touches[0].pageY;
				var startMenu = $mx('html').is('.open-menu')?maxX:0;
				var delta = 0;
				var startTime = 0;
				
				if (is_stop) {
					var startRespScroll = resp.data('scroll-x');
					is_stop = startRespScroll < -50;
				}
				
				var oo = $mx('.main');
				var is_started = false;
				var is_started_y = false;
				var x = 0;
			
				if (!is_stop) {
					function touchMove(e) {
						if ($mx('html').is('.is-dragging')) return;
						
						x = e.touches[0].pageX;
						y = e.touches[0].pageY;
						
						if (!is_started_y && (is_started || Math.abs(x - startX) > 45)) {
							delta = x - startX + startMenu;
			
							if (is_stop && delta > 0) is_stop = false;
							if (delta < 0 && resp.length) is_stop = true;
							
							if (!is_stop) {
								if (!is_started) {
									oo.addClass('stop-transition');
									is_started = true;
									startTime = e.timeStamp;
								}
								oo.css('transform', 'translate3d('+Math.min(Math.max(0, delta), maxX)+'px,0,0)')
							}
						}
						
						if (!is_started && Math.abs(y - startY) > 45) {
							is_started_y = true;
						}
					}
					
					t.on('touchmove', touchMove).one('touchend', (e) => {
						t.off('touchmove', touchMove);
						
						if (is_started) {
							oo.removeClass('stop-transition');
							$mx('.main-block').removeClass('disable-pointer-events')
		
							var time = e.timeStamp - startTime;
							var velocityX = Math.abs(x - startX) / time;
							var v = 0;
			
							if (velocityX > 0.4) {
								v = (x - startX) > 0;
							} else {
								v = delta > screen.width / 2;
							}
							
							setTimeout(() => {
								oo.css('transform', '')
								this.menuOpen(null, v);
							}, 0);
							
							is_started = false;
						}
						
						is_started_y = false;
					});
				}
			},
			
			fillTitle(to) {
				let title = null;
				for (var i = to.matched.length - 1; i > 0; i--) {
					if (to.matched[i].meta != undefined && to.matched[i].meta.title != undefined) title = to.matched[i].meta.title;
				}

				this.title = title;
			},
			
			changedHits(m) {
				this.$account.hits = _.merge(this.$account.hits, m);
				NativeApplication.setBadge(this.calcHits());
			},
			
			incrementHits(m) {
				console.log(m);
				function inc(t, m) {
					_.each(m, (v, k) => { 
						if (_.isObject(v)) {
							if (t[k] == undefined) t[k] = [];
							inc(t[k], v)
						} else {
							if (t[k] == undefined) {
								t[k] = v;
							} else {
								t[k] += v;
							}
						}
					})
				}
				
				inc(this.$account.hits, m);
				
// 				this.$account.hits = _.merge(this.$account.hits, m);
				NativeApplication.setBadge(this.calcHits());
			},
			
			updatedSystem() {
				this.$confirm(this.$gettext('Произошло обновление системы, необходимо перезагрузить страницу'), 'is-danger').then(() => {
					document.location.reload();
				});
			},
			
			menuOpen(e, v) {
				if (v == undefined) v = !$mx('html').is('.open-menu');
				
				$mx('html').toggleClass('open-menu', v);
				
				if (v) $mx('.main').one('click', () => {
					$mx('html').removeClass('open-menu');
				});
				
/*
				let o = document.getElementsByTagName('html')[0];
				if (o.className.indexOf('open-menu') != -1) {
					o.className = o.className.replace(' open-menu', '');
				} else {
					o.className += ' open-menu';
				}
*/
			},
			
			refreshFavourites() {
				this.$api.get('account/favourites').then((data) => {
					this.$account.favourites = data.response.favourites;
				});
			},
			
			checkViewBox(m) {
				return (m.icon_viewbox == undefined)?'0 0 512 512':m.icon_viewbox;
			},
			
			prepareHits(m) {
				return (this.calcHits(m)?' menu-hits':'');
			},
			
			calcHits(m) {
				let hits = 0;

				let sum = (items) => {
					let v = 0;
					for (var i in items) {
						if (typeof items[i] == 'object') {
							v += sum(items[i]);
						} else {
							v += items[i];
						}
					}
					
					return v;
				}
				
				if (m != undefined) {
					if (this.$account.hits[m.name]) hits = sum(this.$account.hits[m.name]);
				} else {
					_.each(this.$account.hits, (v) => {
						hits += sum(v);
					});
				}
				
				return hits;
			},
			
			prepareIcon(m) {
				return m.meta.icon + this.prepareHits(m);
			},
			
			click(e) {
				if (window.standalone) go($mx(e.target).closest('a').attr('href'));
				this.$auth.closeMenu();
			},
			
			logout() {
				this.$api.get('auth/logout').then((data) => {
					if (data.result == 'success') {
						this.$auth.closeMenu();
						
						if (data.response != undefined) {
							this.$auth.refresh(data.response, () => {
								this.$router.replace({name: 'pages', params: {page_id: this.$account.page_id}});	
							});
						} else {
							this.$account.profile_id = null;
							window.$events.fire('account:logout');
						}
					}
				})
			}
		}, template: `
	<div :class="{'is-form-opened': $form.isOpened || $form.isOpenedHeader}">
<!-- 		<a @click="taplink.open({part: 'page', id: '1cb1c9'})" v-if="kurs && (i18n.locale == 'ru') && ($account.tariff == 'basic')" class="message has-text-centered" style="background: #cc5de8;color: #fff;font-size: 110%;margin: 0;border-radius: 0;text-decoration:none;padding: .7rem 0;z-index:1;display:block">Не знаешь как настроить таплинк? Получи бесплатный урок по настройке в Telegram</a> -->

<!-- 		<a class="message has-text-centered" :href="ratePlanLink" v-if="!$auth.isAllowTariff('pro') && window.$promotion" style="background: #000;color: #fff;font-size: 110%;margin: 0;border-radius: 0;text-decoration:none;padding: .7rem 0;z-index:1;display:block" v-html="window.$promotion.promotion_message"></a> -->
<!-- 		<a class="message has-text-centered" style="background: #000;color: #fff;font-size: 110%;margin: 0;border-radius: 0;text-decoration:none;padding: .7rem 0;z-index:1;display:block">С 29 июня 2020 года авторизация через Instagram больше не будет доступна. Авторизация будет доступна через электронную почту. Вы также можете подключить Facebook, Google или ВК для быстрого входа в систему.</a> -->
		

		<transition name="fade">
		<article class="message is-top-banner" v-if="$account.banner && isShowBanner" :class="$account.banner.classname">
			<header class="message-header" :style="{background: $account.banner.bg}">
			<div class="container">
				<a target="_blank" :href="$account.banner.link" @click="if ($account.banner.close == 'link') isShowBanner = false" v-html="$account.banner.title" style="font-weight: 400"></a>
				<button type="button" class="delete" @click="isShowBanner = false" v-if="$account.banner.close == 'button'"></button>
				<a :href="$account.banner.link" class="button" target="_blank" @click="isShowBanner = false" v-if="$account.banner.button" :class="$account.banner.button.classname" style="font-weight: 400">{{$account.banner.button.text}}</a>
			</div>	
			</header>
		</article>
		</transition>

		
		<header class="is-top is-auth">
		<div class="container">
			<div>
			<a @click.stop="menuOpen" class="menu-btn"><i class="fal fa-bars"></i><i :class="prepareHits()"></i></a>
			<span @click.stop="menuOpen" class="menu-title">{{title|gettext}}</span>
			
			<div class="scrolling-container">
				<div>
				<div class="menu">
					<router-link v-for="(m, index) in menu" :key="index" :to="{name: m.name, params: { page_id: page_id }}" :class="{active: isActiveMenu(m)}" v-if="m.meta && (m.meta.icon || m.meta.icon_svg)" @click.native="click"><svg :viewBox="checkViewBox(m.meta)" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" v-if="m.meta.icon_svg != undefined" v-html="m.meta.icon_svg"></svg><i :class="prepareHits(m)"></i><em :class="prepareIcon(m)" v-else></em><span>{{m.meta.title|gettext}}</span><dd :data-value="calcHits(m)" v-if="calcHits(m)"></dd></router-link>
				</div>
				</div>
			</div>
    
			<div class="menu-right">
<!-- 				v-tippy="{placement: 'left', content: 'Вопросы и ответы'}" -->
				<vue-component-help-button />

				<div class="header-choose-profile">
				<div class="a projects-menu" :class="{in: menuOpened}"> 
					<div @click.prevent.stop="menuOpened = false" class="background"></div>
					<div class="d" @click="if ($device.mobile) menuOpened = true"><img :src='$account.avatar.url' class="avatar"><i class="fa fa-angle-down is-hidden-mobile has-ml-1"></i></div> 
					<div class="ul">
						<div class="li is-first"><router-link :to="{name: 'profiles', params: {page_id: page_id}}" @click.native="click">{{'Мои профили'|gettext}}</router-link></div>
						<div class="li divider" v-if="$account.favourites.length"></div>
						<div class="menu-favourites">
						<div v-for="f in $account.favourites" class="li"><a class='profile' @click="$auth.changeProfile(f.profile_id)"><i class="fa fa-share-alt" v-if="f.is_share"></i><dd>{{f.nickname}}</dd></a></div>
						</div>
						
	
						<div class="li divider"></div>
						<div class="li"><router-link :to="{name: 'access', params: {page_id: page_id}}" @click.native="click">{{'Совместный доступ'|gettext}}</router-link></div>

						<div class="li divider"></div>
						<div class="li"><router-link :to="{name: 'account-settings', params: {page_id: page_id}}" @click.native="click">{{'Настройки аккаунта'|gettext}}</router-link></div>
						
	
						<div v-if="$account.manager_id">
							<div class="li divider"></div>
							<div class="li"><router-link :to="{name: 'manager', params: {page_id: page_id}}" @click.native="click">{{'Администрирование'|gettext}}</router-link></div>
						</div>
						
						<div v-if="$account.partner_id && $account.partner_id">
							<div class="li divider"></div>
							<div class="li"><router-link :to="{name: 'partner', params: {page_id: page_id}}" @click.native="click">{{'Партнерская программа'|gettext}}</router-link></div>
						</div>

						<div v-if="$account.appsumo_user_id">
							<div class="li divider"></div>
							<div class="li"><a href="/appsumo/">AppSumo</a></div>
						</div>

<!--
						<div v-if="i18n.locale == 'ru'">
							<div class="li divider"></div>
							<div class="li"><a @click="showAcademy">Академия Taplink</a></div>
						</div>
-->
	
						<div class="li divider"></div>
						<div><a :href="ratePlanLink">{{'Цены и тарифы'|gettext}}</a></div>
						<div class="li divider"></div>
						<div class="li is-last"><a @click="logout">{{'Выход'|gettext}}</a></div>
					</div>
				</div>
			</div>
			</div>
			</div>
			<div class="is-form-header">
				<div><h4 v-for="s in $form.stack">{{s.title}}</h4></div>
				<div class="buttons" v-if="$form.top"><button class="button is-light" @click="$form.close">Закрыть</button><button v-for="b in $form.top.buttons" class="button is-light" :class="b.classname" :disabled="b.disabled" @click="b.click">{{b.title}}</button></div>
			</div>
		</div>
		</header>
		<em></em> <!-- height: 60 fixed -->
		
		
<!-- 		<div class="message alert-header" v-if="$account.banner" :class="$account.banner.classname"><a target="_blank" :href="$account.banner.link" @click="$account.banner = null" v-html="$account.banner.title"></a></div> -->
		
		<div class="message is-warning alert-header" v-if="!($account.banner && isShowBanner) && !$auth.isAllowTariff('pro') && !$form.isOpened"><i class='fa fa-star-o'></i> {{'У вас базовый тариф'|gettext}}, <a :href='ratePlanLink' class="text-black">{{'обновить тариф'|gettext}}</a></div>
		<div v-else>
			<div class="message is-warning alert-header" v-if="$account.tariff_ends && $account.tariff_ends_days > 0 && $account.tariff_ends_days < 14"><i class='fal fa-exclamation-triangle has-mr-1'></i> <span v-html="tariffEndsMessage"></span></div>
		</div>
		
		<vue-component-submenu :page_id="page_id" />
		<vue-component-help-sidebar />
	</div>
`});

window.$app.defineComponent("index", "vue-index-pricing", {data() {
			return {
				currency: {title: '$', format: '%c%p', precision: 1, decimal: '.', thousands: ',', round: 1},
				prepaid: null,
				purpose: '',
// 				payment_method: null,
				features: [],
				isOpenInvoiceForm: false,
				
				details: {
					basic: Array.from('aaaaa'),
					pro: Array.from('aaaaaaaaa'),
					business: Array.from('aaaaaaaaaaaa')
				},
				
				plans: {
					basic: {price: 0},
					pro: {price: 0},
					business: {price: 0}
				},
								
				currentPeriod: 12,
				currentPlan: 'pro',
				isFetching: true,
				isFinished: false,
				isTrialActivating: false,
				isChoosing: null,
				isWaitingPayment: false,
				isWaitingLoading: false,
				
				counter: {from: {}, to: {}},
				intervalHeight: 0,
				promotion: null
			}
		},
		
		created() {
			this.$api.get('system/prices/get').then(d => {
				if (d.result == 'success') {
					let r = d.response;
					this.features = r.features;
					this.currency = r.currency;
					this.plans = r.plans;
					this.prepaid = r.prepaid;
// 					this.payment_method = r.payment_method;
					this.details = r.details;
					this.promotion = r.promotion;
					this.isFetching = false;
					
					this.storeCounter();
					this.counter.current = this.counter.to;
					
					this.$nextTick(() => {
						this.isFinished = true;
					})
				}
			})
			
			this.$io.on('events:account:refresh', this.planUpdated);
		},
		
		destroyed() {
			this.$io.off('events:account:refresh', this.planUpdated);
		},		
		
		computed: {
			periods() {
				return {
					3: {discount: 0, months: 3, text: 'квартал', title: '3 месяца', period: 3},
					6: {discount: 30, months: 3, text: 'полгода', title: '6 месяцев', period: 6},
					12: {discount: 50, months: 3, text: 'год', title: '12 месяцев', period: 12}
				}
			},
			
			current() {
				return this.periods[this.currentPeriod];
			},
			
			isLonglife() {
				return this.$account.trial_activated && !this.$account.tariff_until;
			}
		},
		
		watch: {
			currentPeriod(n, o) {
				this.storeCounter();
				_.each(this.plans, (p, name) => {
					let from = this.counter.from[name];
					let delta = (this.counter.to[name] - from) / 20;
					let i = 0;
					let j = setInterval(() => {
						this.counter.current[name] = from + (delta * i);
						this.$forceUpdate();
						if (++i == 10) {
							this.counter.current[name] = this.counter.to[name];
							this.$forceUpdate();
							clearInterval(j);
						}
					}, 10);
				})
			}
		},
		
		methods: {
			planUpdated() {
				this.isWaitingPayment = false;
			},
			
			storeCounter() {
				this.counter.from = this.counter.to;
				this.counter.to = {};
				
				_.each(this.plans, (p, name) => {
					this.counter.to[name] = this.newPricePerMonth(p)*this.currentPeriod;
				});
			},
			
			trialActivate() {
				this.isTrialActivating = true;
				this.$api.get('system/prices/trial').then(d => {
					if (d.result == 'success') {
						this.$auth.refresh(d.response);
					}
					
					this.isTrialActivating = false;
				}).catch(() => {
					this.isTrialActivating = false;
				});
			},
			
			choose(name) {
				if (name == 'pro' && this.$account.plan_paid == 'business') {
					return this.$modal('vue-index-downgrade-form');
				}

				let params = _.isObject(name)?name:{period: this.currentPeriod, tariff: name};
				this.isChoosing = params.tariff;
				
				this.$api.get('system/prices/order', params).then(d => {
					if (d.result == 'success') {
						let r = d.response;
						this.purpose = r.purpose;
						switch (r.payment_provider) {
							case 'paddle':
								if (r.info.error) {
									alert(r.info.error);
								} else {	
									this.isOpenInvoiceForm = true;	
									this.isWaitingLoading = true;
									
									this.$nextTick(() => {
										$mx.lazy('//cdn.paddle.com/paddle/paddle.js', () => {
											Paddle.Setup({ 
												vendor: parseInt(r.info.vendor_id),
												eventCallback: function(eventData) {
// 													console.log(eventData);
												}
											});
											
											
											Paddle.Checkout.open({
												method: 'inline',
												product: 554200,
												email: this.$account.user.email,
												frameTarget: 'checkout-container',
												frameInitialHeight: 300,
												frameStyle: 'width:100%; background-color: transparent; border: none;',
												override: r.info.url,
												closeCallback: (data) => {
													this.isChoosing = null;
													this.$auth.refresh();
												},
												loadCallback: (eventData) => {
													this.isWaitingLoading = false;
													this.intervalHeight = setInterval(() => {
														let iframe = $mx('.checkout-container iframe');
														iframe.css('height', iframe.attr('height'));
													}, 250);
												}
											});
										});
									});
								}
								break;
							case 'cloudpayments':
								$mx.lazy('//widget.cloudpayments.ru/bundles/cloudpayments', () => {
				    
								    let languages = {
									    'en_US': 'en-US',
									    'pt_BR': 'pt',
									    'es_ES': 'es'
								    }
								    
								    let language = (languages[r.info.language] == undefined)?'en-US':languages[r.info.language];
								    let widget = new cp.CloudPayments({language: language, googlePaySupport: true, applePaySupport: true});
								    
								    widget.charge({skin: "modern", publicId: r.info.public_id, amount: parseFloat(r.price), currency: r.currency_code, email: r.info.email, onSuccess: r.info.success, onFail: r.info.fail, invoiceId: r.order_id, domain: 'taplink.at', description: r.title},
								    (options) => { // success
										this.isChoosing = null;
// 										this.$auth.refresh();
// 								        document.location = d.onSuccess;
								    },
								    (reason, options) => { // fail
										this.isChoosing = null;
								    });
							    })
								break;
							case 'fastspring':
								window.fastspringWidgetClose = () => {
									this.isChoosing = null;
								}

								window.fastspringWidgetWebhook = () => {
									this.isWaitingPayment = true;
								}

								$mx.lazy('https://d1f8f9xcsvx3ha.cloudfront.net/sbl/0.8.3/fastspring-builder.min.js', null, () => {
									fastspring.builder.secure(r.info.payload.payload, r.info.payload.securekey);
									fastspring.builder.checkout();	
								}, {id: 'fsc-api', 'data-storefront': r.info.storefront, 'data-access-key': r.info.access_key, 'data-popup-closed': 'fastspringWidgetClose', 'data-popup-webhook-received': 'fastspringWidgetWebhook'});
							
								break;
							default:
								document.location = r.redirect;
								break;
						}
					} else {
						this.isChoosing = null;
					}
				});
			},
			
			closePaddle() {
				this.isOpenInvoiceForm = false;
				this.isChoosing = null;
				if (this.intervalHeight) {
					clearInterval(this.intervalHeight);
					this.intervalHeight = 0;
				}
			},
			
			openPromoForm(name) {
				this.$modal('vue-index-promocode-form', {period: this.currentPeriod, tariff: name}, this);
			},
			
			currencyFormat(name, p) {
				if (this.isFetching) return 999;
				let price = this.counter.current[name];
				return this.$currency(price - ((name == 'business')?this.prepaid:0), p.price?this.currency:Object.assign({}, this.currency, {precision: 0}), this.currency.format.replace('%p', '<span>%p</span>'));
			},
			
			prepaidTitle(name) {
				if (name != 'business' || !this.prepaid) return '';
				return '-'+this.$currency(this.prepaid, this.currency);
			},
			
			tippy(s, name, i) {
				return _.isArray(s)?{ placement : 'top-start', content: s[1], triggerTarget: this.$refs['id'+name+i][0]}:false;
				
			},
			
			payButtonTitle(name) {
				switch (name) {
					case 'pro':
						return (this.$account.plan_paid == 'business')?this.$gettext('Перейти на PRO'):((this.$account.plan_paid == 'pro')?this.$gettext('Продлить PRO'):this.$gettext('Оплатить PRO'));
						break;
					case 'business':
						return (this.$account.plan_paid == 'business')?this.$gettext('Продлить BUSINESS'):this.$gettext('Оплатить BUSINESS');
						break;
				}
			},
			
			priceRound(v) {
				let round = this.currency.round;
				if (round == 'floor') v = Math.floor(v);
				if (round == 'ceil') v = Math.ceil(v);
				
				if (!isNaN(this.currency.round)) {
					let p = Math.pow(10, this.currency.round);
					v = Math.round(v*p) / p;
				}
				
				return v;
			},
			
			newPricePerMonth(p) {
				let price = p.price - (p.price/100*this.current.discount)
				

				if (this.promotion) {
					old_price = price;
					price = price - (price/100*this.promotion.discount);
				} else {
					old_price = '';
				}

				
				price = this.priceRound(price);
				
				return price;
			}
		}, template: `
	<div>
		<div class="row">
			<div class="col-lg-8 col-md-8 col-sm-7 col-xs-12 has-mb-4" style="align-items:center;display:flex">
			
<!-- 			<h4 class="has-text-success has-text-centered-mobile" v-if="$account.profile_id && $account.trial_tariff" style="flex: 1">{{'Ваш {1} тариф активен до {2}'|gettext|format($account.trial_tariff.toUpperCase(), $date($account.tariff_until))}}</h4> -->
<!-- 			<div v-else style="align-items:center;display:flex"> -->
				
				
				<h4 class="has-text-centered-mobile has-text-success" style="flex: 1" v-if="$account.profile_id && $auth.isAllowTariff('pro') && !isWaitingPayment"><i class="fas fa-star has-text-yellow has-mr-1"></i>
					<span v-if="isLonglife">{{'У вас пожизненный {1} тариф'|gettext|format($account.tariff.toUpperCase())}}</span>
					<span v-else>{{'Ваш {1} тариф активен до {2}'|gettext|format($account.tariff.toUpperCase(), $date($account.tariff_until))}}</span>
				</h4>
				<div v-else>
					<h4 v-if="isWaitingPayment" class="has-text-centered-mobile has-text-warning"><i class="fas fa-spinner fa-pulse has-text-yellow has-mr-1"></i>{{'Ожидание оплаты'|gettext}}</h4>
					<span v-if="$auth.hasFeature('trial') && !isWaitingPayment" style="align-items:center;display:flex"><button @click="trialActivate" class="button is-success index-shadow is-fullwidth-mobile" :class="{'is-loading': isTrialActivating}" :disabled="$account.trial_activated">Start a 7-Day Free Trial</button> <span class="has-ml-1 has-text-grey is-hidden-mobile">No credit card required</span></span>
<!-- 					<h4 class="has-text-grey has-text-centered-mobile" style="flex: 1" v-else>{{'Выберите план, подходящий для вас'|gettext}}:</h4> -->
				</div>
<!-- 			</div> -->
			
			</div>
			<div class="col-lg-4 col-md-4 col-sm-5 col-xs-12 has-mb-4">
		
				<div class="field has-tabs-style is-marginless has-addons">
					<b-radio-button v-for="(p, i) in periods" v-model="currentPeriod" type="active" class="is-expanded" :native-value="p.period" :disabled="isFetching"><span>{{p.title|gettext}}</span><div class="hint" v-if="p.discount">-{{p.discount}}%</div></b-radio-button>
				</div>

				<div class="field has-tabs-style is-tabs-plans is-hidden-tablet has-mt-2 has-addons">
					<b-radio-button v-for="(p, n) in plans" v-model="currentPlan" type="active" class="is-expanded" :class="'is-'+n" :native-value="n" :disabled="isFetching"><span>{{n.toUpperCase()}}</span></b-radio-button>
				</div>
				
			</div>
		</div>		
		
		<div class="message has-text-centered has-mb-3" v-if="promotion" style="background: #000;color: #fff;font-size: 110%;margin: 0;border-radius: 0;text-decoration:none;padding: .7rem 0;z-index:1" v-html="promotion.promotion_description"></div>
	
		<div class="row row-small price-list">
			<div class="col-md-4 col-xs-12 col-sm-12 has-mb-2" :class="{'is-hidden-mobile': currentPlan != name}" v-for="(p, name) in plans">
				<div class="price-column" :data-plan="name">
					<div>
						<div>
						<div class="price-block has-pt-4 price-level" style="margin: 0;padding-bottom: 0 !important;border:0;line-height: 1">
							<h1>{{name.toUpperCase()}}</h1>
							<span class="priceTotal"><span class="new-price" :class="{skeleton: isFetching}" v-html="currencyFormat(name, p)" :data-prepaid-title="prepaidTitle(name)"></span></span>

						</div>
						<div class="price-block has-pb-2 price-level" style="padding-top: 0 !important">
							<p></p>
							<span class="has-text-grey price-total-period" :class="{skeleton: isFetching}">{{p.price?$gettext(current.text):'∞'}}</span>
						</div>
						<p class="price-block has-text-centered" v-if="p.price">
							<span class='has-text-centered priceMonthly'>
								<span class="old-price" v-if="p.price != newPricePerMonth(p)">{{p.price|currency(currency)}}/{{'мес'|gettext}}</span>
								<span class="new-price">{{newPricePerMonth(p)|currency(currency)}}/{{'мес'|gettext}}</span>
							</span>
						</p>
						<p class="price-block has-text-centered" v-else>
							<span>
							<div class="skeleton is-centered is-40" v-if="isFetching"></div>
							<span v-else>{{'Бесплатно навсегда'|gettext}}</span>
							</span>
						</p>
						
						<div v-if="!isFetching" style="padding-top: 1rem">
						<div class="price-item" v-for="(s, i) in details[name]" :ref="'id'+name+i">
							<em v-tippy="tippy(s, name, i)" v-if="isFinished && _.isArray(s)"></em><em v-else></em>
							<span v-if="_.isArray(s)">{{s[0]}}</span><span v-else>{{s}}</span>
						</div>
						</div>
						<div style="padding-top: 1rem" v-else>
							<div v-for="(s, i) in details[name]"><span class="skeleton" style="margin: 1rem" :style="{width: (30 + (Math.random() * 50))+'%'}"></span></div>
						</div>
					</div>
						<div class="price-block" style="border:0" v-if="$account.profile_id">
						<button class="button is-medium is-dark is-fullwidth index-shadow" style="padding-top: .75rem;padding-bottom:.75rem;height:auto" v-if="name == 'basic'" disabled="on"><span v-if="$account.tariff == name">{{'Ваш текущий тариф'|gettext}}</span><span v-else>{{'Бесплатно'|gettext}}</span></button>
						<button class="button is-medium is-fullwidth index-shadow" :class="{'is-loading': isChoosing == name, 'is-black': p.is_allow, 'is-dark': !p.is_allow}" style="padding-top: .75rem;padding-bottom:.75rem;height:auto" data-track-event='payment' @click="choose(name)" :disabled="!p.is_allow" v-else>{{payButtonTitle(name)}}<i class="fal fa-long-arrow-right index-button-arrow"></i></button>
<!-- 						<a class="button is-large is-success is-fullwidth index-shadow" href='{$path_prefix}/profile/auth/signin/' style="padding-top: 1rem;padding-bottom:1rem;height:auto">{'Зарегистрироваться'|gettext} <i class="fal fa-long-arrow-right index-button-arrow"></i></a> -->
						</div>
					</div>
					<div v-if="$account.profile_id" class="promocode-footer" :data-plan="name">	
						<a @click="openPromoForm(name)" class="linkPromo has-text-grey" :class="{'is-invisible': name == 'basic'}" :style="{visibility: p.is_allow?'visible':'hidden'}">{{'Активировать промокод'|gettext}}</a>
					</div>
				</div>
			</div>
		</div>
		<b-loading :active.sync="isWaitingPayment"></b-loading>
		
		
		<b-modal :active.sync="isOpenInvoiceForm" has-modal-card trap-focus :can-cancel="[]">
            <template #default="props">
			<div class="modal-card modal-card-little">
	            <header class="modal-card-head"><p class="modal-card-title">{{'Оплата'|gettext}}</p><button type="button" class="modal-close is-large" @click="closePaddle"></button></header>
	            <section class="modal-card-body has-text-black" style="padding: .5rem;position: relative;">
		            <h4 v-if="!isWaitingLoading" style="padding: 1rem 1rem 0 1rem">{{purpose}}</h4>
		            <div class="checkout-container"></div>
					<b-loading :active.sync="isWaitingLoading" :is-full-page="false"></b-loading>
	            </section>
				<div class="modal-card-foot">
					<button class="button is-dark" type="button" @click="closePaddle">{{'Закрыть'|gettext}}</button>
				</div>	
            </div>
            </template>
        </b-modal>

	</div>
`});

window.$app.defineComponent("index", "vue-index-promocode-form", {data() {
			return {
				isUpdating: false,
				response: {},
				values: {code: ''}
			}
		},
		
		mixins: [FormModel],
		props: ['period', 'tariff'],
		
		methods: {
			check() {
				this.isUpdating = true;
				this.$api.get('system/prices/promo', Object.assign({}, this.values, {period: this.period, tariff: this.tariff, action: this.response.promo_id?'submit':'check'}), this).then(d => {
					switch (d.result) {
						case 'success':
							this.response = d.response;
							break;
						case 'redirect':
							document.location = d.response.redirect;
							this.$parent.close();
							break;
						case 'choose':
							this.$parent.$parent.choose(d.response);
							this.$parent.close();
							break;
						case 'close':
							this.$parent.close();
							break;
						case 'refresh':
							this.$auth.refresh();
							this.$parent.close();
							break;
					}
					
					this.isUpdating = false;
				});
			},
			
			close() {
				if (this.response.promo_id) {
					this.response = {};
				} else {
					this.$parent.close();
				}
			}
		}, template: `
	<form class="modal-card modal-card-little" @submit.prevent="check">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Промокод'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()" type="button"></button>
		</header>
		<section class="modal-card-body">
			<b-field :label="'Укажите промокод'|gettext" :class="{'has-error': errors.code}" :message="errors.code">
				<input type="text" class="input" v-model.trim="values.code" :disabled="isUpdating" maxlength="16" :disabled="response.promo_id" v-focus>
			</b-field>
			
			<div v-if="response.promo_title" class="message" :class="{'is-success': response.is_allow, 'is-danger': !response.is_allow}" style="margin: 0"><div class="message-body" v-html="response.promo_title"></div></div>

		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="close"><span v-if="response.promo_id">{{'Отмена'|gettext}}</span><span v-else>{{'Закрыть'|gettext}}</span></button>
			<button class="button is-primary" type="submit" :class="{'is-loading': isUpdating}"><span v-if="response.promo_id">{{'Активировать'|gettext}}</span><span v-else>{{'Проверить'|gettext}}</span></button>
		</footer>
	</div>
`});
window.$app.defineModule("index", [{ path: '/', component: 'vue-index-index', name: 'index', children: [ 
	
	{ path: '/auth/', redirect: 'auth/signin/', name: 'auth', children: [
		{ path: 'signin/', component: 'vue-auth-signin', name: 'signin', props: {tab: 'signin'}},
		{ path: 'signup/', component: 'vue-auth-signin', name: 'signup' , props: {tab: 'signup'}},
		{ path: 'email/', component: 'vue-auth-email', name: 'email' },
		{ path: 'restore/', component: 'vue-auth-restore', name: 'restore' },
		{ path: 'attach/', component: 'vue-auth-attach', name: 'attach' },
		{ path: 'change/:username/', component: 'vue-auth-change', name: 'change', props: true }
	] },
	
	{ path: '/:page_id/', props: true, component: 'vue-index-main', name: 'main', children: [
		{ path: 'account/', redirect: 'account/settings/', name: 'account', meta: {title: 'Аккаунт'}, children: [
			{ path: 'profiles/', component: 'vue-account-profiles-list', props: true, name: 'profiles', meta: {title: 'Мои профили'}},
			{ path: 'access/', props: true, redirect: 'access/main/', name: 'access', meta: {title: 'Совместный доступ'}, children: [
				{ path: 'main/', component: 'vue-account-access-list', props: {part: 'main'}, name: 'access-main'},
				{ path: 'shared/', component: 'vue-account-access-list', props: {part: 'shared'}, name: 'access-shared'}
			]},
			{ path: 'settings/', component: 'vue-account-settings-form', props: true, name: 'account-settings', meta: {title: 'Настройки аккаунта'}}
		]},

		{ path: 'pages/', component: 'vue-pages-page', props: true, name: 'pages', meta: { title: 'Страница', icon_svg: '<path d="M76 160h40a12 12 0 0 0 12-12v-40a12 12 0 0 0-12-12H76a12 12 0 0 0-12 12v40a12 12 0 0 0 12 12zM0 224v208a48 48 0 0 0 48 48h416a48 48 0 0 0 48-48V224z" class="fa-secondary"/><path d="M464 32H48A48 48 0 0 0 0 80v144h512V80a48 48 0 0 0-48-48zM128 148a12 12 0 0 1-12 12H76a12 12 0 0 1-12-12v-40a12 12 0 0 1 12-12h40a12 12 0 0 1 12 12zm320 0a12 12 0 0 1-12 12H188a12 12 0 0 1-12-12v-40a12 12 0 0 1 12-12h248a12 12 0 0 1 12 12z"/>', tariff: 'basic', feature: 'taplink' }},
		{ path: 'pages/:back_page_id/', props: true, component: 'vue-pages-page', name: 'pages-back' },

		{ path: 'statistics/', component: 'vue-statistics-list', props: true, name: 'statistics', meta: { title: 'Статистика', icon_svg: '<path d="M512 400v32a16 16 0 0 1-16 16H32a32 32 0 0 1-32-32V80a16 16 0 0 1 16-16h32a16 16 0 0 1 16 16v304h432a16 16 0 0 1 16 16z" class="fa-secondary"/><path d="M275.2 96h-38.4c-6.4 0-12.8 6.4-12.8 12.8v198.4c0 6.4 6.4 12.8 12.8 12.8h38.4c6.4 0 12.8-6.4 12.8-12.8V108.8c0-6.4-6.4-12.8-12.8-12.8zm-96 128h-38.4c-6.4 0-12.8 6.4-12.8 12.8v70.4c0 6.4 6.4 12.8 12.8 12.8h38.4c6.4 0 12.8-6.4 12.8-12.8v-70.4c0-6.4-6.4-12.8-12.8-12.8zm288-160h-38.4c-6.4 0-12.8 6.4-12.8 12.8v230.4c0 6.4 6.4 12.8 12.8 12.8h38.4c6.4 0 12.8-6.4 12.8-12.8V76.8c0-6.4-6.4-12.8-12.8-12.8zm-96 96h-38.4c-6.4 0-12.8 6.4-12.8 12.8v134.4c0 6.4 6.4 12.8 12.8 12.8h38.4c6.4 0 12.8-6.4 12.8-12.8V172.8c0-6.4-6.4-12.8-12.8-12.8z"/>', icon_viewbox: '0 0 562 512', tariff: 'basic', access: 64, feature: 'taplink' }},
		{ path: 'billing/', component: 'vue-billing-index', props: true, name: 'billing'},


		{ path: 'inbox/', component: 'vue-inbox-index', props: true, name: 'typebot-inbox', meta: {title: 'Диалоги', icon_svg: '<g><path class="fa-secondary" d="M448 0H64A64.06 64.06 0 0 0 0 64v288a64.06 64.06 0 0 0 64 64h96v84a12 12 0 0 0 19.1 9.7L304 416h144a64.06 64.06 0 0 0 64-64V64a64.06 64.06 0 0 0-64-64zM128 240a32 32 0 1 1 32-32 32 32 0 0 1-32 32zm128 0a32 32 0 1 1 32-32 32 32 0 0 1-32 32zm128 0a32 32 0 1 1 32-32 32 32 0 0 1-32 32z"></path><path class="fa-primary"  d="M384 176a32 32 0 1 0 32 32 32 32 0 0 0-32-32zm-128 0a32 32 0 1 0 32 32 32 32 0 0 0-32-32zm-128 0a32 32 0 1 0 32 32 32 32 0 0 0-32-32z"></path></g>', icon_viewbox: '0 0 512 512', feature: 'typebot', submenu: false, access: 256} },
		{ path: 'chatbots/', component: 'vue-chatbots-index', props: true, name: 'chatbots', meta: {title: 'Автоматизация', icon_svg: '<path class="fa-secondary" d="M149.333 56v80c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24V56c0-13.255 10.745-24 24-24h101.333c13.255 0 24 10.745 24 24zm181.334 240v-80c0-13.255-10.745-24-24-24H205.333c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24h101.333c13.256 0 24.001-10.745 24.001-24zm32-240v80c0 13.255 10.745 24 24 24H488c13.255 0 24-10.745 24-24V56c0-13.255-10.745-24-24-24H386.667c-13.255 0-24 10.745-24 24zm-32 80V56c0-13.255-10.745-24-24-24H205.333c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24h101.333c13.256 0 24.001-10.745 24.001-24zm-205.334 56H24c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24h101.333c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24zM0 376v80c0 13.255 10.745 24 24 24h101.333c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H24c-13.255 0-24 10.745-24 24zm386.667-56H488c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H386.667c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24zm0 160H488c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H386.667c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24zM181.333 376v80c0 13.255 10.745 24 24 24h101.333c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H205.333c-13.255 0-24 10.745-24 24z"></path>', icon_viewbox: '0 0 512 512', feature: 'typebot', submenu: false, access: 1024} },
		{ path: 'subscribers/', component: 'vue-subscribers-index', props: true, name: 'typebot-subscribers', meta: {title: 'Аудитория', icon_svg: '<path d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z"></path>', icon_viewbox: '0 0 640 512', feature: 'typebot1', submenu: false} },


		{ path: 'sales/', redirect: 'sales/leads/', props: true, name: 'sales', meta: {title: 'Заявки', icon_svg: '<path d="M0 432a48 48 0 0 0 48 48h480a48 48 0 0 0 48-48V256H0zm192-68a12 12 0 0 1 12-12h136a12 12 0 0 1 12 12v40a12 12 0 0 1-12 12H204a12 12 0 0 1-12-12zm-128 0a12 12 0 0 1 12-12h72a12 12 0 0 1 12 12v40a12 12 0 0 1-12 12H76a12 12 0 0 1-12-12zM528 32H48A48 48 0 0 0 0 80v48h576V80a48 48 0 0 0-48-48z" class="fa-secondary"/><path d="M576 256H0V128h576z"/>', icon_viewbox: '0 0 576 512', tariff: 'business', feature: 'crm', access: 4 }},
		{ path: 'products/', redirect: 'products/active/', props: true, name: 'products', meta: {title: 'Товары', icon_svg: '<path d="M551.64 286.8a102.1 102.1 0 0 0 16.4-3.6V480a32 32 0 0 1-32 32H88a32 32 0 0 1-32-32V283.2a125.76 125.76 0 0 0 16.4 3.6 134.93 134.93 0 0 0 18 1.2 132.48 132.48 0 0 0 29.5-3.8V384h384v-99.8a126.88 126.88 0 0 0 29.5 3.8 139.07 139.07 0 0 0 18.24-1.2z" class="fa-secondary"/><path d="M605.94 118.6c33.6 53.6 3.8 128-59 136.4a102.81 102.81 0 0 1-13.7.9 99.07 99.07 0 0 1-73.8-33.1 98.82 98.82 0 0 1-147.6 0 98.82 98.82 0 0 1-147.6 0 98.74 98.74 0 0 1-73.8 33.1 103.92 103.92 0 0 1-13.7-.9c-62.6-8.5-92.3-82.9-58.8-136.4L82.84 15a32 32 0 0 1 27.1-15h404A32 32 0 0 1 541 15z"/>', icon_viewbox: '0 0 618 512', tariff: 'business', feature: 'taplink,products', access: 16} },


		{ path: 'courses/', redirect: 'courses/list/', props: true, name: 'courses-index', meta: {title: 'Обучение', icon_svg: '<g class="fa-group"><path class="fa-secondary" fill="currentColor" d="M608 217a95.26 95.26 0 0 0-64-25V64H96v128a95.28 95.28 0 0 0-64 25V49.59C32 22.25 53.53 0 80 0h480c26.47 0 48 22.25 48 49.59z" opacity="0.4"></path><path class="fa-primary" fill="currentColor" d="M576 384h-64a64 64 0 0 0-64 64v32a32 32 0 0 0 32 32h128a32 32 0 0 0 32-32v-32a64 64 0 0 0-64-64zm-32-32a64 64 0 1 0-64-64 64 64 0 0 0 64 64zm-192 32h-64a64 64 0 0 0-64 64v32a32 32 0 0 0 32 32h128a32 32 0 0 0 32-32v-32a64 64 0 0 0-64-64zm-224 0H64a64 64 0 0 0-64 64v32a32 32 0 0 0 32 32h128a32 32 0 0 0 32-32v-32a64 64 0 0 0-64-64zm192-32a64 64 0 1 0-64-64 64 64 0 0 0 64 64zm-224 0a64 64 0 1 0-64-64 64 64 0 0 0 64 64z"></path></g>', icon_viewbox: '0 0 640 512', feature: 'courses', submenu: false}, children: [ 
			{ path: 'list/', component: 'vue-courses-index', props: true, name: 'courses-list' },
			{ path: 'list/:course_id/', component: 'vue-courses-course', props: true, name: 'courses-course' }
		]},

		{ path: 'templates/', component: 'vue-templates-index', props: true, name: 'templates-inbox', meta: {title: 'Шаблоны', icon_svg: '<g class="fa-group"><path class="fa-secondary" fill="currentColor" d="M64,256h64V192H64Zm370.66-88.29h0L344.5,77.36a31.83,31.83,0,0,0-45-.07h0l-.07.07L224,152.88V424L434.66,212.9A32,32,0,0,0,434.66,167.71ZM64,128h64V64H64ZM480,320H373.09L186.68,506.51c-2.06,2.07-4.5,3.58-6.68,5.49H480a32,32,0,0,0,32-32V352A32,32,0,0,0,480,320Z" opacity="0.4"></path><path class="fa-primary" fill="currentColor" d="M160,0H32A32,32,0,0,0,0,32V416a96,96,0,0,0,192,0V32A32,32,0,0,0,160,0ZM96,440a24,24,0,1,1,24-24A24,24,0,0,1,96,440Zm32-184H64V192h64Zm0-128H64V64h64Z"></path></g>', icon_viewbox: '0 0 512 512', feature: 'templates', submenu: false} },

		{ path: 'design/', redirect: 'design/-1/', props: true, name: 'design1', meta: {title: 'Дизайн', icon_svg: '<path class="fa-secondary" d="M204.29 5c-99.4 19.4-179.5 99.29-199.1 198.4-37 187 131.7 326.39 258.8 306.69 41.2-6.4 61.4-54.59 42.5-91.69-23.1-45.4 9.9-98.4 60.9-98.4h79.7c35.8 0 64.8-29.6 64.9-65.31C511.49 97.13 368.09-26.87 204.29 5zM96 320a32 32 0 1 1 32-32 32 32 0 0 1-32 32zm32-128a32 32 0 1 1 32-32 32 32 0 0 1-32 32zm128-64a32 32 0 1 1 32-32 32 32 0 0 1-32 32zm128 64a32 32 0 1 1 32-32 32 32 0 0 1-32 32z" opacity="0.4"></path><path class="fa-primary" d="M96 256a32 32 0 1 0 32 32 32 32 0 0 0-32-32zm32-128a32 32 0 1 0 32 32 32 32 0 0 0-32-32zm128-64a32 32 0 1 0 32 32 32 32 0 0 0-32-32zm128 64a32 32 0 1 0 32 32 32 32 0 0 0-32-32z"></path>',  icon_viewbox: '0 0 512 512', feature: 'design', submenu: false, access: 128}, children: [
			{ path: ':group_id/', component: 'vue-design-index', props: true, name: 'design', meta: {title: 'Дизайн',  icon_viewbox: '0 0 512 512', feature: 'design', submenu: false}},
		]},

		{ path: 'addons/', redirect: 'addons/all/', props: true, name: 'addons', meta: {title: 'Модули', icon_svg: '<path d="M12.41 236.31L70.51 210l161.63 73.27a57.64 57.64 0 0 0 47.72 0L441.5 210l58.09 26.33c16.55 7.5 16.55 32.5 0 40L266.64 381.9a25.68 25.68 0 0 1-21.29 0L12.41 276.31c-16.55-7.5-16.55-32.5 0-40z" class="fa-secondary"/><path d="M12.41 148l232.94 105.7a25.61 25.61 0 0 0 21.29 0L499.58 148c16.55-7.51 16.55-32.52 0-40L266.65 2.32a25.61 25.61 0 0 0-21.29 0L12.41 108c-16.55 7.5-16.55 32.52 0 40zm487.18 216.11l-57.87-26.23-161.86 73.37a57.64 57.64 0 0 1-47.72 0L70.29 337.88l-57.88 26.23c-16.55 7.5-16.55 32.5 0 40L245.35 509.7a25.68 25.68 0 0 0 21.29 0l233-105.59c16.5-7.5 16.5-32.5-.05-40z"/>', icon_viewbox: '0 0 582 512', feature: 'addons', submenu: false, access: 128}},
		{ path: 'settings/', redirect: 'settings/common/', props: true, name: 'settings', meta: {title: 'Настройки', icon_svg: '<path d="M487.75 315.6l-42.6-24.6a192.62 192.62 0 0 0 0-70.2l42.6-24.6a12.11 12.11 0 0 0 5.5-14 249.2 249.2 0 0 0-54.7-94.6 12 12 0 0 0-14.8-2.3l-42.6 24.6a188.83 188.83 0 0 0-60.8-35.1V25.7A12 12 0 0 0 311 14a251.43 251.43 0 0 0-109.2 0 12 12 0 0 0-9.4 11.7v49.2a194.59 194.59 0 0 0-60.8 35.1L89.05 85.4a11.88 11.88 0 0 0-14.8 2.3 247.66 247.66 0 0 0-54.7 94.6 12 12 0 0 0 5.5 14l42.6 24.6a192.62 192.62 0 0 0 0 70.2l-42.6 24.6a12.08 12.08 0 0 0-5.5 14 249 249 0 0 0 54.7 94.6 12 12 0 0 0 14.8 2.3l42.6-24.6a188.54 188.54 0 0 0 60.8 35.1v49.2a12 12 0 0 0 9.4 11.7 251.43 251.43 0 0 0 109.2 0 12 12 0 0 0 9.4-11.7v-49.2a194.7 194.7 0 0 0 60.8-35.1l42.6 24.6a11.89 11.89 0 0 0 14.8-2.3 247.52 247.52 0 0 0 54.7-94.6 12.36 12.36 0 0 0-5.6-14.1zm-231.4 36.2a95.9 95.9 0 1 1 95.9-95.9 95.89 95.89 0 0 1-95.9 95.9z" class="fa-secondary"/><path d="M256.35 319.8a63.9 63.9 0 1 1 63.9-63.9 63.9 63.9 0 0 1-63.9 63.9z"/>', tariff: 'basic', 'access': 128}},
		{ path: 'partner/', redirect: 'partner/statistics/', component: 'vue-partner-index', props: true, name: 'partner', meta: {title: 'Партнерская программа', submenu: false}},
		{ path: 'manager/', redirect: 'manager/profiles/', props: true, name: 'manager'}
	]}
	
]}]);