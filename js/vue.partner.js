
window.$app.defineComponent("partner", "vue-partner-details-form", {data() {
			return {
				legalTypes: {entrepreneur: 'ИП', company: 'ООО'},
				headPositions: {entrepreneur: {entrepreneur: 'ИП'}, company: {general_director: 'Генеральный директор', director: 'Директор'}},
				authorities: {entrepreneur: {certificate: 'Свидетельство'}, company: {regulation: 'Устав', procurator: 'Доверенность'}},
				isFetching: false,
				isUpdating: false
			}
		},
		
		mixins: [FormModel],
		props: ['agreement_status', 'hideMessage'],
		
		created() {
			this.fetchData();
		},
		
		computed: {
			disabled() {
				return this.agreement_status != 'unsigned' || this.isUpdating;
			}
		},
		
		methods: {
			legalTypeChanged() {
				this.values.head_position = null;
				this.values.authority = null;
			},

			fetchData() {
				this.isFetching = true;
				this.$api.get('partner/details/get').then(d => {
					this.isFetching = false;
					this.values = d.response.values;
				});
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('partner/details/set', this.values, this).then(d => {
					if (d.result == 'success') {
						this.$parent.close();
						this.$alert('В течении 3-х дней вы вышлем на вашу электронную почту агентский договор, после его подписания вы сможете заказать вывод средств на расчетный счет');
					}

					this.isUpdating = false;
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">Реквизиты организации</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
			<section class="message is-warning" v-if="!disabled && !hideMessage">
				<div class="message-body has-p-2">Лимит вывода средств на счет физического лица равен 30 000 рублей в месяц. Для юридических лиц лимит максимальной суммы вывода отсутствует. Для вывода средств на счет юридического лица требуется заполнить реквизиты ниже и подписать договор.</div>
			</section>
			<section>
				<b-field label="Тип юридического лица">
					<b-select v-model="values.legaltype" @change="legalTypeChanged" :disabled="disabled">
						<option v-for="(v, i) in legalTypes" :value="i">{{v}}</option>
					</b-select>
				</b-field>
				
				<b-field label="Наименование" :message="errors.name" :class="{'has-error': errors.name}" v-if="values.legaltype == 'company'">
					<input type="text" v-model="values.name" class="input" :disabled="disabled">
				</b-field>
			</section>
			<section>
				<h3 class="has-mb-3 has-text-grey">Реквизиты организации</h3>
				<b-field label="ИНН" :message="errors.inn" :class="{'has-error': errors.inn}">
					<input type="text" v-model="values.inn" class="input" :disabled="disabled">
				</b-field>
	
				<b-field label="КПП" v-if="values.legaltype == 'company'" :message="errors.kpp" :class="{'has-error': errors.kpp}">
					<input type="text" v-model="values.kpp" class="input" :disabled="disabled">
				</b-field>
				
				<b-field label="ОГРН" v-if="values.legaltype == 'company'" :message="errors.ogrn" :class="{'has-error': errors.ogrn}">
					<input type="text" v-model="values.ogrn" class="input" :disabled="disabled">
				</b-field>
				
				<b-field label="ОГРНИП" v-if="values.legaltype == 'entrepreneur'" :message="errors.ogrnip" :class="{'has-error': errors.ogrnip}">
					<input type="text" v-model="values.ogrnip" class="input" :disabled="disabled">
				</b-field>
	
				<b-field label="БИК" :message="errors.bik" :class="{'has-error': errors.bik}">
					<input type="text" v-model="values.bik" class="input" :disabled="disabled">
				</b-field>
	
				<b-field label="Расчетный счет (р/с)" :message="errors.rs" :class="{'has-error': errors.rs}">
					<input type="text" v-model="values.rs" class="input" :disabled="disabled">
				</b-field>
	
				<b-field label="Корреспондентский счет (к/с)" :message="errors.ks" :class="{'has-error': errors.ks}">
					<input type="text" v-model="values.ks" class="input" :disabled="disabled">
				</b-field>
				
				<b-field label="Юридический адрес" :message="errors.address" :class="{'has-error': errors.address}">
					<input type="text" v-model="values.address" class="input" :disabled="disabled">
				</b-field>
			</section>
			
			<section>
				<h3 class="has-mb-3 has-text-grey">Информация о руководителе</h3>
				<b-field label="Должность руководителя" :message="errors.head_position" :class="{'has-error': errors.head_position}">
					<b-select v-model="values.head_position" :disabled="disabled">
						<option v-for="(v, i) in headPositions[values.legaltype]" :value="i">{{v}}</option>
					</b-select>
				</b-field>
				
				<b-field label="Основание полномочий" :message="errors.authority" :class="{'has-error': errors.authority}">
					<b-select v-model="values.authority" :disabled="disabled">
						<option v-for="(v, i) in authorities[values.legaltype]" :value="i">{{v}}</option>
					</b-select>
				</b-field>
				
				<b-field label="Фамилия" :message="errors.f" :class="{'has-error': errors.f}">
					<input type="text" v-model="values.f" class="input" :disabled="disabled">
				</b-field>
	
				<b-field label="Имя" :message="errors.i" :class="{'has-error': errors.i}">
					<input type="text" v-model="values.i" class="input" :disabled="disabled">
				</b-field>
	
				<b-field label="Отчество" :message="errors.o" :class="{'has-error': errors.o}">
					<input type="text" v-model="values.o" class="input" :disabled="disabled">
				</b-field>
			</section>
			
			<section>
				<h3 class="has-mb-3 has-text-grey">Контактные данные</h3>
			
				<b-field label="Электронная почта, на этот адрес мы вышлем агентский договор. Пожалуйста, укажите правильный адрес" :message="errors.email" :class="{'has-error': errors.email}">
					<input type="email" v-model="values.email" class="input" :disabled="disabled">
				</b-field>
				
			</section>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">Закрыть</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData" :disabled="agreement_status != 'unsigned'">Отправить</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>	
	</div>
`});

window.$app.defineComponent("partner", "vue-partner-index", {data() {
			return {
				isFetching: false,
				info: {link: '', is_suspended: false}
			}
		},
		
		props: ['page_id'],
		
		created() {
			this.isFetching = true;
			this.$api.get('partner/statistics/info').then((data) => {
				this.info = data.response.info;
				this.isFetching = false;
			});
		}, template: `
	<div>
		<div class="top-panel">
			<div class="container">
				<h2 class="is-hidden-mobile">{{'Партнерская программа'|gettext}}</h2>
				
				<div class="has-text-centered is-visible-mobile has-mb-2 has-xs-pt-3">{{'Ваша реферальная ссылка'|gettext}}:</div>				
				<div class="has-mb-6"> 
					<div class="row"> 
						<div class="col-xs-12"> 
							<div class="form-control-link is-size-5"> 
								<div class="form-control-link-text"><span class="is-hidden-mobile has-text-grey"><span class="has-pr-1 is-40" :class="{skeleton: isFetching}">{{'Ваша реферальная ссылка'|gettext}}:</span></span><span class="has-text-info" v-if="!isFetching">{{ info.link }}</span></div> 
								<vue-component-clipboard :text="info.link" class="button is-primary" :show-icon="false" :with-share="true" :disabled="isFetching"><i class="fa fa-copy is-visible-mobile"></i><span class="is-hidden-mobile">{{'Скопировать'|gettext}}</span></vue-component-clipboard>
<!-- 								<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> -->
							</div> 
						</div> 
					</div> 
				</div>
				<div class="message is-danger has-mb-6" v-if="info.suspended_message">
					<div class="message-body" v-html="$nl2br(info.suspended_message)"></div>
				</div>
			</div>
		</div>
	
		<vue-component-submenu :page_id="page_id" :force_submenu="true"></vue-component-submenu>
		<router-view></router-view>
	</div>
`});

window.$app.defineComponent("partner", "vue-partner-links-form", {data: function() {
			return {
				isUpdating: false,
				isFetching: false,
				isReadonly: true,
				domain: 'taplink.at',
				pathname_placeholder: '',
				values: {partner_link_id: null, name: '', welcome_message: '', with_message: false, with_access: false, with_trial: false, trial_period: 3, is_main: false},
				errors: {name: ''},
			}
		},

		props: ['partner_link_id'],

		created: function () {
			if (this.partner_link_id) {
				this.fetchData();
			} else {
				this.$api.get('partner/links/info').then((data) => {
					this.domain = data.response.domain;
					this.isReadonly = false;
				});
			}
		},

		methods: {
			pathnameFilter(e) {
				let charCode = (e.which) ? e.which : e.keyCode;
				var txt = String.fromCharCode(charCode);
				if(!txt.match(/[A-Za-z0-9\-_]/)) e.preventDefault();
			},
			
			pathnameFilterAfter(e) {
				e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9\-_ ]/g, '').trim().replace(/ /g, '_');
			},
						
			fetchData() {
				this.isFetching = true;
				this.$api.get(['partner/links/get', 'partner/links/info'], {partner_link_id: this.partner_link_id}).then((data) => {
					this.isFetching = false;
					this.values = data.response.values;
					this.pathname_placeholder = data.response.pathname_placeholder;
					this.domain = data.response.domain;
					this.isReadonly = this.values.is_main;
				});

			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('partner/links/set', this.values).then((data) => {
					if (data.result == 'fail') {
						this.errors = data.errors;
					} else {
						this.$parent.close()
					}
					this.isUpdating = false;
				}).catch(({ data }) => {
					this.isUpdating = false;
				})
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Реферальная ссылка'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
			<section>
				<div class="message is-info" v-if="!values.partner_link_id && !isFetching">
					<div class="message-body">{{'Вы можете создать несколько реферальных ссылок для различных каналов трафика и получать статистику о количестве регистраций. Каждая ссылка может обладать уникальным приветственным сообщением'|gettext}}</div>
				</div>
				
				<b-field :label="'Название'|gettext" :message="errors.name" :class="{'has-error': errors.name}">
	            	<b-input v-model="values.name" :disabled="isReadonly"></b-input>
				</b-field>
				
				<div class="has-mb-1" :class="{'has-error': errors.pathname}">
					<label class="label">{{'Имя ссылки'|gettext}}</label>
					<div class="field has-addons is-marginless">
						<div class="control"><span class="button is-static">https://{{domain}}/invite/</span></div>
						<div class="control is-expanded"><input type="text" class="input"  @keypress="pathnameFilter" @change="pathnameFilterAfter" @keyup="pathnameFilterAfter" v-model="values.pathname" :placeholder="pathname_placeholder" maxlength="64" :disabled="isReadonly"></div>
						<div class="control"><span class="button is-static">/</span></div>
					</div>
					<p class="help" v-if="errors.pathname">{{errors.pathname}}</p>
				</div>
			</section>
			<section>
				<div class="field">
					<mx-toggle v-model='values.with_trial' :title="'Активировать полный функционал на время'|gettext" :disabled="isReadonly"></mx-toggle>
				</div>
				
				<div class="field has-mt-2" v-if="values.with_trial">
					<label class="label">{{'На сколько дней'|gettext}}: <span class="is-pulled-right">{{ values.trial_period }}</span></label>
					<b-slider v-model="values.trial_period" size="is-medium" :min="1" :max="7" ticks type="is-dark" :step="1">
				</div>
	
				<div class="field">
					<mx-toggle v-model='values.with_message' :title="'Показать приветственный текст после регистрации'|gettext" :disabled="isReadonly"></mx-toggle>
				</div>
				
				<b-field :label="'Приветственный текст'|gettext" v-if="values.with_message" class="has-mt-2" :class="{'has-error': errors.welcome_message}">
					<p class="control emoji-picker-container"><textarea class="input" v-emoji style="min-height: 100px" v-model="values.welcome_message" :disabled="isReadonly" :placeholder="'Пример: Добрый день, это Иван из СУПЕРМЕДИА. Для того, что бы я смог настроить вам эффективную страницу, вам необходимо предоставить мне права доступа'|gettext"></textarea></p>
				</b-field>
				<p v-if="values.with_message" class="has-mb-2">{{'Напишите текст, который будет отображаться пользователю при регистрации по вашей реферальной ссылке'|gettext}}</p>
				
				<mx-toggle v-model='values.with_access' :title="'Запросить права на редактирование страницы после регистрации'|gettext" :disabled="isReadonly || !values.with_message"></mx-toggle>
			</section>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Отмена'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData" :disabled="isReadonly">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("partner", "vue-partner-links", {data() {
			return {
				isFetching: false,
				links: [],
			}
		},

		created() {
			this.fetchData();
			
			this.$io.on('events:partner.links:refresh', this.fetchData);
		},
		
		destroyed() {
			this.$io.off('events:partner.links:refresh', this.fetchData);
		},


		methods: {
			onPageChange(page) {
                this.page = page
                this.fetchData()
            },
            
			fetchData() {
				this.isFetching = true;
				this.$api.get('partner/links/list', {page: this.page}).then((data) => {
					this.links = data.response.links.fields;
					this.isFetching = false;
				}).catch((error) => {
                    this.links = []
                    this.isFetching = false
                    throw error
                })
			},
			
			openForm(row) {
				this.$modal('vue-partner-links-form', {partner_link_id: row?row.partner_link_id:null}, this);
			}
		}, template: `
	<div>
		<div class="container">
			<b-table :data="links" :loading="isFetching" hoverable bordered @click="openForm" class="has-mb-3 has-mt-3">
				<b-table-column :label="'Название'|gettext" v-slot="props">
					{{ props.row.name }}
				</b-table-column>
				
				<b-table-column :label="'Ссылка'|gettext" v-slot="props">
					{{ props.row.link }}
				</b-table-column>
				
				<b-table-column :label="'Действие'|gettext" class="has-width-10" v-slot="props">
					<vue-component-clipboard :text="props.row.link" class="button is-primary is-small" :show-icon="false">{{'Скопировать'|gettext}}</vue-component-clipboard>
				</b-table-column>
				
				<b-table-column :label="'Кол-во профилей'|gettext" numeric class="has-width-15" v-slot="props">
					{{ props.row.amount | number }}
				</b-table-column>

				<b-table-column :label="'Кол-во оплат'|gettext" numeric class="has-width-15" v-slot="props">
					{{ props.row.payments | number }}
				</b-table-column>

				<b-table-column :label="'Доход'|gettext" numeric class="has-width-15" v-slot="props">
					<div v-for="v in props.row.budget">
					{{ v.budget|currency(v.currency_title) }}
					</div>
				</b-table-column>
				
				<template slot="empty">
	                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
                        <p><b-icon icon="frown" size="is-large"></b-icon></p>
                        <p>{{'Пока ничего нет'|gettext}}</p>
	                </section>
	                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
		                <p>{{'Загрузка данных'|gettext}}</p>
	                </section>
	            </template>
	            
	            <template slot="footer">
		            <a class="button is-text is-fullwidth" @click="openForm()" style="text-decoration:none"><i class="fa fa-plus-circle"></i> {{'Создать новую ссылку'|gettext}}</a>
	            </template>
			</b-table>
		</div>
	</div>
`});

window.$app.defineComponent("partner", "vue-partner-partners", {data: function() {
			return {
				permissions: {},
                perPage: 50,
                isUpdating: false,
                form: {nickname: '', percent: '', period: ''},
				isFeaching: false
			}
		},
		
		mixins: [ListModel],

		created: function () {
			this.fetchData();
		},

		methods: {
			onPageChange(page) {
                this.page = page
                this.fetchData()
            },
            
            onSort(field, order) {
                this.sortField = field;
                this.sortOrder = order;
                this.fetchData()
            },
            
            fetchData() {
	            let resolve = (data) => {
					this.fields = data.fields;
	            }
	            
	           if (!this.checkCache(resolve)) {
					this.isFeaching = true;
					this.$api.get('partner/partners/list', {next: this.next, count: this.perPage}).then((data) => {
						this.cachePage(data.response.partners, resolve);
						this.isFeaching = false;
					}).catch((error) => {
	                    this.fields = []
	                    this.total = 0
	                    this.isFeaching = false
	                    throw error
	                })
                }
			}
		}, template: `
	<div class="container">
		<b-table paginated backend-pagination pagination-simple :data="fields" :loading="isFeaching" class="has-mb-4 has-mt-4" :per-page="perPage" :total="total" @page-change="onPageChange">
			<b-table-column label="Профиль" v-slot="props">
				<a v-for="profile in props.row.profiles" class="is-block" @click="openForm(profile.profile_id)" v-if="permissions.profile">@{{ profile.username }}</a>
				<div v-else>@{{ profile.username }}</div>
			</b-table-column>
			<b-table-column field="percent" label="Процент" v-slot="props">{{ props.row.percent }} %</b-table-column>
			<b-table-column field="profiles" label="Промокоды" v-slot="props">
				<div class="tags" v-if="props.row.promos"><div v-for="promocode in props.row.promos" class="tag is-success">{{ promocode.code }}</div></div>
				<div v-else class="has-text-danger">{{'Нет'|gettext}}</div>
			</b-table-column>
			<b-table-column field="profiles" label="Статистика" numeric v-slot="props">
				<div v-if="props.row.invited_amount">{{'Регистрации'|gettext}}: {{ props.row.invited_amount }}</div>
				<div v-if="props.row.invited_amount_installed">{{'Установки'|gettext}}: {{ props.row.invited_amount_installed }}</div>
				<div v-if="props.row.invited_orders">{{'Оплаты'|gettext}}: {{ props.row.invited_orders }}</div>
				<div v-if="props.row.invited_budget">
					<div v-for="v in props.row.invited_budget">
					{{ v.budget|currency(v.currency_title) }}
					</div>
				</div>
			</b-table-column>
		</b-table>
	</div>
`});

window.$app.defineComponent("partner", "vue-partner-payments", {data() {
			return {
				isFetching: false,
				perPage: 100
			}
		},

		mixins: [ListModel],

		created() {
			this.fetchData();
		},

		methods: {
			onPageChange(page) {
                this.page = page
                this.fetchData()
            },
            
			fetchData() {
				let resolve = (data) => {
					this.fields = data.fields;
				}
				
				if (!this.checkCache(resolve)) {
					this.isFetching = true;
					this.$api.get('partner/payments/list', {next: this.next, count: this.perPage}).then((data) => {
						this.cachePage(data.response.payments, resolve);
						this.isFetching = false;
					}).catch((error) => {
	                    this.payments = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
                }
			}
		}, template: `
	<div>
		<div class="container">
			<b-table paginated backend-pagination pagination-simple class="has-mb-3 has-mt-3" :data="fields" :current-page="page" :loading="isFetching" :per-page="perPage" :total="total" @page-change="onPageChange" bordered>
				<b-table-column :label="'Дата'|gettext" v-slot="props">
					{{ props.row.tms_modify | datetime }}
				</b-table-column>
				<b-table-column :label="'Профиль'|gettext" v-slot="props">
					<a :href='props.row.instagram_link' target="_blank" v-if="props.row.instagram_link">{{props.row.nickname}}</a>
					<span v-else>{{props.row.nickname}}</span>
				</b-table-column>
				<b-table-column field="price" :label="'Бюджет'|gettext" numeric v-slot="props">{{props.row.budget|currency(props.row.currency_title)}}</b-table-column>
				<b-table-column field="price" :label="'Процент'|gettext" numeric v-slot="props"><span v-if="props.row.percent_parent" class="has-text-grey-light has-mr-1" style="font-size: 80%"><i class="fas fa-info-circle" v-tippy :content="'{1}% - {2}%'|format(props.row.percent_parent, props.row.percent_child)"></i></span>{{ props.row.partner_percent }}%</b-table-column>
				
				<template slot="empty">
	                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
                        <p><b-icon icon="frown" size="is-large"></b-icon></p>
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

window.$app.defineComponent("partner", "vue-partner-profiles", {data() {
			return {
				isFetching: false,
                perPage: 100
			}
		},

		mixins: [ListModel],

		created() {
			this.fetchData();
		},

		methods: {
			onPageChange(page) {
                this.page = page
                this.fetchData()
            },
            
            fetchData() {
				let resolve = (data) => {
					this.fields = data.fields;
				}				
				
				if (!this.checkCache(resolve)) {
					this.isFetching = true;
					this.$api.get('partner/profiles/list', {next: this.next, count: this.perPage}).then((data) => {
						this.cachePage(data.response.profiles, resolve);
						this.isFetching = false;
					}).catch((error) => {
	                    this.fields = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                });
                }
			},
			
		}, template: `
	<div>
		<div class="container">
<!--
		<div class="has-mb-2 has-mt-4">
			<mx-item class="mx-item-header">
				<div class="item-row row">
					<div class="col-xs-12"> Всего профилей: {{ total|number }} </div>
				</div> 
			</mx-item>
		</div>
-->
		
		<b-table paginated backend-pagination pagination-simple :data="fields" :loading="isFetching" class="has-mb-3 has-mt-3" :per-page="perPage" :current-page="page" :total="total" @page-change="onPageChange" bordered>
			<b-table-column :label="'Профиль'|gettext" v-slot="props">
				<a :href='props.row.instagram_link' target="_blank" v-if="props.row.instagram_link">{{props.row.username }}</a>
				<span v-else><span v-if="props.row.username">{{props.row.username}}</span><span v-else>id:{{props.row.profile_id}}</span></span>

				<div class="tags is-pulled-right is-hidden-mobile" v-if="props.row.is_child"><span class="tag is-grey">{{'Второй уровень'|gettext}}</span></div>
			</b-table-column>
			<b-table-column :label="'Ссылка'|gettext" v-slot="props">
				<a :href='props.row.link' target="_blank" v-if="props.row.username">{{props.row.link}}</a>
				<div class="tags is-pulled-right is-hidden-mobile">
					<vue-component-tariff-badge v-model="props.row.tariff" />
				</div>
			</b-table-column>
<!-- 				<b-table-column field="percent" :label="'Подписчиков'|gettext" numeric>{{ props.row.followers | number }}</b-table-column> -->
			<b-table-column :label="'Дата'|gettext" numeric v-slot="props">
				{{ props.row.tms_created | datetime }}
			</b-table-column>
			
			<template slot="empty">
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
                    <p><b-icon icon="frown" size="is-large"></b-icon></p>
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

window.$app.defineComponent("partner", "vue-partner-promocodes-form", {data: function() {
			return {
				isUpdating: false,
				isFetching: false,
				values: {code: '', type: 'discount', days: 3},
				errors: {code: ''},
			}
		},

		props: ['promocode_id'],

		created: function () {
			if (this.promocode_id) this.fetchData();
		},

		methods: {
			fetchData() {
				this.isFetching = true;
				this.$api.get('partner/promocodes/get', {promocode_id: this.promocode_id}).then((data) => {
					this.isFetching = false;
					this.values = data.response.promocode.values;
				});

			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('partner/promocodes/set', this.values).then((data) => {
					if (data.result == 'fail') {
						this.errors = data.errors;
					} else {
						this.$parent.close()
					}
					this.isUpdating = false;
				}).catch(({ data }) => {
					this.isUpdating = false;
				})
			},
			
			codeFilter(e) {
				// a-z A-Z 0-9 "-" "_"
				let charCode = (e.which) ? e.which : e.keyCode;
				let isAllow = ([45, 95].indexOf(charCode) != -1) || (charCode >= 48 && charCode <= 57) || (charCode >= 97 && charCode <= 122) || (charCode >= 65 && charCode <= 90);
				if (!isAllow) e.preventDefault();
			},
			
			codeFilterCheck() {
				this.values.code = this.values.code.replace(/([^a-zA-Z0-9\_\-])/g, '');
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Промокод'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<b-field :label="'Промокод'|gettext" :message="errors.code" :class="{'has-error': errors.code}">
            	<input v-model="values.code" @keypress="codeFilter" @keyup="codeFilterCheck()" class="input"></input>
			</b-field>
			
			<b-field :label="'Что дает промокод'|gettext">
				<b-select v-model="values.type" expanded>
	                <option value="discount">{{'Скидка'|gettext}} 10%</option>
	                <option value="trial">{{'Временный доступ'|gettext}}</option>
	            </b-select>
			</b-field>
			
			
			<div class="field" v-if="values.type == 'trial'">
				<label class="label">{{'На сколько дней'|gettext}}: <span class="is-pulled-right">{{ values.days }}</span></label>
				<b-slider v-model="values.days" size="is-medium" :min="0" :max="7" ticks type="is-dark" :step="1"></b-slider>
			</div>
			
			
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Отмена'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("partner", "vue-partner-promocodes", {data() {
			return {
				isFetching: false,
				promocodes: [],
			}
		},

		created() {
			this.fetchData();
			
			this.$io.on('events:partner.promocodes:refresh', this.fetchData);
		},
		
		destroyed() {
			this.$io.off('events:partner.promocodes:refresh', this.fetchData);
		},

		methods: {
			fetchData() {
			this.isFetching = true;
				this.$api.get('partner/promocodes/list').then((data) => {
					this.promocodes = data.response.promocodes;
					this.isFetching = false;
				});
			},
			
			openForm(row) {
				this.$modal('vue-partner-promocodes-form', {promocode_id: row?row.promocode_id:null}, this);
			}
		}, template: `
	<div>
		<div class="container">
			
			<b-table :data="promocodes" :loading="isFetching" hoverable bordered @click="openForm" class="has-mb-3 has-mt-3">
				
				<b-table-column field="name" :label="'Промокод'|gettext" v-slot="props">
					{{ props.row.code }}
				</b-table-column>
				<b-table-column field="amount" :label="'Кол-во профилей'|gettext" numeric class="has-width-15" v-slot="props">{{ props.row.amount }}</b-table-column>
				<b-table-column field="description" :label="'Значение'|gettext" numeric class="has-width-15" v-slot="props"><span v-if="props.row.type == 'trial'">{{ 'день' | plural(props.row.value) }}</span><span v-else>{{ props.row.value }} %</span></b-table-column>
				
				<template slot="empty">
					<section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
	                    <p><b-icon icon="frown" size="is-large"></b-icon></p>
	                    <p>{{'Пока ничего нет'|gettext}}</p>
	                </section>
	                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
		                <p>{{'Загрузка данных'|gettext}}</p>
	                </section>
	            </template>
	            
	            <template slot="footer">
		            <a class="button is-text is-fullwidth" @click="openForm()" style="text-decoration:none"><i class="fa fa-plus-circle"></i> {{'Добавить промокод'|gettext}}</a>
	            </template>
	            
			</b-table>
		</div>
	</div>
`});

window.$app.defineComponent("partner", "vue-partner-statistics", {data: function() {
			return {
				statuses: {unsigned: 'Не подписан', pending: 'В ожидании', signed: 'Подписан'},
				statuses_colors: {unsigned: 'danger', pending: 'warning', signed: 'success'},
				info: {
					income: [],
					limits: [],
					sent: [],
					percent: {percent: 0, percent_parent: 0},
					agreement_status: 'unsigned',
					statistics: {
						profiles: 0,
						sales: 0,
					}
				},
				charts: {
					profiles: {},
					payments: {}
				},
				period: 'day',
				period_back: 0,
				isFetching: false,
			}
		},
		
		props: ['page_id'],
		
		watch: {
			period(val) {
				this.fetchData(false, ["chart"]);
			}			
		},

		created: function () {
			this.fetchData();
			this.$io.on('events:partner.statistics:refresh', this.refresh);
		},
		
		destroyed: function() {
			this.$io.off('events:partner.statistics:refresh', this.refresh);
		},

		methods: {
			refresh() {
				this.fetchData(false);
			},
			
			fetchData(withFeaching = true, scope) {
				scope = scope?scope:['chart', 'stats'];
				this.isFetching = withFeaching;
				this.$api.get('partner/statistics/get', {period: this.period, period_back: this.period_back, scope:scope}).then((data) => {
					if (scope.indexOf('stats') != -1) this.info = data.response.info;
					this.charts = data.response.info.statistics.charts;
					this.isFetching = false;
				});
			},
			
			openForm() {
				this.$modal('vue-partner-withdrawals-form', {agreement_status: this.info.agreement_status}, this);
			},
			
			openFormContacts(hideMessage) {
				this.$modal('vue-partner-details-form', {agreement_status: this.info.agreement_status, hideMessage: hideMessage}, this);
			}		
		}, template: `
	<div>
		<div class="container">
			
			<div class="row">
				<div class="col-sm-4 col-md-3 has-mb-2 col-xs-12">
					<b-field class="has-tabs-style has-mt-3">
			            <b-radio-button v-model="period" type="active" class="is-expanded" native-value="day">{{'День'|gettext}}</b-radio-button>
			            <b-radio-button v-model="period" type="active" class="is-expanded" native-value="week">{{'Неделя'|gettext}}</b-radio-button>
			            <b-radio-button v-model="period" type="active" class="is-expanded" native-value="month">{{'Месяц'|gettext}}</b-radio-button>
					</b-field>
				</div>
			</div>
			
			<div class="row row-small">
				<div class="col-xs-6 col-sm-4 has-mb-2">
					<vue-component-statistics class="partners-statistics" :is-fetching="isFetching" :padding-top="20" :title-size="4" :data="charts.profiles" :period="period" :period_back="period_back" :title="'Профили'|gettext" color="#94a7ff" title-size="4"></vue-component-statistics>
				</div>
				<div class="col-xs-6 col-sm-4 has-mb-2">
					<vue-component-statistics class="partners-statistics" :is-fetching="isFetching" :padding-top="20" :title-size="4" :data="charts.payments" :period="period" :period_back="period_back" :title="'Оплаты'|gettext" color="#b694ff" title-size="4"></vue-component-statistics>
				</div>
				<div class="col-xs-12 col-sm-4 has-mb-2 first-xs last-sm">
					<vue-component-statistics class="partners-statistics" :is-fetching="isFetching" :padding-top="20" :title-size="4" :data="charts.payments" :period="period" :period_back="period_back" :title="'Доход'|gettext" color="#b0cb75" title-size="4" value-name="budget" value-type="decimal"></vue-component-statistics>
				</div>
			</div>

			<div class="has-mb-4 has-mt-2">
			<div class="panel panel-default">
				<mx-item class="mx-item-header">
				<div class="item-row row">
					<div class="col-xs-12">{{'Статистика'|gettext}}</div>
				</div>
				</mx-item>
				
				<mx-item>
				<div class="item-row row">
					<div class="col-xs-8 col-sm-10">{{'Кол-во профилей'|gettext}}</div>
					<div class="col-xs-4 col-sm-2 has-text-right">{{ info.statistics.profiles | number }}</div>
				</div>
				</mx-item>
			
				<mx-item>
				<div class="item-row row">
					<div class="col-xs-8 col-sm-10">{{'Кол-во продаж'|gettext}}</div>
					<div class="col-xs-4 col-sm-2 has-text-right">{{ info.statistics.sales | number }}</div>
				</div>
				</mx-item>
			
				<mx-item>
				<div class="item-row row">
					<div class="col-xs-8 col-sm-10">{{'Процент отчислений'|gettext}}</div>
					<div class="col-xs-4 col-sm-2 has-text-right">{{ info.percent.percent }} %</div>
				</div>
				</mx-item>
				
				<mx-item v-if="info.percent.percent_parent">
				<div class="item-row row">
					<div class="col-xs-8 col-sm-10">{{'Процент отчислений второго уровня'|gettext}}</div>
					<div class="col-xs-4 col-sm-2 has-text-right">{{info.percent.percent_parent}} % </span></div>
				</div>
				</mx-item>

				<mx-item>
				<div class="item-row row">
					<div class="col-xs-8 col-sm-10">
						{{'Доход'|gettext}}
						<a @click="openForm()" class="button is-primary is-small is-pulled-right" :class="{disabled: info.income.length == 0}">{{'Заказать вывод'|gettext}}</a>
						<a class="is-pulled-right has-mr-1 button is-small is-dark" target="_blank" href="https://taplink.ru/s/rules_en.pdf" v-if="i18n.locale != 'ru' && i18n.locale != 'es' && i18n.locale != 'es-mx'">{{'Правила'|gettext}}</a>						
						<a class="is-pulled-right has-mr-1 button is-small is-dark" target="_blank" href="https://taplink.ru/s/rules_es.pdf" v-if="i18n.locale == 'es' || i18n.locale == 'es-mx'">{{'Правила'|gettext}}</a>						
					</div>
					<div class="col-xs-4 col-sm-2 has-text-right">
						<div v-if="info.income.length">
							<div v-for="v in info.income">{{v.budget|currency(v.currency_title)}}</div>
						</div>
						<div v-else class="has-text-grey-light">—</div>
					</div>
				</div>
				</mx-item>
			
				<mx-item>
				<div class="item-row row">
					<div class="col-xs-8 col-sm-10">{{'Выведено'|gettext}}</div>
					<div class="col-xs-4 col-sm-2 has-text-right">
						<div v-if="info.sent.length">
							<div v-for="v in info.sent">{{v.budget|currency(v.currency_title)}}</div>
						</div>
						<div v-else class="has-text-grey-light">—</div>
					</div>
				</div>
				</mx-item>
				
				<mx-item v-if="i18n.locale == 'ru'">
				<div class="item-row row">
					<div class="col-xs-8 col-sm-10">
						Агентский договор
						<a @click="openFormContacts(false)" class="button is-black is-small is-pulled-right"><span v-if="info.agreement_status == 'unsigned'">Подписать</span><span v-else>Реквизиты</span></a>
						<a class="is-pulled-right has-mr-1 button is-small is-dark" target="_blank" href="https://taplink.ru/s/rules_ru.pdf" v-if="i18n.locale == 'ru'">Правила</a>
					</div>
					<div class="col-xs-4 col-sm-2 has-text-right" :class="'has-text-'+statuses_colors[info.agreement_status]">{{statuses[info.agreement_status]}}</span></div>
				</div>
				</mx-item>
				
				<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
			</div>
			
			</div>
			
			<div class="has-mb-4" v-if="info.limits.length">
				<vue-partner-withdrawals :limits="info.limits"></vue-partner-withdrawals>
			</div>
		</div>

	</div>
`});

window.$app.defineComponent("partner", "vue-partner-withdrawals-form", {data: function() {
			return {
				isUpdating: false,
				isFetching: true,
				currency_id: null,
				is_allow: false,
				methods: {
					bankwire: {title: this.$gettext('Расчетный счет'), type: 'business', locale: 'ru'},
					card: {title: this.$gettext('Банковская карта'), type: 'individual'},
					yandexmoney: {title: this.$gettext('Яндекс.Деньги'), type: 'individual', locale: 'ru'},
					qiwi: {title: this.$gettext('QIWI-кошелек'), type: 'individual', locale: 'ru'}
				},
				values: {
					method: null,
					purpose: '',
					budget: 0,
					limits: {}
				},
				errors: {budget: ''},
			}
		},
		
		mixins: [FormModel],
		props: ['agreement_status'],
		
		computed: {
			purpose_title() {
				var titles = {
					card: this.$gettext('Введите номер вашей карты'),
					paypal: this.$gettext('Введите email вашего PayPal кошелька'),
					yandexmoney: this.$gettext('Введите номер вашего Яндекс-кошелека'),
					qiwi: this.$gettext('Введите номер вашего QIWI-кошелека'),
					bankwire: this.$gettext('Введите номер расчетного счета')
				}
				
				return titles[this.values.method];
			}
		},

		created: function () {
			this.fetchData();
		},

		methods: {
			fetchData() {
				this.isFetching = true;
				this.$api.get('partner/withdrawals/prepare').then((data) => {
					this.values = data.response.withdrawal.values;
					
					let keys = Object.keys(this.values.budget);
					
					this.currency_id = this.values.budget[keys[0]].currency_id;
					
					if (this.agreement_status == 'signed') this.values.method = 'bankwire';
// 					this.values.budget = this.$currency(this.values.budget, 'RUB');
					this.isFetching = false;
				});
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('partner/withdrawals/add', {currency_id: this.currency_id, budget: this.values.budget[this.currency_id].amount, comments: this.values.comments, method: this.values.method, purpose: this.values.purpose, fio: this.values.fio, swift: this.values.swift, inn: this.values.inn}, this).then((data) => {
					if (data.result == 'fail') {
						this.errors = data.errors;
					} else {
						this.$parent.close()
					}
					this.isUpdating = false;
				}).catch(({ data }) => {
					this.isUpdating = false;
				})

			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Заказ вывода средств'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<b-field :label="'Выберите метод вывода'|gettext">
				<b-select v-model="values.method" expanded :disabled="agreement_status == 'signed'" :placeholder="'Выберите метод вывода'|gettext">
	                <option :value="k" v-for="(m, k) in methods" v-if="m.locale == undefined || m.locale == i18n.locale">{{m.title}}</option>
	            </b-select>
			</b-field>

			<div v-if="i18n.locale == 'ru' && !isFetching" :class="{'has-mb-3': values.is_allow}">
				<div class="message is-warning" v-if="methods[values.method] != undefined && methods[values.method].type == 'individual'">
					<div class="message-body has-p-2">Лимит вывода средств на счет физического лица равен 30 000 рублей в месяц, не чаще чем раз в две недели, минимальная сумма 1 000 рублей. Для юридических лиц лимит максимальной суммы вывода отсутствует. Для вывода средств на счет юридического лица требуется подписать <a @click="$parent.$parent.openFormContacts(true)">агентский договор</a>.</div>
				</div>

				<div class="message is-warning" v-if="methods[values.method] != undefined && methods[values.method].type == 'business'">
					<div class="message-body has-p-2" v-if="agreement_status == 'signed'">Вывод средств возможен не чаще чем раз в две недели</div>
					<div class="message-body has-p-2" v-else>Вывод средств возможен не чаще чем раз в две недели. Для вывода средств на счет юридического лица требуется подписать <a @click="$parent.$parent.openFormContacts(true)">агентский договор</a>.</div>
				</div>
			</div>
			
			<div v-if="values.is_allow && methods[values.method] != undefined">
				<b-field :label="purpose_title" :message="errors.purpose" :class="{'has-error': errors.purpose}" v-if="values.method != 'bankwire'">
					<b-input v-model="values.purpose"></b-input>
				</b-field>

<!--
			<div class="row has-mb-2" v-if="values.method == 'bankwire'">
			<div class="col-xs-12 col-sm-6">				
				<b-field :label="'БИК'|gettext" :message="errors.swift" :class="{'has-error': errors.swift}">
					<input v-model="values.swift" type="text" class="input" maxlength="24">
				</b-field>
			</div>
			<div class="col-xs-12 col-sm-6">				
				<b-field :label="'ИНН'|gettext" :message="errors.inn" :class="{'has-error': errors.inn}">
					<input v-model="values.inn" type="text" class="input" maxlength="64">
				</b-field>
			</div>
			</div>
-->

				<b-field :label="'ФИО'|gettext" :message="errors.fio" :class="{'has-error': errors.fio}" v-if="values.method != 'bankwire'">
					<b-input v-model="values.fio"></b-input>
				</b-field>
				
				<div :class="{'has-error': errors.budget}">
				<label class="label">{{'Сумма'|gettext}}</label>
				<div v-for="v in values.budget" class="row row-small has-mb-2">
					<div class="col-xs col-shrink" style="display:flex;align-items: center" v-if="Object.keys(values.budget).length > 1">
						<div class="radio"><input type="radio" name="currency_id" v-model="currency_id" :value="v.currency_id"></div>
					</div>
					
					<div class="col-xs">
						<b-field>
							<div class="control is-expanded is-clearfix">
								<number class="input has-text-right" v-model='v.amount' :disabled="currency_id != v.currency_id" :class="{'has-text-danger': v.amount < values.limits[v.currency_id] || v.amount > v.max}"></number>
							</div>
							<p class="control">
								<span class="button is-static">{{v.currency_title}}</span>
							</p>
						</b-field>
					</div>
				</div>
				<p class="help has-mb-2" v-if="errors.budget">{{errors.budget}}</p>
				</div>
	
				<b-field :label="'Комментарий'|gettext">
					<b-input type='textarea' v-model='values.comments'></b-input>
				</b-field>
			</div>
			
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Отмена'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData" :disabled="!values.is_allow">{{'Отправить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});

window.$app.defineComponent("partner", "vue-partner-withdrawals", {data: function() {
			return {
                page: 1,
                total: 0,
                perPage: 20,
                next: null,
                pages: [],
				withdrawals: [],
				isFetching: false
			}
		},

		props: ['limits'],

		mixins: [ListModel],

		created: function () {
			this.fetchData();
			this.$io.on('events:partner.withdrawals:refresh', this.refresh);
		},
		
		destroyed: function() {
			this.$io.off('events:partner.withdrawals:refresh', this.fetchData);
		},

		methods: {
			onPageChange(page) {
                this.page = page
                this.fetchData()
            },
            
            refresh() {
	            this.clearPages();
				this.fetchData();
            },
            			
			fetchData() {
				let resolve = (data) => {
					this.withdrawals = data.fields;
				}
				
				if (!this.checkCache(resolve)) {
					this.isFeaching = true;
					this.$api.get('partner/withdrawals/list', {next: this.next}).then((data) => {
						this.cachePage(data.response.withdrawals, resolve);
						this.isFeaching = false;
					});
				}
			}
		}, template: `
	<b-table paginated backend-pagination pagination-simple bordered :data="withdrawals" :loading="isFetching" :per-page="perPage" :total="total" @page-change="onPageChange">
		
		<b-table-column field="name" :label="'Статус заказа'|gettext" v-slot="props">
			<span class='tag is-success' v-if="props.row.tms_completed">{{'Запрос исполнен'|gettext}}</span>
			<span class='tag is-warning' v-else>{{'Новый запрос'|gettext}}</span>
		</b-table-column>
		<b-table-column field="tms_created" :label="'Дата заказа'|gettext" class="has-width-15" v-slot="props">{{ props.row.tms_created | date }}</b-table-column>
		<b-table-column field="tms_completed" :label="'Дата исполнения'|gettext" class="has-width-15" v-slot="props">{{ props.row.tms_completed | date}}</b-table-column>
		<b-table-column field="budget" :label="'Сумма'|gettext" numeric class="has-width-15" v-slot="props">{{ props.row.budget|currency(props.row.currency_title) }}</b-table-column>
		
		
		<template slot="empty">
            <section class="has-mb-4 has-mt-4" v-if="!isFetching">
                <div class="content has-text-grey-light has-text-centered">
                    <p>{{'Вы еще не заказывали вывод, минимальная сумма для вывода %s'|gettext|replace('%s', limits.join(', '))}}</p>
                </div>
            </section>
        </template>
        
	</b-table>
`});
window.$app.defineModule("partner", [{ path: 'statistics/', component: 'vue-partner-statistics', meta: {title: 'Статистика'}, props: true, name: 'partner.statistics'},
{ path: 'promocodes/', component: 'vue-partner-promocodes', meta: {title: 'Промокоды'}, props: true, name: 'partner.promocodes'},
{ path: 'links/', component: 'vue-partner-links', meta: {title: 'Ссылки'}, props: true, name: 'partner.links'},
{ path: 'profiles/', component: 'vue-partner-profiles', meta: {title: 'Профили'}, props: true, name: 'partner.profiles'},
{ path: 'partners/', component: 'vue-partner-partners', meta: {title: 'Партнеры', endpoint: 'partner/partners/list'}, props: true, name: 'partner.partners'},
{ path: 'payments/', component: 'vue-partner-payments', meta: {title: 'Оплаты'}, props: true, name: 'partner.payments'}]);