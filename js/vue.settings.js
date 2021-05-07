
window.$app.defineComponent("settings", "vue-settings-common", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				is_active_onlinekassa: false,
				variants: {time_zones: [], languages: [], currencies: [], unit_systems: {m: '', i: ''}, weight_units: {m: {h: null, l: null}, i: {h: null, l: null}}},
				values: {utc_timezone: 5, language_id: 0, currency_code: '', is_hidelink: false, options: {unit_system: 'm', weight: {unit: 'h'}, seo: {title: '', description: ''}}},
				errors: {},
				fractional_prices: true
			}
		},
		
		mixins: [FormModel],

		created() {
			this.fetchData();
		},
		
		watch: {
			fractional_prices(v) {
				this.values.options.currency.precision = v?2:0;
			}
		},
		
		computed: {
			tariff() {
				return this.$account.tariff;
			},
			
			seoTitlePlaceholder() {
				let a = this.$account;
				function capitalizeFirstLetter(s) {
					return s.charAt(0).toUpperCase() + s.slice(1);
				}
				return a.custom_domain_verified?a.custom_domain:((a.nickname?capitalizeFirstLetter(a.nickname):('id:'+a.profile_id))+' at Taplink');
			},
			
			disallow() {
				return {
					pro: !this.$auth.isAllowTariff('pro'),
					business: !this.$auth.isAllowTariff('business'),
				}
			}
			
/*
			filteredCurrency() {
				return _.filter(this.variants.currencies, (option) => {
                    return option
                        .toString()
                        .toLowerCase()
                        .indexOf(this.values.currency_code.toLowerCase()) >= 0
                });
			}
*/
		},

		methods: {
			fetchData() {
				this.isFetching = true;
				this.$api.get('settings/common/get').then((data) => {
					this.isFetching = false;
					let c = data.response.common;
					
					this.variants = c.variants;
					this.values = c.values;
					this.fractional_prices = this.values.options.currency.precision == 2;
					this.is_active_onlinekassa = c.is_active_onlinekassa;

					this.fetchTimezones();
				});
			},
			
			fetchTimezones() {
				this.variants.time_zones = [];
				var d = new Date();
				var utc = d.getTimezoneOffset() / 60;
				var t = d.getTime();
				for (var i = -12; i <= 13; i++) {
					
					let times = [];
					switch (i) {
						case 4:
						case 5:
						case 6:
						case 9:
						case 10:
							times = [i, i+.5];
							break;
						case -9:
						case -2:
						case -3:
							times = [i-.5, i];
							break;
						case 5:
						case 8:
						case 12:
						case 13:
							times = [i, i+.75];
							break;
						default:
							times = [i];
							
					}
					
					_.each(times, y => {
						d.setTime(t - (-utc - y) * 3600 * 1000);
						let fraction = (y - Math.floor(y));
						this.variants.time_zones.push({key: y, title: this.$datetime(d)+', (Etc/GMT'+((y >= 0)?'+':'-')+((Math.abs(y) < 10)?'0':'')+Math.floor(Math.abs(y))+':'+(fraction?(fraction*60):'00')+')'});//.str_pad(abs($i), 2, '0', STR_PAD_LEFT).':00)';
					})
				}
			},
			
			updateData(part) {
				this.isUpdating = true;
				this.$api.post('settings/common/set', Object.assign({part: part}, this.values), this).then((data) => {
					this.errors = (data.result == 'fail')?data.errors:{};
					if (data.result == 'success') {
						this.fetchData();
						this.$auth.refresh();
					}
					
					this.isUpdating = false;
				});
			}
		}, template: `
	<div class='has-mb-4 has-mt-4 has-xs-mb-3 has-xs-mt-3'>
		<div class="container">
			<div class="row has-mb-2-mobile">
				<div class="col-xs-12 col-sm-4">
					<h3 class="has-mb-1">{{'Настройки страницы'|gettext}}</h3>
					<div class="has-text-grey has-mb-2 is-hidden-mobile">{{'Настройка интерфейса и локализация страницы'|gettext}}</div>
				</div>
				<div class="col-xs-12 col-sm-8">
					<div class="panel panel-default">
		<!-- 			<mx-item class="mx-item-header"><div class="item-row row"><div class="col-sm-12 has-text-centered">{{'Общие настройки'|gettext}}</div></div></mx-item> -->
						<div class="has-p-2">
							<div class="row">
						<div class="col-xs-12 col-sm-6 has-mb-3">
							<b-field :label="'Текущее время'|gettext">
								<b-select v-model="values.utc_timezone" :disabled="isUpdating" expanded>
					                <option v-for="v in variants.time_zones" :value="v.key">{{ v.title }}</option>
					            </b-select>
							</b-field>
						</div>
						<div class="col-xs-12 col-sm-6 has-mb-3">
							<b-field :label="'Язык страницы'|gettext">
							<b-select v-model="values.language_id" :disabled="isUpdating" expanded>
				                <option v-for="(v, k) in variants.languages" :value="k">{{ v }}</option>
				            </b-select>
							</b-field>
						</div>
					</div>
					<div class="row">
						<div class="col-xs-12 col-sm-6">
							<div class="label-pro-container">
								<div v-if="disallow.pro" class="tag is-pro" v-tippy :content="'Эта возможность доступна<br>на pro тарифе'|gettext">pro</div>
								<b-field :label="'Facebook Pixel ID'|gettext" class="has-mb-3" :class="{disabled: disallow.pro}">
									<b-input type="number" v-model="values.facebook_pixel" :disabled="isUpdating || disallow.pro"></b-input>
								</b-field>
							</div>
						</div>
						
						<div class="col-xs-12 col-sm-6">
		
							<div class="label-pro-container">
							<div v-if="disallow.business" class="tag is-business" v-tippy :content="'Эта возможность доступна на Business тарифе'|gettext">biz</div>
							<b-field :label="'Валюта'|gettext" class="has-mb-3" :class="{disabled: disallow.business}" :type="((is_active_onlinekassa && (values.currency_code != 'RUB')) || (errors.currency_code != undefined))?'is-danger':''" :message="(is_active_onlinekassa && (values.currency_code != 'RUB'))?'Онлайн касса отправляет чеки только с продаж в рублях':((errors.currency_code != undefined)?errors.currency_code:'')">
		<!--
							<b-select v-model="values.currency_id" :disabled="isUpdating" expanded>
				                <option v-for="(v, k) in variants.currencies" :value="k">{{ v }}</option>
				            </b-select>
		-->
				            
				            <b-autocomplete v-model="values.currency_code" field="currency_code" open-on-focus="true" :data="variants.currencies" class="select is-fullwidth" :disabled="isUpdating || disallow.business">
				            <template slot-scope="props">
					            {{props.option.title}}
				            </template>
							<template slot="empty">{{'Ничего не найдено'|gettext}}</template>
				            </b-autocomplete>
		
		<!--
				                field="user.first_name"
				                @select="option => selected = option">
		-->
							</b-field>
							
							</div>
						</div>
						
						
						<div class="col-xs-12 col-sm-6 has-mb-2-mobile last-sm" :class="{disabled: disallow.business}">
							<label class="checkbox" :disabled="isUpdating">
								<input v-model="fractional_prices" type="checkbox">{{'Дробные цены'|gettext}}
							</label>
						</div>
						
						<div class="col-xs-12 col-sm-6">
						<div>
							<div class="label-pro-container">
								<div v-if="disallow.business" class="tag is-business is-middle" v-tippy :content="'Эта возможность доступна на Business тарифе'|gettext">biz</div>
								<div :class="{disabled: disallow.business}">
									<label class="checkbox" :disabled="isUpdating">
										<input v-model="values.is_hidelink" type="checkbox" :disabled="disallow.business">{{'Скрыть логотип Taplink на странице'|gettext}}
									</label>
								</div>
							</div>
						</div>
						</div>

						
					</div>
						</div>
					
		<!--
					<mx-item class="mx-item-footer">
						<button type="button" class="button is-primary is-fullwidth-mobile" :class="{'is-loading': isUpdating}" @click="updateData" :disabled="isUpdating">{{'Сохранить изменения'|gettext}}</button>
					</mx-item>
		-->
						<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
					</div>
				</div>
			</div>
			
			<div v-if="$auth.hasFeature('products')">
			<hr class="is-hidden-mobile">
			
			<div class="row has-mb-2-mobile">
				<div class="col-xs-12 col-sm-4">
					<div class="label-pro-container">
					<div v-if="disallow.business" class="tag is-business is-middle" v-tippy :content="'Эта возможность доступна на Business тарифе'|gettext">biz</div>
						<h3 class="has-mb-1">{{'Стандарты и форматы'|gettext}}</h3>
					</div>
					<div class="has-text-grey has-mb-2 is-hidden-mobile">{{'Стандарты и форматы используются для веса товаров'|gettext}}</div>
				</div>
				<div class="col-xs-12 col-sm-8">
					<div class="panel panel-default has-p-2">
						<div class="row">
							<div class="col-xs-12 col-sm-6 has-xs-mb-3">
								<b-field :label="'Система единиц'|gettext" :class="disallow.business">
									<b-select v-model="values.options.unit_system" :disabled="isUpdating || disallow.business" expanded>
						                <option v-for="(v, i) in variants.unit_systems" :value="i">{{v|gettext}}</option>
						            </b-select>
								</b-field>
							</div>
							<div class="col-xs-12 col-sm-6">
								<b-field :label="'Единица измерения веса'|gettext" :class="{disabled: disallow.business}">
									<b-select v-model="values.options.weight.unit" :disabled="isUpdating || disallow.business" expanded>
						                <option v-for="(v, i) in variants.weight_units[values.options.unit_system]" :value="i">{{v|gettext}}</option>
						            </b-select>
								</b-field>
							</div>
						</div>
						<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
					</div>
				</div>
			</div>
			</div>
			
			<hr class="is-hidden-mobile">
			
			<div class="row has-mb-2-mobile">
				<div class="col-xs-12 col-sm-4">
					<div class="label-pro-container">
					<div v-if="disallow.business" class="tag is-business is-middle" v-tippy :content="'Эта возможность доступна на Business тарифе'|gettext">biz</div>
						<h3 class="has-mb-1">{{'Доменное имя'|gettext}}</h3>
					</div>
					<div class="has-text-grey has-mb-2 is-hidden-mobile">{{'Вы можете подключить свой домен к странице'|gettext}}</div>
				</div>
				<div class="col-xs-12 col-sm-8">
					<div class="panel panel-default has-p-2">
						<label class="label">{{'Укажите имя домена'|gettext}}</label>
						<vue-component-domain-attach :disabled="disallow.business"></vue-component-domain-attach>
					</div>
				</div>
			</div>
			
			<hr class="is-hidden-mobile">
			
			<div class="row has-mb-2-mobile">
				<div class="col-xs-12 col-sm-4">
					<div class="label-pro-container">
						<div v-if="disallow.pro" class="tag is-pro is-middle" v-tippy :content="'Вставка HTML кода<br>доступна на PRO тарифе'|gettext">pro</div>
						<h3 class="has-mb-1">{{'Вставка HTML кода'|gettext}}</h3>
					</div>
					<div class="has-text-grey has-mb-2 is-hidden-mobile">{{'Обычно HTML код используется для вставки виджетов и интеграций других сервисов'|gettext}}</div>
				</div>
				<div class="col-xs-12 col-sm-8">
					<div class="panel panel-default">
						<vue-component-codemirror v-model="values.options.html" :disabled="isUpdating || disallow.pro"></vue-component-codemirror>
						<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
					</div>
				</div>
			</div>
			
			<hr class="is-hidden-mobile">
			<div class="row has-mb-2-mobile">
				<div class="col-xs-12 col-sm-4">
					<div class="label-pro-container">
					<div v-if="disallow.pro" class="tag is-pro is-middle" v-tippy :content="'Эта возможность доступна на PRO тарифе'|gettext">pro</div>
						<h3 class="has-mb-1">{{'SEO'|gettext}}</h3>
					</div>
					<div class="has-text-grey has-mb-2 is-hidden-mobile">{{'Управляйте отображением сайта в поисковых системах'|gettext}}</div>
				</div>
				<div class="col-xs-12 col-sm-8">
					<div class="panel panel-default has-p-2">
						<b-field :label="'Заголовок страницы'|gettext" :class="{disabled: disallow.pro}">
						<div class="control">
							<input type="text" class="input" maxlength="180" :disabled="isUpdating || disallow.pro" v-model="values.options.seo.title" :placeholder="seoTitlePlaceholder">
							<p class="has-mt-1 has-text-grey">{{'Отображается в названии вкладки браузера и в результатах поисковых систем'|gettext}}</p>
						</div>
						</b-field>
						<b-field :label="'SEO описание'|gettext" :class="{disabled: disallow.pro}">
						<div class="control">
							<textarea class="input" maxlength="512" rows="4" :disabled="isUpdating || disallow.pro" v-model="values.options.seo.description"></textarea>
							<p class="has-mt-1 has-text-grey">{{'Отображается в результатах поисковых систем под ссылкой'|gettext}}</p>
						</div>
						</b-field>
					</div>
				</div>
			</div>			
			
			
			<hr class="is-hidden-mobile">
			
			<div class="has-text-right">
				<button type="button" class="button is-primary is-fullwidth-mobile" :class="{'is-loading': isUpdating}" @click="updateData('common')" :disabled="isUpdating">{{'Сохранить изменения'|gettext}}</button>					
			</div>
			
			
		</div>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-domain-certificate-form", {data() {
			return {
				isFetching: false,
				isUpdating: false,
				cert: '',
				key: '',
				expires_at: null
			}
		},
		
		mixins: [FormModel],
		
		created() {
			this.isFetching = true;
			this.$api.get('settings/domain/certificate/get').then((data) => {
				this.cert = data.response.values.cert;
				this.key = data.response.values.key;
				this.expires_at = data.response.values.expires_at;
				this.isFetching = false;
			});	
		},
		
		methods: {
			update() {
				this.isUpdating = true;
				this.$api.post('settings/domain/certificate/upload', {cert: this.cert, key: this.key}, this).then((data) => {
					this.isUpdating = false;
					if (data.result == 'success') this.$parent.close();
				});				
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'SSL сертификат'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="message is-warning" v-if="expires_at">
			<div class="message-body">{{'Сертификат истекает: {1}'|gettext|format($date(expires_at))}}</div>
		</section>
		<section class="modal-card-body">
			<div class="field">
				<label class="label">{{'Сертификат'|gettext}}</label>
				<textarea class="input" rows="10" v-model="cert"></textarea>
			</div>
			<div class="field">
				<label class="label">{{'Приватный ключ'|gettext}}</label>
				<textarea class="input" rows="7" v-model="key"></textarea>
			</div>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="update"><span v-if="expires_at">{{'Обновить сертификат'|gettext}}</span><span v-else>{{'Загрузить сертификат'|gettext}}</span></button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-domain-zonemanager-form", {data: function() {
			return {
				isFetching: false,
				isUpdating: false,
				current: -1,
				priority: {0: '0 - High', 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 15: 15, 20: '20 - Low'},
				records: []
			}
		},

		mixins: [FormModel],

		created: function () {
			this.fetchData();
		},

		methods: {
			deleteZone(i) {
				let z = this.records[i];
				this.$confirm(this.$format(this.$gettext('Вы уверены, что хотите удалить запись "{1}" для поддомена "{2}"?'), z.type, z.subdomain?z.subdomain:'subdomain'), 'is-danger').then(() => {
                    this.records.splice(i, 1);
				});
			},
			
			getError(index, name) {
				return ((this.errors[index] != undefined) && (this.errors[index][name] != undefined))?this.errors[index][name]:null;
			},
			
			onAction(v) {
				this.records.push({type: v, subdomain: '', content: '', priority: 0});

/*
				switch (v) {
					case 'A':
						this.fields.push({type: 'A', subdomain: '', content: ''});
						break;
					case 'CNAME':
						this.fields.push({type: 'CNAME', subdomain: '', content: ''});
						break;
					case 'MX':
						this.fields.push({type: 'MX', subdomain: '', content: '', priority: 0});
						break;
					case 'TXT':
						this.fields.push({type: 'TXT', subdomain: '', content: ''});
						break;
				}
*/

				this.current = this.records.length - 1;
			},
			
			openBlock(index) {
				this.current = (this.current == index)?-1:index;
				this.$emit('update:current', this.current);
			},
			
			update() {
				this.isUpdating = true;

				this.$api.get('settings/domain/zonemanager/update', {records: this.records}, this).then((data) => {
					this.isUpdating = false;
					if ((_.size(this.errors) > 0) && (this.errors[this.current] == undefined)) this.current = Object.keys(this.errors)[0];
					
					if (data.result == 'success') this.$parent.close();
				});				
			},
			
			fetchData(force) {
				this.isFetching = true;
				
				this.$api.get('settings/domain/zonemanager/list').then((data) => {
					this.isFetching = false;
					this.records = data.response.records;
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Управление зоной'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="form-fields-item-list" :class="{'has-mb-2': records.length, disabled: isUpdating}">
				<div class="form-fields-item" v-for="(f, index) in records" :class="{in: current == index}">
					<div class="form-fields-item-title" @click="openBlock(index)">
						<div class="form-fields-item-handle block-handle-link-caret"></div>
						<a class="has-text-danger is-pulled-right" @click.stop="deleteZone(index)" ><i class="fa fa-trash-alt"></i></a>
						<span><span style="margin: 0 .5rem;width:3.5rem" class="tag is-dark">{{f.type}}</span>
						<span  v-if="f.type == 'A'"><span v-if="f.subdomain">{{f.subdomain}}</span><span class="has-text-grey-light" v-else>subdomain</span><span class="is-hidden-mobile"><i class="fal fa-long-arrow-right" style="margin: 0 1rem"></i><span v-if="f.content">{{f.content}}</span><span class="has-text-grey-light" v-else>0.0.0.0</span></span></span>
						<span  v-if="f.type == 'CNAME'"><span v-if="f.subdomain">{{f.subdomain}}</span><span class="has-text-grey-light" v-else>subdomain</span><span class="is-hidden-mobile"><i class="fal fa-long-arrow-right" style="margin: 0 1rem"></i><span v-if="f.content">{{f.content}}</span><span class="has-text-grey-light" v-else>Canonical name</span></span></span>
						<span  v-if="f.type == 'TXT'"><span v-if="f.subdomain">{{f.subdomain}}</span><span class="has-text-grey-light" v-else>subdomain</span><span class="is-hidden-mobile"><i class="fal fa-long-arrow-right" style="margin: 0 1rem"></i><span v-if="f.content">"{{f.content}}"</span><span class="has-text-grey-light" v-else>Text</span></span></span>
						<span  v-if="f.type == 'MX'"><span v-if="f.subdomain">{{f.subdomain}}</span><span class="has-text-grey-light" v-else>subdomain</span><span class="is-hidden-mobile"><i class="fal fa-long-arrow-right" style="margin: 0 1rem"></i><span v-if="f.content">{{f.content}} {{f.priority}}</span><span class="has-text-grey-light" v-else>Mail server</span></span></span>
						</span>
					</div>
					<div class="form-fields-item-options">
						<div v-if="f.type == 'A'" class="row row-small">
							<div class="col-xs-12 col-sm-8 has-mb-2-mobile">
								<vue-component-subdomain-field v-model="f.subdomain" :domain="$account.custom_domain" :error="getError(index, 'subdomain')"></vue-component-subdomain-field>
							</div>
							<div class="col-xs-12 col-sm-4">
								<b-field :message="getError(index, 'content')" :class="{'has-error': getError(index, 'content')}">
									<b-input type="input" v-model="f.content" expanded placeholder="IP address"></b-input>
								</b-field>
							</div>
						</div>
						
						<div v-if="f.type == 'CNAME'" class="row row-small">
							<div class="col-xs-12 col-sm-8 has-mb-2-mobile">
								<vue-component-subdomain-field v-model="f.subdomain" :domain="$account.custom_domain" :error="getError(index, 'subdomain')"></vue-component-subdomain-field>
							</div>
							<div class="col-xs-12 col-sm-4">
								<b-field :message="getError(index, 'content')" :class="{'has-error': getError(index, 'content')}">
									<input type="input" v-model="f.content" class="input is-expanded" placeholder="Canonical name">
								</b-field>
							</div>
						</div>
						
						<div v-if="f.type == 'MX'" class="row row-small">
							<div class="col-xs-12 col-sm-6 has-mb-2-mobile">
								<vue-component-subdomain-field v-model="f.subdomain" :domain="$account.custom_domain" :error="getError(index, 'subdomain')"></vue-component-subdomain-field>
							</div>
							<div class="col-xs-5 col-sm-2">
								<div class="select is-fullwidth">
								<select v-model="f.priority">
									<option v-for="(v, i) in priority" :value="i">{{v}}</option>
								</select>
								</div>
							</div>
							<div class="col-xs-7 col-sm-4">
								<b-field :message="getError(index, 'content')" :class="{'has-error': getError(index, 'content')}">
									<input type="input" v-model="f.content" class="input is-expanded" placeholder="Mail server">
								</b-field>
							</div>
						</div>
						
						
						<div v-if="f.type == 'TXT'" class="row row-small">
							<div class="col-xs-12 col-sm-8 has-mb-2-mobile">
								<vue-component-subdomain-field v-model="f.subdomain" :domain="$account.custom_domain" :error="getError(index, 'subdomain')"></vue-component-subdomain-field>
							</div>
							<div class="col-xs-12 col-sm-4">
								<input type="input" v-model="f.content" class="input is-expanded" placeholder="text">
							</div>
						</div>						
					</div>
				</div>
			</div>
			
<!--
			<b-table :data="fields" :mobile-cards="false" class="table-header-hide">
				<template slot-scope="props">
					<b-table-column field="tms" style="display: flex;justify-content: space-between;align-items: center" :class="{disabled: !props.row.is_active}">
						<div style="display: flex;">
							<div class="icon-browser" :data-browser="props.row.client.browser.toLowerCase()">
								<span :title="props.row.country" :class="['iti-flag', props.row.country]" style="display: inline-block;position: absolute;right: 0;bottom: 0;" v-tippy :content="titleIp(props.row.ipv4)"></span>
							</div>
							<div>
								<div><b>{{props.row.client.device}}</b></div>
								<div class="has-text-grey">{{props.row.tms|datetime}} &bull; {{'Браузер'|gettext}} {{props.row.client.browser}}</div>
							</div>
						</div>
						<div class="tag has-tag-dot is-success" v-if="props.row.is_online">{{'Онлайн'|gettext}}</div>
					</b-table-column>
					
				</template>
			</b-table>
-->
			<vue-component-action-button @action="onAction" :title="'Добавить запись'|gettext" classname="button is-success" icon='fa fa-plus'>
				<template slot="actions">
					<b-dropdown-item value="A">A</b-dropdown-item>
					<b-dropdown-item value="CNAME">CNAME</b-dropdown-item>
					<b-dropdown-item value="MX">MX</b-dropdown-item>
					<b-dropdown-item value="TXT">TXT</b-dropdown-item>
				</template>
			</vue-component-action-button>
			
			<div class="block-arrow-left-top has-mt-2" style="opacity:0.5" v-if="records.length == 0">
				{{'Для добавления записей в DNS сервер нажмите тут'|gettext}}
			</div>
			
		</section>
		<footer class="modal-card-foot">
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="update">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("settings", "vue-settings-payments-index", {created() {
		}, template: `
	<div class='has-mb-4 has-mt-4 has-xs-mb-3 has-xs-mt-3'>
		<div class="container">
			<vue-settings-payments-providers class="has-mb-4"></vue-settings-payments-providers>
			<hr class="is-hidden-mobile" v-if="$auth.hasFeature('onlinekassa')">
			<vue-settings-payments-onlinekassa v-if="$auth.hasFeature('onlinekassa')"></vue-settings-payments-onlinekassa>
		</div>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-onlinekassa-errors", {data() {
			return {
				isFetching: false,
				fields: [],
				variants: {
					type: {
						sell: 'Приход',
						sell_refund: 'Возврат прихода'
					}
				},
				total: 0,
				perPage: 30,
				page: 1,
			}
		},

		created() {
			this.fetchData(true);
			this.$io.on('events:settings.payments.onlinekassa.errors.list:refresh', this.refresh);
		},
		
		destroyed() {
			this.$io.off('events:settings.payments.onlinekassa.errors.list:refresh', this.refresh);
		},

		methods: {
			refresh() {
				this.fetchData(false);
			},
			
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('settings/payments/onlinekassa/errors/list', {page: this.page, count: this.perPage}).then((data) => {
					this.fields = data.response.settings.payments.onlinekassa.errors.fields
					this.total = data.response.settings.payments.onlinekassa.errors.total;
					this.isFetching = false;
				}).catch((error) => {
                    this.fields = []
                    this.total = 0
                    this.isFetching = false
                    throw error
                })

			},
			
			onPageChange(page) {
                this.page = page
                this.fetchData()
            },
            
            onRepeat(row) {
	            this.$confirm('Вы уверены что хотите отправить чек №%s в онлайн кассу повторно?'.replace('%s', row.order_number), 'is-warning').then(() => {
		            this.$api.get('settings/payments/onlinekassa/errors/repeat', {order_id: row.order_id, order_version: row.order_version});
	            });
            }
		}, template: `
	<div class="has-mb-4 has-mt-4">
	<div class="container">
		<router-link :to="{name: 'settings.payments'}" class="button is-light has-mb-2 is-fullwidth-mobile"><i class="fa fa-angle-left" style="margin-right:5px"></i> Вернуться к настройкам</router-link>

		<b-table paginated backend-pagination :data="fields" :loading="isFetching" :per-page="perPage" :total="total" @page-change="onPageChange" bordered>
			
			<b-table-column field="name" label="Счет" class="has-width-10" v-slot="props">№{{ props.row.order_number }}</b-table-column>
			<b-table-column field="name" label="Тип" class="has-width-20" v-slot="props">{{ variants.type[props.row.type] }}</b-table-column>
			<b-table-column field="name" label="Ошибка" class="has-text-danger" v-slot="props">
				{{ props.row.error }}
				<a v-if="props.row.error" @click="onRepeat(props.row)" class="button is-small is-default is-pulled-right"><i class="fa fa-repeat" style="margin-right: 5px"></i> <span v-if="props.row.uuid">Отправить новый запрос</span><span v-else>Отправить повторно</span></a>
			</b-table-column>
			
			<template slot="empty">
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
                    <p><b-icon icon="smile" size="is-large"></b-icon></p>
                    <p>{{'Пока ничего нет'|gettext}}</p>
                </section>
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
	                <p>{{'Загрузка данных'|gettext}}</p>
                </section>
            </template>
            	        
		</b-table>
	</div>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-onlinekassa", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				values: {is_active: false, receipt_errors: 0},
				variants: {},
				errors: {group: ''}
			}
		},

		created() {
			this.fetchData(true);
		},
		
		computed: {
			currentOnlinekassa() {
				return this.values.onlinekassa_provider_id?('vue-settings-payments-onlinekassa-'+this.variants.onlinekassa_provider_id[this.values.onlinekassa_provider_id].onlinekassa_provider_name):null;
			},

			isAllow() {
				return this.$auth.isAllowTariff('business');
			}
		},

		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get(['settings/payments/onlinekassa/get', 'settings/payments/onlinekassa/info']).then((data) => {
					this.isFetching = false;
					this.values = data.response.settings.payments.onlinekassa.values;
					this.variants = data.response.settings.payments.onlinekassa.variants;
					this.$account.hits.settings.payments.onlinekassa.errors = this.values.receipt_errors;
				});

			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('settings/payments/onlinekassa/set', this.values, this).then((data) => {
					this.isUpdating = false;
					if (data.result == 'success') {
						this.values = data.response.values;
// 						this.$account.hits.settings.payments.onlinekassa.errors = this.values.receipt_errors;
// 						this.values.receipt_errors = data.values.receipt_errors;
					}
				}).catch((error) => {
					this.isUpdating = false;
				})
			}
		}, template: `
	<div class="row">
	<div class="col-xs-12 col-sm-4">
		<div class="label-pro-container">
		<div v-if="!$auth.isAllowTariff('business')" class="tag is-business is-middle" v-tippy :content="'Эта возможность доступна на Business тарифе'|gettext">biz</div>
			<h3 class="has-mb-1">Онлайн касса</h3>
		</div>
			
			<div class="has-text-grey has-mb-2"> Подключите онлайн-кассу для уведомления налоговой инспекции о продажах и отправки электронных чеков клиентам</div>
<!-- 		<button class="button is-dark" @click="values.is_active = true" :disabled="values.is_active">Активировать поддержку онлайн касс</button> -->
	</div>
	<div class="col-xs-12 col-sm-8">
		
		<div class="message is-danger" v-if="values.receipt_errors"><div class="message-body"><router-link :to="{name: 'settings.payments.onlinekassa.errors'}" class="button is-small is-danger is-pulled-right is-hidden-mobile" type="submit" name="action" value="update">Посмотреть ошибки</router-link>Обнаружены ошибки в работе с онлайн кассой<router-link :to="{name: 'settings.payments.onlinekassa.errors'}" class="button is-fullwidth is-danger is-visible-mobile" type="submit" name="action" value="update" style="margin-top:10px">Посмотреть ошибки</router-link></div></div>

		<div class="panel panel-default" :class="{disabled: !isAllow}">
<!--
				<mx-item class='is-hidden-mobile mx-item-header'>
					<div class="item-row row">
						<div class="col-sm-12 has-text-centered">Онлайн касса (54-ФЗ)</div>
					</div>
				</mx-item>
-->
				
				<div class="card-content">
					<div class="field">
						<mx-toggle title="Активировать поддержку онлайн касс" v-model="values.is_active"></mx-toggle>
					</div>
		
					<div class="row has-mb-2" :class="{disabled: !values.is_active}">
						<div class="col-xs-12 col-sm-6">
							<b-field label="ИНН" :message="errors.inn" :class="{'has-error': errors.inn}" class="has-mb-2">
								<b-input v-model="values.inn" type="number" :disabled="!values.is_active">
							</b-field>
						</div>
						<div class="col-xs-12 col-sm-6">
							<b-field label="Онлайн касса" :message="errors.onlinekassa_provider_id" :class="{'has-error': errors.onlinekassa_provider_id}">
								<b-select placeholder="-- Только через платежные системы --" v-model="values.onlinekassa_provider_id" :disabled="!values.is_active" expanded>
									<option :value="null">-- Только через платежные системы --</option>
									<option v-for="v in variants.onlinekassa_provider_id" :value="v.onlinekassa_provider_id">{{v.onlinekassa_provider_title}}</option>
								</b-select>
							</b-field>
						</div>
					</div>
					<div class="row" :class="{disabled: !values.is_active}">
						<div class="col-xs-12 col-sm-4">
							<b-field label="Система налогообложения" class="has-mb-2" :message="errors.sno_id" :class="{'has-error': errors.sno_id}">
								<b-select placeholder="-- Не выбрано --" v-model="values.sno_id" :disabled="!values.is_active" expanded>
									<option v-for="(v, k) in variants.sno_id" :value="k">{{v}}</option>
								</b-select>
							</b-field>
						</div>
						
						<div class="col-xs-12 col-sm-4">
							<b-field label="Ставка НДС" :message="errors.tax_id" class="has-mb-2" :class="{'has-error': errors.tax_id}">
								<b-select placeholder="-- Не выбрано --" v-model="values.tax_id" :disabled="!values.is_active" expanded>
									<option v-for="(v, k) in variants.tax_id" :value="k">{{v}}</option>
								</b-select>
							</b-field>
						</div>
						
						<div class="col-xs-12 col-sm-4">
							<b-field label="Признак способа расчета" :message="errors.method_id" :class="{'has-error': errors.method_id}">
								<b-select v-model="values.method_id" :disabled="!values.is_active" expanded>
									<option v-for="(v, k) in variants.method_id" :value="k">{{v}}</option>
								</b-select>
							</b-field>
						</div>
						
					</div>	
				</div>	
				<div class="card-content" :class="{disabled: !values.is_active}" v-if="values.onlinekassa_provider_id">
					<h2 class="has-mb-4 has-text-grey-light">Настройки онлайн кассы</h2>
					<component v-bind:is="currentOnlinekassa" v-model="values.options[values.onlinekassa_provider_id]" :variants="variants" :is_active="values.is_active" :errors="errors" v-if="values.onlinekassa_provider_id"></component>
				</div>
				
				<footer class="mx-item-footer">
					<button type="button" class="button is-primary is-fullwidth-mobile" :class="{'is-loading': isUpdating}" @click="updateData">Сохранить изменения</button>
				</footer>
		
				
				<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
		</div>
	</div>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-onlinekassa-atolonline", {data() {
			return {
			}
		},

		created() {
			if (this.value.version == undefined) this.value.version = 3;
		},

		props: ['value', 'errors', 'is_active'],
		mixins: [FormModel],

		methods: {
			
		}, template: `
	<div>	
		<b-field label="Код группы касс" :message="errors.group" :class="{'has-error': errors.group}">
			<b-input type='text' v-model='value.group' :disabled="!is_active"></b-input>
		</b-field>
		<b-field label="Адрес места расчетов" :message="errors.payment_address" :class="{'has-error': errors.payment_address}">
			<b-input type='text' v-model='value.payment_address' maxlength="256" :has-counter="false" :disabled="!is_active"></b-input>
		</b-field>
		<b-field label="Логин для токена" :message="errors.login" :class="{'has-error': errors.login}">
			<b-input type='text' v-model='value.login' :disabled="!is_active"></b-input>
		</b-field>
		<b-field label="Пароль для токена" :message="errors.password" :class="{'has-error': errors.password}">
			<b-input type='text' v-model='value.password' :disabled="!is_active"></b-input>
		</b-field>
		<b-field label="Версия API">
			<b-select placeholder="-- Не выбрано --" v-model="value.version" :disabled="!is_active" expanded>
				<option value="3">v3</option>
				<option value="4">v4</option>
			</b-select>
		</b-field>
		<b-field label="Электронная почта отправителя чека" :message="errors.email" :class="{'has-error': errors.email}">
			<b-input type='text' v-model='value.email' :disabled="!is_active"></b-input>
		</b-field>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-onlinekassa-cloudkassir", {data() {
			return {
				receiptLink: 'https://taplink.cc/payments/cloudkassir/receipt.html'
			}
		},

		created() {
		},

		props: ['value', 'errors', 'is_active'],
		mixins: [FormModel],

		methods: {
			
		}, template: `
	<div>	
		<b-field label="Public ID" :message="errors.login" :class="{'has-error': errors.login}">
			<b-input type='text' v-model='value.login' :disabled="!is_active"></b-input>
		</b-field>
		<b-field label="Пароль для API" :message="errors.password" :class="{'has-error': errors.password}">
			<b-input type='text' v-model='value.password' :disabled="!is_active"></b-input>
		</b-field>

		<b-field label="Установите уведомление Receipt в настройках CloudKassir">
			<div class="has-feedback">
			<b-input type='text' :value='receiptLink' onfocus="this.focus();this.select()" readonly="on"></b-input>
			<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="receiptLink" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
			</div>
		</b-field>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-onlinekassa-modulkassa", {data() {
			return {
			}
		},

		computed: {
			isAuth() {
				return this.value && (this.value.auth != '');
			}
		},

		props: ['value', 'errors', 'is_active'],
		mixins: [FormModel],

		methods: {
			disconnect() {
				this.value.username = '';
				this.value.password = '';
				this.value.auth = false;
			}
		}, template: `
	<div>	
		<b-field label="Идентификатор" :message="errors.point" :class="{'has-error': errors.point}">
			<b-input type='text' v-model='value.point' :disabled="!is_active || isAuth"></b-input>
		</b-field>
		
		<div v-if="isAuth">
			<button class="button is-warning" @click="disconnect"><i class="fal fa-exchange"></i> Указать другой идентификатор</button>
		</div>
		<div v-else>
			<b-field label="Логин" :message="errors.username" :class="{'has-error': errors.username}">
				<b-input type='text' v-model='value.username' :disabled="!is_active"></b-input>
			</b-field>
			<b-field label="Пароль" :message="errors.password" :class="{'has-error': errors.password}">
				<b-input type='password' v-model='value.password' :disabled="!is_active" password-reveal icon-pack="fa"></b-input>
			</b-field>
		</div>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-onlinekassa-orangedata", {data() {
			return {
			}
		},

		created() {
		},

		props: ['value', 'errors', 'is_active'],
		mixins: [FormModel],

		methods: {
			
		}, template: `
	<div>
		<b-field label="Код группы касс" :message="errors.group" :class="{'has-error': errors.group}">
			<b-input type='text' v-model='value.group' :disabled="!is_active"></b-input>
		</b-field>

		<b-field label="Приватный ключ организации для подписи запросов" :message="errors.priv" :class="{'has-error': errors.priv}">
			<b-input type='textarea' v-model='value.priv' :disabled="!is_active"></b-input>
		</b-field>

		<b-field label="Содержимое файла client.crt" :message="errors.cert" :class="{'has-error': errors.cert}">
			<b-input type='textarea' v-model='value.cert' :disabled="!is_active"></b-input>
		</b-field>

		<b-field label="Содержимое файла client.key" :message="errors.key" :class="{'has-error': errors.key}">
			<b-input type='textarea' v-model='value.key' :disabled="!is_active"></b-input>
		</b-field>
		
		<b-field label="Пароль" :message="errors.password" :class="{'has-error': errors.password}">
			<b-input type='text' v-model='value.password' :disabled="!is_active"></b-input>
		</b-field>

		<div class="field">
			<label class="label">Имя ключа</label>
			<p class="control">
			<b-field>
				<b-input type='text' v-model='value.keyname' :disabled="!is_active"></b-input>
			</b-field>
			<p class="has-text-grey has-mt-1">Если имя ключа не указано для проверки подписи будет использован ключ, заданный по умолчанию.</p>
			</p>
		</div>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-provider-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				currentProvider: null,
				payment_provider_id: null,
				is_new: false,
				is_lock: false,
				providers: null,
				values: {},
				variants: {},
				challenge: '',
				title: null
			}
		},

		created() {
			if (this.payment_provider_id) {
				this.fetchData(true);
			} else {
				this.providers = {general: []};
				for (var i = 0; i < 8; i++) this.providers.general.push({classname: 'payments-button payments-button-blank'});
				this.isFetching = true;
				this.$api.get('settings/payments/providers/info').then((data) => {
					this.isFetching = false;
					let providers = _.map(data.response.settings.payments.provider.providers, (v) => {
						v.classname = 'payments-button';
						v.style = 'background:url(/s/i/payments/'+v.payment_provider_id+'.png) no-repeat;background-size: 100%';
						return v;
					});
					
/*
					this.providers = {
						best: _.compact(_.map(providers, (v) => {
							return (v.language_best.length && v.language_best.indexOf(i18n.locale) != -1)?v:null;
						})),
						general: _.compact(_.map(providers, (v) => {
							return (v.language_best.length && v.language_best.indexOf(i18n.locale) != -1)?null:v;
						}))
					};
					
*/
					this.providers.general = providers;
				});
			}
		},

		props: ['payment_provider_id'],

		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('settings/payments/providers/get', {payment_provider_id: this.payment_provider_id}).then((data) => {
					let provider = data.response.settings.payments.provider;
					
					this.is_new = provider.is_new;
					this.values = provider.values;
					this.variants = provider.variants;
					this.currentProvider = 'vue-settings-payments-providers-'+provider.payment_provider.name;
					this.title = provider.payment_provider.title;
					this.isAllowCurrency = provider.payment_provider.allow_currency;
					
					if (this.is_new) {
						this.values.payments_methods = _.filter(_.map(this.variants.payments_methods, (v) => {
							return v.is_main_method?v.payment_method_id:null;
						}));
					} else {
						this.is_lock = provider.is_lock;
						this.account_token = provider.account_token;
					}
					
					window.i18n.extend(provider.phrases);
					this.isFetching = false;
				});
			},
			
			unlock() {
				this.$challenge({account_token: this.account_token}).then(code => {
					this.challenge = code;
					this.is_lock = false;
				});
			},

			chooseProvider(v) {
				this.payment_provider_id = v;
				this.fetchData(true);
			},
			
			close() {
				this.$parent.close()
			},
			
			popupCenter(url, title, w, aspect_ratio, min_width, min_height) {
			    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : window.screenX;
			    var dualScreenTop = window.screenTop != undefined ? window.screenTop : window.screenY;
			    
			    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
			    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
			    
			    w = Math.max(min_width, width / 100 * w);
			    h = Math.max(min_height, w * aspect_ratio);
			
			    var systemZoom = width / window.screen.availWidth;
				var left = (width - w) / 2 / systemZoom + dualScreenLeft
				var top = (height - h) / 2 / systemZoom + dualScreenTop
			    var newWindow = window.open(url, title, 'location=no,status=no,scrollbars=yes, width=' + w / systemZoom + ', height=' + h / systemZoom + ', top=' + top + ', left=' + left);
			
			    // Puts focus on the newWindow
			    if (window.focus) newWindow.focus();
			},
			
			deleteProvider() {
				this.$confirm(this.$gettext('Вы уверены что хотите удалить эту платежную систему?'), 'is-danger').then((v) => {
					this.$api.get('settings/payments/providers/delete', Object.assign({payment_provider_id: this.payment_provider_id}, {challenge: this.challenge})).then((data) => {
						switch (data.result) {
							case 'success':
								this.$parent.close();
								break;
							case 'challenge':
								this.unlock();
								break;
						}
					});
				});
			},
			
			save(close, isUpdating, params) {
				if (params == undefined) params = {};
				this.isUpdating = (isUpdating == undefined || isUpdating)?true:false;
				this.$api.post('settings/payments/providers/set', Object.assign(this.values, params, {challenge: this.challenge}), this.$refs.model).then((data) => {
					this.isUpdating = false;

					switch (data.result) {
						case 'success':
							if (close != undefined && close) this.$parent.close();
							break;
						case 'challenge':
							this.unlock();
							break;
					}
					
				}).catch((error) => {
					this.isUpdating = false;
				})			
			}
		}, template: `
	<div class="modal-card modal-card-large">
		
		<header class="modal-card-head">
			<p class="modal-card-title" v-if="title">{{title}}</p>
			<p class="modal-card-title" v-else>{{'Платежные системы'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>

		<section class="modal-card-body" v-if="currentProvider">
			<div class='message is-danger' v-if="!isAllowCurrency"><div class="message-body"><i class="fa fa-exclamation-triangle has-mr-1"></i> {{'Ваша валюта не поддерживается данной платежной системой'|gettext}}</div></div>
			<component v-bind:is="currentProvider" ref='model' :values.async="values" :variants="variants" :payment_provider_id="payment_provider_id" :is_new="is_new" :disabled="is_lock"></component>
		</section>
		<section class="modal-card-body modal-card-body-blocks" v-else>
<!--
			<section class="payments-best" v-if="providers && providers.best && providers.best.length">
				<div class="row row-small" style="margin-bottom: -1rem">
					<div class="col-sm col-xs-6 has-mb-2" v-for="f in providers.best"><button @click="chooseProvider(f.payment_provider_id)" class="button is-vertical btn-block is-fullwidth">
						<dd class="payments-auto" v-if="f.tags.indexOf('auto') != -1" v-tippy content="Быстрая настройка" @click.stop=""></dd>
						<dd class="payments-people" v-if="f.tags.indexOf('people') != -1" v-tippy content="Работают с физ. лицами" @click.stop=""></dd>
						<i :class="f.classname" :style="f.style"></i>
						<div>{{f.title}} -- {{f.tags}}</div>
					</button></div>
				</div>
			</section>
-->
			
			<section v-if="providers">
			<div class="row row-small" style="margin-bottom: -1rem">
				<div class="col-sm-3 col-xs-6 has-mb-2" v-for="f in providers.general"><button @click="chooseProvider(f.payment_provider_id)" class="button is-vertical btn-block is-block-button">
					<dd class="payments-auto" v-if="f.tags && f.tags.indexOf('auto') != -1" v-tippy content="Быстрая настройка" @click.stop=""></dd>
					<dd class="payments-people" v-if="f.tags.indexOf('people') != -1" v-tippy content="Работают с физ. лицами" @click.stop=""></dd>
					<i :class="f.classname" :style="f.style"></i>
					<div>{{f.title}}</div>
				</button></div>
			</div>
			</section>
		</section>
		
		<footer class="modal-card-foot level" v-if="currentProvider">
			<div class="level-left">
				<tippy to="lock-button" :visible="true" trigger="manual" placement='top-start' v-if="is_lock">{{'Нажмите на замок, чтобы внести изменения'|gettext}}</tippy>
				<button name="lock-button" v-if="!is_new && is_lock" class="button has-mr-2 is-warning" @click="unlock"><i :class="'fa fa-'+(is_lock?'lock':'lock-open')"></i></button>

				<button v-if="!is_new" class="button has-text-danger" @click="deleteProvider" :disabled="is_lock"><i class="fa fa-trash-alt"></i><span class="is-hidden-mobile has-ml-1">{{'Удалить'|gettext}}</span></button>
			</div>

			<div class="level-right">
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
				<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="save" :disabled="is_lock">{{'Сохранить'|gettext}}</button>
			</div>
		</footer>
		
		<footer class="modal-card-foot" v-if="!currentProvider">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("settings", "vue-settings-payments-provider-methods", {props: ['index', 'values', 'variants', 'disabled'], template: `
	<div class="media">
		<div class="media-left"><span class='tag is-dark'>{{index}}</span></div>
		<div class="media-content">
		<div class="has-mb-1">{{'Выберите доступные варианты оплаты'|gettext}}</div>
		<div class="is-block" v-for="v in variants.payments_methods"><b-checkbox :native-value="v.payment_method_id" v-model="values.payments_methods" :disabled="disabled">{{v.payment_method_title}}</b-checkbox></div>
		</div>
 	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-provider-mode", {props: ['index', 'values', 'variants', 'disabled'], template: `
	<div class="media">
		<div class="media-left"><span class='tag is-dark'>{{index}}</span></div>
		<div class="media-content">
			<div class="has-mb-1">{{'Режим работы'|gettext}}</div>

			<div class="row">
				<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='mode' value="test" v-model="values.mode" :disabled="disabled"> {{'Тестовый режим'|gettext}}</label></div>
				<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='mode' value="work" v-model="values.mode" :disabled="disabled"> {{'Рабочий режим'|gettext}}</label></div>
			</div>               
		</div>
 	</div>		
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers", {data() {
			return {
				isFetching: false,
				providers: [],
			}
		},
		
		computed: {
			isAllow() {
				return this.$auth.isAllowTariff('business');
			}
		},

		created() {
			this.$io.on('events:settings.payments.providers:refresh', this.refresh);
			this.fetchData(true);
		},
		
		destroyed() {
			this.$io.off('events:settings.payments.providers:refresh', this.refresh);
		},

		methods: {
			refresh(data) {
				this.fetchData(false);
			},
			
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('settings/payments/list', {page: this.page}).then((data) => {
					this.providers = data.response.settings.payments.providers;
					this.isFetching = false;
				}).catch((error) => {
                    this.providers = []
                    this.isFetching = false
                    throw error
                })

			},
			
			
            openForm(row) {
				this.$modal('vue-settings-payments-provider-form', {payment_provider_id: row?row.payment_provider_id:null}, this);
			}
		}, template: `
	<div class="row">

		
		<div class="col-xs-12 col-sm-4 has-mb-2">
			<div class="label-pro-container">
			<div v-if="!$auth.isAllowTariff('business')" class="tag is-business is-middle" v-tippy :content="'Эта возможность доступна на Business тарифе'|gettext">biz</div>
				<h3 class="has-mb-1">{{'Платежные системы'|gettext}}</h3>
			</div>
			
			<div class="has-text-grey">{{'Подключите платежные системы чтобы принимать платежи напрямую от своих клиентов за ваши услуги и товары'|gettext}}</div>
		</div>
		<div class="col-xs-12 col-sm-8">
					
		
			<div class="card1" :class="{disabled: !isAllow}">

			<b-table :data="providers" :loading="isFetching" :mobile-cards="false" hoverable bordered class="table-header-hide" @click="openForm">
				<template slot-scope="props" slot="header" style="color:red" class="is-hidden">
					<div class="has-text-center">{{ props.column.label }}</div>
		        </template>
	        			
				<b-table-column field="name" :label="'Платежная система'|gettext" style="vertical-align:middle" v-slot="props">
				<div class="has-sm-p-1">
					<div v-if="props.row.allow_currency == 0" class="is-pulled-right has-text-danger"><i class="fa fa-exclamation-triangle"></i> <span class="is-hidden-mobile">{{'Валюта не поддерживается'|gettext}}</span></div>
					<div v-else>
						<div class="is-pulled-right has-text-warning" v-if="props.row.mode == 'test'"><i class="fa fa-exclamation-triangle"></i> <span class="is-hidden-mobile">{{'Тестовый режим'|gettext}}</span></div>
					</div>
					<h3 class="has-mb-1">{{ props.row.title }}</h3>
					<div class="tags" v-if="props.row.methods">
						
						<i v-for="v in props.row.methods" class="tag is-default" style="padding: 5px 30px;border-radius: 3px;zoom:.5">
							<img v-if="v.picture" :src="v.picture" style="width:80px;height:80px">
							<span :class="'payments-button payments-button-{1}'|format(v.payment_method)" v-else></span>
						</i>
<!-- 							<span class="tag is-dark" v-for="v in props.row.methods">{{v}} {{v.payment_method_title|gettext}}</span> -->
					</div>
					<div class="has-text-grey" v-else>{{'Варианты оплаты не выбраны'|gettext}}</div>
				</div>
				</b-table-column>
				
				<template slot="empty">
	                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
		                <p>{{'Загрузка данных'|gettext}}</p>
	                </section>
	                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-else>
		                <p>{{'Настроенных платежных систем пока нет'|gettext}}</p>
	                </section>
	            </template>
	            
	            <template slot="footer">
<!-- 		            <a class='mx-link mx-tap' data-remote="/profile/settings/payments/addform.html" data-modal-hash="newprovider" data-modal="form" class="button is-text is-fullwidth" style="text-decoration:none"><i class="fa fa-plus-circle"></i> {{'Добавить платежную систему'|gettext}}</a> -->
		            <a class='mx-link mx-tap' @click="openForm(null)" class="button is-text is-fullwidth" style="text-decoration:none"><i class="fa fa-plus-circle"></i> {{'Добавить платежную систему'|gettext}}</a>
	            </template>
	            	        
			</b-table>
			
			</div>	
		</div>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-alfabank", {data() {
			return {
				resultUrl: this.variants.domain_base+'/payments/alfabank/result.html'
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://alfabank.ru/sme/rko/internet-acquiring/" target="_blank">Зарегистрируйтесь</a> на сайте эквайринга от Альфа-банка</p>
			</div>
		</div>	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<p class="has-mb-1">Передайте в Альфабанк URL для Callback-уведомлений с симметричной криптографией:</p>
				<div class="has-feedback">
				<input type="text" :value="resultUrl" class="input" onfocus="this.focus();this.select()" readonly="on" :disabled="disabled">
				<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
				</div>
			</div>
		</div>
				
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				
				<b-field label="Логин магазина, полученный при подключении:" :message="errors.username" :class="{'has-error': errors.username}">
					<b-input type="text" v-model="values.username" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="Пароль магазина, полученный при подключении:" :message="errors.password" :class="{'has-error': errors.password}">
					<b-input type="text" v-model="values.password" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
	 	
	 	<div class="media">
			<div class="media-left"><span class='tag is-dark'>5</span></div>
			<div class="media-content">
				<div>Онлайн касса</div>
				<b-checkbox v-model="values.onlinekassa" :disabled="disabled">Использовать Альфа-банк в качестве онлайн кассы для отправки чеков</b-checkbox>
			</div>
	 	</div>		 	
	 	
	 	<div class="media">
			<div class="media-left"><span class='tag is-dark'>6</span></div>
			<div class="media-content">
				<div>Двухстадийная оплата</div>
				<b-checkbox v-model="values.withaccept" :disabled="disabled">Подтверждать каждую оплату в личном кабинете</b-checkbox>
			</div>
	 	</div>		 		
	 	
		
		<vue-settings-payments-provider-mode index="7" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-alif", {computed: {
			domain() {
				return this.variants.domain_must+'/';
			},
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте alif.mobi').replace('%s', 'href="https://alif.mobi" target="_blank"');
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<div class="has-mb-1">Укажите данные полученные от Алиф</div>
				
				<b-field :label="'Ключ:'|gettext" :message="errors.key" :class="{'has-error': errors.key}">
					<b-input type="text" v-model="values.key" :disabled="disabled"></b-input>
				</b-field>

				<b-field :label="'Пароль'|gettext" :message="errors.pass" :class="{'has-error': errors.pass}">
					<b-input type="text" v-model="values.pass" :disabled="disabled"></b-input>
				</b-field>

			</div>
		</div>		
		<vue-settings-payments-provider-methods index="3" :variants="variants" :values="values" :disabled="disabled"/>
		
<!--
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>4</span></div>
			<div class="media-content">
				<div class="has-mb-1">{{'Режим работы'|gettext}}</div>
	
				<div class="row">
					<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='mode' value="test" v-model="values.mode"> {{'Тестовый режим'|gettext}}</label></div>
					<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='mode' value="work" v-model="values.mode"> {{'Рабочий режим'|gettext}}</label></div>
				</div>               
			</div>
	 	</div>
-->		
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-bepaid", {computed: {
			domain() {
				return this.variants.domain_must+'/';
			},
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте bepaid.by').replace('%s', 'href="https://bepaid.by" target="_blank"');
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
			<div class="has-mb-1">Используйте настройки</div>
				<div class="field">
					<label class="label">URL сайта:</label>
					<div class="has-feedback">
					<input type="text" :value="domain" class="input" onfocus="this.focus();this.select()" readonly="on" :disabled="disabled">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="domain" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
			<div class="has-mb-1">Укажите полученные ID и Secret Key</div>
				
				<b-field :label="'ID:'|gettext" :message="errors.id" :class="{'has-error': errors.id}">
					<b-input type="text" v-model="values.id" :disabled="disabled"></b-input>
				</b-field>

				<b-field :label="'Secret Key:'|gettext" :message="errors.secret_key" :class="{'has-error': errors.secret_key}">
					<b-input type="text" v-model="values.secret_key" :disabled="disabled"></b-input>
				</b-field>

			</div>
		</div>		

		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="5" :variants="variants" :values="values" :disabled="disabled"/>

	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-capusta", {data() {
			return {
				resultUrl: 'https://taplink.cc/payments/capusta/result.html',
				isAutoMode: true,
				isConnecting: false,
				sent: false,
// 				isNew: false,
				agree: true
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],
		
		created() {
			this.$io.on('events:payments.capusta:connect.resolve', this.connectResolve);
		},
		
		destroyed() {
			this.$io.off('events:payments.capusta:connect.resolve', this.connectResolve);
		},
		
		methods: {
			connectResolve(values) {
				if (values.merchantId == this.values.merchantId) {
					this.values.token = values.token;
					this.sent = false;
					this.values.activated = true;
					this.$toast('Интеграция успешно подключена', 'is-success');
				}
			},
			
			connect() {
				this.isConnecting = true;
				this.$api.post('settings/payments/providers/set', Object.assign(this.values, {action: 'connect'}), this).then((r) => {
					this.isConnecting = false;
					if (r.result == 'success') {
						_.each(r.response.values, (v, k) => { this.values[k] = v; });
						
						switch (r.response.values.result.status)
						{
							case "EXIST":
							case "MERCHANT_EXIST":
								this.sent = true;
								break;
							case "NEW":
								this.values.activated = true;
								this.$toast('Интеграция успешно подключена. На ваш email были отправлены регистрационные данные сервиса Capusta.Space', 'is-success');
								break;
						}
					}
				}).catch((error) => {
					this.isConnecting = false;
				})			
				
// 				this.$parent.save(false, false, {action: 'connect'});
// 				this.$parent.popupCenter('/payments/capusta/connect.html', 'capusta', 70, .6, 800, 400);
			}
		}, template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<div class="has-mb-1">Настройки проекта</div>
				<label class="checkbox has-mb-2"><input type="checkbox" v-model="isAutoMode" :disabled="sent || disabled">Подключить автоматически</label>
				
				<label class="label">Укажите ваш email:</label>
				<b-field :class="{'has-error': errors.email}" class="has-mb-2">
					<b-input type="text" v-model="values.email" :disabled="(values.activated || sent || disabled) && isAutoMode" expanded></b-input>
					<p class="control" v-if="isAutoMode">
						<button class="button is-success" :class="{'is-loading': isConnecting}" @click="connect" :disabled="sent || !agree || disabled" v-if="!values.activated"><i class="fas fa-plug has-mr-2"></i> Подключить</button>
						<button class="button is-dark" @click="values.activated = false" v-else>Другой аккаунт</button>
					</p>
				</b-field>

				<transition name="fade">
					<div class="message is-warning has-mb-1" v-if="sent"><div class="message-body">
						<i class="fa fa-exclamation-triangle has-mr-1"></i>{{'На ваш email была отправлена ссылка для подтверждения аккаунта'}}
						<a @click="sent = false" class="is-pulled-right">{{'Другая почта'|gettext}}</a>
					</div></div>
				</transition>
				
				<b-checkbox v-model="agree" :disabled="sent || disabled" v-if="isAutoMode && !values.activated">Я принимаю условия <a target="_blank" href="https://docs.capusta.space/Agreement.pdf">пользовательского соглашения</a></b-checkbox>
				
<!-- 				<div v-if="values.activated" class="message is-success"><div class="message-body"><i class="fa fa-check has-mr-1"></i>Интеграция успешно подключена</div></div> -->
				
<!--
				<div class="row row-small" v-if="isAutoMode">
					<div class="col-xs-12 col-sm" style="align-self: center">
						<span v-if="values.token && isNew" class="has-text-success"><i class="fa fa-check has-mr-1"></i>Интеграция успешно подключена</span>
						<span v-if="values.token && !sent && activated" class="has-text-success"><i class="fa fa-check has-mr-1"></i>Интеграция успешно подключена</span>
						<span v-if="sent" class="has-text-danger"><i class="fa fa-exclamation-triangle has-mr-1"></i>{{'На вашу электронную почту была отправлена ссылка для подтверждения аккаунта'}}</span>
					</div>
				</div>
-->
				

				<div v-if="!isAutoMode">
					<b-field label="Укажите ваш ID проекта:" :message="errors.project" :class="{'has-error': errors.project}">
						<b-input type="text" v-model="values.project" :disabled="disabled"></b-input>
					</b-field>
	
					<b-field label="Укажите ваш Токен:" :message="errors.token" :class="{'has-error': errors.token}">
						<b-input type="text" v-model="values.token" :disabled="disabled"></b-input>
					</b-field>
				</div>
			</div>
		</div>
			
		<vue-settings-payments-provider-methods index="2" :variants="variants" :values="values" :disabled="disabled"/>
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-cash", {props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],
		
		data() {
			return {
				current: 0,
				isSorting: false
			}
		},
		
		methods: {
			sortStart(e) {
				this.isSorting = true;
			},
			sortEnd(e) {
				this.$nextTick(() => {
					this.isSorting = false;
				})
			},
			onRemove(index) {
				if (this.values.list.length == 1) return;
				this.$confirm(this.$gettext('Вы уверены что хотите удалить этот способ оплаты?'), 'is-danger').then(() => {
					this.values.list.splice(index, 1);
				});
			},
			
			onAdd() {
				this.values.list.push({title: '', message: '', picture: null, custom_picture: 0});
				this.current = this.values.list.length - 1;
				
				this.$nextTick(() => {
					this.$refs.list.querySelector('.in input').focus();
				});
			},

/*
			openBlock(index) {
				this.current = (this.current == index)?null:index;
			},
*/
			
			deletePicture(f) {
				f.custom_picture = 0;
			}			
		}, template: `
	<div>
		<div ref="list">
		<vue-component-sortable-form-fields v-model="values.list" @sortEnd="sortEnd" @sortStart="sortStart" class="has-mb-2" :current.sync="current">
			<template v-slot:title="{ item }">
				<span><span v-if="item.title">{{ item.title }}</span><span v-else>{{'Наличными'|gettext}}</span></span>
			</template>
			
			<template v-slot:action="{ index }">
				<a class="is-pulled-right has-text-danger" @click.stop="onRemove(index)" v-if="values.list.length > 1"><i class="fa fa-trash-alt"></i></a>
			</template>
			
			<template v-slot:form="{ item, index }">
				<div class="has-mb-1">
					<b-field :label="'Заголовок'|gettext">
						<b-input type="text" v-model="item.title" :placeholder="'Наличными'|gettext" maxlength="80" :has-counter="false" :disabled="disabled"></b-input>
					</b-field>
					
					<b-field :label="'Инструкция для оплаты'|gettext">
						<b-input type="textarea" v-model="item.message" maxlength="8192" :has-counter="false" :disabled="disabled"></b-input>
					</b-field>
				</div>
				<p class="has-text-grey">{{'Этот текст будет показан клиенту когда он выберет этот способ оплаты'|gettext}}</p>
				<label class="label has-mt-2">{{'Картинка'|gettext}}</label>
				<div class="payments-picture-choose">
					<i class="payments-button payments-button-cash" :class="{in: item.custom_picture == 0}" @click="item.custom_picture = 0"></i>
					<vue-component-pictures class="payments-picture" :class="{in: item.custom_picture == 1}" @click="item.custom_picture = 1" v-model="item.picture" :button-title="'Загрузить'|gettext" button-icon="fa fal fa-cloud-upload" max-size="80" updatable @input="if (!isSorting && current == index) item.custom_picture = (item.picture != null)?1:0" :disabled="disabled"></vue-component-pictures>
				</div>
			</template>
		</vue-component-sortable-form-fields>
<!--
		
		<sortable-list class="form-fields-item-list has-mb-2" lockAxis="y" v-model="values.list" use-drag-handle @sortEnd="sortEnd" @sortStart="sortStart">
		<sortable-item v-for="(f, index) in values.list" class="form-fields-item" :index="index" :key="index" :item="f">
		<div class="form-fields-item" :class="{in: current == index}">
			<div class="form-fields-item-title" @click="openBlock(index)">
				<div v-sortable-handle class="form-fields-item-handle"></div>
				<a class="is-pulled-right has-text-danger" @click.stop="onRemove(index)" v-if="values.list.length > 1"><i class="fa fa-trash-alt"></i></a>
				<span><span v-if="f.title">{{ f.title }}</span><span v-else>{{'Наличными'|gettext}}</span></span>
			</div>
			<div class="form-fields-item-options">
				<div class="has-mb-1">
					<b-field :label="'Заголовок'|gettext">
						<b-input type="text" v-model="f.title" :placeholder="'Наличными'|gettext" maxlength="80" :has-counter="false"></b-input>
					</b-field>
					
					<b-field :label="'Инструкция для оплаты'|gettext">
						<b-input type="textarea" v-model="f.message" maxlength="8192" :has-counter="false"></b-input>
					</b-field>
				</div>
				<p class="has-text-grey">{{'Этот текст будет показан клиенту когда он выберет этот способ оплаты'|gettext}}</p>
				<label class="label has-mt-2">{{'Картинка'|gettext}}</label>
				<div class="payments-picture-choose">
					<i class="payments-button payments-button-cash" :class="{in: f.custom_picture == 0}" @click="f.custom_picture = 0"></i>
					<vue-component-pictures class="payments-picture" :class="{in: f.custom_picture == 1}" @click="f.custom_picture = 1" v-model="f.picture" :button-title="'Загрузить'|gettext" button-icon="fa fal fa-cloud-upload" max-size="80" updatable @input="if (!isSorting && current == index) f.custom_picture = (f.picture != null)?1:0"></vue-component-pictures>
				</div>
			</div>
		</div>
		</sortable-item>
		</sortable-list>
-->
		</div>

		<a href='#' @click="onAdd" v-if="!disabled">{{'Добавить новый способ оплаты'|gettext}}</a>

	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-cloudpayments", {computed: {
/*
			domain() {
				return this.variants.domain_must+'/';
			},
*/
			
			resultUrl() {
				return 'https://taplink.cc/payments/cloudpayments/result.html';
			},

			checkUrl() {
				return 'https://taplink.cc/payments/cloudpayments/check.html';
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://cloudpayments.ru" target="_blank">Зарегистрируйтесь</a> на сайте cloudpayments.ru и добавьте сайт<br>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
			<div class="has-mb-1">Укажите настройки уведомлений</div>
<!--
				<div class="field">
					<label class="label">URL сайта:</label>
					<div class="has-feedback">
					<input type="text" :value="domain" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="domain" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
-->
				<div class="field">
					<label class="label">Check уведомления:</label>
					<div class="has-feedback">
					<input type="text" :value="checkUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="checkUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				<div class="field">
					<label class="label">Pay уведомления:</label>
					<div class="has-feedback">
					<input type="text" :value="resultUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				
				<div class="field">
				<p>HTTP метод должен быть указан "POST", кодировка "UTF-8", а формат запросов "CloudPayments"</p>
				</div>
				
				
				<div class="field">
					<b-field label="У меня есть Apple MerchantID">
						<div class="control" style="display: flex">
						<mx-toggle v-model="values.apple_pay_has_merchant" class="has-mr-2" :disabled="disabled"></mx-toggle>
						<div style="flex:1">
							<b-input type="text" v-model="values.apple_pay_merchant" placeholder="MerchantID" v-show="values.apple_pay_has_merchant" :disabled="disabled || $account.custom_domain_verified"></b-input>
						</div>
						</div>
					</b-field>
					<b-field label="Содержимое файла верификации для Apple Pay:" :message="errors.apple_pay_code" :class="{'has-error': errors.apple_pay_code}">
						<b-input type="text" v-model="values.apple_pay_code" :disabled="disabled || !$account.custom_domain_verified"></b-input>
					</b-field>
				</div>
			</div>
		</div>
		
	 	<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div>Онлайн касса</div>
				<b-checkbox v-model="values.onlinekassa" :disabled="disabled">Использовать CloudPayments в качестве онлайн кассы для отправки чеков</b-checkbox>
			</div>
	 	</div>	
		
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>4</span></div>
			<div class="media-content">
				<div class="has-mb-1">Укажите "Public ID" и "Пароль для API":</div>
	
				<b-field label="Public ID:" :message="errors.public_id" :class="{'has-error': errors.public_id}">
					<b-input type="text" v-model="values.public_id" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="Пароль для API:" :message="errors.password" :class="{'has-error': errors.password}">
					<b-input type="text" v-model="values.password" :disabled="disabled"></b-input>
				</b-field>

			</div>
		</div>

		<vue-settings-payments-provider-methods index="5" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="6" :variants="variants" :values="values" :disabled="disabled"/>
	
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-ecommerce24", {props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],
		computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте ecommerce24.kz').replace('%s', 'href="https://ecommerce24.kz" target="_blank"');
			}
		}, template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<div class="has-mb-1">{{'Укажите полученные данные от Ecommerce24'|gettext}}</div>

				<b-field :label="'Merchant Id:'|gettext" :message="errors.merchantId" :class="{'has-error': errors.merchantId}">
					<b-input type="text" v-model="values.merchantId" :disabled="disabled"></b-input>
				</b-field>
				
				<b-field :label="'Login:'|gettext" :message="errors.login" :class="{'has-error': errors.login}">
					<b-input type="text" v-model="values.login" :disabled="disabled"></b-input>
				</b-field>

				<b-field :label="'Password:'|gettext" :message="errors.pass" :class="{'has-error': errors.pass}">
					<b-input type="text" v-model="values.pass" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="3" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="4" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-ecommpay", {data() {
			return {
				resultUrl: 'https://taplink.cc/payments/ecommpay/result.html'
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],
		computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте ecommpay.com').replace('%s', 'href="https://ecommpay.com" target="_blank"');
			}
		}, template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<label class="has-mb-1 is-block">{{'Укажите адрес для Callback'|gettext}}</label>
				<div class="field">
					<div class="has-feedback">
						<input type="text" :value="resultUrl" class="input" onfocus="this.select()" readonly="on">
						<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>		
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div class="has-mb-1">{{'Укажите полученные данные от EcommPay'|gettext}}</div>

				<b-field :label="'project_id:'|gettext" :message="errors.project_id" :class="{'has-error': errors.project_id}">
					<b-input type="text" v-model="values.project_id" :disabled="disabled"></b-input>
				</b-field>
				
				<b-field :label="'secret:'|gettext" :message="errors.secret" :class="{'has-error': errors.secret}">
					<b-input type="text" v-model="values.secret" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="5" :variants="variants" :values="values" :disabled="disabled"/>
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-fastspring", {data() {
			return {
				resultUrl: "https://taplink.cc/payments/fastspring/result.html",
			}
		},
		
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://fastspring.com" target="_blank">Зарегистрируйтесь</a> на сайте fastspring.com</p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<b-field label='Укажите ваш "Product Path":' :message="errors.product_path" :class="{'has-error': errors.product_path}">
					<b-input type="text" v-model="values.product_path" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
			
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<b-field label='Укажите ваш "Popup Storefront":' :message="errors.storefront" :class="{'has-error': errors.storefront}">
					<b-input type="text" v-model="values.storefront" placeholder="VENDOR.onfastspring.com/popup-ABC-XYZ-123" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>

		<div class="media">
			<div class="media-left"><span class='tag is-dark'>4</span></div>
			<div class="media-content">
				<b-field label='Укажите ваш Store Builder Library "access_key":' :message="errors.access_key" :class="{'has-error': errors.access_key}">
					<b-input type="text" v-model="values.access_key" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>5</span></div>
			<div class="media-content">
				<b-field label='Укажите ваш Store Builder Library "private_key":' :message="errors.private_key" :class="{'has-error': errors.private_key}">
					<b-input type="textarea" v-model="values.private_key" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>6</span></div>
			<div class="media-content">
				<div class="has-feedback">
				<input type="text" :value="resultUrl" class="input" onfocus="this.focus();this.select()" readonly="on" :disabled="disabled">
				<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
				</div>
				<p class="has-mt-1 has-text-grey">Выберите <b>order.completed</b> и <b>order.canceled</b></p>
			</div>
		</div>
								
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>7</span></div>
			<div class="media-content">
				<b-field label='Укажите Webhook HMAC SHA256 Secret:' :message="errors.secret" :class="{'has-error': errors.secret}">
					<b-input type="text" v-model="values.secret" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="8" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-fondy", {data() {
			return {
				
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://fondy.ru" target="_blank">Зарегистрируйтесь</a> на сайте fondy.ru</p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<b-field label='Укажите ваш "ID мерчанта":' :message="errors.merchant_id" :class="{'has-error': errors.merchant_id}">
					<b-input type="text" v-model="values.merchant_id" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
			
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<b-field label='Укажите ваш "Ключ платежа":' :message="errors.password" :class="{'has-error': errors.password}">
					<b-input type="text" v-model="values.password" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-freekassa", {data() {
			return {
			}
		},
		
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],

		
		computed: {
			domain() {
				return this.variants.domain_must+'/';
			},
			
			resultUrl() {
				return this.variants.domain_must+'/payments/freekassa/result.html';
			},

			successUrl() {
				return this.variants.domain_must+'/payments/freekassa/success.html';
			},
			
			failUrl() {
				return this.variants.domain_must+'/payments/freekassa/fail.html';
			}
		}, template: `
	<div>
	
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://www.free-kassa.ru/" target="_blank">Зарегистрируйтесь</a> на сайте free-kassa.ru и добавьте магазин<br>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<div class="has-mb-1">Укажите настройки </div>
				<div class="field">
					<label class="label">URL сайта:</label>
					<div class="has-feedback">
					<input type="text" :value="domain" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="domain" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				<div class="field">
					<label class="label">URL оповещения:</label>
					<div class="has-feedback">
					<input type="text" :value="resultUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				<div class="field">
					<label class="label">URL успеха:</label>
					<div class="has-feedback">
					<input type="text" :value="successUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="successUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
	
				<div class="field">
					<label class="label">URL неудачи:</label>
					<div class="has-feedback">
					<input type="text" :value="failUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="failUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>
		
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div class="has-mb-1">Укажите Идентификатор магазина, 'Секретное слово #1' и 'Секретное слово #2'</div>

				<b-field label="Идентификатор магазина:" :message="errors.merchant_id" :class="{'has-error': errors.merchant_id}">
					<b-input type="text" v-model="values.merchant_id" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="Секретное слово #1:" :message="errors.password_1" :class="{'has-error': errors.password_1}">
					<b-input type="text" v-model="values.password_1" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="Секретное слово #2:" :message="errors.password_2" :class="{'has-error': errors.password_2}">
					<b-input type="text" v-model="values.password_2" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>	
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-idram", {props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				
				<b-field label="EDP REC ACCOUNT" :message="errors.account" :class="{'has-error': errors.key}">
					<b-input type="input" v-model="values.account" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="SECRET KEY" :message="errors.secret_key" :class="{'has-error': errors.secret_key}">
					<b-input type="input" v-model="values.secret_key" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="2" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="3" :variants="variants" :values="values" :disabled="disabled"/>
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-instamojo", {computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте instamojo.com').replace('%s', 'href="https://instamojo.com" target="_blank"');
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				
				<b-field label="API Key" :message="errors.key" :class="{'has-error': errors.key}">
					<b-input type="input" v-model="values.key" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="AUTH token" :message="errors.token" :class="{'has-error': errors.token}">
					<b-input type="input" v-model="values.token" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="Private Salt" :message="errors.salt" :class="{'has-error': errors.salt}">
					<b-input type="input" v-model="values.salt" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="3" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="4" :variants="variants" :values="values" :disabled="disabled"/>
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-ipaymu", {computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте ipaymu.com').replace('%s', 'href="https://www.ipaymu.com" target="_blank"');
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				
				<b-field label="Virtual Account" :message="errors.account" :class="{'has-error': errors.account}">
					<b-input type="input" v-model="values.account" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="API key" :message="errors.key" :class="{'has-error': errors.key}">
					<b-input type="input" v-model="values.key" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="3" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="4" :variants="variants" :values="values" :disabled="disabled"/>
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-iyzico", {computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте iyzico.com').replace('%s', 'href="https://iyzico.com" target="_blank"');
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				
				<b-field label="API key" :message="errors.api_key" :class="{'has-error': errors.api_key}">
					<b-input type="input" v-model="values.api_key" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="Secret key" :message="errors.api_key" :class="{'has-error': errors.secret_key}">
					<b-input type="input" v-model="values.secret_key" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="3" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="4" :variants="variants" :values="values" :disabled="disabled"/>
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-liqpay", {props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
	
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://www.liqpay.ua/" target="_blank">Зарегистрируйтесь</a> на сайте www.liqpay.ua<br>
			</div>
		</div>
	
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
			<div class="has-mb-1">Введите полученные "public_key" и "private_key"</div>

				<b-field label="public_key:" :message="errors.public_key" :class="{'has-error': errors.public_key}">
					<b-input type="text" v-model="values.public_key" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="private_key:" :message="errors.private_key" :class="{'has-error': errors.private_key}">
					<b-input type="text" v-model="values.private_key" :disabled="disabled"></b-input>
				</b-field>

			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="3" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="4" :variants="variants" :values="values" :disabled="disabled"/>

	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-midtrans", {props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],
		computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте midtrans.com').replace('%s', 'href="https://midtrans.com" target="_blank"');
			}
		}, template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
	
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
			<div class="has-mb-1">{{'Укажите полученные данные от Midtrans'|gettext}}</div>

				<b-field label="Client Key:" :message="errors.client_key" :class="{'has-error': errors.client_key}">
					<b-input type="text" v-model="values.client_key" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="Server Key:" :message="errors.server_key" :class="{'has-error': errors.server_key}">
					<b-input type="text" v-model="values.server_key" :disabled="disabled"></b-input>
				</b-field>

			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="3" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="4" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-modulbank", {computed: {
			domain() {
				return this.$account.custom_domain_verified?this.$account.link:'https://'+this.variants.domain_must;
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://modulbank.ru" target="_blank">Зарегистрируйтесь</a> на сайте modulbank.ru и добавьте "Интернет-эквайринг"<br>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
			<div class="has-mb-1">Укажите адрес сайта:</div>
				<div class="field" v-if="$account.custom_domain">
					<div class="has-feedback">
					<input type="text" :value="domain" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="domain" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				<div v-else class="message is-danger">
					<div class="message-body">МодульБанк требует наличие своего доменного имени, подробнее о <a href="https://modulbank.ru/fs/files/demands-for-sources.pdf" target="_blank">требованиях</a></div>
				</div>
			</div>
		</div>
		
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div class="has-mb-1">Укажите данные полученные из МодульБанка:</div>
	
				<b-field label="Идентификатор магазина:" :message="errors.merchant_id" :class="{'has-error': errors.merchant_id}">
					<b-input type="text" v-model="values.merchant_id" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="Тестовый секретный ключ:" :message="errors.test_key" :class="{'has-error': errors.test_key}">
					<b-input type="text" v-model="values.test_key" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="Рабочий секретный ключ:" :message="errors.work_key" :class="{'has-error': errors.work_key}">
					<b-input type="text" v-model="values.work_key" :disabled="disabled"></b-input>
				</b-field>

			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
	 	
	 	<div class="media">
			<div class="media-left"><span class='tag is-dark'>5</span></div>
			<div class="media-content">
				<div>Онлайн касса</div>
				<b-checkbox v-model="values.onlinekassa" :disabled="disabled">Использовать Modulbank в качестве онлайн кассы для отправки чеков</b-checkbox>
			</div>
	 	</div>		 	
		
		<vue-settings-payments-provider-mode index="6" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-paddle", {data() {
			return {
				resultUrl: 'http://taplink.cc/payments/paddle/result.html'
			}
		},
		computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте paddle.com').replace('%s', 'href="https://www.paddle.com" target="_blank"');
			},
			webhookText() {
				return this.$gettext('<a %s>Установите</a> URL для получения уведомлений и выберите все Webhook события').replace('%s', 'href="https://vendors.paddle.com/account#tabs-alerts" target="_blank"');
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
	
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				
				<b-field :label="'Укажите ваш vendor_id:'|gettext" :message="errors.vendor_id" :class="{'has-error': errors.vendor_id}">
					<b-input type="text" v-model="values.vendor_id" :disabled="disabled"></b-input>
				</b-field>
				
				<b-field :label="'Укажите ваш vendor_auth_code:'|gettext" :message="errors.vendor_auth_code" :class="{'has-error': errors.vendor_auth_code}">
					<b-input type="text" v-model="values.vendor_auth_code" :disabled="disabled"></b-input>
				</b-field>
				
				<b-field :label="'Укажите ваш public_key:'|gettext" :message="errors.public_key" :class="{'has-error': errors.public_key}">
					<b-input type="textarea" v-model="values.public_key" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>

		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div class="has-mb-1" v-html="webhookText"></div>
				<div class="field">
					<label class="label">{{'URL для Webhook:'|gettext}}</label>
					<div class="has-feedback">
					<input type="text" :value="resultUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
		
<!--
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>5</span></div>
			<div class="media-content">
				<div class="has-mb-1">Режим работы</div>
	
				<div class="row">
					<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='mode' value="test" v-model="values.mode"> Тестовый режим</label></div>
					<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='mode' value="work" v-model="values.mode"> Рабочий режим</label></div>
				</div>               
			</div>
	 	</div>		
-->
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-payanyway", {props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],
		
		computed: {
			checkUrl() {
				return 'https://taplink.cc/payments/payanyway/check.html';
			},

			payUrl() {
				return 'https://taplink.cc/payments/payanyway/result.html';
			},

			comebackUrl() {
				return this.variants.domain_base+'/payments/payanyway/comeback.html';
			},
			
			processingUrl() {
				return this.variants.domain_base+'/payments/payanyway/processing.html';
			}
		}, template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://payanyway.ru" target="_blank">Зарегистрируйтесь</a> на сайте payanyway.ru</p>
			</div>
		</div>	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				
				<div class="row row-small">
					<div class="col-xs-12 col-sm-6 has-xs-mb-2">
						<b-field label="Номер счета, полученный при подключении:" :message="errors.mnt_id" :class="{'has-error': errors.mnt_id}">
							<b-input type="text" v-model="values.mnt_id" :disabled="disabled"></b-input>
						</b-field>
					</div>
					<div class="col-xs-12 col-sm-6">
						<b-field label="Код проверки целостности данных:" :message="errors.password" :class="{'has-error': errors.password}">
							<b-input type="text" v-model="values.password" :disabled="disabled"></b-input>
						</b-field>
					</div>
				</div>
			</div>
		</div>

		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div class="has-mb-1">Укажите настройки уведомлений об оплате </div>
				<div class="field">
					<label class="label">Check URL:</label>
					<div class="has-feedback">
					<input type="text" :value="checkUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="checkUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				<div class="field">
					<label class="label">Pay URL:</label>
					<div class="has-feedback">
					<input type="text" :value="payUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="payUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>

		<div class="media">
			<div class="media-left"><span class='tag is-dark'>4</span></div>
			<div class="media-content">
				<div class="has-mb-1">Укажите настройки возврата в магазин</div>
				<div class="field">
					<label class="label">Success URL, Fail URL, Return URL:</label>
					<div class="has-feedback">
					<input type="text" :value="comebackUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="comebackUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
	
				<div class="field">
					<label class="label">InProgress URL:</label>
					<div class="has-feedback">
					<input type="text" :value="processingUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="processingUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>		
		
		<vue-settings-payments-provider-methods index="5" :variants="variants" :values="values" :disabled="disabled"/>
	 	
	 	<div class="media">
			<div class="media-left"><span class='tag is-dark'>6</span></div>
			<div class="media-content">
				<div>Онлайн касса</div>
				<b-checkbox v-model="values.onlinekassa" :disabled="disabled">Использовать Payanyway в качестве онлайн кассы для отправки чеков</b-checkbox>
			</div>
	 	</div>		 	
		
		<vue-settings-payments-provider-mode index="7" :variants="variants" :values="values" :disabled="disabled"/>
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-payberry", {props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://payberry.ru" target="_blank">Зарегистрируйтесь</a> на сайте payberry.ru</p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<b-field label='Укажите ваш "merchant_id"' :message="errors.merchant_id" :class="{'has-error': errors.merchant_id}">
					<b-input type="text" v-model="values.merchant_id" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<b-field label='Укажите ваш "service_id"' :message="errors.service_id" :class="{'has-error': errors.service_id}">
					<b-input type="text" v-model="values.service_id" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>

		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<b-field label='Укажите ваш "key"' :message="errors.key" :class="{'has-error': errors.key}">
					<b-input type="text" v-model="values.key" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>

		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<b-field label='Укажите ваш "url"' :message="errors.url" :class="{'has-error': errors.url}">
					<b-input type="text" v-model="values.url" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="5" :variants="variants" :values="values" :disabled="disabled"/>


	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-paybox", {props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://paybox.money" target="_blank">Зарегистрируйтесь</a> на сайте paybox.money</p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<b-field label='Укажите ваш "merchant_id"' :message="errors.merchant_id" :class="{'has-error': errors.merchant_id}">
					<b-input type="text" v-model="values.merchant_id" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<b-field label='Укажите ваш "secret_key"' :message="errors.secret_key" :class="{'has-error': errors.secret_key}">
					<b-input type="text" v-model="values.secret_key" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="5" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-payeer", {computed: {
			domain() {
				return this.$account.custom_domain_verified?this.$account.link:'https://'+this.variants.domain_must;
			},
			
			comebackUrl() {
				return this.$account.custom_domain_verified?(this.variants.domain_must+'/payments/payeer/comeback.html'):'';
			},

			resultUrl() {
				return this.$account.custom_domain_verified?(this.variants.domain_must+'/payments/payeer/result.html'):'';
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
	
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://www.payeer.com/" target="_blank">Зарегистрируйтесь</a> на сайте www.payeer.com<br>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
			<div class="has-mb-1">Укажите адрес сайта:</div>
				<div class="field" v-if="$account.custom_domain">
					<div class="has-feedback">
					<input type="text" :value="domain" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="domain" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				<div v-else class="message is-danger">
					<div class="message-body">Payeer требует наличие своего доменного имени</div>
				</div>
			</div>
		</div>
	
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<b-field label="Укажите содержимое проверочного файла:">
					<b-input type="text" v-model="values.verifycode" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
	
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>4</span></div>
			<div class="media-content">
			<div class="has-mb-1">Введите полученные "ID" и "Секретный ключ"</div>

				<b-field label="ID:" :message="errors.id" :class="{'has-error': errors.id}">
					<b-input type="text" v-model="values.id" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="Секретный ключ:" :message="errors.secret" :class="{'has-error': errors.secret}">
					<b-input type="text" v-model="values.secret" :disabled="disabled"></b-input>
				</b-field>

			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>5</span></div>
			<div class="media-content">
				<div class="has-mb-1">Укажите настройки</div>
				<div class="field">
					<label class="label">URL успешной оплаты:</label>
					<div class="has-feedback">
					<input type="text" :value="comebackUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="comebackUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
	
				<div class="field">
					<label class="label">URL неуспешной оплаты:</label>
					<div class="has-feedback">
					<input type="text" :value="comebackUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="comebackUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				
				<div class="field">
					<label class="label">URL обработчика:</label>
					<div class="has-feedback">
					<input type="text" :value="resultUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>	
		
		<vue-settings-payments-provider-methods index="6" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="7" :variants="variants" :values="values" :disabled="disabled"/>

	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-paykeeper", {computed: {
			domain() {
				return this.variants.domain_base+'/';
			},
			
			notifyUrl() {
				return this.variants.domain_base+'/payments/paykeeper/result.html';
			}

/*
			comebackUrl() {
				return this.variants.domain_base+'/payments/paykeeper/comeback.html';
			}
*/
		},

		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://paykeeper.ru" target="_blank">Зарегистрируйтесь</a> на сайте paykeeper.ru</p>
			</div>
		</div>	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
			<div class="has-mb-1">Заполните раздел "Обратные вызовы", везде выберите POST запрос</div>
				<div class="field">
					<label class="label">Payment notification:</label>
					<div class="has-feedback">
					<input type="text" :value="notifyUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="notifyUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
<!--
				<div class="field">
					<label class="label">Success redirect и Fail redirect:</label>
					<div class="has-feedback">
					<input type="text" :value="comebackUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="comebackUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
-->
			</div>
		</div>
					
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				Включите галочку "Повторно отправлять Payment Notification при сбоях" и "Разрешена замена URL"
			</div>
		</div>
							
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>4</span></div>
			<div class="media-content">
				<div class="has-mb-1">Укажите полученные данные от paykeeper</div>

				<b-field :label="'Ваш сайт:'|gettext" :message="errors.website" :class="{'has-error': errors.website}">
					<b-field>
					<b-input type="text" v-model="values.website" :disabled="disabled"></b-input>
					<p class="control"><span class="button is-static">.server.paykeeper.ru</span></p>
					</b-field>
				</b-field>
				
				<b-field :label="'Имя пользователя:'|gettext" :message="errors.user" :class="{'has-error': errors.user}">
					<b-input type="text" v-model="values.user" :disabled="disabled"></b-input>
				</b-field>

				<b-field :label="'Пароль:'|gettext" :message="errors.password" :class="{'has-error': errors.password}">
					<b-input type="text" v-model="values.password" :disabled="disabled"></b-input>
				</b-field>
				
				<b-field :label="'Секретное слово:'|gettext" :message="errors.secret" :class="{'has-error': errors.secret}">
					<b-input type="text" v-model="values.secret" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>5</span></div>
			<div class="media-content">
				<div>Онлайн касса</div>
				<b-checkbox v-model="values.onlinekassa" :disabled="disabled">Использовать PayKeeper в качестве онлайн кассы для отправки чеков</b-checkbox>
			</div>
	 	</div>	
		
		
		<vue-settings-payments-provider-methods index="6" :variants="variants" :values="values" :disabled="disabled"/>
		
<!--
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>6</span></div>
			<div class="media-content">
				<div class="has-mb-1">{{'Режим работы'|gettext}}</div>
	
				<div class="row">
					<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='mode' value="test" v-model="values.mode"> {{'Тестовый режим'|gettext}}</label></div>
					<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='mode' value="work" v-model="values.mode"> {{'Рабочий режим'|gettext}}</label></div>
				</div>               
			</div>
	 	</div>		
-->
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-paymaster", {computed: {
			domain() {
				return this.variants.domain_base+'/';
			},
			
			notifyUrl() {
				return this.variants.domain_must+'/payments/paymaster/result.html';
			},

			successUrl() {
				return this.variants.domain_must+'/payments/paymaster/success.html';
			},
			
			failUrl() {
				return this.variants.domain_must+'/payments/paymaster/fail.html';
			}
		},

		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://paymaster.ru" target="_blank">Зарегистрируйтесь</a> на сайте PayMaster.ru</p>
			</div>
		</div>	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
			<div class="has-mb-1">Заполните раздел "Обратные вызовы", везде выберите POST запрос</div>
				<div class="field">
					<label class="label">Payment notification:</label>
					<div class="has-feedback">
					<input type="text" :value="notifyUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="notifyUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				<div class="field">
					<label class="label">Success redirect и Fail redirect:</label>
					<div class="has-feedback">
					<input type="text" :value="successUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="successUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>
					
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				Включите галочку "Повторно отправлять Payment Notification при сбоях" и "Разрешена замена URL"
			</div>
		</div>
							
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>4</span></div>
			<div class="media-content">
				<div class="has-mb-1">Укажите полученные данные от PayMaster</div>
				
				<b-field :label="'Идентификатор сайта:'|gettext" :message="errors.merchant_id" :class="{'has-error': errors.merchant_id}">
					<b-input type="text" v-model="values.merchant_id" :disabled="disabled"></b-input>
				</b-field>
				
				<b-field :label="'Секретный ключ:'|gettext" :message="errors.secret" :class="{'has-error': errors.secret}">
					<b-input type="text" v-model="values.secret" :disabled="disabled"></b-input>
				</b-field>

				<b-field :label="'Тип подписи:'|gettext">
					<b-select type="text" v-model="values.hash" :disabled="disabled"><option value="md5">MD5</option><option value="sha256">SHA256</option></b-select>
				</b-field>
				
			</div>
		</div>

		<vue-settings-payments-provider-methods index="5" :variants="variants" :values="values" :disabled="disabled"/>
		
		
	 	<div class="media">
			<div class="media-left"><span class='tag is-dark'>6</span></div>
			<div class="media-content">
				<div>Онлайн касса</div>
				<b-checkbox v-model="values.onlinekassa" :disabled="disabled">Использовать PayMaster в качестве онлайн кассы для отправки чеков</b-checkbox>
			</div>
	 	</div>	
		
		<vue-settings-payments-provider-mode index="7" :variants="variants" :values="values" :disabled="disabled"/>
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-paymentwall", {computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте paymentwall.com').replace('%s', 'href="https://paymentwall.com" target="_blank"');
			}
			
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new'],
		mixins: [FormModel], template: `
	<div>
	
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				
				<b-field :label="'Укажите ваш public_key:'|gettext" :message="errors.public_key" :class="{'has-error': errors.public_key}">
					<b-input type="text" v-model="values.public_key"></b-input>
				</b-field>

				<b-field :label="'Укажите ваш private_key:'|gettext" :message="errors.private_key" :class="{'has-error': errors.private_key}">
					<b-input type="text" v-model="values.private_key"></b-input>
				</b-field>
				
			</div>
		</div>
		
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
			<div class="has-mb-1">{{'Выберите доступные варианты оплаты'|gettext}}</div>
			<div class="is-block" v-for="v in variants.payments_methods"><b-checkbox :native-value="v.payment_method_id" v-model="values.payments_methods">{{v.payment_method_title|gettext}}</b-checkbox></div>
			</div>
	 	</div>		
	
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>4</span></div>
			<div class="media-content">
				<div class="has-mb-1">{{'Режим работы'|gettext}}</div>
	
				<div class="row">
					<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='mode' value="test" v-model="values.mode"> {{'Тестовый режим'|gettext}}</label></div>
					<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='mode' value="work" v-model="values.mode"> {{'Рабочий режим'|gettext}}</label></div>
				</div>               
			</div>
	 	</div>	

	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-paypal", {data() {
			return {
				resultUrl: 'https://taplink.cc/payments/paypal/result.html'
			}
		},
		computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте paypal.com').replace('%s', 'href="https://www.paypal.com" target="_blank"');
			},
			businessTitle() {
				return this.$gettext('Введите ваш business аккаунт:')+' (email)';
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<label class="has-mb-1 is-block">{{'Укажите адрес для "Профиль" > "Мои инструменты продаж" > "Уведомления о мгновенных платежах" (IPN)'|gettext}}</label>
				<div class="field">
					<div class="has-feedback">
						<input type="text" :value="resultUrl" class="input" onfocus="this.select()" readonly="on" :disabled="disabled">
						<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>
			
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				
				<b-field :label="businessTitle" :message="errors.business" :class="{'has-error': errors.business}">
					<b-input type="email" v-model="values.business" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="5" :variants="variants" :values="values" :disabled="disabled"/>
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-paypostkz", {data() {
			return {
				resultUrl: 'https://taplink.cc/payments/paypostkz/result.html'
			}
		},
		computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте pay.post.kz').replace('%s', 'href="http://pay.post.kz" target="_blank"');
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<div class="field">
					<div class="has-feedback">
						<input type="text" :value="resultUrl" class="input" onfocus="this.select()" readonly="on">
						<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>
			
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				
				<b-field :label="'Введите ваш token:'|gettext" :message="errors.business" :class="{'has-error': errors.token}">
					<b-input type="text" v-model="values.token" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>

		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="5" :variants="variants" :values="values" :disabled="disabled"/>
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-paysera", {computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте paysera.com').replace('%s', 'href="https://paysera.com" target="_blank"');
			}
			
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
	
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				
				<b-field :label="'Укажите ваш projectid:'|gettext" :message="errors.projectid" :class="{'has-error': errors.projectid}">
					<b-input type="text" v-model="values.projectid" :disabled="disabled"></b-input>
				</b-field>

				<b-field :label="'Укажите ваш password:'|gettext" :message="errors.password" :class="{'has-error': errors.password}">
					<b-input type="text" v-model="values.password" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>
		
		
		<vue-settings-payments-provider-methods index="3" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="4" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-paystack", {data() {
			return {
				resultUrl: 'https://taplink.cc/payments/paystack/result.html',
				comebackUrl: 'https://taplink.cc/payments/paystack/comeback.html'
			}
		},
		computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте paystack.com').replace('%s', 'href="https://paystack.com" target="_blank"');
			},
			webhookText() {
				return this.$gettext('<a %s>Установите</a> Callback URL и Webhook URL').replace('%s', 'href="https://dashboard.paystack.com/#/settings/developer" target="_blank"');
			}
			
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
	
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				
				<b-field :label="'Укажите ваш Secret Key:'|gettext" :message="errors.secret_key" :class="{'has-error': errors.secret_key}">
					<b-input type="text" v-model="values.secret_key" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div class="has-mb-1" v-html="webhookText"></div>
				<div class="field">
					<label class="label">{{'Callback URL:'|gettext}}</label>
					<div class="has-feedback">
					<input type="text" :value="comebackUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="comebackUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				<div class="field">
					<label class="label">{{'Webhook URL:'|gettext}}</label>
					<div class="has-feedback">
					<input type="text" :value="resultUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>

		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="5" :variants="variants" :values="values" :disabled="disabled"/>
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-payu", {data() {
			return {
				versions: {lu: 'Live Update', rest21: 'REST API 2.1'}
			}
		},
		
		computed: {
			titles() {
				let titles = {
					lu: {'merchant': 'Merchant', 'secret_key': 'Secret key'},
					rest21: {'merchant': 'POS ID', 'secret_key': 'Second key'}
				}
				
				return titles[this.values.version];
			}
		},
		
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://payu.ru" target="_blank">Зарегистрируйтесь</a> на сайте payu.ru</p>
			</div>
		</div>	

		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			
			<div class="media-content">
				<div class="has-mb-1">Выберите метод подключения</div>
				<b-select type="text" v-model="values.version" :disabled="disabled">
					<option v-for="(v, id) in versions" :value="id">{{v}}</option>
				</b-select>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div class="has-mb-1">Укажите полученные данные от PayU</div>
				
				<b-field :label="titles.merchant" :message="errors.merchant" :class="{'has-error': errors.merchant}">
					<b-input type="text" v-model="values.merchant" :disabled="disabled"></b-input>
				</b-field>
				
				<b-field :label="titles.secret_key" :message="errors.secret_key" :class="{'has-error': errors.secret_key}">
					<b-input type="text" v-model="values.secret_key" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="5" :variants="variants" :values="values" :disabled="disabled"/>
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-pulpal", {data() {
			return {
				resultUrl: 'https://taplink.cc/payments/pulpal/result.html',
				redirectUrl: 'https://taplink.cc/payments/pulpal/comeback.html'
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],
		
		computed: {
			resultUrl() {
				return this.variants.domain_base+'/payments/pulpal/result.html';
			},

			redirectUrl() {
				return this.variants.domain_base+'/payments/pulpal/comeback.html';
			},
			
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте pulpal.az').replace('%s', 'href="https://pulpal.az" target="_blank"');
			}
		}, template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
				<div v-if="i18n.locale == 'az'">
				<br>
				<p>Pulpal'da hesabıma ödəniş qəbul etmək üçün nə lazımdır?</p>

<p>- Hüquqi şəxslər üçün:</p>
<p>1.Cixarış</p>
<p>2.VÖEN</p>
<p>3.Nizamnamə</p>
<p>4.Şəxsiyyət vəsiqəsi direktorun</p>
<p>5.Direktorun təyin olunması</p><br>

<p>Fərdi sahibkar üçün:</p>
<p>1. VÖEN</p>
<p>2. Şəxsiyyət vəsiqəsi</p><br>

<p>Müqaviləni yükləyirsiniz, tələb olunan məlumatları daxil edirsiniz və <a href='mailto:office@pulpal.az' target="_blank">office@pulpal.az</a> email ünvanına göndərirsiniz. Gün ərzində hesabınız aktivləşdirilir. Daha sonra öz məhslunuzu və ya xidmətinizi müştərilərinizə sata bilərsiniz.</p>
				</div>
			</div>
		</div>	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<label class="has-mb-1 is-block">{{'Укажите адрес для Delivery URL и Redirect URL'|gettext}}</label>
				<div class="field">
					<label class="label">Delivery URL</label>
					<div class="has-feedback">
						<input type="text" :value="resultUrl" class="input" onfocus="this.select()" readonly="on">
						<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				
				<div class="field">
					<label class="label">Redirect URL</label>
					<div class="has-feedback">
						<input type="text" :value="redirectUrl" class="input" onfocus="this.select()" readonly="on">
						<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="redirectUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>		
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div class="has-mb-1">{{'Укажите полученные данные от PulPal'|gettext}}</div>

				<b-field :label="'merchant_id:'|gettext" :message="errors.merchant_id" :class="{'has-error': errors.merchant_id}">
					<b-input type="text" v-model="values.merchant_id" :disabled="disabled"></b-input>
				</b-field>

				<b-field :label="'key:'|gettext" :message="errors.key" :class="{'has-error': errors.key}">
					<b-input type="text" v-model="values.key" :disabled="disabled"></b-input>
				</b-field>
				
				<b-field :label="'salt:'|gettext" :message="errors.salt" :class="{'has-error': errors.salt}">
					<b-input type="text" v-model="values.salt" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="5" :variants="variants" :values="values" :disabled="disabled"/>

	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-razorpay", {data() {
			return {
				resultUrl: 'https://taplink.cc/payments/razorpay/result.html'
			}
		},
		computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте razorpay.com').replace('%s', 'href="https://razorpay.com" target="_blank"');
			},
			webhookText() {
				return this.$format(this.$gettext('<a {1}>Добавьте</a> Webhook для получения уведомлений и выберите событие "{2}"'), 'href="https://dashboard.razorpay.com/app/webhooks" target="_blank"', 'payment.authorized');
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<b-field label="Key Id" :message="errors.key_id" :class="{'has-error': errors.key_id}">
					<b-input type="input" v-model="values.key_id" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="Key secret" :message="errors.secret" :class="{'has-error': errors.secret}">
					<b-input type="input" v-model="values.secret" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<div class="has-mb-1" v-html="webhookText"></div>
				<div class="field">
					<label class="label">{{'URL для Webhook:'|gettext}}</label>
					<div class="has-feedback">
					<input type="text" :value="resultUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				<b-field label="Webhook secret" :message="errors.webhook_secret" :class="{'has-error': errors.webhook_secret}">
					<b-input type="input" v-model="values.webhook_secret" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>		
		
		<vue-settings-payments-provider-methods index="3" :variants="variants" :values="values" :disabled="disabled"/>
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-robokassa", {props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		computed: {
			domain() {
				return this.variants.domain_must+'/';
			},
			
			resultUrl() {
				return this.variants.domain_must+'/payments/robokassa/result.html';
			},

			successUrl() {
				return this.variants.domain_must+'/payments/robokassa/success.html';
			},
			
			failUrl() {
				return this.variants.domain_must+'/payments/robokassa/fail.html';
			}
		},
		mixins: [FormModel], template: `
	<div>
		<div class="message is-success"><div class="message-body">Инструкции по настройке Робокассы <a href="/guide/payments-robokassa.html" target="_blank" class="is-pulled-right">Посмотреть <i class="fa fa-angle-right" style="margin-left: 5px"></i></a></div></div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://partner.robokassa.ru/Reg/Register" target="_blank">Зарегистрируйтесь</a> на сайте robokassa.ru и добавьте магазин<br>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
			<div class="has-mb-1">Укажите настройки </div>
				<div class="field">
					<label class="label">URL сайта:</label>
					<div class="has-feedback">
					<input type="text" :value="domain" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="domain" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				<div class="field">
					<label class="label">Result URL:</label>
					<div class="has-feedback">
					<input type="text" :value="resultUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				<div class="field">
					<label class="label">Success URL:</label>
					<div class="has-feedback">
					<input type="text" :value="successUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="successUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
	
				<div class="field">
					<label class="label">Fail URL:</label>
					<div class="has-feedback">
					<input type="text" :value="failUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="failUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				
				<p>Алгоритм расчета хеша необходимо указать MD5, а метод отсылки данных везде указать GET</p>
			</div>
		</div>
		
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div class="has-mb-1">Укажите Идентификатор магазина, 'Пароль #1' и 'Пароль #2'</div>

				<b-field label="Идентификатор магазина:" :message="errors.login" :class="{'has-error': errors.login}">
					<b-input type="text" v-model="values.login" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="Пароль #1:" :message="errors.password_1" :class="{'has-error': errors.password_1}">
					<b-input type="text" v-model="values.password_1" :disabled="disabled"></b-input>
				</b-field>

				<b-field label="Пароль #2:" :message="errors.password_2" :class="{'has-error': errors.password_2}">
					<b-input type="text" v-model="values.password_2" :disabled="disabled"></b-input>
				</b-field>

			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
	 	
	 	<div class="media">
			<div class="media-left"><span class='tag is-dark'>5</span></div>
			<div class="media-content">
				<div>Онлайн касса</div>
				<b-checkbox v-model="values.onlinekassa" :disabled="disabled">Использовать Робокассу в качестве онлайн кассы для отправки чеков</b-checkbox>
			</div>
	 	</div>	
	 	
	 	
	 	<div class="media">
			<div class="media-left"><span class='tag is-dark'>6</span></div>
			<div class="media-content">
				<div class="has-mb-1">Кто оплачивает комиссию Робокассы?</div>
	
				<div class="row">
					<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='commission' value="buyer" v-model="values.commission" :disabled="disabled"> Покупатель</label></div>
					<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='commission' value="seller" v-model="values.commission" :disabled="disabled"> Продавец</label></div>
				</div>               
			</div>
	 	</div>			 	
		
		<vue-settings-payments-provider-mode index="7" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-sberbank", {data() {
			return {
				resultUrl: this.variants.domain_base+'/payments/sberbank/result.html',
				countries: {ru: 'Россия', kz: 'Казахстан'}
			}
		},

		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],
		
		computed: {
			link() {
				let links = {
					ru: 'https://www.sberbank.ru/ru/s_m_business/bankingservice/acquiring_total',
					kz: 'https://www.sberbank.kz/ru/small_business/calcs/s-pokupatelyami/calc/ekvajring'
				}
				
				return links[this.values.country];
			}
		}, template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			
			<div class="media-content">
				<div class="has-mb-1">Страна</div>
				<b-select type="text" v-model="values.country" :disabled="disabled">
					<option v-for="(v, id) in countries" :value="id">{{v}}</option>
				</b-select>
			</div>
		</div>

		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<p><a :href="link" target="_blank">Зарегистрируйтесь</a> на сайте эквайринга от Сбербанка</p>
			</div>
		</div>	
		
		
		
		
<!--
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<p>Обратитесь в службу технической поддержки и попросите включить контрольную сумму в уведомлениях и получите закрытый ключ</p>
			</div>
		</div>
-->
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<p class="has-mb-1">Передайте в Сбербанк URL для Callback-уведомлений с симметричной криптографией:</p>
				<div class="has-feedback">
				<input type="text" :value="resultUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
				<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
				</div>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>4</span></div>
			<div class="media-content">
				<div class="row">
					<div class="col-xs-12 col-sm-6">
						<b-field :label="'Логин служебной учётной записи продавца:'|gettext" :message="errors.username" :class="{'has-error': errors.username}">
							<b-input type="text" v-model="values.username" :disabled="disabled"></b-input>
						</b-field>
		
						<b-field :label="'Пароль служебной учётной записи продавца:'|gettext" :message="errors.password" :class="{'has-error': errors.password}">
							<b-input type="text" v-model="values.password" :disabled="disabled"></b-input>
						</b-field>
						
<!--
						<b-field :label="'Тип платежа:'|gettext">
							<b-select v-model="values.register_type">
								<option value="register">Одностадийный платеж</option>
								<option value="register_pre_auth">Двухстадийный платеж</option>
							</b-select>
						</b-field>
-->
					</div>
				</div>

<!--
				<b-field :label="'Закрытый ключ:'|gettext" :message="errors.secret" :class="{'has-error': errors.secret}">
					<b-input type="text" v-model="values.secret"></b-input>
				</b-field>
-->
				
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="5" :variants="variants" :values="values" :disabled="disabled"/>
	 	
	 	<div class="media">
			<div class="media-left"><span class='tag is-dark'>6</span></div>
			<div class="media-content">
				<div>Онлайн касса</div>
				<b-checkbox v-model="values.onlinekassa" :disabled="disabled">Использовать Сбербанк в качестве онлайн кассы для отправки чеков</b-checkbox>
			</div>
	 	</div>		 	
		
	 	<div class="media">
			<div class="media-left"><span class='tag is-dark'>7</span></div>
			<div class="media-content">
				<div>Двухстадийная оплата</div>
				<b-checkbox v-model="values.withaccept" :disabled="disabled">Подтверждать каждую оплату в личном кабинете</b-checkbox>
			</div>
	 	</div>		 		
		
		<vue-settings-payments-provider-mode index="8" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-sposkz", {data() {
			return {
				resultUrl: 'https://taplink.cc/payments/ecommpay/result.html'
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],
		computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте spos.kz').replace('%s', 'href="https://spos.kz" target="_blank"');
			}
		}, template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div class="has-mb-1">{{'Укажите полученные данные от Smart Pay'|gettext}}</div>

				<b-field :label="'merchant_id:'|gettext" :message="errors.merchant_id" :class="{'has-error': errors.merchant_id}">
					<b-input type="text" v-model="values.merchant_id" :disabled="disabled"></b-input>
				</b-field>

				<b-field :label="'key:'|gettext" :message="errors.key" :class="{'has-error': errors.key}">
					<b-input type="text" v-model="values.key" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="5" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-square", {data() {
			return {
				resultUrl: 'https://taplink.cc/payments/square/result.html'
			}
		},
		computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте squareup.com').replace('%s', 'href="https://squareup.com" target="_blank"');
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],
		
		created() {
			this.$io.on('events:payments.square:connect.resolve', this.connectResolve);
		},
		
		destroyed() {
			this.$io.off('events:payments.square:connect.resolve', this.connectResolve);
		},
				
		methods: {
			connectResolve(values) {
				_.each(values, (v, k) => { this.values[k] = v; });
				this.$parent.save(false, false);
			},

			connect() {
				this.$parent.popupCenter('/payments/square/connect.html', 'square', 70, .6, 800, 400);
			}
		}, template: `
	<div>

		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
		
<!--
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				
				<b-field label="Application ID:" :message="errors.app_id" :class="{'has-error': errors.app_id}">
					<b-input type="text" v-model="values.app_id"></b-input>
				</b-field>

				<b-field label="Access Token:" :message="errors.access_token" :class="{'has-error': errors.access_token}">
					<b-input type="text" v-model="values.access_token"></b-input>
				</b-field>
			</div>
		</div>	
-->	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<div class="has-mb-1">{{'Подключите интеграцию'|gettext}}</div>
				<b-field :message="errors.access_token" :class="{'has-error': errors.access_token}">
				<button class="button is-success" @click="connect" :disabled="disabled"><i class="fas fa-plug has-mr-2"></i> {{'Подключить'|gettext}}</button>
				<div class="form-control-static has-ml-2 has-text-success" v-if="values.access_token">
					<i class="fas fa-check has-mr-1"></i> {{'Готово'|gettext}}
				</div>
				</b-field>
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="3" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-stripe", {data() {
			return {
				resultUrl: 'https://taplink.cc/payments/stripe/result.html'
			}
		},
		computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте stripe.com').replace('%s', 'href="https://stripe.com" target="_blank"');
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>

		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">

				<b-field :label="'Укажите ваш Publishable key:'|gettext" :message="errors.pk" :class="{'has-error': errors.pk}">
					<b-input type="text" v-model="values.pk" :disabled="disabled"></b-input>
				</b-field>


				<b-field :label="'Укажите ваш Secret key:'|gettext" :message="errors.sk" :class="{'has-error': errors.sk}">
					<b-input type="text" v-model="values.sk" :disabled="disabled"></b-input>
				</b-field>
				
				<transition name="fade">
				<b-field :label="'Содержимое файла верификации для Apple Pay:'|gettext" :message="errors.apple_pay_code" :class="{'has-error': errors.apple_pay_code}" v-if="values.payments_methods.indexOf(21) != -1">
					<b-input type="text" v-model="values.apple_pay_code" :disabled="disabled || !$account.custom_domain_verified"></b-input>
				</b-field>
				</transition>				
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="3" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="4" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-tinkoff", {data() {
			return {
				resultUrl: "https://taplink.cc/payments/tinkoff/result.html"
			}
		},
		
		computed: {
			successUrl() {
				return this.variants.domain_base+'/payments/tinkoff/comeback.html';
			},

			failUrl() {
				return this.variants.domain_base+'/payments/tinkoff/fail.html';
			}
		},
		
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
	
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://oplata.tinkoff.ru" target="_blank">Зарегистрируйтесь</a> на сайте oplata.tinkoff.ru</p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<div class="field">
					<label class="label">Укажите тип нотификации "HTTP"</label>
					<p class="has-mb-1">Ссылка для уведомлений:</p>
					<div class="has-feedback">
					<input type="text" :value="resultUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>
			

		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
			<div class="has-mb-1">Укажите целевые URL в настройках подключения</div>
<!--
				<div class="field">
					<label class="label">URL для нотификации:</label>
					<div class="has-feedback">
					<input type="text" :value="resultUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
-->
				<div class="field">
					<label class="label">URL страницы успешного платежа:</label>
					<div class="has-feedback">
					<input type="text" :value="successUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="successUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
				<div class="field">
					<label class="label">URL страницы неуспешного платежа:</label>
					<div class="has-feedback">
					<input type="text" :value="failUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="failUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>
	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>4</span></div>
			<div class="media-content">
				<b-field label='Укажите ваш "Терминал":' :message="errors.terminalkey" :class="{'has-error': errors.terminalkey}">
					<b-input type="text" v-model="values.terminalkey" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
			
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>5</span></div>
			<div class="media-content">
				<b-field label='Укажите ваш "Пароль":' :message="errors.password" :class="{'has-error': errors.password}">
					<b-input type="text" v-model="values.password" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>6</span></div>
			<div class="media-content">
				<b-field label="Содержимое файла верификации для Apple Pay:" :message="errors.apple_pay_code" :class="{'has-error': errors.apple_pay_code}">
					<b-input type="text" v-model="values.apple_pay_code" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>		
		
		<vue-settings-payments-provider-methods index="7" :variants="variants" :values="values" :disabled="disabled"/>
	 	
	 	<div class="media">
			<div class="media-left"><span class='tag is-dark'>8</span></div>
			<div class="media-content">
				<div>Онлайн касса</div>
				<b-checkbox v-model="values.onlinekassa" :disabled="disabled">Использовать Тинькофф в качестве онлайн кассы для отправки чеков</b-checkbox>
			</div>
	 	</div>		 		
					
	 	<div class="media">
			<div class="media-left"><span class='tag is-dark'>9</span></div>
			<div class="media-content">
				<div>Двухстадийная оплата</div>
				<b-checkbox v-model="values.withaccept" :disabled="disabled">Подтверждать каждую оплату в личном кабинете</b-checkbox>
			</div>
	 	</div>		 		
					
		<vue-settings-payments-provider-mode index="10" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-unitpay", {computed: {
			resultUrl() {
				return this.domain+'/payments/unitpay/result.html';
			},
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте unitpay.ru').replace('%s', 'href="https://unitpay.ru" target="_blank"');
			},
			domain() {
				return this.$account.custom_domain_verified?this.$account.link:this.variants.domain_must;
			}			
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				
				<b-field :label="'Вы зарегистрироваилсь как:'|gettext" :message="errors.type" :class="{'has-error': errors.type}">
					<b-select type="text" v-model="values.type" :disabled="disabled">
						<option value="1">Юридическое лицо</option>
						<option value="2">Физическое лицо</option>
					</b-select>
				</b-field>

			</div>
		</div>	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div class="has-mb-1">Добавьте проект и укажите настройки настройки </div>
				<div class="field" v-if="$account.custom_domain">
					<label class="label">URL проекта:</label>
					<div class="has-feedback">
					<input type="text" :value="domain" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="domain" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					<p class="has-mt-1">Для подтверждения сайта используйте Мета-тег который следует разместить в HTML коде (Настройки -> Общие -> Вставка HTML кода)
					</div>
				</div>
				<div v-else class="message is-danger">
					<div class="message-body">Unitpay требует наличие своего доменного имени</div>
				</div>

				<div class="field">
					<label class="label">Обработчик платежей:</label>
					<div class="has-feedback">
					<input type="text" :value="resultUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>4</span></div>
			<div class="media-content">
				
				<b-field :label="'Укажите ID вашего проекта:'|gettext" :message="errors.project_id" :class="{'has-error': errors.project_id}">
					<b-input type="text" v-model="values.project_id" :disabled="disabled"></b-input>
				</b-field>

				<b-field :label="'Укажите ваш секретный ключ:'|gettext" :message="errors.secret_key" :class="{'has-error': errors.secret_key}">
					<b-input type="text" v-model="values.secret_key" :disabled="disabled"></b-input>
				</b-field>
				
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="5" :variants="variants" :values="values" :disabled="disabled"/>

	 	<div class="media">
			<div class="media-left"><span class='tag is-dark'>6</span></div>
			<div class="media-content">
				<div>Онлайн касса</div>
				<b-checkbox v-model="values.onlinekassa" :disabled="values.type != 1" :disabled="disabled">Использовать Unitpay в качестве онлайн кассы для отправки чеков</b-checkbox>
			</div>
	 	</div>		 		

	 	<div class="media">
			<div class="media-left"><span class='tag is-dark'>7</span></div>
			<div class="media-content">
				<div>Двухстадийная оплата</div>
				<b-checkbox v-model="values.withaccept" :disabled="disabled">Подтверждать каждую оплату в личном кабинете</b-checkbox>
			</div>
	 	</div>		 		
	
		<vue-settings-payments-provider-mode index="8" :variants="variants" :values="values" :disabled="disabled"/>


	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-walletone", {props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],
		computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте walletone.com').replace('%s', 'href="https://walletone.com" target="_blank"');
			},

			notifyUrl() {
				return this.variants.domain_base+'/payments/walletone/result.html';
			}
		}, template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<div class="has-mb-1">{{'Укажите полученные данные от WalletOne'|gettext}}</div>

				<b-field :label="'Идентификатор интернет-магазина:'|gettext" :message="errors.merchant_id" :class="{'has-error': errors.merchant_id}">
					<b-input type="text" v-model="values.merchant_id" :disabled="disabled"></b-input>
				</b-field>

				<b-field :label="'Цифровая подпись (MD5):'|gettext" :message="errors.secret_key" :class="{'has-error': errors.secret_key}">
					<b-input type="text" v-model="values.secret_key" :disabled="disabled"></b-input>
				</b-field>

			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div class="field">
					<label class="label">URL скрипта интеграции:</label>
					<div class="has-feedback">
					<input type="text" :value="notifyUrl" class="input" onfocus="this.focus();this.select()" readonly="on" :disabled="disabled">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="notifyUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="5" :variants="variants" :values="values" :disabled="disabled"/>
	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-wayforpay", {props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],
		computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте wayforpay.com').replace('%s', 'href="https://wayforpay.com" target="_blank"');
			},
/*

			notifyUrl() {
				return this.variants.domain_base+'/payments/wayforpay/result.html';
			}
*/
		}, template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<div class="has-mb-1">{{'Укажите полученные данные от WayForPay'|gettext}}</div>

				<b-field :label="'Идентификатор продавца:'|gettext" :message="errors.merchant" :class="{'has-error': errors.merchant}">
					<b-input type="text" v-model="values.merchant" :disabled="disabled"></b-input>
				</b-field>

				<b-field :label="'SecretKey:'|gettext" :message="errors.secret_key" :class="{'has-error': errors.secret_key}">
					<b-input type="text" v-model="values.secret_key" :disabled="disabled"></b-input>
				</b-field>

			</div>
		</div>
<!--
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div class="field">
					<label class="label">URL скрипта интеграции:</label>
					<div class="has-feedback">
					<input type="text" :value="notifyUrl" class="input" onfocus="this.focus();this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="notifyUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
		</div>
-->
		
		<vue-settings-payments-provider-methods index="3" :variants="variants" :values="values" :disabled="disabled"/>
		<vue-settings-payments-provider-mode index="4" :variants="variants" :values="values" :disabled="disabled"/>
		
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-xendit", {props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],
		computed: {
			signupText() {
				return this.$gettext('<a %s>Зарегистрируйтесь</a> на сайте xendit.co').replace('%s', 'href="https://xendit.co" target="_blank"');
			},
/*

			notifyUrl() {
				return this.variants.domain_base+'/payments/wayforpay/result.html';
			}
*/
		}, template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p v-html="signupText"></p>
			</div>
		</div>	
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<b-field :label="'Public key:'|gettext" :message="errors.public_key" :class="{'has-error': errors.public_key}">
					<b-input type="text" v-model="values.public_key" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<b-field :label="'Secret key (Money-in products: Write):'|gettext" :message="errors.secret_key" :class="{'has-error': errors.secret_key}">
					<b-input type="text" v-model="values.secret_key" :disabled="disabled"></b-input>
				</b-field>
			</div>
		</div>
		
		<vue-settings-payments-provider-methods index="3" :variants="variants" :values="values" :disabled="disabled"/>
<!-- 		<vue-settings-payments-provider-mode index="4" :variants="variants" :values="values" :disabled="disabled"/> -->
		
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-yandexkassa", {data() {
			return {
				resultUrl: 'https://taplink.cc/payments/yandexkassa/result.html'
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel], template: `
	<div>
		<div v-if="values.method == 'api'">
			<div class="media">
				<div class="media-left"><span class='tag is-dark'>1</span></div>
				<div class="media-content">
					<p><a href="https://yookassa.ru" target="_blank">Зарегистрируйтесь</a> на сайте yookassa.ru<br>
					В настройках выберите способ подключения: API</p>
				</div>
			</div>
		
			<div class="media">
				<div class="media-left"><span class='tag is-dark'>2</span></div>
				<div class="media-content">
				<div class="has-mb-1">Укажите URL для уведомлений о платежах</div>
					<div class="has-feedback">
					<input type="text" :value="resultUrl" class="input" onfocus="this.focus();this.select()" readonly="on" :disabled="disabled">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
				</div>
			</div>
			
			<div class="media">
				<div class="media-left"><span class='tag is-dark'>3</span></div>
				<div class="media-content">
					<div class="has-mb-1">Введите полученные "shopId" и "секретный ключ"</div>
					<b-field label="shopId:" :message="errors.shop_id" :class="{'has-error': errors.shop_id}">
						<b-input type="text" v-model="values.shop_id" :disabled="disabled"></b-input>
					</b-field>
					<b-field label="Секретный ключ:" :message="errors.password" :class="{'has-error': errors.password}">
						<b-input type="text" v-model="values.password" :disabled="disabled"></b-input>
					</b-field>
				</div>
			</div>	
			
			<vue-settings-payments-provider-methods index="4" :variants="variants" :values="values" :disabled="disabled"/>
		 	
		 	<div class="media">
				<div class="media-left"><span class='tag is-dark'>5</span></div>
				<div class="media-content">
					<div>Онлайн касса</div>
					<b-checkbox v-model="values.onlinekassa" :disabled="disabled">Использовать ЮКассу в качестве онлайн кассы для отправки чеков</b-checkbox>
				</div>
		 	</div>	
		 	
		 	<div class="media">
				<div class="media-left"><span class='tag is-dark'>6</span></div>
				<div class="media-content">
					<div>Двухстадийная оплата</div>
					<b-checkbox v-model="values.withaccept" :disabled="disabled">Подтверждать каждую оплату в личном кабинете</b-checkbox>
				</div>
		 	</div>		 		
		 	
		 	<div class="media">
				<div class="media-left"><span class='tag is-dark'>7</span></div>
				<div class="media-content">
					<div class="has-mb-1">После проведения тестового платежа, сообщите менеджеру ЮКассы об успешном окончании тестирования и включите рабочий режим.</div>
		
					<div class="row">
						<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='mode' value="test" v-model="values.mode" :disabled="disabled"> Тестовый режим</label></div>
						<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='mode' value="work" v-model="values.mode" :disabled="disabled"> Рабочий режим</label></div>
					</div>               
				</div>
		 	</div>		 	
		</div>
		<div v-else>
			<div class="media">
				<div class="media-left"><span class='tag is-dark'>1</span></div>
				<div class="media-content">
					<p><a href="https://yookassa.ru" target="_blank">Зарегистрируйтесь</a> на сайте yookassa.ru<br>
					В настройках выберите HTTP-протокол</p>
				</div>
			</div>
			
			<div class="media">
				<div class="media-left"><span class='tag is-dark'>2</span></div>
				<div class="media-content">
				<div class="has-mb-1">Укажите целевые URL ЮКассе </div>
				<div class="has-mb-2">
					<div class="field">
						<label class="label">checkUrl:</label>
						<input type="text" value="https://taplink.cc/payments/yandexkassa/check.html" class="input" onfocus="this.focus();this.select()" readonly="on" :disabled="disabled">
					</div>
					<div class="field">
						<label class="label">avisoUrl:</label>
						<input type="text" value="https://taplink.cc/payments/yandexkassa/result.html" class="input" onfocus="this.focus();this.select()" readonly="on" :disabled="disabled">
					</div>
				</div>
				</div>
			</div>
			
			<div class="media">
				<div class="media-left"><span class='tag is-dark'>3</span></div>
				<div class="media-content">
					<label>Включите</label>
				"Использовать страницы успеха и ошибки с динамическими адресами"
				</div>
			</div>
			
			<div class="media">
				<div class="media-left"><span class='tag is-dark'>4</span></div>
				<div class="media-content">
				<div class="has-mb-1">Введите полученные shopId, scid витрины и пароль к магазину</div>
				<div class="form-horizontal">
					<b-field label="shopId:" :message="errors.shop_id" :class="{'has-error': errors.shop_id}">
						<b-input type="text" v-model="values.shop_id :disabled="disabled""></b-input>
					</b-field>
					<b-field label="scid:" :message="errors.id" :class="{'has-error': errors.id}">
						<b-input type="text" v-model="values.id" :disabled="disabled"></b-input>
					</b-field>
					<b-field label="shopPassword:" :message="errors.password" :class="{'has-error': errors.password}">
						<b-input type="text" v-model="values.password" :disabled="disabled"></b-input>
					</b-field>
				</div>
				</div>
			</div>
			
			
			<vue-settings-payments-provider-methods index="5" :variants="variants" :values="values" :disabled="disabled"/>
		
		
		 	<div class="media">
				<div class="media-left"><span class='tag is-dark'>6</span></div>
				<div class="media-content">
				<div class="has-mb-1">Совершите тестовый платёж (<a href='https://tech.yandex.ru/money/doc/payment-solution/shop-config/intro-docpage/' target="_blank">Подробнее о тестировании</a>)</div>
				<div class="has-mb-1">Настройте форму на странице. Заполните ее и перейдите к оплате. Выберите способ «Visa». Укажите специальные <a target="_blank" href="https://tech.yandex.ru/money/doc/payment-solution/examples/examples-test-data-docpage/">тестовые данные</a></div>
				
				<blockquote class='has-text-grey-light has-mb-1'>
				Номер карты: 4444 4444 4444 4448<br>
				Действует до: любой год и месяц в будущем<br>
				Код CVV: 000
				</blockquote>
				</div>
		 	</div>
		 	
		 	<div class="media">
				<div class="media-left"><span class='tag is-dark'>7</span></div>
				<div class="media-content">
					<div class="has-mb-1">После проведения тестового платежа, сообщите менеджеру ЮКассы об успешном окончании тестирования и включите рабочий режим.</div>
		
					<div class="row">
						<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='mode' value="test" v-model="values.mode" :disabled="disabled"> Тестовый режим</label></div>
						<div class="col-xs-12 col-sm-6"><label class="radio"><input type='radio' name='mode' value="work" v-model="values.mode" :disabled="disabled"> Рабочий режим</label></div>
					</div>               
				</div>
		 	</div>		 					
		</div>
		 	
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-payments-providers-yandexmoney", {data() {
			return {
				resultUrl: 'https://taplink.cc/payments/yandexmoney/result.html',
				isAutoMode: true
			}
		},
		props: ['values', 'variants', 'payment_provider_id', 'is_new', 'disabled'],
		mixins: [FormModel],
		
		created() {
			this.$io.on('events:payments.yandexmoney:connect.resolve', this.connectResolve);
		},
		
		destroyed() {
			this.$io.off('events:payments.yandexmoney:connect.resolve', this.connectResolve);
		},
		
		computed: {
			text() {
				return this.$format(this.$gettext('Чтобы заказы помечались оплаченными при оплате через Яндекс.Деньги, необходимо <a {1}>подключить HTTP-уведомления для кошелька</a> и указать адрес для HTTP-уведомлений:'), 'href="https://yoomoney.ru/myservices/online.xml" target="_blank"');
			}
		},
		
		methods: {
			connectResolve(values) {
				if (this.$account.profile_id == values.profile_id) {
					_.each(values, (v, k) => { this.values[k] = v; });
					this.$parent.save(false, false);
				}
			},
			
			connect() {
				this.$parent.popupCenter('/payments/yandexmoney/connect.html', 'yandexmoney', 70, .6, 800, 400);
			}
		}, template: `
	<div>
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>1</span></div>
			<div class="media-content">
				<p><a href="https://yoomoney.ru" target="_blank">Зарегистрируйтесь</a> на сайте yoomoney.ru</p>
			</div>
		</div>
			
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<div class="has-mb-1"> {{'Привяжите ваш кошелек'|gettext}}</div>
				
				<label class="checkbox has-mb-2"><input type="checkbox" v-model="isAutoMode" :disabled="disabled"> {{'Автоматическая настройка'|gettext}}</label>
				
				
				<div class="row row-small" v-if="isAutoMode">
					<div class="col-xs-12 col-sm col-sm-shrink">
						<button class="button is-success is-fullwidth" @click="connect" :disabled="disabled"><i class="fas fa-plug has-mr-2"></i> {{'Привязать кошелек'|gettext}}</button>
					</div>
					<div class="col-xs-12 col-sm" :class="{'has-text-warning': !values.receiver}" style="align-self: center">
						<span v-if="values.receiver">{{'Номер кошелька: {1}'|gettext|format(values.receiver)}}</span>
						<span v-else><i class="fa fa-exclamation-triangle has-mr-1"></i>{{'Кошелек не привязан'|gettext}}</span>
					</div>
				</div>
				

				<div v-if="!isAutoMode">
					<b-field label="Введите ваш номер кошелька Яндекс.Деньги:" :message="errors.receiver" :class="{'has-error': errors.receiver}">
						<b-input type="text" v-model="values.receiver"></b-input>
					</b-field>
					
					<div class="has-mb-1" v-html="text"></div>
					<div class="has-feedback has-mb-3">
						<input type="text" :value="resultUrl" class="input" onfocus="this.select()" readonly="on" :disabled="disabled">
						<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
					</div>
					
					<b-field :label="'Введите секрет полученный в настройках HTTP-уведомления'|gettext" :message="errors.secret" :class="{'has-error': errors.secret}">
						<b-input type="text" v-model="values.secret" :disabled="disabled"></b-input>
					</b-field>
				</div>
			</div>
		</div>
			
<!--

		<div class="media">
			<div class="media-left"><span class='tag is-dark'>2</span></div>
			<div class="media-content">
				<b-field label="Введите ваш номер кошелька Яндекс.Деньги:" :message="errors.receiver" :class="{'has-error': errors.receiver}">
					<b-input type="text" v-model="values.receiver"></b-input>
				</b-field>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>3</span></div>
			<div class="media-content">
				<div class="has-mb-1">Чтобы заказы помечались оплаченными при оплате через Яндекс.Деньги, необходимо <a href='https://sp-money.yandex.ru/myservices/online.xml' target="_blank">подключить HTTP-уведомления для кошелька</a> и указать адрес для HTTP-уведомлений:</div>
				<div class="has-feedback">
					<input type="text" :value="resultUrl" class="input" onfocus="this.select()" readonly="on">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="resultUrl" :success-message="'URL скопирован'|gettext"></vue-component-clipboard></a>
				</div>
			</div>
		</div>
		
		<div class="media">
			<div class="media-left"><span class='tag is-dark'>4</span></div>
			<div class="media-content">
				<b-field label="Введите секрет полученный в настройках HTTP-уведомления" :message="errors.secret" :class="{'has-error': errors.secret}">
					<b-input type="text" v-model="values.secret"></b-input>
				</b-field>
			</div>
		</div>	
-->
		<vue-settings-payments-provider-methods index="3" :variants="variants" :values="values" :disabled="disabled"/>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-products", {data() {
			return {
				isFetching: false,
				configured: {checkout:false, products:false, channels:false, payments: false, shipping:false, legal:false, addons:false}
			}
		},

		created() {
			this.$io.on('events:settings.products:refresh', this.refresh);
			this.fetchData(true);
		},
		
		destroyed() {
			this.$io.off('events:settings.products:refresh', this.refresh);
		},

		methods: {
			refresh() {
				this.fetchData(true);
			},
			
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('settings/products/configured').then((data) => {
					this.isFetching = false;
					this.configured = data.response.settings.products.configured;
				});

			},
			
			openForm(name) {
				this.$modal('vue-settings-products-'+name+'-form', null, this);
			}
		}, template: `
	<div class='has-mb-2 has-mt-4'>
		<div class="container">
		<div v-if="!isFetching">
			<div v-if="$account.tariff == 'business'">
<!-- 				<div class="message is-danger  has-mb-3" v-if="!configured.products || !configured.checkout || !configured.shipping || !configured.payments"><div class="message-body">Завершите все настройки до конца</div></div> -->
			</div>
			<div v-else>
				<div class="message is-info"><div class="message-body">Здесь вы можете настроить свой интернет магазин</div></div>
				<div class="message is-danger has-mb-3"><div class="message-body">Доступно на business-тарифе <a href='/tariffs/' class='is-pulled-right'>Подробнее <i class="fa fa-angle-right" style="margin-left: 5px"></i></a></div></div>
			</div>
		</div>
		
		<div class="label-pro-container" :class="{disabled: $account.tariff != 'business'}">
		
		<div class="row">
			<div class="col-xs-12 col-sm-6 col-md-4" style="display: flex">
				<div class="panel panel-default product-settings-item">
					<div class="media-checkitem has-alert" :class="{in: configured.products, 'is-loading': isFetching}"><i class="fa fal fa-cube"></i></div>
					<h4 class="media-heading"> {{'Добавление товаров'|gettext}}</h4>
					<p class="has-mb-2 has-text-grey">{{'Загрузите фото ваших товаров и добавьте описание'|gettext}}</p>
					<router-link :to="{name: 'products'}" class="button is-default is-fullwidth">{{'Добавить товары'|gettext}}</router-link>

					<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
				</div>
			</div>
			
			<div class="col-xs-12 col-sm-6 col-md-4" style="display: flex">
				<div class="panel panel-default product-settings-item">
					<div class="media-checkitem has-alert" :class="{in: configured.checkout, 'is-loading': isFetching}"><i class="fa fal fa-file-alt"></i></div>
					<h4 class="media-heading"></i> {{'Страница оформления заказа'|gettext}}</h4>
					<p class="has-mb-2 has-text-grey">{{'Настройте страницу с контактными данными для отправки заказа'|gettext}}</p>
					<button type="button" @click="openForm('checkout')" class="button is-default is-fullwidth">{{'Настроить страницу'|gettext}}</button>
					<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
				</div>
			</div>
			
			<div class="col-xs-12 col-sm-6 col-md-4" style="display: flex">
				<div class="panel panel-default product-settings-item">
					<div class="media-checkitem has-alert" :class="{in: configured.shipping, 'is-loading': isFetching}"><i class="fa fal fa-truck"></i></div>
					<h4 class="media-heading"> {{'Настройка стоимости доставки'|gettext}}</h4>
					<p class="has-mb-2 has-text-grey">{{'Укажите стоимость и условия доставки'|gettext}}</p>
					<button type="button" @click="openForm('shipping')" class="button is-default is-fullwidth">{{'Настроить параметры доставки'|gettext}}</button>
					<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
				</div>
			</div>

			<div class="col-xs-12 col-sm-6 col-md-4" style="display: flex">
				<div class="panel panel-default product-settings-item">
					<div class="media-checkitem has-alert" :class="{in: configured.legal, 'is-loading': isFetching}"><i class="fa fal fa-file-alt"></i></div>
					<h4 class="media-heading"> {{'Юридическая информация'|gettext}}</h4>
					<p class="has-mb-2 has-text-grey">{{'Добавьте договор-оферту'|gettext}}</p>
					<button type="button" @click="openForm('legal')" class="button is-default is-fullwidth">{{'Настроить юридическую информацию'|gettext}}</button>
					<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
				</div>
			</div>
			
			<div class="col-xs-12 col-sm-6 col-md-4" style="display: flex">
				<div class="panel panel-default product-settings-item">
					<div class="media-checkitem has-alert" :class="{in: configured.payments, 'is-loading': isFetching}"><i class="fa fal fa-credit-card-blank"></i></div>
					<h4 class="media-heading"> {{'Прием оплат'|gettext}}</h4>
					<p class="has-mb-2 has-text-grey">{{'Настройте способы приема платежей'|gettext}}</p>
					<router-link :to="{name: 'settings.payments'}" class="button is-default is-fullwidth">{{'Настроить прием платежей'|gettext}}</router-link>
					<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
				</div>
			</div>
			
			<div class="col-xs-12 col-sm-6 col-md-4" style="display: flex">
				<div class="panel panel-default product-settings-item">
					<div class="media-checkitem has-alert in"><i class="fa fal fa-pencil-ruler"></i></div>
					<h4 class="media-heading"> {{'Оформление каталога'|gettext}}</h4>
					<p class="has-mb-2 has-text-grey">{{'Настройте внешнее оформление вашего магазина'|gettext}}</p>
	<!-- 				<a href='/profile/settings/products/common.html' data-modal='form' data-modal-size='md' class="button is-default is-fullwidth">Настроить модули</a> -->
					<button type="button" @click="openForm('common')" class="button is-default is-fullwidth">{{'Настроить оформление'|gettext}}</button>
					<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
				</div>
			</div>
			
			<div class="col-xs-12 col-sm-6 col-md-4" style="display: flex">
				<div class="panel panel-default product-settings-item">
					<div class="media-checkitem has-alert" :class="{in: configured.addons, 'is-loading': isFetching}"><i class="fa fal fa-cog"></i></div>
					<h4 class="media-heading">{{'Модули'|gettext}}</h4>
					<p class="has-mb-2 has-text-grey">{{'Настройте модули, которые будут работать с интернет магазином'|gettext}}</p>
					<button type="button" @click="openForm('addons')" class="button is-default is-fullwidth">{{'Настроить модули'|gettext}}</button>
					<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
				</div>
			</div>

			<div class="col-xs-12 col-sm-6 col-md-4" style="display: flex">
				<div class="panel panel-default product-settings-item">
					<div class="media-checkitem"><i class="fa fab fa-ig"></i></div>
					<h4 class="media-heading">{{'Интеграция магазина с Instagram'|gettext}}</h4>
					<p class="has-mb-2 has-text-grey">{{'Подключите магазин к вашему instagram аккаунту'|gettext}}</p>
					<button type="button" @click="openForm('facebook')" class="button is-default is-fullwidth">{{'Настроить интеграцию'|gettext}}</button>
					<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
				</div>
			</div>
		</div>
	</div>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-products-addons-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				variants: {},
				addons: {},
				addons_values: {},
				values: {fields: [], fields_extended: [
					{fields: [
						{idx: 'a', title: this.$gettext('Номер заявки'), value_type: 'number'},
						{idx: 'b', title: this.$gettext('Контактные данные'), value_type: 'text'},
						{idx: 'c', title: this.$gettext('Состав корзины'), value_type: 'text'},
						{idx: 'd', title: this.$gettext('Бюджет'), value_type: 'number'},
						{idx: 'e', title: this.$gettext('Данные доставки'), value_type: 'text'},
						{idx: 'f', title: this.$gettext('Стоимость доставки'), value_type: 'number'},
						{idx: 'g', title: this.$gettext('Ссылка на оплату'), value_type: 'string'},
						{idx: 'h', title: this.$gettext('Общий вес'), value_type: 'number'},
						{idx: 'i', title: this.$gettext('Номер счёта'), value_type: 'number'},
						{idx: 'j', title: this.$gettext('Ссылка на страницу'), value_type: 'string'},
						{idx: 'k', title: this.$gettext('Промокоды или акции'), value_type: 'string'}
					], title: 'Заказ'}
				]},
				errors: {}
			}
		},

		created() {
			this.fetchData(true);
		},

		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('settings/products/addons/get').then((data) => {
					this.isFetching = false;
					let b = data.response.settings.products.addons;
					this.variants = b.variants;
					this.addons = b.addons;
					this.addons_values = b.values.addons;
// 					this.values.fields = b.fields;
					
					this.values.fields_extended.push({title: 'Поля формы оформления заказа', fields: b.fields});
					
					_.each(b.addons_fields, (b, k) => {
						this.values.fields_extended.push({title: k, fields: b});
					});
				});
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('settings/products/addons/set', {addons: this.addons_values}, this).then((data) => {
					if (data.result == 'success') {
						this.$parent.close()
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Модули'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
			<vue-pages-blocks-form-addons :values="values" :addons="addons" :addons_values="addons_values" :variants_addons="variants.addons" :loading="isFetching" :parent="$parent">
				<template slot="message">{{'Вы можете выбрать модули которые будут срабатывать для магазина'|gettext}}</template>
				<template slot="empty">{{'В настоящий момент ни одного модуля не подключено'|gettext}}</template>
			</vue-pages-blocks-form-addons>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
		</footer>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-products-checkout-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				activeTab: 'contacts',
				values: {fields: [], link_page_id: null, buttons: {pay: {type: null}}},
				action: null,
				variants: {fields_types: [], buttons: {pay: []}},
			}
		},

		created() {
			this.fetchData(true);
		},

		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get(['settings/products/checkout/get', 'settings/products/checkout/info']).then((data) => {
					this.isFetching = false;
					this.values = data.response.settings.products.checkout.values;
					this.variants = data.response.settings.products.checkout.variants;
				});
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('settings/products/checkout/set', this.values, this).then((data) => {
					if (data.result == 'success') {
						this.$parent.close()
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			},
			
			onAction(v) {
				if (!v) return;
				
				this.values.fields_idx.toString(16);
				this.values.fields.push({title: this.variants.fields_types[v], text: '', type_id: v, required: false, default: 0, variants: '', opened: true, idx: this.values.fields_idx.toString(16)});
				this.values.fields_idx++;
				
				Vue.nextTick(() => {
		            this.action = null;
	            });
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Страница оформления заказа'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>

		<ul class="nav nav-tabs has-text-left">
			<li :class="{active: activeTab == 'contacts'}"><a href="#" @click="activeTab = 'contacts'">{{'Контакты'|gettext}}</a></li>
			<li :class="{active: activeTab == 'confirm'}"><a href="#" @click="activeTab = 'confirm'">{{'Подтверждение'|gettext}}</a></li>
		</ul>
		
		<section class="modal-card-body modal-card-body-blocks" v-if="activeTab == 'contacts'">
			<section>
				<b-select :placeholder="'-- Добавить поле --'|gettext" v-model="action" @input="onAction" expanded>
					<option v-for="(f, i) in variants.fields_types" :value="i">{{ f }}</option>
				</b-select>
			</section>
			<section>
				<label class="label">{{'Укажите необходимые поля при оформлении заказа'|gettext}}</label>
				
				<vue-component-form-blocks v-model="values.fields" :variants="variants"></vue-component-form-blocks>
			</section>
<!--
			<section>
				<div class="has-mb-2">
					<label class="label">{{'Доставка'|gettext}}</label>
					<div class="has-text-grey-light">{{'Если товар требует доставки, все адресные поля добавятся автоматически'|gettext}}</div>
				</div>
				
				<div>
					<div class="form-fields-item">
						<div class="form-fields-item-title" style="cursor:default"><span><label class="checkbox" style="left:-31px;line-height: inherit;font-weight:bold;cursor: default"><input type="checkbox" checked="on" disabled="on">{{'Страна'|gettext}}</label></span></div>
					</div>
					<div class="form-fields-item">
						<div class="form-fields-item-title" style="cursor:default"><span><label class="checkbox" style="left:-31px;line-height: inherit;font-weight:bold;cursor: default"><input type="checkbox" checked="on" disabled="on">{{'Область или край'|gettext}}</label></span></div>
					</div>
					<div class="form-fields-item">
						<div class="form-fields-item-title" style="cursor:default"><span><label class="checkbox" style="left:-31px;line-height: inherit;font-weight:bold;cursor: default"><input type="checkbox" checked="on" disabled="on">{{'Город'|gettext}}</label></span></div>
					</div>
					<div class="form-fields-item">
						<div class="form-fields-item-title" style="cursor:default"><span><label class="checkbox" style="left:-31px;line-height: inherit;font-weight:bold"><input type="checkbox" name='shipping[]' value='addr1' v-model="values.shipping">{{'Адрес'|gettext}}</label></span></div>
					</div>
					<div class="form-fields-item">
						<div class="form-fields-item-title" style="cursor:default"><span><label class="checkbox" style="left:-31px;line-height: inherit;font-weight:bold"><input type="checkbox" name='shipping[]' value='zip' v-model="values.shipping">{{'Индекс'|gettext}}</label></span></div>
					</div>
				</div>
			</section>
-->

		</section>
		
		<section class="modal-card-body modal-card-body-blocks" v-if="activeTab == 'confirm'">
			<section>
				<b-field :label="'Кнопка завершения'|gettext">
					<div class="row">
						<div class="col-xs-12 col-sm">
							<b-select v-model="values.buttons.pay.type" class="has-xs-mb-2" expanded>
								<option value="custom">-- {{'Свой текст'|gettext}} --</option>
								<option v-for="(v, i) in variants.buttons.pay" :value="i">{{ v }}</option>
							</b-select>
						</div>
						<div class="col-xs-12 col-sm-6" v-if="values.buttons.pay.type == 'custom'">
							<b-input v-model="values.buttons.pay.title" :placeholder="'Укажите заголовок кнопки'|gettext">
						</div>
					</div>
				</b-field>
			</section>			
			<section>
				<b-field :label="'Какую страницу открыть после заказа'|gettext">
					<b-select v-model="values.link_page_id" expanded>
						<option :value="null">-- {{'Главная'|gettext}} --</option>
						<option v-for="(v, i) in variants.page_id" :value="i">{{ v }}</option>
					</b-select>
				</b-field>
				
				<b-field :label="'После успешной оплаты менять статус'|gettext">
					<b-select v-model="values.paid_status_id" expanded>
						<option value="2">{{'В работе'|gettext}}</option>
						<option value="3">{{'Выполнена'|gettext}}</option>
					</b-select>
				</b-field>
				
				<div class="field">
					<label class="label">{{'Назначение платежа'|gettext}}</label>
					<input type='text' v-model='values.purpose' class='input' maxlength="128">
				</div>
			</section>
		</section>
		
				
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("settings", "vue-settings-products-common-form", {data() {
			return {
				activeTab: 'common',
				isUpdating: false,
				isFetching: false,
				values: {products_avatar: 0},
				variants: []
			}
		},

		created() {
			this.fetchData(true);
		},

		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get(['settings/products/common/get', 'settings/products/common/info']).then((data) => {
					this.isFetching = false;
					this.values = data.response.settings.products.common.values;
					this.variants = data.response.settings.products.common.variants;
				});

			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('settings/products/common/set', this.values, this).then((data) => {
					if (data.result == 'success') {
						this.$parent.close()
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Оформление каталога'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
	
		<ul class="nav nav-tabs has-text-left">
			<li :class="{active: activeTab == 'common'}"><a href="#" @click="activeTab = 'common'">{{'Лента'|gettext}}</a></li>
			<li :class="{active: activeTab == 'product'}"><a href="#" @click="activeTab = 'product'">{{'Товар'|gettext}}</a></li>
		</ul>

		<section class="modal-card-body modal-card-body-blocks" v-if="activeTab == 'common'">
			<section>
				
				<b-field :label="'Аватар'|gettext">
					<b-select v-model="values.products_avatar" class="has-xs-mb-2" expanded>
						<option v-for="(v, i) in variants.products_avatar" :value="i">{{v|gettext}}</option>
					</b-select>
				</b-field>
	
				<b-field :label="'Картинки'|gettext">
					<b-select v-model="values.products_pictures_placement" class="has-xs-mb-2" expanded>
						<option v-for="(v, i) in variants.products_pictures_placement" :value="i">{{v|gettext}}</option>
					</b-select>
				</b-field>
				
				<div class="row has-mb-2">
					<div class="col-xs-12 col-sm-6">
						<b-field :label="'Коллекции'|gettext">
							<b-select v-model="values.products_collections_view" class="has-xs-mb-2" expanded>
								<option v-for="(v, i) in variants.products_collections_view" :value="i">{{v|gettext}}</option>
							</b-select>
						</b-field>
					</div>
					
					<div class="col-xs-12 col-sm-6">
						<b-field :label="'Варианты'|gettext">
							<b-select v-model="values.products_variants_view" class="has-xs-mb-2" expanded>
								<option v-for="(v, i) in variants.products_variants_view" :value="i">{{v|gettext}}</option>
							</b-select>
						</b-field>
					</div>
				</div>
				
				<div class="field">
					<label class="label">{{'Цвет фона'|gettext}}</label>
					<vue-component-colorpicker v-model="values.products_pictures_background"></vue-component-colorpicker>
				</div>
												
			</section>
			<section>
				<mx-toggle v-model="values.products_show_filter" :title="'Показывать фильтр по коллекциям'|gettext" class="has-mb-2"></mx-toggle>
				<mx-toggle v-model="values.products_show_search" :title="'Показывать поиск по каталогу'|gettext" class="has-mb-2"></mx-toggle>
				<mx-toggle v-model="values.products_show_snippet_overlay" :title="'Название и цена товара отображается поверх изображения'|gettext" class="has-mb-2"></mx-toggle>
				<mx-toggle v-model="values.products_show_snippet_title" :title="'Показывать название товара в каталоге'|gettext" class="has-mb-2"></mx-toggle>
				<mx-toggle v-model="values.products_show_snippet_price" :title="'Показывать цену товара в каталоге'|gettext" class="has-mb-2"></mx-toggle>
				<mx-toggle v-model="values.products_show_snippet_compare_price" :title="'Показывать старую цену товара в каталоге'|gettext" class="has-mb-2"></mx-toggle>
				<mx-toggle v-model="values.products_hide_checkout" :title="'Скрыть кнопку Добавить в корзину'|gettext"></mx-toggle>
			</section>
		</section>
		
		<section class="modal-card-body modal-card-body-blocks" v-if="activeTab == 'product'">
			<section>
			<b-field :label="'Добавочный текст в описании товара'|gettext">
            	<div class="control">
	            	<b-input type="textarea" v-model="values.products_description_footer" class="has-mb-1" style="min-height: 100px"></b-input>
					<p class="has-text-grey">{{'Этот текст будет добавлен к описанию каждого товара'|gettext}}</p>
				</div>
			</b-field>

			<b-field :label="'Добавочный текст в перед опциями товара'|gettext">
            	<div class="control">
	            	<b-input type="textarea" v-model="values.products_description_before_options" class="has-mb-1" style="min-height: 100px"></b-input>
					<p class="has-text-grey">{{'Этот текст будет вставлен перед опциями в каждом товаре'|gettext}}</p>
				</div>
			</b-field>
				
			</section>
		</section>
		
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("settings", "vue-settings-products-facebook-form", {data() {
			return {
				
			}
		},
		
		computed: {
			text1() {
				return this.$format(this.$gettext('<a {1}>Создать каталог</a> в Facebook'), 'href="https://www.facebook.com/products/" target="_blank"');
			},
			
			text2() {
				return this.$format(this.$gettext('Для загрузки товаров используйте <a {1}>специальную ссылку</a>'), 'href="'+this.$account.link+'/m/catalog.csv" target="_blank"');
			}
		},

		created() {
			this.fetchData();
		},

		methods: {
			fetchData() {
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Интеграция магазина с Instagram'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
<!-- 		<section class="message is-warning"><div class="message-body">России в списке доступных стран нет. Но выборочно Facebook открывает аккаунтам Shoppable Tag.</div></section> -->
		<section class="modal-card-body">

			<div v-if="i18n.locale == 'ru'">
			<h4 class="has-mb-1">Условия подключения Shoppable Tags:</h4>
			<ul class="has-mb-2">
				<li>— Вы ведете бизнес в одной из <a href="https://help.instagram.com/321000045119159" target="_blank">доступных стран</a></li>
				<li>— Продаете физические товары</li>
				<li>— Не продаете <a href="https://www.facebook.com/policies/commerce" target="_blank">запрещенные товары</a></li>
				<li>— У вас бизнес аккаунт Instagram</li>
			</ul>
			</div>
			
			<h4 class="has-mb-1">{{'Процесс подключения Shoppable Tags'|gettext}}:</h4>
			<ul>
				<li>— <span v-html="text1"></span></li>
				<li>— <span v-html="text2"></span></li>
				<li>— {{'Как только Facebook одобрит магазин товары из Taplink появятся в Instagram'|gettext}}</li>
			</ul>
			
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
<!-- 			<button class="button is-primary" @click="updateData">{{'Сохранить'|gettext}}</button> -->
		</footer>
	</div>
`});

window.$app.defineComponent("settings", "vue-settings-products-legal-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				values: {body: '', text: ''},
				errors: {text: ''},
				options: {
					theme: 'snow',
					modules: {
						toolbar: [
							[{ 'header': [1, 2, 3, 4, 5, false] }],
							['bold', 'italic', 'underline', 'strike'],
							
							[{ 'list': 'ordered'}, { 'list': 'bullet' }],
							[{ 'indent': '-1'}, { 'indent': '+1' }],
							[{ 'align': [] }],
							['link'],
							['clean']  						
						]
					}
				}
			}
		},

		created() {
			this.fetchData(true);
		},

		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('settings/products/legal/get').then((data) => {
					this.isFetching = false;
					this.values = data.response.settings.products.legal.values;
				});

			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('settings/products/legal/set', this.values, this).then((data) => {
					if (data.result == 'success') {
						this.$parent.close()
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			}
		}, template: `
	<div class="modal-card modal-card-large">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Юридическая информация'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
			<section>
				<b-field :label="'Надпись'|gettext" :message="errors.text" :class="{'has-error': errors.text}">
	            	<b-input v-model="values.text"></b-input>
				</b-field>
			</section>
			<section>
				<label class="label">{{'Текст'|gettext}}</label>
				<vue-component-editor v-model="values.body" :options="options"></vue-component-editor>
			</section>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("settings", "vue-settings-products-shipping-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				activeTab: 'address',
				values: {use_selfservice: true, use_zones: true, custom: [], fields_zones: []},
				variants: [],
				precisions: {budget: this.$account.currency.precision, weight: this.$account.weight.precision},
				types: {budget: this.$gettext('По цене'), weight: this.$gettext('По весу')},
				fields: {country: this.$gettext('Страна'), state: this.$gettext('Область или край'), city: this.$gettext('Город'), addr1: this.$gettext('Адрес'), zip: this.$gettext('Индекс')},
				countries: [],
			}
		},

		created() {
			this.fetchData(true);
		},

		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get(['settings/products/shipping/get', 'settings/products/shipping/info']).then((data) => {
					this.isFetching = false;
					let values = data.response.settings.products.shipping.values;
					this.variants = data.response.settings.products.shipping.variants;
					this.variants.units = {budget: this.$account.currency.title, weight: this.$account.weight.unit_title};

					_.each(values.types, (t) => {
						t.zones = _.map(t.zones, (z) => {
							z.countries = _.filter(this.variants.countries, (v) => {
								return z.countries.indexOf(v.country_id) != -1;
							});
							
							return z;
						});
					});
					
					this.values = values;
				});
			},
			
			updateData() {
				this.isUpdating = true;
				
				let values = this.$clone(this.values);
				
				_.each(values.types, (t) => {
					t.zones = _.map(t.zones, (z) => {
						z.countries = _.map(z.countries, (v) => {
							return v.country_id;
						})
						
						return z;
					});
				});
				
				this.$api.post('settings/products/shipping/set', values, this).then((data) => {
					if (data.result == 'success') {
						this.$parent.close()
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			},
			
			onRemoveAdress(index) {
				this.$confirm(this.$gettext('Вы уверены что хотите удалить эту опцию?'), 'is-danger').then(() => {
					this.values.custom.splice(index, 1);
				});
			},
			
			onAction(v) {
				if (!v) return;
				
				this.values.fields.push({title: this.variants.fields_types[v], text: '', type_id: v, required: false, default: 0, variants: '', opened: true});
				
				Vue.nextTick(() => {
		            this.action = null;
	            });
			},
			
			onAddAddress() {
				this.values.custom.push({on: true, title: '', price: 0, fields: ['addr1']});
			},
			
			onRemoveShipping(index) {
				this.$confirm(this.$gettext('Вы уверены что хотите удалить этот склад?'), 'is-danger').then(() => {
					this.values.shipping.splice(index, 1);
				});
			},
			
			onAddShipping() {
				this.values.shipping.push({country: null, state: '', city: '', addr1: '', zip: ''});
			},
			
			onAddZone(k) {
				this.values.types[k].zones.push({countries: [], rules: [{price: 0}]});
			},
			
			onRemoveZone(k, zi) {
				if (!zi) return;
				this.$confirm(this.$gettext('Вы уверены что хотите удалить эту зону?'), 'is-danger').then(() => {
					this.values.types[k].zones.splice(zi, 1);
				});
			},
			
			onDeleteRule(k, zi, i) {
				this.$confirm(this.$gettext('Вы уверены что хотите удалить это условие?'), 'is-danger').then(() => {
					this.values.types[k].zones[zi].rules.splice(i, 1);
				});
			},
			
			onAddRule(k, zi) {
				let rules = this.values.types[k].zones[zi].rules;
				let tmp = rules.pop();
				rules.push({max: 0, price: 0});
				rules.push(tmp);
			},
			
			getFilteredCountries(text) {
				this.countries = _.filter(this.variants.countries, (v) => {
					return v.country.toLowerCase().indexOf(text.toLowerCase()) != -1;
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Настройка стоимости доставки'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>

		<ul class="nav nav-tabs has-text-left">
			<li :class="{active: activeTab == 'address'}"><a href="#" @click="activeTab = 'address'">{{'Адрес'|gettext}}</a></li>
			<li :class="{active: activeTab == 'warehouses'}"><a href="#" @click="activeTab = 'warehouses'">{{'Склады'|gettext}}</a></li>
			<li :class="{active: activeTab == k}" v-for="(t, k) in values.types" v-if="values.use_zones"><a href="#" @click="activeTab = k">{{types[k]|gettext}}</a></li>
		</ul>
		
		<section class="modal-card-body modal-card-body-blocks" v-if="activeTab == 'address'">
			<section>

			<div class="has-mb-2">
				<div class="has-text-grey-light">{{'Укажите опции доставки'|gettext}}</div>
			</div>
	
			<div class="has-mb-2">
				<mx-item class="mx-item-header is-hidden-mobile">
				<div class="item-row row">
					<div class="col-sm col-shrink block-xs first-xs" style="line-height: 0"><div style="visibility: hidden;height: 5px"><mx-toggle v-model="values.use_selfservice"></div></div>
					<div class="col-sm">{{'Название'|gettext}}</div>
					<div class="col-sm-3">{{'Стоимость'|gettext}}</div>
					<div class="col-xs col-shrink">
						<div style="visibility: hidden;height: 5px"><button type="button" class="button is-danger"><i class="fa fa-trash-alt"></i></button></div>
					</div>				
				</div>
				</mx-item>
				
				<mx-item>
				<div class="item-row row">
					<div class="col-sm col-shrink block-xs first-xs" style="line-height: 0"><mx-toggle v-model="values.use_selfservice"></mx-toggle></div>
					<div class="col-sm block-xs"><input type="text" :value="'Самовывоз'|gettext" class="input" disabled="on"></div>
					<div class="col-sm-3 block-xs"><input type="text" class="input" :value="'Бесплатно'|gettext" disabled="on"></div>
					<div class="col-xs col-sm-shrink first-xs last-sm text-xs-right">
						<button type="button" class="button is-danger disabled" disabled="on"><i class="fa fa-trash-alt"></i></button>
					</div>				
				</div>
				</mx-item>
				
				<mx-item v-for="(v, i) in values.custom">
				<div class="item-row row">
					<div class="col-sm col-shrink block-xs first-xs" style="line-height: 0"><mx-toggle v-model="v.on"></mx-toggle></div>
					<div class="col-sm block-xs" style="overflow: visible">
						<div class="has-feedback">
							<b-input type="text" v-model="v.title" :placeholder="'Например: Центр Москвы'|gettext" :disabled="!v.on"></b-input>
							<a class="form-control-feedback has-text-grey-light has-mr-2" :class="{disabled: !v.on}"><vue-component-dropdown-list v-model="v.fields" :list="fields" :title="'Поля'|gettext" :exclude="['country']"></vue-component-dropdown-list></a>
						</div>
					</div>
					<div class="col-sm-3 block-xs"><div class="has-feedback"><number type="text" v-model="v.price" :precision="$account.currency.precision" class="input" :disabled="!v.on"></number><span class="form-control-feedback has-text-grey-light">{{ $account.currency.title }}</span></div></div>
					<div class="col-xs col-sm-shrink first-xs last-sm text-xs-right">
						<button type="button" class="button is-danger" @click="onRemoveAdress(i)"><i class="fa fa-trash-alt"></i></button>
					</div>				
				</div>
				</mx-item>
				
				<mx-item>
				<div class="item-row row">
					<div class="col-sm col-shrink block-xs first-xs" style="line-height: 0"><mx-toggle v-model="values.use_zones"></mx-toggle></div>
					<div class="col-sm block-xs" style="overflow: visible">
						<div class="has-feedback"><input type="text" placeholder="Другие страны" class="input" v-model="values.title_zones" :disabled="!values.use_zones"><a class="form-control-feedback has-text-grey-light has-mr-2" :class="{disabled: !values.use_zones}"><vue-component-dropdown-list v-model="values.fields_zones" :list="fields" :title="'Поля'|gettext" :frozen="['country']"></vue-component-dropdown-list></a></div>
					</div>
					<div class="col-xs col-sm-shrink first-xs last-sm text-xs-right">
						<button type="button" class="button is-danger disabled" disabled="on"><i class="fa fa-trash-alt"></i></button>
					</div>				
				</div>
				</mx-item>
			</div>

			<a href="#" @click="onAddAddress" style="text-decoration: underline">{{'Добавить опцию'|gettext}}</a>
			</section>
		</section>
		
		<section class="modal-card-body modal-card-body-blocks" v-if="activeTab == 'warehouses'">
			<section v-for="(f, i) in values.shipping">
			<div class="has-mb-2" v-if="i == 0">
				<div class="has-text-grey-light">{{'Укажите адрес, с которого клиент может забрать свой заказ'|gettext}}</div>
			</div>
			
			<div class="row row-small">
				<div class="col-xs-12 col-sm-6">
					<div class="field has-mb-2">
						<b-select :placeholder="'-- Выберите страну --'|gettext" v-model='f.country' expanded>
							<optgroup :label="'-- Выберите страну --'|gettext">
								<option v-for="(c, k) in variants.countries" :value="c.country_id">{{c.country}}</option>
							</optgroup>
						</b-select>
					</div>
				</div>
			</div>
			<div class="has-mb-2">
			<div class="row row-small">
				<div class="col-xs-12 col-sm-6">
					<div class="field has-mb-2">
					<b-input v-model='f.state' :placeholder="'Область или край'|gettext"></b-input>
					</div>
				</div>
				<div class="col-xs-12 col-sm-6">
					<div class="field has-mb-2">
					<b-input v-model='f.city' :placeholder="'Город'|gettext"></b-input>
					</div>
				</div>
				
				<div class="col-xs-12 col-sm-6">
					<div class="block-xs">
					<b-input v-model='f.addr1' :placeholder="'Адрес'|gettext"></b-input>
					</div>
				</div>
				<div class="col-xs-12 col-sm-6">
					<div class="block-xs">
					<b-input v-model="f.zip" :placeholder="'Индекс'|gettext">
					</div>
				</div>
			</div>
			</div>
	
			<a href='#' @click="onRemoveShipping(i)" class='has-text-danger' style="text-decoration: underline" v-if="i"> {{'Удалить склад'|gettext}}</a>
			<a href='#' @click="onAddShipping" style="text-decoration: underline" v-else>{{'Добавить дополнительный склад'|gettext}}</a>
			
			</section>
		</section>
		
		<section v-for="(t, k) in values.types" class="modal-card-body modal-card-body-blocks" v-if="activeTab == k">
			<section v-for="(zone, zi) in t.zones">
			<div class="has-mb-2">
				<div class="has-text-grey-light">{{'Укажите условия формирования цены для других стран'|gettext}}</div>
			</div>
			
			<div class="row row-small has-mb-2">
				<div class="col-xs">
					<b-taginput v-model="zone.countries" :data="countries" @typing="getFilteredCountries" field="country" allow-new="false" confirm-key-codes='[13]' autocomplete :placeholder="'Весь мир'|gettext" attached>
		                <template slot-scope="props">
		                    <strong>{{props.option.country}}</strong>
		                </template>
		                <template slot="empty">
		                	<div>{{'Ничего не найдено'|gettext}}</div>
		                </template>
		            </b-taginput>
				</div>
				<div class="col-xs col-shrink">
					<button type="button" class="button is-danger" :class="{disabled: !zi}" @click="onRemoveZone(k, zi)" :disabled="!zi"><i class="fa fa-trash-alt"></i></button>
				</div>
			</div>	
			
			<div class="has-mb-2">
				<mx-item class='mx-item-header is-hidden-mobile'>
				<div class="item-row row">
					<div class="col-sm-4">{{'От'|gettext}}</div>
					<div class="col-sm-4">{{'До'|gettext}}</div>
					<div class="col-sm-4">{{'Цена доставки'|gettext}}</div>
				</div>
				</mx-item>
				
				<mx-item v-for="(f, i) in zone.rules">
				<div class="item-row row">
					<div class="col-sm-4 block-xs"><label class="label is-visible-mobile">{{'От'|gettext}}</label>
						<div class="has-feedback">
							<number type='text' class="input" v-model="zone.rules[i-1].max"  disabled="on" v-if="i" :precision="precisions[k]"></number>
							<number type='text' class="input" value="0" disabled="on" :precision="precisions[k]" v-else></number>
							<span class="form-control-feedback has-text-grey-light">{{  variants.units[k] }}</span></div>
						</div>
					<div class="col-sm-4 block-xs"><label class="label is-visible-mobile">{{'До'|gettext}}</label>
						<div class="has-feedback">
							<number v-model="f.max" :class="{'is-danger': f.max < 0 || (i && f.max < zone.rules[i-1].max)}" type='text' class="input" v-if="i < zone.rules.length-1" :precision="precisions[k]"></number>
							<input type='text' class="input" value="∞" disabled="on" v-else>
							<span class="form-control-feedback has-text-grey-light">{{  variants.units[k] }}</span>
						</div>
					</div>
					<div class="col-sm-4 block-xs">
						<label class="label is-visible-mobile">Цена доставки</label>
						<div class="media">
							<div class="media-content">
							<div class="has-feedback"><number type='text' class="input" :class="{'is-danger': f.price < 0}" v-model="f.price" :precision="$account.currency.precision"></number><span class="form-control-feedback has-text-grey-light">{{  $account.currency.title }}</span></div>
							</div>
							<div class="media-right"><a class="button has-text-danger" :class="{disabled: zone.rules.length-1 == i}" :disabled="zone.rules.length-1 == i" @click='onDeleteRule(k, zi, i)'><i class="fa fa-trash-alt"></i></a></div>
						</div>
					</div>
				</div>
				</mx-item>
			</div>
			
			<a href='#' @click='onAddRule(k, zi)' style="text-decoration: underline">{{'Добавить условие'|gettext}}</a>
							
			</section>
			<section>
				<button type="button" class="button is-success" @click='onAddZone(k)'><i class="fa fa-plus-circle has-mr-1"></i>{{'Добавить новую зону'|gettext}}</button>
			</section>
		</section>
				
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});
window.$app.defineModule("settings", [{ path: '/:page_id/settings/common/', component: 'vue-settings-common', meta: {title: 'Общие'}, props: true, name: 'settings.common'},
{ path: '/:page_id/settings/payments/', redirect: '/:page_id/settings/payments/index/', meta: {title: 'Платежи', feature: 'payments'}, props: true, name: 'settings.payments', children: [
	{ path: '/:page_id/settings/payments/index/', component: 'vue-settings-payments-index', props: true, alias: '/:page_id/settings/payments/', name: 'settings.payments.index'},
	{ path: '/:page_id/settings/payments/errors/', component: 'vue-settings-payments-onlinekassa-errors', props: true, name: 'settings.payments.onlinekassa.errors'}
]},
{ path: '/:page_id/settings/products/', component: 'vue-settings-products', meta: {title: 'Товары', feature: 'products'}, props: true, name: 'settings.products' }]);