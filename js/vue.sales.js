
window.$app.defineComponent("sales", "vue-sales-contacts-export-form", {data() {
			return {
				isUpdating: false,
				isRefreshing: false,
				isFetching: false,
				amount: 0,
				charset: 'utf-8',
				variants: {}
			}
		},

		created() {
			this.fetchData(true);
		},
		
		props: ['filter'],
		
		computed: {
			downloadUrl() {
				return '/api/sales/contacts/export/download.csv?'+$mx.param({filter: this.filter, export_products: this.export_products?1:0})+'&charset='+this.charset;
			}	
		},

		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isRefreshing =  this.isFetching = withLoading;
				
				this.$api.get('sales/contacts/export/info', {filter: this.filter, charset: this.charset}).then((data) => {
					this.isFetching = this.isRefreshing = false;
					this.variants = data.response.export.info.variants;
					this.amount = data.response.export.info.amount;
				});
			},
			
/*
			onChanged() {
				this.isRefreshing = true;
				this.$api.get('leads/export/calc', {filter: this.filter, charset: this.charset}).then((data) => {
					this.isRefreshing = false;
					this.amount = data.response.export.calc;
				});
			}
*/
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Экспорт контактов'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			
			<div class="message is-success">
				<div class="message-body">
				{{'Всего контактов'|gettext}}: {{ amount|number }}
				<a :href="downloadUrl" target="frame" class="button is-small is-success is-pulled-right no-ajax" :class="{'is-loading': isRefreshing}"><span class="is-hidden-mobile">{{'Скачать CSV-файл'|gettext}}</span><span class="is-hidden-tablet">{{'Скачать'|gettext}}</span></a>
				</div>
			</div>
			
			<b-field :label="'Кодировка'|gettext" v-if="i18n.locale == 'ru'">
				<b-select v-model="charset" expanded>
					<option v-for="(v, k) in variants.charset" :value="k">{{ v }}</option>
				</b-select>
			</b-field>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("sales", "vue-sales-contacts-list", {data() {
			return {
				isReadonly: false,
				isFetching: false,
				filter: {query: ''},
				amount: 0,
				perPage: 50,
				checkedRows: [],
				isAllow: this.$auth.isAllowTariff('business'),
				table_columns: [
					{field: 'name', label: 'Имя', visible: true, numeric: false, sortable: true},
					{field: 'email', label: 'Email', visible: true, numeric: false, sortable: true, classname: 'has-width-30'},
					{field: 'phone', label: 'Телефон', visible: true, numeric: false, sortable: true, classname: 'has-width-30'},
				]
			}
		},
		
		mixins: [ListModel],
		
		created() {
			this.isReadonly = !this.$auth.isAllowEndpoint('sales/contacts/action');
			this.$io.on('events:contacts.list:delete', this.deleteContacts);
			this.fetchData(true);
		},
		
		destoyed() {
			this.$io.off('events:contacts.list:delete', this.deleteContacts);
		},

		methods: {
			deleteContacts(data) {
				let ids = this.checkIds(this.fields, 'contact_id', data.contact_ids);
				if (ids.length) {
					this.clearPages();
					this.fetchData(false, true);
				}
			},
			
			fetchData(withLoading) {
				let resolve = (data) => {
					this.fields = data.fields;
					this.amount = data.amount;
				}
				
				if (!this.checkCache(resolve)) {
					this.isFetching = withLoading;
					this.$api.post('sales/contacts/list', {next: this.next, count: this.perPage, sort_field: this.sortField, sort_order: this.sortOrder, filter: this.filter}).then((data) => {
						this.cachePage(data.response.contacts, resolve);
						this.isFetching = false;
					}).catch((error) => {
	                    this.accesses = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
                }
			},
			
			onAction(action) {
	            action = action.split(':');
	            
	            let params = null;
				let confirm = null;
	            
	            switch (action[0]) {
					case 'delete':
						params = {method: 'delete', contact_id: this.checkedRows};
						confirm = this.$gettext('Вы уверены что хотите удалить эти контакты? Вы не сможете их вернуть!')
						break;
	            }
	            
	            let process = () => {
					this.$api.post('sales/contacts/action', params, this).then((data) => {
	                   	if (data.result == 'success') {
		                   	this.checkedRows = [];
						}
					}); 
				}
				
				if (confirm) {
					this.$confirm(confirm, 'is-danger').then(process);
				} else {
					process();
				}
            },
			
			onDropdown(name) {
				switch(name) {
					case 'export':
						this.$modal('vue-sales-contacts-export-form', {filter: _.clone(this.filter)}, this);
						break;
				}
			},
			
			onPageChange(page) {
                this.page = page;
                this.fetchData(true)
            },
            
            onFilter() {
	            this.clearPages();
	            this.fetchData(true);
            }
		}, template: `
	<div>
		<vue-component-filterbox v-if="isAllow" @action="onAction" @dropdown="onDropdown" @filter="onFilter" v-model="filter" :selected="checkedRows" :is-visible="fields.length" :disabled="isFetching" :with-dropdown="true">
			<template slot="dropdown">
				<b-dropdown-item value="export"><i class="fal fa-download has-text-centered has-mr-1"></i> {{'Скачать контакты в формате CSV'|gettext}}</b-dropdown-item>
			</template>
			<template slot="actions">
	            <b-dropdown-item value="delete" class="has-text-danger"><i class="fa fa-trash-alt"></i> {{'Удалить'|gettext}}</b-dropdown-item>
			</template>
		</vue-component-filterbox>
		
		<div class="container has-mb-3" :class="{'has-mt-3': !isAllow}">
		<b-table paginated backend-pagination backend-sorting backend-sorting pagination-simple :data="fields" :loading="isFetching" :current-page="page" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" @sort="onSort" default-sort-direction="desc" bordered>
			
			<b-table-column v-for="(column, index) in table_columns" :field="column.field" :label="column.label|gettext" :visible="column.visible" :numeric="column.numeric && index" :key="index" :sortable="column.sortable" :width="column.width" v-slot="props">
				
				<template v-slot:header="{ column }" v-if="!index">
					<b-checkbox @click.native.stop="onCheckAll($event, checkedRows)" v-if="!index && fields.length"></b-checkbox> {{ column.label }}
				</template>

				<div :class="column.classname">
					<b-checkbox @click.native.stop v-if="index == 0" :disabled="isReadonly || props.row.used > 0" :native-value="props.row.contact_id" v-model="checkedRows"></b-checkbox>
	
					<span v-if="column.field == 'name'">
						<span v-if="props.row.name">{{props.row.name}}</span><span class="has-text-grey-light" v-else>{{'Без имени'|gettext}}</span>
					</span>
					
					<span v-if="column.field == 'email'">
						{{ props.row.email }}
					</span>
					
					<span v-if="column.field == 'phone'">
						<span v-if="props.row.phone">+{{ props.row.phone }}</span>
					</span>
				</div>
			</b-table-column>
			
<!--
			<b-table-column field="name" :label="'Имя'|gettext" sortable v-slot="props"><span v-if="props.row.name">{{props.row.name}}</span><span class="has-text-grey-light" v-else>{{'Без имени'|gettext}}</span></b-table-column>
			<b-table-column field="email" label="Email" class='has-width-30' sortable v-slot="props">{{ props.row.email }}</b-table-column>
			<b-table-column field="phone" :label="'Телефон'|gettext" class='has-width-30' sortable v-slot="props"><span v-if="props.row.phone">+{{ props.row.phone }}</span></b-table-column>
-->
			
			<template slot="empty">
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
					<h3 class="has-p-2 has-text-grey-light has-text-centered has-mb-2"><i class="fal fa-address-card has-text-grey-light" style="font-size: 5rem"></i></h3>

<!--                     <p><b-icon icon="frown" size="is-large"></b-icon></p> -->
                    <p>{{'Пока ничего нет'|gettext}}</p>
                </section>
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
	                <p>{{'Загрузка данных'|gettext}}</p>
                </section>
            </template>
            	        
            <template slot="bottom-left">
                <div class="has-text-centered-mobile has-text-grey" v-if="amount">{{'Всего контактов'|gettext}}: {{ amount|number }}</div>
            </template>
            	        
		</b-table>	
		</div>
		
	</div>
`});

window.$app.defineComponent("sales", "vue-sales-leads-columns-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				columns: [],
				sort: [],
				titles: [],
			}
		},

		created() {
			this.fetchData(true);
		},

		mixins: [FormModel],
		
		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('sales/leads/columns/get').then((data) => {
					this.isFetching = false;
					this.columns = data.response.columns.columns;
					this.sort = data.response.columns.sort;
					this.titles = data.response.columns.titles;
				});
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('sales/leads/columns/set', {columns: this.columns, sort: this.sort}, this).then((data) => {
					if (data.result == 'success') {
						this.$parent.close()
					}
					this.isUpdating = false;
				}).catch(() => {
					this.isUpdating = false;
				})
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Настройки таблицы'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">

			<sortable-list class="form-fields-item-list" lockAxis="y" v-model="sort" use-drag-handle>
				<sortable-item v-for="(column, index) in sort" class="form-fields-item" :index="index" :key="index" :item="column">
					<div class="form-fields-item-title">
						<div v-sortable-handle class="form-fields-item-handle"></div>
						<span><label class="checkbox"><input type="checkbox" name='columns[]' :value="column" v-model="columns"> {{ titles[column]|gettext }}</label></span>
					</div>
				</sortable-item>
			</sortable-list>
		
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Отмена'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("sales", "vue-sales-leads-export-form", {data() {
			return {
				isUpdating: false,
				isRefreshing: false,
				isFetching: false,
				amount: 0,
				charset: 'utf-8',
				extra: {products: false, order_links: false},
				variants: {}
			}
		},

		created() {
			this.fetchData(true);
		},
		
		props: ['filter'],
		
		computed: {
			downloadUrl() {
				return '/api/sales/leads/export/download.json?qs='+encodeURIComponent(JSON.stringify({filter: this.filter, extra: this.extra, charset: this.charset}));
			}
			,
			ser() {
				return ;
			}
		},

		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isRefreshing =  this.isFetching = withLoading;
				
				this.$api.post('sales/leads/export/info', {filter: this.filter, charset: this.charset}).then((data) => {
					this.isFetching = this.isRefreshing = false;
					this.variants = data.response.export.info.variants;
					this.amount = data.response.export.info.amount;
				});
			},
			
			onChanged() {
				this.isRefreshing = true;
				this.$api.post('sales/leads/export/calc', {filter: this.filter, charset: this.charset}).then((data) => {
					this.isRefreshing = false;
					this.amount = data.response.export.calc;
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Экспорт заявок'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			
			<div class="message is-success">
				<div class="message-body">
				{{'Всего заявок'|gettext}}: {{ amount|number }}
				<a :href="downloadUrl" target="frame" class="button is-small is-success is-pulled-right no-ajax" :class="{'is-loading': isRefreshing}"><span class="is-hidden-mobile">{{'Скачать CSV-файл'|gettext}}</span><span class="is-hidden-tablet">{{'Скачать'|gettext}}</span></a>
				</div>
			</div>
			
<!--
			<b-field :label="'Статусы'|gettext">
				<b-select v-model="filter.status_id" expanded @input="onChanged">
					<option value="">-- {{'Все статусы'|gettext}} --</option>
					<option v-for="(v, k) in variants.status_id" :value="k">{{ v }}</option>
				</b-select>
			</b-field>

			<b-field :label="'Страницы'|gettext">
				<b-select v-model="filter.page_id" expanded @input="onChanged">
					<option value="">-- {{'Все страницы'|gettext}} --</option>
					<option value="products" v-if="$auth.hasFeature('products')">-- {{'Товары'|gettext}} --</option>
					<option v-for="(v, k) in variants.page_id" :value="k">{{ v }}</option>
				</b-select>
			</b-field>
-->

			<b-field :label="'Кодировка'|gettext" v-if="i18n.locale == 'ru'">
				<b-select v-model="charset" expanded>
					<option v-for="(v, k) in variants.charset" :value="k">{{ v }}</option>
				</b-select>
			</b-field>
			
			<div class="field">
				<label class="label">{{'Дополнительные опции'|gettext}}</label>
				<div class="control"><b-checkbox v-model="extra.products" v-if="$auth.hasFeature('products')">{{'Экспортировать товары'}}</b-checkbox></div>
				<div class="control"><b-checkbox v-model="extra.order_links">{{'Ссылка на оплату'|gettext}}</b-checkbox></div>
			</div>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("sales", "vue-sales-leads-form", {data() {
			return {
				isReadonly: false,
				isStatusChanging: false,
				isUpdating: false,
				isFetching: false,
				isPayFormOpened: false,
				isPreauthProccessing: false,
				payment_method: null,
				localtimeTimer: null,
				localtimeOffset: 0,
				payment_receipt: false,
				values: {status_id: null},
				variants: {lead_status_id: [], order_status_id: []},
				info: [],
				contacts_busy: [],
				activeTab: 'main',
				discounts: [],
				shipping: null
			}
		},
		
		mixins: [FormModel],

		created() {
			this.$io.on('events:leads.list:refresh', this.refreshLead);
			this.isReadonly = !this.$auth.isAllowEndpoint('sales/leads/action');
			this.fetchData(true);
		},
		
		destroyed() {
			this.$io.off('events:leads.list:refresh', this.refreshLead);
			if (this.localtimeTimer) clearInterval(this.localtimeTimer);
		},
		
		computed: {
			offers() {
				let o = this.values.order;
				let result = _.clone(o.offers);
				let offersTotal = _.sumBy(o.offers, (v) => { return v.budget?v.budget:(v.price * v.amount); })
				let isMoneyDiscount = offersTotal != (o.budget - o.shipping_price);
				
				if (o.shipping_fields) {
					// Если цена не поменялась, а дисконт_id есть - значит бесплатная доставка
					this.shipping = {title: this.$gettext('Доставка'), offer_options: (o.discount_id && !isMoneyDiscount)?[this.$gettext('Промокод')+': '+o.promocode]:[], budget: o.shipping_price};
				}
								
/*
				if (isMoneyDiscount) {
					this.discounts = _.map(o.discounts, (v) => {
						return {title: this.$gettext((v.discount_type == 'promocode')?'Промокод':'Акция'), subtitle: (v.discount_type == 'promocode')?v.promocode:v.title};
					});
					
					
// 					result.push({style: 'background:#fffdf5', title: this.$gettext((o.discount_type == 'promocode')?'Промокод':'Акция'), offer_options: [(o.discount_type == 'promocode')?o.promocode:o.discount_title]});
					//, budget: o.budget - offersTotal - (o.shipping_price?o.shipping_price:0), currency_code: o.currency_code
				}
*/
				
				return result;
			},
			
			linkPay() {
				return (this.$account.custom_domain_verified?((this.$account.custom_domain_secured?'https://':'http://')+this.$account.custom_domain):'https://taplink.cc')+'/payments/'+this.values.order.order_id.toString(16)+'/';
			},
			
			isAllowViewProduct() {
				return (16 & this.$account.access) == 16;
			}
		},
		
		props: ['lead_id'],

		methods: {
			eventClass(status) {
				switch (status) {
					case 'success':
						return 'has-text-success';
					case 'fail':
						return 'has-text-danger';
					default:
						return 'has-text-warning';
				}
			},

			refreshLead(data) {
				if (data.lead_ids.indexOf(this.lead_id) != -1) this.fetchData(false);
			},
			
			acceptPayment() {
				this.authProcess(this.$gettext('Подтвердить оплату?'), 'is-warning', 'accept_payment');
			},
			
			cancelPayment() {
				this.authProcess(this.$gettext('Отменить оплату?'), 'is-danger', 'cancel_payment')
			},
			
			authProcess(message, type, method) {
				this.$confirm(message, type).then(() => {
					this.isPreauthProccessing = true;
	                this.$api.post('sales/leads/action', {method: method, lead_id: this.lead_id}, this).then((data) => {
						setTimeout(() => { this.isPreauthProccessing = false; }, 3000);
	                })
				});
			},
			
			urlPicture(item) {
				return item.picture?('background-image: url(//'+this.$account.storage_domain+'/p/'+item.picture+')'):null;
			},
			
			fillValues(values) {
				this.values = values;
				if (this.values.payments_methods) this.values.payments_methods = this.values.payments_methods.join(', ');
				
				this.discounts = _.map((this.values.order == undefined)?[]:this.values.order.discounts, (v) => {
					return {title: this.$gettext((v.discount_type == 'promocode')?'Промокод':'Акция'), subtitle: (v.discount_type == 'promocode')?v.promocode:v.title};
				});
				
/*
				if (this.values.events != undefined) {
					this.values.events = _.map(this.values.events, (v) => {
						try {
							v.response = JSON.parse(v.response);
						} catch(e) { }
						
						return v;
					});
					
					console.log(this.values.events);
				}
*/
				
				if (this.values.ip) this.resolvePlace();
			},
			
			fetchData(withFetching) {
				this.isFetching = withFetching;
				this.$api.get('sales/leads/get', {lead_id: this.lead_id}).then((data) => {
					if (data.result == 'success') {
						this.variants = data.response.lead.variants;
						this.info = data.response.lead.info;
						this.contacts_busy = data.response.lead.contacts_busy;
						
	
						this.fillValues(data.response.lead.values);
						this.isFetching = false;
					} else {
						this.$parent.close();
					}
				});

			},
			
			setTimeoutLocaltime() {
				if (this.localtimeTimer) clearInterval(this.localtimeTimer);
				var tick = () => {
					var d = new Date();
					var utc = d.getTimezoneOffset();
					var t = d.getTime();
					
					d.setTime(t - (-utc - this.localtimeOffset) * 60 * 1000);
					
					this.$set(this.values, 'ip_time', d);
				}

				tick();
				this.localtimeTimer = setInterval(tick, 1000);
			},
			
			openPage() {
				this.$router.replace({name: 'pages', params: {page_id: this.values.page_id}});
				this.$parent.close();
			},
			
			resolvePlace() {
				window.resolveip = (v) => {
					var place = [];
					if (v.city)  {
						place.push(v.city);
						if (v.region && (v.region != v.city)) place.push(v.region);					
						if (v.country_name) place.push(v.country_name);

	 					this.values.ip_country_code_classname = 'iti__flag iti__flag-box iti__'+v.country.toLowerCase();
	 					this.$set(this.values, 'ip_place', place.join(', '));
	 					
	 					if (v.utc_offset)  {
							let hours = parseInt(v.utc_offset.substr(0, v.utc_offset.length - 2));
							let minutes = parseInt(v.utc_offset.substr(v.utc_offset.length - 2, 2));
							this.localtimeOffset = (hours*60) + minutes*((hours < 0)?-1:1);
		 					this.setTimeoutLocaltime();
		 				}
 					}
				};
				
				$mx.getScript('//ipapi.co/'+this.values.ip+'/jsonp/?callback=resolveip');
			},
			
			updateContact(f, k) {
				this.$confirm(this.$gettext('Перенести поле в контакты клиента?')).then(() => {
					f.loading = true;
					this.$api.post('sales/leads/action', {method: 'update_contact', lead_id: this.lead_id, type: f.type, contact_id: this.values.contact_id, value: f.value}).then((data) => {
						let names = {3: 'name', 6: 'email', 7: 'phone'};
						if (names[f.type] != undefined) this.$set(this.values, names[f.type], f.value);
						this.values.records.splice(k, 1);
					}).catch(() => {
						f.loading = false;
					})
				});
			},
			
			paid() {
				this.$confirm(this.$gettext('Клиент оплатил заказ?'), 'is-warning').then(() => {
                    this.$api.post('sales/leads/action', {method: 'paid', lead_id: this.lead_id, payment_method: this.payment_method, payment_receipt: this.payment_receipt}, this).then((data) => {
	                   	if (data.result == 'success') {
		                   	this.isPayFormOpened = false;
		                   	this.fillValues(data.response.lead.values);
						}
					});
				});
			},
			
			refund(receipt) {
				this.$confirm(receipt?'Для того, чтобы отменить операцию вам необходимо сделать возврат денежных средств клиенту. После нажатия кнопки "Ок" данные о возврате уйдут в ФНС. Вы уже сделали возврат?':this.$gettext('Аннулировать оплату?'), 'is-warning').then(() => {
                    this.$api.post('sales/leads/action', {method: 'refund', lead_id: this.lead_id}, this).then((data) => {
	                   	if (data.result == 'success') {
		                   	this.isPayFormOpened = false;
		                   	this.fillValues(data.response.lead.values);
						}
					});
				});
			},
			
			deleteLead() {
				this.$confirm(this.$gettext('Вы уверены что хотите удалить эту заявку? Вы не сможете её вернуть!'), 'is-danger').then(() => {
                    this.$api.post('sales/leads/delete', {lead_id: this.lead_id}, this).then((data) => {
	                   	if (data.result == 'success') {
		                   	this.$parent.close();
						}
					});
				});
			},
			
			onStatusChanged(val) {
				this.$api.post('sales/leads/action', {method: 'change_status', lead_id: this.lead_id, status_id: val.target.value}).then((data) => {
					this.isStatusChanging = false;
				}).catch(() => {
					this.isStatusChanging = false;
				})
			},
			
			prepareRecord(r) {
				switch (parseInt(r.type)) {
					case 13:
						return this.$date(r.value);
						break;
					default:
						return r.value;
				}
			},

			openProductForm(product_id) {
				this.$modal('vue-products-form', {product_id: product_id}, this);
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Заявка'|gettext}} №{{ values.lead_number }}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<ul class="nav nav-tabs has-text-left">
			<li :class="{active: activeTab == 'main'}"><a href="#" @click="activeTab = 'main'">{{'Информация'|gettext}}</a></li>
			<li :class="{active: activeTab == 'products'}" v-if="values.order && values.order.offers"><a href="#" @click="activeTab = 'products'">{{'Товары'|gettext}}</a></li>
			<li :class="{active: activeTab == 'receipts'}" v-if="values.order && values.order.receipts"><a href="#" @click="activeTab = 'receipts'">{{'Чеки'|gettext}}</a></li>
			<li :class="{active: activeTab == 'utm'}" v-if="values.utm_source || values.utm_medium || values.utm_campaign || values.utm_term || values.utm_content"><a href="#" @click="activeTab = 'utm'">{{'UTM-метки'|gettext}}</a></li>
			<li :class="{active: activeTab == 'events'}" v-if="$auth.hasFeature('lead_events')"><a @click="activeTab = 'events'">{{'События'|gettext}}</a></li>
		</ul>
		<section class="modal-card-body modal-card-body-blocks" v-show="activeTab == 'main'">
		<section>
			<div class="field">
			<div class="row">
				<div class="col-xs-5">{{'Страница'|gettext}}:</div>
				<div class="col-xs-7"><a @click="openPage" v-if="values.page_id">{{ values.page_title }}</a><span v-else>{{values.page_title}}</span></div>
			</div>
			</div>
			
			<div class="field">
			<div class="row">
				<div class="col-xs-5">{{'Место'|gettext}}:</div>
				<div class="col-xs-7"><div v-if="values.ip_place"><em :class="values.ip_country_code_classname" style="display:inline-block"></em>&nbsp; {{ values.ip_place }}</div><div v-else>{{ values.ip }}</div></div>
			</div>
			</div>
			
			<div class="field">
			<div class="row">
				<div class="col-xs-5">{{'Время места'|gettext}}:</div>
				<div class="col-xs-7"><div v-if="values.ip_time">{{ values.ip_time|datetime }}</div><div class="has-text-grey-light" v-else>—</div></div>
			</div>
			</div>
			
			<div class="row">
				<div class="col-xs-5">{{'Дата заявки'|gettext}}:</div>
				<div class="col-xs-7">{{values.tms_created|datetime}}</div>
			</div>
		</section>
		<section>
			<div class="row">
				<div class="col-xs-5 form-control-static">{{'Статус'|gettext}}:</div>
				<div class="col-xs-7">
					<b-select v-model="values.status_id" @change.native="onStatusChanged" :disabled="isStatusChanging || isReadonly" expanded>
		                <option v-for="(v, k) in variants.lead_status_id" :value="k">{{ v }}</option>
		            </b-select>
				</div>
			</div>
		</section>
		
		<section v-if="values.order">
			<div class="field">
			<div class="row">
				<div class="col-xs-5">{{'Номер счёта'|gettext}}:</div>
				<div class="col-xs-7">{{ values.order.order_number }}</div>
			</div>	
			</div>
			
			<div class="field">
			<div class="row">
				<div class="col-xs-5">{{'Номер операции'|gettext}}:</div>
				<div class="col-xs-7">{{ values.order.order_id }}</div>
			</div>	
			</div>			

			<div class="field">
			<div class="row">
				<div class="col-xs-5">{{'Бюджет'|gettext}}:</div>
				<div class="col-xs-7">{{ values.order.budget|currency(values.order.currency_title) }}</div>
			</div>	
			</div>

			<div class="field">
			<div class="row">
				<div class="col-xs-5">{{'Оплата'|gettext}}:</div>
				<div class="col-xs-7">
					
					<div class='level'>
						<div class="level-left">
							<div class="is-block-mobile has-text-centered level-item" :class="{'has-text-success': values.order.order_status_id == 2, 'has-text-warning': values.order.order_status_id == 6, 'has-text-danger': values.order.order_status_id == 1 || values.order.order_status_id == 3}"><div v-if="values.order.order_status_id == 2">{{ values.payments_methods }}</div><div v-else>{{ variants.order_status_id[values.order.order_status_id] }}</div></div>
						</div>
						
						<div class="level-right" v-if="!isReadonly">
							<button v-if="values.order.order_status_id == 6" class="level-item button is-small is-primary is-fullwidth-mobile" type='button' @click="acceptPayment" :disabled="isPreauthProccessing">{{'Подтвердить'|gettext}}</button>
							<button v-if="values.order.order_status_id == 6" class="level-item button is-small is-danger is-fullwidth-mobile" type='button' @click="cancelPayment" :disabled="isPreauthProccessing">{{'Отменить'|gettext}}</button>


							<button v-if="values.order.order_status_id == 1" class="level-item button is-small is-primary is-fullwidth-mobile" type='button' v-show="!isPayFormOpened" @click="isPayFormOpened = true">{{'Провести оплату'|gettext}}</button>
							<button v-else-if="values.order.order_status_id == 2" @click="refund(values.order.receipt)" class="level-item button is-small is-danger is-fullwidth-mobile" type='button'>{{'Отменить оплату'|gettext}}</button>
						</div>
					</div>
					
				</div>
			</div>
			
			<div class="row">
				<div class="col-xs-12 col-sm-8 col-sm-offset-4">
				<div v-if="isPayFormOpened" class="has-mt-2">
					<div class="message is-primary">
						<div class="message-body">
							<b-field :label="'Выберите метод оплаты'|gettext" :type="{'is-danger': errors.payment_method}" :message='errors.payment_method'>
								<b-select :placeholder="'-- Не выбрано --'|gettext" v-model="payment_method" expanded>
									<option v-for="(v, k) in variants.payments_methods" :value="k">{{ v }}</option>
								</b-select>
							</b-field>
							
							<div class="field" v-if="info.has_onlinekassa">
								<b-checkbox v-model="payment_receipt">Зарегистрировать чек в ФНС</b-checkbox>
							</div>
							
							<button @click="paid" class="button is-primary is-fullwidth-mobile" type='button'>{{'Клиент оплатил'|gettext}}</button>
							<a class="button is-text is-fullwidth-mobile" @click="isPayFormOpened = false">{{'Отмена'|gettext}}</a>
						</div>
					</div>
				</div>
				</div>
			</div>
			</div>
			
			<div class="field">
			<div class="row">
				<div class="col-xs-5">{{'Ссылка на оплату'|gettext}}:</div>
				<div class="col-xs-7"><a :href='linkPay' target="_blank">{{'Открыть'|gettext}}</a></div>
			</div>	
			</div>

			<div class="field">
			<div class="row">
				<div class="col-xs-5">{{'Метод оплаты'|gettext}}:</div>
				<div class="col-xs-7">
					<div v-if="values.order.payment_method_title">{{ values.order.payment_method_title}}<span v-if="values.order.payment_provider_title">, {{ values.order.payment_provider_title}}</span></div><div class="has-text-grey-light" v-else>—</div>
				</div>
			</div>	
			</div>
			

			<div class="field">
			<div class="row">
				<div class="col-xs-5">{{'Назначение платежа'|gettext}}:</div>
				<div class="col-xs-7"><div v-if="values.order.purpose">{{ values.order.purpose }}</div><div class="has-text-grey-light" v-else>—</div></div>
			</div>	
			</div>
		</section>
		
		<section>
			<div class="section-title"><span>{{'Контакты'|gettext}}</span></div>
			<div class="field">
			<div class="row">
				<div class="col-xs-5">{{'Имя'|gettext}}:</div>
				<div class="col-xs-7"><span v-if="values.name">{{ values.name }}</span><span class="has-text-grey-light" v-else>—</span></div>
			</div>
			</div>
			<div class="field">
			<div class="row">
				<div class="col-xs-5">{{'Email'|gettext}}:</div>
				<div class="col-xs-7"><a :href='values.email|sprintf("mailto:%s")' target="_blank" v-if="values.email">{{ values.email }}</a><span class="has-text-grey-light" v-else>{{'Нет'|gettext}}</span></div>
			</div>
			</div>
			<div class="row">
				<div class="col-xs-5">{{'Телефон'|gettext}}:</div>
				<div class="col-xs-7">
					<tippy trigger="click" theme='light' interactive v-if="values.phone" style="display:inline-block">
					<template v-slot:trigger>
						<a href='#'>+{{values.phone}}</a>
					</template>
					<a :href='values.phone|sprintf("tel:+%s")' class="tooltip-menu">{{ 'Позвонить'|gettext }}</a>
					<a :href='values.phone|sprintf("https://api.whatsapp.com/send?phone=%s")' class="tooltip-menu" target="_blank">Whatsapp</a>
					<a :href='values.phone|sprintf("viber://chat?number=%s")' class="tooltip-menu">Viber</a>
					</tippy>
					<span class="has-text-grey-light" v-else>{{'Нет'|gettext}}</span>
				</div>
			</div>
		</section>
		
		<section v-if="values.records && values.records.length">
			<div class="section-title"><span>{{'Поля формы'|gettext}}</span></div>
			<div class="field" v-for="(f, k) in values.records"><!-- v-if="f.value || (f.type == 10)" -->
			<div class="row">
				<div class="col-xs-5">{{ f.title }}:</div>
				<div class="col-xs-7">
<!-- 					:disabled="contacts_busy[f.type].indexOf(f.value)" -->
					<button v-if="((f.type == 3) || (f.type == 6) || (f.type == 7)) && !isReadonly" class="button is-small is-default is-pulled-right" :class="{'is-loading': f.loading}"  type='button' @click="updateContact(f, k)">{{'В контакты'|gettext}}</button>
					
					
					<a v-if="f.type == 6" :href='f.value|sprintf("mailto:%s")' target="_blank">{{ f.value }}</a>
					<a v-if="f.type == 7" :href='f.value|sprintf("tel:+%s")' target="_blank">+{{ f.value }}</a>
					<div v-if="f.type == 10">
						<div v-if="f.value">{{'Да'|gettext}}</div><div v-else>{{'Нет'|gettext}}</div>
					</div>

 					<div v-if="(f.type != 6) && (f.type != 7) && (f.type != 10)">{{ prepareRecord(f) }}</div>
				</div>
			</div>
			</div>
		</section>
		
		</section>
		<section class="modal-card-body modal-card-body-blocks" v-show="activeTab == 'products'" v-if="values.order && values.order.offers">
			
			<section>
				
				<b-table :data="offers">
					<b-table-column field="title" label="Товар" v-slot="props">
					<div class="lead-form-products-picture is-hidden-mobile" v-if="props.row.offer_id">
						<a @click="openProductForm(props.row.product_id)" v-if="isAllowViewProduct" class="product-container" :style="urlPicture(props.row)"></a>
						<div class="product-container" v-else :style="urlPicture(props.row)"></div>
					</div>
						{{ props.row.title }}
						<div v-if="props.row.offer_options" class="has-text-grey">{{ props.row.offer_options|join(', ') }}</div>
					</b-table-column>
					<b-table-column field="amount" label="Количество" numeric v-slot="props">{{ props.row.amount }}</b-table-column>
					<b-table-column field="budget" label="Сумма" numeric v-slot="props">
						<span v-if="props.row.budget">{{props.row.budget|currency(values.order.currency_title)}}</span>
						<span v-else>
							<span v-if="props.row.price_discount"><div style="text-decoration:line-through;color: #aaa">{{ props.row.price * props.row.amount |currency(values.order.currency_title) }}</div>{{ props.row.price_discount * props.row.amount |currency(values.order.currency_title) }}</span>
							<span v-else>{{ props.row.price * props.row.amount |currency(values.order.currency_title) }}</span>
						</span>
					</b-table-column>
				</b-table>
				

				<mx-item class="has-mt-2" v-if="shipping">
					<div class="item-row row">
						<div class="col-xs">
							<div class="text-bold">{{'Доставка'|gettext}}</div>
							<div v-if="shipping.offer_options" class="has-text-grey">{{ shipping.offer_options|join(', ') }}</div>
						</div>
						<div class="col-sm-3 col-xs-6 text-bold has-text-right">{{ shipping.budget|currency(values.order.currency_title) }}</div>
					</div>
				</mx-item>
<!-- 				style='background:#fffdf5;padding: .5rem;border: 1px solid #f0f0f0;' -->
				<mx-item class="has-mt-2 message is-warning has-p-1" v-for="discount in discounts">
					<b>{{discount.title}}</b><div class="has-text-grey">{{discount.subtitle}}</div>
				</mx-item>
				
				<mx-item class="has-mt-2">
					<div class="item-row row text-bold">
						<div class="col-xs text-xs-bold">{{'Итого'|gettext}}</div>
						<div class="col-sm-3 col-xs-6 has-text-right">{{ values.order.budget|currency(values.order.currency_title) }}</div>
					</div>
				</mx-item>
			</section>
			
			<section v-if="values.order && values.order.shipping_fields">
				<h4 class="media-heading has-mb-2 has-text-grey-light">{{'Данные доставки'|gettext}}</h4>
				<div class="field" v-for="f in values.order.shipping_fields" >
					<div class="row">
						<div class="col-xs-5">{{ f.title }}</div>
						<div class="col-xs-7">{{ f.value }}</div>
					</div>
				</div>
				
				<div class="field" v-if="values.order.shipping_weight">
					<div class="row">
						<div class="col-xs-5">{{'Общий вес'|gettext}}</div>
						<div class="col-xs-7">{{values.order.shipping_weight|weight(true)}}</div>
					</div>
				</div>
			</section>
			
		</section>
		<section class="modal-card-body modal-card-body-blocks" v-show="activeTab == 'receipts'" v-if="values.order && values.order.receipts">
			<section v-for="f in values.order.receipts">
				<h4 class="media-heading">
					<div class='has-text-success' v-if="f.type == 'sell'">Приход</div>
					<div class='has-text-danger' v-if="f.type == 'sell_refund'">Возврат прихода</div>
				</h4>
				<div>
					<span class='has-text-grey'>Дата создания:</span> <div class="is-pulled-right">{{ f.tms_created|datetime }}</div>
				</div>
				<div>
					<span class='has-text-grey'>Фискальный признак:</span> 
					<div class="is-pulled-right has-text-right">
						<div class="has-text-danger" v-if="f.error_id"><i class="fa fa-exclamation-triangle"></i> {{ f.error }}</div>
						<div v-else>
							<span v-if="f.fiscal_attribute">№{{ f.fiscal_attribute }}</span>
							<div class="has-text-warning" v-else><span v-if="f.uuid">Ожидается подтверждение ФНС</span><span v-else>Чек ожидает отправки</span></div>
						</div>
					</div>
				</div>
			</section>
		</section>
		<section class="modal-card-body" v-show="activeTab == 'utm'" v-if="values.utm_source || values.utm_medium || values.utm_campaign || values.utm_term">
			<div class="field">
			<div class="row">
				<div class="col-xs-5">UTM_SOURCE:</div>
				<div class="col-xs-7"><span v-if="values.utm_source">{{ values.utm_source }}</span><span class="has-text-grey-light" v-else>—</span></div>
			</div>
			</div>
			
			<div class="field">
			<div class="row">
				<div class="col-xs-5">UTM_MEDIUM:</div>
				<div class="col-xs-7"><span v-if="values.utm_medium">{{ values.utm_medium }}</span><span class="has-text-grey-light" v-else>—</span></div>
			</div>
			</div>
			
			<div class="field">
			<div class="row">
				<div class="col-xs-5">UTM_CAMPAIGN:</div>
				<div class="col-xs-7"><span v-if="values.utm_campaign">{{ values.utm_campaign }}</span><span class="has-text-grey-light" v-else>—</span></div>
			</div>
			</div>
			
			<div class="field">
			<div class="row">
				<div class="col-xs-5">UTM_TERM:</div>
				<div class="col-xs-7"><span v-if="values.utm_term">{{ values.utm_term }}</span><span class="has-text-grey-light" v-else>—</span></div>
			</div>
			</div>

			<div class="field">
			<div class="row">
				<div class="col-xs-5">UTM_CONTENT:</div>
				<div class="col-xs-7"><span v-if="values.utm_term">{{ values.utm_content }}</span><span class="has-text-grey-light" v-else>—</span></div>
			</div>
			</div>
		</section>
		
		<section class="modal-card-body" v-show="activeTab == 'events'">
			<b-table :data="values.events">
				<b-table-column field="addon" label="Addon" v-slot="props">
					{{ props.row.addon }}
				</b-table-column>
				<b-table-column field="status" label="Status" v-slot="props">
					<span :class="eventClass(props.row.status)" v-tippy :content="props.row.message" @click="$alert(props.row.response)">{{ props.row.status }}</span>
				</b-table-column>
			</b-table>

			
		</section>
		
		<footer class="modal-card-foot level">
			<div class="level-left">
				<button class="button has-text-danger level-item" @click="deleteLead" v-if="!isReadonly"><i class="fa fa-trash-alt"></i> {{'Удалить'|gettext}}</button>
			</div>
			
			<div class="level-right">
				<button class="button is-dark level-item" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("sales", "vue-sales-leads-list", {data() {
			return {
				isReadonly: false,
				isFetching: false,
				columns: false,
				columns_props: {
					lead_number: {label: 'Заявка',classname: 'has-text-nowrap', sortable: true, width:100},
					status_id: {label: 'Статус', sortable: true, classname: 'has-width-10'},
					name: {label: 'Имя', sortable: true, classname: 'has-width-15'},
					contacts: {label: 'Контакты'},
					utm: {label: 'UTM-метки', classname: 'has-width-15'},
					tms_created: {label: 'Дата заявки', sortable: true, classname: 'has-text-nowrap has-width-15'},
					tms_paid: {label: 'Дата оплаты', sortable: true, classname: 'has-text-nowrap has-width-15'},
					budget: {label: 'Бюджет',numeric: true, sortable: true, classname: 'has-text-nowrap has-width-15'},
					order_status: {label: 'Оплата',  sortable: true, classname: 'has-width-10 has-text-nowrap'},
					order_number: {label: 'Номер счета', numeric: true, sortable: true, classname: 'has-text-nowrap has-width-15'},
					payment_method: {label: 'Метод оплаты', classname: 'has-text-nowrap has-width-15'},
					payment_provider: {label: 'Платежная система', classname: 'has-text-nowrap has-width-15'},
					page: {label: 'Страница', classname: 'has-width-20'},
					records: {label: 'Поля'},
					purpose: {label: 'Назначение платежа'} 
				},
				filter: {status_id: '', page_id: '', query: '', price: {from: '', until: ''}, date_lead: {from: '', until: ''}, date_paid: {from: '', until: ''}},
				variants: {status_id: [], page_id: []},
				selected: null,
                sortField: 'lead_number',
                sortOrder: 'desc',
				perPage: 30,
				checkedRows: [],
				amount: 0,
				first_day_week: this.$getFirstDayWeek(),
				isAllow: this.$auth.isAllowTariff('business')
			}
		},
	
		computed: {
			table_columns() {
				if (!this.columns) return [];

				let result = _.map(this.columns, (v) => {
					let r = this.columns_props[v];
					r.visible = true;
					r.field = v;
					return r;
				});
				
				for (var i = 0; i < 14 - this.columns.length; i++) result.push({visible: false});
				result[0].numeric = false;
				result[0].classname += ' has-text-nowrap';
				return result;
			}
			
/*
			tariff() {
				return this.$account.tariff;
			}
*/
		},
		
		mixins: [ListModel],

		created() {
			this.isReadonly = !this.$auth.isAllowEndpoint('sales/leads/action');
			var m = document.location.hash.match(/lead([0-9]+)/);
			
			if (m) {
				this.clickRow({lead_id: m[1]});
				document.location.hash = '';
			}
			
			
			this.$io.on('events:leads.list:new', this.newLead);
			this.$io.on('events:leads.list:refresh', this.refreshLeads);
			this.$io.on('events:leads.list:delete', this.deleteLead);
			this.$io.on('events:leads.list:columns', this.refreshColumns);
			
			this.fetchData(true);
		},
		
		destroyed() {
			this.$io.off('events:leads.list:new', this.newLead);
			this.$io.off('events:leads.list:refresh', this.refreshLeads);
			this.$io.off('events:leads.list:delete', this.deleteLead);
			this.$io.off('events:leads.list:columns', this.refreshColumns);
		},

		methods: {
/*
			LightenDarkenColor(col, amt) {
			    var usePound = false;
			  
			    if (col[0] == "#") {
			        col = col.slice(1);
			        usePound = true;
			    }
			 
			    var num = parseInt(col,16);
			 
			    var r = (num >> 16) + amt;
			 
			    if (r > 255) r = 255;
			    else if  (r < 0) r = 0;
			 
			    var b = ((num >> 8) & 0x00FF) + amt;
			 
			    if (b > 255) b = 255;
			    else if  (b < 0) b = 0;
			 
			    var g = (num & 0x0000FF) + amt;
			 
			    if (g > 255) g = 255;
			    else if (g < 0) g = 0;
			 
			    return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
			},
*/

			
			onDropdown(name) {
				switch(name) {
					case 'columns':
						this.$modal('vue-sales-leads-columns-form', null, this);
						break;
					case 'export':
						this.$modal('vue-sales-leads-export-form', {filter: _.clone(this.filter)}, this);
						break;
				}
			},

			refreshLeads(data) {
				this.merge(this.fields, 'lead_id', data.lead_ids, (ids, merge) => {
					this.$api.post('sales/leads/list', {filter: {lead_ids: ids}}).then((data) => {
						this.fields = merge(data.response.leads.fields);
					});
				});
			},
			
			newLead(data) {
					this.clearPages();
					this.fetchData(false, true);
					
/*
					this.$api.get('sales/leads/list', {filter: {lead_ids: data.lead_ids}}).then((data) => {
						let r = data.response.leads.fields;
						for (let i = r.length-1; i >= 0; i--) this.fields.unshift(r[i]);
						if (this.perPage < this.fields.length) this.fields.splice(this.perPage, this.fields.length-this.perPage);
						this.clearPages();
					});
*/
			},
			
			prepareRecord(r) {
				switch (parseInt(r.type)) {
					case 13:
						return this.$date(r.value);
						break;
					default:
						return r.value;
				}
			},
			
			refreshColumns(data) {
				// Если новые колоники — подгружаем
				let is_updated = _.difference(data, this.columns).length;
				this.columns = data;
				if (is_updated) this.fetchData(false, true);
			},
			
			deleteLead(data) {
				let ids = this.checkIds(this.fields, 'lead_id', data.lead_ids);
				if (ids.length) {
					this.clearPages();
					this.fetchData(false, true);
				}
			},
			
			refreshStyles() {
				let s = [];
				let d = [];
				_.each(this.variants.status_id, (c, i) => {
					s.push('.tag:not(body).tag-status-'+i+' {background:'+c.color+'4d;color:#000}');
					d.push('.tag:not(body).tag-status-'+i+' {background:'+c.color+';color:#000}');
				});
				
				let styles = s.join("\n")+' @media (prefers-color-scheme: dark) {'+d.join("\n")+'}';
				StylesFactory.updateCSSBlock(styles, this.$refs.styles);					
			},
			
			fetchData(withLoading, force) {
				let resolve = (data) => {
					this.fields = data.fields
					this.amount = data.amount;
					
					if (!this.columns) {
						this.variants.status_id = data.info.status_id;
						this.variants.page_id = data.info.page_id;
						this.columns = data.info.columns;
						this.refreshStyles();
					}
				}
				
				if (force || !this.checkCache(resolve)) {
					this.isFetching = withLoading;
					this.$api.post(this.columns?'sales/leads/list':['sales/leads/list', 'sales/leads/info'], {next: this.next, count: this.perPage, columns: this.columns, sort_field: this.sortField, sort_order: this.sortOrder, filter: this.filter}).then((data) => {
						this.cachePage(data.response.leads, resolve);
						this.isFetching = false;
					}).catch((error) => {
	                    this.accesses = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
                }

			},

            onFilter() {
				this.clearPages();
	            this.fetchData(true);
            },
            
            onAction(action) {
	            action = action.split(':');
	            
	            let params = null;
				let confirm = null;
	            
	            switch (action[0]) {
					case 'status':
						params = {method: 'change_status', lead_id: this.checkedRows, status_id: action[1]};
						break;
					case 'delete':
						params = {method: 'delete', lead_id: this.checkedRows};
						confirm = this.$gettext('Вы уверены что хотите удалить эти заявки? Вы не сможете их вернуть!')
						break;
	            }
	            
	            let process = () => {
					this.$api.post('sales/leads/action', params, this).then((data) => {
	                   	if (data.result == 'success') {
		                   	this.checkedRows = [];
						}
					}); 
				}
				
				if (confirm) {
					this.$confirm(confirm, 'is-danger').then(process);
				} else {
					process();
				}
            },
            
            clickRow(row) {
	            this.$modal('vue-sales-leads-form', {lead_id: row.lead_id}, this);
            },
		}, template: `
	<div>
		<div ref='styles'></div>
		<vue-component-filterbox v-if="isAllow" @dropdown="onDropdown" @action="onAction" @filter="onFilter" :selected="checkedRows" :is-visible="fields.length" v-model="filter" :disabled="isFetching" :with-dropdown="true" :with-filters="true">
			<template slot="dropdown">
				<b-dropdown-item value="columns"><i class="fas fa-bars fa-rotate-90 has-text-centered has-mr-1"></i> {{'Настроить колонки таблицы'|gettext}}</b-dropdown-item>
				<b-dropdown-item value="export"><i class="fal fa-download has-text-centered has-mr-1"></i> {{'Скачать заявки в формате CSV'|gettext}}</b-dropdown-item>
			</template>
			<template slot="actions">
				<b-dropdown-item custom class="has-text-grey-light">
					{{'Смена статуса'|gettext}}
				</b-dropdown-item>
				<hr class="dropdown-divider">
				
				<b-dropdown-item v-for="(v, i) in variants.status_id" :value="i|sprintf('status:%s')"><i class="fas fa-circle" :style="{color: v.color}"></i> {{ v.status }}</b-dropdown-item>
				<hr class="dropdown-divider">
				
	            <b-dropdown-item value="delete" class="has-text-danger"><i class="fa fa-trash-alt"></i> {{'Удалить'|gettext}}</b-dropdown-item>
			</template>
			<template slot="filters">
				<div class="row">
				<div class="col-xs-12 col-sm-4 has-mb-2">
					<label class="label">{{'Статусы'|gettext}}</label>
					<b-select v-model="filter.status_id" expanded>
		                <option value="">-- {{'Все статусы'|gettext}} --</option>
		                <option v-for="(v, k) in variants.status_id" :value="k">{{ v.status }}</option>
		            </b-select>
				</div>
				
				<div class="col-xs-12 col-sm-4 has-mb-2">
					<label class="label">{{'Страницы'|gettext}}</label>
					<b-select v-model="filter.page_id" expanded>
		                <option value="">-- {{'Все страницы'|gettext}} --</option>
		                <option value="products" v-if="$auth.hasFeature('products')">-- {{'Товары'|gettext}} --</option>
		                <option v-for="(v, k) in variants.page_id" :value="k">{{ v }}</option>
		            </b-select>
				</div>
				
				<div class="col-xs-12 col-sm-4 has-mb-2">
					<label class="label">{{'Цена'|gettext}}</label>
					<div class="row row-small">
						<div class="col-xs"><number v-model="filter.price.from" class="input" :precision="$account.currency.precision" :placeholder="'От'|gettext"></number></div>
						<div class="col-xs col-shrink has-text-grey" style="line-height: 2.45em">-</div>
						<div class="col-xs"><number v-model="filter.price.until" class="input" :precision="$account.currency.precision" :placeholder="'До'|gettext"></number></div>
					</div>				
				</div>
				
				<div class="col-xs-12 col-sm-4 has-mb-2">
					<label class="label">{{'Дата заявки'|gettext}}</label>
					<div class="row row-small">
						<div class="col-xs"><vue-component-datepicker :placeholder="'От'|gettext" v-model="filter.date_lead.from"></vue-component-datepicker></div>
						<div class="col-xs col-shrink has-text-grey" style="line-height: 2.45em">-</div>
						<div class="col-xs"><vue-component-datepicker :placeholder="'До'|gettext" v-model="filter.date_lead.until"></vue-component-datepicker></div>
					</div>
				</div>
				
				<div class="col-xs-12 col-sm-4 has-mb-2">
					<label class="label">{{'Дата оплаты'|gettext}}</label>
					<div class="row row-small">
						<div class="col-xs"><vue-component-datepicker :placeholder="'От'|gettext" v-model="filter.date_paid.from"></vue-component-datepicker></div>
						<div class="col-xs col-shrink has-text-grey" style="line-height: 2.45em">-</div>
						<div class="col-xs"><vue-component-datepicker :placeholder="'До'|gettext" v-model="filter.date_paid.until"></vue-component-datepicker></div>
					</div>
				</div>
				
			</template>
		</vue-component-filterbox>

		<div class="container has-mb-3" :class="{'has-mt-3': !isAllow}">
		<b-table paginated backend-pagination pagination-simple backend-sorting :data="fields" :loading="isFetching" :current-page="page" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" @click="clickRow" @sort="onSort" hoverable bordered v-if="columns">
<!-- 		<b-table backend-pagination backend-sorting pagination-simple :data="fields" :loading="isFetching" :current-page="page" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" @click="clickRow" @sort="onSort"  bordered v-if="columns"> -->

			<b-table-column v-for="(column, index) in table_columns" :field="column.field" :label="column.label|gettext" :visible="column.visible" :numeric="column.numeric && index" :key="index" :sortable="column.sortable" :width="column.width" v-slot="props" :cell-class="column.classname">
<!-- 			<b-table-column v-for="(column, index) in table_columns" :field="column.field" :label="column.label|gettext" :visible="column.visible" :numeric="column.numeric && index" :key="index" :sortable="column.sortable" :width="column.width" v-slot="props"> -->
				<template v-slot:header="{ column }" v-if="!index">
					<b-checkbox @click.native.stop="onCheckAll($event, checkedRows)" v-if="!index && fields.length"></b-checkbox> {{ column.label }}
				</template>
				<b-checkbox @click.native.stop v-if="index == 0" :disabled="isReadonly" :native-value="props.row.lead_id" v-model="checkedRows"></b-checkbox>
				<span v-if="column.field == 'lead_number'"><span class="has-text-grey-light">№</span> {{ props.row.lead_number }}</span>

				<label :class="['tag', 'tag-status', 'tag-status-'+props.row.status_id]" v-if="column.field == 'status_id'">{{ variants.status_id[props.row.status_id].status }}</label>
				
				<div v-if="column.field == 'name'"> {{ props.row.name }} </div>
				<div v-if="column.field == 'contacts'"> {{ props.row.contacts }} </div>
				<div v-if="column.field == 'utm'"> {{ props.row.utm }} </div>
				<div v-if="column.field == 'tms_created'"> {{ props.row.tms_created|datetime }} </div>
				<div v-if="column.field == 'tms_paid'"> <span v-if="props.row.order_status_id == 2">{{ props.row.tms_paid|datetime }}</span> </div>
				<div v-if="column.field == 'budget'"> {{ props.row.budget|currency(props.row.currency_title) }} </div>
				<div v-if="column.field == 'order_status'"> <div v-if="props.row.receipt_error_id" class="is-pulled-right has-text-danger"><i class="fa fa-exclamation-triangle"></i></div><span v-if="props.row.order_number"><span :class="{'has-text-success': props.row.order_status_id == 2, 'tag tag-status is-warning': props.row.order_status_id == 6, 'has-text-danger': props.row.order_status_id != 2 && props.row.order_status_id != 6}">{{ props.row.order_status|gettext }}</span></span> </div>
				<div v-if="column.field == 'order_number'"> <span v-if="props.row.order_number"><span class="has-text-grey-light">№</span> {{ props.row.order_number }}</span> </div>
				<div v-if="column.field == 'page'"> {{ props.row.page }} </div>
				<div v-if="column.field == 'payment_method'"> {{ props.row.payment_method }} </div>
				<div v-if="column.field == 'payment_provider'"> {{ props.row.payment_provider }} </div>
				<div v-if="column.field == 'records'"> <div v-for="r in props.row.records">{{ r.title }}: {{ prepareRecord(r) }}</div> </div>
				<div v-if="column.field == 'purpose'"> {{ props.row.purpose }} </div>
			</b-table-column>


			<template slot="empty">
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
<!-- 					<i class="fal fa-credit-card-blank fa-2x"></i> -->
<!-- 					<div class="has-p-2 has-text-grey-light has-text-centered has-mb-4"><h3>{{'Заявки'|gettext}}</h3> -->
					<h3 class="has-p-2 has-text-grey-light has-text-centered has-mb-2"><i class="fal fa-money-check-alt has-text-grey-light" style="font-size: 5rem"></i></h3>

					<div class="has-mb-2">{{'Сюда вам будут приходить все заявки! Вы сможете их обрабатывать, менять статус.'|gettext}}<br>{{'Чтобы получать заявки добавьте форму на страницу.'|gettext}}</div>
					<div class="has-text-centered" v-if="!isAllow"><div class="tag is-danger" style="top: -2px;position: relative;">biz</div> <span class='has-text-danger'>{{'Доступно на business-тарифе'|gettext}}</span></div>

                </section>
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
	                <p>{{'Загрузка данных'|gettext}}</p>
                </section>
            </template>
            
            <template slot="bottom-left">
                <div class="has-text-centered-mobile has-text-grey" v-if="amount">{{'Всего заявок'|gettext}}: {{ amount|number }}</div>
            </template>
		</b-table>
		</div>
	</div>
`});
window.$app.defineModule("sales", [{ path: '/:page_id/sales/leads/', component: 'vue-sales-leads-list', meta: {title: 'Заявки'}, props: true, name: 'sales.leads'},
{ path: '/:page_id/sales/contacts/', component: 'vue-sales-contacts-list', meta: {title: 'Контакты'}, props: true, name: 'sales.contacts'}]);