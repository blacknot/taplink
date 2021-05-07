
window.$app.defineComponent("pages", "vue-pages-blocks-form-addons", {props: {disabled: {type: Boolean, default: false}, values: Object, variants_block: {type: Object, default: []}, variants_addons: {type: Object, default: []}, block_id: Number, block_type_id: Number, loading: {type: Boolean, default: false}, addons: {type: Object, default: null}, addonsLoadingEndpoint: {type: String, default: "pages/blocks/addons"}, addons_values: Object, parent: Object},
		
		watch: {
			values: {
				handler() {
					this.checkFields();
				},
				deep: true
			}
		},		
		
		created() {
			if (this.addonsLoadingEndpoint && (this.addons == null)) {
				this.loading = true;
				this.$api.get(this.addonsLoadingEndpoint, {block_id: this.block_id, block_type_id: this.block_type_id}).then((data) => {
					if (data.result == 'success') {
						let b = data.response.pages.block;
						this.addons = b.addons;

						_.each(b.addons_fields, (b, k) => {
							this.values.fields_extended.push({title: k, fields: b});
						})

						this.variants_addons = (b.variants.addons != undefined)?b.variants.addons:{};
// 						if (this.variants) this.variants_block = this.variants;
	
						_.each(b.addons_values, (v, k) => {
							this.$set(this.addons_values, k, v);
// 							this.$set(this.addons_values[k], 'options', {a:'1', slots: {}});
						});

// 						this.addons_values = b.addons_values;
						this.checkFields();
						
						if (b.addons.phrases) window.i18n.extend(b.addons.phrases);
						
						
// 						this.$emit('update:addons_values', this.addons_values);
					}
					this.loading = false;
				}).catch(() => {
					this.loading = false;
				})
			}
		},
			
		methods: {
			chooseAddon(addon_id) {
// 				if (this.addons_values[addon_id].options == undefined) this.$set(this.addons_values[addon_id], 'options', {});
				this.checkFields();
			},
			
			checkFields() {
				// Для формы и магазина
				if (this.values.fields != undefined) {
					let idxs = _.map(this.values.fields, (v) => { return v.idx; });
	
					_.each(this.values.fields_extended, e => {
						_.each(e.fields, f => idxs.push(f.idx));
					});
	
					_.each(this.addons_values, (v) => {
						if (v.options != undefined && v.options.fields != undefined) {
							for (i = 0; i < v.options.fields.length; i++) {
								if (idxs.indexOf(v.options.fields[i].idx) == -1) v.options.fields[i].idx = null;
							}
						}
					});
				}
				
				if ([3, 6, 2, 15].indexOf(this.block_type_id) != -1) {
					_.each(this.addons_values, (v, k) => {
						if (v.on && _.intersection(['link', 'banner', 'socialnetworks', 'messenger'], this.addons.addons[k].target).length) {
							if (v.options == undefined) v.options = {};
							if (v.options.slots == undefined) v.options.slots = {};
						}
					});
				
					// Социальные сети и мессенджеры - подготавливаем слоты
					if (this.block_type_id == 3 || this.block_type_id == 6) {
						_.each(this.addons_values, (v, k) => {
							if (v.options == undefined) this.$set(v, 'options', {});
							if ((v.options.slots == undefined) || !_.size(v.options.slots)) this.$set(v.options, 'slots', {});
						});
						
						let list = {};
						_.each(this.variants_block.list, (w) => {
							_.each(w.items, (v, k) => list[k] = v);
						});
						
						this.$set(this.variants_block, 'slots', {});
						
						_.each(this.values.items, v => {
							this.$set(this.variants_block.slots, v.n, list[v.n].title);
						});
					}
					
					if (this.block_type_id == 2 || this.block_type_id == 15) { // Link, Banner
						this.$set(this.variants_block, 'slots', {link: ''});
					}
				}
			},
			
			loadEntry(name) {
				name = 'vue-addons-addon-'+name+'-entry';
				window.$app.loadComponent(name);
				return name;
			},
			
			getVariants(addon_name) {
				return (this.variants_addons[addon_name] != undefined)?this.variants_addons[addon_name]:{};
			}
		}, template: `
<section class="modal-card-body-blocks">
	<section class="message is-warning" v-if="addons && addons.addons_amount">
		<div class="message-body"><slot name="message"></slot></div>
	</section>
	<section>
		<div v-if="addons && addons.addons_amount">
			<div class="label-pro-container">
				<div v-for="(f, addon_id) in addons.addons" v-if="f.addon_id != undefined" class="form-fields-item" :class="{in: (addons_values[addon_id] != undefined) && addons_values[addon_id].on, disabled: f.is_active == 0 || disabled}">
					<div class="form-fields-item-title">
						<span style="margin-left: 0">
							<b-checkbox v-model="addons_values[addon_id].on" :disabled="f.is_active == 0 || disabled" @input="chooseAddon(addon_id)"><b>{{f.addon_title}}</b></b-checkbox>
						</span>
					</div>
					<div class="form-fields-item-options" v-if="f.is_has_options && (addons_values[addon_id] != undefined) && addons_values[addon_id].on && f.is_active != 0">
						<component v-bind:is="loadEntry(f.addon_name)" :values="values" :addons="addons" :addon="f" :variants="getVariants(f.addon_name)" :variants_block="variants_block" :options.sync="addons_values[addon_id].options"></component>
					</div>
				</div>
			</div>
		</div>
		<div v-else class="has-pt-4 has-pb-4 has-text-centered" :class="{disabled: disabled}">
			<div class="has-mb-2"><i class="fa fal fa-cog fa-5x has-text-grey-light" :class="{'is-invisible': loading}"></i></div>
			<div v-if="loading" class="has-text-grey">{{'Загрузка данных'|gettext}}</div>
			<div v-else><slot name="empty"></slot></div>
			<router-link v-if="!loading" :to="{name: 'addons'}" @click.native="parent.close()">{{'Посмотреть доступные модули'|gettext}}</router-link>
		</div>
		<b-loading :is-full-page="false" :active.sync="loading"></b-loading>
	</section>
</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-form-animations", {data() {
			return {
				has_animation: false,
				last_animation: 'blink'
			}
		},
		
		props: ['values', 'info', 'variants'],
		
		created() {
			this.has_animation = (this.values.animation != '');
			if (this.has_animation) this.last_animation = this.values.animation;
		},
		
		watch: {
			has_animation(v) {
				if (!this.values.animation && v) this.values.animation = this.last_animation;
				if (!v) { 
					this.last_animation = this.values.animation;
					this.values.animation = '';
				}
			}
		}, template: `
	<div>
		<div class="has-mb-2">
			<mx-toggle v-model="has_animation" :title="'Анимация'|gettext" :disabled="info.is_readonly"></mx-toggle>
		</div>
		
		<div class="buttons-chooser-list is-animation has-mb-2 row row-small" v-if="has_animation">
			<div v-for="(v, id) in variants.animations" class="col-xs-6 col-sm-4 col-md-4">
				<div class="buttons-chooser" :class="[{in: values.animation == id, 'has-animation': values.animation == id}, (values.animation == id)?('has-animation-'+id):'']" @click="values.animation = id">{{v}}</div>
			</div>
		</div>
	</div>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-form-design-link", {props: ['values', 'info'],
		
		created() {
			let theme = this.$account.theme;
			if (!this.values.text) this.values.text = theme.link.color;
			if (!this.values.subtitle) this.values.subtitle = theme.link.subtitle.color;
			if (!this.values.bg) this.values.bg = theme.link.bg;
		}, template: `
	<div class="label-pro-container">
		<div class="tag is-pro" v-if="!$auth.isAllowTariff('pro')" v-tippy :content="'Эта возможность доступна<br>на pro тарифе'|gettext">pro</div>

		<div :class="{disabled: !$auth.isAllowTariff('pro')}">
			<div class="has-mb-2"><mx-toggle v-model='values.on' :title="'Свои настройки дизайна'|gettext" :disabled="info.is_readonly"></mx-toggle></div>
		
			<div v-if="values.on">
				<div class="has-mb-2">
					<vue-component-colorpicker v-model="values.bg" :label="'Цвет фона ссылки'|gettext" :disabled="info.is_readonly" :colors="[$account.theme.link.bg]"></vue-component-colorpicker>
				</div>
				<div class="has-mb-2">
					<vue-component-colorpicker v-model="values.text" :label="'Цвет заголовка ссылки'|gettext" :disabled="info.is_readonly" :colors="[$account.theme.link.color]"></vue-component-colorpicker>
				</div>
				<div class="has-mb-2">
					<vue-component-colorpicker v-model="values.subtitle" :label="'Цвет подзаголовка ссылки'|gettext" :disabled="info.is_readonly" :colors="[$account.theme.link.subtitle.color]"></vue-component-colorpicker>
				</div>
				<slot></slot>				
			</div>
		</div>
	</div>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-form-design", {props: ['values', 'info'],
		
		created() {
			let theme = this.$account.theme;
			if (!this.values.text) this.values.text = theme.link.color;
			if (!this.values.bg) this.values.bg = theme.link.bg;
		}, template: `
	<div class="label-pro-container">
		<div class="tag is-pro" v-if="!$auth.isAllowTariff('pro')" v-tippy :content="'Эта возможность доступна<br>на pro тарифе'|gettext">pro</div>

		<div :class="{disabled: !$auth.isAllowTariff('pro')}">
			<div class="has-mb-2"><mx-toggle v-model='values.on' :title="'Свои настройки дизайна'|gettext" :disabled="info.is_readonly"></mx-toggle></div>
		
			<div v-if="values.on">
				<div class="has-mb-2">
					<vue-component-colorpicker v-model="values.bg" :label="'Цвет фона кнопки'|gettext" :disabled="info.is_readonly" :colors="[$account.theme.link.bg]"></vue-component-colorpicker>
				</div>
				<div class="has-mb-2">
					<vue-component-colorpicker v-model="values.text" :label="'Цвет текста кнопки'|gettext" :disabled="info.is_readonly" :colors="[$account.theme.link.color]"></vue-component-colorpicker>
				</div>
				<slot></slot>				
			</div>
		</div>
	</div>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-form-modal", {data() {
			return {
				isUpdating: false,
				isDeleting: false,
				isFetching: false,
				isFetchingBlockType: null,
				canDelete: false,
				tabs: [],
				defaultsTabs: [],
				currentTab: 'common',
				currentBlock: null,
				tariff: null,
				values: {},
				options: {},
				variants: {},
				section: {on: false},
				block: {title: null},
				permit: {},
				archives: [],
				archivesLoaded: false,
				info: {},
				types: [],
				typesKeys: [],
				isAnimatedTariff: false,
				allowSave: true,
				block_type_id: null,
				addons_values: {}
			}
		},

		created() {
			if (this.block_id) {
				this.fetchData(true);
			} else {
				this.defaultsTabs = this.tabs = [{name: 'common', title: this.$gettext('Стандартные блоки')},{name: 'archives', title: this.$gettext('Из архива')}];

				if ((this.$account.tips_bits & 16) == 0) {
					$mx.get('/api/account/updatetipsbits.json?bit=16');
					this.$account.tips_bits |= 16;
				}

				this.types = this.$account.blocks;
				this.typesKeys = [];
				_.each(this.types, (o) => {
					this.typesKeys[o.block_type_id] = o;
				})

/*
				this.isFetching = true;
				for (var i = 0; i < 15; i++) this.types.push({icon: '<svg></svg>'});
				this.$api.get(['pages/blocks/types', 'pages/blocks/archives']).then((data) => {
					this.types = data.response.pages.blocks.types;
					this.archives = data.response.pages.blocks.archives;
					this.isFetching = false;
					
					this.typesKeys = [];
					_.each(this.types, (o) => {
						this.typesKeys[o.block_type_id] = o;
					})
				});
*/
			}
		},
		
		watch: {
			currentTab(name) {
				let current = 0;
				for (current = 0; current < this.tabs.length; current++) if (this.tabs[current].name == name) break;
				let o = this.$refs.menu.children[current];
				scrollIt(o.offsetLeft - ((this.$refs.menu.offsetWidth - o.offsetWidth) / 2), 'x', this.$refs.menu, 300)
				
				if (name == 'archives' && !this.archivesLoaded) {
					this.isFetching = true;
					this.$api.get('pages/blocks/archives').then((data) => {
						this.archives = data.response.pages.blocks.archives;
						this.isFetching = false;
						this.archivesLoaded = true;
					});
				}
			}
		},
		
		computed: {
			isChoosingForm() {
				return !this.block_type_id && !this.block_id && this.$device.mobile;
			},
			
			ratePlanLink() {
				return window.base_path_prefix+'/tariffs/';
			},
			
			isAllowTariff() {
				return this.$auth.isAllowTariff(this.tariff);
			}
		},
		
		props: ['block_id', 'page_id', 'before_block_id', 'before_section_id'],
		mixins: [FormModel],

		methods: {
			setTabs(tabs) {
				let defaults = {
					options: {name: 'options', title: this.$gettext('Настройки')},
					addons: {name: 'addons', title: this.$gettext('Модули')},
					section: {name: 'section', title: this.$gettext('Секция')},
					statistics: (this.block_id && this.info.is_allow_statistics)?{name: 'statistics', title: this.$gettext('Статистика')}:null
				}
				
				this.tabs = _.filter(_.map(tabs, v => (typeof v == 'string')?defaults[v]:v));
			},
			
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('pages/blocks/get', {block_id: this.block_id}).then((data) => {
					this.isFetching = false;
					let block = data.response.pages.block;
					
					this.permit = block.permit;
					this.values = block.values;
					this.section = block.section;
					this.options = block.options;
					
					this.variants = block.variants;
					this.tariff = block.tariff;
					this.info = block.info;
					
					this.page_id = block.page_id;
					this.block_type_id = block.block_type_id;
					
					if (!this.$auth.isAllowTariff(block.tariff))  {
						this.info.is_readonly = true;
						this.canDelete = true;
					}
					
					this.currentBlock = 'vue-pages-blocks-'+block.block_type_name;
				});
			},
			
			close() {
				this.$parent.close()
			},
			
			action(name, params) {
				return this.$api.get('pages/blocks/action', {block_id: this.block_id, name: name, params: params}, this);
			},
			
			chooseType(f) {
				this.isFetchingBlockType = f.block_type_id;
				this.$api.get('pages/blocks/info', {block_type_id: f.block_type_id}).then((data) => {
					this.isFetchingBlockType = null;
					let block = data.response.pages.block;
					
					this.variants = block.variants;
					this.values = block.defaults.values;
					this.section = {id: null};
					this.options = block.defaults.options;
					this.block_type_id = block.block_type_id;
					
					this.info = block.info;
					this.tariff = block.tariff;
					
					if (!this.$auth.isAllowTariff(block.tariff)) this.info.is_readonly = true;
					
					this.currentBlock = 'vue-pages-blocks-'+block.block_type_name;
				});				
			},
			
			back() {
				this.currentBlock = null;
				this.currentTab = 'common'
				this.block_type_id = null;
				this.tariff = null;
				this.tabs = this.defaultsTabs;
				this.info = [];
				this.values = [];
				this.addons_values = {};
				this.variants = {};
			},
			
			restoreBlock(block_id) {
				this.isUpdating = true;
				this.$api.get('pages/blocks/restore', {block_id: block_id, page_id: this.page_id}, this).then((response) => {
					this.isUpdating = false;
					if (response.result == 'success') {
						this.$parent.close();
					}
				}).catch(() => {
					this.isUpdating = false;
				})	
			},
			
			onAction(v) {
				switch (v) {
					case 'delete':
						this.deleteBlock('delete');
						break;
					case 'archive':
						this.deleteBlock('archive');
						break;
					case 'clone':
						this.cloneBlock();
						break;
				}
			},
			
			cloneBlock() {
				this.isUpdating = true;
				this.$api.get('pages/blocks/clone', {block_id: this.block_id}, this.$refs.model).then((response) => {
					this.isUpdating = false;
					if (response.result == 'success') {
						this.$parent.close();
					}
				});
			},
			
			deleteBlock(method) {
				this.$confirm((method == 'delete')?this.$gettext('Вы уверены что хотите удалить этот блок?'):this.$gettext('Вы уверены что хотите отправить этот блок в архив?'), (method == 'delete')?'is-danger':'is-warning').then(() => {
					this.isDeleting = true;
					
					this.$api.get('pages/blocks/'+method, {block_id: this.block_id}, this.$refs.model).then((response) => {
						this.isDeleting = false;
						if (response.result == 'success') {
							this.$parent.close();
						}
					}).catch(() => {
						this.isDeleting = false;
					})
				});
			},
			
			save() {
				this.isUpdating = true;
				
				let values = this.$refs.model.prepareValues();
				let section = this.$refs.section.prepareValues();
				
// 				values = _.differenceWith(values, BlocksFactory.getDefaults(this.block_type_id));
// 				if (values.design != undefined && !values.design.on) delete values.design;
				
				this.$api.post('pages/blocks/set', {block_id: this.block_id, page_id: this.page_id, before_block_id: this.before_block_id, before_section_id: this.before_section_id, block_type_id: this.block_type_id, values: values, options: this.options, addons_values: this.addons_values, section: section}, this.$refs.model).then((data) => {
					this.isUpdating = false;
					if (data.result == 'success') {
						this.$parent.close();
						if (!this.block_id && data.response.block_id) this.$parent.$parent.scrollToBlock(data.response.block_id);
					} else {
						if (this.$refs.model.showErrors != undefined) this.$refs.model.showErrors(data);
					}
				}).catch(() => {
					this.isUpdating = false;
				})	

			},
			
			scrollToTariff() {
				if (!this.isAllowTariff) {
					let m = this.$refs.tariffMessage;
					
					scrollIt(0, 'y', $mx(m).closest('.modal')[0], 400);
					
					this.isAnimatedTariff = true;
					setTimeout(() => {
						this.isAnimatedTariff = false;
					}, 1000);
				}
			}
		}, template: `
	<div class="modal-card is-choosing-form" :class="{'modal-view': isChoosingForm}">
		<header class="modal-card-head">
			<p class="modal-card-title" v-if="block.title">{{block.title}}</p>
			<p class="modal-card-title" v-else-if="isFetching">{{'Загрузка'|gettext}}</p>
			<p class="modal-card-title" v-else>{{'Новый блок'|gettext}}</p>
			
<!-- 			<vue-component-help-button /> -->
			<button class="modal-close" :class="{'is-small': isChoosingForm, 'is-large': !isChoosingForm}" @click="$parent.close()"></button>
		</header>

		<ul class="nav nav-tabs nav-tabs-scroll has-text-left" v-if="tabs.length > 1" ref="menu">
			<li v-for="(tab, index) in tabs" :class="{active: currentTab == tab.name}"><a @click="currentTab = tab.name">{{tab.title|gettext}}</a></li>
		</ul>
		<section class="message is-danger" style="flex-shrink: 0;flex-grow: 0" v-if="!isAllowTariff">
			<div class="message-body" :class="{'shake animated': isAnimatedTariff}" ref="tariffMessage"><span v-if="tariff == 'pro' || tariff == 'plus'">{{'Доступно на pro-тарифе'|gettext}}</span><span v-if="tariff == 'business'">{{'Доступно на business-тарифе'|gettext}}</span> <a :href='ratePlanLink' target="_blank" class='is-pulled-right'>{{'Подробнее'|gettext}} <i class="fa fa-angle-right" style="margin-left: 5px"></i></a></div>
		</section>
		
		<component v-bind:is="currentBlock" ref='model' :values="values" :options="options" :section.sync="section" :variants="variants" :info="info" :block_id="block_id" :block_type_id="block_type_id" :block="block" :current-tab="currentTab" :tabs="tabs" @update:tabs="setTabs($event)" v-if="currentBlock" :parent="$parent" :allowSave.sync="allowSave">
			<template>
				<vue-pages-blocks-form-section v-model="section" ref="section" :disabled="info.is_readonly" :class="{'is-hidden': currentTab != 'section'}"></vue-pages-blocks-form-section>
				
				<keep-alive>
					<vue-pages-blocks-form-addons v-if="currentTab == 'addons'" :block_id="block_id" :block_type_id="block_type_id" :values="values" :variants_block="variants" :addons_values.sync="addons_values" :disabled="info.is_readonly" :parent="parent" @click="$parent.scrollToTariff">
						<template slot="message">{{'Вы можете выбрать модули которые будут срабатывать для данной формы'|gettext}}</template>
						<template slot="empty">{{'Модули для данного блока еще не подключены'|gettext}}</template>
					</vue-pages-blocks-form-addons>
				</keep-alive>
				
				<keep-alive>
					<vue-pages-blocks-form-statistics v-if="currentTab == 'statistics'" :page_id="values.page_id" :block_id="block_id"></vue-pages-blocks-form-statistics>
				</keep-alive>
			</template>
		</component>
		
		<section class="modal-card-body" v-if="!currentBlock && currentTab == 'common'">
			<div class="row row-small" style="margin-bottom: -1rem">
				<div class="col-sm-4 col-xs-6 has-mb-2" v-for="f in types" v-if="f.page_types == null || f.page_types.indexOf($page.data.page.page_type) != -1"><button @click="chooseType(f)" class="button is-block-button is-default btn-block" :class="{'is-loading': isFetchingBlockType && isFetchingBlockType == f.block_type_id}" :disabled="isFetching || isFetchingBlockType">

					<div v-if="!$auth.isAllowTariff(f.tariff) && (f.tariff == 'pro' || f.tariff == 'plus')" class="tag is-pro" v-tippy :content="'Этот блок доступен<br>на pro-тарифе'|gettext">pro</div>
					<div v-if="!$auth.isAllowTariff(f.tariff) && (f.tariff == 'business')" class="tag is-danger is-business" v-tippy :content="'Этот блок доступен<br>на business-тарифе'|gettext">biz</div>

					<div v-html="f.icon"></div>
					<div>{{f.block_type_title|gettext}}</div>
				</button></div>
			</div>
		</section>	
		
		<section class="modal-card-body" v-if="!currentBlock && currentTab == 'archives'">
			<div v-if="!archives.length" class="has-text-centered has-text-grey">
				<i class="fal fa-archive has-text-grey-light has-mt-2 has-mb-2 fa-4x"></i>
				<div>{{'Пока ничего нет'|gettext}}</div>
			</div>
			<button class="button btn-block is-fullwidth has-p-2" :class="{'has-mt-2': i}" style="justify-content: space-between" v-for="(f, i) in archives" @click="restoreBlock(f.block_id)">
			<span class="has-mr-1" style="display: flex;align-items: center;overflow:hidden">
			<span v-html="typesKeys[f.block_type_id].icon" class="is-block-button is-archive"></span>
				{{typesKeys[f.block_type_id].block_type_title|gettext}}<span class="has-ml-1" style="white-space: nowrap;overflow: hidden;text-overflow: ellipsis;opacity:.4" v-if="f.title">— {{f.title}}</span></span>
			<span class="has-text-grey">{{f.tms_archived|date}}</span>
			</button>
		</section>	

		<footer class="modal-card-foot level" v-if="currentBlock">
			<div class="level-left">
				<vue-component-action-button v-if="block_id && (!info.is_readonly || canDelete)" @action="onAction" :title="'Действие'|gettext">
					<template slot="actions">
						<b-dropdown-item value="clone"><i class="fa fa-clone"></i> {{'Дублировать'|gettext}}</b-dropdown-item>
						<hr class="dropdown-divider" aria-role="menuitem">
						<b-dropdown-item value="archive" v-if="info.permit.can_archive"><i class="fa fa-archive"></i> {{'В архив'|gettext}}</b-dropdown-item>
						<hr class="dropdown-divider" aria-role="menuitem" v-if="info.permit.can_archive">
						<b-dropdown-item value="delete" class="has-text-danger" :class="{disabled: !info.permit.can_delete}"><i class="fa fa-trash-alt"></i> {{'Удалить'|gettext}}</b-dropdown-item>
					</template>
				</vue-component-action-button>

				
<!--
				<button v-if="values.block_id && (!info.is_readonly || canDelete) && permit.can_delete" class="button is-default has-text-danger" :class="{'is-loading': isDeleting}" @click="deleteBlock('delete')"><i class="fa fa-trash-alt"></i><span class="is-hidden-mobile"> {{'Удалить'|gettext}}</span></button>
				<button v-if="values.block_id && (!info.is_readonly || canDelete) && permit.can_archive && ($auth.isAllowTariff('pro') || values.block_id)" class="button is-default" :class="{'is-loading': isDeleting}" @click="deleteBlock('archive')"><i class="fa fa-archive"></i>{{'В архив'|gettext}}</button>
-->

<!-- 				<button v-if="currentBlock && !block_id" class="button is-default is-pulled-left" @click="back"><i class="fa fa-angle-left has-mr-2"></i>{{'Назад'|gettext}}</button> -->
			</div>

			<div class="level-right">
				<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="save" :disabled="info.is_readonly || !allowSave">{{'Сохранить'|gettext}}</button>
			</div>
		</footer>
		
		<footer class="modal-card-foot" v-if="!currentBlock" :class="{'is-hidden-mobile': isChoosingForm}">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("pages", "vue-pages-blocks-form-options", {data() {
			return {
				schedule_days: [],
				date_from: null,
				date_until: null,
				time_from: null,
				time_until: null,
				allowPro: false,
				first_day_week: this.$getFirstDayWeek(),
				weekdays: this.$getDaysNames(),
			}
		},
		
		props: ['values', 'info', 'variants'],
		
		computed: {
			weekdays_schedule() {
				let r = [];
				if (!this.first_day_week) r.push({index: 6, weekday: this.weekdays[0]});
				for (var i = 1; i < 7; i++) r.push({index: i-1, weekday: this.weekdays[i]});
				if (this.first_day_week) r.push({index: 6, weekday: this.weekdays[0]});
				
				return r;
			},
			
			daysSummary() {
				let d = this.schedule_days;
				if (d.length == 7) return this.$gettext('Каждый день');
				if (d.length == 5 && (d.indexOf(5) == -1) && (d.indexOf(6) == -1)) return this.$gettext('Будние дни');
				if (d.length == 2 && (d.indexOf(5) != -1) && (d.indexOf(6) != -1)) return this.$gettext('Выходные дни');
				return '';
			}
		},
		
		watch: {
			time_from() {
				this.onInputDates();
			},

			time_until() {
				this.onInputDates();
			}
		},

		created() {
			let parse = (d) => {
				d = d.split('-');
				return new Date(d[0], d[1]-1, d[2]);
			}
			
			this.allowPro = this.$auth.isAllowTariff('pro');
			this.date_from = this.values.date_from?parse(this.values.date_from):null;
			this.date_until = this.values.date_until?parse(this.values.date_until):null;
			
			if (this.values.time_from)
			{
				let dt = this.values.time_from.split(':')
				this.time_from = new Date(0, 0, 0, dt[0], dt[1]);
			}

			if (this.values.time_until)
			{
				let dt = this.values.time_until.split(':')
				this.time_until = new Date(0, 0, 0, dt[0], dt[1]);
			}
			
			for (var i = 0; i < 7; i++) if (this.values.schedule_days & Math.pow(2, i)) this.schedule_days.push(i);
		},
		
		methods: {
			onInputDates() {
				this.values.date_from = this.date_from?date_format('Y-m-d', this.date_from):null;
				this.values.date_until = this.date_until?date_format('Y-m-d', this.date_until):null;
				
				this.values.time_from = this.time_from?date_format('H:i', this.time_from):null;
				this.values.time_until = this.time_until?date_format('H:i', this.time_until):null;
				
				this.values.schedule_days = _.reduce(this.schedule_days, (v, i) => { return v + Math.pow(2, i)}, 0);
			}
		}, template: `
	<div>
		<div class="has-mb-2">
			<mx-toggle v-model="values.is_visible" :title="'Скрыть блок'|gettext" :disabled="info.is_readonly" :invert="true"></mx-toggle>
		</div>
		
		<div class="label-pro-container">
		<div v-if="!allowPro" class="tag is-pro" v-tippy :content="'Эта возможность доступна<br>на pro тарифе'|gettext">pro</div>
		<div :class="{disabled: !values.is_visible}">
		<div class="has-mb-2">
			<mx-toggle v-model="values.is_schedule" :title="'Показывать по расписанию'|gettext" :disabled="info.is_readonly || !allowPro"></mx-toggle>
		</div>
		
		<div class="has-mb-2" v-if="values.is_schedule">
			<div class="row row-small has-mb-1">
				<label class="label col-xs-2 col-sm-1"><p class="form-control-static">{{'От'|gettext}}:</p></label>
				<div class="col-xs-7 col-sm-8">
					<vue-component-datepicker v-model="date_from" icon="calendar-alt" @input="onInputDates" :disabled="!values.is_schedule || info.is_readonly"></vue-component-datepicker>
				</div>
				<div class="col-xs-3">
					<div class="has-feedback">
						<b-clockpicker icon="clock" v-model="time_from" :disabled="!values.is_schedule || info.is_readonly" hour-format="24"></b-clockpicker>
						<a class="form-control-feedback has-text-grey-light" @click="time_from = null" :class="{disabled: info.is_readonly}" v-if="time_from"><i class="fal fa-times"></i></a>	
					</div>
				</div>
			</div>
			
			
			<div class="row row-small">
				<label class="label col-xs-2 col-sm-1"><p class="form-control-static">{{'До'|gettext}}:</p></label>
				<div class="col-xs-7 col-sm-8">
					<vue-component-datepicker v-model="date_until" @input="onInputDates" :disabled="!values.is_schedule || info.is_readonly"></vue-component-datepicker>
				</div>
				<div class="col-xs-3">
					<div class="has-feedback">
						<b-clockpicker icon="clock" v-model="time_until" :disabled="!values.is_schedule || info.is_readonly" hour-format="24"></b-clockpicker>
						<a class="form-control-feedback has-text-grey-light" @click="time_until = null" :class="{disabled: info.is_readonly}" v-if="time_until"><i class="fal fa-times"></i></a>	
					</div>
				</div>
			</div>
		</div>
		
		<div>
			<mx-toggle v-model="values.is_schedule_days" :title="'Показывать по дням недели'|gettext" :disabled="info.is_readonly || !allowPro"></mx-toggle>
		</div>
		
		<div class="has-mt-2 form-horizontal" v-if="values.is_schedule_days">
			<div class="row row-small">
			<label class="label col-xs-2 col-sm-1 is-hidden-mobile"><p class="form-control-static">{{'Дни'|gettext}}:</p></label>
			<div class="col-xs-12 col-sm is-flex schedule-days-chooser">
				<b-field :class="['is-marginless', {disabled: !values.is_schedule_days}]">
					<b-checkbox-button v-for="w in weekdays_schedule" v-model="schedule_days" :native-value="w.index" type="is-dark" @input="onInputDates" class="choose-days">{{w.weekday|gettext}}</b-checkbox-button>
				</b-field>
				<p class="form-control-static has-text-grey has-sm-ml-1">{{daysSummary}}</p>
			</div>
			</div>
		</div>
		
		</div>
		</div>
	</div>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-form-section", {props: {value: Object, disabled: Boolean},
		
		data() {
			return {
				base: null 
			}
		},
		
		watch: {
			value(v) {
				//this.checkValue(v);
			}
		},
		
		created() {
			this.checkValue(this.value);
		},
		
		computed: {
			disallow() {
				return this.disabled || !this.$auth.isAllowTariff('pro');
			},
			
			disallowElements() {
				return this.disallow || !this.value.id;
			}
		},
		
		methods: {
			checkValue(v) {
				if (!v.id && _.size(v) == 1) {
					this.base = this.getDefault();
					this.value = Object.assign(this.$clone(v), this.base);
					this.value.id = null;
					this.$emit('input', this.value);
				} else {
					if (v.id/*  && _.size(v) == 1 */) {
						if (this.$account.theme.sections == undefined || this.$account.theme.sections[v.id] == undefined) {
							this.base = this.getDefault();
							this.value = _.clone(_.merge(this.base, v, {id: 'new'}, true));
// 							this.value = _.merge(this.getDefault(), this.$clone(v), {id: 'new'}, true);
						} else {
// 							let base = _.merge(this.getDefault(), this.$clone(this.$account.theme.sections[v.id]));
							this.base = _.merge(this.getDefault(), this.$account.theme.sections[v.id], true);
							if ((this.base.bg.picture != undefined) && (this.base.bg.picture.picture_id != undefined) && this.base.bg.picture.picture_id) delete this.base.bg.picture.picture_id;

							this.value = _.clone(_.merge(this.base, v, true));
// 							this.value = _.merge(base, this.$clone(v), true);
						}
						
						this.$emit('input', this.value);
					}
				}
			},
			
			changeSection(e) {
				let id = e.target.value;
				if (!id) id = null;
				
				switch (id) {
					case null:
					case 'new':
						this.base = this.getDefault();
						this.value = _.clone(this.base);
						break;
					default:
						this.base = _.merge(this.getDefault(), this.$account.theme.sections[id], true);
						if ((this.base.bg.picture != undefined) && (this.base.bg.picture.picture_id != undefined) && this.base.bg.picture.picture_id) delete this.base.bg.picture.picture_id;
						this.value = _.clone(this.base);
						break;
				}
				
				this.value.id = id;
				this.$emit('input', this.value);
			},
			
			getDefault() {
				return StylesFactory.getDefaultSection(this.$account.theme); 
			},
			
			prepareValues() {
				let v = this.$clone(this.value);
				if (v.id == null) return {id: null};
				let id = v.id;
				delete v.id;

				if (_.isEqual(v, this.getDefault())) {
					return {id: null};
				} else {
					if (id == 'new') {
						let result = _.differenceWith(v, this.getDefault());
						result.id = id;
						return result;
					} else {
						let s = _.merge(this.getDefault(), this.$account.theme.sections[id], true);

						if (_.isEqual(v, s)) {
							return {id: id};
						} else {
							let result = _.differenceWith(v, s);
							result.id = id;
							return result;
						}
					}
				}
			},
			
			properyChanged(base, section, name, revert = false) {
				return (this.disabled || !this.value.id)?null:StylesFactory.properyChanged(base, section, name, revert, this);
			},

		}, template: `
<section class="modal-card-body-blocks">
	<section class="message is-warning">
		<div class="message-body" style="display:flex;justify-content: space-between;padding-right: 22px;">
			{{'Секции позволяют визуально объединять несколько блоков вместе'|gettext}} 
			<vue-component-help-button icon="simple" :target="{name: 'video', params: {guide_id: 23}}"/>
			<!-- <a target="_blank" class='is-pulled-right' @click="alert('Пока нет')"><i class="fa fa-info-circle has-mr-1"></i></a> --></div>
	</section>
	<section>
	<div class="label-pro-container">
		<div class="tag is-pro" v-if="disallow" v-tippy :content="'Эта возможность доступна<br>на pro тарифе'|gettext">pro</div>
		<div :class="{disabled: disallow}">
<!-- 			<mx-toggle v-model='value.on' :title="'Активировать'|gettext" :disabled="disabled"></mx-toggle> -->
			
			<div class="select">
			<select v-model="value.id" @change="changeSection" :disabled="disallow">
				<option :value="null">{{'Секция выключена'|gettext}}</option>
				<option value="new">{{'Новая секция'|gettext}}</option>
				<optgroup :label="'Дизайн'|gettext" v-if="_.size($account.theme.sections) > 1">
					<option :value="i" v-for="(s, i) in $account.theme.sections" v-if="i != '_'">{{'Секция'|gettext}} {{i}}</option>
				</optgroup>
			</select>
			</div>
		</div>
	</div>
	</section>
	
	<section class="design-panel">
		<h3 class="has-text-grey has-mb-3 has-text-centered-mobile">{{'Общие'|gettext}}</h3>
		<div class="link-styles-container has-mb-2">
			<label class="form-control-static" :class="{disabled: disabled || !value.id}"><span :class="properyChanged(base.padding, value.padding, 'padding.top')" @click="properyChanged(base.padding, value.padding, 'padding.top', true)">{{'Отступ сверху'|gettext}}</span></label>
			
			<div style="width:120px">
				<div class="row row-small">
					<div class="col-xs col-shrink" style="display: flex;align-items: center">
						<b style="width:25px">
							<b v-if="value.padding.top">{{value.padding.top}}x</b>
							<b v-else>{{'Нет'|gettext}}</b>
						</b>
					</div>
					<div class="col-xs">
						<b-slider :min="0" :max="4" :tooltip="false" v-model="value.padding.top" size="is-line" rounded :disabled="disallowElements">
						<template v-for="(s, i) in [0, 1, 2, 3, 4, 5]">
			            	<b-slider-tick :value="i" :key="i"></b-slider-tick>
						</template>
						</b-slider>
					</div>
				</div>
			</div>
		</div>
		<div class="link-styles-container has-mb-2">
			<label class="form-control-static" :class="{disabled: disallowElements}"><span :class="properyChanged(base.padding, value.padding, 'padding.bottom')" @click="properyChanged(base.padding, value.padding, 'padding.bottom', true)">{{'Отступ снизу'|gettext}}</span></label>
			
			<div style="width:120px">
				<div class="row row-small">
					<div class="col-xs col-shrink" style="display: flex;align-items: center">
						<b style="width:25px">
							<b v-if="value.padding.bottom">{{value.padding.bottom}}x</b>
							<b v-else>{{'Нет'|gettext}}</b>
						</b>
					</div>
					<div class="col-xs">
						<b-slider :min="0" :max="4" :tooltip="false" v-model="value.padding.bottom" size="is-line" rounded :disabled="disallowElements">
						<template v-for="(s, i) in [0, 1, 2, 3, 4, 5]">
			            	<b-slider-tick :value="i" :key="i"></b-slider-tick>
						</template>
						</b-slider>
					</div>
				</div>
			</div>
		</div>
		<div class="link-styles-container">
			<label class="form-control-static" :class="{disabled: disallowElements || (value.bg.size == 'adaptive')}"><span :class="properyChanged(base.indent, value.indent, 'indent')" @click="properyChanged(base.indent, value.indent, 'indent', true)">{{'Отступ от края'|gettext}}</span></label>
			<mx-toggle v-model="value.indent.on" :space-between="true" :disabled="disallowElements || (value.bg.size == 'adaptive')"></mx-toggle>
		</div>
		
		<div class="has-mt-2 link-styles-container" v-if="value.indent.on">
			<label class="form-control-static"><span :class="properyChanged(base.indent, value.indent, 'indent.radius')" @click="properyChanged(base.indent, value.indent, 'indent.radius', true)">{{'Скругление секции'|gettext}}</span></label>
			<vue-component-design-radius-chooser v-model="value.indent.radius"></vue-component-design-radius-chooser>
		</div>
		
	</section>
	<section class="design-panel">
		<h3 class="has-text-grey has-mb-3 has-text-centered-mobile">{{'Фон'|gettext}}</h3>
		<vue-component-background-editor v-model="value.bg" :base="base.bg" :disabled="disallowElements" :sizes="value.indent.on?['width', 'tile']:['adaptive', 'width', 'tile']" :withOpacityBackground="true" />
	</section>
		
	<section class="design-panel">
		<h3 class="has-text-grey has-mb-3 has-text-centered-mobile">{{'Текст'|gettext}}</h3>
		
		<div class="has-mb-2 with-label color-picker-container">
		<label class="form-control-static" :class="{disabled: disallowElements}"><span :class="properyChanged(base.heading, value.heading, 'heading')" @click="properyChanged(base.heading, value.heading, 'heading', true)">{{'Заголовок'|gettext}}</span></label>
		<div class="component-group">
			<vue-component-font-weight-chooser v-model="value.heading.weight" :with-arrow="false" :disabled="disallowElements" />
			<vue-component-text-transform-chooser v-model="value.heading.transform" :with-arrow="false" :disabled="disallowElements"/>
			<vue-component-font-chooser v-model="value.heading.font" view="name" :disabled="disallowElements" />
			<vue-component-colorpicker v-model="value.heading.color" design="circle" :withArrow="false" :disabled="disallowElements" position-horizontal="left"/>
		</div>
		</div>
			
		<div class="with-label color-picker-container">
		<label class="form-control-static" :class="{disabled: disallowElements}"><span :class="properyChanged(base.text, value.text, 'text')" @click="properyChanged(base.text, value.text, 'text', true)">{{'Текст'|gettext}}</span></label>
		<div class="component-group">
			<vue-component-font-chooser v-model="value.text.font" view="name" :disabled="disallowElements" />
			<vue-component-colorpicker v-model="value.text.color" design="circle" :withArrow="false" :disabled="disallowElements" position-horizontal="left"/>
		</div>
		</div>
			
	</section>
	<section class="design-panel">
		<h3 class="has-text-grey has-mb-3 has-text-centered-mobile">{{'Ссылки'|gettext}}</h3>
<!--
		<div class="has-mb-2">
			<vue-component-colorpicker v-model="value.link.color" :label="'Цвет текста ссылки'|gettext" v-on:input="value.link.color = $event" :disabled="disallowElements"></vue-component-colorpicker>
		</div>
-->

		<div class="link-styles-container has-mb-2">
			<label class="form-control-static" :class="{disabled: disallowElements}"><span :class="properyChanged(base.link, value.link, 'link')" @click="properyChanged(base.link, value.link, 'link', true)">{{'Цвет заголовка ссылки'|gettext}}</span></label>
			<vue-component-colorpicker v-model="value.link.color" :disabled="disallowElements" position-horizontal="left" position-vertical="top"/>
		</div>

		<div class="link-styles-container has-mb-2">
			<label class="form-control-static" :class="{disabled: disallowElements}"><span :class="properyChanged(base.link.subtitle, value.link.subtitle, 'link.subtitle')" @click="properyChanged(base.link.subtitle, value.link.subtitle, 'link.subtitle', true)">{{'Цвет подзаголовка ссылки'|gettext}}</span></label>
			<vue-component-colorpicker v-model="value.link.subtitle.color" :disabled="disallowElements" position-horizontal="left" position-vertical="top"/>
		</div>
		
		<div class="link-styles-container has-mb-2">
			<label class="form-control-static" :class="{disabled: disallowElements}"><span :class="properyChanged(base.link, value.link, 'link.bg')" @click="properyChanged(base.link, value.link, 'link.bg', true)">{{'Цвет фона ссылки'|gettext}}</span></label>
			<vue-component-colorpicker v-model="value.link.bg" :disabled="disallowElements" position-horizontal="left" position-vertical="top"/>
		</div>
		

		<div class="link-styles-container has-mb-2">
			<label class="form-control-static" :class="{disabled: disallowElements}"><span :class="properyChanged(base.link, value.link, 'link.transparent')" @click="properyChanged(base.link, value.link, 'link.transparent', true)">{{'Прозрачность ссылки'|gettext}}</span></label>
			<vue-component-design-transparent-cooser v-model="value.link.transparent" :disabled="disallowElements" />
<!--
			<div class="select">
			<select v-model="value.link.transparent" :disabled="disallowElements">
				<option :value="v" v-for="v in [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]">{{v}}%</option>
			</select>
			</div>
-->
		</div>

		<transition name="fade">
		<div class="has-mb-2 link-styles-container" v-if="value.link.transparent">
			<label class="form-control-static" :class="{disabled: disallowElements}"><span :class="properyChanged(base.link.border, value.link.border, 'link.border')" @click="properyChanged(base.link.border, value.link.border, 'link.border', true)">{{'Толщина границы'|gettext}}</span></label>
			<input type="number" v-model.number="value.link.border.width" max="10" min="0" class="input" style="width: 100px" :disabled="disallowElements">
		</div>
		</transition>

		<div class="link-styles-container">
			<label class="form-control-static" :class="{disabled: disabled || !value.id}"><span :class="properyChanged(base.link.shadow, value.link.shadow, 'link.shadow')" @click="properyChanged(base.link.shadow, value.link.shadow, 'link.shadow', true)">{{'Тень ссылки'|gettext}}</span></label>
			<vue-component-shadow-chooser v-model="value.link.shadow" :disabled="disabled || !value.id" position-horizontal="left" position-vertical="top"/>
		</div>

<!--
		<div class="has-mb-2">
			<vue-component-colorpicker v-model="value.link.bg" :label="'Цвет фона ссылки'|gettext" :disabled="disabled || !value.id"></vue-component-colorpicker>
		</div>
-->
	</section>
</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-form-statistics", {data() {
			return {
				period_title: '',
				clicks: [],
				chart: [],
				isFetching: false,
			}	
		},
		
		props: {page_id: Number, block_id:Number, period: {
			type: String,
			default: 'day'
		}, period_back: {
			type: Number,
			default: 0
		}, disabled: {
			type: Boolean,
			default: false
		}},
		
		watch: {
			period() {
				this.fetchData(['chart', 'clicks']);
				this.period_back = 0;
			},
			period_back() {
				this.fetchData(['clicks']);
			}
		},
		
		created() {
			this.fetchData(['chart', 'clicks']);
		},
		
		methods: {
			fetchData(scope) {
				this.isFetching = true;
				
				this.$api.get('statistics/get', {page_id: this.page_id, block_id: this.block_id, period: this.period, period_back: this.period_back, scope: scope}).then((data) => {
					if (scope.indexOf('chart') != -1) this.chart = _.map(data.response.statistics.chart, (v, k) => {
						return {date: k, hits: v};
					});

					
					this.clicks = data.response.statistics.clicks;
					this.period_title = data.response.statistics.period.title;
					this.isFetching = false;
				});
			}
		}, template: `
	<section>
		<b-field class="has-tabs-style" :class="{disabled: disabled}">
            <b-radio-button v-model="period" type="active" class="is-expanded" native-value="day">{{'День'|gettext}}</b-radio-button>
            <b-radio-button v-model="period" type="active" class="is-expanded" native-value="week">{{'Неделя'|gettext}}</b-radio-button>
            <b-radio-button v-model="period" type="active" class="is-expanded" native-value="month">{{'Месяц'|gettext}}</b-radio-button>
		</b-field>
		
		<vue-component-statistics :data="chart" :period="period" :period_back="period_back" :line-show="true" :padding-top="30" class="has-mb-3 is-small" :disabled="disabled"></vue-component-statistics>

		<div class="field has-addons" :class="{disabled: disabled}">
			<p class="control"><button class="button" @click="period_back++"><i class="fas fa-caret-left"></i></button></p>
			<p class="control is-expanded"><span class="button is-static has-background-white is-fullwidth">{{ period_title }}</span></p>
			<p class="control"><button class="button" :disabled="period_back == 0" @click="period_back--"><i class="fas fa-caret-right"></i></button></p>
		</div>
		
		<b-table :data="clicks" :loading="isFetching" :disabled="disabled">
			<template slot-scope="props">
				<b-table-column field="title" :label="'Заголовок'|gettext">
					{{ props.row.type }}
				</b-table-column>
				<b-table-column field="clics" :label="'Клики'|gettext" :class='{"has-text-grey-light": props.row.clicks == 0}' numeric>{{ props.row.clicks | number }}</b-table-column>
			</template>
			
			<template slot="empty">
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
                    <p>{{'Недостаточно данных'|gettext}}</p>
                </section>
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
	                <p>{{'Загрузка данных'|gettext}}</p>
                </section>
            </template>			
		</b-table>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-avatar", {data() {
			return {
				isUpdating: false,
				isUploading: false,
				instagramUpdated: false,
				maxFilesize: this.$account.limits.upload_max_filesize,
				file: null
			}
		},

		props: ['values', 'variants', 'block', 'block_id', 'info', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		created() {
			this.block.title = this.$gettext('Аватар');
			this.$emit('update:tabs', [{name: 'common', title: this.block.title}, 'section']);
		},
		
		computed: {
			maxSizeBytes() {
				if (this.maxFilesize) {
					let m = this.maxFilesize.match(/([0-9]+)([MK])/);
					return m[1] * ((m[2] == 'M')?1048576:1024);
				} else {
					return this.maxFilesize;
				}
			}
		},		
		
		methods: {
			dropFilesChanged(is_updating) {
				if (/\.(jpe?g|png|gif)$/i.test(this.file.name)) {
					if (this.maxSizeBytes && this.file.size > this.maxSizeBytes) {
						return this.$alert(this.$gettext('Максимальный размер файла: %s').replace('%s', this.maxFilesize), 'is-danger');
					}	
									
					let uploadFile = (blob) => {
						let formData = new FormData();
						formData.append('file', blob/* this.file */);
						formData.append('picture_id', this.$account.profile_id);
						
// 						if (crop) formData.append('crop', parseInt(crop.left)+':'+parseInt(crop.top)+':'+parseInt(crop.width)+':'+parseInt(crop.height));
						
						this.isUploading = true;
						
						this.$http.request({url: '/pictures/upload?target=avatar', method: 'post', data: formData}).then((data) => {
							if (data.result == 'success') {
								//this.$account.avatar.url = '//'+this.$account.storage_domain+'/a/'+r.data.response.filename;
							} else if (data.result == 'error') {
								this.$alert(data.error, 'is-danger');
							}
							
							this.isUploading = false;
							this.file = null;
						}).catch(() => {
							this.isUploading = false;
							this.$alert(this.$gettext('Во время загрузки картинки возникла ошибка'));
						});	
					}
					
					let cancelFile = () => {
						this.file = null;
					}
					
			        this.$modal('vue-component-picture-cropper', {file: this.file, cropperOptions: {aspectRatio: 1, autoCropArea: 1, viewMode: 1, zoomable: false}, doneHandler: uploadFile, cancelHandler: cancelFile}, this);
				} else {
					this.isUploading = false;
					this.$alert(this.$gettext('Недопустимый формат файла'));
				}
			},
			
			updateAvatar() {
				this.isUpdating = true;
				this.instagramUpdated = true;
				this.$parent.action('update').then((v) => {
					this.isUpdating = false;
				})
			},
			
			prepareValues() {
				return this.values;
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
<!--
			<section class="message is-warning" style="margin-bottom: 0">
				<div class="message-body">
				{{'Аватар автоматически обновляется раз в сутки'|gettext}}
				<button class="button is-small is-warning is-pulled-right is-hidden-mobile" :class="{'is-loading': isUpdating}" @click="updateAvatar()" :disabled="info.is_readonly">{{'Обновить сейчас'|gettext}}</button>
				</div>
			</section>
-->

		<section v-if="currentTab == 'common'">
			<div class="media" style="align-items: center">
				<img :src="$account.avatar.url" class="is-pulled-left has-mr-3" :class="$account.avatar.size|sprintf('profile-avatar profile-avatar-%s')">
				<div class="media-content">
					<div>
						<b-upload v-model="file" @input="dropFilesChanged(false)">
							<a class="button is-fullwidth-mobile is-success" :class="{'is-loading': isUploading}"><span><i class="fa fas fa-arrow-from-top fa-rotate-180 has-mr-2" :disabled="info.is_readonly"></i>{{'Загрузить картинку'|gettext}}</span></a>
						</b-upload>
						<button class="button is-fullwidth-mobile is-light has-xs-mt-1" @click="updateAvatar()" :class="{'is-loading': isUpdating}" :disabled="info.is_readonly || instagramUpdated" v-if="info.has_connected_account && block_id">{{'Импортировать из Instagram'|gettext}}</button>
					</div>
				</div>
			</div>
		</section>
		
		<section v-if="currentTab == 'common'" :class="{disabled: info.is_readonly}">
			<label class="label">{{'Размер аватара'|gettext}}</label>
			<div class="tabs is-toggle is-fullwidth is-avatar-size-chooser has-mb-1">
				<ul>
					<li :class="{'is-active': values.avatar_size == k}" v-for="(v, k) in variants.avatar_size"><a @click="values.avatar_size = k"><em></em></a></li>
				</ul>
			</div>
			<p class="has-text-grey">{{variants.avatar_size[values.avatar_size]}}</p>
		</section>
		<section v-if="currentTab == 'common' && info.has_connected_account">
			<mx-toggle v-model="values.is_avatar_hide_text" :title="'Скрыть имя профиля под аватаром'|gettext" :disabled="info.is_readonly"></mx-toggle>
<!-- 		<b-checkbox v-model="values.is_avatar_hide_text" class="has-mt-3" :disabled="info.is_readonly">{{'Скрыть имя профиля под аватаром'|gettext}}</b-checkbox> -->
		</section>
		
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-banner", {props: ['values', 'options', 'info', 'variants', 'block', 'block_id', 'block_type_id', 'tabs', 'currentTab', 'allowSave'],
		mixins: [FormModel],
		
		data() {
			return {
				addons_values: null
			}
		},
	
		created() {
			this.block.title = this.$gettext('Баннер');
			this.$emit('update:tabs', [{name: 'common', title: this.$gettext('Картинка')}, 'options', 'statistics', 'section', 'addons']);
		},
		
		computed: {
			pictureSizeStyle() {
				return ('padding-top: '+(this.values.p?(this.values.p.height / this.values.p.width * 100):50)+'%;');
			},
			styleOuterContainer() {
				return (this.values.is_scale && this.values.width)?('width: '+this.values.width+'px !important;'):'';
			}
		},
		
		methods: {
			prepareValues() {
				let values = this.$clone(this.values);

				if (values.p) values.p = values.p.picture_id;
				return values;
			},
			
			startUploading() {
				this.allowSave = false;
				//this.$emit('update:allowSave', this.allowSave);
			},
			
			stopUploading() {
				this.allowSave = true;
				//this.$emit('update:allowSave', this.allowSave);
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
		<section v-if="info.is_readonly && (currentTab == 'common')" class="message is-warning">
			<div class="message-body">{{'Добавьте изображение любого размера и укажите действие при клике'|gettext}}</div>
		</section>
				
		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff" style="padding: 1rem 0">
			<div class="device-pictures-form" style="padding-left: 1rem;padding-right: 1rem">
			<center>
			<div class="device has-shadow is-large is-hide-mobile" :class="{disabled: info.is_readonly}">
				<div class="notch"></div>
			    <div class="screen page-font">
				    <div class="has-sm-p-1">
						<vue-component-pictures v-model="values.p" class="pictures-form-banner" :class="{'has-stretch': values.is_stretch, 'has-marginless': values.is_stretch && values.is_marginless}" class-container="picture-container picture-container-upload" :button-title="'Загрузить картинку'|gettext" :style-container="pictureSizeStyle" :style-outer-container="styleOuterContainer" button-icon="fa fal fa-cloud-upload" @startUploading="startUploading" @stopUploading="stopUploading" updatable></vue-component-pictures>
				    </div>
			    </div>
			</div>
			</center>
			<div class='form-shadow form-shadow-bottom is-hidden-mobile' style="height: 20px"></div>
			</div>
		</section>
				
		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff">
			<mx-toggle v-model="values.is_scale" :title="'Установить максимальную ширину'|gettext" :disabled="info.is_readonly || !values.p || values.is_stretch" class="has-mb-2"></mx-toggle>
			<div class="row row-small has-mb-2" v-if="values.is_scale && values.p">
				<div class="col-xs-12 col-sm-4">
					<b-field>
						<p class="control is-expanded"><number v-model="values.width" precision="0" :disabled="info.is_readonly" class="input has-text-right" :placeholder="values.p?values.p.width:''" /></p>
		            		<p class="control">
							<a class="button is-static">px</a>
						</p>
					</b-field>
				</div>			
			</div>
			<mx-toggle v-model="values.is_stretch" :title="'Растянуть на ширину страницы'|gettext" :disabled="values.is_readonly || values.is_scale"></mx-toggle>
			<transition name="fade">
				<mx-toggle v-model="values.is_marginless" :title="'Убрать отступы от края страницы'|gettext" :disabled="info.is_readonly || values.is_scale || !values.is_stretch" v-if="values.is_stretch" class="has-mt-2"></mx-toggle>
			</transition>
			
		</section>
		
		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff">
			<mx-toggle v-model="values.is_link" :title="'Сделать баннер ссылкой'|gettext" :disabled="info.is_readonly"></mx-toggle>
			<div v-if="values.is_link">
				<vue-component-link-editor :values.sync="values.link" :variants="variants" :info="info" class="has-mt-2"></vue-component-link-editor>
			</div>
		</section>
		
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		
<!--
		<keep-alive>
			<vue-pages-blocks-form-addons :block_id="block_id" :block_type_id="block_type_id" :addons_values.sync="addons_values" :disabled="info.is_readonly" :parent="parent" v-if="currentTab == 'addons'">
				<template slot="message">{{'Вы можете выбрать модули которые будут срабатывать для данной ссылки'|gettext}}</template>
				<template slot="empty">{{'Модули для данного блока еще не подключены'|gettext}}</template>
			</vue-pages-blocks-form-addons>
		</keep-alive>

		<keep-alive>
			<vue-pages-blocks-form-statistics :page_id="values.page_id" :block_id="block_id" v-if="currentTab == 'statistics'"></vue-pages-blocks-form-statistics>
		</keep-alive>
-->
		
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-break", {props: ['values', 'options', 'variants', 'info', 'block', 'block_id', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		data() {
			return {
				icons: [-1,0,1,2,3,4,5,6,7],
				sizes: [15, 30, 45, 60, 75, 90]
			}
		},
		
		created() {
			this.block.title = this.$gettext('Разделитель');

			let theme = this.$account.theme;
			if (!this.values.design.color) this.values.design.color = theme.screen.color;
			
			this.values.break_size = this.sizes.indexOf(this.values.break_size);

			this.$emit('update:tabs', [{name: 'common', title: this.$gettext('Разделитель')}, 'options', 'section']);
		},
		
		methods: {
			prepareValues() {
				let values = this.$clone(this.values);
				let theme = this.$account.theme;
				
				values.break_size = this.sizes[values.break_size];
				
				if (values.design.color == theme.screen.color) values.design.color = '';
				
				if (!values.design.color) values.design = {on: false}

				return values;
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
		<section v-if="currentTab == 'common'">
		
			<div class="has-mb-4">
				<label class="label">{{'Размер отступа'|gettext}}</label>
				<div class="row">
					<div class="col-xs">
					<b-field>
		<!--
						<b-select v-model="values.break_size" :disabled="info.is_readonly" expanded>
							<option v-for="(v, k) in variants.break_size" :value="k">{{v}}</option>
						</b-select>
		-->
						
						<b-slider :min="0" :max="sizes.length - 1" :tooltip="false" v-model="values.break_size" size="is-line" rounded>
						<template v-for="(s, i) in sizes">
		                	<b-slider-tick :value="i" :key="i"></b-slider-tick>
						</template>
						</b-slider>
						
					</b-field>
					</div>
					<div class="col-xs col-shrink" style="display: flex;align-items: center">
						<h3>{{values.break_size+1}}x</h3>
					</div>
				</div>
			</div>
			
			<label class="label">{{'Тип разделителя'|gettext}}</label>
	
			<div class="buttons-chooser-list has-mb-2 row row-small">
				<div v-for="i in icons" class="col-xs-4 col-sm-2 col-md-2">
					<div class="buttons-chooser block-break" @click="values.icon = i" :class="{in: values.icon == i}"><div class="block-break-inner" :class="{'has-icon': i, 'is-invisible': i < 0, 'is-fullwidth': values.fullwidth && i == 0, 'has-fading': values.fading}"><span><i :class="['fa fai', 'fa-'+i]" v-if="i > 0"></i></span></div></div>
				</div>
			</div>
			
			<div :class="{disabled: values.icon < 0}">
				<label class="label">{{'Настройки линии'|gettext}}</label>
				<mx-toggle v-model="values.fullwidth" class="has-mb-2" :title="'Линия на всю ширину'|gettext" :disabled="info.is_readonly"></mx-toggle>
				<mx-toggle v-model="values.fading" :title="'Линия с полупрозрачными краями'|gettext" :disabled="info.is_readonly"></mx-toggle>
			</div>
		
		</section>
		
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<div class="label-pro-container">
				<div class="tag is-pro" v-if="!$auth.isAllowTariff('pro')" v-tippy :content="'Эта возможность доступна<br>на pro тарифе'|gettext">pro</div>
		
				<div :class="{disabled: !$auth.isAllowTariff('pro')}">
					<div class="has-mb-2"><mx-toggle v-model='values.design.on' :title="'Свои настройки дизайна'|gettext" :disabled="info.is_readonly"></mx-toggle></div>
				
					<div v-if="values.design.on">
						<div class="has-mb-2">
							<vue-component-colorpicker v-model="values.design.color" :label="'Цвет'|gettext" :disabled="info.is_readonly" :colors="[$account.theme.screen.color]"></vue-component-colorpicker>
						</div>
					</div>
				</div>
			</div>
			
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-collapse", {props: ['values', 'options', 'variants', 'info', 'block', 'block_id', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		data() {
			return {
				current: 0
			}
		},
		
		created() {
			this.block.title = this.$gettext('Вопросы и ответы');
			let theme = this.$account.theme;

			if (!this.values.design.color) this.values.design.color = theme.screen.color;
			if (!this.values.design.font) this.values.design.font = theme.screen.font;

			this.$emit('update:tabs', [{name: 'common', title: this.block.title}, 'options', 'section']);
		},
		
		methods: {
			prepareValues() {
				let values = this.$clone(this.values);
				let theme = this.$account.theme;
				
				if (values.design.color == theme.screen.color) values.design.color = '';
				if (values.design.font == theme.screen.font) values.design.font = '';
				
				if (!values.design.color && !values.design.font) values.design = {on: false}

				return values;
			},
			
			onRemove(index) {
				this.$confirm(this.$gettext('Вы уверены что хотите удалить этот вопрос?'), 'is-danger').then(() => {
					this.values.fields.splice(index, 1);
				});
			},
			
			onAdd() {
				this.values.fields.push({title: '', text: '', opened: true});
				this.current = this.values.fields.length - 1;
				
				this.$nextTick(() => {
					this.$refs.fields.querySelector('.in input').focus();
				});
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks" :class="{'is-rtl': $account.locale.text_direction == 'rtl'}">
		<section v-if="currentTab == 'common'">
		
		<div ref="fields">
			<vue-component-sortable-form-fields v-model="values.fields" :current.sync="current">
				<template v-slot:title="{ item }">
					<span><span v-if="item.title">{{ item.title }}</span><span v-else>{{'Заголовок'|gettext}}</span></span>
				</template>
				
				<template v-slot:action="{ index }">
					<a class="is-pulled-right has-text-danger" @click.stop="onRemove(index)" :class="{disabled: info.is_readonly}"><i class="fa fa-trash-alt"></i></a>
				</template>
				
				<template v-slot:form="{ item, index }">
					<div class="field">
						<label>{{'Заголовок'|gettext}}</label>
						<b-input type="text" v-model="item.title" :disabled="info.is_readonly" class="has-rtl"></b-input>
					</div>
		
					<div class="field">
						<label>{{'Текст'|gettext}}</label>
						<vue-component-emoji-picker v-model="item.text">
							<textarea class="input has-rtl" v-model="item.text" :disabled="info.is_readonly" v-emoji rows="6"></textarea>
						</vue-component-emoji-picker>
					</div>
				</template>
			</vue-component-sortable-form-fields>
			
<!--
		<sortable-list class="form-fields-item-list" lockAxis="y" v-model="values.fields" use-drag-handle>
		<sortable-item v-for="(f, index) in values.fields" class="form-fields-item" :index="index" :key="index" :item="f">
		<div class="form-fields-item" :class="{in: f.opened}">
			<div class="form-fields-item-title" @click="openBlock(index)">
				<div v-sortable-handle class="form-fields-item-handle"></div>
				<a class="is-pulled-right has-text-danger" @click.stop="onRemove(index)" :class="{disabled: info.is_readonly}"><i class="fa fa-trash-alt"></i></a>
				<span><span v-if="f.title">{{ f.title }}</span><span v-else>{{'Заголовок'|gettext}}</span></span>
			</div>
			<div class="form-fields-item-options">
				<div class="field">
					<label>{{'Заголовок'|gettext}}</label>
					<b-input type="text" v-model="f.title" :disabled="info.is_readonly"></b-input>
				</div>
	
				<div class="field">
					<label>{{'Текст'|gettext}}</label>
					<b-input type="textarea" v-model="f.text" :disabled="info.is_readonly"></b-input>
				</div>
			</div>
		</div>
		</sortable-item>
		</sortable-list>
-->
		</div>
		
		</section>
		<section v-if="currentTab == 'common'">
			
		<button type="button" @click="onAdd" class="button is-success" :class="{disabled: info.is_readonly}"><i class="fas fa-plus has-mr-1"></i>{{'Добавить новый пункт'|gettext}}</button>
		
<!--
			<b-field label="HTML">
				<textarea class="input" style="min-height: 100px" v-model="values.html"></textarea>
			</b-field>
-->

		</section>
		
		<section v-if="currentTab == 'options'">
			
			<div class="label-pro-container">
				<div class="tag is-pro" v-if="!$auth.isAllowTariff('pro')" v-tippy :content="'Эта возможность доступна<br>на pro тарифе'|gettext">pro</div>
		
				<div :class="{disabled: !$auth.isAllowTariff('pro')}">
					<div class="has-mb-2"><mx-toggle v-model='values.design.on' :title="'Свои настройки дизайна'|gettext" :disabled="info.is_readonly"></mx-toggle></div>
				
					<div v-if="values.design.on">
						<div class="has-mb-2">
							<vue-component-colorpicker v-model="values.design.color" :label="'Цвет текста'|gettext" :disabled="info.is_readonly" :colors="[$account.theme.screen.color]"></vue-component-colorpicker>
						</div>
						<div class="has-mb-2 link-styles-container">
							<label class="form-control-static">{{'Шрифт'|gettext}}</label>
							<vue-component-font-chooser v-model="values.design.font" view="name"></vue-component-font-chooser>
						</div>
					</div>
				</div>
			</div>
			
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-courses-feed", {props: ['values', 'options', 'variants', 'info', 'block', 'block_id', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		created() {
			this.block.title = this.$gettext('Фид занятий курса');
			this.$emit('update:tabs', [{name: 'common', title: 'Общие'}, 'options', 'section']);
		},
		
		methods: {
			prepareValues() {
				return this.values;
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff" class="is-html-section">
			<div class="panel panel-default">
				
			</div>
		</section>
		
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-courses-lesson", {props: ['values', 'options', 'variants', 'info', 'block', 'block_id', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		created() {
			this.block.title = this.$gettext('Занятие курса');
			this.$emit('update:tabs', [{name: 'common', title: 'Общие'}, 'options', 'section']);
		},
		
		methods: {
			prepareValues() {
				return this.values;
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff" class="is-html-section">
			<div class="panel panel-default">
				Занятие
			</div>
		</section>
		
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-courses-navs", {props: ['values', 'options', 'variants', 'info', 'block', 'block_id', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		created() {
			this.block.title = this.$gettext('Навигация курса');
			this.$emit('update:tabs', [{name: 'common', title: 'Общие'}, 'options', 'section']);
		},
		
		methods: {
			prepareValues() {
				return this.values;
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff" class="is-html-section">
			<div class="panel panel-default">
				
			</div>
		</section>
		
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-courses-progress", {props: ['values', 'options', 'variants', 'info', 'block', 'block_id', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		created() {
			this.block.title = this.$gettext('Навигация курса');
			this.$emit('update:tabs', [{name: 'common', title: 'Общие'}, 'options', 'section']);
		},
		
		methods: {
			prepareValues() {
				return this.values;
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff" class="is-html-section">
			<div class="panel panel-default">
				
			</div>
		</section>
		
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-form", {props: ['values', 'options', 'parent', 'info', 'variants', 'block_type_id', 'info', 'block', 'block_id', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		data() {
			return {
				addons_values: null,
				action: null
			}
		},
		
		created() {
			this.block.title = this.$gettext('Форма');
			
			let tabs = [
				{name: 'common', title: this.$gettext('Поля')},
				'options',
				{name: 'pays', title: this.$gettext('Оплаты')},
				'section',
				'addons'
			];
			
			this.values.fields_extended = [
				{title: this.$gettext('Расширенные поля'), fields: [
					{idx: 'a', title: this.$gettext('Номер заявки'), value_type: 'number'},
					{idx: 'i', title: this.$gettext('Номер счёта'), value_type: 'number'},
					{idx: 'd', title: this.$gettext('Бюджет'), value_type: 'number'},
					{idx: 'g', title: this.$gettext('Ссылка на оплату'), value_type: 'string'},
					{idx: 'j', title: this.$gettext('Ссылка на страницу'), value_type: 'string'}
				]}
			];
			
			
			if (!this.block_id) {
				this.values.fields = [{type_id:3,title: this.$gettext("Имя"),text:"",required:false,idx:"1"},{type_id:6,title:"Email",text:"",required:true,idx:"2"}];
				this.values.fields_idx = 3;
			}
				
/*
			if (this.$account.features.indexOf('payments') != -1) tabs.push({name: 'pays', title: this.$gettext('Оплаты')});
			if (this.$account.features.indexOf('addons') != -1) tabs.push({name: 'addons', title: this.$gettext('Модули')});
*/

/*
			let theme = this.$account.theme;
			if (!this.values.link_color) this.values.link_color = theme.link.color;
			if (!this.values.link_bg) this.values.link_bg = theme.link.bg;
*/

			this.$emit('update:tabs', tabs);
		},
		
		computed: {
			currentPaidStatus() {
				let s = '';
				for (let i = 0; i < this.variants.paid_status_id.length; i++) {
					if (this.variants.paid_status_id[i].status_id == this.values.paid_status_id) {
						s = this.variants.paid_status_id[i].status;
						break;
					}
				}
				
				return s;
			}
		},
		
		methods: {
			prepareValues() {
				let values = this.$clone(this.values);
				values.addons_values = this.addons_values;
				
				values.fields = _.map(values.fields, (v) => {
					return _.pick(v, ['default', 'required', 'text', 'title', 'type_id', 'variants', 'idx']);
				});
				
				delete values.fields_extended;
				
				let theme = this.$account.theme;
				if ((values.design.text == theme.link.color) && (values.design.bg == theme.link.bg)) values.design = {on: false}
				
				return values;
			},

			onAction(v) {
				if (!v) return;

				this.values.fields_idx.toString(16);
				
				this.values.fields.push({title: this.variants.fields_types[v], text: '', type_id: v, value_type: this.variants.fields_types_value[v], required: false, default: 0, variants: '', opened: true, idx: this.values.fields_idx.toString(16)});
				this.values.fields_idx++;
				
				Vue.nextTick(() => {
		            this.action = null;
	            });
			}			
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">

		<section v-if="info.is_readonly && (currentTab == 'common')" class="message is-warning">
			<div class="message-body">{{'С помощью этого блока, вы сможете создать форму для сбора контактных данных и добавить прием оплаты'|gettext}}</div>
		</section>
		
		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff">
			<b-select :placeholder="'-- Добавить поле --'|gettext" v-model="action" @input="onAction" :disabled="info.is_readonly" expanded>
				<option v-for="(f, i) in variants.fields_types" :value="i">{{ f }}</option>
			</b-select>
		</section>

		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff">
			<vue-component-form-blocks v-model="values.fields" :variants="variants" :disabled="info.is_readonly"></vue-component-form-blocks>		
		</section>
		
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<b-field :label="'Текст на кнопке'|gettext">
				<input type="text" v-model="values.form_btn" class="input" :disabled="info.is_readonly" :placeholder="'Отправить'|gettext">
<!--
				<b-select v-model="values.form_btn" expanded>
					<option v-for="(v, k) in variants.form_btn" :value="k">{{v}}</option>
				</b-select>
-->
			</b-field>
		</section>

		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">		
			<b-field :label="'Тип формы'|gettext" v-if="_.size(variants.target_id)">
				<b-select v-model="values.target_id" :disabled="info.is_readonly" :placeholder="'-- Простая форма --'|gettext" expanded>
					<option :value="null">{{'-- Простая форма --'|gettext}}</option>
					<option v-for="(v, k) in variants.target_id" :value="k">{{v}}</option>
				</b-select>
			</b-field>

			<div v-if="values.target_id">
				<b-select v-model="values.target_value" :disabled="info.is_readonly" :placeholder="'-- Не выбрано --'|gettext" expanded>
					<option :value="null">{{'-- Не выбрано --'|gettext}}</option>
					<option v-for="(v, k) in variants.target_values[values.target_id]" :value="k">{{v}}</option>
				</b-select>
			</div>
			<div v-else>
				<b-field :label="'Действие после заполнения формы'|gettext">
					<b-select v-model="values.form_type" :disabled="info.is_readonly" expanded>
						<option v-for="(v, k) in variants.form_type" :value="k">{{v}}</option>
					</b-select>
				</b-field>
	
				<b-field v-if="values.form_type == 'link'" :class="{'has-error': errors.link}" :message="errors.link">
					<input type='text' v-model='values.link' class='input' placeholder='http://' autocorrect="off" autocapitalize="none" :disabled="info.is_readonly">
				</b-field>
				
				<b-field v-if="values.form_type == 'page'" :class="{'has-error': errors.link_page_id}" :message="errors.link_page_id">
					<b-select v-model="values.link_page_id" :placeholder="'-- Не выбрано --'|gettext" :disabled="info.is_readonly" expanded>
						<option v-for="(v, k) in variants.link_page_id" :value="k">{{v}}</option>
					</b-select>
				</b-field>
				
				<b-field v-if="values.form_type == 'text'" :class="{'has-error': errors.form_text}" :message="errors.form_text">			
					<textarea v-model='values.form_text' class='input' style="min-height: 100px" :disabled="info.is_readonly" :placeholder="'Спасибо за вашу заявку'|gettext"></textarea>
				</b-field>
			</div>
		</section>
				
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<vue-pages-blocks-form-design :values.sync="values.design" :info="info"></vue-pages-blocks-form-design>
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		
		<section v-if="(currentTab == 'pays') && $auth.isAllowTariff('business') && !info.amount_payments_providers" class='message is-danger'><div class="message-body">{{'Чтобы принимать оплату, вам необходимо настроить платежные системы в разделе'|gettext}} "<a href="/profile/settings/payments/" target="_blank">{{'Настройки'|gettext}}</a>".</div></section>
		<section v-if="currentTab == 'pays'" @click="$parent.scrollToTariff">
			
			<div class="has-mb-2"><mx-toggle v-model='values.is_order' :title="'Принимать оплату'|gettext" :disabled="info.is_readonly"></mx-toggle></div>
			<div class="row" :class="{disabled: !values.is_order}">
				<div class="col-sm-4 col-xs-12 has-mb-2" :class="{'has-error': errors.order_budget}"><label class="label">{{'Цена'|gettext}}</label>
					<div class="field has-addons">
						<div class="control is-expanded">
							<number v-model="values.order_budget" :precision="$account.currency.precision" class="input has-text-right" :disabled="info.is_readonly">
						</div>
						<div class="control"><div class="button is-static">{{$account.currency.title}}</div></div>
					</div>
				</div>
				<div class="col-sm-8 col-xs-12" :class="{'has-error': errors.order_purpose}">
					<div class="field">
						<label class="label">{{'Назначение платежа'|gettext}}</label>
						
						<div class="row row-small">
							<div class="col-xs-12 col-sm-4 has-mb-2">
								<b-select v-model="values.payment_object_id" :disabled="info.is_readonly" expanded>
									<option v-for="(v, k) in variants.payment_object_id" :value="k">{{v}}</option>
								</b-select>
							</div>
							
							<div class="col-xs-12 col-sm-8 has-mb-2">
								<input type='text' v-model='values.order_purpose' class='input' :disabled="info.is_readonly" v-if="values.payment_object_id < 100">
								<b-select v-model="values.payment_object_value" :disabled="info.is_readonly" :placeholder="'-- Не выбрано --'|gettext" expanded v-else>
									<option :value="null">{{'-- Не выбрано --'|gettext}}</option>
									<option v-for="(v, k) in variants.payment_objects_values[values.payment_object_id]" :value="k">{{v}}</option>
								</b-select>
							</div>
<!-- 							<div class="col-xs-12 col-sm-6 has-mb-2" :class="{'has-error': errors.order_purpose}"><div class="field"><label class="label">{{'Назначение платежа'|gettext}}</label><input type='text' v-model='values.order_purpose' class='input' :disabled="info.is_readonly"></div></div> -->
						</div>
					</div>
				</div>
			</div>
			
			<div :class="{disabled: !values.is_order}">
			<b-checkbox v-model="values.paid_change_status" :disabled="info.is_readonly">{{'После успешной оплаты менять статус'|gettext}}:</b-checkbox> <b-dropdown aria-role="list" position="is-top-right" :disabled="!values.paid_change_status || info.is_readonly"><label :disabled="!values.paid_change_status || info.is_readonly" :class="{'has-text-primary': values.paid_change_status}" class="b-checkbox checkbox is-marginless" slot="trigger" aria-role="listitem">{{currentPaidStatus}}</label>
			<b-dropdown-item @click="values.paid_status_id = s.status_id;" v-for="s in variants.paid_status_id"><i class="fas fa-circle has-mr-1" :style='"color:#{1}"|format(s.color)'></i> {{s.status}}</b-dropdown-item>
			</b-dropdown>
			</div>
						
		</section>		

<!--
		<keep-alive>		
			<vue-pages-blocks-form-addons :block_id="block_id" :block_type_id="block_type_id" :values="values" :addons_values.sync="addons_values" :disabled="info.is_readonly" :parent="parent" v-if="currentTab == 'addons'" @click="$parent.scrollToTariff">
				<template slot="message">{{'Вы можете выбрать модули которые будут срабатывать для данной формы'|gettext}}</template>
				<template slot="empty">{{'Модули для данного блока еще не подключены'|gettext}}</template>
			</vue-pages-blocks-form-addons>
		</keep-alive>
-->
			
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-html", {props: ['values', 'options', 'variants', 'info', 'block', 'block_id', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		created() {
			this.block.title = this.$gettext('HTML код');
			this.$emit('update:tabs', [{name: 'common', title: 'HTML'}, 'options', 'section']);
		},
		
		methods: {
			prepareValues() {
				return this.values;
			}
		}, template: `
	<section class="modal-card-body modal-card-body-block-html modal-card-body-blocks">
		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff" class="is-html-section">
			<div class="panel panel-default">
				<vue-component-codemirror v-model="values.html" :disabled="info.is_readonly" style="min-height: 100px"></vue-component-codemirror>
			</div>
		</section>
		
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-link", {props: ['values', 'options', 'parent', 'variants', 'info', 'block', 'block_id', 'block_type_id', 'tabs', 'currentTab', 'section'],
		mixins: [FormModel],
		
		data() {
			return {
				addons_values: null
			}
		},
		
		created() {
			this.block.title = this.$gettext('Ссылка');
			this.$emit('update:tabs', [{name: 'common', title: this.$gettext('Ссылка')}, {name: 'thumbnail', title: this.$gettext('Миниатюра')}, 'options', 'section', 'addons', 'statistics']);
		},
		
		computed: {
			defaultColor() {
				return ((this.section != undefined && this.section.link.color != undefined)?this.section.link.color:this.$account.theme.link.color);
			},

			defaultSubtitle() {
				return ((this.section != undefined && this.section.link.subtitle.color != undefined)?this.section.link.subtitle.color:this.$account.theme.link.subtitle.color);
			},

			defaultBg() {
				return ((this.section != undefined && this.section.link.bg != undefined)?this.section.link.bg:this.$account.theme.link.bg);
			},
			
			error() {
				return this.errors.link || this.errors.email || this.errors.phone || this.errors.product || this.errors.link_page_id || this.errors.collection;
			}
		},
		
		methods: {
			prepareValues() {
				let values = this.$clone(this.values);
// 				values.addons_values = this.addons_values;

				let theme = this.$account.theme;
				if ((values.design.text == this.defaultColor) && (values.design.bg == this.defaultBg) && (values.design.subtitle == this.defaultSubtitle)) values.design = {on: false}
				
				return values;
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
		<section v-if="currentTab == 'common'">
			
<!--
		[[<vue-component-picture-cropper trigger="#pick-avatar"></vue-component-picture-cropper>]]
		<button class="btn btn-primary btn-sm" id="pick-avatar">Select an new image</button>
-->
			
		<b-field :label="'Текст ссылки'|gettext" :class="{'has-error': errors.title}" :message="errors.title">
			<div>
				<input class="input has-mb-1" v-model="values.title" :disabled="info.is_readonly" :placeholder="'Заголовок'|gettext"></input>
				<input class="input" v-model="values.subtitle" :disabled="info.is_readonly" :placeholder="'Подзаголовок'|gettext"></input>
			</div>
		</b-field>
		
		<b-field :class="{'has-error': error}" :message="error">
			<vue-component-link-editor :values.sync="values" :variants="variants" :info="info"></vue-component-link-editor>
		</b-field>
		
		</section>
		
		
		<section class="message is-danger" v-if="(currentTab == 'thumbnail') && !$auth.isAllowTariff('pro')" style="flex-shrink: 0;flex-grow: 0">
			<div class="message-body"><span>{{'Доступно на pro-тарифе'|gettext}}</span> <a :href="base_path_prefix+'/tariffs/'" target="_blank" class='is-pulled-right'>{{'Подробнее'|gettext}} <i class="fa fa-angle-right" style="margin-left: 5px"></i></a></div>
		</section>
		
		<section v-if="currentTab == 'thumbnail'" style="height: 100%">
			<vue-component-thumbnail-chooser :pictures="values.thumb_pictures" v-model="values.thumb" :disabled="info.is_readonly"></vue-component-thumbnail-chooser>
		</section>
		
		<section v-if="currentTab == 'options'">
			<vue-pages-blocks-form-design-link :values.sync="values.design" :info="info"></vue-pages-blocks-form-design-link>
			<vue-pages-blocks-form-animations :values.sync="values" :info="info" :variants="variants"></vue-pages-blocks-form-animations>

			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		
<!--
		<keep-alive>
			<vue-pages-blocks-form-addons v-if="currentTab == 'addons'" :block_id="block_id" :block_type_id="block_type_id" :addons_values.sync="addons_values" :disabled="info.is_readonly" :parent="parent">
				<template slot="message">{{'Вы можете выбрать модули которые будут срабатывать для данной ссылки'|gettext}}</template>
				<template slot="empty">{{'Модули для данного блока еще не подключены'|gettext}}</template>
			</vue-pages-blocks-form-addons>
		</keep-alive>

		<keep-alive>
			<vue-pages-blocks-form-statistics v-if="currentTab == 'statistics'" :page_id="values.page_id" :block_id="block_id"></vue-pages-blocks-form-statistics>
		</keep-alive>
-->

		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-map", {props: ['values', 'options', 'variants', 'info', 'block', 'block_id', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		data() {
			return {
				query: '',
				isGeocoding: false,
				current: 0,
				map: null,
				markers: []
			}
		},
		
		created() {
			this.block.title = this.$gettext('Карта');
			let tabs = [
				{name: 'common', title: this.$gettext('Карта и метки')},
				{name: 'extended', title: this.$gettext('Опции карты')},
				'options',
				'statistics',
				'section'
			];
			
			let theme = this.$account.theme;
			if (!this.values.link_color) this.values.link_color = theme.link.color;
			if (!this.values.link_bg) this.values.link_bg = theme.link.bg;
			
			this.$emit('update:tabs', tabs);
		},
		
		mounted() {
			$mx.lazy('map.js', 'map.css', () => {
				let options = this.$clone(this.values.bounds);
				if (options.length == 0) options = {zoom: 4, center: {lat:55.5807481, lng:36.8251304}};
				
				this.map = L.map(this.$refs.map, {
					attributionControl: false,
				}).setView([options.center.lat, options.center.lng], options.zoom);
				
				L.control.attribution({prefix: ''}).addTo(this.map);
				
				//'https://maps.tilehosting.com/styles/basic/{z}/{x}/{y}.png?key=V8rA6J6w5KhzV2N0rq8g'
				L.tileLayer('/maps/{z}/{x}/{y}.png', {
			        attribution: '',
			        crossOrigin: true
				}).addTo(this.map);
				
				this.icon = L.icon({
				    iconUrl: '/s/i/marker.png',
				    iconSize: [28, 37],
		// 		    iconAnchor: [22, 94],
				    popupAnchor: [0, -10],
				    shadowUrl: '/s/i/marker-shadow.png',
				    shadowSize: [40, 50],
				    shadowAnchor: [12, 31]
				});
				
				let updated = () => {
					let b = this.map.getBounds();
					this.values.bounds = {center: this.map.getCenter(), zoom: this.map.getZoom(), bounds: [[b.getNorth(), b.getEast()], [b.getSouth(), b.getWest()]]};
				}
				
				if (this.values.bounds.length == 0) {
					navigator.geolocation.getCurrentPosition((position) => {
						var pos = {
							lat: position.coords.latitude,
							lng: position.coords.longitude
						};
					
						this.map.setView(pos, 10);
						updated();
					});
				}

				
				
				this.map.on('moveend', updated);
				this.map.on('zoomend', updated);
				
				updated();
				
				_.each(this.values.markers, this.addMarkerInternal);
			});
		},
		
		methods: {
			addMarkerInternal(v) {
				var loc = {lat: parseFloat(v.lat), lng: parseFloat(v.lng)}
				
				var marker = L.marker([loc.lat, loc.lng], {icon: this.icon, draggable: true}).addTo(this.map);
				marker.on('dragend', (e) => {
					
					let ll = marker.getLatLng();
					v.lat = ll.lat;
					v.lng = ll.lng;
				});
				
				this.markers.push(marker);			
			},
			
			addMarker() {
				if (this.query.trim() == '') return;
				this.isGeocoding = true;
				$mx.lazy('//maps.googleapis.com/maps/api/js?key=AIzaSyCsYkpOHG_vddnpHQJ8kamy4RGt81HCfCU&libraries=places', () => {
					var geocoder = new google.maps.Geocoder;
			        geocoder.geocode( { 'address': this.query}, (results, status) => {
						if (status == 'OK' && results.length && results[0].geometry) {
							var loc = results[0].geometry.location;
							 
							let v = {lng: loc.lng(), lat: loc.lat(), text: '', title: this.query};
							this.values.markers.push(v);
							this.current = this.values.markers.length - 1;
							this.addMarkerInternal(v);
							
							
							if (this.markers.length) {
								let group = new L.featureGroup(this.markers);
								this.map.fitBounds(group.getBounds());
							}
							
							this.$nextTick(() => {
								if (this.markers.length == 1) this.$refs.markers.querySelector('.in textarea').focus();
							});
							
							this.query = '';
						}
	
						this.isGeocoding = false;
					});
				});
			},
			
			deleteMarker(index) {
				this.map.removeLayer(this.markers[index]);
				this.markers.splice(index, 1);
				this.values.markers.splice(index, 1);
			},
			
			prepareValues() {
				let values = this.$clone(this.values);
			
				values.markers = _.map(values.markers, (v) => {
					return _.pick(v, ['lng', 'lat', 'title', 'text']);
				});
				
				let theme = this.$account.theme;
				if ((values.design.text == theme.link.color) && (values.design.bg == theme.link.bg)) values.design = {on: false}
				
				return values;
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
		<section v-if="info.is_readonly && (currentTab == 'common')" class="message is-warning">
			<div class="message-body">{{'Здесь вы можете добавить карту и отметить ваши адреса'|gettext}}</div>
		</section>
		
		<section :class="{'is-hidden': currentTab != 'common'}" @click="$parent.scrollToTariff">
			<div class="map-container map-view-with-zoom-control" :class="{disabled: info.is_readonly}">
				<div class="map-form" ref='map'></div>
			</div>
		</section>
		
		<section :class="{'is-hidden': currentTab != 'common'}" @click="$parent.scrollToTariff">
			<div class="has-mb-2">
			<div class="row row-small">
				<div class="col-xs">
					<b-input v-model="query" autocorrect="off" autocapitalize="off" spellcheck="false" :placeholder="'Введите адрес метки'|gettext" @keyup.native.enter="addMarker" :loading="isGeocoding" :disabled="info.is_readonly"></b-input>
				</div>
				<div class="col-xs col-shrink">
					<button type='button' class="button is-success" @click="addMarker" :class="{'is-loading': isGeocoding}" :disabled="info.is_readonly">{{'Добавить метку'|gettext}}</button>
				</div>
			</div>
			</div>
			
			<div ref='markers'>
				<vue-component-sortable-form-fields v-model="values.markers" :current.sync="current">
					<template v-slot:title="{ item }">
						<span v-if="item.title">{{item.title}}</span>
						<span v-else>{{'Заголовок'|gettext}}</span>
					</template>
					
					<template v-slot:action="{ index }">
						<a class="has-text-danger is-pulled-right" @click.stop="deleteMarker(index)" :class="{disabled: info.is_readonly}"><i class="fa fa-trash-alt"></i></a>
					</template>
					
					<template v-slot:form="{ item, index }">
						<div class="field">
							<input type="text" v-model="item.title" class="input" :placeholder="'Заголовок'|gettext" :disabled="info.is_readonly">
						</div>
		
						<div class="field">
							<textarea class="input" v-model="item.text" :placeholder="'Режим работы, этаж и другая полезная информация'|gettext" :disabled="info.is_readonly"></textarea>
						</div>
					</template>
				</vue-component-sortable-form-fields>
			</div>
		
		</section>

		<section v-if="currentTab == 'extended'" @click="$parent.scrollToTariff">
			<div class="has-mb-2"><mx-toggle v-model="values.is_fixed" :title="'Зафиксировать карту'|gettext" :disabled="info.is_readonly"></mx-toggle></div>
			<div class="has-mb-2"><mx-toggle v-model="values.show_buttons" :title="'Добавить отдельные ссылки для каждой метки'|gettext" :disabled="info.is_readonly"></mx-toggle></div>
			<div><mx-toggle v-model="values.show_zoom" :title="'Показывать ползунок масштабирования'|gettext" :disabled="info.is_readonly"></mx-toggle></div>
		</section>
				
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<vue-pages-blocks-form-design :values.sync="values.design" :info="info"></vue-pages-blocks-form-design>
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		
<!--
		<keep-alive>
			<vue-pages-blocks-form-statistics :page_id="values.page_id" :block_id="block_id" v-if="currentTab == 'statistics'" @click="$parent.scrollToTariff"></vue-pages-blocks-form-statistics>
		</keep-alive>
-->
		
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-messenger", {props: ['values', 'options', 'parent', 'variants', 'info', 'block', 'block_id', 'block_type_id', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		data() {
			return {
				current: 0,
				addons_values: null,
				mode: 'edit',
				selected: []
				
/*
				platforms: {
					telegram: {placeholder: 'Например: Написать в {1}', types: {v: {label: 'Имя пользователя', type: 'input'}}},
					vk: {placeholder: 'Например: Написать в {1}', types: {v: {label: 'Имя пользователя', type: 'input'}}},
					fb: {placeholder: 'Например: Написать в {1}', types: {v: {label: 'Имя пользователя', type: 'input'}}},
					sk: {placeholder: 'Например: Позвонить в {1}', types: {v: {label: 'Имя пользователя', type: 'input'}}},
					whatsapp: {placeholder:'Например: Написать в {1}', types: {v: {label: 'Укажите ваш номер телефона', type: 'phone', check: 'Телефон'}, c: {label: 'Укажите ссылку на чат', type: 'input', check: 'Чат', placeholder: 'https://chat.whatsapp.com/****************'}}, inputs: {text: {label: 'Текст-шаблон сообщения', placeholder: 'Пример: Здравствуйте, как можно сделать заказ?', type: 'textarea'}}},
					viber: {placeholder: 'Например: Написать в {1}', types: {v: {label: 'Укажите ваш номер телефона', type: 'phone', check: 'Телефон'}, c: {label: 'Укажите ссылку на канал', type: 'input', check: 'Канал', placeholder: 'https://viber.com/****************'}}}
				}
*/
			}
		},
				
		created() {
			this.block.title = this.$gettext('Мессенджеры');
			this.$emit('update:tabs', [{name: 'common', title: this.$gettext('Ссылки')}, 'options', 'statistics', 'section', 'addons']);
			if (!this.values.items.length) this.setMode('choose');
		},
		
		watch: {
			values: {
				handler() {
					if (!this.values.items.length) this.setMode('choose');
				},
				deep: true
			}
		},
		
		computed: {
			items() {
				let result = {};
				_.each(this.variants.list, (w) => {
					_.each(w.items, (v, k) => result[k] = v);
				});
				
				return result;
			},
		
/*
			titles() {
				return {'whatsapp': 'WhatsApp', 'telegram': 'Telegram', 'fb': 'Facebook Messenger', 'vk': this.$gettext('ВКонтакте'), 'viber': 'Viber', 'sk': 'Skype', 'ln': 'Line'}
			},
*/
			
			textLine1() {
				return this.$gettext('Откройте Line@ > Выберите аккаунт > Найти новых друзей > Выберите URL-адрес > Копировать');
			},
			
			textLine2() {
				return this.$gettext('Откройте Line > Пригласить друзей > Пригласить > Поделиться > Выберите любой мессенджер или email > Скопируйте ссылку из сообщения');
			}
		},
		
		methods: {
			deleteItem(index) {
				this.$confirm(this.$format(this.$gettext('Вы уверены что хотите удалить {1}?'), this.items[this.values.items[index].n].title), 'is-danger').then(() => {
					this.values.items.splice(index, 1)
				});
			},

			icon(index) {
				let item = this.items[index];
				return 'fa fab fa-'+((item.icon != undefined)?item.icon:index);
			},

			prepareValues() {
				let values = this.$clone(this.values);
// 				values.addons_values = this.addons_values;

				return values;
			},
			
			setMode(mode) {
				switch (mode) {
					case 'choose':
						this.selected = _.map(this.values.items, 'n');
						break;
					case 'edit':
						let currents = _.map(this.values.items, 'n');
						
						_.each(this.selected, v => {
							let idx = currents.indexOf(v);
							if (idx == -1) {
								let item = {n: v, t: "", v: ""};
								if (_.size(this.items[v].types) > 1) {
									item.tp = Object.keys(this.items[v].types)[0];
									_.each(this.items[v].types, (v, k) => { item[k] = ''; });
								}
								
								if (this.items[v].inputs != undefined) {
									_.each(this.items[v].inputs, (v, k) => { item[k] = ''; });
								}

								if (this.items[v].text) item.text = '';
								this.values.items.push(item);
							} 
						});
						
						_.each(currents, v => {	
							let idx = this.selected.indexOf(v);
							if (idx == -1) {
								let tmp = _.map(this.values.items, 'n');
								this.values.items.splice(tmp.indexOf(v), 1);
							}
						});
						break;
				}
				
				this.mode = mode;
			},
			
			selectItem(name) {
				let idx = this.selected.indexOf(name);
				if (idx != -1) {
// 					if (this.selected.length > 1) this.selected.splice(idx, 1);
				} else {
					this.selected.push(name);
					this.setMode('edit');
					this.current = this.selected.length - 1;
/*
					let item = {n: name, t: "", v:"", a:0};
					this.values.items.push(item);
*/
				}
			},
			
			getError(part, val) {
				return this.errors[part]?this.errors[part][val]:null;
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
		<div slot="trigger"></div>

		<section v-if="info.is_readonly && (currentTab == 'common')" class="message is-warning">
			<div class="message-body">{{'Клиенту больше не нужно будет запоминать ваш номер, сохранять, заходить в месенджер, искать вас и писать сообщение, ведь, чем сложнее с вами связаться, тем больше вероятность, что клиент отвлечется и уже забудет о вас или ему будет просто лень писать вам! Вы можете уже заранее ввести нужный текст-шаблон для клиента, чтобы ему не пришлось ничего писать!'|gettext}}</div>
		</section>
		
		<section v-if="currentTab == 'common' && values.items.length" @click="$parent.scrollToTariff">	
			<div class="row row-small">
			<div class="col-xs" style="align-self: center">
				<span v-if="mode == 'edit'">{{'Добавлено всего'|gettext}}: {{_.size(values.items)}}</span>
				<span v-else><b>{{'Выберите мессенджер'|gettext}}</b></span>
			</div>
			<div class="col-xs" style="flex:0">
				<button class="button is-success" @click="setMode('choose')" v-if="mode == 'edit'" :class="{disabled: _.size(values.items) >= _.size(items)}"><i class="fas fa-plus has-mr-1"></i>{{'Добавить еще'|gettext}}</button>
				<button class="button is-dark" @click="mode = 'edit'" v-if="mode == 'choose'">{{'Отмена'|gettext}}</button>
<!-- 			<button class="button is-success" @click="setMode('edit')" v-if="mode == 'choose'">Готово</button> -->
			</div>
			</div>
		</section>
		
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<b-field :label="'Внешний вид'|gettext">
			<b-select v-model="values.messenger_style" :disabled="info.is_readonly" expanded>
				<option v-for="(f, i) in variants.messenger_style" :value="i">{{ f }}</option>
			</b-select>
		</section>
		
		<section v-if="currentTab == 'common' && mode == 'edit'" @click="$parent.scrollToTariff">	
		<vue-component-sortable-form-fields v-model="values.items" class="has-mb-2" :current.sync="current">
		<template v-slot:title="{ item }">
			<span>{{items[item.n].title}}</span>
		</template>
		
		<template v-slot:action="{ index }">
			<a class="is-pulled-right has-text-danger" @click.stop="deleteItem(index)"><i class="fa fa-trash-alt"></i></a>
		</template>
		
		<template v-slot:form="{ item, index }">
			<b-field :label="'Текст ссылки'|gettext">
				<input v-model="item.t" class="input" :placeholder="items[item.n].placeholder|gettext|format(items[item.n].title)" :disabled="info.is_readonly">
			</b-field>

			<div class="form-messengers-switch has-text-grey" v-if="Object.keys(items[item.n].types).length > 1">
				<a v-for="(t, k) in items[item.n].types" :class="{'has-text-black': item.tp == k, 'has-text-grey': item.tp != k}" @click="item.tp = k">{{t.check|gettext}}</a>
			</div>

			<b-field v-for="(t, k) in items[item.n].types" v-if="(Object.keys(items[item.n].types).length == 1) || (item.tp == k)" :label="t.label|gettext|format(items[item.n].title)" :message="getError(item.n, k)" :class="{'has-error': getError(item.n, k)}">
				<input v-model="item[k]" v-if="t.type == 'input'" class="input" :disabled="info.is_readonly" :placeholder="t.placeholder|gettext">
				<mx-phone v-model="item[k]" v-if="t.type == 'phone'" :disabled="info.is_readonly"></mx-phone>
			</b-field>
			
			<b-field v-for="(ipt, inm) in items[item.n].inputs" :label="ipt.label|gettext|format(items[item.n].title)">
				<textarea v-if="ipt.type == 'textarea'" v-model="item[inm]" :placeholder="ipt.placeholder|gettext" class="input" :disabled="info.is_readonly" style="min-height: 100px"></textarea>
			</b-field>
			
			<div v-if="item.n == 'ln'" class="has-mt-2">
				<div>{{'Как получить ссылку'|gettext}}: 
					<b-tooltip :label="textLine1" position="is-top" animated multilined type="is-black"><span class='has-text-danger'>Line@</span></b-tooltip> /
					<b-tooltip :label="textLine2" position="is-top" animated multilined type="is-black"><span class='has-text-danger'>Line</span></b-tooltip>
				</div>
			</div>
		</template>
		</vue-component-sortable-form-fields>

		</section>
		
		<section v-if="currentTab == 'common' && mode == 'choose'" @click="$parent.scrollToTariff">	
			<div v-for="(w, i) in variants.list">
<!-- 			<h4 class="has-mb-1" :class="{'has-mt-2': i}">{{w.group}}</h4> -->
			<div class="select-list row row-small">
				<label v-for="(item, index) in w.items" class="col-xs-6 col-sm-4 has-mb-2" :class="{in: selected.indexOf(index) != -1, disabled: info.is_readonly}"><span :class="['btn-socials btn-link-'+index]" @click="selectItem(index)"><!-- <span> --><i :class="icon(index)"></i><span>{{item.title}}</span></span><!-- <i class="fas"></i></span> --></label>
			</div>
			</div>
		</section>		
		
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<vue-pages-blocks-form-design :values.sync="values.design" :info="info"></vue-pages-blocks-form-design>
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		
<!--
		<keep-alive>
			<vue-pages-blocks-form-addons :block_id="block_id" :block_type_id="block_type_id" :addons_values.sync="addons_values" :disabled="info.is_readonly" :parent="parent" v-if="currentTab == 'addons'" @click="$parent.scrollToTariff">
				<template slot="message">{{'Вы можете выбрать модули которые будут срабатывать для данной ссылки'|gettext}}</template>
				<template slot="empty">{{'Модули для данного блока еще не подключены'|gettext}}</template>
			</vue-pages-blocks-form-addons>
		</keep-alive>
-->

		
<!--
		<keep-alive>
			<vue-pages-blocks-form-statistics :page_id="values.page_id" :block_id="block_id" v-if="currentTab == 'statistics'" @click="$parent.scrollToTariff"></vue-pages-blocks-form-statistics>
		</keep-alive>
		
-->
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-page", {props: ['values', 'info', 'variants', 'block', 'block_id', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		created() {
			this.block.title = this.$gettext('Новая страница');
			this.$emit('update:message', this.$gettext('С помощью этого блока, вы сможете создавать множество внутренних страниц с отдельной ссылкой'));
			this.$emit('update:tabs', []);
		},
		
		methods: {
			prepareValues() {
				return this.values;
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff">
		
			<b-field :label="'Открыть страницу'|gettext">
				<b-select v-model="values.link_page_id" :disabled="info.is_readonly" expanded>
					<option :value="null">{{'-- Создать новую страницу --'|gettext}}</option>
					<option v-for="(v, k) in variants.link_page_id" :value="k">{{v}}</option>
				</b-select>
			</b-field>

			<b-field :label="'Название страницы'|gettext" :message="errors.title" :class="{'has-error': errors.title}" v-if="!values.link_page_id">
				<input v-model="values.title" class="input" :disabled="info.is_readonly">
			</b-field>
		
		</section>
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-pictures", {data() {
			return {
/*
				isFetchingProduct: false,
				isFetchingCollection: false,
				autocompleteProducts: [],
				autocompleteCollections: [],
*/
				index: 0,
				picturesUpdating: 0,
				resortMode: false,
				deviceStyle: 'margin: 0 auto;display: block;height: auto'
			}
		},
		
		props: ['values', 'options', 'variants', 'info', 'block', 'block_id', 'statistics', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		created() {
			let theme = this.$account.theme;
			
			if (!this.block_id) {
				this.values.list = [{"p": null, "s":"", "t":"", "link": {"title":"", "type":"link","url":"","link":"","link_page_id":null,"product":"","collection":""}}];
			}
			
			this.values.design = _.merge(theme.block.pictures, this.values.design);
/*
			if (!this.values.design.title) this.values.design.title = '#000000';
			if (!this.values.design.text) this.values.design.text = '#000000';
			if (!this.values.design.bg) this.values.design.bg = '#ffffff';
			if (!this.values.design.button_text) this.values.design.button_text = '#0383de';
			if (!this.values.design.nav) this.values.design.nav = '#53a3e0';
*/
			
			
			this.block.title = this.$gettext('Карусель картинок');
			this.$emit('update:tabs', [{name: 'common', title: this.$gettext('Картинки')}, 'options', 'statistics', 'section']);
		},
		
		mounted() {
			$mx(this.$refs.device).on('changeindex', (e, idx) => {
				this.index = idx;
			})
		},
		
		destoyed() {
			$mx(this.$refs.device).off('changeindex');
		},
		
		computed: {
			link() {
				return this.values.list[this.index].link;
			},
			
			pictureSizeStyle() {
				let sizes = {
					100: 100,
					70: '70.6',
					50: 50,
					138: '141.4516'
				}
				return 'padding-top:'+sizes[this.values.picture_size]+'%';
			},
			
			brightnessClass() {
				let t = this.$account.theme;
				let color = this.values.design.on?this.values.design.bg:(((t.block == undefined)?StylesFactory.getBaseStyles():t).block.pictures.bg);
				return isLightColor(color)?'is-light':'is-dark';
			},
			
			stylesheetText() {
				var s = '';
				if (this.values.design.on/*  && (this.values.design.text || this.values.design.bg) */) s =  
					(this.values.design.text?('color:'+this.values.design.text+' !important;'):'') + 
					(this.values.design.bg?('background:'+this.values.design.bg+' !important;'):'');

				return s;
			},
			
			stylesheetTitle() {
				var s = '';
				if (this.values.design.on/*  && (this.values.design.text || this.values.design.bg) */) s =  
					(this.values.design.title?('color:'+this.values.design.title+' !important;'):'');

				return s;
			},
			
			stylesheetLink() {
				var s = '';
				if (this.values.design.on/*  && (this.values.design.button_text || this.values.design.bg) */) s =
					(this.values.design.button_text?('color:'+this.values.design.button_text+' !important;'):'') + 
					(this.values.design.bg?('background:'+this.values.design.bg+' !important;'):'');
				return s;
			}
			
/*
			stylesheetDot() {
				var s = '';
				if (this.values.design.on) s =
					(this.values.design.nav?('background:'+this.values.design.nav+' !important;'):'');
				return s;
			}
*/
		},
		
		methods: {
			switchReorderMode() {
				this.resortMode = !this.resortMode;
				if (this.resortMode) {
					this.$nextTick(() => {
						let o = this.$refs.toolbar;
						scrollIt(o, 'y', $mx(o).closest(this.$device.mobile?'.modal-card-body':'.modal')[0], 400);
					});
				}
			},
			
			prepareResortStyle(p) {
				return (p == undefined || p.progress != undefined || p.link == undefined)?'none':('url('+p.link+')');
			},
						
			onDeletePicture(i, e) {
				if (this.values.list.length == 1) {
					if (e.empty) {
						this.$alert(this.$gettext('В карусели должна быть хотя бы одна картинка'), 'is-danger');
					}
					return;
				}
				
				if (this.index == i && i) this.setIndex(this.index - 1);
				this.values.list.splice(i, 1);
				
				if (this.values.list.length == 1) this.resortMode = false;
			},
			
			addSlide() {
				if (this.values.list.length >= 15) {
					this.$alert(this.$gettext('Максимальное количество слайдов')+': 15', 'is-danger');
                } else {
					this.values.list.push({p: null, s: '', t: '', link: {title: '', type: this.values.list[this.index].link.type, link: '', link_page_id: null, product: '', collection: ''}});
					this.setIndex(this.values.list.length - 1);
                }
			},
			
			setIndex(i) {
				this.index = i;
				this.$nextTick(() => {
					let dots = this.$refs.sliders.querySelectorAll('div');
					$mx(dots[i]).trigger('click');
				});
			},
			
			prepareValues() {
				let values = this.$clone(this.values);
				
				values.list = _.map(values.list, (item) => {
					item.p = item.p?item.p.picture_id:null;
					return item;
				});
				
				let theme = this.$account.theme.block.pictures;
				values.design = (values.design.on && _.size(_.differenceWith(theme, values.design)))?values.design:{on: false};
				
// 				if ((values.design.text == '#000000') && (values.design.bg == '#ffffff') && (values.design.button_text == '#0383de')) values.design = {on: false}
				
				return values;
			},
			
			startUploading() {
				this.picturesUpdating++;
				//this.$emit('update:allowSave', this.picturesUpdating == 0);
			},
			
			stopUploading() {
				this.picturesUpdating--;
				//this.$emit('update:allowSave', this.picturesUpdating == 0);
			},
			
			showErrors(r) {
				if (r.errors['slide:position'] != undefined) {
					this.$refs.sliders.childNodes[r.errors['slide:position']].click();
					setTimeout(() => {
						$mx(this.$refs.linkEditor.$el).find('.link-editor-place input, .link-editor-place select')[0].focus();
					}, 100);
					
				}
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks" :class="{'is-rtl': $account.locale.text_direction == 'rtl'}">
		<section v-if="info.is_readonly && (currentTab == 'common')" class="message is-warning">
			<div class="message-body">{{'Здесь вы можете загрузить изображения или галерею картинок, добавить к ним описание и ссылки'|gettext}}</div>
		</section>

		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff">
			<div class="field">
			<div class='device-pictures-form device-pictures-form-pictures'>
				<center>
					<div class="device has-shadow is-large is-hide-mobile" :class="{disabled: info.is_readonly}" style="margin:0 auto;min-height:auto">
					<div class="notch"></div>
				    <div class="screen main-theme page-font block-slider" :class="brightnessClass"> <!-- :style="{'background-color': $account.theme.bg.color1}" --> <!-- :class="StylesFactory.getPageClasses($account.theme)" -->
						<div ref='device' class="slider slider-pictures has-pb-2" :class="{'slider-has-text': values.options.text, 'slider-has-link': values.options.link, 'slider-has-border': !values.remove_border}">
							<div class="slider-inner">
								<div class="slider-slide" v-for="(f, i) in values.list">
									<vue-component-pictures v-model="f.p" :button-title="'Загрузить картинку'|gettext" button-icon="fa fal fa-cloud-upload" class="picture-container picture-container-upload" :style="pictureSizeStyle" styleContainer="padding-top: initial" @delete="onDeletePicture(i, $event)" always-delete-button updatable :disabled="info.is_readonly" @startUploading="startUploading" @stopUploading="stopUploading"></vue-component-pictures>
									<div class="slider-slide-text" :style="stylesheetText">
										<div class="slider-slide-title" v-if="f.t" :style="stylesheetTitle">{{f.t}}</div>
										<div class="slider-slide-title" :style="stylesheetTitle" v-else>{{'Заголовок'|gettext}}</div>
										<div class="slider-slide-snippet">{{f.s}}</div>
									</div>
									<a class="slider-slide-link" :style="stylesheetLink" v-if="f.link.title">{{f.link.title}}</a>
									<a class="slider-slide-link" :style="stylesheetLink" v-else>{{'Открыть'|gettext}}</a>
								</div>
							</div>
							<div class="slider-nav" :class="{'is-hidden': values.list.length == 1}" ref='sliders'>
								<div v-for="(v, i) in values.list" class="slider-dot" :class="{active: index == i}" @click="index = i"></div> <!-- :style="stylesheetDot" -->
							</div>
						</div>
				    </div>
					</div>
				</center>
				<div class='form-shadow form-shadow-bottom is-hidden-mobile' style="height: 20px"></div>
			</div>
			
			<div class="has-pt-2 row row-small" ref='toolbar'>
				<div class="col-xs-6 col-sm-5 col-sm-offset-1">
					<button type="button" class="button is-success is-fullwidth" :disabled="info.is_readonly || resortMode" @click="addSlide"><i class='fas fa-plus has-mr-1'></i>{{'Новый слайд'|gettext}}</button>
				</div>
				<div class="col-xs-6 col-sm-5">
					<button type="button" :class="['button is-dark is-fullwidth', {'is-active': resortMode}]" @click="switchReorderMode" :disabled="info.is_readonly || values.list.length < 2">{{'Порядок слайдов'|gettext}}</button> 
				</div>
			</div>
			</div>
		</section>
		
		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff">
			<div v-if="resortMode">
<!-- 				<h3 class="has-mb-2">{{'Порядок слайдов'|gettext}}</h3> -->
				<sortable-list v-model="values.list" class="pictures-sortable-list pictures-form-resort" axis="xy" use-drag-handle v-if="resortMode">
					<sortable-item v-for="(v, i) in values.list" class="upload-picture upload-picture-multiple" :index="i" :key="i" :item="v">
						<div v-sortable-handle :class="['picture-container pictures-form-resort-item', {'picture-container-empty': !v.p}]" :style="{'background-image':prepareResortStyle(v.p)}"></div>
					</sortable-item>
				</sortable-list>
			</div>
			<div v-else>
				<mx-toggle v-model="values.options.text" :title="'Добавить описание'|gettext" :disabled="info.is_readonly"></mx-toggle>
				<div style="padding-top: 15px" v-if="values.options.text">
				<div class="has-mb-2">
					<label class="label">{{'Заголовок'|gettext}}</label>
					<vue-component-emoji-picker v-model="values.list[index].t">
						<input type="text" v-model="values.list[index].t" class="input has-rtl" maxlength="50" :disabled="info.is_readonly">
					</vue-component-emoji-picker>
				</div>
				<div>
					<label class="label">{{'Описание'|gettext}}</label>
					<vue-component-emoji-picker v-model="values.list[index].s">
						<textarea class="input has-rtl" v-model="values.list[index].s" rows="5" id='sliderTextSnippet' maxlength="400" :disabled="info.is_readonly"></textarea>
					</vue-component-emoji-picker>
				</div>
				</div>
			</div>
		</section>
		
		<section v-if="currentTab == 'common' && !resortMode" @click="$parent.scrollToTariff">
			<mx-toggle v-model="values.options.link" :title="'Добавить ссылку'|gettext" :disabled="info.is_readonly"></mx-toggle>
			<div style="padding-top: 15px" v-if="values.options.link">
			
			<div class="has-mb-2">
				<label class="label">{{'Текст ссылки'|gettext}}</label>
				<input type='text' class='input' v-model="link.title" :disabled="info.is_readonly">
			</div>
			
			<vue-component-link-editor :values.sync="link" :variants="variants" :info="info" ref="linkEditor"></vue-component-link-editor>
		</section>
		
		<section v-if="currentTab == 'common' && !resortMode" @click="$parent.scrollToTariff">
			<div class="row">
				<div class="col-sm-12">
					<label class='label'>{{'Размер картинки'|gettext}}</label>
					<b-select v-model="values.picture_size" :disabled="info.is_readonly" expanded>
						<option v-for="(v, k) in variants.picture_size" :value="k">{{v}}</option>
					</b-select>
				</div>
			</div>
		</section>
		
		<section v-if="currentTab == 'common' && !resortMode" @click="$parent.scrollToTariff">
			<div class="row">
				<div class="col-sm-12">
					<label class='label'>{{'Автоматическая смена слайдов'|gettext}}</label>
					<div class="row">
						<div class="col-xs-6 col-sm-4">
						<div class="field has-addons">
							<div class="control is-expanded"><input type='number' v-model='values.carousel_interval' class='input' :disabled="info.is_readonly || !values.carousel_ride"></div>
							<div class="control"><span class="button is-static">{{'сек'|gettext}}</span></div>
						</div>
						</div>
						
						<div class="col-xs-6 col-sm-8">
						<b-checkbox v-model='values.carousel_ride' :disabled="info.is_readonly">{{'Включить'|gettext}}</b-checkbox>
						</div>
					</div>
				</div>
			</div>
		</section>
		
		
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<div class="label-pro-container">

				<div class="tag is-pro" v-if="$account.tariff != 'pro' && $account.tariff != 'business'" v-tippy :content="'Эта возможность доступна<br>на pro тарифе'|gettext">pro</div>
		
				<div :class="{disabled: $account.tariff != 'pro' && $account.tariff != 'business'}">
					<div class="has-mb-2"><mx-toggle v-model='values.design.on' :title="'Свои настройки дизайна'|gettext" :disabled="info.is_readonly"></mx-toggle></div>
				
					<div class="has-mb-4" v-if="values.design.on">
						<vue-component-design-pictures v-model="values.design" :disabled="info.is_readonly"></vue-component-design-pictures>
<!--
						<div class="has-mb-2">
							<vue-component-colorpicker v-model="values.design.bg" :disabled="info.is_readonly" :colors="[$account.theme.link.bg]" :label="'Цвет фона кнопки'|gettext"></vue-component-colorpicker>
						</div>
						<div class="has-mb-2">
							<vue-component-colorpicker v-model="values.design.text" :disabled="info.is_readonly" :colors="[$account.theme.link.color]" :label="'Цвет текста'|gettext"></vue-component-colorpicker>
						</div>
						<div class="has-mb-2">
							<vue-component-colorpicker v-model="values.design.button_text" :disabled="info.is_readonly" :colors="[$account.theme.link.color]" :label="'Цвет текста кнопки'|gettext"></vue-component-colorpicker>
						</div>				
-->
					</div>
				</div>

			</div>
			<div class="has-mb-2"><mx-toggle v-model='values.remove_border' :title="'Убрать бордюр'|gettext" :disabled="info.is_readonly"></mx-toggle></div>
			<div class="has-mb-2"><mx-toggle v-model='values.is_desktop_fullwidth' :title="'Отображать боковые слайды на ПК'|gettext" :disabled="info.is_readonly"></mx-toggle></div>
			
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-socialnetworks", {props: ['values', 'options', 'parent', 'variants', 'info', 'block', 'block_id', 'block_type_id', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		data() {
			return {
				current: 0,
				addons_values: null,
				mode: 'edit',
				selected: []
			}
		},
		
		created() {
			this.block.title = this.$gettext('Социальные сети');
			this.$emit('update:tabs', [{name: 'common', title: this.$gettext('Ссылки')}, 'options', 'statistics', 'section', 'addons']);
			if (!this.values.items.length) this.setMode('choose');
		},
		
		computed: {
			items() {
				let result = {};
				_.each(this.variants.list, (w) => {
					_.each(w.items, (v, k) => result[k] = v);
				});
				
				return result;
			}
		},
		
		watch: {
			values: {
				handler() {
					if (!this.values.items.length) this.setMode('choose');
				},
				deep: true
			}
		},
		
		methods: {
			deleteItem(index) {
				this.$confirm(this.$format(this.$gettext('Вы уверены что хотите удалить {1}?'), this.items[this.values.items[index].n].title), 'is-danger').then(() => {
					this.values.items.splice(index, 1)
				});
			},
			
			icon(index) {
				let item = this.items[index];
				return 'fa fab fa-'+((item.icon != undefined)?item.icon:index);
			},
			
			iconPaths(index) {
				let l = this.items[index];
				let s = '';
				if (l.icon_paths != undefined) for (i = 1; i <= l.icon_paths; i++) s += '<em class="p'+i+'"></em>';
				return s;
			},
			
			setMode(mode) {
				switch (mode) {
					case 'choose':
						this.selected = _.map(this.values.items, 'n');
						break;
					case 'edit':
						let currents = _.map(this.values.items, 'n');
						
						_.each(this.selected, v => {
							let idx = currents.indexOf(v);
							if (idx == -1) {
								let item = {n: v, t: "", v: ""};
								if (this.items[v].checkboxes != undefined) _.each(this.items[v].checkboxes, (w, k) => { item[k] = false; })
								this.values.items.push(item);
							} 
						});
						
						_.each(currents, v => {	
							let idx = this.selected.indexOf(v);
							if (idx == -1) {
								let tmp = _.map(this.values.items, 'n');
								this.values.items.splice(tmp.indexOf(v), 1);
							}
						});
						break;
				}
				
				this.mode = mode;
			},
			
			selectItem(name) {
				let idx = this.selected.indexOf(name);
				if (idx != -1) {
// 					if (this.selected.length > 1) this.selected.splice(idx, 1);
				} else {
					this.selected.push(name);
					this.setMode('edit');
					this.current = this.selected.length - 1;
/*
					let item = {n: name, t: "", v:"", a:0};
					this.values.items.push(item);
*/
				}
			},
			
			prepareValues() {
				let values = this.$clone(this.values);
// 				values.addons_values = this.addons_values;

				return values;
			},
			
			getError(part, val) {
				return this.errors[part]?this.errors[part][val]:null;
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
		<section v-if="info.is_readonly && (currentTab == 'common')" class="message is-warning">
			<div class="message-body">{{'Добавьте кнопки на другие социальные сети'|gettext}}</div>
		</section>

		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<b-field :label="'Внешний вид'|gettext">
			<b-select v-model="values.socials_style" :disabled="info.is_readonly" expanded>
				<option v-for="(f, i) in variants.socials_style" :value="i">{{ f }}</option>
			</b-select>
			</b-field>
		</section>
		
		<section v-if="currentTab == 'common' && values.items.length" @click="$parent.scrollToTariff">	
			<div class="row row-small">
			<div class="col-xs" style="align-self: center">
				<span v-if="mode == 'edit'">{{'Добавлено всего'|gettext}}: {{_.size(values.items)}}</span>
				<span v-else><b>{{'Выберите социальную сеть'|gettext}}</b></span>
			</div>
			<div class="col-xs" style="flex:0">
				<button class="button is-success" @click="setMode('choose')" v-if="mode == 'edit'" :class="{disabled: _.size(values.items) >= _.size(items)}"><i class="fas fa-plus has-mr-1"></i>{{'Добавить еще'|gettext}}</button>
				<button class="button is-dark" @click="mode = 'edit'" v-if="mode == 'choose'">{{'Отмена'|gettext}}</button>
<!-- 			<button class="button is-success" @click="setMode('edit')" v-if="mode == 'choose'">Готово</button> -->
			</div>
			</div>
		</section>
		
		<section v-if="currentTab == 'common' && mode == 'choose'" @click="$parent.scrollToTariff">	
			<div v-for="(w, i) in variants.list">
			<h4 class="has-mb-1" :class="{'has-mt-2': i}">{{w.group}}</h4>
			<div class="select-list row row-small">
				<label v-for="(item, index) in w.items" class="col-xs-6 col-sm-4 has-mb-2" :class="{in: selected.indexOf(index) != -1, disabled: info.is_readonly}"><span :class="['btn-socials btn-socials-'+index]" @click="selectItem(index)"><i :class="icon(index)" v-html="iconPaths(index)"></i><span>{{item.title}}</span></span><!-- <i class="fas"></i></span> --></label>
			</div>
			</div>
		</section>
		
		<section v-if="currentTab == 'common' && mode == 'edit'" @click="$parent.scrollToTariff">	
			<vue-component-sortable-form-fields v-model="values.items" class="has-mb-2" :current.sync="current">
			<template v-slot:title="{ item }">
				<span>{{items[item.n].title}}</span>
			</template>
			
			<template v-slot:action="{ index }">
				<a class="is-pulled-right has-text-danger" @click.stop="deleteItem(index)"><i class="fa fa-trash-alt"></i></a>
			</template>
			
			<template v-slot:form="{ item, index }">
				<b-field :label="'Текст ссылки'|gettext">
					<input v-model="item.t" class="input" :placeholder="items[item.n].p" :disabled="info.is_readonly" v-focus>
				</b-field>

				<b-field :label="items[item.n].v" :message="getError(item.n, 'link')" :class="{'has-error': getError(item.n, 'link')}">
					<input v-model="item.v" class="input" :disabled="info.is_readonly">
				</b-field>

				<div v-if="items[item.n].checkboxes">
				<div v-for="(c, ci) in items[item.n].checkboxes">
					<b-checkbox v-model="item[ci]" :disabled="info.is_readonly">{{c}}</b-checkbox>
				</div>
				</div>
				
			</template>
			</vue-component-sortable-form-fields>
		</section>
		
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<vue-pages-blocks-form-design :values.sync="values.design" :info="info"></vue-pages-blocks-form-design>
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-text", {props: ['values', 'options', 'info', 'variants', 'block', 'block_id', 'tabs', 'currentTab', 'section'],
		mixins: [FormModel],
		
		data() {
			return {
// 				text_sizes: {sm: '1.03', md: '1.26', lg: '1.48', h3: '1.71', h2: '2.2', h1: '3.5'},
				text_aligns: ['left', 'center', 'right', 'justify'],
				lastDefaultColor: '',
				lastDefaultFont: '',
				lastTextSize: '',
				cached_text_aligns: ['left', 'center']
			}
		},
		
		watch: {
			section: {
				handler(v) {
					if (this.lastDefaultColor == this.values.color) {
						this.values.color = this.defaultColor;
					}

					if (this.lastDefaultFont == this.values.font) {
						this.values.font = this.defaultFont;
					}

					this.lastDefaultColor = this.defaultColor;
					this.lastDefaultFont = this.defaultFont;
				},
				deep: true
			},
			
			values: {
				handler(v, o) {
					let textSizeChanged = (this.lastTextSize.substr(0, 1) != v.text_size.substr(0, 1)) && (this.lastTextSize.substr(0, 1) == 'h' || v.text_size.substr(0, 1) == 'h');
					
					if (textSizeChanged && (this.lastDefaultFont == this.values.font)) {
						this.lastDefaultFont = this.values.font = this.defaultFont;
					}

					if (textSizeChanged && (this.lastDefaultColor == this.values.color)) {
						this.lastDefaultColor = this.values.color = this.defaultColor;
					}
					
					this.lastTextSize = v.text_size;
				},
				deep: true
			}
		},
		
		computed: {
			isHeading() {
				return this.values.text_size.substr(0, 1) == 'h';
			},
			
			bg() {
				return (this.section.bg != undefined)?this.section.bg.color1:this.$account.theme.bg.color1;
			},
			
			color() {
				return this.values.color?this.values.color:this.defaultColor;
			},
			
			font() {
				return (this.values.font !== '')?this.values.font:this.defaultFont;
			},
			
			s() {
				return this.isHeading?this.section.heading:this.section.text;
			},
			
			t() {
				return this.isHeading?this.$account.theme.heading:this.$account.theme.screen;
			},
			
			defaultColor() {
				return ((this.s != undefined && this.s.color != undefined)?this.s.color:this.t.color);
			},
			
			defaultFont() {
				return ((this.s != undefined && this.s.font != undefined)?this.s.font:this.t.font);
			},
			
			weight() {
				let t = this.section.heading
				let s = this.$account.theme.heading;
				return FontsFactory.getWeight(this.font, (t != undefined && t.weight != undefined)?t.weight:s.weight);
			},
			
			style() {
				//((this.values.text_size[0] == 'h')?'font-weight:bold;':'')+
				//(lightOrDark(this.values.color) == 'light') &&
// 				let lineHeights = {h2: 1.25, h1: 1.15};
				return {'font-family': this.values.font?(globalFontsFallback[this.font]):null, 'text-transform': (this.isHeading?FontsFactory.getTransform((this.section.heading?this.section.heading:this.$account.theme.heading).transform):'none')+" !important", 'font-weight': (this.isHeading?this.weight:400)+" !important", padding: '.5rem 1rem', 'line-height': FontsFactory.getLineHeight(this.values.text_size)+" !important", 'text-align': this.values.text_align+" !important", 'font-size': FontsFactory.getTextSize(this.values.text_size)+" !important", color: this.color, background: (this.color != this.bg)?this.bg:null};
			}
		},
		
		created() {
			this.block.title = this.$gettext('Текст');

			if (!this.values.color) this.values.color = this.defaultColor;
			if (this.values.font === '') this.values.font = this.defaultFont;
			
			if (this.block_id == null && this.$account.locale.text_direction == 'rtl') this.values.text_align = 'right';
			
/*
			if (!this.section.id) {
				if (!this.values.color) this.values.color = this.$account.theme.screen.color;
				if (this.values.font === '') this.values.font = this.$account.theme.screen.font;
			}
*/
			
			this.cached_text_aligns[this.isHeading?1:0] = this.values.text_align;
			
			this.lastTextSize = this.values.text_size;
			this.lastDefaultColor = this.defaultColor;
			this.lastDefaultFont = this.defaultFont;
			
// 			this.lastSectionFont = this.values.font;
			
			this.$emit('update:tabs', [{name: 'common', title: this.$gettext('Текст')}, 'options', 'section']);
		},
		
		methods: {
/*
			changedTextSize(v) {
				console.log(this.values.text_size, ' = ', v);
// 				if (v.substr(0, 1) == 'h' && this.lastTextSize.substr(0, 1) != 'h') {}
					if (this.lastSectionFont != v) this.values.font = '';
					this.lastSectionFont = this.values.font = this.font;

				if (this.lastSectionFont == this.font) {
					console.log('****');
					this.values.font = '';
					this.values.font = this.font;
				}
				
				this.values.text_align = this.cached_text_aligns[this.isHeading?1:0];
				this.lastTextSize = v;
			},
*/
			
			changedTextAlign(v) {
				this.cached_text_aligns[this.isHeading?1:0] = v;
			},
			
			prepareValues() {
				let values = this.$clone(this.values);
				
// 				this.values.color = '';
// 				this.values.font = '';

// 				let theme = this.$account.theme;
				if (values.color == this.defaultColor) values.color = '';
				if (values.font == this.defaultFont) values.font = '';

				return values;
			}
		}, template: `
	<section class="modal-card-body modal-card-body-block-text modal-card-body-blocks" :class="{'is-rtl': $account.locale.text_direction == 'rtl'}">
		<section v-if="currentTab == 'common'">
			<div class="row row-small has-mb-2">
				<div class="col-xs-8 col-sm has-xs-mb-2">
					<b-field>
					<b-select v-model="values.text_size" :disabled="info.is_readonly" expanded>
					<optgroup :label="'Текст'|gettext">
						<option value="sm">{{'Маленький текст'|gettext}}</option>
						<option value="md">{{'Средний текст'|gettext}}</option>
						<option value="lg">{{'Большой текст'|gettext}}</option>
					</optgroup>
					<optgroup :label="'Заголовок'|gettext" >
						<option value="h3">{{'Маленький заголовок'|gettext}}</option>
						<option value="h2">{{'Средний заголовок'|gettext}}</option>
						<option value="h1">{{'Большой заголовок'|gettext}}</option>
					</optgroup>
<!-- 						<option v-for="(v, k) in variants.text_size" :value="k">{{v}}</option> -->
					</b-select>
					</b-field>
				</div>
				<div class="col-xs col-sm-shrink">
					<vue-component-font-chooser v-model="values.font" :fullwidth="true" :default-font="defaultFont"></vue-component-font-chooser>				
				</div>
				<div class="col-xs col-sm-shrink">
					<b-field>
			            <b-radio-button @input="changedTextAlign" v-model="values.text_align" v-for="v in text_aligns" type="is-dark" class="is-expanded" :native-value="v" :disabled="info.is_readonly"><i :class="'fa fa-align-{1}'|format(v)"></b-radio-button>
					</b-field>		
				</div>

				<div class="col-xs col-shrink">
					<vue-component-colorpicker v-model="values.color" :disabled="info.is_readonly" :colors="[defaultColor]"></vue-component-colorpicker>				
				</div>

			</div>
			<vue-component-emoji-picker v-model="values.text">
				<textarea class="input has-rtl" :placeholder="'Текст'|gettext" :style="style" v-emoji v-model="values.text" :disabled="info.is_readonly"></textarea>
			</vue-component-emoji-picker>
		</section>
		
		<section v-if="currentTab == 'options'">
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-timer", {data() {
			return {
				weekdays: this.$getDaysNames(),
				months: this.$getMonthsNames(),
				first_day_week: this.$getFirstDayWeek()
			}
		},

		props: ['values', 'options', 'variants', 'info', 'block', 'block_id', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		computed: {
			date: {
				get() {
					return this.values.timer[1].date?(new Date(this.values.timer[1].date)):null;
				},
				
				set(v) {
					this.values.timer[1].date = v?date_format('Y-m-d',v):null;
				}
			},
			
			time: {
				get() {
					if (this.values.timer[1].time)
					{
						let dt = this.values.timer[1].time.split(':')
						return new Date(0, 0, 0, dt[0], dt[1]);
					}
					else
					{
						return null;
					}				
				},
				
				set(v) {
					this.values.timer[1].time = v?date_format('H:i', v):null
				}
			},
			
			timeEveryday: {
				get() {
					if (this.values.timer[3].time)
					{
						let dt = this.values.timer[3].time.split(':')
						return new Date(0, 0, 0, dt[0], dt[1]);
					}
					else
					{
						return null;
					}				
				},
				
				set(v) {
					this.values.timer[3].time = v?date_format('H:i', v):null
				}

			}
		},
		
		created() {
			this.block.title = this.$gettext('Таймер обратного отсчета');
			this.$emit('update:tabs', [{name: 'common', title: this.$gettext('Таймер')}, 'options', 'section']);
		},
		
		methods: {
			prepareValues() {
				return this.values;
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
		<section v-if="info.is_readonly && (currentTab == 'common')" class="message is-warning">
			<div class="message-body">{{'Добавьте таймер обратного отсчета для временного ограничения — успеть поучаствовать в акции, записаться на курс и т.д.'|gettext}}</div>
		</section>

		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff">
		
			<b-field :label="'Тип таймера'|gettext">
				<b-select v-model="values.type" :disabled="info.is_readonly" expanded>
					<option v-for="(v, k) in variants.type" :value="k">{{v}}</option>
				</b-select>
			</b-field>
			
			<div  v-if="values.type == 1">
				<div class="message is-info" v-if="!info.is_readonly">
					<div class="message-body">{{'Укажите дату и время окончания отсчета'|gettext}}</div>
				</div>
				
				<div class="row">
					<div class="col-xs-8">
						<b-field :label="'Дата'|gettext" :message="errors.tms_1" :class="{'has-error': errors.tms_1}">
						<div class="has-feedback">
							<b-datepicker v-model="date" icon="calendar-alt" :disabled="info.is_readonly" :day-names="weekdays" :month-names="months" :first-day-of-week="first_day_week"></b-datepicker>
							<a class="form-control-feedback has-text-grey-light" @click="date = null" :class="{disabled: info.is_readonly}"><i class="fal fa-times"></i></a>	
						</div>
						</b-field>
					</div>
					<div class="col-xs-4">
						<label class="label">{{'Время'|gettext}}:</label>
						<div class="has-feedback">
							<b-clockpicker v-model="time" :disabled="info.is_readonly" hour-format="24"></b-clockpicker>
							<a class="form-control-feedback has-text-grey-light" @click="time = null" :class="{disabled: info.is_readonly}"><i class="fal fa-times"></i></a>	
						</div>
					</div>
				</div>
			</div>	
			
			<div v-if="values.type == 2">
				<div class="message is-info"><div class="message-body">{{'Таймер будет запущен при первом посещении страницы клиентом. Укажите длительность таймера.'|gettext}}</div></div>
				<b-field :message="errors.tms_2" :class="{'has-error': errors.tms_2}">
					<div class="row has-mb-3">
					<div class="col-xs-4 col-sm-3">
						<label class="label">{{'Дни'|gettext}}:</label>
						<input type='number' v-model='values.timer[2].days' class='input' placeholder="0" maxlength="3" :disabled="info.is_readonly" min="1" max="99">
					</div>
					<div class="col-xs-4 col-sm-3">
						<label class="label">{{'Часы'|gettext}}:</label>
						<input type='number' v-model='values.timer[2].hours' class='input' placeholder="00" maxlength="2" :disabled="info.is_readonly" min="1" max="24">
					</div>
					<div class="col-xs-4 col-sm-3">
						<label class="label">{{'Минуты'|gettext}}:</label>
						<input type='number' v-model='values.timer[2].minutes' class='input' placeholder="00" maxlength="2" :disabled="info.is_readonly" min="1" max="60">
					</div>
					</div>
				</b-field>
			
				<b-field :label="'Через сколько дней сбрасывать таймер'|gettext" :message="errors.expires_2" :class="{'has-error': errors.expires_2}">
				<div class="row">
					<div class="col-xs-4 col-sm-3">
						<input type='number' v-model='values.timer[2].expires' class='input' placeholder="0" maxlength="3" :disabled="info.is_readonly">
					</div>
				</div>	
				</b-field>
			</div>					

			<div v-if="values.type == 3">
				<div class="message is-info"><div class="message-body">{{'Таймер будет перезапускаться каждый день. Укажите время окончания таймера.'|gettext}}</div></div>
				<b-field :label="'Время'|gettext" :message="errors.tms_3" :class="{'has-error': errors.tms_3}">
				<div class="row">
					<div class="col-md-3 col-sm-4 col-xs-6">
						<div class="has-feedback">
							<b-clockpicker v-model="timeEveryday" :disabled="info.is_readonly" hour-format="24"></b-clockpicker>
							<a class="form-control-feedback has-text-grey-light" @click="timeEveryday = null" :class="{disabled: info.is_readonly}"><i class="fal fa-times"></i></a>	
						</div>
					</div>
				</div>
				</b-field>
			</div>
		</section>
		
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-blocks-video", {props: ['values', 'options', 'info', 'variants', 'block', 'block_id', 'tabs', 'currentTab'],
		mixins: [FormModel],
		
		created() {
			this.block.title = this.$gettext('Видео');
			this.$emit('update:tabs', [{name: 'common', title: this.block.title}, 'options', 'section']);
		},
		
		computed: {
			provider() {
				return VideoHelper.getProviderName(this.values.url);
			}
		},
		
		methods: {
			prepareValues() {
				let values = this.$clone(this.values);
				if (values.poster) values.poster = values.poster.picture_id;
				return values;
			},
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
		<section v-if="info.is_readonly && (currentTab == 'common')" class="message is-warning">
			<div class="message-body">{{'Вставьте видео для быстрого просмотра прямо на вашу страницу, без перехода на другой сайт'|gettext}}</div>
		</section>

		<section v-if="currentTab == 'common'" @click="$parent.scrollToTariff">
		
			<b-field :label="'Ссылка на видео'|gettext" :message="errors.url" :class="{'has-error': errors.url}">
				<div class="control">
				<input type="text" class="input" v-model="values.url" placeholder='http://' autocorrect="off" autocapitalize="none" :disabled="info.is_readonly"></input>
				<p class="help has-text-grey" v-if="!errors.url">{{'Поддерживается YouTube, Vimeo и видео формата mp4, m3u8 и webm'|gettext}}</p>
				</div>
			</b-field>
			
			<transition name="fade">
				<vue-component-pictures v-model="values.poster" v-if="provider == 'file'" :button-title="'Загрузить обложку'|gettext" button-icon="fa fal fa-cloud-upload" updatable class="addon-opengraph-picture has-mb-2"></vue-component-pictures>
			</transition>

			<mx-toggle v-model="values.is_autoplay" :title="'Автовоспроизведение на компьютере'|gettext" class="has-mb-2" :disabled="info.is_readonly"></mx-toggle>
			<mx-toggle v-model="values.is_autohide" :title="'Скрыть элементы управления'|gettext" :disabled="info.is_readonly"></mx-toggle>

		</section>
		
		<section v-if="currentTab == 'options'" @click="$parent.scrollToTariff">
			<vue-pages-blocks-form-options :values.sync="options" :info="info"></vue-pages-blocks-form-options>
		</section>
		<slot></slot>
	</section>
`});

window.$app.defineComponent("pages", "vue-pages-choose-form", {data() {
			return {
				mainPage: null,
				isFetching: false,
				isMainpageChanging: false,
				values: {pages: []}
			}
		},
		
		props: ['is_readonly'],

		created() {
			this.fetchData(true);
		},

		methods: {
			onAction(v) {
				switch (v) {
					case 'change':
						this.mainPage = this.$account.page_id;
						this.isMainpageChanging = true;
						break;
				}
			},
			
			saveMainpage() {
				if (this.$account.page_id != this.mainPage) {
					this.$api.get('pages/changemainpage', {page_id: this.mainPage}, this).then((data) => {
						this.$account.page_id = this.mainPage;
						this.isFetching = false;
						this.isMainpageChanging = false;
// 						this.$parent.$parent.fetchData(true);
					});
				} else {
					this.isMainpageChanging = false;
				}
			},
			
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('pages/list').then((data) => {
					this.isFetching = false;
					this.values.pages = data.response.pages;
				});

			},
			
			openPage(page_id) {
				this.$router.replace({name: 'pages', params: {page_id:page_id}});
				this.$parent.close();
			},
			
			newPage() {
				this.$modal('vue-pages-page-form', null, this);
				this.$parent.close();
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title" v-if="isMainpageChanging">{{'Смена главной страницы'|gettext}}</p>
			<p class="modal-card-title" v-else>{{'Страницы'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
					
			<div class="modal-pages-list">
<!--
			<a class="item" @click="openPage($account.page_id)">
				<i class="fa fas fa-mobile-android"></i> 
				<button class="button is-small is-default is-pulled-right" @click.stop="isChangingMainpage = true">{{'Сменить страницу'|gettext}}</button>
			</a>	
-->
			<div v-if="isMainpageChanging">
				<label class="item radio" v-for="f in values.pages">
					<input type="radio" v-model="mainPage" :value="f.page_id">
					<span v-if="f.title">{{f.title}}</span><span v-else class="has-text-grey">{{'Без имени'|gettext}}</span>
				</label>
			</div>
			<div v-else>
				<a class="item" @click="newPage" v-if="!is_readonly"><i class="fa fal fa-plus"></i> {{'Создать новую страницу'|gettext}}</a>
				<div class="modal-pages-list-hr" v-if="values.pages.length"></div>

				<a class="item" @click="openPage(f.page_id)" v-for="f in values.pages">
					<i class="fa fal fa-mobile-android"></i> 
					<span v-if="f.title">{{f.title}}</span><span v-else class="has-text-grey">{{'Без имени'|gettext}}</span>
					<span class="tag is-rounded is-success is-pulled-right" v-if="$account.page_id == f.page_id">{{'Главная страница'|gettext}}</span>
				</a>
			</div>
			</div>
			
		</section>
		<footer class="modal-card-foot level">
			<div class="level-left">
				<vue-component-action-button @action="onAction" v-if="!isMainpageChanging && !is_readonly" :title="'Действие'|gettext">
					<template slot="actions">
						<b-dropdown-item value="change"><i class="fa fa-home"></i> {{'Сменить главную страницу'|gettext}}</b-dropdown-item>
					</template>
				</vue-component-action-button>
			</div>
			<div class="level-right" v-if="isMainpageChanging">
				<button class="button is-dark" type="button" @click="isMainpageChanging = false" :disabled="isFetching">{{'Отмена'|gettext}}</button>
				<button class="button is-primary" type="button" @click="saveMainpage" :disabled="isFetching">{{'Сохранить'|gettext}}</button>
			</div>
			<div class="level-right" v-else>
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});

window.$app.defineComponent("pages", "vue-pages-nickname-changed-form", {data() {
			return {
				isFetching: false,
				isUpdating: false,
				values: {}
			}
		},
		
		created() {
			this.fetchData(true);
		},

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('pages/nicknamechanged/get').then((data) => {
					this.isFetching = false;
					this.values = data.response.pages.nicknamechanged;
				});
			},
			
			updateData() {
				this.isUpdating = true;
				
				this.$api.post('pages/nicknamechanged/set', {}, this).then((data) => {
					if (data.result == 'success') {
						this.$auth.refresh(data.response, () => {
							this.$parent.close();
						});
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})

			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Обновление ссылки'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
		
			<div class="message is-danger" v-if="values.is_busy">
				<div class="message-body">{{'Вы не можете поменять ссылку, имя уже занято другим аккаунтом.'|gettext}}</div>
			</div>

			<div class="field">
				{{'Ваш никнейм в Instagram изменился. Вам необходимо обновить ссылку в Instagram, после чего нажмите кнопку "Я обновил ссылку", чтобы зафиксировать изменения.'|gettext}}
			</div>
			
		
			<div class="field">
				<label class="label">{{'Старая ссылка'|gettext}}</label>
				<input type="text" class="input" readonly="on" :value="values.old|sprintf('https://taplink.cc/%s')">
			</div>
		
			<div class="field">
				<label class="label">{{'Новая ссылка'|gettext}}</label>
				<div class="field has-addons">
					<div class="control is-expanded"><input type="text" class="input" readonly="on" :value="values.new|sprintf('https://taplink.cc/%s')" id='pageLinkNew'></div>
					<div class="control"> 
						<vue-component-clipboard :text="values.new|sprintf('https://taplink.cc/%s')" class="button is-default" :show-icon="false">{{'Скопировать'|gettext}}</vue-component-clipboard>
					</div>
				</div>
			</div>
			
		</section>
		<footer class="modal-card-foot">
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData" :disabled="values.is_busy">{{'Я обновил ссылку'|gettext}}</button>
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Пока не обновил'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("pages", "vue-pages-page-blocks", {props: {page_id: Number, theme: Object, readonly: Boolean, pageData: Object, showHidden: {type: Boolean, default: true}, showReorder: {type: Boolean, default: true}, allowWelcome: Boolean, pageOptions: {default: {}}},
		
		computed: {
			showWelcome() {
				return this.allowWelcome && (this.data.blocks_order.length < 2) && ((this.$account.tips_bits & 16) == 0);
			},
			
			allowSections() {
				return this.$account.features.indexOf('sections') != -1;
			},
			
			scrollContainer() {
				return this.$device.mobile?$mx('.main-block')[0]:(document.scrollingElement || document.documentElement);
			},
			
			data() {
				return this.pageData?this.pageData:this.$page.data;
// 				return (this.$page.data.blocks_order.length > 1)?this.$page.data:{page: {is_readonly: 1}, blocks: {1: {block_type_name: 'avatar'}, 2: {block_type_name: 'avatar'}}, blocks_order: [1, 2]};
			},
			
			sections() {
				let last_section_id = null;
				let sections = [];
				let section = {blocks: []};
				
				for (i = 0; i < this.data.blocks_order.length; i++)  {
					let f = this.data.blocks[this.data.blocks_order[i]];
					
					if (f == undefined) continue;
					
					if (f.section_id != last_section_id) {
						if (section.blocks.length) sections.push(section);
						section = {section_id: f.section_id, blocks: []};
					}
					
					section.blocks.push({i: i, block_id: f.block_id});
					
					last_section_id = f.section_id;
				}
				
				if (section.blocks.length) sections.push(section);
				if (sections.length && sections[0].section_id) sections.unshift({section_id: null, bg: null, bg_layer: null, blocks: []});
							
				return sections;
			},
			
			is_readonly() {
				return this.data.page.is_readonly || this.readonly;
			}
		},
		
		methods: {
			iconPaths(l) {
				let s = '';
				if (l.ip != undefined) for (i = 1; i <= l.ip; i++) s += '<em class="p'+i+'"></em>';
				return s;
			},
			helperClass(e) {
				e.resolve($mx(e.node).closest('.blocks-section')[0].className.replace('blocks-section', ''));
			},

			bannerInnerStyle(o) {
				return (o.p && !o.is_stretch)?('width:'+((o.is_scale && o.width)?o.width:o.p.width)+'px'):'';
			},
			
			newBlock() {
				this.$modal('vue-pages-blocks-form-modal', {page_id: this.page_id}, this);
			},
			
			openForm(block_id) {
				if (!this.is_readonly) this.$modal('vue-pages-blocks-form-modal', {block_id: block_id}, this);
			},
			
			addLinkPage(block_id, title) {
				this.$modal('vue-pages-page-form', {values: {block_id: block_id, title: title}}, this);
			},
			
			sectionHandleDown(e, si) {
				let b = $mx('.main-block');
				let topOffset = b[0].scrollTop;
				
				let handle = $mx(e.target).addClass('in');
				let top = handle.position().top;
				let y = e.touches ? (e.touches[0].pageY + topOffset) : e.pageY;
				let data = this.data;
				
				
				function rebuildBlocks(y) {
					let blocks = {before: [], after: []/* , before_same: [], after_same: [] */}
					
					_.each($mx.makeArray(handle.closest('.blocks-list').find('.section-main > div > .block-item')), (o) => {
						let ob = $mx(o);
						let elem = {b: data.blocks[parseInt(o.className.match(/b-([0-9]+)/)[1])], y: ob.offset().top+ob.outerHeight()*.5};
						blocks[(y < elem.y)?'after':'before'].push(elem);
					});
					
					
					blocks.before = blocks.before.reverse();
					let before_section_id = blocks.before.length?blocks.before[0].b.section_id:null;
					let after_section_id = blocks.after.length?blocks.after[0].b.section_id:null;
					
					let i = 0;
					for (i = 0; i < blocks.before.length; i++) if (blocks.before[i].b.section_id != before_section_id) break;
					blocks.before.splice(before_section_id?(i-1):i);

					for (i = 0; i < blocks.after.length; i++) if (blocks.after[i].b.section_id != after_section_id) break;
					blocks.after.splice(after_section_id?(i-1):i);
					
					return blocks;
				}

				let blocks = rebuildBlocks(y);
				handle.css('top', top);
				
				let sections = this.sections;
				let cache = {};
				_.each(data.blocks, (v, i) => cache[i] = v.section_id );
				
				function mouseMove(e) {
					let pageY = e.touches ? (e.touches[0].pageY + topOffset) : e.pageY;
					e.preventDefault();
					 
					let changed = false;
					if (pageY > y) {
						// Идем вниз
						for (let i = 0; i < blocks.after.length; i++) {
							let b = blocks.after[i].b;
							if (blocks.after[i].y < pageY) {
								b.section_id = sections[si].section_id;
							} else {
								b.section_id = cache[b.block_id];
							}
						}
						
						let max = blocks.after.length?(blocks.after[blocks.after.length - 1].y + 8):y;
						pageY = Math.min(pageY, max);
					} else {
						// Идем вверх
						for (let i = 0; i < blocks.before.length; i++) {
							let b = blocks.before[i].b;
							if (blocks.before[i].y > pageY) {
								b.section_id = (sections[si+1] != undefined)?sections[si+1].section_id:null;
							} else {
								b.section_id = cache[b.block_id];
							}
						}

						let max = blocks.before.length?(blocks.before[blocks.before.length - 1].y - 8):y;
						pageY = Math.max(pageY, max);
					}

					handle.css('top', top + (pageY - y))
				}
				
				b.on('mousemove touchmove', mouseMove);
				b.one('mouseup touchend', (e) => {
					b.off('mousemove touchmove', mouseMove);
					
					let old_sections = {};
					_.each(cache, (v, k) => { 
						if (!v) return;
						if (old_sections[v] == undefined) old_sections[v] = [];
						old_sections[v].push(parseInt(k));
					})
					
					let new_sections = {};
					_.each(this.data.blocks, (b) => {
						if (b.section_id) {
							if (new_sections[b.section_id] == undefined) new_sections[b.section_id] = [];
							new_sections[b.section_id].push(parseInt(b.block_id));
						}
					});
					
					let modified = {};
					let deleted = _.difference(Object.keys(old_sections), Object.keys(new_sections));
					
					_.each(new_sections, (v, k) => {
						if (old_sections[k] != undefined && !_.isEqual(v, old_sections[k])) modified[k] = v;
					});
					
					if (_.size(modified) || _.size(deleted)) {
						this.$api.post('pages/sections', {page_id: this.page_id, modified: modified, deleted: deleted}, null, 'sections').then((data) => {
							if (data.result == 'fail') this.$page.fetchData(this.page_id, true);
						});
					}
					
					handle.removeClass('in');
					handle.css('top', null);
				});
			},
			
			picturesBrightnessClass(block_id) {
				let o = this.data.blocks[block_id].options

				let t = this.$account.theme;
				let color = o.design.on?o.design.bg:(((t.block == undefined)?StylesFactory.getBaseStyles():t).block.pictures.bg);
				return isLightColor(color)?'is-light':'is-dark';
			},
			
			prepareTextStyle(options) {
				let r = {'text-align': options.text_align, 'line-height': FontsFactory.getLineHeight(options.text_size), 'font-size': FontsFactory.getTextSize(options.text_size), color: options.color+'!important'};
				if (options.font) {
					Object.assign(r, {
						'font-family': FontsFactory.getFont(options.font)+" !important",
						'font-weight': (options.text_size[0] == 'h')?FontsFactory.getWeight(options.font, this.$account.theme.heading.weight):null
// 						'text-transform': (FontsFactory.isUpperCaseHeading(options.font)?'uppercase':'none')+" !important"
					});
				}
				FontsFactory.check();
				return r;
			},
			
			prepareText(text) {
				return text.trim()?text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/\n/g, '<br>'):this.$gettext('Редактировать текст');
			},
			
			sortEnd(e) {
				if (e.oldIndex != e.newIndex) {
					let index_after = (e.oldIndex < e.newIndex)?e.newIndex:(e.newIndex?(e.newIndex-1):-1);
					let after = (index_after != -1)?this.data.blocks_order[index_after]:null;
					
					if (_.size(this.data.sections) > 0) {
						let id_last_section = this.data.blocks[this.data.blocks_order[e.oldIndex]].section_id;
						
						let id1_section = (this.data.blocks[after] != undefined)?this.data.blocks[after].section_id:null;
						let id2_section = (this.data.blocks[this.data.blocks_order[index_after+1]] != undefined)?this.data.blocks[this.data.blocks_order[index_after+1]].section_id:null;
						
						if ((id_last_section != id1_section) && (id_last_section != id2_section)) {
							if (id1_section && (id1_section == id2_section)) {
								this.data.blocks[this.data.blocks_order[e.oldIndex]].section_id = id1_section;
							} else {
								//Если в секции один блок - не удаляем
								let tmp = this.data.blocks[this.data.blocks_order[e.oldIndex]].section_id;
								let tmp_amount = 0;
								_.each(this.data.blocks, (b) => { tmp_amount += (tmp == b.section_id)?1:0; }); 
								
								// Если это не последний блок в секции - удаляем
								if (tmp_amount > 1) this.data.blocks[this.data.blocks_order[e.oldIndex]].section_id = null;
							}
						}
					}
					
					this.$api.post('pages/resort', {page_id: this.page_id, id: this.data.blocks_order[e.oldIndex], after:after}, null, 'resort').then((data) => {
						if (data.result == 'fail') this.$page.fetchData(this.page_id, true);
					});
				}
			}			
		}, template: `
	<div class="theme-main" :class="StylesFactory.getPageClasses(theme)">
	<sortable-list class="blocks-list" :class="'valign-'+((pageOptions && pageOptions.valign != undefined)?pageOptions.valign:'top')" :style="{'flex-grow':showWelcome?0:1}" lockAxis="y" v-model="data.blocks_order" use-drag-handle helperClass="page-blocks main-theme is-reording" @helper="helperClass" @sortEnd="sortEnd" :useWindowAsScrollContainer="true" :scrollContainer="scrollContainer" :contentWindow="scrollContainer">
	<div v-for="(section, si) in sections" class="blocks-section" :class="[section.section_id?('has-s s-'+section.section_id):null, (sections[si+1] != undefined && sections[si+1].section_id)?'has-next-s':null, {'is-empty': !section.blocks.length}]"> <!-- section -->
	<div>
	<div class="page-container">
<!-- 	<div class="row"> -->
<!-- 		<div class="col-xs-12 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2"> -->
	<div class="section-main" :class="{'handles-hidden': !showReorder}" v-if="section.blocks.length"> <!-- section layer --> 
	<div>
	<sortable-item v-for="b in section.blocks" :class="['b-'+b.block_id, 'block-item', {'is-readonly': is_readonly || !showReorder}]" :index="b.i" :key="b.i" :item="data.blocks[b.block_id]" v-if="showHidden || data.blocks[b.block_id].is_visible">
		<div v-if="data.blocks[b.block_id].block_type_name == 'text'" class="block-text has-rtl" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
			<a @click="openForm(b.block_id)"><div :class="{'is-heading': data.blocks[b.block_id].options.text_size[0] == 'h'}" v-html="prepareText(data.blocks[b.block_id].options.text)" :style="prepareTextStyle(data.blocks[b.block_id].options)"></div></a>
		</div>

		<div v-if="data.blocks[b.block_id].block_type_name == 'avatar'" class="block-avatar" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
				<a @click="openForm(b.block_id)">
					<div class="has-text-centered"><img :src="$account.avatar.url" :class="data.blocks[b.block_id].avatar.size|sprintf('profile-avatar profile-avatar-%s')"></div>
					<div class="has-text-centered text-avatar" v-if="!data.blocks[b.block_id].avatar.is_hide_text && $account.nickname">{{$account.nickname}}</div><!-- has-mb-4 -->
				</a>
			</div>
		</div>

		<div v-if="data.blocks[b.block_id].block_type_name == 'courses-feed'" class="block-html" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
				<a @click="openForm(b.block_id)" style="background: #eee;text-align: center">
					Фид занятий курса
				</a>
			</div>
		</div>

		<div v-if="data.blocks[b.block_id].block_type_name == 'courses-lesson'" class="block-html" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
				<a @click="openForm(b.block_id)" style="background: #eee;text-align: center">
					Занятие курса
				</a>
			</div>
		</div>

		<div v-if="data.blocks[b.block_id].block_type_name == 'courses-progress'" class="block-html" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
				<a @click="openForm(b.block_id)" style="background: #eee;text-align: center">
					Прогресс курса
				</a>
			</div>
		</div>

		<div v-if="data.blocks[b.block_id].block_type_name == 'courses-navs'" class="block-html" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
				<a @click="openForm(b.block_id)" style="background: #eee;text-align: center">
					Навигация курса
				</a>
			</div>
		</div>
				
		<div v-if="data.blocks[b.block_id].block_type_name == 'html'" class="block-html" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
				<a @click="openForm(b.block_id)">
					<vue-component-blocks-html v-model="data.blocks[b.block_id].options.html"></vue-component-blocks-html>
				</a>
			</div>
		</div>
		
		
		<div v-if="data.blocks[b.block_id].block_type_name == 'link'" :class="!is_readonly?$format('block-link block-link-{1}', data.blocks[b.block_id].options.link_type):null"  :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-if="!is_readonly && showReorder"></div>
				<router-link v-if="(data.blocks[b.block_id].options.link_type == 'page') && data.blocks[b.block_id].options.link_page_id && !is_readonly && showReorder" class="block-handle-link" :to="{name: 'pages', params: {page_id: data.blocks[b.block_id].options.link_page_id}}"></router-link>
				<a v-if="(data.blocks[b.block_id].options.link_type == 'page') && !data.blocks[b.block_id].options.link_page_id && !is_readonly && showReorder" class="block-handle-link block-handle-link-plus" @click="addLinkPage(b.block_id, data.blocks[b.block_id].options.title)"></a>

				<a @click="openForm(b.block_id)" class="button btn-link btn-link-styled" :class="data.blocks[b.block_id].classname" :style="data.blocks[b.block_id].stylesheet"><figure class="thumb" v-html="data.blocks[b.block_id].thumb" v-if="data.blocks[b.block_id].thumb"></figure><div><div class="btn-link-title" :style="data.blocks[b.block_id].stylesheetTitle">{{data.blocks[b.block_id].options.title}}</div><div v-if="data.blocks[b.block_id].options.subtitle" class="btn-link-subtitle" :style="data.blocks[b.block_id].stylesheetSubtitle">{{data.blocks[b.block_id].options.subtitle}}</div></div></a>
			</div>
		</div>
		
		<div v-if="data.blocks[b.block_id].block_type_name == 'timer'" class="block-timer" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
				<a @click="openForm(b.block_id)" style="overflow: hidden">
					<center>
						<vue-component-blocks-flipclock v-model="data.blocks[b.block_id].options" :page_id="data.page.page_id"></vue-component-blocks-flipclock> 
					</center>
				</a>
			</div>
		</div>	
		
		<div v-if="data.blocks[b.block_id].block_type_name == 'break'" class='block-break' :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
				<a @click="openForm(b.block_id)">
					<div class='block-break-inner' :class="{'has-icon': data.blocks[b.block_id].options.icon, 'is-invisible': data.blocks[b.block_id].options.icon < 0, 'is-fullwidth': data.blocks[b.block_id].options.fullwidth, 'has-fading': data.blocks[b.block_id].options.fading}" :style="{'height': data.blocks[b.block_id].options.break_size + 'px'}"><span><i :class="['fa fai', 'fa-'+data.blocks[b.block_id].options.icon]" v-if="data.blocks[b.block_id].options.icon"></i></span></div>
				</a>
			</div>
		</div>
				
		<div v-if="data.blocks[b.block_id].block_type_name == 'video'" class="block-video" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
				<a @click="openForm(b.block_id)">
					<vue-component-video :options="data.blocks[b.block_id].options" style="pointer-events: none"></vue-component-video>
				</a>
			</div>
		</div>	
		
		<div v-if="data.blocks[b.block_id].block_type_name == 'collapse'" class="block-collapse has-rtl" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
				<a @click="openForm(b.block_id)" class="btn-link-block">
					<div class="collapse-list">
						<div class="collapse-item" v-for="v in data.blocks[b.block_id].options.fields">
						<div class="a">
							<span class="collapse-icon"></span>
							<span class="collapse-title" v-if="v.title">{{v.title}}</span>
							<span class="collapse-title" v-else>{{'Заголовок'|gettext}}</span>
						</div>
						</div>
					</div>
				</a>
			</div>
		</div>	
		
		<div v-if="data.blocks[b.block_id].block_type_name == 'pictures'" class="block-slider" :class="[picturesBrightnessClass(b.block_id), {'is-allow-fullwidth': data.blocks[b.block_id].options.is_desktop_fullwidth}]" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
				<a @click="openForm(b.block_id)">
					<div class="block-slider-inner" style="pointer-events: none">
					<div :class="{'slider-has-text': data.blocks[b.block_id].options.options.text, 'slider-has-link': data.blocks[b.block_id].options.options.link, 'slider-has-border': !data.blocks[b.block_id].options.remove_border}" class="slider slider-pictures">
						<div class="slider-inner">
							<div v-for="(item, i) in data.blocks[b.block_id].options.list" v-if="i < 2" class="slider-slide"><div class="picture-container" :class="{'picture-container-empty': !item.p}" :style="item.stylesheet_picture"><div></div></div>
								<div v-if="data.blocks[b.block_id].options.options.text" class="slider-slide-text has-rtl" :style="item.stylesheet_text"><div class="slider-slide-title" v-if="item.t">{{item.t}}</div><div class="slider-slide-title"  v-else>{{'Заголовок'|gettext}}</div><div class="slider-slide-snippet">{{item.s}}</div></div>
								<div v-if="data.blocks[b.block_id].options.options.link && item.link.title" class="slider-slide-link btn-link-title">{{item.link.title}}</div>
								<div v-if="data.blocks[b.block_id].options.options.link && !item.link.title" class="slider-slide-link btn-link-title">{{'Открыть'|gettext}}</div>
							</div>
						</div>
						<div class="slider-nav" v-if="data.blocks[b.block_id].options.list.length > 1">
							<div v-for="(item, i) in data.blocks[b.block_id].options.list" class="slider-dot" :class="{'active': !i}"></div>
						</div>
					</div>
					</div>
				</a>
			</div>
		</div>
		
		
		<div v-if="data.blocks[b.block_id].block_type_name == 'form'" class="block-form has-rtl" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
				<a @click="openForm(b.block_id)">
					<div v-for="field in data.blocks[b.block_id].options.fields">
					<div v-if="field.typename == 'button'" class="form-field"><div class="button btn-link btn-link-title" :style="field.stylesheet">{{field.title}}</div></div>
					<div v-else-if="field.typename == 'paragraph'" class="form-field" style="font-size:1.9em !important" v-html="field.text"></div>
					<div v-else class="form-field">
						<div v-if="field.typename == 'checkbox'" class="checkbox-list">
							<label class="checkbox">
								<input type="checkbox" :checked="field.default"> {{field.title}}<sup class="required" v-if="field.required">*</sup>
							</label>
							<div class="form-field-desc" v-if="field.text">{{field.text}}</div>
						</div>
						<label v-else class="label">{{field.title}}<sup class="required" v-if="field.required">*</sup></label>
						<div v-if="(field.typename != 'checkbox') && field.text" class="form-field-desc">{{field.text}}</div>
						
						<input v-if="['name', 'text', 'email', 'number'].indexOf(field.typename) != -1" :type="field.input_type" value=''>
						<div v-if="field.typename == 'phone'"><input type="tel" value='' :data-country="$account.client.country"></div>
<!-- 								<div v-if="field.typename == 'phone'" class="intl-tel-input allow-dropdown separate-dial-code iti-sdc-2"><div class="flag-container"><div class="selected-flag" tabindex="0"><div class="iti-flag ru"></div><div class="selected-dial-code">+7</div><div class="iti-arrow"></div></div></div><input type="text" style="font-size: inherit" autocomplete="off" placeholder="912 345-67-89"></div> -->
						<textarea v-if="field.typename == 'textarea'" rows="4"></textarea>
						
						<input v-if="['date', 'time'].indexOf(field.typename) != -1" :type="field.input_type">
						
						<div class="select" v-if="field.typename == 'select' || field.typename == 'country'"><select>
						<option value="" v-if="field.nulltitle">{{field.nulltitle}}</option>
							<option v-for="variant in field.variants" :value="variant">{{variant}}</option>
						</select></div>
						
						<div class="radio-list" v-if="field.typename == 'radio'">
						<label v-for="variant in field.variants" class="radio is-block">
							<input type="radio" :value="variant"> {{variant}}
						</label>
						</div>
					</div>
					</div>
				</a>
			</div>
		</div>
		
		<div v-if="data.blocks[b.block_id].block_type_name == 'socialnetworks'" class="block-socialnetworks" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle block-handle-socials" v-show="!is_readonly && showReorder"></div>
				<div class="socials">
				<div class="row row-small">
					<div :class="{'col-xs': (data.blocks[b.block_id].options.socials_style != 'default' && data.blocks[b.block_id].options.socials_style != 'block'), 'col-xs-12': (data.blocks[b.block_id].options.socials_style == 'default' || data.blocks[b.block_id].options.socials_style == 'block')}" v-for="l in data.blocks[b.block_id].options.items">
						<a @click="openForm(b.block_id)" class="button btn-link btn-link-title" :class="l.classname" :style="data.blocks[b.block_id].stylesheet"><i v-if="data.blocks[b.block_id].options.socials_style != 'default'" :class="l.i" v-html="iconPaths(l)"></i><span v-if="data.blocks[b.block_id].options.socials_style != 'compact'">{{l.t}}</span></a>
					</div>
				</div>
				</div>
			</div>
		</div>
		
		<div v-if="data.blocks[b.block_id].block_type_name == 'messenger'" class="block-link" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle block-handle-socials" v-show="!is_readonly && showReorder"></div>
				<div class="socials">
					<div class="row row-small">
						<div :class="{'col-xs': (data.blocks[b.block_id].options.messenger_style != 'default' && data.blocks[b.block_id].options.messenger_style != 'block'), 'col-xs-12': (data.blocks[b.block_id].options.messenger_style == 'default' || data.blocks[b.block_id].options.messenger_style == 'block')}" v-for="l in data.blocks[b.block_id].options.items">
							<a @click="openForm(b.block_id)" class="button btn-link btn-link-title" :class="l.classname" :style="data.blocks[b.block_id].stylesheet">
								<img :src="'/s/i/messengers/icons/{1}.svg'|format(l.n)" v-if="data.blocks[b.block_id].options.messenger_style == 'icon'">
								<i :class="l.i" v-else v-if="data.blocks[b.block_id].options.messenger_style != 'default' && data.blocks[b.block_id].options.messenger_style != 'icon'" v-html="iconPaths(l)"></i>
								<span v-if="['default', 'block'].indexOf(data.blocks[b.block_id].options.messenger_style) != -1">{{l.t}}</span>
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		
		<div v-if="data.blocks[b.block_id].block_type_name == 'map'" class="block-form" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
				<a @click="openForm(b.block_id)" class="btn-link-block">
					<vue-component-blocks-map v-model="data.blocks[b.block_id].options"></vue-component-blocks-map>
				</a>
				
				<a v-if="data.blocks[b.block_id].options.show_buttons" v-for="m in data.blocks[b.block_id].options.markers" @click="openForm(b.block_id)" class="button btn-link btn-link-block btn-map btn-link-styled btn-link-title" :style="m.stylesheet">
					<i class="fa fa-map-marker-alt"></i><span>{{ m.title }}</span>
				</a>
			</div>
		</div>	
		
		<div v-if="data.blocks[b.block_id].block_type_name == 'banner'" class="block-banner" :class="{'is-marginless': data.blocks[b.block_id].options.is_marginless && data.blocks[b.block_id].options.is_stretch}" :style="{opacity: data.blocks[b.block_id].is_visible?1:0.4}">
			<div>
				<div v-sortable-handle class="block-handle" v-show="!is_readonly && showReorder"></div>
				<a @click="openForm(b.block_id)" class="btn-link-block">
					<div class="block-banner-inner" :style="bannerInnerStyle(data.blocks[b.block_id].options)"><div class="picture-container" :class="{'picture-container-empty': !data.blocks[b.block_id].options.p}" :style="data.blocks[b.block_id].stylesheet_picture"></div></div>
				</a>
			</div>
		</div>
		
	</sortable-item>
	</div>
	</div> <!-- /section layer -->
<!-- 		</div> -->
<!-- 	</div> -->
	</div>
	</div>
	<div class="section-handle" v-if="allowSections && (section.section_id || si < sections.length-1) && !is_readonly && showReorder" @mousedown="sectionHandleDown(event, si)" @touchstart="sectionHandleDown(event, si)"></div>
	</div> <!-- /section -->
	</sortable-list>
	<div v-if="$auth.hasFeature('float_panel') && showWelcome" style="flex:1;flex-direction: column;display: flex;">
<!--
		<div class="row">
			<div class="col-xs-10 col-xs-offset-1 has-text-centered has-text-grey" style="font-size: 1.2rem;line-height: 1.5">
				<i class="fal fa-long-arrow-up fa-2x has-mb-2 has-text-grey-light" style="animation: fa-down 1s infinite"></i><br>
				Нажмите на аватар чтобы отредактировать его или удалить
			</div>
		</div>
-->
		<div style="flex:1"></div>
		
		<div style="overflow:hidden">
			<div class="row">
			<div class="col-xs-8 col-xs-offset-2 has-text-centered has-text-grey has-mt-4" style="font-size: 1.2rem;line-height: 1.5">
				{{'Начните создание страницы с добавления нового блока'|gettext}}<br><i class="fal fa-long-arrow-down fa-2x has-mt-2 has-mb-2 has-text-grey-light" style="animation: fa-down 1s infinite"></i>
			</div>
			</div>
		</div>
	</div>
	<div v-if="!is_readonly && !$auth.hasFeature('float_panel')" class="has-sm-pl-2 has-sm-pr-2 has-mt-2" :class="{'has-mt-8': data.blocks_order.length == 0}">
		<a @click="newBlock" class="button btn-link btn-link-empty is-new-block"><div><i class='fa fas fa-plus fa-lg is-visible-mobile'></i> {{'Добавить блок'|gettext}}</div></a>
	</div>
	</div>
`});

window.$app.defineComponent("pages", "vue-pages-page-form", {data() {
			return {
				activeTab: 'common',
				isFetching: false,
				isUpdating: false,
				page_options: []
			}
		},
		
		props: {page_id: Number, values: {
			default: {}	
		}},
		
		mixins: [FormModel],

		created() {
			if (this.page_id) {
				this.fetchData(true);
			}
		},
		
		computed: {
			path() {
				return (this.$account.page_id != this.page_id)?('/p/'+parseInt(this.page_id).toString(16)+'/'):'';
			},
			pageLink() {
				return this.$account.link+this.path;
			},
			pageSafeLink() {
				return this.$account.link_safe+this.path;
			}
		},

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('pages/props/get', {page_id: this.page_id}).then((data) => {
					this.isFetching = false;
					this.values = data.response.pages.props.values;
					this.page_options = data.response.pages.props.page_options;
				});
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('pages/props/set', this.values, this).then((data) => {
					if (data.result == 'success') {
						this.$parent.close();
						if (!this.page_id) {
							this.values.title = '';
							this.$router.replace({name:'pages', params: {page_id: data.response.values.page_id}});
						}
						this.values = {}
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			},
			
			deletePage() {
				this.$confirm(this.$gettext('Вы уверены что хотите удалить эту страницу? Вы не сможете её вернуть!'), 'is-danger').then(() => {
                    this.$api.get('pages/delete', {page_id: this.page_id}, this).then((data) => {
						if (data.result == 'success') {
							this.$parent.close();
							this.$router.replace({name:'pages', params: {page_id: this.$account.page_id}});
						}
					});
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title" v-if="page_id">{{'Страница'|gettext}}</p>
			<p class="modal-card-title" v-else>{{'Новая страница'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>

		<ul class="nav nav-tabs" v-if="page_id">
			<li :class="{active: activeTab == 'common'}"><a href="#" @click="activeTab = 'common'">{{'Ссылка'|gettext}}</a></li>
			<li :class="{active: activeTab == 'qr'}"><a href="#" @click="activeTab = 'qr'">{{'QR-код'|gettext}}</a></li>
			<li :class="{active: activeTab == 'seo'}"><a href="#" @click="activeTab = 'seo'">{{'SEO'|gettext}}</a></li>
		</ul>

		<section class="modal-card-body" v-show="activeTab == 'common'">
			<b-field :label="'Название страницы'|gettext" :message="errors.title" :class="{'has-error': errors.title}">
				<input type="text" class="input" v-model="values.title">
			</b-field>
	
			<div class="field" v-if="values.page_id">
				<label class="label">{{'Ссылка на страницу'|gettext}}</label>
				<div class="field has-addons">
					<div class="control is-expanded"><input type='text' class='input' readonly='on' id='pageLink' :value="pageLink"></div>
					<div class="control">
						<vue-component-clipboard :text="pageLink" class="button is-default" :show-icon="false">{{'Скопировать'|gettext}}</vue-component-clipboard>
					</div>
				</div>
			</div>
		</section>
		
		<section class="message is-info" v-if="activeTab == 'qr'"><div class="message-body">{{'Вы можете скачать и использовать ваш QR-код на визитках или флайерах'|gettext}}</div></section>
		<section class="modal-card-body" v-if="activeTab == 'qr'">
			<vue-component-qrcode :value="pageSafeLink" :with-download="true" class="has-text-centered"></vue-component-qrcode>
		</section>
		
		<section class="modal-card-body" v-if="activeTab == 'seo'">
			<b-field :label="'Заголовок страницы'|gettext">
			<div class="control">
				<input type="text" class="input" maxlength="180" :disabled="isUpdating" v-model="values.seo_title" :placeholder="page_options.seo.title">
				<p class="has-mt-1 has-text-grey">{{'Отображается в названии вкладки браузера и в результатах поисковых систем'|gettext}}</p>
			</div>
			</b-field>
			<b-field :label="'SEO описание'|gettext">
			<div class="control">
				<textarea class="input" maxlength="512" rows="4" :disabled="isUpdating" v-model="values.seo_description" :placeholder="page_options.seo.description"></textarea>
				<p class="has-mt-1 has-text-grey">{{'Отображается в результатах поисковых систем под ссылкой'|gettext}}</p>
			</div>
			</b-field>
		</section>

		<footer class="modal-card-foot level">
			<div class="level-left">
				<button v-if="values.page_id" class="button is-default has-text-danger" @click="deletePage" v-if="$account.page_id != page_id"><i class="fa fa-trash-alt"></i><span class="is-hidden-mobile"> {{'Удалить'|gettext}}</span></button>
			</div>
			<div class="level-right">
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
				<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});

window.$app.defineComponent("pages", "vue-pages-page", {data() {
			return {
				isFetching: false,
				tipsInited: false,
				tipsChoose: false,
				wait_scroll_block_id: null,
				
				vertical_aligns: {
					top: 'По верху',
					middle: 'По центру',
					bottom: 'По низу'
				},
				
				view_modes: {
					xs: {title: 'Телефон', icon: 'mobile'},
					md: {title: 'Компьютер', icon: 'desktop'}
				},
				
/*
				options: {
					valign: 'top',
					max_width: 'lg'
				},
*/

				view_mode: 'xs',
				
				showReorder: Storage.get('float-panel-reorder', true),
				showHidden: Storage.get('float-panel-hidden', true),
			}
		},
		
		props: ['page_id', 'back_page_id'],

		created() {
			let s = document.location.search;
			let r = s.match(/[\?|\&]wizard/);
			if (r) {
				s = s.replace(/[\?|\&]wizard/, '');
				this.$modal('vue-pages-wizard-form', {page_id: this.page_id}, this);
				this.$router.replace(document.location.pathname.substr(window.base_path.length-1) + s);
			}
			
		},
		
		watch: {
			page_id() {
				this.fetchData(true);
			},
			
			showReorder(v) {
				Storage.set('float-panel-reorder', v);
			},
			
			showHidden(v) {
				Storage.set('float-panel-hidden', v);
			}
		},
		
		mounted() {
			this.fetchData(true);
			this.$events.on('page.styles:updated', this.eventStylesUpdated);
			this.$events.on('page:updated', this.pageUpdated);
		},
		
		computed: {
			tipsChoosePage() {
				return (!this.isFetching && (this.page_id != this.$account.page_id) && this.tipsChoose)?this.$gettext('Вы создали новую страницу, для навигации между вашими страницами нажмите тут'):'';
			},
			
			inited() {
				return (!this.isFetching && this.tipsInited);
			},
			
			linkDomain() {
				let a = this.$account;
				return (a.custom_domain_verified?((a.custom_domain_secured?'https':'http')+'://'+a.custom_domain):'https://taplink.cc');
			},
			
			linkPath() {
				return this.linkDomain+this.$account.link_path+this.$page.data.page.link.path;
			}
		},
		
		destroyed() {
			this.$events.off('page:updated', this.pageUpdated);
			this.$events.off('page.styles:updated', this.eventStylesUpdated);
		},

		methods: {
			addTemplate() {
				this.$modal('vue-templates-form', {page_id: this.page_id}, this);
			},
			
			newBlock() {
				this.$modal('vue-pages-blocks-form-modal', _.merge({page_id: this.page_id}, this.getBeforeBlockId()), this);
			},
			
			scrollToBlock(block_id) {
				this.$nextTick(() => {
					let o = $mx('.b-'+block_id);
					
					if (o.length) {
						let b = $mx('.float-panel').viewportOffset();
						let y = o.offset().top + o.height() + 15 - $mx('.float-panel').viewportOffset().top;
						let scrollTop = this.$device.mobile?$mx('.main-block').scrollTop():window.pageYOffset;
						if (y && y > scrollTop) scrollIt(y, 'y', this.$device.mobile?$mx('.main-block')[0]:null);
					} 

					this.wait_scroll_block_id = o.length?null:block_id;
				})
			},
			
			pageUpdated() {
				if (this.wait_scroll_block_id) {
					this.scrollToBlock(this.wait_scroll_block_id);
				}
			},
			
			getBeforeBlockId() {
				let top = $mx('.theme-main').offset().top;
				let floatPanelTop = $mx('.float-panel').viewportOffset().top;

				let list = $mx('.theme-main .section-main > div > .block-item');
				
				let found = null;
				let scrollTop = this.$device.mobile?$mx('.main-block').scrollTop():window.pageYOffset;
				let y = floatPanelTop - top + scrollTop;
				
				for (i = 0; i < list.length; i++) {
					if (list[i].offsetTop + list[i].clientHeight > y) {
						found = list[i];
						break;
					}
				}

				if (found) {
					let section = found.closest('.blocks-section').className.match(/s\-([0-9]+)/);
					return {
						before_block_id: found.className.match(/b\-([0-9]+)/)[1], 
						before_section_id: section?section[1]:null
					};
				} else {
					return {before_block_id: null, before_section_id: null};
				}
			},
			
			tippyFloatPanel(name) {
				return this.$device.mobile?{ trigger: 'manual'}:{ theme : 'light' };
			},
			
			tippyFloatPanelClick(name) {
// 				let tippy = this.$refs['tippyFloatPanel'+name]._tippy;
				let tips_bits = {showHidden: 4, showReorder: 8};

				switch (name) {
					case 'showHidden':
						this.showHidden = !this.showHidden;
						break;
					case 'showReorder':
						this.showReorder = !this.showReorder;
						break;
				}

				if ((this.$account.tips_bits & tips_bits[name]) == 0 && this.$device.mobile) {
					this.$account.tips_bits |= tips_bits[name];
// 					tippy.show();
					$mx.get('/api/account/updatetipsbits.json?bit='+tips_bits[name]);
// 					$mx(window).one('scroll', tippy.hide);
// 					setTimeout(tippy.hide, 3000);
				}
			},
			
			updatetipsbits(v) {
				$mx.get('/api/account/updatetipsbits.json?bit='+1)
			},
			
			eventStylesUpdated() {
				StylesFactory.updateCSSBlock(this.$page.styles, this.$refs.styles);
// 				this.checkHeight();
			},

			fetchData(withLoading) {
				this.tipsChoose = this.tipsInited = false;
				this.isFetching = withLoading;
				
				this.$page.fetchData(this.page_id, false).then((data) => {
					this.isFetching = false;
					if (data.result != 'fail') {
						let p = this.$page.data.page;
						
						if (p.page_type_id != 1) {
							this.$form.open(null, {}, () => { 
								if (p.event_close != undefined && p.event_close.link != undefined) {
									this.$router.replace(p.event_close.link.replace(':back_page_id', this.back_page_id));

								}
							});
							
							this.$form.top.title = p.title;
						}
					}
				
					if (data.result == 'success') {

						if ((this.$account.tips_bits & 2) == 0) {
							this.checkWelcomePartnerAccess();
							
							eventStack.push('google', 'startup');
							eventStack.push('metrika', 'startup');
						}
						
						
						if (((this.$account.tips_bits & 1) == 0) && this.$auth.isAllowTariff('business') && (this.page_id != this.$account.page_id)) { //НАДО ТАК 
							this.tipsChoose = true;
							this.$account.tips_bits |= 1;
						}
						
						if (m = document.location.hash.match('publish:?([a-z\_]+)?')) {
							this.installPage((m.length > 1)?m[1]:null);
							document.location.hash = '';
						}
					} else {
						if (data.code == 404) this.$router.replace({name: 'pages', params: {page_id: $account.page_id}});
					}
					
					this.eventStylesUpdated();
				}).catch(() => {
					this.isFetching = false;
				});
			},
			
			showStartupTips(cb) {
				window.initStartup({langNewblock: this.$gettext("Чтобы добавить новый блок,<br>нажмите сюда"), langSort: this.$gettext("Вы можете менять блоки местами,<br>для этого перетащите нужный вам блок"), langEditblock: this.$gettext("Чтобы отредактировать блок,<br>просто нажмите на него")/* , langLink: this.$gettext("Ваша главная ссылка, вставьте ее в Instagram") */}, cb);
			},

			checkWelcomeWizard() {
				if ((this.$account.tips_bits & 2) == 0) {
					this.$nextTick(() => { 
						this.showStartupTips(() => {
							this.$account.tips_bits = this.$account.tips_bits | 2;
						});
					});
				}
			},
			
			checkWelcomePartnerAccess(cb) {
				if (this.$account.partner != undefined && this.$account.partner.with_message != undefined && this.$account.partner.with_message) {
					this.$modal('vue-pages-partner-access-form', {}, this);
				} else {
					this.checkWelcomeWizard();
				}
			},
			
			installPage(target) {
				this.$modal('vue-pages-publish-form', {is_readonly: this.$page.data.page.is_readonly, target: target}, this);
			},
			
						
			configurePage() {
				this.$modal('vue-pages-page-form', {page_id: this.$page.data.page.page_id}, this);
			},
			
			choosePage() {
				this.$modal('vue-pages-choose-form', {is_readonly: this.$page.data.page.is_readonly}, this);
			},
			
			changeNickname() {
				this.$modal('vue-pages-nickname-changed-form', {}, this);
			}
		}, template: `
	<div style="flex: 1;display: flex;flex-direction: column">
		
		<div ref='styles'></div>
<!-- 		<div v-if="inited" class="startup-helpers-init" :data-lang-newblock="'Чтобы добавить новый блок,<br>нажмите сюда'|gettext" :data-lang-sort="'Вы можете менять блоки местами,<br>для этого перетащите нужный вам блок'|gettext" :data-lang-link="'Ваша главная ссылка, вставьте ее в Instagram'|gettext"></div> -->
		
<!--
		<div class="footer-banner has-background-dark" v-if="hasInstallBanner" :class="{'is-closed': hideInstallBanner}"> 
			<div class="container has-mb-2 has-mt-2">  
				<div>⚠️ {{'Необходимо установить ссылку в профиль Instagram'|gettext}}</div> 
				<button class="button is-black has-ml-1" @click="installPageBanner">{{'Сделать это'|gettext}}</button> 
			</div> 
		</div>
-->
		
		<div class="top-panel hero-block hero-link has-text-grey" v-if="!$form.isOpenedHeader">
			<div class="container">
			<div class="row">
			<div class="col-xs-12">
				<div class="form-control-link is-size-5">
					<div class="form-control-link-text has-text-danger" v-if="$account.ban"><i class="fa fa-exclamation-circle has-mr-1"></i>{{'Ваш аккаунт заблокирован'|gettext}}</div>					
					<div class="form-control-link-text" v-else>
						<a style="margin-right: 5px" v-if="$account.nickname_changed" @click="changeNickname" :content="'Никнейм вашего Instagram профиля изменился, нажмите тут чтобы обновить ссылку'|gettext" v-tippy="{placement: 'bottom', trigger: 'manual', showOnCreate: true}"><i class="fas fa-exclamation-circle has-text-danger"></i></a>
						<span v-if="$account.nickname || $account.custom_domain_verified">
							<span class='is-hidden-mobile'>{{'Моя ссылка'|gettext}}: </span><a :href="linkPath" target="_blank" v-if="!isFetching"><span :class="{'is-hidden-mobile':!$account.custom_domain || $page.data.page.link.path}">{{linkDomain}}</span>{{$account.link_path}}{{$page.data.page.link.path}}</a>
						</span>
						<span v-else>
							<span class="is-hidden-mobile">{{'Для получения ссылки нажмите кнопку "Установить"'|gettext}}</span>
							<span class="is-hidden-tablet">{{'Получить ссылку'|gettext}}</span>
							<i class="fa fa-long-arrow-right has-ml-1"></i>
						</span>
					</div>
					
					<router-link v-if="$account.tariff == 'business' && ($account.page_id != page_id) && (page_id != 0)" :to="{name: 'pages', params: {page_id: $account.page_id}}" class="button is-light link-pages"><i class="fa fa-undo has-text-grey-light"></i><span class="is-hidden-mobile"> {{'На главную'|gettext}}</span></router-link>

					<button v-if="$auth.isAllowTariff('business') && !tipsChoose" class="button is-success link-pages" @click="choosePage"><i class="fas fa-caret-down"></i></button>
					<a v-if="$auth.isAllowTariff('business') && tipsChoose" class="button is-success link-pages" @click="choosePage" :content="tipsChoosePage" v-tippy="{placement: 'bottom', showOnCreate: true, trigger: 'manual', onCreate: updatetipsbits}"><i class="fas fa-caret-down"></i></a>
<!-- 				Менять A на BUTTONS нельзя, vue виртуальным домом оптимизирует и [data-tips-title] не срабатывает -->

					<button type="button" v-if="$account.page_id == page_id" class="button is-primary" @click="installPage()" style="min-width:100px" :disabled="$account.ban">{{'Установить'|gettext}}</button>
					<button v-else class="button is-primary" :disabled="$page.data.page.is_readonly" @click="configurePage"><i class="fa fa-cog is-visible-mobile"></i><span class="is-hidden-mobile">{{'Настройки'|gettext}}</span></button>
				</div>
			</div>
			</div>
			</div>
		</div>

		<vue-component-screen-breakpoint v-if="view_mode == 'md'" v-model="$page.data.options.max_width" :page_id="page_id "/>

		<div class='main-block1 main-block-xs-clear is-xs-marginless' style="display: flex;flex-direction: column;flex:1" :class="[{'is-rtl': $account.locale.text_direction == 'rtl', 'has-mt-5 has-mb-5': view_mode == 'xs'}, ($page.data && $page.data.options)?('max-page-container-'+$page.data.options.max_width):null]">
			<div class="main-theme is-large has-padding-top has-padding-bottom has-shadow is-hide-mobile page-blocks" :class="{device: view_mode == 'xs'}" style="display: flex;flex-direction:column;flex-grow: 1">
			<div class="screen page" style="display: flex;flex-grow: 1">
				<div v-for="a in $account.theme.extended.items" v-html="a.html"></div>
				<vue-pages-page-blocks :page_id="page_id" :page-options="$page.data.options" :theme="$account.theme" :show-hidden="showHidden" :show-reorder="showReorder" :class="{'has-floatpanel': $auth.hasFeature('float_panel')}" :allow-welcome="true"></vue-pages-page-blocks>
		    </div></div>
			<div class="float-panel is-light-mobile is-page-edit" v-if="$auth.hasFeature('float_panel')">
				<div class="container">
					<div style="margin: 0 auto">
						<button class="button is-black is-large" :class="{in: showReorder}" @click="tippyFloatPanelClick('showReorder')" ref="tippyFloatPanelshowReorder" style="flex:0;min-width:60px" v-tippy="tippyFloatPanel('showReorder')" content="Сортировка блоков">
							<i class="fa fa-long-arrow-up" style="margin-right:0"></i>
							<i class="fa fa-long-arrow-down" style="margin-left:0"></i>
						</button>
						<button class="button is-primary is-large is-new-block" @click="newBlock">{{'Добавить блок'|gettext}}</button>
						<b-dropdown position="is-top-right">
							<button class="button is-black is-large in" slot="trigger"><i class="fa fa-sliders-h"></i></button>

							<b-dropdown-item aria-role="listitem" @click="addTemplate" v-if="$auth.hasFeature('templates')"><i class="fa fa-plus has-mr-1"></i>{{'Добавить в шаблоны'|gettext}}</b-dropdown-item>
							<hr class="dropdown-divider" aria-role="menuitem" v-if="$auth.hasFeature('templates')">
							
							<b-dropdown-item aria-role="listitem" @click="configurePage"><i class="fa fa-cog has-mr-1"></i>{{'Настройки страницы'|gettext}}</b-dropdown-item>
							<hr class="dropdown-divider" aria-role="menuitem">
							<b-dropdown-item aria-role="listitem" @click="tippyFloatPanelClick('showHidden')"><i class="fa fa-check has-mr-1" :class="{'is-invisible': !showHidden}"></i>{{'Показывать скрытые блоки'|gettext}}</b-dropdown-item>
							<hr class="dropdown-divider" aria-role="menuitem">
							<b-dropdown-item custom aria-role="menuitem" class="has-text-grey">{{'Выравнивание блоков'|gettext}}</b-dropdown-item>
							<b-dropdown-item aria-role="listitem" v-for="(v, k) in vertical_aligns" @click="$page.setOption('valign', k)"><i class="fa fa-check has-mr-1" :class="{'is-invisible': $page.data && $page.data.options && ($page.data.options.valign != k)}"></i>{{v}}</b-dropdown-item>

							<b-dropdown-item custom aria-role="menuitem" class="has-text-grey disabled-mobile">{{'Вид'|gettext}}</b-dropdown-item>
							<b-dropdown-item aria-role="listitem" v-for="(v, k) in view_modes" @click="view_mode = k" class="disabled-mobile"><i class="fa fa-check has-mr-1" :class="{'is-invisible': view_mode != k}"></i>{{v.title}}</b-dropdown-item>
						</b-dropdown>
<!-- 						<button class="button is-black is-large" :class="{in: showHidden}" style="flex:0;min-width:60px" @click="tippyFloatPanelClick('showHidden')" ref="tippyFloatPanelshowHidden" v-tippy="tippyFloatPanel('showHidden')" content="Показывать скрытые блоки"><i class="fa" :class="{'fa-eye-slash': !showHidden, 'fa-eye': showHidden}"></i></button> -->
					</div>
				</div>
			</div>
		</div>		
	</div>
`});

window.$app.defineComponent("pages", "vue-pages-partner-access-form", {data() {
			return {
				isUpdating: false,
				isAllow: true
			}
		},

		created() {
			
		},

		mixins: [FormModel],

		methods: {
			update() {
				if (this.isAllow && this.$account.partner.with_access) {
					this.$api.post('access/set', {account_id: this.$account.partner.account_id, part: 'main'}).then((data) => {
						this.close();
						this.isUpdating = false;
					}).catch(({ data }) => {
						this.isUpdating = false;
					})
				} else {
					this.close();
				}
			},
			
			close() {
				this.$parent.close();
				setTimeout(() => {
					this.$parent.$parent.checkWelcomeWizard();
				}, 300)
/*
				this.isUpdating = true;
				this.$api.post('__VALUE__', this.values, this).then((data) => {
					if (data.result == 'success') {
						this.$parent.close()
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
*/
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Добро пожаловать'|gettext}}</p>
			<button class="modal-close is-large" @click="update"></button>
		</header>
		<section class="modal-card-body">
			
			<h4 class="has-mb-2">{{$account.partner.welcome_message}}</h4>
			
			<mx-toggle v-model='isAllow' v-if="$account.partner.with_access" :title="'Предоставить полный доступ'|gettext"></mx-toggle>
			
		</section>
		<footer class="modal-card-foot">
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="update" v-if="$account.partner.with_access">{{'Сохранить'|gettext}}</button>
			<button class="button is-dark" type="button" @click="close()" v-else>{{'Закрыть'|gettext}}</button>
		</footer>
	</div>
		
`});

window.$app.defineComponent("pages", "vue-pages-publish-form", {data() {
			return {
				isUnattaching: false,
				isFetching: false,
				isUpdating: false,
				isUpdatingSubdomain: false,
				isButtonLoading: '',
				current: null,
				profiles: {},
				widget: {},
				variants: {},
				is_installed: false,
				activeTab: 'instagram',
				instagram_basic: true,
				instagram_business: false,
				prepare: null,
				domain: null,
				subdomain: null,
				username: ""
			}
		},
		
		props: {is_readonly: Boolean, target: String},
		
		mixins: [FormModel],

		computed: {
			widgetCode() {
				return '<script src="//taplink.cc/'+(this.$account.nickname?this.$account.nickname:('id:'+this.$account.profile_id))+'/widget/" async></script>';
			},
			
			instagramLink() {
				return 'https://taplink.cc/'+this.$account.nickname;
			}
		},
		
		created() {
			if (this.$account.custom_domain/*  && !this.$account.custom_domain_verified */) this.activeTab = 'domain';
			if (['instagram_business', 'instagram_basic'].indexOf(this.target) != -1) {
				this.activeTab = 'instagram';
			}
			
			this.fetchData(true);
		},
		
		methods: {
			onChangeSubdomain() {
				
			},
			
			instagramBusinessCancel() {
				this.profiles = {};
				this.target = '';
			},
			
			connectUsername() {
				this.$prompt(this.$gettext('Укажите имя профиля или ссылку на Instagram'), {}).then((username) => {
					this.isButtonLoading = 'instagram';
					
// 					this.$api.get('pages/publish/setusername', {username: username}).then((data) => {
					$mx.request({url: '/instagram/resolve', method: 'get', json: {username: username}}).then((r) => {
						let data = r.data;
						this.isFetching = false;
						this.isButtonLoading = '';
						if (data.result == 'fail') {
							this.$alert(data.message || this.$gettext('Профиль не найден'), 'is-danger');
						} else {
							this.prepare = data.response;
							this.username = '';
	/*
							this.$auth.refresh(data.response, () => {
								this.$parent.$parent.installPage();
								this.$parent.close();
							});
	*/
						}
					});
				});
			},
/*
			attachAnotherProfile() {
				$mx('<iframe src="https://www.instagram.com/accounts/logout/" width="0" height="0"></iframe>').on('load', function() {
					document.location = '/login/instagrambasic/?method=attach';
				}).appendTo('body');
			},
*/
			
			toggleTab(v) {
				this.activeTab = (this.activeTab == v && (window.matchMedia("(max-width: 767px)").matches))?null:v;
			},
			
			check() {
				this.isUpdating = true;
				this.$api.get('pages/publish/check', {target: this.target}).then((data) => {
					this.$parent.close();
				});
			},
			
			confirmAttach() {
				this.target = 'instagram_basic_confirm';
				this.fetchData(true);
			},
			
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('pages/publish/info', {target: this.target, prepare: this.prepare}).then((data) => {
					this.isFetching = false;
					let r = data.response;
					this.widget = r.widget;
					this.profiles = r.profiles;
					this.variants = r.variants;
					this.domain = r.domain;
					this.subdomain = r.subdomain;
					this.is_installed = r.is_installed;
					this.instagram_basic = r.instagram_basic;
					this.instagram_business = r.instagram_business;
					
					if (!this.profiles.length && (this.target == 'instagram_business')) {
						this.$alert(this.$gettext('У вас нет подключенных Instagram Business профилей'), 'is-danger');
						this.target = '';
					}
					
					switch (this.target) {
						case 'instagram_basic':
							this.prepare = data.response.prepare;
							break;
						case 'instagram_basic_confirm':
							this.prepare = null;
							break;
					}
					
					if (r.account) this.$auth.refresh(r.account);
					if (r.message) this.$alert(r.message, 'is-danger');
				});
			},
			
			updateSubdomain() {
				this.isUpdatingSubdomain = true;
				this.$api.post('pages/publish/setsubdomain', {subdomain: this.subdomain.subdomain, domain_id: this.subdomain.domain_id}, this).then((data) => {
					this.isUpdatingSubdomain = false;
				});
			},
			
			choose(row) {
				this.isFetching = true;
				this.$api.get('pages/publish/set', {id: row.id, uniq: row.uniq}).then((data) => {
					this.isFetching = false;
					this.$auth.refresh(data.response, () => {
						this.$parent.$parent.installPage();
						this.$parent.close();
					});
				});
			},
			
			unattach() {
				this.$confirm(this.$gettext('Вы уверены что хотите отключить профиль от вашей страницы?'), 'is-danger').then(() => {
					this.isUnattaching = true;
					this.$api.get('pages/publish/unattach', {id: this.current}).then((data) => {
						this.$auth.refresh(data.response);
						this.isUnattaching = false;
					});
				});
			},
			
			onWidgetChanged: _.debounce(function() {
				if (!this.is_readonly) this.$api.get('pages/install/set', {widget: this.widget});
			}, 500)
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Установка ссылки'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		
		<section class="modal-card-body modal-card-body-blocks" style="display:flex">
			<div class="publish-form-collapse">
				<div class="is-title" @click="toggleTab('instagram')" :class="{in: activeTab == 'instagram'}">
					<span><i class="fal fa-chevron-right has-mr-2"></i>Instagram</span>
				</div>
				<div>
					<div>
					<section v-if="$account.nickname">
						<label class="label" v-if="is_installed">{{'Ваша ссылка'|gettext}}</label>
						<div class="media has-mb-2" v-else>
							<div class="media-left"><span class="tag is-warning">1</span></div>
							<div class="media-content">
								<label class="label">{{'Скопируйте ссылку на страницу'|gettext}}</label>
							</div>
						</div>	
							
						<div class="field has-addons is-marginless">
							<div class="control is-expanded"><input type="text" class="input is-mouse-locked has-text-black" readonly="on" disabled="on" :value="instagramLink"></div>
							<div class="control is-hidden-mobile">
								<vue-component-clipboard :text="instagramLink" class="button is-default" :show-icon="false"><i class="fal fa-copy has-mr-1"></i>{{'Скопировать ссылку'|gettext}}</vue-component-clipboard>
							</div>
							<div class="control is-hidden-mobile">
								<button class="button has-text-danger" @click="unattach" :class="{'is-loading': isUnattaching}" v-tippy :content="'Отключить профиль'|gettext"><i class="fal fa-trash-alt"></i></button>
							</div>
						</div>
						
						<div class="is-hidden-tablet has-mt-2">
							<div class="row row-small">
							<div class="col-xs-10">
								<vue-component-clipboard :text="instagramLink" class="button is-default is-fullwidth" :show-icon="false" :with-share="true"><i class="fal fa-copy has-mr-1"></i>{{'Скопировать ссылку'|gettext}}</vue-component-clipboard>
							</div>
							<div class="col-xs-2">
								<button class="button has-text-danger is-fullwidth" @click="unattach" :class="{'is-loading': isUnattaching}"><i class="fal fa-trash-alt"></i></button>
							</div>
						</div>
						</div>
					</section>
					
					<section v-if="is_installed && $account.nickname">
						<div class="field">
							<span class='has-text-success'><i class="fa fas fa-check-square"></i> {{'Ссылка установлена в Instagram.'|gettext}}</span> {{'Если вы поменяли никнейм в Instagram, нажмите кнопку "Обновить информацию" для того чтобы получить новую ссылку.'|gettext}}
						</div>
						<a @click="check" class="button is-instagram" :class="{disabled: is_readonly, 'is-loading': isUpdating}"><i class="fab fa-ig" style="margin-right: 10px"></i> {{'Обновить информацию'|gettext}}</a>
					</section>
					<section v-else>
						<div v-if="!$account.nickname">
							<div v-if="target == 'instagram_business'">
							<label class="label">{{'Выберите профиль'|gettext}}</label>
							<b-table :data="profiles" hoverable bordered class="table-header-hide" @click="choose" v-if="_.size(profiles)" disabled="isUpdating">
								<template slot-scope="props">
									<b-table-column field="name" style="vertical-align:middle">
									<div class="media" style="align-items: center">
										<img :src="props.row.picture" class="profile-avatar profile-avatar-48 media-left">
										<div class="media-content"><b>{{props.row.name}}</b><div class="has-text-grey">@{{props.row.username}}</div></div>
									</div>
									</b-table-column>
								</template>
							</b-table>
							<button @click="instagramBusinessCancel" class="button is-dark has-mt-2">{{'Отмена'|gettext}}</button>
							
							</div>
							<div v-else>
								<div v-if="instagram_business && !prepare && (i18n.locale == 'ru')" class="has-mb-4">
								<label class="label">{{'Подключить Instagram Business профиль'|gettext}}</label>
								<div class="has-mb-2">
									{{'Для подключения Instagram Business профиля вам необходимо авторизоваться через Facebook'|gettext}}
								</div>
								<a class="button is-facebook" :class="{disabled: is_readonly, 'is-loading': isButtonLoading == 'facebook'}" @click="isButtonLoading = 'facebook'" href="/login/facebook/?method=attach&scope=email,pages_show_list,instagram_basic"><i class="fab fa-fb-o has-mr-2"></i> {{'Подключить через Facebook'|gettext}}</a>
								</div>

								<div v-if="prepare">
									<div class="has-text-centered has-mb-3">
										<img :src="prepare.picture" class="profile-avatar profile-avatar-65">
										<h4>{{prepare.username}}</h4>
									</div>
									
									<div class="row row-small">
										<div class="col-xs-12 col-sm-5 col-sm-offset-1">
											<button @click="confirmAttach" class="button is-primary has-xs-mb-2 is-fullwidth">{{'Подключить этот профиль'|gettext}}</button>
										</div>
										<div class="col-xs-12 col-sm-5">
<!-- 											<button @click="attachAnotherProfile" class="button is-danger is-fullwidth">{{'Войти под другим профилем'|gettext}}</button> -->
											<a href="/login/instagrambasic/?method=attach&logout=1" class="button is-danger is-fullwidth" v-if="instagram_basic">{{'Войти под другим профилем'|gettext}}</a>
											<button @click="prepare = null" class="button is-danger is-fullwidth" v-else>{{'Войти под другим профилем'|gettext}}</button>
										</div>
									</div>
									
								</div>
								<div v-else>
									<label class="label">{{'Подключить Instagram профиль'|gettext}}</label>
									<div class="has-mb-2">
										{{'Для подключения Instagram профиля вам необходимо авторизоваться через Instagram'|gettext}}
									</div>
									<div v-if="instagram_basic">
										<div class="has-mb-4">
											<a class="button is-instagram" :class="{disabled: is_readonly, 'is-loading': isButtonLoading == 'instagram'}" @click="isButtonLoading = 'instagram'" href="/login/instagrambasic/?method=attach"><i class="fab fa-ig has-mr-2"></i>{{'Подключить через Instagram'|gettext}}</a>
										</div>
									</div>
									<div v-else>
<!-- 										<input type="text" class="input has-mb-1" :placeholder="'Укажите имя профиля или ссылку на Instagram'|gettext" v-model="username" :disabled="isButtonLoading == 'instagram'"> -->
										<button class="button is-instagram" :class="{disabled: is_readonly, 'is-loading': isButtonLoading == 'instagram'}" @click="connectUsername"><i class="fab fa-ig has-mr-2"></i>{{'Подключить через Instagram'|gettext}}</button>
									</div>
								</div>

							</div>
						</div>
						<div v-else>
							<div v-if="!is_installed">
								<div class="media">
									<div class="media-left"><span class="tag is-warning">2</span></div>
									<div class="media-content">
										<label class="label has-mb-2">{{'Вставьте её в раздел "Веб-Сайт" в настройках профиля Instagram'|gettext}}</label>
									</div>
								</div>	
								<div class='has-sm-mb-4 has-sm-pt-4 device-pictures-form marvel-device-install'>
									<center style="line-height:0">
									<div class="device has-shadow is-large is-hide-mobile" style="margin: 0 auto">
								    <div class="screen page-font" style="overflow: hidden">
										<img style="max-width:100%;margin:0 auto;display: block" :src="'/s/i/taplink-install.{1}.png'|format(window.i18n.locale)">
								    </div>
									</div>
									<div class='form-shadow form-shadow-bottom is-hidden-mobile' style="height: 20px"></div>
									</center>
								</div>
							
								<div><a href='https://www.instagram.com/accounts/edit/' target="_blank" style="display: block;padding-top: 10px;text-align: center">{{'Открыть настройки Instagram'|gettext}}</a></div>
							</div>
						</div>
					</section>

					<section class="message is-info" v-if="$account.nickname && !is_installed">
						<div class="message-body">
							<label class="label">{{'Если вы поменяли имя пользователя в Instagram'|gettext}}</label>
							<div>{{'Нажмите на ссылку'|gettext}} "<a @click="check" :class="{disabled: isUpdating}">{{'Обновить информацию'|gettext}}</a>" {{'для того чтобы обновить информацию из Instagram. Система увидит новое имя пользователя и предложит обновить ссылку.'|gettext}}</div>
						</div>
					</section>
					</div>
				</div>
				
				
				<div class="is-title" @click="toggleTab('subdomain')" :class="{in: activeTab == 'subdomain'}" v-if="$auth.hasFeature('subdomains')">
					<span><i class="fal fa-chevron-right has-mr-2"></i>{{'Свои имена'|gettext}}</span>
				</div>
				<div v-if="$auth.hasFeature('subdomains')">
					<div>
						<section>
							<b-field v-if="subdomain" grouped>
								<b-field expanded>
									<p class="control is-expanded"><input v-model="subdomain.subdomain" class="input has-text-right" :disabled="isUpdatingSubdomain" :placeholder="'Поддомен'|gettext"></p>
									
									<p class="control">
									<b-dropdown v-model="subdomain.domain_id" @input="onChangeSubdomain" position="is-bottom-left" :disabled="isUpdatingSubdomain">
										<button slot="trigger" class="button is-clear" type="button">.{{variants.subdomains.domains[subdomain.domain_id]}}<i class="fal fa-angle-down has-ml-1"></i></button>
										<b-dropdown-item :value="id" v-for="(d, id) in variants.subdomains.domains" v-if="id">{{d}}</b-dropdown-item>
									</b-dropdown>
									</p>
								</b-field>
								
								<p class="control"><button type="button" class="button is-primary" :class="{'is-loading': isUpdatingSubdomain}" @click="updateSubdomain">{{'Сохранить'|gettext}}</button></p>
							</b-field>
						</section>
					</div>
				</div>
				
								

				<div class="is-title" @click="toggleTab('domain')" :class="{in: activeTab == 'domain'}">
					<span><i class="fal fa-chevron-right has-mr-2"></i>{{'Доменное имя'|gettext}}</span>
				</div>
				<div>
					<div>
						<section>
						<transition name="fade">
							<div class="label-pro-container">
								<div v-if="!$auth.isAllowTariff('business')" class="tag is-business" v-tippy :content="'Эта возможность доступна на Business тарифе'|gettext">biz</div>
								<label class="label has-mb-2">{{'Вы можете подключить свой домен к странице'|gettext}}</label>
								<vue-component-domain-attach v-model="domain" :disabled="is_readonly" v-if="domain"></vue-component-domain-attach>
							</div>
						</transition>
						</section>
					</div>
				</div>
				
				<div class="is-title" @click="toggleTab('qr')" :class="{in: activeTab == 'qr'}">
					<span><i class="fal fa-chevron-right has-mr-2"></i>{{'QR-код'|gettext}}</span>
				</div>
				<div>
					<div>
						<section class="message is-info"><div class="message-body">{{'Вы можете скачать и использовать ваш QR-код на визитках или флайерах'|gettext}}</div></section>
						<section>
						<transition name="fade">
							<vue-component-qrcode :value="$account.link_safe" :with-download="true" class="has-text-centered"></vue-component-qrcode>
						</transition>
						</section>
					</div>
				</div>
				
				<div class="is-title" @click="toggleTab('widget')" :class="{in: activeTab == 'widget', 'is-last-tab': activeTab != null}">
					<span><i class="fal fa-chevron-right has-mr-2"></i>{{'Виджет на сайт'|gettext}}</span>
				</div>
				<div>
					<div>
						<section>
						<label class='label'>{{'Скопируйте код и разместите его в HTML-разметке вашего сайта'|gettext}}</label>
						<div class="field has-addons">
							<div class="control is-expanded"><input class="input" onfocus="this.select()" readonly="on" :value="widgetCode"></div>
							<div class="control">
								<vue-component-clipboard :text="widgetCode" class="button is-default" :show-icon="false"><i class="fal fa-copy has-mr-1"></i>{{'Скопировать'|gettext}}</vue-component-clipboard>
							</div>
						</div>	
						<div class="field has-mb-4">
							<label class='label'>{{'Цвет кнопки'|gettext}}</label>
							<vue-component-colorpicker colors='#F7464A,#e600a3,#1fb6ff,#1EB363,#4f5a67' v-model="widget.color" @input="onWidgetChanged" position="is-bottom-right" :disabled="is_readonly"></vue-component-colorpicker>
						</div>
						
						<div class="row">
							<div class="col-xs-12 col-sm-6">
								<div class="field">
									<label class='label'>{{'Расположение кнопки'|gettext}}</label>
									<label class="radio is-block has-mb-1" v-for="(v, k) in variants.widget_button_placement"><input type="radio" name='widget_button_placement' :value="k" v-model="widget.placement" @change="onWidgetChanged" :disabled="is_readonly"> {{v}}</label>
								</div>	
							</div>
							<div class="col-xs-12 col-sm-6">
								<div class="field">
									<label class='label'>{{'Вид окна'|gettext}}</label>
									<label class="radio is-block has-mb-1" v-for="(v, k) in variants.widget_button_view"><input type="radio" name='widget_button_view' :value="k" v-model="widget.view" @change="onWidgetChanged" :disabled="is_readonly"> {{v}}</label>
								</div>	
							</div>
						</div>	
						</section>
					</div>									
				</div>
				
			</div>
		</section>

		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});