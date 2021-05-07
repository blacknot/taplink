
window.$app.defineComponent("products", "vue-products-collections-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				isFetchingProduct: false,
				isReadonly: false,
				autocompleteProducts: [],
				query: '',
				selected: [],
				values: {collection: '', is_hidden: false, products: []}
			}
		},

		created() {
			this.isReadonly = !this.$auth.isAllowEndpoint('products/collections/set');
			if (this.collection_id) this.fetchData(true);
		},

		props: ['collection_id'],
		mixins: [FormModel],

		computed: {
			scrollContainer() {
				return this.$device.mobile?$mx('.main-block')[0]:(document.scrollingElement || document.documentElement);
			},
		},
		
		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('products/collections/get', {collection_id: this.collection_id}).then((data) => {
					this.isFetching = false;
					this.values = data.response.collection.values;
				});

			},
			
			asyncAutocompleteProduct: _.debounce(function() {
                if (this.query.trim() == '') {
	                this.autocompleteProducts = [];
	                return;
                }
                
                this.isFetchingProduct = true;
                this.$api.get('products/search', {query: this.query}).then((data) => {
	                this.autocompleteProducts = data.response.products.search;
	                this.isFetchingProduct = false;
				});
			}, 500),
			
			updateData() {
				this.isUpdating = true;
				this.onAddProduct();
				let values = _.clone(this.values);
				values.products = _.map(values.products, (v) => v.product_id);
				
				this.$api.post('products/collections/set', values, this).then((data) => {
					if (data.result == 'success') {
						this.$parent.close()
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			},
			
			deleteCollection() {
				this.$confirm(this.$gettext('Вы уверены что хотите удалить эту коллекцию? Вы не сможете её вернуть!'), 'is-danger').then(() => {
                    this.$api.post('products/collections/delete', {collection_id: this.collection_id}, this).then((data) => {
	                   	if (data.result == 'success') {
		                   	this.$parent.close();
						}
					});
				});				
			},
			
			onSelect(option) {
				this.selected = option;
			},
			
			onAddProduct() {
				if (this.selected && !_.isEmpty(this.selected) && _.findIndex(this.values.products, {product_id: this.selected.product_id}) == -1) {
					this.values.products.push(this.selected);
					this.query = '';
				}
			},
			
			onRemoveProduct(index) {
				this.values.products.splice(index, 1);
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Коллекция'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
			<section>
				<b-field :label="'Название'|gettext" :message="errors.collection" :class="{'has-error': errors.collection}">
	            	<b-input v-model="values.collection" :placeholder="'Укажите название коллекции'|gettext" :disabled="isReadonly"></b-input>
				</b-field>
				
				<div class="field">
		            <b-checkbox v-model="values.is_hidden" :disabled="isReadonly">{{'Скрыть коллекцию из навигации в каталоге'|gettext}}</b-checkbox>
		        </div>
			</section>	
			<section class="collection-products-container">
				<div class="row row-small has-mb-2">
					<div class="col-xs">
						<b-autocomplete v-model="query" :disabled="isReadonly" :data="autocompleteProducts" :placeholder="'Укажите товар чтобы добавить его в коллекцию'|gettext" field="product" :loading="isFetchingProduct" @input="asyncAutocompleteProduct" @select="onSelect">
					</div> 
					<div class="col-xs col-shrink">
						<button type="button" class="button is-success" @click="onAddProduct" :disabled="isReadonly">{{'Добавить'|gettext}}</button> 
					</div> 
				</div>
				
				<mx-item class="is-hidden-mobile mx-item-header" v-if="values.products.length">
					<div class="item-row row">
						<div class="col-sm">{{'Товар'|gettext}}</div>
					</div>
				</mx-item>
				
				<sortable-list class="collection-products-list" lockAxis="y" v-model="values.products" use-drag-handle :scrollContainer="$mx('.modal')[0]">
				<sortable-item v-for="(product, index) in values.products" class="form-fields-item is-narrow" :class="{disabled: isReadonly}" :index="index" :key="index" :item="product">
					<div class="form-fields-item-title">
						<div v-sortable-handle class="form-fields-item-handle"></div>
						<span class="row">
							<div class="col-xs" :class="{'has-text-grey-light': !product.is_visible || !product.is_active}"><p class="form-control-static"><i class="has-text-danger fas fa-lock has-mr-1" v-if="!product.is_visible || !product.is_active" style="opacity:.5"></i>{{ product.product }}</p></div>
							<div class="col-xs col-shrink"><button class="button has-text-danger is-text" :class="{disabled: isReadonly}" @click="onRemoveProduct(index)"><i class="fa fa-trash-alt"></i></button></div>
						</span>
					</div>
				</sortable-item>
				</sortable-list>
				
			</section>
		</section>
		<footer class="modal-card-foot level">
			<div class="level-left">
				<button class="button level-item" @click="deleteCollection" v-if="!isReadonly && collection_id"><i class="fa fa-trash-alt"></i> {{'Удалить'|gettext}}</button>
			</div>
			<div class="level-right">
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Отмена'|gettext}}</button>
				<button class="button is-primary" :class="{'is-loading': isUpdating, disabled: isReadonly}" @click="updateData">{{'Сохранить'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("products", "vue-products-collections-list", {data() {
			return {
				isFetching: false,
				isFiltering: false,
				isReadonly: false,
				filter: {query: ''},
                sortField: 'collection',
                sortOrder: 'asc',
				perPage: 20,
				columns: ['collection', 'amount'],
				isAllow: this.$auth.isAllowTariff('business')
			}
		},
		
		mixins: [ListModel],

		created() {
			this.isReadonly = !this.$auth.isAllowEndpoint('products/collections/set');

			this.$io.on('events:products.collections.list:refresh', this.refreshCollections);
			this.$io.on('events:products.collections.list:delete', this.deleteCollection);

			this.fetchData(true);
		},
		
		destroyed() {
			this.$io.off('events:products.collections.list:refresh', this.refreshCollections);
			this.$io.off('events:products.collections.list:delete', this.deleteCollection);
		},

		
		computed: {
			columns_props() {
				if (!this.columns) return [];
				
				let columns = {
					collection: {label: 'Название', sortable: true},
					amount: {label: '# Товаров', numeric: true, sortable: true, classname: 'has-text-nowrap has-width-15'},
				};
				
				let result = _.map(this.columns, (v) => {
					let r = columns[v];
					r.visible = true;
					r.field = v;
					return r;
				});
				
				for (var i = 0; i < 11 - this.columns.length; i++) result.push({visible: false});
				return result;
			}
		},

		methods: {
			refreshCollections(data) {
				if (data.product_ids != undefined) {
					this.merge(this.fields, 'collection_id', data.collection_ids, (ids, merge) => {
						this.$api.get('products/collections/list', {filter: {collection_ids: ids}}).then((data) => {
							this.fields = merge(data.response.collections.fields);
						});
					});
				} else {
	                this.clearPages();
					this.fetchData(false, true);
				}
			},
			
			deleteCollection(data) {
				let ids = this.checkIds(this.fields, 'collection_id', data.collection_ids);
				if (ids.length) {
					this.next = this.current;
					this.fetchData(false, true);
				}
			},
			
			fetchData(withLoading, force) {
				if (force || !this.checkCache()) {
					this.isFetching = withLoading;
					this.$api.get('products/collections/list', {next: this.next, count: this.perPage, sort_field: this.sortField, sort_order: this.sortOrder, filter: this.filter}).then((data) => {
						this.cachePage(data.response.collections);
						this.isFetching = false;
						this.isFiltering = false;
					}).catch((error) => {
	                    this.accesses = []
	                    this.total = 0
	                    this.isFetching = false
						this.isFiltering = false;
	                    throw error
	                })
                }

			},
			
			onPageChange(page) {
                this.page = page;
                this.fetchData(true)
            },
            
            onFilter() {
	            this.isFiltering = true;
				this.clearPages();
	            this.fetchData(true);
            },
            
			openForm(collection_id) {
				this.$modal('vue-products-collections-form', {collection_id: collection_id}, this);
			},

            clickRow(row) {
	            this.openForm(row.collection_id);
			}
		}, template: `
	<div>
		<vue-component-filterbox ref="filterbox" v-if="isAllow" @filter="onFilter" v-model="filter" :is-visible="fields.length" :disabled="isFetching" :with-buttons="true">
			<template slot="buttons">
				<button class="button" @click="openForm(null)" class="button is-primary is-fullwidth" :class="{disabled: isReadonly}"><i class='fa fa-plus'></i><span class='is-hidden-touch has-ml-1'>{{'Новая коллекция'|gettext}}</span></button>
			</template>
		</vue-component-filterbox>

		<div class="container has-mb-3" :class="{'has-mt-3': !isAllow}">
		<b-table paginated backend-pagination backend-sorting pagination-simple :data="fields" :loading="isFetching" :current-page="page" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" @click="clickRow" @sort="onSort" hoverable bordered>
			
			<b-table-column v-for="(column, index) in columns_props" :field="column.field" :label="column.label|gettext" :class="column.classname" :numeric="column.numeric" :key="index" :visible="column.visible" :sortable="column.sortable" :width="column.width" v-slot="props">
				<div :class="{'has-text-grey-light': props.row.is_hidden || !props.row.amount}">
					<div v-if="column.field == 'collection'"><div class="has-text-danger is-pulled-right" v-if="props.row.is_hidden"><i class="fas fa-lock" style="margin-left: 10px"></i></div> {{ props.row.collection }}</div>
					<div v-if="column.field == 'amount'">{{ props.row.amount|number }}</div>
				</div>
			</b-table-column>
			
			<template slot="empty">
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
	                <div v-if="isAllow && $refs.filterbox.hasFilter || filter.query">
	                    <i class="fal fa-search fa-5x has-text-grey-light"></i>
						<h3>{{'Ничего не найдено'|gettext}}</h3>
	                </div>
					<div v-else>
						<div class="row">
							<div class="col-xs-12 col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
		<!-- 					<h3>{{'Коллекции'|gettext}}</h3> -->
								<h3 class="has-p-2 has-text-grey-light has-text-centered has-mb-2"><i class="fal fa-tags has-text-grey-light" style="font-size: 5rem"></i></h3>
			 					<div class="has-mb-2">{{'Коллекции служат для объединения товаров в группы. Одна коллекция может включать любые товары, а один и то же товар может входить в разные коллекции.'|gettext}}</div>
			 					
			 					<button class="button" @click="openForm(null)" class="button is-primary" v-if="isAllow" :class="{disabled: isReadonly}"><i class='fa fa-plus'></i>{{'Новая коллекция'|gettext}}</button>
			 					<div class="has-text-centered" v-else><div class="tag is-danger" style="top: -1px;position: relative;">biz</div> <span class='has-text-danger'>{{'Доступно на business-тарифе'|gettext}}</span></div>
							</div>
						</div>	 					
 					</div>
                </section>
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
	                <p>{{'Загрузка данных'|gettext}}</p>
                </section>
            </template>
            	        
		</b-table>
		</div>
	</div>
`});

window.$app.defineComponent("products", "vue-products-columns-form", {data() {
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
				this.$api.get('products/columns/get').then((data) => {
					this.isFetching = false;
					this.columns = data.response.products.columns;
					this.sort = data.response.products.sort;
					this.titles = data.response.products.titles;
				});
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('products/columns/set', {columns: this.columns, sort: this.sort}, this).then((data) => {
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

window.$app.defineComponent("products", "vue-products-discounts-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				isReadonly: false,
				values: {discount_id: null, is_active: true, title: '', promocode: '', options: {profit: 'percentage', percentage: 0, apply_options: true, fixed: 0, apply: 'order', apply_collections: [], apply_products: [], rule: 'none', rule_purchase: 0, rule_quantity: 0, rule_combo: []}},
				variants: {
					profit: {percentage: this.$gettext('Процент'), fixed: this.$gettext('Фиксированная сумма'), free_shipping: this.$gettext('Бесплатная доставка')},
					apply: {order: this.$gettext('Всему заказу'), collections: this.$gettext('Товарам из определенных коллекций'), products: this.$gettext('Определенным товарам')},
					rule: {none: this.$gettext('Отсутствуют'), purchase: this.$gettext('Минимальная сумма покупки'), quantity: this.$gettext('Минимальное количество товаров')/* , combo: 'Набор товаров' */}
				},
				texts: {
					promocode: {
						title_new: this.$gettext('Новый промокод'),
						title_old: this.$gettext('Промокод'),
						active: this.$gettext('Активный промокод'),
						deleteMsg: this.$gettext('Вы уверены что хотите удалить этот промокод? Вы не сможете его вернуть!')
					},
					automatic: {
						title_new: this.$gettext('Новая акция'),
						title_old: this.$gettext('Акция'),
						active: this.$gettext('Активная акция'),
						deleteMsg: this.$gettext('Вы уверены что хотите удалить эту акцию? Вы не сможете его вернуть!')
					}
				}
			}
		},

		created() {
			this.isReadonly = !this.$auth.isAllowEndpoint('products/discounts/set');
			if (this.discount_id) this.fetchData(true);
		},

		props: ['type', 'discount_id'],
		mixins: [FormModel],

		methods: {
			onAction(v) {
				switch (v) {
					case 'delete':
						this.onDelete();
						break;
				}
			},
			onDelete() {
				this.$confirm(this.$gettext(this.texts[this.type].deleteMsg), 'is-danger').then(() => {
                    this.$api.get('products/discounts/delete', {discount_id: this.discount_id}, this).then((data) => {
						if (data.result == 'success') {
							this.$parent.close()
						}
					});
				});
			},

			promocodeFilter(e) {
				let charCode = (e.which) ? e.which : e.keyCode;
				var txt = String.fromCharCode(charCode).toUpperCase();
				if(!txt.match(/[A-ZА-Яa-zа-я0-9\-_]/)) e.preventDefault();
			},
			
			promocodeFilterAfter(e) {
				this.values.promocode = this.values.promocode.toUpperCase().replace(/[^A-ZА-Я0-9\-_ ]/g, '').trim().replace(/ /g, '_');
			},
						
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('products/discounts/get', {discount_id: this.discount_id}).then((data) => {
					this.isFetching = false;
					this.values = data.response.discounts.values;
				});
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('products/discounts/set', Object.assign(this.values, {type: this.type}), this).then((data) => {
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
			<p class="modal-card-title" v-if="values.discount_id">{{texts[type].title_old|gettext}}</p>
			<p class="modal-card-title" v-else>{{texts[type].title_new|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
			<section>
				<b-field :label="'Промокод'|gettext" :message="errors.promocode" maxlength="16" class="has-mb-1" :class="{'has-error': errors.promocode}" v-if="type == 'promocode'">
	            	<input class="input" v-model="values.promocode" @keypress="promocodeFilter" @change="promocodeFilterAfter" @keyup="promocodeFilterAfter" :disabled="isReadonly"></input>
				</b-field>
				<b-field :label="'Название акции'|gettext" :message="errors.title" class="has-mb-1" :class="{'has-error': errors.title}" v-else>
	            	<b-input v-model="values.title"  placeholder="Например: SALE" :disabled="isReadonly"></b-input>
				</b-field>
				
				<b-checkbox v-model="values.is_active" :disabled="isReadonly">{{texts[type].active|gettext}}</b-checkbox>
			</section>
			<section>			
				<label class="label has-mb-2">{{'Вид скидки'|gettext}}</label>
				<div class="is-block has-mb-1" v-for="(v, k) in variants.profit">
					<label class="radio is-flex">
						<input type="radio" v-model="values.options.profit" :value="k" :disabled="isReadonly" />
						<div class="is-flex-body">
							<div class="is-flex-title">{{v|gettext}}</div>
							
							<div v-if="k != 'free_shipping'">
								<b-field :message="errors.profit_percentage" class="has-mt-1" :class="{'has-error': errors.profit_percentage}" v-if="k == 'percentage' && values.options.profit == 'percentage'">
								<div class="row">
									<div class="col-xs-12 col-sm-6 col-md-5 has-xs-mb-1">
									<b-field>
										<p class="control is-expanded"><number v-model="values.options.percentage" class="input has-text-right" :disabled="isReadonly" /></p>
						            	<p class="control"><a class="button is-static">%</a></p>
									</b-field>
									</div>
									<div class="col-xs-12 col-sm-6 col-md-5" style="align-items: center;display: flex;">
										<label class="checkbox">
											<input type="checkbox" v-model="values.options.apply_options" :value="true" :disabled="isReadonly" /> {{'Применять к опциям'|gettext}}
										</label>
									</div>
								</div>
								</b-field>
								
								<b-field :message="errors.profit_fixed" class="has-mt-1" :class="{'has-error': errors.profit_fixed}" v-if="['percentage', 'fixed'].indexOf(values.options.profit) != -1" v-if="k == 'fixed' && values.options.profit == 'fixed'">
								<div class="row">
									<div class="col-xs-12 col-sm-6 col-md-5">
								<b-field>
									<p class="control is-expanded"><number v-model="values.options.fixed" :precision="$account.currency.precision" class="input has-text-right" :disabled="isReadonly" /></p>
					            	<p class="control"><a class="button is-static">{{ $account.currency.title }}</a></p>
								</b-field>
								</div>
								</div>
								</b-field>
							</div>
						</div>
					</label>
				</div>
			</section>
			<section v-if="values.options.profit != 'free_shipping'">
				<label class="label has-mb-2">{{'Применяется к'|gettext}}</label>
				<div class="is-block has-mb-1" v-for="(v, k) in variants.apply">
					<label class="radio is-flex">
						<input type="radio" v-model="values.options.apply" :value="k" :disabled="isReadonly" />
						<div class="is-flex-body">
							<div class="is-flex-title">{{v|gettext}}</div>
							
							<b-field :message="errors.apply_collections" :class="['has-mt-1', {'has-error': errors.apply_collections}]" v-if="k == 'collections' && values.options.apply == 'collections'">
								<vue-component-autocomplete-collections v-model="values.options.apply_collections" :allowNew="false" :placeholder="'Начните вводить название коллекции'|gettext" :disabled="isReadonly"></vue-component-autocomplete-collections>
							</b-field>
							
							
							<b-field :message="errors.apply_products" :class="['has-mt-1', {'has-error': errors.apply_products}]" v-if="k == 'products' && values.options.apply == 'products'">
								<vue-component-autocomplete-products v-model="values.options.apply_products" :allowNew="false" :placeholder="'Начните вводить название продуктов'|gettext" :disabled="isReadonly"></vue-component-autocomplete-products>
							</b-field>
							
						</div>
					</label>
				</div>
			</section>
			<section v-if="type == 'automatic'">
				<label class="label has-mb-2">{{'Минимальные требования'|gettext}}</label>
				<div class="is-block has-mb-1" v-for="(v, k) in variants.rule">
					<label class="radio is-flex">
						<input type="radio" v-model="values.options.rule" :value="k" :disabled="isReadonly" />
						<div class="is-flex-body">
							<div class="is-flex-title">{{v|gettext}}</div>
							
							<div class="row has-mt-1" v-if="k == 'purchase' && values.options.rule == 'purchase'">
								<div class="col-xs-12 col-sm-6 col-md-5">
									<b-field :message="errors.rule_purchase" :class="{'has-error': errors.rule_purchase}">
									<div>
										<b-field>
											<p class="control is-expanded"><number v-model="values.options.rule_purchase" :precision="$account.currency.precision" class="input has-text-right" :disabled="isReadonly" /></p>
							            	<p class="control"><a class="button is-static">{{ $account.currency.title }}</a></p>
										</b-field>	
									</div>
									</b-field>
								</div>
							</div>
							
							<div class="row has-mt-1" v-if="k == 'quantity' && values.options.rule == 'quantity'">
								<div class="col-xs-12 col-sm-6 col-md-5">
									<b-field :message="errors.rule_quantity" :class="{'has-error': errors.rule_quantity}">
										<input type="number" v-model="values.options.rule_quantity" class="input has-text-right" min="1" :disabled="isReadonly">
									</b-field>
								</div>
							</div>
							
							<div v-if="k != 'none' && k != 'combo' && k == values.options.rule && values.options.apply != 'order' && values.options.profit != 'free_shipping'" class="has-mt-1 has-text-grey">
								<p v-if="values.options.apply == 'collections'">{{'Относится только к выбранным коллекциям'|gettext}}</p>
								<p v-if="values.options.apply == 'products'">{{'Относится только к выбранным товарам'|gettext}}</p>
							</div>
							
<!--
							<b-field :message="errors.rule_combo" class="has-mt-1" :class="{'has-error': errors.rule_combo}" v-if="k == 'combo' && values.options.rule == 'combo'">
								<vue-component-autocomplete-products v-model="values.options.rule_combo" :allowNew="false" :placeholder="'Начните вводить название товары'|gettext"></vue-component-autocomplete-products>		
							</b-field>
-->
						</div>
					</label>
				</div>
			</section>
		</section>
		<footer class="modal-card-foot level">
			<div class="level-left">
				<div v-if="!isReadonly && values.discount_id">
					<vue-component-action-button @action="onAction" :title="'Действие'|gettext">
					<template slot="actions">
						<b-dropdown-item value="delete" class="has-text-danger" :class="{disabled: values.has_orders}"><i class="fa fa-trash-alt"></i> {{'Удалить'|gettext}}</b-dropdown-item>
					</template>
					</vue-component-action-button>
				</div>
			</div>
			
			<div class="level-right" v-if="isReadonly">
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			</div>
			<div class="level-right" v-else>
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Отмена'|gettext}}</button>
				<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("products", "vue-products-discounts-list", {data() {
			return {
				isFetching: false,
				filter: {query: ''},
				isReadonly: false,
                sortField: 'tms_created',
                sortOrder: 'desc',
				perPage: 20,
				texts: {
					promocode: {
						button: this.$gettext('Добавить промокод'),
						icon: 'fa-ticket',
						description: this.$gettext('С помощью промокодов можно предоставить скидку или активировать бесплатную доставку. Промокоды могут применяться как ко всему заказу, так и к определенным товарам или коллекциям')
					},
					automatic: {
						button: this.$gettext('Добавить акцию'),
						icon: 'fa-badge-percent',
						description: this.$gettext('Предложите своим клиентам скидки, которые автоматически применяются в их корзине. Акции могут действовать как для всего ассортимента, так и для определенных товаров или коллекций')
					}
				},
				isAllow: this.$auth.isAllowTariff('business')
			}
		},
		
		props: ['type'],

		mixins: [ListModel],

		created() {
			this.isReadonly = !this.$auth.isAllowEndpoint('products/discounts/set');

			this.$io.on('events:products.discounts.list:refresh', this.refreshDiscountss);
			
			this.fetchData(true);
		},
		
		destroyed() {
			this.$io.off('events:products.discounts.list:refresh', this.refreshDiscountss);
		},
		
		watch: {
			type() {
				this.checkedRows = [];
				this.fields = [];
                this.sortField = 'tms_created';
                this.sortOrder = 'desc';
				
				this.clearPages();
				this.fetchData(true);
			}
		},

		methods: {
			refreshDiscountss(data) {
				if (data.type == undefined || data.type == this.type) {
	                this.clearPages();
					this.fetchData(false, true);
				}
			},
			
			onFilter() {
	            this.isFiltering = true;
				this.clearPages();
	            this.fetchData(true);
            },
            
			openForm(discount_id) {
				this.$modal('vue-products-discounts-form', {discount_id: discount_id, type: this.type}, this);
			},
			
            clickRow(row) {
	            this.openForm(row.discount_id);
			},
			
			fetchData(withLoading, force) {
				let resolve = (data) => {
					this.fields = _.map(data.fields, (v) => {
						let o = v.options;
						let w = '';
						let f = '';
						let r = '';
						
						switch (o.profit) {
							case 'free_shipping':
								w = this.$gettext('Бесплатная доставка');
								break;
							case 'percentage':
								w = this.$format(this.$gettext('{1} скидки'), this.$decimal(o.percentage)+'%');
								break;
							case 'fixed':
								w = this.$format(this.$gettext('{1} скидки'), this.$currency(o.fixed));
								break;
						}
						
						if (o.profit != 'free_shipping') {
							f = ' на ';
							switch (o.apply) {
								case 'order':
									f += this.$gettext('весь заказ');
									break;
								case 'products':
									f += this.$plural('товар|товара|товаров', o.apply_products.length);
									break;
								case 'collections':
									f += this.$plural('коллекцию|коллекции|коллекций', o.apply_products.length);
									break;
							}
						}
						
						if (this.type == 'automatic') {
							switch (o.rule) {
								case 'purchase':
									r += ' '+this.$gettext('при заказе на {1}', this.$currency(o.rule_purchase));
									break;
								case 'quantity':
									r += ' '+this.$gettext('при заказе на {1}', this.$plural('товар|товара|товаров', o.rule_quantity));
									break;
								case 'combo':
									r += ' '+this.$gettext('при наличии в заказе товаров из набора');
									break;
							}
						}
						
						v.description = w + f + r;
						return v;
					});
					
					
					this.isFetching = false;
				}

				if (force || !this.checkCache(resolve)) {				
					this.isFetching = withLoading;
					
					this.$api.get('products/discounts/list', {next: this.next, type: this.type, count: this.perPage, sort_field: this.sortField, sort_order: this.sortOrder, filter: this.filter}).then((data) => {
						this.cachePage(data.response.discounts, resolve);
					}).catch((error) => {
	                    this.fields = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
				}
			}
		}, template: `
	<div>
		<vue-component-filterbox ref="filterbox" v-if="isAllow" @filter="onFilter" v-model="filter" :is-visible="fields.length" :disabled="isFetching" :with-buttons="true">
			<template slot="buttons">
				<button class="button" @click="openForm(null)" class="button is-primary is-fullwidth" :class="{disabled: isReadonly}"><i class='fa fa-plus'></i><span class='is-hidden-touch has-ml-1'>{{texts[type].button|gettext}}</span></button>
			</template>
		</vue-component-filterbox>
		
		<div class="container has-mb-3" :class="{'has-mt-3': !isAllow}">
		<b-table paginated backend-pagination backend-sorting pagination-simple :data="fields" :loading="isFetching" :current-page="page" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" @click="clickRow" @sort="onSort" hoverable bordered>
			
			<b-table-column field="promocode" :label="'Промокод'|gettext" sortable v-if="type == 'promocode'" v-slot="props"><div>{{ props.row.promocode }}<div class="has-text-grey">{{ props.row.description }}</div></div></b-table-column>
			<b-table-column field="title" :label="'Название'|gettext" sortable v-else v-slot="props"><div>{{ props.row.title }}<div class="has-text-grey">{{ props.row.description }}</div></div></b-table-column>
			
			<b-table-column field="amount_used" :label="'Использовали'|gettext" class="has-text-nowrap has-width-10" numeric sortable v-slot="props"><span v-if="props.row.amount_used">{{ $plural('раз|раза|раз', props.row.amount_used) }}</span></b-table-column>
			
			<b-table-column field="is_active" class="has-text-nowrap has-width-10" :label="'Статус'|gettext" sortable v-slot="props">
				<div class="tag has-tag-dot" :class="props.row.is_active?'is-success':'is-danger'">{{props.row.is_active?'Активный':'Не активный'|gettext}}</div>
			</b-table-column>

			<b-table-column field="tms_created" :label="'Дата добавления'|gettext" class="has-text-nowrap has-width-10" sortable v-slot="props">{{ props.row.tms_created|datetime }}</b-table-column>
			
			<template slot="empty">
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
	                <div v-if="isAllow && $refs.filterbox.hasFilter || filter.query">
	                    <i class="fal fa-search fa-5x has-text-grey-light"></i>
						<h3>{{'Ничего не найдено'|gettext}}</h3>
	                </div>
					<div v-else>	
						<div class="row">
							<div class="col-xs-12 col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
								<h3 class="has-p-2 has-text-grey-light has-text-centered has-mb-2"><i :class="['fal', 'has-text-grey-light', texts[type].icon]" style="font-size: 5rem"></i></h3>
			 					<div class="has-mb-2">{{texts[type].description|gettext}}</div>
			 					
			 					<button class="button" @click="openForm(null)" class="button is-primary" v-if="$auth.isAllowTariff('business')" :class="{disabled: isReadonly}"><i class='fa fa-plus'></i>{{texts[type].button|gettext}}</button>
			 					<div class="has-text-centered" v-else><div class="tag is-danger" style="top: -1px;position: relative;">biz</div> <span class='has-text-danger'>{{'Доступно на business-тарифе'|gettext}}</span></div>
							</div>
						</div>
					</div>
                </section>
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
	                <p>{{'Загрузка данных'|gettext}}</p>
                </section>
            </template>
            	        
		</b-table>
		</div>
	</div>
`});

window.$app.defineComponent("products", "vue-products-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				isReadonly: false,
				price: 0,
				values: {title: '', price: 0, price_compare: null, weight: 0, is_visible: true, is_shipping: false, is_active: true, is_sellable: true, has_orders: false, is_variants_all: true, variants_ids: [], offers: [], options: [], variants: [], pictures: [], collections: []},
				variants: {global_variants: []},
				activeTab: 'common',
				variantAction: null,
				picturesUpdating: 0
			}
		},

		created() {
			this.isReadonly = !this.$auth.isAllowEndpoint('products/set');

			if (this.product_id) {
				this.fetchData(true);
			} else {
				this.isFetching = true;
				this.$api.get('products/info').then((data) => {
					this.isFetching = false;
					this.variants = data.response.product.info.variants;
				});				
			}
		},
		
		computed: {
			linkProduct() {
				return this.$account.link+'/o/'+this.values.product_id.toString(16)+'/';
			},
			
			amountVariantsValues() {
				return _.reduce(_.map(this.values.variants, (v) => v.variant_values.length), (a, b) => a * b);
			},
			
			variantsLength() {
				let length = 1;
				_.each(this.values.variants, v => length *= v.variant_values.length);
				return length;
			}
		},
		
		props: ['product_id'],
		mixins: [FormModel],

		methods: {
			onAction(v) {
				switch (v) {
					case 'delete':
						this.onDelete();
						break;
					case 'archive':
						this.onArchive();
						break;
					case 'clone':
						let hasLocal = false;
						_.each(this.values.variants, v => {
							hasLocal = hasLocal || (v.variant_type == 'local');
						});
						
						if (hasLocal) {
							this.$alert('Товар содержит варианты, заданные в карточке товара через локальные свойства. Пересоздайте свойства как глобальные и повторите попытку.', 'is-danger');
						} else {
							this.product_id = null;
							this.values.title = '';
							this.values.title = '';
							
							_.each(this.values.offers, (o) => o.offer_id = null);
							_.each(this.values.options, (o) => o.option_id = null);
							
							
							this.$refs.title.focus();
						}
						break;
				}
			},
			onArchive() {
				this.$confirm(this.$gettext('Вы уверены что хотите отправить этот товар в архив?'), 'is-warning').then(() => {
                    this.$api.post('products/archive', {product_ids: [this.product_id]}, this).then((data) => {
						if (data.result == 'success') {
							this.$parent.close()
						}
					});
				});
			},
			
			onRestore() {
				this.$api.get('products/restore', {product_ids: [this.product_id]}, this).then((data) => {
					if (data.result == 'success') {
						this.$parent.close()
					}
				});
			},
			
			onDelete() {
				this.$confirm(this.$gettext('Вы уверены что хотите удалить этот товар? Вы не сможете его вернуть!'), 'is-danger').then(() => {
                    this.$api.get('products/delete', {product_ids: [this.product_id]}, this).then((data) => {
						if (data.result == 'success') {
							this.$parent.close()
						}
					});
				});
			},
			
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get(['products/get', 'products/info'], {product_id: this.product_id}, this).then((data) => {
					this.isFetching = false;
					this.values = data.response.product.values;
					this.variants = data.response.product.info.variants;
				});
			},
			
			updateData() {
				this.isUpdating = true;
				let values = this.$clone(this.values);
				values.product_id = this.product_id;
				values.pictures = _.map(values.pictures, (p) => { return p.picture_id; });
				values.collections = _.map(values.collections, 'collection');
				values.offers = _.map(values.offers, (o) => {
					o.variants = _.map(o.variants, 'key');
					return o;
				});
				
				values.variants = _.map(values.variants, (v) => {
					switch (v.variant_type) {
						case 'local':
							v.variant_values = _.map(v.variant_values, 'value');
							break;
						case 'global':
							v = {variant_id: v.variant_id, variant_type: v.variant_type};
							break;
					}
					
					return v;
				})
				
				
				this.$api.post('products/set', values, this).then((data) => {
					if (data.result == 'success') {
						this.$parent.close()
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			},
			
			onVariantAction() {
				let variant_id = null;
				
				if (this.variantAction != null) {
					if (this.values.variants == undefined) this.values.variants = [];
					if (this.variantAction == 'add') {
						this.values.variants.push({variant_id: null, variant_title: '', variant_values: [], variant_type: 'local'});
					} else {
						this.values.variants.push(this.variants.global_variants[this.variantAction]);
					}
					
									
					Vue.nextTick(() => {
						this.variantAction = null;
					});
					
					_.each(this.values.offers, (v) => {
						v.variants.push({variant_id: null, key: ''})
					});
				}
			},
			
			onRemoveOffer(index) {
				this.$confirm(this.$gettext('Вы уверены, что хотите удалить этот вариант?'), 'is-danger').then(() => {
					this.values.offers.splice(index, 1);
				});
			},
			
			onAddOffer() {
				let variants = _.map(this.values.variants, (v) => { return {variant_id: v.variant_id, key: ''}; });
				this.values.offers.push({offer_id: null, variants: variants, price: null, is_visible: true})
			},
			
			onAddAllOffers() {
				let values = _.map(this.values.variants, 'variant_values');
				
				if (this.variantsLength > 100) {
					this.$alert('Всего вариантов: '+this.$number(this.variantsLength)+' шт. Вы не можете иметь более 100 вариантов продукта. Удалите некоторые свойства или используйте опцию "Активируйте все возможные варианты"', 'is-danger');
					return;
				}
				
				if (this.variantsLength > this.values.offers.length) {
					this.$confirm(this.$format(this.$gettext('Будет добавлено вариантов: {1} шт. Добавить?'), this.$number((this.variantsLength - this.values.offers.length))), 'is-warning', {yes: 'Да', no: 'Нет'}).then(() => {
						let result = _.reduce(values, (a, b) => _.flatten(_.map(a, ai => _.map(b, bi => ai.concat([bi.key])))),[[]]);
						let hash = _.map(this.values.offers, (o) => _.map(o.variants, (v) => v.key).join(':'));
						
						_.each(result, (v) => {
							if (hash.indexOf(v.join(':')) == -1) {
								let variants = _.map(this.values.variants, (w, i) => { return {variant_id: w.variant_id, key: v[i]}; });
								this.values.offers.push({offer_id: null, variants: variants, price: null, is_visible: true})
							}
						});
					});
				}
			},
			
			onRemoveVariant(index) {
				this.$confirm(this.$gettext('Вы уверены, что хотите удалить это свойство?'), 'is-danger').then(() => {
					_.each(this.values.offers, (v) => {
						v.variants.splice(index, 1);
					});
	
					this.values.variants.splice(index, 1);
					if (this.values.variants.length == 0) this.values.offers = [];
					
					let hash = [];
					this.values.offers = _.filter(this.values.offers, (o) => {
						let key = _.map(o.variants, (v) => v.key).join(':');
						if (hash.indexOf(key) == -1) {
							hash.push(key);
							return true;
						} else {
							return false;
						}
					});
				});
			},

			onAddValue(v, tag) {
				v.variant_values.pop();
				let m = _.maxBy(v.variant_values, 'key');
				if (!_.find(v.variant_values, ['value', tag])) v.variant_values.push({key: m?(m.key+1):0, value: tag});
			},
			
			
			onValuesRemove(value, variant, index) {
				let amount = _.sumBy(this.values.offers, (o) => {
					return (value.key === o.variants[index].key)?1:0;
				});
				
				
				let normalizeKeys = () => {
					// меняем key у офферов
                    _.each(this.values.offers, (o) => {
	                    if ((o.variants[index].key >= value.key) && (o.variants[index].key !== '')) o.variants[index].key--;
                    });

// 		            for (var i = 0; i < variant.variant_values.length; i++) variant.variant_values[i].key = i;
					
					// Вычитаем из каждого key чтобы сохранялдся порядок к масиве
					_.each(variant.variant_values, (o) => {
						if (o.key >= value.key) o.key--;
					});
				}
				
				if (amount) {
					variant.variant_values.splice(value.key, 0, value);
					
					this.$confirm(this.$gettext('Вместе с удалением значения этой опции будут удалены добавленные варианты: %s шт.').replace('%s', amount), 'is-danger').then(() => {
		                    variant.variant_values.splice(value.key, 1);
		                    this.values.offers = _.filter(this.values.offers, (o) => { return (value.key !== o.variants[index].key) });
		                    normalizeKeys();
					});
				} else {
					normalizeKeys();
				}
			},
			
			onRemoveOption(index) {
				this.$confirm(this.$gettext('Вы уверены, что хотите удалить эту опцию?'), 'is-danger').then(() => {
					this.values.options.splice(index, 1);
				});
			},
			
			onAddOption() {
				this.values.options.push({option_id: null, title: '', price: 0});
			},
			
			onPicturesUploading(v) {
				this.picturesUpdating = v;
			}
		}, template: `
	<div class="modal-card modal-card-large" :class="{'is-rtl': $account.locale.text_direction == 'rtl'}">
		<header class="modal-card-head">
			<p class="modal-card-title" v-if="product_id">{{'Товар'|gettext}}</p>
			<p class="modal-card-title" v-else>{{'Новый товар'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		
		<ul class="nav nav-tabs has-text-left">
			<li :class="{active: activeTab == 'common'}"><a href="#" @click="activeTab = 'common'"><span class="is-hidden-mobile">{{'Общая информация'|gettext}}</span><span class="is-visible-inline-mobile">{{'Общие'|gettext}}</span></a></li>
			<li :class="{active: activeTab == 'offers'}"><a href="#" @click="activeTab = 'offers'">{{'Варианты'|gettext}}</a></li>
			<li :class="{active: activeTab == 'options'}"><a href="#" @click="activeTab = 'options'">{{'Опции'|gettext}}</a></li>
			<li :class="{active: activeTab == 'link'}" v-if="values.product_id"><a href="#" @click="activeTab = 'link'">{{'Ссылка'|gettext}}</a></li>
		</ul>

		<section class="modal-card-body modal-card-body-blocks" v-show="activeTab == 'common'">
			<section>
				<b-field :label="'Название товара'|gettext" :message="errors.title" :class="{'has-error': errors.title}">
	            	<b-input v-model="values.title" :disabled="isReadonly" maxlength="255" :has-counter="false" ref="title" class="has-rtl"></b-input>
				</b-field>
	
				<b-field :label="'Описание товара'|gettext" :message="errors.description" :class="{'has-error': errors.description}">
					<vue-component-emoji-picker v-model="values.description">
		            	<b-input v-model="values.description" :disabled="isReadonly" type="textarea" maxlength="65535" :has-counter="false" class="has-rtl"></b-input>
					</vue-component-emoji-picker>
				</b-field>
	
				<div class="row">
					<div class="col-sm-3 col-xs-6 has-mb-2">
						<b-field :label="'Цена'|gettext" :message="errors.price" :class="{'has-error': errors.price}">
						<b-field>
							<p class="control is-expanded"><number v-model="values.price" :precision="$account.currency.precision" :disabled="isReadonly" class="input has-text-right" /></p>
			            		<p class="control">
								<a class="button is-static">{{ $account.currency.title }}</a>
							</p>
						</b-field>
						</b-field>
					</div>
					
					<div class="col-sm-3 col-xs-6 has-mb-2">
						<b-field :label="'Старая цена'|gettext" :message="errors.price_compare" :class="{'has-error': errors.price_compare}">
						<b-field>
							<p class="control is-expanded"><number v-model="values.price_compare" :precision="$account.currency.precision" :disabled="isReadonly" class="input has-text-right" /></p>
							<p class="control">
								<a class="button is-static">{{ $account.currency.title }}</a>
							</p>
						</b-field>
						</b-field>
					</div>
					
					<div class="col-sm-6 col-xs-12 has-mb-2">
						<b-field :label="'Коллекции'|gettext" :message="errors.collections" :class="{'has-error': errors.collections}">
							<vue-component-autocomplete-collections v-model="values.collections" :disabled="isReadonly" :placeholder="'Начните вводить название коллекции'|gettext"></vue-component-autocomplete-collections>
						</b-field>
					</div>
				</div>
			</section>
			<section>
	
				<div class="row">
					<div class="col-sm-3 col-xs-12">
						
						<b-field :label="'Вес товара для доставки'|gettext" :message="errors.weight" class="has-mb-2" :class="{'has-error': errors.weight}" expanded>
						<b-field expanded>
			            	<p class="control"><number v-model="values.weight" :precision="$account.weight.precision" :disabled="isReadonly" class="input has-text-right" expanded /></p>
			            	<p class="control">
								<a class="button is-static">{{$account.weight.unit_title}}</a>
							</p>
						</b-field>
						</b-field>
						<div class="has-text-grey is-visible-mobile has-mb-2">{{'Укажите вес товара, если это влияет на стоимость доставки'|gettext}}</div>
					
<!--
							<div class="col-sm-6 col-xs-12">
								<div class="label is-hidden-mobile">&nbsp;</div>
					            <b-checkbox v-model="values.is_shipping" :disabled="isReadonly">{{'Требуется доставка'|gettext}}</b-checkbox>
					        </div>
-->
	
					</div>
					<div class="col-sm col-xs-12">
						<div class="label is-hidden-mobile">&nbsp;</div>
			            <b-checkbox v-model="values.is_shipping" :disabled="isReadonly" class="is-product-checkbox">{{'Требуется доставка'|gettext}}</b-checkbox>
						<b-checkbox v-model="values.is_visible" :disabled="isReadonly" class="is-product-checkbox">{{'Виден в каталоге'|gettext}}</b-checkbox>
						<b-checkbox v-model="values.is_sellable" :disabled="isReadonly" class="is-product-checkbox">{{'Доступен для покупки'|gettext}}</b-checkbox>
					</div>
				</div>
				
				<div class="has-text-grey is-hidden-mobile">{{'Укажите вес товара, если это влияет на стоимость доставки'|gettext}}</div>
			</section>
			<section>
				<b-field :label="'Фотографии товара'|gettext">
					<vue-component-pictures v-model="values.pictures" :disabled="isReadonly" @startUploading="onPicturesUploading" @stopUploading="onPicturesUploading" multiple></vue-component-pictures>
				</b-field>
			</section>
		</section>
		<section class="modal-card-body modal-card-body-blocks" v-show="activeTab == 'offers'">
			<section>
			<div class="has-mb-2">
				<p>{{'Добавьте варианты, если этот товар поставляется в нескольких версиях, таких как разные размеры или цвета.'|gettext}}</p>
			</div>
			<div class="row">
				<div class="col-xs-12 col-sm-4">
					<b-select @input="onVariantAction()" v-model="variantAction" :placeholder="'-- Действие --'|gettext" :disabled="values.variants.length >= 4 || isReadonly">
						<optgroup :label="'Действие'|gettext">
							<option value="add">{{'Добавить новое свойство'|gettext}}</option>
						</optgroup>
						<optgroup label="Глобальные свойства" v-if="variants.global_variants.length">
							<option :value="i" :disabled="_.find(values.variants, ['variant_id', g.variant_id])" v-for="(g, i) in variants.global_variants">{{ g.variant_title }}</option>
						</optgroup>
					</b-select>
				</div>
			</div>			
			</section>
			<section v-if="values.variants.length">
			<div class="is-hidden-mobile">
			<div class="row row-small">
				<div class="col-xs-12 col-sm-3">
					<label class="label has-mb-2">{{'Название свойства'|gettext}}</label>
				</div>
				<div class="col-xs-12 col-sm-9">
					<label class="label has-mb-2">{{'Значения свойства'|gettext}}</label>
				</div>
			</div>
			</div>
			
			
			<div class="row row-small has-mb-2" :class="{disabled: isReadonly}" v-for="(v, index) in values.variants">
				<div class="col-xs-12 col-sm-3">
					<input type="text" v-model="v.variant_title" class="input block-xs" :placeholder="'Укажите название опции'|gettext" :disabled="isReadonly || (v.variant_type == 'global')">
				</div>
				
				<div class="col-xs-10 col-sm">
	            	<b-taginput v-model="v.variant_values" field="value" @add="onAddValue(v, $event)" @remove="onValuesRemove($event, v, index)" confirm-key-codes='[13]' :placeholder="'Укажите значения через запятую'|gettext" :disabled="isReadonly || (v.variant_type == 'global')" attached>
				</div>
				
				<div class="col-xs col-sm-shrink text-xs-right">
					<button type="button" class="button is-danger" :disabled="isReadonly" @click="onRemoveVariant(index)"><i class="fa fa-trash-alt"></i></button>
				</div>
								
			</div>
			</section>
			
			<section v-if="values.variants.length">
				
			<b-checkbox v-model="values.is_variants_all" :disabled="isReadonly">{{'Активировать все возможные варианты'|gettext}}</b-checkbox>
			
			<div v-if="!values.is_variants_all" class="has-mt-2">
			<div class="has-mb-2">
			<mx-item class="is-hidden-mobile mx-item-header">
			<div class="item-row row">
				<div class="col-xs-2 col-sm col-sm-shrink has-text-centered">
					<div style="visibility: hidden;height:1px">
						<a class="button has-text-danger"><i class="fa fa-eye"></i></a>
					</div>
				</div>
				<div class="col-sm" v-for="v in values.variants">{{v.variant_title}}</div>
				<div class="col-sm has-text-right">{{'Цена'|gettext}}</div>
				<div class="col-xs-2 col-sm col-sm-shrink has-text-centered">
					<div style="visibility: hidden;height:1px">
						<a class="button has-text-danger"><i class="fa fa-trash-alt"></i></a>
					</div>
				</div>
			</div>
			</mx-item>
			<mx-item v-if="values.offers.length == 0">
				<div class="item-row row">
					<div class="col-xs has-text-centered has-text-grey-light">{{'Варианты пока не добавлены'|gettext}}</div>
				</div>
			</mx-item>
		
			<mx-item v-for="(o, index) in values.offers">
				<div class="item-row row">
					<div class="col-xs-2 col-sm col-sm-shrink has-text-right last-xs first-sm">
						<button type="button" class="button is-light" :disabled="isReadonly" :class="{disabled: isReadonly}" @click="o.is_visible = !o.is_visible"><i :class="['fa', {'fa-eye': o.is_visible, 'fa-eye-slash': !o.is_visible}]"></i></button>
					</div>	

					<div class="col-sm has-xs-mb-2" v-for="(v, index) in o.variants" :style="{opacity: o.is_visible?'1':'.5'}">
						<b-select v-model="v.key" :disabled="isReadonly || !o.is_visible" expanded>
							<option value="">{{'-- Не выбрано --'|gettext}}</option>
							<option v-for="w in values.variants[index].variant_values" :value="w.key">{{w.value}}</option>
						</b-select>
					</div>
					
					<div class="col-sm col-xs-8 has-xs-mb-2" :style="{opacity: o.is_visible?'1':'.5'}">
					<div class="field has-addons">
						<div class="control is-expanded"><number type="text" class="input has-text-right" :precision="$account.currency.precision" :placeholder='values.price|currency' v-model="o.price" :disabled="isReadonly || !o.is_visible" /></div>
						<div class="control"><span class="button is-static">{{ $account.currency.title }}</span></div>
					</div>
					</div>	
									
					<div class="col-xs-2 col-sm col-sm-shrink has-text-right last-xs">
						<button type="button" class="button has-text-danger" :disabled="isReadonly" :class="{disabled: isReadonly}" @click="onRemoveOffer(index)"><i class="fa fa-trash-alt"></i></button>
					</div>	
				</div>
			</mx-item>

			</div>
			
			<div class="level">
				<div class="level-left has-text-grey">
					{{'Всего вариантов'|gettext}}: {{values.offers.length|number}}
				</div>
				<div class="level-right">
					<a @click="onAddOffer" v-if="!isReadonly" :class="{disabled: values.offers.length >= 100 || values.offers.length >= variantsLength}">{{'Добавить вариант'|gettext}}</a><span class="has-text-grey" style="padding:0 .7rem"> &bull;</span>
					<a @click="onAddAllOffers" v-if="!isReadonly" :class="{disabled: amountVariantsValues == values.offers.length}">{{'Добавить все варианты'|gettext}}</a> 
				</div>
			</div>
			</div>
			</section>			
		</section>

		<section class="modal-card-body modal-card-body-blocks" v-show="activeTab == 'options'">
			<section>
			<div class="has-mb-2">
				<p>{{'Вы можете добавить дополнительные опции к вашему товару'|gettext}}</p>
			</div>
			<div class="has-mb-2" id='productsOptionsBody' v-if="values.options.length">
				<mx-item class="is-hidden-mobile mx-item-header">
					<div class="item-row row">
						<div class="col-xs-7">{{'Опция'|gettext}}</div>
						<div class="col-xs col-price">{{'Цена'|gettext}}</div>
						<div class="col-xs col-shrink has-text-centered">
							<a href='#' class="button has-text-danger" style="visibility: hidden;height:1px"><i class="fa fa-trash-alt"></i></a>
						</div>
					</div>
				</mx-item>
				
				<mx-item v-for="(o, index) in values.options">
					<div class="item-row row">
						<div class="col-sm-7 col-xs-12 block-xs"><input type="text" class="input" :placeholder="'Укажите название опции'|gettext" v-model="o.title" :disabled="isReadonly"></div>
						<div class="col-sm col-xs-10 col-price">
						<div class="field has-addons">
							<div class="control is-expanded"><number type="text" class="input has-text-right" :precision="$account.currency.precision" v-model="o.price" :disabled="isReadonly" /></div>
							<div class="control"><span class="button is-static">{{ $account.currency.title }}</span></div>
						</div>
						</div>					
						<div class="col-xs-2 col-sm col-sm-shrink has-text-centered">
							<button type="button" class="button has-text-danger" @click="onRemoveOption(index)" :disabled="isReadonly" :class="{disabled: isReadonly}"><i class="fa fa-trash-alt"></i></button>
						</div>	
					</div>
				</mx-item>				
			</div>
			
			<a href='#' @click="onAddOption()" v-if="!isReadonly">{{'Добавить опцию'|gettext}}</a>
			</section>
		</section>

		<section class="modal-card-body modal-card-body-blocks" v-if="values.product_id" v-show="activeTab == 'link'">
			<section>
			<div class="field has-addons">
				<div class="control is-expanded"><input type="text" class="input" readonly="on" id="productLink" :value="linkProduct"></div>
				<div class="control">
					<a class="button is-default" target="_blank" :href="linkProduct"><i class="fa fa-external-link"></i> {{'Открыть'|gettext}}</a>
				</div>
			</div>
			</section>
		</section>

		<footer class="modal-card-foot level">
			<div class="level-left">
			<div v-if="!isReadonly && values.product_id">
				<vue-component-action-button @action="onAction" v-if="values.is_active" :title="'Действие'|gettext">
					<template slot="actions">
						<b-dropdown-item value="clone"><i class="fa fa-clone"></i> {{'Дублировать'|gettext}}</b-dropdown-item>
						<hr class="dropdown-divider" aria-role="menuitem">
						<b-dropdown-item value="archive"><i class="fa fa-archive"></i> {{'В архив'|gettext}}</b-dropdown-item>
						<hr class="dropdown-divider" aria-role="menuitem">
						<b-dropdown-item value="delete" class="has-text-danger" :class="{disabled: values.has_orders}"><i class="fa fa-trash-alt"></i> {{'Удалить'|gettext}}</b-dropdown-item>
					</template>
				</vue-component-action-button>
				<button v-if="!values.is_active" @click="onRestore" type="button" class="button is-success" name="action" value="restore"><i class="fa fa-undo"></i> {{'Восстановить'|gettext}}</button>
				
<!--
				<button v-if="!values.has_orders && values.is_active" type="button" @click="onDelete" class="button is-default "><i class="fa fa-trash-alt"></i><span class="is-hidden-mobile"> {{'Удалить'|gettext}}</span></button>
				<button v-if="values.is_active" @click="onArchive" type="button" class="button is-default"><i class="fa fa-archive"></i> {{'В архив'|gettext}}</button>
-->
			</div>
			</div>
			<div class="level-right" v-if="isReadonly">
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			</div>
			<div class="level-right" v-else>
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Отмена'|gettext}}</button>
				<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData" :disabled="picturesUpdating > 0">{{'Сохранить'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("products", "vue-products-import-form", {data() {
			return {
				grid: null,
				data: null,
				isUpdating: false,
				isFetching: true,
				selects: [],
				columnSelect: null,
				values: {},
				is_done: false,
				amount_inserted: 0,
				amount_products: 0
			}
		},

		mounted() {
			this.$api.get('products/import/info').then((data) => {
				this.columns = data.response.products.import.columns;
				$mx.lazy('grid.js', 'grid.css', () => {
					var d = {cols: 3, rows: 5, name: 'data', clearPaste: 'yes', autofocus: 'yes'}
	
					let o = $mx(this.$refs.grid);
				
					var input = null;
					var columns = [];
					var data = [];
					

					if (this.data && (this.data.cells != undefined) && this.data.cells.length) {
						data = d.data.cells;
						d.cols = Object.keys(data[0]).length;
					} else {
						for (i=1; i <= d.rows; i++) data.push({});
					}
				
					for (i=1; i <= d.cols; i++) columns.push({name: this.intToLetters(i), type: "string"})
					
					this.grid = o.grid(data, columns);
					this.grid.registerEditor(BasicEditor);
					this.grid.render();

					if (this.columns) {
						this.columnSelect = '<div class="select is-fullwidth"><select>'+_.map(this.columns, (v) => { return '<option value="'+v.key+'">'+v.title+'</option>' })+'</select></div>';
						$mx('thead th div', o).html(this.columnSelect);
					}
					
					if ($mx.isset(d.data) && $mx.isset(d.data.selects) && d.data.selects.length) {
						$mx('thead th select', o).each(function(i, v) {
							$mx(this).val(d.data.selects[i]);
						});
					}
					
					if (d.name) {
						input = $mx('<input type="hidden" name="'+d.name+'">').appendTo(o);
					}
					
					this.grid.events.on("editor:save", (e) => {
						if (input) {
							this.data = {'cells': this.grid.getGridData(), 'selects': $mx.makeArray($mx('select', o).map(function() { return this.value; }))};
						}
					});
					
					this.grid.$el.on('change', 'select', () => {
						this.grid.events.trigger("editor:save");
					});
					
					this.grid.events.trigger("editor:save");
					
					let cell = $mx("tbody tr:first td:first", this.grid.$el);
					
					this.grid.setActiveCell(cell);
					this.grid.$el.focus();
					
					$mx(document).on('paste', this.paste);
					
					this.isFetching = false;
				});
			});
		},
		
		destroyed() {
			$mx(document).off('paste', this.paste);
			this.grid.destroy();
		},

		mixins: [FormModel],

		methods: {
			updateData() {
				this.isUpdating = true;
				this.$api.post('products/import/set', {data: this.data}, this).then((data) => {
					if (data.result == 'success') {
						this.amount_inserted = data.response.amount_inserted;
						this.amount_products = data.response.amount_products;
						this.is_done = data.response.is_done;
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			},
			
			intToLetters(value) {
			    result = '';
			    while (--value >= 0) {
			        result = String.fromCharCode('A'.charCodeAt(0) + value % 26 ) + result;
			        value /= 26;
			    }
			    
			    return result;
			},			
			
			paste(e) {
				if (!this.grid.is(':focus')) return;
				let o = this.$refs.grid;
				let cell = null;
				
				//oe = e.originalEvent;
				
				if (true) {
					$mx("tbody tr td:not(:first), thead tr th:not(:first)", o).remove();
					$mx("tbody tr:not(:first)", o).remove();
					this.grid.setActiveCell(cell = $mx("tbody tr:first td:first", o));
				} else {
					cell = this.grid.getActiveCell();
				}

				function getClipboardData() {
					let cd = (window.clipboardData)?window.clipboardData:e.clipboardData;
					let types = [];
					
					for (var _t = 0; _t < cd.types.length; _t++) types.push(cd.types[_t]);
					
					if (types.indexOf('text/html') != -1) {
						let clipText = e.clipboardData.getData('text/html').replace(/\r\n|\n|\r/g, '');
						const regex = new RegExp('(<table[^>]*>(?:.|\n)*<\/table>)', 'mgiu');
						let rr = regex.exec(clipText);
						if (rr) {
							clipText = $mx(rr[0]);
							if (clipText.is('table')) {
								return $mx('tr', clipText.eq(0)).map(function() {
									return $mx("td", this).map(function() { 
										return this.innerText.trim();     
								    });
									return t;
								});
	
								return tt;
							}
						}
					}
									
					if (types.indexOf('text/plain') != -1) {
						var clipText = e.clipboardData.getData('text/plain');
						var rows = clipText.trim().split(/\r\n|\n|\r/);
						var table = [];
						for (i = 0; i < rows.length; i++) table.push(rows[i].split('\t'));
						return table;
					}
					
					return [];
				}
				
				var colNum = cell.index();
				
				var rows = getClipboardData();
				
				for (i = 0; i < rows.length; i++) {
					var cols = rows[i];
					if (cols.length) {
						for (j = 0; j < cols.length; j++) {
	 						$mx('div', cell).text(cols[j]);
							
	 						if (j < cols.length-1) {
		 						next = cell.next();
		 						
		 						if (next.length == 0) {
			 						var tr = cell.closest('tr');
			 						var tridx = tr.index();
			 						var t = tr.closest('table');
			 						var trh = $mx('thead tr', t);
			 						var col = this.intToLetters($mx('th', trh).length+1);
			 						
			 						var idx = 0;
			 						$mx('tbody tr', t).each(function() {
				 						var c = $mx('<td><div></div></td>').data(cell.data()).data("column", col).appendTo(this);
			 							if (idx == tridx) next = c;
			 							idx++;
			 						});
			 						
			 						$mx('<th><div>'+((this.columnSelect != undefined)?this.columnSelect:col)+'</div></th>').appendTo(trh);
		 						}
		 						
		 						cell = next;
	 						}
	 					}
	 					
	 					if (i < rows.length-1) {
		 					tr = cell.closest('tr');
		 					next = tr.next();
		 					if (next.length == 0) {
			 					next = $mx(tr[0].outerHTML);
			 					next.find('div').empty();
			 					tdnext = $mx('td', next);
// 			 					tdnext.find('div').empty()
			 					var idx = 0;
			 					$mx('td', tr).each(function() {
				 					var ct = $mx(this);
				 					$mx(tdnext[idx]).data(ct.data());
				 					idx++;
			 					});
			 					
			 					next.appendTo(tr.parent()).removeClass('activeRow');
			 					tdnext.removeClass("activeCell").find('div').empty();
		 					}
		 					
		 					cell = $mx(next.find('td')[colNum]);
	 					}
					}
				}
				
				e.preventDefault();
				
				this.grid.events.trigger("editor:save");
			}
		}, template: `
	<div class="modal-card modal-card-large">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Загрузка товаров из Excel'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">

			<div class="message is-success" v-if="is_done"><div class="message-body">Добавленно товаров: {{amount_inserted|number}} из {{amount_products|number}}</div></div>
			<div v-else>
				<div ref="grid" class="has-mb-4" style="position:relative"></div>
				<div class="block-arrow-left-top" style="margin-top: -15px;opacity:0.5">
					Скопируйте нужные ячейки из Excel и вставьте в эту таблицу
				</div>
<!-- 				{{data}} -->
			</div>
			
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button v-if="!is_done" class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Загрузить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("products", "vue-products-list", {data() {
			return {
				isSortable: false,
				isReadonly: false,
				isFiltering: false,
				isFetching: false,
				columns: false,
				columns_props: {
					title: {label: 'Название', sortable: true},
					status: {label: 'Статус', classname: 'has-width-10'},
					price: {label: 'Цена', numeric: true, sortable: true, classname: 'has-text-nowrap has-width-10'},
					weight: {label: 'Вес', numeric: true, sortable: true, classname: 'has-text-nowrap has-width-10'},
					tms_created: {label: 'Дата добавления', sortable: true, classname: 'has-text-nowrap has-width-10'},
					collections: {label: 'Коллекции', classname: 'has-text-nowrap'},
				},
				dropdown_items: [
					{label: this.$gettext('Требуется доставка'), items: {'is_shipping:*': 'Не важно', 'is_shipping:true': this.$gettext('Да'), 'is_shipping:false': this.$gettext('Нет')}},
					{label: this.$gettext('Виден в каталоге'), items: {'is_visible:*': 'Не важно', 'is_visible:true': this.$gettext('Да'), 'is_visible:false': this.$gettext('Нет')}},
					{label: this.$gettext('Доступен для покупки'), items: {'is_sellable:*': 'Не важно', 'is_sellable:true': this.$gettext('Да'), 'is_sellable:false': this.$gettext('Нет')}},
// 					{label: 'Instagram', items: {'is_deleted:true': 'Профиль удален', 'is_deleted:false': 'Профиль не удален'}},
				],
				filter: {query: '', price: {from: '', until: ''}, collections: [], properties: ['is_shipping:*', 'is_visible:*', 'is_sellable:*']},
                sortField: 'ordernum',
                sortOrder: 'desc',
                tmpSort: {field: '', order: ''},
                isAllow: this.$auth.isAllowTariff('business')
			}
		},
		
		mixins: [ListModel, SortableTable],
		props: ['type'],
		
		computed: {
			table_columns() {
				if (!this.columns) return [];
								
				let result = _.map(this.columns, (v) => {
					let r = this.columns_props[v];
					r.visible = true;
					r.field = v;
					return r;
				});
				
				for (var i = 0; i < 6 - this.columns.length; i++) result.push({visible: false});
				result[0].numeric = false;
// 				result[0].classname += ' has-text-nowrap';
				
				return result;
			},
			
			currency_title() {
				return this.$account.currency.title;
			},
			
			linkShop() {
				return this.$account.link+'/m/'
			}
		},
		
		watch: {
			type() {
				this.checkedRows = [];
				this.clearPages();
				this.fetchData(true);
			},
			
			isSortable(v) {
				if (v) {
					window.addEventListener('scroll', this.resortEventScroll);
				} else {
					window.removeEventListener('scroll', this.resortEventScroll);
				}
			}
		},
		
		created() {
			this.isReadonly = !this.$auth.isAllowEndpoint('products/set');
			
			this.$io.on('events:products.list:refresh', this.refreshProducts);
			this.$io.on('events:products.list:delete', this.deleteProduct);
			this.$io.on('events:products.list:columns', this.refreshColumns);
			
			this.fetchData(true);
		},
		
		beforeDestroy() {
			if (this.isSortable) {
				window.removeEventListener('scroll', this.resortEventScroll);
			}
			
			this.$io.off('events:products.list:refresh', this.refreshProducts);
			this.$io.off('events:products.list:delete', this.deleteProduct);
			this.$io.off('events:products.list:columns', this.refreshColumns);
		},

		methods: {
			resortEventScroll() {
				if (this.bottomVisible() && !this.isFetching && this.next) {
					this.page++;
					this.fetchData(true)
				}
			},
			
			bottomVisible() {
				const scrollY = window.scrollY;
				const visible = document.documentElement.clientHeight;
				const pageHeight = document.documentElement.scrollHeight;
				return (pageHeight < visible+scrollY+200) && scrollY
		    },
		    
			onDropdown(name) {
				switch(name) {
					case 'view':
						window.open(this.linkShop);
						break;
					case 'import':
						this.$modal('vue-products-import-form');
						break;
					case 'columns':
						this.$modal('vue-products-columns-form');
						break;
					case 'resort':
						this.isSortable = true;
						this.tmpSort = {field: this.sortField, order: this.sortOrder};
						this.onSort('ordernum', 'desc');
						this.fields = [];
						break;
						
				}
			},
			
			stopResort() {
				this.onSort(this.tmpSort.field, this.tmpSort.order);
				this.isSortable = false;
			},
			
			onAction(action) {
	            let message = null;
				
				switch (action) {
					case 'delete': 
						message = this.$gettext('Вы уверены что хотите удалить эти товары?');
						break;
	            }
	            
	            let cb = () => {
	                this.$api.post('products/'+action, {product_ids: this.checkedRows}, this).then((data) => {
	                   	if (data.result == 'success') {
		                   	this.checkedRows = [];
						}
					});
				}
				
				if (message) {
					this.$confirm(message, 'is-danger').then(cb);
				} else {
					cb();
				}
			},
			
			refreshProducts(data) {
				if (data.product_ids != undefined) {
					this.merge(this.fields, 'product_id', data.product_ids, (ids, merge) => {
						this.$api.get('products/list', {filter: {product_ids: ids}}).then((data) => {
							this.fields = merge(data.response.products.fields);
						});
					});
				} else {
	                this.clearPages();
					this.fetchData(false, false);
				}
			},
			
			deleteProduct(data) {
				console.log(data);
				console.log(this.fields);
				let ids = this.checkIds(this.fields, 'product_id', data.product_ids);
				console.log(ids);
				
				if (ids.length) {
					this.next = this.current;
					this.fetchData(false, true);
				}
			},
			
			refreshColumns(data) {
				// Если новые колоники — подгружаем
				let is_updated = _.difference(data, this.columns).length;
				this.columns = data;
				if (is_updated) this.fetchData(false, true);
			},
			
			fetchData(withLoading, force) {
				let resolve = (data) => {
					if (this.isSortable) {
						this.fields = this.fields.concat(data.fields);
					} else {
						this.fields = data.fields
					}
					
					if (!this.columns) {
						this.columns = data.columns;
					}
				}
				
/*
				if (this.pages[this.page] != undefined) {
					resolve(this.pages[this.page]);
				} else {
*/
				if (force || !this.checkCache(resolve)) {
					this.isFetching = withLoading;
					this.$api.post(this.columns?'products/list':['products/list', 'products/columns/get'], {next: this.next, count: this.perPage, columns: this.columns, sort_field: this.sortField, sort_order: this.sortOrder, filter: this.isSortable?[]:this.filter, type: this.type}).then((data) => {
						this.cachePage(data.response.products, resolve);

						this.isFetching = false;
						this.isFiltering = false;
					}).catch((error) => {
	                    this.accesses = []
	                    this.total = 0
	                    this.isFetching = false
						this.isFiltering = false;
	                    throw error
	                })
				}
			},
			
            onFilter() {
	            this.isFiltering = true;
                this.clearPages();
	            this.fetchData(true);
            },

            clickRow(row) {
				this.$modal('vue-products-form', {product_id: row.product_id}, this);
			},
			
			onReSort(oldIndex, newIndex, oldItem, newItem) {
	            this.isFetching = true;
				this.$api.get('products/resort', {product_id: oldItem.product_id, index_product_id: newItem.product_id}, this).then((data) => {
		            this.isFetching = false;
				});
			},
		}, template: `
	<div>
		<vue-component-filterbox ref="filterbox" v-if="isAllow" :showToolbar="isSortable" @dropdown="onDropdown" :is-visible="fields.length" @action="onAction" @filter="onFilter" :disabled="isFetching" :selected="checkedRows" v-model="filter" :with-dropdown="true" :with-filters="true" :with-buttons="true">
			<template slot="toolbar">
				<a @click="stopResort" class="button is-dark"><i class="fal fa-check has-mr-2"></i> Завершить сортировку</a> 
			</template>

			<template slot="buttons">
				<a @click="clickRow({product_id: null})" class="button is-primary is-fullwidth" :class="{disabled: isReadonly}"><i class='fas fa-plus'></i><span class='is-hidden-touch has-ml-1'>{{'Новый товар'|gettext}} </span></a>
			</template>
			<template slot="dropdown">
				<b-dropdown-item value="view"><i class="fal fa-shopping-bag has-text-centered has-mr-1"></i> {{'Открыть магазин'|gettext}}</b-dropdown-item>
				<hr class="dropdown-divider">
				<b-dropdown-item value="columns"><i class="fas fa-bars fa-rotate-90 has-text-centered has-mr-1"></i> {{'Настроить колонки таблицы'|gettext}}</b-dropdown-item>
				<b-dropdown-item value="resort" class="is-hidden-touch"><i class="fal fa-arrows has-text-centered has-mr-1"></i> Настроить порядок товаров</b-dropdown-item>
				<b-dropdown-item value="import"><i class="fal fa-cloud-upload has-text-centered has-mr-1"></i> {{'Загрузить товары'|gettext}}</b-dropdown-item>
			</template>
			<template slot="actions">
	            <b-dropdown-item value="archive" v-if="type == 'active'"><i class="fa fa-archive has-text-centered has-mr-1"></i> {{'В архив'|gettext}}</b-dropdown-item>
	            <b-dropdown-item value="restore" v-if="type == 'archive'"><i class="fa fa-undo has-text-centered has-mr-1"></i> {{'Восстановить'|gettext}}</b-dropdown-item>
				<hr class="dropdown-divider" v-if="type == 'active'">
	            <b-dropdown-item value="delete" v-if="type == 'active'" class="has-text-danger"><i class="fa fa-trash-alt has-text-centered has-mr-1"></i> {{'Удалить'|gettext}}</b-dropdown-item>
			</template>
			<template slot="filters">
				<div class="row">
					<div class="col-xs-12 col-sm-4 has-mb-2">
						<label class="label">{{'Коллекции'|gettext}}</label>
						<vue-component-autocomplete-collections v-model="filter.collections" :allow-new="false" :placeholder="'Начните вводить название коллекции'|gettext"></vue-component-autocomplete-collections>
					</div>
					<div class="col-xs-12 col-sm-4 has-mb-2">
						<label class="label">{{'Цена'|gettext}}</label>
						<div class="row row-small">
							<div class="col-xs"><number v-model="filter.price.from" :precision="$account.currency.precision" class="input" :placeholder="'От'|gettext"></number></div>
							<div class="col-xs col-shrink has-text-grey" style="line-height: 2.45em">-</div>
							<div class="col-xs"><number v-model="filter.price.until" :precision="$account.currency.precision" class="input" :placeholder="'До'|gettext"></number></div>
						</div>
					</div>
					<div class="col-xs-12 col-sm-4 has-mb-2">
						<label class="label">{{'Свойства'|gettext}}</label>
						<vue-component-dropdown-checklist :list="dropdown_items" v-model="filter.properties" ></vue-component-dropdown-checklist>
					</div>
				</div>
			</template>
		</vue-component-filterbox>

		<div class="container has-mb-3" :class="{'has-mt-3': !isAllow}">
			
		<b-table :paginated="!isSortable" backend-pagination backend-sorting pagination-simple :data="fields" :loading="isFetching" :current-page="page" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" @click="clickRow" @sort="onSort" :draggable="isSortable" @dragstart="rowDragStart" :class="{'is-sortable': isSortable}" @drop="rowDrop" @dragover="rowDragOver" @dragleave="rowDragLeave" :hoverable="!isSortable" bordered v-if="columns">
			<b-table-column v-for="(column, index) in table_columns" :field="column.field" :label="column.label|gettext" :visible="column.visible" :numeric="column.numeric && index" :key="index" :sortable="column.sortable && !isSortable" :width="column.width" v-slot="props">
				<template v-slot:header="{ column }" v-if="!index">
					<b-checkbox @click.native.stop="onCheckAll($event, checkedRows)" v-if="!index && fields.length"></b-checkbox> {{ column.label }}
				</template>
				<div :class="[column.classname, {'has-text-grey-light': !props.row.is_visible}]">
					<b-checkbox @click.native.stop v-if="index == 0":disabled="isReadonly" :native-value="props.row.product_id" v-model="checkedRows"></b-checkbox>
					<span v-if="column.field == 'status'"><div class="tag has-tag-dot" :class="props.row.is_active?'is-success':'is-danger'">{{props.row.is_active?'Активный':'Не активный'|gettext}}</div></span>
					<span v-if="column.field == 'price'"> <span v-if="props.row.price_compare" class="has-text-grey-light has-text-strike">{{ props.row.price_compare|currency(currency_title) }}</span> {{ props.row.price|currency(currency_title) }} </span>
					<span v-if="column.field == 'title'"> <div class="has-text-danger is-pulled-right" v-if="!props.row.is_visible"><i class="fas fa-lock has-ml-1"></i></div> {{ props.row.title }} </span>
					<span v-if="column.field == 'weight'"> {{ props.row.weight|weight(true) }}</span>
					<span v-if="column.field == 'tms_created'"> {{ props.row.tms_created|datetime }} </span>
					<span v-if="column.field == 'collections'"> <div class="tags" v-f="props.row.collections"> <span class="tag is-light" v-for="c in props.row.collections">{{ c }}</span> </div> </span>
				</div>
			</b-table-column>
			
			<template slot="empty">
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
                    
                    <div v-if="isAllow && $refs.filterbox.hasFilter || filter.query">
	                    <i class="fal fa-search fa-5x has-text-grey-light"></i>
						<h3>{{'Ничего не найдено'|gettext}}</h3>
                    </div>
					<div v-else>
						<div class="row">
							<div class="col-xs-12 col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
								<div v-if="type == 'active'">
									<h3 class="has-p-2 has-text-grey-light has-text-centered has-mb-2"><i class="fal fa-boxes-alt has-text-grey-light" style="font-size: 5rem"></i></h3>
			<!-- 						<h3>{{'Товары'|gettext}}</h3> -->
									<div class="has-mb-2">{{'Список всех товаров, которые представлены в вашем магазине и доступны для заказа'|gettext}}</div>
									<a @click="clickRow({product_id: null})" class="button is-primary" :class="{disabled: isReadonly}" v-if="isAllow"><i class='fas fa-plus'></i><span class='has-ml-1'>{{'Новый товар'|gettext}} </span></a>
								</div>
								<div v-else>
									<h3 class="has-p-2 has-text-grey-light has-text-centered has-mb-2"><i class="fal fa-archive has-text-grey-light" style="font-size: 5rem"></i></h3>
									<div class="has-mb-2">{{'Снятые с продажи товары. Заказать товар из архива нельзя, но при необходимости любой товар из архива можно снова сделать активным'|gettext}}</div>
								</div>
							</div>
						</div>
	
						<div class="has-text-centered" v-if="!isAllow"><div class="tag is-danger" style="top: -1px;position: relative;">biz</div> <span class='has-text-danger'>{{'Доступно на business-тарифе'|gettext}}</span></div>
					</div>
                    
                </section>
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
	                <p>{{'Загрузка данных'|gettext}}</p>
                </section>
            </template>
		</b-table>

		</div>
	</div>
`});

window.$app.defineComponent("products", "vue-products-variants-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				isReadonly: false,
				query: '',
				values: {variant_title: '', variant_values: []}
			}
		},

		created() {
			this.isReadonly = !this.$auth.isAllowEndpoint('products/variants/set');
			if (this.variant_id) this.fetchData(true);
		},

		props: ['variant_id'],
		mixins: [FormModel],
		
		computed: {
			isUsed() {
				return _.findIndex(this.values.variant_values, {is_used: true}) != -1;
			}
		},

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('products/variants/get', {variant_id: this.variant_id}).then((data) => {
					this.isFetching = false;
					this.values = data.response.variant.values;
				});

			},
			
			updateData() {
				this.isUpdating = true;
				
				this.$api.post('products/variants/set', this.values, this).then((data) => {
					if (data.result == 'success') {
						this.$parent.close()
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			},
			
			deleteVariant() {
				this.$confirm(this.$gettext('Вы уверены что хотите удалить этот вариант? Вы не сможете её вернуть!'), 'is-danger').then(() => {
                    this.$api.post('products/variants/delete', {variant_id: this.variant_id}, this).then((data) => {
	                   	if (data.result == 'success') {
		                   	this.$parent.close();
						}
					});
				});				
			},
			
			onSelect(option) {
				this.selected = option;
			},
			
			onAddValue() {
				if (s = this.query.trim()) {
					_.each(s.split(','), (s) => {
						if (s.length && _.findIndex(this.values.variant_values, {value: s}) == -1) {
							let o = _.maxBy(this.values.variant_values, 'key');
							let key = (o == undefined)?0:(o.key+1);
							this.values.variant_values.push({key: key, value: s, is_busy: false});
							this.query = '';
							this.errors.variant_values = '';
						}
					})
				}
			},
			
			onRemoveValue(index) {
				this.values.variant_values.splice(index, 1);
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Глобальное свойство товара'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
			<section>
				<b-field :label="'Название'|gettext" :message="errors.variant_title" :class="{'has-error': errors.variant_title}">
	            	<b-input v-model="values.variant_title" :placeholder="'Укажите название свойства'|gettext" :disabled="isReadonly"></b-input>
				</b-field>
			</section>	
			<section>
				<div class="row row-small has-mb-2">
					<div class="col-xs">
						<b-field :message="errors.variant_values" :class="{'has-error': errors.variant_values}">
							<input v-model="query" class="input" :placeholder="'Укажите значение свойства'|gettext" :disabled="isReadonly" @keydown.enter="onAddValue"></input>
						</b-field>
					</div> 
					<div class="col-xs col-shrink">
						<button type="button" class="button is-success" @click="onAddValue" :disabled="isReadonly">{{'Добавить'|gettext}}</button> 
					</div> 
				</div>
				
				<mx-item class="is-hidden-mobile mx-item-header" v-if="values.variant_values.length">
					<div class="item-row row">
						<div class="col-sm">{{'Вариант'|gettext}}</div>
					</div>
				</mx-item>
				
				<mx-item v-for="(v, i) in values.variant_values">
					<div class="item-row row">
						<div class="col-xs"><input type='text' class='input variant-item' v-model="v.value" :disabled="isReadonly"></div>
						<div class="col-xs col-shrink"><button type="button" class="button has-text-danger is-text" :class="{disabled: isReadonly || v.is_used}" @click="onRemoveValue(i)" :disabled="isReadonly || v.is_used"><i class="fa fa-trash-alt"></i></button></div>
					</div>
				</mx-item>
				
			</section>
		</section>
		<footer class="modal-card-foot level">
			<div class="level-left">
				<button class="button level-item" @click="deleteVariant" v-if="!isReadonly && variant_id && !isUsed"><i class="fa fa-trash-alt"></i> {{'Удалить'|gettext}}</button>
			</div>
			<div class="level-right">
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Отмена'|gettext}}</button>
				<button class="button is-primary" :class="{'is-loading': isUpdating, disabled: isReadonly}" @click="updateData">{{'Сохранить'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("products", "vue-products-variants-list", {data() {
			return {
				isFetching: false,
				isFiltering: false,
				isReadonly: false,
				filter: {query: ''},
                sortField: 'variant_title',
                sortOrder: 'asc',
				perPage: 20,
				columns: ['variant_title', 'variant_values'],
				isAllow: this.$auth.isAllowTariff('business')
			}
		},
		
		mixins: [ListModel],

		created() {
			this.isReadonly = !this.$auth.isAllowEndpoint('products/variants/set');

			this.$io.on('events:products.variants.list:refresh', this.refreshvariants);
			this.$io.on('events:products.variants.list:delete', this.deletevariant);

			this.fetchData(true);
		},
		
		destroyed() {
			this.$io.off('events:products.variants.list:refresh', this.refreshvariants);
			this.$io.off('events:products.variants.list:delete', this.deletevariant);
		},

		
		computed: {
			columns_props() {
				if (!this.columns) return [];
				
				let columns = {
					variant_title: {label: 'Название', sortable: true, classname: 'has-text-nowrap has-width-25'},
					variant_values: {label: 'Варианты'},
				};
				
				let result = _.map(this.columns, (v) => {
					let r = columns[v];
					r.visible = true;
					r.field = v;
					return r;
				});
				
				for (var i = 0; i < 11 - this.columns.length; i++) result.push({visible: false});
				return result;
			}
		},

		methods: {
			refreshvariants(data) {
				if (data.product_ids != undefined) {
					this.merge(this.fields, 'variant_id', data.variant_ids, (ids, merge) => {
						this.$api.get('products/variants/list', {filter: {variant_ids: ids}}).then((data) => {
							this.fields = merge(data.response.variants.fields);
						});
					});
				} else {
					this.fetchData(false, true);
				}
			},
			
			deletevariant(data) {
				let ids = this.checkIds(this.fields, 'variant_id', data.variant_ids);
				if (ids.length) this.fetchData(false, true);
			},
			
			fetchData(withLoading, force) {				
				if (force || !this.checkCache()) {
					this.isFetching = withLoading;
					this.$api.get('products/variants/list', {next: this.next, count: this.perPage, sort_field: this.sortField, sort_order: this.sortOrder, filter: this.filter,}).then((data) => {
						this.cachePage(data.response.variants);
						this.isFetching = false;
						this.isFiltering = false;
					}).catch((error) => {
	                    this.accesses = []
	                    this.total = 0
	                    this.isFetching = false
						this.isFiltering = false;
	                    throw error
	                })
                }

			},
			
			onPageChange(page) {
                this.page = page;
                this.fetchData(true)
            },
            
            onFilter() {
	            this.isFiltering = true;
				this.clearPages();
	            this.fetchData(true);
            },

            clickRow(row) {
	            console.log('click');
				this.openForm(row.variant_id);
			},
			
			openForm(variant_id) {
				this.$modal('vue-products-variants-form', {variant_id: variant_id}, this);
			}
		}, template: `
	<div>
		<vue-component-filterbox ref="filterbox" v-if="isAllow" @filter="onFilter" v-model="filter" :is-visible="fields.length" :disabled="isFetching" :with-buttons="true">
			<template slot="buttons">
				<button class="button" @click="openForm(null)" class="button is-primary is-fullwidth" :class="{disabled: isReadonly}"><i class='fa fa-plus'></i><span class='is-hidden-touch has-ml-1'>{{'Добавить свойство'|gettext}}</span></button>
			</template>
		</vue-component-filterbox>
		
		<div class="container has-mb-3" :class="{'has-mt-3': !isAllow}">
		<b-table paginated backend-pagination backend-sorting pagination-simple :data="fields" :loading="isFetching" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" @click="clickRow" @sort="onSort" hoverable bordered>
			
			<b-table-column v-for="(column, index) in columns_props" :field="column.field" :label="column.label|gettext" :class="column.classname" :numeric="column.numeric" :key="index" :visible="column.visible" :sortable="column.sortable" :width="column.width" v-slot="props">
				<div v-if="column.field == 'variant_title'">{{ props.row.variant_title }}</div>
				<div v-if="column.field == 'variant_values'"><div class="tags"> <span class="tag is-light" v-for="c in props.row.variant_values">{{ c }}</span> </div></div>
			</b-table-column>
			
			<template slot="empty">
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
	                <div v-if="isAllow && $refs.filterbox.hasFilter || filter.query">
	                    <i class="fal fa-search fa-5x has-text-grey-light"></i>
						<h3>{{'Ничего не найдено'|gettext}}</h3>
	                </div>
	                <div v-else>
						<div class="row">
							<div class="col-xs-12 col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
		<!-- 					<h3>{{'Глобальные свойства'|gettext}}</h3> -->
								<h3 class="has-p-2 has-text-grey-light has-text-centered has-mb-2"><i class="fal fa-swatchbook has-text-grey-light" style="font-size: 5rem"></i></h3>
								
			 					<div class="has-mb-2">{{'Глобальные свойства содержат наборы "вариантов", которые в один клик могут быть добавлены к любому товару магазина. Через глобальные свойства удобно размещать размерную сетку или иные параметры, выбор которых покупателем актуален более чем для одного товара вашего ассортимента.'|gettext}}</div>
			 					<button class="button" @click="openForm(null)" class="button is-primary" :class="{disabled: isReadonly}" v-if="isAllow"><i class='fa fa-plus'></i> {{'Добавить свойство'|gettext}}</button>
			 					<div class="has-text-centered" v-else><div class="tag is-danger" style="top: -1px;position: relative;">biz</div> <span class='has-text-danger'>{{'Доступно на business-тарифе'|gettext}}</span></div>
							</div>
						</div>
	                </div>
                </section>
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
	                <p>{{'Загрузка данных'|gettext}}</p>
                </section>
            </template>
            	        
		</b-table>
		</div>
	</div>
`});
window.$app.defineModule("products", [{ path: '/:page_id/products/active/', component: 'vue-products-list', meta: {title: 'Активные'}, props: {type: 'active'}, name: 'products.active'},
{ path: '/:page_id/products/archive/', component: 'vue-products-list', meta: {title: 'Архив'}, props: {type: 'archive'}, name: 'products.archive'},
{ path: '/:page_id/products/collections/', component: 'vue-products-collections-list', meta: {title: 'Коллекции'}, props: true, name: 'products.collections'},
{ path: '/:page_id/products/variants/', component: 'vue-products-variants-list', meta: {title: 'Свойства'}, props: true, name: 'products.variants'},
{ path: '/:page_id/products/promocodes/', component: 'vue-products-discounts-list', meta: {title: 'Промокоды'}, props: {type: 'promocode'}, name: 'products.promocodes'},
{ path: '/:page_id/products/discounts/', component: 'vue-products-discounts-list', meta: {title: 'Акции'}, props: {type: 'automatic'}, name: 'products.discounts'}]);