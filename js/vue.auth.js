
window.$app.defineComponent("auth", "vue-auth-attach", {data() {
			return {
				state: ''
			}
		}, template: `
<section class="hero is-fullheight is-fullscreen is-auth-hero has-background-white">
	<div class="signin-header">
		<a :href="'{1}/'|format(window.base_path_prefix)" class="signin-header-logo"></a>
		
		<router-link class="button" :to="{name: 'signin'}">{{'Авторизация'|gettext}}</router-link>
	</div>

	<div class="hero-body has-p-1">
		<div style="width: 480px;margin: 0 auto" class="has-p-3">
			<div>
					<h1 class="has-mb-6 has-xs-mb-4 has-text-centered" style="font-size: 2.5rem;font-weight: bold;letter-spacing:-.06rem;">{{'Подключить Instagram профиль'|gettext}}</h1>
					<div class="message is-success">
						<div class="message-body">
							{{'Для подключения Instagram профиля вам необходимо авторизоваться через Instagram'|gettext}}
						</div>
					</div>
					<a type="button"class="button is-medium is-fullwidth is-light" :class="{'disabled': state == 'logging', 'is-loading': state == 'instagram'}" :href="'{1}/login/instagrambasic/'|format(window.base_path_prefix)" @click="state = 'instagram'"><i class="fab fa-ig"></i><span class="is-hidden-mobile has-ml-1">{{'Подключить через Instagram'|gettext}}</span></a>
			</div>
			
			<div class="row has-mt-3">
				<div class="col-xs-12 col-sm"><div class="has-text-left has-text-grey has-text-centered-mobile has-xs-mb-2">{{'Вернуться на'|gettext}} <router-link :to="{name: 'signin'}">{{'страницу входа'|gettext}}</router-link></div></div>
				<div class="col-xs col-sm-shrink has-text-right has-text-centered-mobile">
					<vue-component-locale-change></vue-component-locale-change>
				</div>
			</div>
			
		</div>
	</div>
</section>
`});

window.$app.defineComponent("auth", "vue-auth-change", {data() {
			return {
				avatar: '',
				isFetching: true,
				isLoading: false,
				allow: false,
				values: {email: '', code: '', state: '', password1: '', password2: ''}
			}
		},
		
		props: ['username'],
		
		mixins: [FormModel],
		
		computed: {
			avatarBg() {
				return this.isFetching?null:('background-image: url('+this.avatar+');background-size:100%');
			}
		},
		
		created() {
		    let params = getSearchParams();
		    
			this.$api.get('auth/avatar', {username: this.username}).then((d) => {
				if (d.result == 'success') {
					this.avatar = d.response.avatar;
					this.allow = d.response.allow;
					this.isFetching = false;
					
					if (params.email != undefined) {
						this.values.email = params.email;
						this.values.code = params.code;
						this.values.state = 'sent';
						this.submit();
					}
				} else {
					this.$router.replace({name: 'restore'});
				}
			});
		},
		
		methods: {
			submit() {
				this.isLoading = true;
				this.$api.post('auth/emailchange', Object.assign({username: this.username}, this.values), this).then((d) => {
					this.isLoading = false;
					
					if (d.result == 'success') {
						if (d.response.account != undefined) {
							return this.$auth.refresh(d.response.account, () => {
								this.$router.replace({name: 'pages', params: {page_id: this.$account.page_id}});
							});
						} else {
							this.values.state = d.response.values.state;
						}
					}
				});
			}
		}, template: `
<section class="hero is-fullheight is-fullscreen is-auth-hero has-background-white">
	<div class="signin-header">
		<a :href="'{1}/'|format(window.base_path_prefix)" class="signin-header-logo"></a>
		
		<router-link class="button" :to="{name: 'signin'}">{{'Авторизация'|gettext}}</router-link>
	</div>
		
	<div class="hero-body has-p-1">
		<div style="max-width: 450px;width: 450px;margin: 0 auto" class="has-p-3">
			<div>
				<div class="has-text-centered">
					<div class="profile-avatar profile-avatar-65 has-mb-2" :class="{skeleton: isFetching}" :style="avatarBg"></div>
<!-- 				<p class="is-40" style="margin: 0 auto" :class="{skeleton: isFetching}">{{username}}</p> -->
				</div>
				<h2 class="has-mb-4 has-text-centered" style="font-weight: bold"><div :class="{skeleton: isFetching, 'has-mb-1': isFetching}">{{'Смена электронной почты для {1}'|gettext|format(username)}}</span></h2>
<!-- 				<h3 class="has-mb-6 has-xs-mb-4 has-text-centered">{{'Смена электронной почты'|gettext}}</h3> -->
				<div v-if="allow">
<!--
					<transition name="fade">
					<div class="message is-success" v-if="values.state == 'sent'">
						<div class="message-body">
						{{'Мы отправили проверочный код на вашу электронную почту. Введите его и нажмите кнопку "Продолжить"'|gettext}}
						</div>
					</div>
					</transition>
-->
					<h4 class="has-text-grey has-text-centered has-mb-3" v-if="values.state == ''">{{'Какой у вас email?'|gettext}}</h4>
					<h4 class="has-text-grey has-text-centered has-mb-3" v-if="values.state == 'sent'">{{'Мы отправили его на {1}'|gettext|format(values.email)}}</h4>
					<h4 class="has-text-grey has-text-centered has-mb-3" v-if="values.state == 'pass'">{{'Придумайте пароль'|gettext}}</h4>
						

					<form @submit.prevent="submit">
						<b-field :class="{'has-error': errors.email}" :message="errors.email" v-if="values.state == ''">
				            <input type="email" v-model="values.email" class="input is-medium" :placeholder="'Электронная почта'|gettext" v-focus :disabled="values.state == 'sent' || values.state == 'pass' || isLoading" required></input>
						</b-field>
						
						<div :class="{'has-error': errors.code}" class="has-mb-3" v-if="values.state == 'sent'">
					        <div class="row has-mb-1" v-if="values.state == 'sent' || values.state == 'pass'">
					        	<div class="col-xs"><label class="label">{{'Проверочный код'|gettext}}</label></div>
								<div class="col-xs has-text-right"><a @click="values.state = ''" v-if="values.state != 'pass'">{{'Другая почта'|gettext}}</a></div>
					        </div>
		
							<b-field v-if="values.state == 'sent' || values.state == 'pass'" :message="errors.code">
								<vue-component-verifyfield v-model="values.code" type="tel"></vue-component-verifyfield>
							</b-field>
						</div>
						
						<b-field :class="{'has-error': errors.code}" :message="errors.code"  v-if="values.state == 'pass'">
				            <b-input :placeholder="'Новый пароль'|gettext" type="password" minlength="6" maxlength="40" v-model="values.password1" size="is-medium" :disabled="isLoading" ref="password" v-focus password-reveal icon-pack="fa" :has-counter="false"></b-input>
				        </b-field>
	
						<b-field :class="{'has-error': errors.code}" :message="errors.code"  v-if="values.state == 'pass'">
				            <b-input :placeholder="'Повторите новый пароль'|gettext" type="password" minlength="6" maxlength="40" v-model="values.password2" size="is-medium" :disabled="isLoading" password-reveal icon-pack="fa" :has-counter="false"></b-input>
				        </b-field>
						
							
						<button class="button is-medium is-fullwidth is-primary has-mb-3" :class="{'is-loading': isLoading, disabled: isFetching}" :disabled="isFetching">{{'Продолжить'|gettext}}</button>
					</form>
				</div>
				<div v-else>
					<div style="height: 4em;position: relative" v-if="isFetching">
						<div class="loading-overlay is-active"><div class="loading-icon"></div></div>
					</div>
					<div v-else>
					<div class="message is-success">
						<div class="message-body">
						{{'Для смены электронной почты вам необходимо подтвердить ваш аккуант. Вы можете сделать это через Instagram профиль.'|gettext|format(username)}}
						</div>
					</div>
					
					<a class="button is-medium is-fullwidth is-light has-mb-3" :class="{'is-loading': isLoading, disabled: isFetching}" :disabled="isFetching" :href="'{1}/login/instagrambasic/?method=attach&emailchange=1'|format(window.base_path_prefix, username)" @click="isLoading = true"><i class="fab fa-ig"></i><span class="has-ml-1">{{'Подтвердить через Instagram'|gettext}}</span></a>
					</div>
				</div>
			</div>
			
			<div class="row has-mt-3">
				<div class="col-xs-12 col-sm"><div class="has-text-left has-text-grey has-text-centered-mobile has-xs-mb-2">{{'Вернуться на'|gettext}} <router-link :to="{name: 'signin'}">{{'страницу входа'|gettext}}</router-link></div></div>
				<div class="col-xs col-sm-shrink has-text-right has-text-centered-mobile">
					<vue-component-locale-change></vue-component-locale-change>
				</div>
			</div>
		</div>
	</div>
</section>
`});

window.$app.defineComponent("auth", "vue-auth-email", {data() {
			return {
				isLoading: false,
				state: '',
				email: '',
				code: ''
			}
		},
		
		mixins: [FormModel],
		
		computed: {
			terms() {
				return this.$gettext('Я подтверждаю что ознакомлен и согласен с условиями <a %s>договора-оферты</a>').replace('%s', 'href="'+window.base_path_prefix+'/about/terms.html" target="_blank"');
			}
		},

		created() {
			this.toPage();
			
			if (this.profile_id == undefined) {
				window.$events.one('account:refresh', this.toPage);
			}
		},

		methods: {
			submit() {
				this.isLoading = true;
				
				switch (this.state) {
					case '':
						this.$api.post('auth/email/set', {email: this.email}, this).then((data) => {
							switch (data.result) {
								case 'found':
									this.state = 'found';
									break;
								case 'success':
									return this.updateProfile(data.response.account);
									break;
								default:
									break;
							}
							
							this.isLoading = false;
						});
						break;
					case 'found':
						this.$api.post('auth/email/send', {email: this.email}, this).then((data) => {
							if (data.result == 'success') {
								this.state = 'sent';
								this.$nextTick(() => {
									this.$refs.verify_input.focus();
								})
							}
							this.isLoading = false;
						});
						break;
					case 'sent':
						this.$api.post('auth/email/check', {email: this.email, code: this.code}, this).then((data) => {
							if (data.result == 'success') {
								this.updateProfile(data.response.account);
							} else {
								this.isLoading = false;
							}
						});
						break;
				}
			},
			
			toPage() {
				if (this.$account.profile_id && this.$account.user.email) {
					this.$router.replace({name: 'pages', params: {page_id: this.$account.page_id}});
				}
			},
			
			updateProfile(account) {
				this.$auth.refresh(account, () => {
					this.toPage();
				});
			}
		}, template: `
<section class="hero is-fullheight is-fullscreen is-auth-hero">
	<div class="hero-body has-p-1">
		<div class="col-xs-12 col-sm-8 col-sm-offset-2 col-lg-4 col-lg-offset-4 has-text-centered">
			<a :href="'{1}/'|format(window.base_path_prefix)"><img src="/s/i/logo/title-logo-grey.png?2" style="width:150px;height:36px;margin-bottom: 2rem" alt="Taplink"></a>
			<div style="background:#fff;background: var(--background-white-color);border-radius: 4px;border-top: 1px solid #0383de;border-color: var(--link-color);">
				<div class="has-p-3">
					<h4 class="has-mb-3">{{'Пожалуйста укажите вашу электронную почту'|gettext}}</h4>
					<div class="message is-warning" v-if="state == 'found'">
						<div class="message-body">
						{{'Ранее вы уже создали аккаунт с данной электронной почтой. Подтвердите владение аккаунтом введя проверочный код, отправленный на вашу почту'|gettext}}
						</div>
					</div>

					<div class="message is-success" v-if="state == 'sent'">
						<div class="message-body">
						{{'Мы отправили проверочный код на вашу электронную почту. Введите его и нажмите кнопку "Продолжить"'|gettext}}
						</div>
					</div>

					<form @submit.prevent="submit">
						<b-field :class="{'has-error': errors.email}" :message="errors.email">
				            <input :placeholder="'Электронная почта'|gettext" type="email" v-model="email" class="input is-medium" :class="{'disabled': isLoading || state != ''}" autofocus="on"></input>
				        </b-field>

						<b-field :class="{'has-error': errors.code}" :message="errors.code"  v-if="state == 'sent'">
				            <input :placeholder="'Проверочный код'|gettext" type="text" maxlength="6" v-model="code" class="input is-medium" :class="{'disabled': isLoading}" autofocus="on" ref="verify_input"></input>
				        </b-field>
				       
				        
				        <div class="row row-small" v-if="state == 'found' || state == 'sent'">
					        <div class="col-xs-12 col-sm-5 last-xs">
						        <button type="button" class="button is-medium is-fullwidth is-text has-text-no-underline" :class="{'disabled': isLoading}" @click="state = ''">{{'Другая почта'|gettext}}</button>
					        </div>
					        <div class="col-xs-12 col-sm-7 last-sm has-xs-mb-2">
						        <button type="submit" class="button is-medium is-primary is-fullwidth" :class="{'is-loading': isLoading}"><span v-if="state == 'found'">{{'Отправить проверочный код'|gettext}}</span><span v-else>{{'Продолжить'|gettext}}</span></button>
					        </div>
				        </div>
				        <button v-else type="submit" class="button is-primary is-medium is-fullwidth" :class="{'is-loading': isLoading}">{{'Продолжить'|gettext}}</button>
					</form>
					
					<div class="has-text-grey-light has-mt-3" v-if="state == ''">
						<span v-html="terms"></span>
					</div>
				</div>
			</div>
			<div class="level has-mt-2">
				<div class="level-left"></div>
				<div class="level-right">
					<vue-component-locale-change></vue-component-locale-change>
				</div>
			</div>
		</div>
	</div>
	</section>
`});

window.$app.defineComponent("auth", "vue-auth-restore", {data() {
			return {
				isLoading: false,
				withCaptcha: false,
				sitekey: null,
				username: '',
				email: '',
				code: '',
				password1: '',
				password2: '',
				state: 0,
				message: ''
			}
		},
		
		mixins: [FormModel],
		components: { VueRecaptcha },
		
/*
		computed: {
			emailProfileTitle() {
				return (this.state == 1)?this.$gettext('Профиль Instagram'):this.$gettext('Электронная почта или имя профиля Instagram');
			}
		},
*/
		
		created() {
		    let params = getSearchParams();
		    
		    if (params.email != undefined) {
				this.email = params.email;
				this.code = params.code;
				this.state = 3;
				this.submit();
			}		
		},

		methods: {
			doRecaptcha() {
				this.withCaptcha = true;
				this.isFetching = true;
				$mx.lazy('https://www.google.com/recaptcha/api.js?onload=vueRecaptchaApiLoaded&render=explicit', () => {
					setTimeout(() => {
						this.$refs.recaptcha.reset();
						this.$refs.recaptcha.execute();
					}, 250);
				});
			},
			
			submit() {
				this.internalSubmit(undefined);
			},
			
			internalSubmit(token) {
				this.isLoading = true;
				
				this.$api.post('auth/email/restore', {username: this.username, email: this.email, code: this.code, password1: this.password1, password2: this.password2, state: this.state, token: token}, this).then((data) => {
					if (data.result == 'success') {
						if (data.response.values != undefined) {
							this.state = data.response.values.state;
							this.email = data.response.values.email;
							this.message = data.response.values.message;
						}
						
						switch (this.state) {
							case 1:
								if (!this.message) this.$router.replace({name: 'change', params: {username: this.username.trim().toLowerCase()}});
								break;
							case 2:
								this.state = 3;
/*
								this.$nextTick(() => {
									this.$refs.verify_input.focus();
								});
*/
								break;
							case 3:
								this.state = 4;
/*
								this.$nextTick(() => {
									this.$refs.password.focus();
								});
*/
								break;
							case 4:
								return this.$auth.refresh(data.response.account, () => {
									this.$router.replace({name: 'pages', params: {page_id: this.$account.page_id}});
								});
								break;
						}
						
					} else if (data.result == 'challenge') {
						this.sitekey = data.response.sitekey;
						this.doRecaptcha();
					}
					
					this.isLoading = false;
				});
			}
		}, template: `
<section class="hero is-fullheight is-fullscreen is-auth-hero has-background-white">
	<vue-recaptcha ref="recaptcha" size="invisible" :sitekey="sitekey" badge="bottomleft" @verify="internalSubmit" @error="" v-if="withCaptcha"/>
	<div class="signin-header">
		<a :href="'{1}/'|format(window.base_path_prefix)" class="signin-header-logo"></a>
		
		<router-link class="button" :to="{name: 'signin'}">{{'Авторизация'|gettext}}</router-link>
	</div>

	<div class="hero-body has-p-1">
		<div style="width: 480px;margin: 0 auto" class="has-p-3">
			<div>
				<h2 class="has-mb-3 has-text-centered" style="font-weight: bold" v-if="state == 0">{{'Восстановление доступа'|gettext}}</h2> <!-- letter-spacing:-.06rem; -->
				<h2 class="has-mb-3 has-text-centered" style="font-weight: bold" v-if="state == 3">{{'Введите проверочный код'|gettext}}</h2>
				<h2 class="has-mb-3 has-text-centered" style="font-weight: bold" v-if="state == 1">{{'Какой у вас email?'|gettext}}</h2>
				<h2 class="has-mb-3 has-text-centered" style="font-weight: bold" v-if="state == 4">{{'Придумайте пароль'|gettext}}</h2>
				

				<div class="message is-success" v-if="state == 1">
					<div class="message-body" v-html="message"></div>
				</div>
				
<!--
				<transition name="fade">
				<div class="message is-success" v-if="state == 3">
					<div class="message-body">
					{{'Мы отправили проверочный код на вашу электронную почту. Введите его и нажмите кнопку "Продолжить"'|gettext}}
					</div>
				</div>
				</transition>
-->
				
				<h4 class="has-text-grey has-text-centered has-mb-4" v-if="state == 0">{{'Укажите email или имя профиля Instagram'|gettext}}</h4>
				
				<h4 class="has-text-grey has-text-centered has-mb-4" v-if="state == 3">{{'Мы отправили его на {1}'|gettext|format(email)}}</h4>
				
									
				<form @submit.prevent="submit" class="has-mb-2">
					<b-field :class="{'has-error': errors.username}" :message="errors.username" v-if="state == 0"> <!-- :label="emailProfileTitle"  -->
			            <input type="text" v-model="username" class="input is-medium" :disabled="isLoading" v-focus autocapitalize="off"></input>
			        </b-field>
			        
			        

					<div class="field" :class="{'has-error': errors.email}" v-if="state == 1">
				        <div class="row has-mb-1">
				        	<div class="col-xs"><label class="label">{{'Электронная почта'|gettext}}</label></div>
							<div class="col-xs has-text-right" v-if="state == 1"><router-link :to="{name: 'change', params: {username: username.trim().toLowerCase()}}">{{'Сменить почту'|gettext}}</router-link></div>
				        </div>
						<input type="text" v-model="email" class="input is-medium" :disabled="isLoading || state > 1" v-focus autocapitalize="off"></input>
						<p class="help" v-if="errors.email">{{errors.email}}</p>
<!-- 					        :message="errors.email" -->
			        </div>
			        
					<div :class="{'has-error': errors.code}" class="has-mb-3" v-if="state == 3">
						<div class="row has-mb-1">
							<div class="col-xs"><label class="label">{{'Проверочный код'|gettext}}</label></div>
							<div class="col-xs has-text-right"><a @click="state = 0">{{'Другая почта'|gettext}}</a></div>
						</div>
						<b-field :message="errors.code"> <!-- :label="'Проверочный код'|gettext" -->
							<vue-component-verifyfield v-model="code" :disabled="isLoading || state > 3"></vue-component-verifyfield>
	<!-- 			            <input :placeholder="'Проверочный код'|gettext" type="text" maxlength="6" v-model="code" class="input is-medium" :disabled="isLoading || state > 3" autofocus="on" ref="verify_input"></input> -->
				        </b-field>
					</div>

					<b-field :class="{'has-error': errors.code}" :message="errors.code"  v-if="state > 3">
			            <b-input :placeholder="'Новый пароль'|gettext" type="password" minlength="6" maxlength="40" v-model="password1" size="is-medium" :disabled="isLoading" ref="password" v-focus password-reveal icon-pack="fa" :has-counter="false"></b-input>
			        </b-field>

					<b-field :class="{'has-error': errors.code}" :message="errors.code"  v-if="state > 3">
			            <b-input :placeholder="'Повторите новый пароль'|gettext" type="password" minlength="6" maxlength="40" v-model="password2" size="is-medium" :disabled="isLoading" password-reveal icon-pack="fa" :has-counter="false"></b-input>
			        </b-field>
			        
			        <button type="submit" class="button is-primary is-medium is-fullwidth" :class="{'is-loading': isLoading}">{{'Продолжить'|gettext}}</button>
				</form>
			</div>
			
			<div class="row has-mt-3">
				<div class="col-xs-12 col-sm"><div class="has-text-left has-text-grey has-text-centered-mobile has-xs-mb-2">{{'Вернуться на'|gettext}} <router-link :to="{name: 'signin'}">{{'страницу входа'|gettext}}</router-link></div></div>
				<div class="col-xs col-sm-shrink has-text-right has-text-centered-mobile">
					<vue-component-locale-change></vue-component-locale-change>
				</div>
			</div>
			
		</div>
	</div>
</section>
`});

window.$app.defineComponent("auth", "vue-auth-signin", {data() {
			return {
				email: '',
				password: '',
				password1: '',
				password2: '',
				state: '',
// 				stateLast: '',
				confirm: true,
				code: '',
				alert: false,
				isFetching: false,
				sitekey: null,
				fingerprint: null,
				withCaptcha: false,
				captchaToken: '',
				twofactor: '',
				params: {}
			}
		},
		
		components: { VueRecaptcha },
		
		mixins: [FormModel],
		props: ['tab'],

		created() {
			this.toPage();
			
			if (this.$account.profile_id == undefined) {
				window.$events.one('account:refresh', this.toPage);
			}
			
/*
			$mx.lazy('https://cdnjs.cloudflare.com/ajax/libs/fingerprintjs2/2.1.0/fingerprint2.min.js', () => {
				let check = () => {
					Fingerprint2.get((components) => {
						let values = components.map(function (component) { return component.value })
						this.fingerprint = Fingerprint2.x64hash128(values.join(''), 31);
			        });
				}

				window.requestIdleCallback?check():setTimeout(check, 500);
			})
*/
			
			if (this.tab == 'signup' && this.withCaptcha) this.initReCaptcha();
		},
		
		mounted() {
			this.params = getSearchParams();
			
// 			const urlParams = new URLSearchParams(document.location.hash);
			
// 			const comeback = urlParams.get('comeback')
// 			console.log(comeback);
		    
		    if (this.params.code != undefined) {
				this.email = this.params.email;
				this.code = this.params.code;
				this.state = 'sent';
// 				this.signup();
			}			
		},
		
		watch: {
			tab(v) {
				this.state = '';
				if (v == 'signup' && this.withCaptcha) this.initReCaptcha();
			}
		},

		computed: {
			terms() {
				return this.$gettext('Я подтверждаю что ознакомлен и согласен с условиями <a %s>договора-оферты</a>').replace('%s', 'href="'+window.base_path_prefix+'/about/terms.html" target="_blank"');
			},
			localeRu() {
				return window.i18n.locale == 'ru';
			}	
		},
		
		methods: {
			initReCaptcha() {
				$mx.lazy('https://www.google.com/recaptcha/api.js?onload=vueRecaptchaApiLoaded&render=explicit');
			},
			
			changeTab(v) {
				this.tab = v;
				this.state = '';
				this.code = '';
				this.alert = false;
			},
			
			chooseState(v) {
				this.state = v;
				setTimeout(() => {
					this.state = '';
				}, 1250);
			},
			
			toPage() {
				if (this.$account.profile_id) {
					if (this.$account.user.email) {
// 						var m = document.location.hash.match(/#comeback:([a-zA-Z0-9\+\/\\\=]+)/);
// 						document.location.hash = document.location.hash.replace(/#paid:([a-zA-Z0-9]+)/, '');
// 						let location = Cookies.get('auth-redirect');
						if (this.params.comeback != undefined && this.params.comeback) {
							document.location = this.params.comeback;
// 							Cookies.remove('auth-redirect');
						} else {
							this.$router.replace({name: 'pages', params: {page_id: this.$account.page_id}});
						}
					} else {
						this.$router.replace({name: 'email'});
					}
				}
			},

			signup() {
// 				this.state = (['check', 'sent'].indexOf(this.state) != -1)?'check':'signup';
				if (this.withCaptcha) {
					this.isFetching = true;
					this.$refs.recaptcha.reset();
					this.$refs.recaptcha.execute();
				} else {
					this.internalSignup(null);
				}
			},

			doRecaptcha() {
				this.withCaptcha = true;
				this.isFetching = true;
				$mx.lazy('https://www.google.com/recaptcha/api.js?onload=vueRecaptchaApiLoaded&render=explicit', () => {
					setTimeout(() => {
						this.$refs.recaptcha.reset();
						this.$refs.recaptcha.execute();
					}, 250);
				});
			},
			
			verifyRecaptcha(token) {
				if (this.state == 'signin') {
					this.internalSignin(token);
				} else {
					this.internalSignup(token);
				}
			},

			internalSignup(token) {	

// 				this.state = (['check', 'sent', 'pass'].indexOf(this.state) != -1)?'check':'signup';
				this.isFetching = true;

				this.$api.post('auth/signup', {email: this.email, password1: this.password1, password2: this.password2, code: this.code, state: this.state, token: token, hash: this.fingerprint}, this).then((data) => {
					this.isFetching = false;
					if (data.result == 'success') {
						if (data.response.account != undefined) {
							this.$auth.session = data.response.session;
							this.$auth.refresh(data.response.account);
							this.toPage();
						} else {
							if (data.response.values.state == 'captcha') {
								this.sitekey = data.response.values.sitekey;
								this.doRecaptcha();
							} else {
								this.state = data.response.values.state;
							}
						}
					} else {
// 						this.state = (['check', 'sent'].indexOf(this.state) != -1)?'sent':'';
					}
				}).catch((e) => {
					this.isFetching = false;
				});
			},
			
			login() {
				this.internalSignin(null);
			},
			
			internalSignin(token) {
				this.state = 'signin';

				this.$api.post('auth/login', {email: this.email, password: this.password, token: token, twofactor: this.twofactor}, this).then((data) => {
					if (data.result == 'success') {
						this.$auth.session = data.response.session;
						this.$auth.refresh(data.response.account);
						this.toPage();
					} else if (data.result == 'challenge') {
						this.sitekey = data.response.sitekey;
						this.doRecaptcha();
					} else if (data.result == 'twofactor') {
						this.state = '';
						this.$challenge({account_token: data.response.account_token}).then((code) => {
							this.twofactor = code;
							this.internalSignin(token);
						})
					} else {
						this.state = '';
					}
				}).catch(() => {
					this.state = '';
				});
			}
		}, template: `
<section class="hero is-fullheight is-fullscreen is-auth-hero has-background-white">
	<vue-recaptcha ref="recaptcha" size="invisible" :sitekey="sitekey" badge="bottomleft" @verify="verifyRecaptcha" @error="" v-if="withCaptcha"/>
	
	<div class="signin-header">
		<a :href="'{1}/'|format(window.base_path_prefix)" class="signin-header-logo"></a>
		
		<router-link class="button" :to="{name: 'signup'}" v-if="tab == 'signin'">{{'Регистрация'|gettext}}</router-link>
		<router-link class="button" :to="{name: 'signin'}" v-if="tab == 'signup'">{{'Авторизация'|gettext}}</router-link>
	</div>
	
	<div class="hero-body has-p-1">
		<div style="width: 480px;margin: 0 auto" class="has-p-3">
			<div v-if="tab == 'signin'">
				<h1 class="has-mb-6 has-xs-mb-4 has-text-centered" style="font-size: 2.5rem;font-weight: bold;letter-spacing:-.06rem;">{{'Авторизация'|gettext}}</h1>
			</div>
			<div v-if="tab == 'signup'">
				<h1 class="has-mb-6 has-xs-mb-4 has-text-centered" style="font-size: 2.5rem;font-weight: bold;letter-spacing:-.06rem;" v-if="state == ''">{{'Регистрация'|gettext}}</h1>
				<h2 class="has-mb-4 has-text-centered" v-if="state =='sent'" style="font-weight: bold">{{'Введите проверочный код'|gettext}}</h2>
				<h2 class="has-mb-4 has-text-centered" style="font-weight: bold" v-if="state == 'pass'">{{'Придумайте пароль'|gettext}}</h2>
			</div>
			
			<div v-if="alert">
				<div class="message is-warning">
					<div class="message-body">
						<h4 style="font-weight: 600">{{'Внимание'|gettext}}</h4>
<!-- 						{{'Скоро Instagram прекратит поддержку авторизации для сайтов. Для того чтобы иметь возможность входа после 29 июня, вам необходимо в настройках аккаунта подключить вход через Facebook, Google или ВК либо указать email и пароль для входа.'|gettext}} -->
						{{'Вход через Instagram больше не доступен, вы можете подключить свою электронную почту для авторизации, используя форму «Восстановление доступа»'|gettext}}
					</div>
				</div>
				<router-link class="button is-medium is-fullwidth is-light has-mb-3" :to="{name: 'restore'}">{{'Восстановить доступ'|gettext}}</router-link>
<!-- 				<a type="button" class="button is-medium is-fullwidth is-light has-mb-3" :class="{'disabled': state && state != 'instagram', 'is-loading': state == 'instagram'}" :href="'{1}/login/instagram/'|format(window.base_path_prefix)" @click="chooseState('instagram')"><i class="fab fa-ig"></i><span class="has-ml-1">{{'Войти через Instagram'|gettext}}</span></a> -->
<!-- 				<h4 class="has-text-centered has-mb-2">Используйте кнопки ниже для быстрого входа</h4> -->
				<a class="has-text-black" @click="alert = false"><h4 class="has-text-centered"><i class="fal fa-long-arrow-left has-mr-2"></i> {{'Назад'|gettext}}</h4></a>
			</div>
			
			<div v-if="!alert">
				<div class="row row-small">
					
					<div class="col-xs" v-if="tab == 'signin'">
						<a type="button"class="button is-medium is-fullwidth is-light" :class="{'disabled': state}" @click="alert = true"><i class="fab fa-ig"></i><span class="is-hidden-mobile has-ml-1"></span></a>
<!-- 						<a type="button" class="button is-medium is-fullwidth is-light" :class="{'disabled': state && state != 'instagram', 'is-loading': state == 'instagram'}" :href="'{1}/login/instagram/'|format(window.base_path_prefix)" @click="chooseState('instagram')"><i class="fab fa-ig"></i><span class="is-hidden-mobile has-ml-1">instagram</span></a> -->
					</div>
					<div class="col-xs">
						<a type="button" class="button is-medium is-fullwidth is-light" :class="{'disabled': state && state != 'facebook', 'is-loading': state == 'facebook'}" :href="'{1}/login/facebook/'|format(window.base_path_prefix)" @click="chooseState('facebook')"><i class="fab fa-fb-o"></i><!-- <span class="is-hidden-mobile has-ml-1">Facebook</span> --></a>
					</div>
					<div class="col-xs">
						<a type="button" class="button is-medium is-fullwidth is-light" :class="{'disabled': state && state != 'google', 'is-loading': state == 'google'}" :href="'{1}/login/google/'|format(window.base_path_prefix)" @click="chooseState('google')"><i class="fab fa-g"></i><!-- <span class="is-hidden-mobile has-ml-1">Google</span> --></a>
					</div>
					<div class="col-xs" v-if="localeRu">
						<a type="button" class="button is-medium is-fullwidth is-light" :class="{'disabled': state && state != 'vkontakte', 'is-loading': state == 'vkontakte'}" :href="'{1}/login/vkontakte/'|format(window.base_path_prefix)" @click="chooseState('vkontakte')"><i class="fab fa-vk" style="font-size: 1.9rem"></i><!-- <span class="is-hidden-mobile has-ml-1">ВКонтакте</span> --></a>
					</div>
				</div>
				
				<div class="hr has-mb-5 has-mt-6 has-xs-mt-4 has-xs-mb-3 has-text-centered" :data-title="'Или'|gettext"></div>
					<form @submit.prevent="login" v-if="tab == 'signin'">
						<b-field :label="'Электронная почта'|gettext">
				            <b-input type="email" v-model="email" size="is-medium" :class="{'disabled': state != ''}" autofocus="on" tabindex="1"></b-input>
				        </b-field>
				        
				        <div class="has-mb-4">
					        <div class="row has-mb-1">
					        	<div class="col-xs"><label class="label">{{'Пароль'|gettext}}</label></div>
								<div class="col-xs has-text-right"><router-link :to="{name: 'restore'}" :class="{'disabled': state != ''}">{{'Восстановить доступ'|gettext}}</router-link></div>
					        </div>
				            <b-input type="password" v-model="password" size="is-medium" :class="{'disabled': state != ''}" tabindex="2" password-reveal icon-pack="fa" :has-counter="false"></b-input>
				        </div>
						
				        <button type="submit" class="button is-primary is-medium is-fullwidth" :class="{'is-loading': state == 'signin', 'disabled': state == 'instagram'}">{{'Войти'|gettext}}</button>
					</form>
		
					<div v-if="tab == 'signup'">
					<form @submit.prevent="signup">
<!--
						<div class="message is-success" v-if="state == 'sent' || state == 'check'">
							<div class="message-body">
							{{'Мы отправили проверочный код на {1}'|gettext|format(email)}}
							</div>
						</div>
-->
						
						<h4 class="has-text-grey has-text-centered has-mb-4" v-if="state == 'sent' || state == 'check'">{{'Мы отправили его на {1}'|gettext|format(email)}}</h4>
						
						<b-field :label="'Какой у вас email?'|gettext" :class="{'has-error': errors.email}" :message="errors.email" v-if="state == ''">
				            <input type="email" v-model="email" :placeholder="'Электронная почта'|gettext" class="input is-medium" :disabled="isFetching" autofocus="on"></input>
				        </b-field>
				        
						<b-field :class="{'has-error': errors.code}" :message="errors.code"  v-if="state == 'sent' || state == 'check'"> <!-- :label="'Проверочный код'|gettext" -->
							<vue-component-verifyfield v-model="code" :disabled="state == 'check' || isFetching" @keydown="errors.code = null" type="tel"></vue-component-verifyfield>
<!-- 				            <input :placeholder="'Проверочный код'|gettext" type="text" maxlength="6" v-model="code" class="input is-medium" :class="{'disabled': state == 'check'}" autofocus="on" ref="verify_input"></input> -->
				        </b-field>
				        
						<b-field :class="{'has-error': errors.code}" :message="errors.code"  v-if="state == 'pass'">
				            <b-input :placeholder="'Пароль'|gettext" type="password" minlength="6" maxlength="40" v-model="password1" size="is-medium" :disabled="isFetching" v-focus password-reveal icon-pack="fa" :has-counter="false" v-focus></b-input>
				        </b-field>
	
						<b-field :class="{'has-error': errors.code}" :message="errors.code"  v-if="state == 'pass'">
				            <b-input :placeholder="'Повторите пароль'|gettext" type="password" minlength="6" maxlength="40" v-model="password2" size="is-medium" :disabled="isFetching" password-reveal icon-pack="fa" :has-counter="false"></b-input>
				        </b-field>
		
			            <div class="field" v-if="state != 'sent' && state == 'pass'">
							<label class="checkbox"><input type="checkbox" v-model="confirm" :disabled="isFetching"><span v-html="terms"></span></label>
			            </div>
						
<!-- 						 || (!fingerprint) -->
				        <button type="submit" class="button is-primary is-medium is-fullwidth" :class="{'is-loading': isFetching, 'disabled': state == 'instagram'}" :disabled="!confirm">{{'Продолжить'|gettext}}</button>
					</form>
				</div>
				
				<div class="row has-mt-3">
					<div class="col-xs is-hidden-mobile" v-if="tab == 'signin'">{{'Нет аккаунта?'|gettext}} <router-link :to="{name: 'signup'}">{{'Регистрация'|gettext}}</router-link></div>
					<div class="col-xs is-hidden-mobile" v-if="tab == 'signup'">{{'Есть аккаунт?'|gettext}} <router-link :to="{name: 'signin'}">{{'Авторизация'|gettext}}</router-link></div>
					<div class="col-xs col-sm-shrink has-text-centered">
						<vue-component-locale-change></vue-component-locale-change>
					</div>
				</div>
				
			</div>
		</div>
	</div>
</section>
`});
window.$app.defineModule("auth", []);