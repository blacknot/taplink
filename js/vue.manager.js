
window.$app.defineComponent("manager", "vue-manager-blog-form", {data() {
			return {
				currentTab: 'common',
				isUpdating: false,
				isFetching: false,
				values: {post_id: null, seo_title: '', filename: '', body: '', body_doc: this.post_id?null:[], seo_description: '', is_draft: true, picture: null},
				menu: {common: this.$gettext('Общие'), settings: this.$gettext('Настройки')},				
			}
		},

		created() {
			if (this.post_id) this.fetchData(true);
			this.$form.top.buttons = {save: {title: this.$gettext('Сохранить'), classname: 'is-primary', click: this.save}};
			this.$form.top.title = this.$gettext('Пост');
		},
		

		props: ['post_id'],
		mixins: [FormModel],
		
		computed: {
			link() {
				return '//taplink.ru/blog/'+this.values.filename+'.html';
			}
		},
		
		watch: {
			isUpdating(v) {
				this.$form.top.buttons.save.classname = 'is-primary'+(v?' is-loading':'');
			}
		},

		methods: {
			filenameFilter(e) {
				let charCode = (e.which) ? e.which : e.keyCode;
				var txt = String.fromCharCode(charCode);
				if(!txt.match(/[A-Za-z0-9\-_]/)) e.preventDefault();
			},
			
			filenameFilterAfter(e) {
				e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9\-_ ]/g, '').trim().replace(/ /g, '_');
			},
			
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('manager/blog/get', {post_id: this.post_id}).then((data) => {
					this.isFetching = false;
					this.values = data.response.blog.post;
				});
			},
			
			save() {
				this.isUpdating = true;
				this.$api.post('manager/blog/set', this.values, this).then((data) => {
					if (data.result == 'success') {
						this.$form.close()
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			}
		}, template: `
	<div>
		<div class="top-panel">
			<div class="container">
			<div class="scrolling-container is-submenu">
				<div style="overflow-x: scroll">
					<a v-for="(t, k) in menu" class="button" :class="{active: k == currentTab}" @click="currentTab = k">{{t|gettext}}</a>
				</div>
			</div>
			</div>
		</div>

		<section class="container has-mb-2 has-mt-2" v-show="currentTab == 'common'">
			<input v-model="values.title" placeholder="Заголовок" class="input title has-mb-2">
<!-- 			<vue-component-editor :options="options" v-model="values.body" classname="hero-block blog-post" style="max-width: 800px;margin: 0 auto"></vue-component-editor> -->
			<vue-component-htmleditor v-model="values.body_doc" v-if="values.body_doc"></vue-component-htmleditor>
		</section>
		
		
		<section class="container has-mt-2" v-if="currentTab == 'settings'">
			<b-field label="Имя файла" :message="errors.filename" :class="{'has-error': errors.filename}">
			<p class="control">
				<b-field>
            	<div class="control is-expanded"><input class="input" v-model="values.filename" @keypress="filenameFilter" @change="filenameFilterAfter" @keyup="filenameFilterAfter"></input></div>
            	<div class="control"><a :href="link" target="_blank" class="button is-dark" :class="{disabled: !values.post_id}">Открыть</a></div>
				</b-field>
			</p>
			</b-field>

			<div class="row">
				<div class="col-xs-12 col-md-6">
					<label class="label">{{'Изображение'|gettext}}</label>
					<p class="has-text-grey-light">{{'Размер изображения'|gettext}}: 600x400 px</p>
					<vue-component-pictures v-model="values.picture" class="blog-picture" :button-title="'Загрузить картинку'|gettext" button-icon="fa fal fa-cloud-upload" updatable></vue-component-pictures>
				</div>
				<div class="col-xs-12 col-md-6">
					<b-field label="SEO Title">
						<b-input maxlength="4096" type="text" v-model="values.seo_title"></b-input>
					</b-field>
					<b-field label="SEO Description">
						<b-input maxlength="4096" type="textarea" v-model="values.seo_description"></b-input>
					</b-field>

					<mx-toggle v-model="values.is_draft" :title="'Черновик'|gettext"></mx-toggle>
				</div>
			</div>
		</section>
				
		
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("manager", "vue-manager-blog-list", {data() {
			return {
				isFetching: false,
				filter: {query: ''},
				perPage: 20,
			}
		},

		mixins: [ListModel],
		props: ['page_id'],

		created() {
			this.$io.on('events:manager.blog.list:refresh', this.refresh);
			this.fetchData(true);
		},
		
		destroyed() {
			this.$io.off('events:manager.blog.list:refresh', this.refresh);
		},		

		methods: {
			onFilter() {
				this.clearPages();
				this.fetchData(true);
			},
			
			fetchData(withLoading, force) {
				if (force || !this.checkCache()) {
					this.isFetching = withLoading;
					this.$api.get('manager/blog/list', {next: this.next, count: this.perPage, filter: this.filter}).then((data) => {
						this.cachePage(data.response.blog);
						this.isFetching = false;
					}).catch((error) => {
	                    this.fields = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
                }

			},
			
			onPageChange(page) {
                this.page = page
                this.fetchData()
            },
            
            clickRow(row) {
				this.$form.open('vue-manager-blog-form', {post_id: row.post_id});
            },
		}, template: `
	<div>
		<vue-component-submenu menu="manager.cms" :page_id="page_id"></vue-component-submenu>
		<vue-component-filterbox @filter="onFilter" v-model="filter" :disabled="isFetching" :with-buttons="true">
		<template slot="buttons">
			<a @click="$form.open('vue-manager-blog-form')" class="button is-primary is-fullwidth"><i class="fa fa-plus-circle"></i> {{'Добавить пост'|gettext}}</a>
		</template>
		</vue-component-filterbox>
				
		<div class="container">
		<div class="has-mb-2">
		<b-table paginated backend-pagination pagination-simple :data="fields" :loading="isFetching" :per-page="perPage" :total="total" @page-change="onPageChange" @click="clickRow" hoverable bordered>
			
<!-- 			<b-table-column field="post_id" label="" class="has-width-5" v-slot="props"><div :class="{'has-text-grey-light': props.row.is_draft}">{{ props.row.post_id }}</div></b-table-column> -->
			<b-table-column field="title" label="Загаловок" v-slot="props">
				<div :class="{'has-text-grey-light': props.row.is_draft}">{{ props.row.title }}</div>
			<div class="has-text-danger is-pulled-right" v-if="props.row.is_draft"><i class="fas fa-eye-slash has-ml-1"></i></div>
			</b-table-column>
			
			<b-table-column field="tms_created" label="Дата" numeric v-slot="props">
			<div :class="{'has-text-grey-light': props.row.is_draft}">{{ props.row.tms_created|date }}</div>
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
		
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-currency", {data() {
			return {
				providers: {},
				currency: {},
				data: {}
			}
		},

		created() {
			this.fetchData();
		},

		methods: {
			 fetchData() {
				this.isFetching = true;
				this.$api.get('manager/currency/get').then((data) => {
					
					let d = data.response.currency;
					
					this.providers = d.providers;
					this.currency = d.currency;
					this.data = d.data;
					this.isFetching = false;
				}).catch((error) => {
                    this.locales = [];
                    throw error
                })
			},
			
			changeValue(v, i, j) {
				let o = v.target
				o.disabled = true;
				this.$api.get('manager/currency/set', {payment_provider_id: i, currency_id: j, value: o.checked}).then((data) => {
					o.disabled = false;
				})
			}
		}, template: `
	<div class="container has-mb-4 has-mt-4">
		<div class="row row-small">
		<div class="col-sm-2">
			<table class="table" style="width: 100%">
			<thead>
				<tr>
					<td>Провайдер</td>
				</tr>
			</thead>
			<tbody>
			<tr v-for="(p, i) in providers">
				<td>{{p}}</td>
			</tr>
			</tbody>
		</table>

		</div>
		<div class="col-sm-10">
			<div style="overflow: scroll">
			<table class="table">
			<thead>
				<tr>
					<td v-for="c in currency">{{c}}</td>
				</tr>
			</thead>
			<tbody>
			<tr v-for="(p, i) in providers">
				<td v-for="(c, j) in currency">
					<input type="checkbox" :checked="data[i] != undefined && data[i].indexOf(parseInt(j)) != -1" @change="changeValue(event, i, j)">
				</td>
			</tr>
			</tbody>
			</table>
			</div>
		</div>
		</div>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-docs-index", {data() {
			return {
				isFetching: false,
				isAddFormOpened: false,
				document_id: null,
				documents: [],
				variants: null,
				language_id: null,
				language_default_id: null,
				language_add_id: null,
				books: [],
				book: null
			}
		},
		
		props: ['page_id'],
		
		created() {
			this.$io.on('events:manager.docs.list:refresh', this.refresh);
			this.fetchData(true);
		},
		
		destroyed() {
			this.$io.off('events:manager.docs.list:refresh', this.refresh);
		},
		
		computed: {
			document() {
				return this.documents[this.document_id] || null;
			},
			
			locale() {
				return this.document.languages[this.language_id] || null;
			}
		},
		
		methods: {
			addLanguage() {
				this.document.languages[this.language_add_id] = {language_id: this.language_add_id, is_draft: false, title: '', body: null};
				this.isAddFormOpened = false;
				this.language_id = this.language_add_id;
				this.language_add_id = null;
			},
			
			select(id) {
				if (this.documents[id] == undefined) {
					this.isFetching = true;
					this.$api.get('manager/docs/get', {document_id: id}).then((data) => {
						if (data.result == 'success') {
							let r = data.response.docs;
							this.documents[id] = r.document;
							this.document_id = id;
						}
						
						this.isFetching = false;
					});
				} else {
					this.document_id = id;
				}
			},
			
			editDocument() {
				if (this.document.languages[this.language_id] == undefined) {
					this.language_add_id = this.language_default_id;
					this.addLanguage();
				}

				this.$form.isOpened = true;
				
				this.$form.top.buttons = {save: {title: this.$gettext('Сохранить'), classname: 'is-primary', click: this.save}};
				this.$form.top.title = 'Редактирование';
			},
			
			save() {
				this.isFetching = true;
				this.$api.post('manager/docs/set', this.document).then((data) => {
					this.$form.close();
					this.isFetching = false;
				});
			},
			
			fetchData(withLoading, force) {
				this.isFetching = withLoading;
				this.$api.get('manager/docs/index').then((data) => {
					if (data.result == 'success') {
						let r = data.response.docs;
						this.books = r.books;
						this.book = r.book;
						this.variants = r.variants;
						this.document_id = r.document.document_id;
						this.documents[this.document_id] = r.document;
						this.language_default_id = this.language_id = this.variants.language_id[0].language_id;
					}
					this.isFetching = false;
				}).catch((error) => {
                    this.fields = []
                    this.total = 0
                    this.isFetching = false
                    throw error
                })
			},			
		}, template: `
	<div>
		<vue-component-submenu menu="manager.cms" :page_id="page_id"></vue-component-submenu>
		
		<div class="container has-mt-3 has-mb-3">
			<div class="row">
			<div class="col-xs-12 col-sm-3">
				<div class="docs-sidebar" :class="{disabled: $form.isOpened}" v-if="book">
					<div v-for="item in book.tree">
						<a :class="{in: item.id == document_id}" @click="select(item.id)">{{item.title}}</a>
						<div v-for="s in item.sub" class="is-2">
							<a :class="{in: s.id == document_id}" @click="select(s.id)">{{s.title}}</a>
						</div>
					</div>
				</div>
			</div>
			<div class="col-xs-12 col-sm-9">
				<div v-if="$form.isOpened">
					<div class="has-mb-2">
						<div class="level is-mobile">
							<div class="level-left">
								<div class="select has-mr-1" v-if="language_id != null">
									<select class="input" v-model="language_id" :disabled="isFetching">
										<option v-for="v in variants.language_id" :value="v.language_id" :disabled="document.languages[v.language_id] == undefined">{{v.language_title}}</option>
									</select>
								</div>
								<button class="button is-dark" @click="isAddFormOpened = true" :disabled="isFetching || (_.size(document.languages) == _.size(variants.language_id))"><i class="fa fa-plus"></i></button>
							</div>
							<div class="level-right" v-if="language_id != null">
								<mx-toggle v-model="locale.is_draft" :title="'Черновик'|gettext" :disabled="isFetching"></mx-toggle>
							</div>
						</div>
					</div>
					
					<input v-model="locale.title" placeholder="Заголовок" class="input has-mb-2">
					<vue-component-htmleditor v-model="locale.body"></vue-component-htmleditor>
				</div>
				<div v-else-if="document">
					<div class="has-mb-2">
						<button class="button is-dark" @click="editDocument">{{'Редактировать'|gettext}}</button>
					</div>
					<div class="panel panel-default has-p-2">
						<vue-component-document v-model="locale.body" class="hero-block blog-post hero-text" v-if="locale"/>
					</div>
				</div>
			</div>
			</div>
		</div>
		
		<b-modal v-model="isAddFormOpened" :has-modal-card="true" v-if="variants">
	    	<div class="modal-card has-text-black" style="font-size: 1rem">
	        	<header class="modal-card-head"><p class="modal-card-title">{{'Добавление языка'|gettext}}</p> <button type="button" class="modal-close is-large" @click="isAddFormOpened = false"></button></header>
	            <section class="modal-card-body">
		            <b-select :placeholder="'Язык'|gettext" v-model="language_add_id" :disabled="isFetching">
						<option v-for="v in variants.language_id" :value="v.language_id" v-if="document.languages[v.language_id] == undefined">{{v.language_title}}</option>
		            </b-select>
	            </section>
				<div class="modal-card-foot">
					<button type="button" class="button is-dark" @click="isAddFormOpened = false">{{'Закрыть'|gettext}}</button>
					<button type="button" class="button is-primary" @click="addLanguage" :disabled="language_add_id == null">{{'Доабвить'|gettext}}</button>
				</div>	
	        </div>
	    </b-modal>
	    
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-guides-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				isAddFormOpened: false,
				language_id: null,
				language_add_id: null,
				currentTab: 'common',
				menu: {common: this.$gettext('Общие'), settings: this.$gettext('Настройки')},
				values: {filename: '', locales: []},
				variants: {language_id: []},
				editor: null,
				language_id:  null
			}
		},
		
		created() {
			this.$form.top.buttons = {save: {title: this.$gettext('Сохранить'), classname: 'is-primary', click: this.save, disabled: true}};
		},
		
		props: ['guide_id'],
		mixins: [FormModel],
		
		mounted() {
			this.fetchData(true);
// 			this.$form.top.title = this.title;
		},
		
		watch: {
			values: {
				deep: true,
				handler() {
					this.$form.top.title = this.title;
				}
			},

			isUpdating(v) {
				this.$form.top.buttons.save.classname = 'is-primary'+(v?' is-loading':'');
			},
			
			language_id(v) {
				this.$form.top.buttons.save.disabled = v?false:true;
			}
		},
		
		computed: {
			title() {
				let d = this.$gettext('Инструкция');
				return (this.language_id != null)?(this.values.locales[this.language_id].title || d):d;
			}
		},

		methods: {
			addLanguage() {
				this.values.locales[this.language_add_id] = {language_id: this.language_add_id, is_draft: false, title: '', doc: null};
				this.isAddFormOpened = false;
				this.language_id = this.language_add_id;
				this.language_add_id = null;
			},
			
			filenameFilter(e) {
				let charCode = (e.which) ? e.which : e.keyCode;
				var txt = String.fromCharCode(charCode);
				if(!txt.match(/[A-Za-z0-9\-_]/)) e.preventDefault();
			},

			filenameFilterAfter(e) {
				e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9\-_ ]/g, '').trim().replace(/ /g, '_');
			},
			
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get(this.guide_id?['manager/guides/get', 'manager/guides/info']:'manager/guides/info', {guide_id: this.guide_id}).then((data) => {
					this.isFetching = false;
					
					if (data.result == 'success') {
						let r = data.response.guides;
						if (r.variants != undefined) this.variants = r.variants;
						
						if (r.values != undefined) {
							this.values = r.values;
							if (_.size(this.values.locales)) {
								this.language_id = _.keys(this.values.locales)[0];
							} else {
								this.isAddFormOpened = true;
							}
						} else {
							this.isAddFormOpened = true;
						}
					}
				});

			},

			save() {
				this.isUpdating = true;
				this.$api.post('manager/guides/set', this.values, this).then((data) => {
					if (data.result == 'success') {
						this.$form.close()
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			}
		}, template: `
	<div>
		<div class="top-panel">
			<div class="container">
			<div class="scrolling-container is-submenu">
				<div style="overflow-x: scroll">
					<a v-for="(t, k) in menu" class="button" :class="{active: k == currentTab}" @click="currentTab = k">{{t|gettext}}</a>
				</div>
			</div>
			</div>
		</div>
		<div class="container has-mt-2 has-mb-2">
			<div class="level is-mobile">
				<div class="level-left">
					<div class="select has-mr-1" v-if="language_id != null">
						<select class="input" v-model="language_id" :disabled="isFetching">
							<option v-for="v in variants.language_id" :value="v.language_id" :disabled="values.locales[v.language_id] == undefined">{{v.language_title}}</option>
						</select>
					</div>
					<button class="button is-dark" @click="isAddFormOpened = true" :disabled="isFetching || (_.size(values.locales) == _.size(variants.language_id))"><i class="fa fa-plus"></i></button>
				</div>
				<div class="level-right" v-if="language_id != null">
					<mx-toggle v-model="values.locales[language_id].is_draft" :title="'Черновик'|gettext" :disabled="isFetching"></mx-toggle>
				</div>
			</div>
		</div>
		<div class="container has-mb-2" v-show="currentTab == 'common'" :style="{height:isFetching?'250px':'unset'}">
<!-- 			<div class="hero-block blog-post hero-text" id="editorjs"></div> -->
			<vue-component-htmleditor v-model="values.locales[language_id].doc" v-if="language_id != null"></vue-component-htmleditor>
			<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
		</div>
		
		<section class="container has-mb-2" v-if="currentTab == 'settings'">
			<div class="panel panel-default has-p-2">
			<b-field label="Имя файла" :message="errors.filename" :class="{'has-error': errors.filename}">
			<p class="control">
				<b-field>
            	<div class="control is-expanded"><input class="input" v-model="values.filename" @keypress="filenameFilter" @change="filenameFilterAfter" @keyup="filenameFilterAfter"></input></div>
<!--             	<div class="control"><a :href="link" target="_blank" class="button is-dark" :class="{disabled: !values.guide_id}">Открыть</a></div> -->
				</b-field>
			</p>
			</b-field>

			<b-field label="Заголовок">
				<input class="input" v-model="values.locales[language_id].title"></input>
			</b-field>

<!--
			<b-field label="Видео">
				<input class="input" v-model="values.locales[language_id].video_link"></input>
			</b-field>
-->
			</div>
		</section>	
		
		<b-modal v-model="isAddFormOpened" :has-modal-card="true">
	    	<div class="modal-card has-text-black" style="font-size: 1rem">
	        	<header class="modal-card-head"><p class="modal-card-title">{{'Добавление языка'|gettext}}</p> <button type="button" class="modal-close is-large" @click="isAddFormOpened = false"></button></header>
	            <section class="modal-card-body">
		            <b-select :placeholder="'Язык'|gettext" v-model="language_add_id" :disabled="isFetching">
						<option v-for="v in variants.language_id" :value="v.language_id" v-if="values.locales[v.language_id] == undefined">{{v.language_title}}</option>
		            </b-select>
	            </section>
				<div class="modal-card-foot">
					<button type="button" class="button is-dark" @click="isAddFormOpened = false">{{'Закрыть'|gettext}}</button>
					<button type="button" class="button is-primary" @click="addLanguage" :disabled="language_add_id == null">{{'Доабвить'|gettext}}</button>
				</div>	
	        </div>
	    </b-modal>
	
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-guides-list", {data() {
			return {
				isFetching: false,
				filter: {query: ''},
				perPage: 20,
				variants: null
			}
		},

		props: ['page_id'],

		mixins: [ListModel],

		created() {
			this.$io.on('events:manager.guides.list:refresh', this.refresh);
			this.fetchData(true);
		},
		
		destroyed() {
			this.$io.off('events:manager.guides.list:refresh', this.refresh);
		},		

		methods: {
			implode(list) {
				return _.map(list, (v) => {
					return '<div style="display:flex;align-items:center" '+(v.is_draft?'class="has-text-grey-light"':'')+'><span title="ru" class="iti-flag '+v.language_code+' has-mr-1" style="display: inline-block;"></span>'+v.title+'</div>'
				}).join('');
			},		
			onFilter() {
				this.clearPages();
				this.fetchData(true);
			},
			
			refresh(data) {
				if (data.guide_ids != undefined) {
					this.merge(this.fields, 'guide_id', data.guide_ids, (ids, merge) => {
						this.$api.get('manager/guides/list', {filter: {guide_ids: ids}}).then((data) => {
							this.fields = merge(data.response.guides.fields);
						});
					});
				} else {
					this.fetchData(false, true);
				}
			},
			
			fetchData(withLoading, force) {
				if (force || !this.checkCache()) {
					this.isFetching = withLoading;
					this.$api.get(this.next?'manager/guides/list':['manager/guides/list', 'manager/guides/info'], {next: this.next, count: this.perPage, filter: this.filter}).then((data) => {
						if (data.result == 'success') {
							let r = data.response.guides;
							if (r.variants != undefined) this.variants = r.variants;
							this.cachePage(r);
						}
						this.isFetching = false;
					}).catch((error) => {
	                    this.fields = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
                }

			},
			
			onPageChange(page) {
                this.page = page
                this.fetchData()
            },
            
            clickRow(row) {
	           this.$form.open('vue-manager-guides-form', {guide_id: row.guide_id});
// 				this.$modal('vue-manager-guides-form', {guide_id: row.guide_id}, this);
            },
		}, template: `
	<div>
		<vue-component-submenu menu="manager.cms" :page_id="page_id"></vue-component-submenu>

		<vue-component-filterbox @filter="onFilter" v-model="filter" :disabled="isFetching" :with-buttons="true">
		<template slot="buttons">
			<a @click="$form.open('vue-manager-guides-form')" class="button is-primary is-fullwidth"><i class="fa fa-plus-circle"></i> {{'Добавить инструкцию'|gettext}}</a>
		</template>
		</vue-component-filterbox>
				
		<div class="container">
		<div class="has-mb-2">
		<b-table paginated backend-pagination pagination-simple :data="fields" :loading="isFetching" :per-page="perPage" :total="total" @page-change="onPageChange" @click="clickRow" hoverable bordered>
			
			<b-table-column field="title" label="Группа" class="has-width-20" v-slot="props">
			<span class="is-pulled-right tags is-hidden-mobile"><span v-for="l in variants.language_id" class="tag" :class="{'is-dark': props.row.languages[l.language_id] != undefined}" :style="{opacity: (props.row.languages[l.language_id] != undefined && props.row.languages[l.language_id].is_draft)?.5:1}">{{l.language_code}}</span></span>
				<div>
					<div>{{props.row.title}}</div>
					<div class="has-text-grey">{{props.row.guide_group_title}}</div>
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

		</b-table>
					
		</div>
		</div>
		
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-locales-addons", {data: function() {
			return {
				base: [],
				languages: [],
				currentNode: null,
				addons: null,
				isFetching: false,
				isUpdating: false,
				filter: '',
				filters: null,
				baseLanguage: false
			}
		},
		
		mixins: [FormModel],
		props: ['current', 'page_id'],
		
		created: function () {
			this.fetchData();
		},
		
		computed: {
			currentNodePhrases() {
				if (this.currentNode == null) return null;
				
				if (this.currentNode.messages == undefined) {
					return this.currentNode.phrases;
				} else {
					return _.filter(this.phrases, (o) => {
						return (this.currentNode.messages[o.k] != undefined);
					})
				}
			}
		},

		methods: {
			filterNodes(n) {
				return n;
			},
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
				this.isFetching = true;
				this.$api.get('manager/locales/addons/get', {language: this.current}).then((data) => {
					if (data.result == 'success') {
						let r = data.response.locales;
						this.baseLanguage = r.language_base;
						this.phrases = r.phrases;
						this.phrases_base = r.phrases_base;
						this.languages = r.languages;
						
						this.addons = r.addons;

						
						if (!this.current) this.current = r.current;
						
// 						this.selectNode(this.locales.nodes[Object.keys(this.locales.nodes)[0]], this.phrases_base);
					}
					
					this.isFetching = false;
				}).catch((error) => {
                    this.locales = [];
                    throw error
                })
			},
			
			selectNode(node, phrases_base) {
				if (node != null && node.messages != undefined) while (node.messages.length == 0) node = node.nodes[Object.keys(node.nodes)[0]];
				this.currentNode = node;
				this.base = phrases_base;
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('manager/locales/addons/set', {phrases: this.phrases, language: this.current, addons: this.addons}, this).then((data) => {
					this.isUpdating = false;
				});
			},
			
			hits(o) {
				var n = 0;

				if (o.messages == undefined) {
					for (i in o.phrases) {
						n += (o.phrases[i].v == '')?1:0;
					}
				} else {
					for (i in o.messages) {
						n += (this.phrases[i].v == '')?1:0;
					}
				}
				
				return n;
			},
			
			getInputType(row) {
				return (row.v == '')?'is-danger':'';
			},
			
			changeLanguage() {
// 				this.$router.replace({name: 'manager.locales', params: {'current': this.current}});
				this.currentNode = null;
				this.fetchData();
			},
			
			grubForm() {
				this.$modal('vue-manager-locales-addons-parse-form', {language: this.current, addon_id: this.currentNode.addon_id});
			}
		}, template: `
	<div>
		<vue-component-submenu menu="manager.locales" :page_id="page_id"></vue-component-submenu>
		<div class="has-p-2 has-mb-2 has-mt-1">
		
		<div class="row row-small">
			<div class="col-sm-3">
				<div class="media">
					<div class="media-content">
						<b-select v-model="current" expanded @input="changeLanguage">
			                <option :value="k" v-for="(v, k) in languages">{{v}}</option>
						</b-select>
					</div>
					<mx-toggle v-model="baseLanguage" trueValue="EN" falseValue="RU" class="is-pulled-right has-ml-2" :disabled="current == 'en'"></mx-toggle>
				</div>
			</div>
			<div class="col-xs has-text-right">
				<button class="button is-primary" @click="updateData" :class="{'is-loading': isUpdating}" :disabled="isFetching">{{'Сохранить изменения'|gettext}}</button>
				<button class="button is-light" @click="grubForm" :disabled="isFetching || isUpdating || !currentNode" v-if="$auth.isAllowEndpoint('manager/locales/addons/parse')">{{'Сканирование модуля'|gettext}}</button>
			</div>
		</div>		
    
		<hr class="is-hidden-mobile">
		
        <div class="row">
	        <div class="col-sm-3">
		        <aside class="menu-locales" style="padding-bottom: 2rem">
					<ul class="menu-list" v-if="addons">
			        	<li v-for="p in addons"><a class="is-block" @click="selectNode(p, p.phrases_base)" :class="{'is-active': currentNode == p}">{{p.title}} <span class="tag is-rounded is-danger" v-if="hits(p)">{{hits(p)}}</span></a></li>
		        	</ul>
		        </aside>
	        </div>
	        
	        <div class="col-sm-9">
		        <div v-if="currentNode">
			        <div class="field">
				        <label class="label">Title</label>
				        <input type="text" class="input" v-model="currentNode.addon_title" :placeholder="currentNode.default_addon_title">
			        </div>
			        <div class="field">
				        <label class="label">Snippet</label>
				        <textarea type="text" class="input" v-model="currentNode.addon_snippet" :placeholder="currentNode.default_addon_snippet"></textarea>
			        </div>
			        
			        <hr class="is-hidden-mobile">
		        </div>
				<b-table :data="currentNodePhrases" :loading="isFetching" bordered v-if="currentNode">
					<b-table-column field="k" width="200" label="Phrase" v-slot="props">
						<div class="control is-fullwidth"><input :value="(baseLanguage && current != 'en' && (base[props.row.k] != undefined))?base[props.row.k]:props.row.k" class="input" disabled></div>
					</b-table-column>
					<b-table-column field="v" width="200" label="Translate" v-slot="props">
						<b-field :type="getInputType(props.row)"><b-input v-model="props.row.v" class="is-fullwidth"></b-input></b-field>
					</b-table-column>
				</b-table>
	        </div>
		
        </div>	
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
		</div>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-locales-addons-parse-form", {data() {
			return {
				checkedRows: {
					add: [],
					del: []
				},
				isFetching: false,
				isUpdating: false,
				currentTab: 'add',
				diff_del: [],
				diff_add: []
			}
		},
		
		props: ['language', 'addon_id'],
		
		created() {
			this.fetchData();
		},
		
		computed: {
			phrases() {
				return _.map((this.currentTab == 'add')?this.diff_add:this.diff_del, (v, k) => { return {v: v}; });
			}
		},
		
		methods: {
			fetchData() {
				this.$api.get('manager/locales/addons/parse', {action: 'get', addon_id: this.addon_id}).then((r) => {
					if (r.result == 'success') {
						this.diff_add = r.response.diff_add;
						this.diff_del = r.response.diff_del;

						this.checkedRows.add = this.diff_add;
					}
				});
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('manager/locales/addons/parse', {action: 'set', addon_id: this.addon_id, phrases: this.checkedRows}).then((r) => {
					if (r.result == 'success') {
						this.$parent.close();
					}

					this.isUpdating = false;
				});
			},
			
			setTab(v) {
				this.currentTab = v;
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">Сканирование модуля</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>

		<ul class="nav nav-tabs has-text-left">
			<li :class="{active: currentTab == 'add'}"><a @click="setTab('add')">{{'Добавить'|gettext}}<span v-if="diff_add.length" class="has-ml-1">({{diff_add.length}})</span></a></li>
			<li :class="{active: currentTab == 'del'}"><a @click="setTab('del')">{{'Удалить'|gettext}}<span v-if="diff_del.length" class="has-ml-1">({{diff_del.length}})</span></a></li>
		</ul>
		
		<section class="modal-card-body">
			<div>
				<b-table :data="phrases" :loading="isFetching" hoverable>
					<b-table-column :label="'Фраза'|gettext" v-slot="props">
						<b-checkbox @click.native.stop :native-value="props.row.v" v-model="checkedRows[currentTab]">
						<span>{{props.row.v}}</span><span v-else>{{'Без названия'|gettext}}</span>
						</b-checkbox>
					</b-table-column>
					
					<template slot="empty">
			            <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
			                <p>{{'Ничего нет'|gettext}}</p>
			            </section>
			            <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
			                <p>{{'Загрузка данных'|gettext}}</p>
			            </section>
			        </template>
				</b-table>
			</div>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark level-item" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary level-item" type="button" @click="updateData" :class="{'is-loading': isUpdating}">{{'Сохранить'|gettext}}</button>
			
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>		
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-locales-export-form", {data() {
			return {
				isUpdating: false,
				isRefreshing: false,
				isFetching: false,
				amount: 0,
				charset: 'utf-8',
				filter: '*',
				variants: {}
			}
		},
		
		props: ['current'],

		created() {
			this.fetchData(true);
		},
		
		computed: {
			downloadUrl() {
				return '/api/manager/locales/export/download.csv?filter='+this.filter+'&charset='+this.charset+'&current='+this.current;
			}	
		},

		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isRefreshing =  this.isFetching = withLoading;
				
				this.$api.get('manager/locales/export/info').then((data) => {
					this.isFetching = this.isRefreshing = false;
					this.variants = data.response.export.info.variants;
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Экспорт фраз'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<b-field :label="'Фильтр'|gettext">
			<b-select v-model="filter" expanded>
                <option value="*">Выгрузить все</option>
                <option :value="k" v-for="(v, k) in variants.filters">Исключая "{{k}}"</option>
			</b-select>
			</b-field>
			
			<b-field :label="'Кодировка'|gettext">
				<b-select v-model="charset" expanded>
					<option v-for="(v, k) in variants.charset" :value="k">{{ v }}</option>
				</b-select>
			</b-field>
		</section>
		<footer class="modal-card-foot">
			<a :href="downloadUrl" target="frame" class="button is-success is-pulled-right no-ajax" :class="{'is-loading': isRefreshing}"><span class="is-hidden-mobile">{{'Скачать CSV-файл'|gettext}}</span><span class="is-hidden-tablet">{{'Скачать'|gettext}}</span></a>
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("manager", "vue-manager-locales-import-form", {data() {
			return {
				grid: null,
				data: null,
				isUpdating: false,
				isFetching: true,
				selects: [],
				columnSelect: null,
				values: {},
				is_done: false,
				amount_updated: 0,
				amount_notfound: 0,
				current_language: 'ru'
			}
		},
		
		props: ['phrases', 'languages'],

		mounted() {
			$mx.lazy('grid.js', 'grid.css', () => {
				var d = {cols: 2, rows: 5, name: 'data', clearPaste: 'yes', autofocus: 'yes'}

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
				
				this.grid.setActiveCell(cell = $mx("tbody tr:first td:first", this.grid.$el));
				this.grid.$el.focus();
				
				$mx(document).on('paste', this.paste);
				
				this.isFetching = false;
			});
		},
		
		destroyed() {
			$mx(document).off('paste', this.paste);
			this.grid.destroy();
		},

		mixins: [FormModel],

		methods: {
			updateData() {
				
				if (this.current_language == 'ru') {
					_.each(this.data.cells, (v) => {
						v.A = v.A.trim();
						v.B = v.B.trim();
	
						if (this.phrases[v.A] == undefined) {
							this.amount_notfound++
							console.log(v.A);
						} else {
							this.amount_updated++;
							this.phrases[v.A].v = v.B;
						}
					});
					
					this.is_done = true;
				} else {
					this.$api.get('manager/locales/get', {language: this.current_language}).then((data) => {
						let phrases = {};
						_.each(data.response.locales.phrases, (v) => {
							if (v.v) phrases[v.v] = v.k;
						});
						
						_.each(this.data.cells, (v) => {
							v.A = v.A.trim();
							v.B = v.B.trim();
	
							if (phrases[v.A] != undefined && this.phrases[phrases[v.A]] != undefined) {
								this.amount_updated++;
								this.phrases[phrases[v.A]].v = v.B;
							} else {
								this.amount_notfound++
								console.log(v.A);
							}
						});

						this.is_done = true;
					});
				}
/*
				
				this.isUpdating = true;
				this.$api.post('manager/locales/import', {data: this.data}, this).then((data) => {
					if (data.result == 'success') {
						this.amount_inserted = data.response.amount_inserted;
						this.amount_products = data.response.amount_products;
						this.is_done = data.response.is_done;
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
*/
				//this.$parent.close();
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
				
				oe = e.originalEvent;
				
				if (true) {
					
					if (true) {
						this.grid.setActiveCell(cell = $mx("tbody tr:first td:first", o));
						$mx("tbody tr td:gt(0), thead tr th:gt(0)", o).remove();
						$mx("tbody tr:gt(0)", o).remove();
					} else {
						cell = this.grid.getActiveCell();
					}
					
					function getClipboardData() {
						var cd = (window.clipboardData)?window.clipboardData:oe.clipboardData;
						var types = [];
						
						for (var _t = 0; _t < cd.types.length; _t++) types.push(cd.types[_t]);
						
						if (types.indexOf('text/html') != -1) {
							var clipText = $mx(oe.clipboardData.getData('text/html'));
							if (clipText.is('table')) {
								var table = $mx('tr', clipText).map(function() {
									return [$mx("td",this).map(function() { 
								      return this.innerText;     
								    }).get()];
								}).get();
								
								return table;
							}
						}
										
						if (types.indexOf('text/plain') != -1) {
							var clipText = oe.clipboardData.getData('text/plain');
							var rows = clipText.split(/\r\n|\n|\r/);
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
					 						var c = $mx('<td><div></div></td>').appendTo(this).data(cell.data()).data("column", col);
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
				 					tdnext = $mx('td', next);
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
			}
		}, template: `
	<div class="modal-card modal-card-large">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Загрузка языка из Excel'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="message is-success" v-if="is_done && amount_updated"><div class="message-body">Обновлено фраз: {{amount_updated|number}}</div></div>
			<div class="message is-danger" v-if="is_done && amount_notfound"><div class="message-body">Не найдено фраз: {{amount_notfound|number}}</div></div>
			
			<div v-else>
				<b-field label="Базовый язык">
					<b-select v-model="current_language">
		                <option value="ru">Русский</option>
		                <option :value="k" v-for="(v, k) in languages">{{v}}</option>
					</b-select>
				</b-field>
				<div ref="grid" class="has-mb-4"></div>
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

window.$app.defineComponent("manager", "vue-manager-locales-payments", {data: function() {
			return {
				base: [],
				languages: [],
				currentNode: null,
				payments: null,
				isFetching: false,
				isUpdating: false,
				filter: '',
				filters: null,
				baseLanguage: false
			}
		},
		
		mixins: [FormModel],
		props: ['current', 'page_id'],
		
		created: function () {
			this.fetchData();
		},
		
		computed: {
			currentNodePhrases() {
				if (this.currentNode == null) return null;
				
				if (this.currentNode.messages == undefined) {
					return this.currentNode.phrases;
				} else {
					return _.filter(this.phrases, (o) => {
						return (this.currentNode.messages[o.k] != undefined);
					})
				}
			},
		},

		methods: {
			filterNodes(n) {
				return n;
			},
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
				this.isFetching = true;
				this.$api.get('manager/locales/payments/get', {language: this.current}).then((data) => {
					
					if (data.result == 'success') {
						let r = data.response.locales;
						this.baseLanguage = r.language_base;
						this.phrases = r.phrases;
						this.phrases_base = r.phrases_base;
						this.languages = r.languages;
						
						this.payments = r.payments;
						
						if (!this.current) this.current = r.current;
						
// 						this.selectNode(this.locales.nodes[Object.keys(this.locales.nodes)[0]], this.phrases_base);
					}
					
					this.isFetching = false;
				}).catch((error) => {
                    this.locales = [];
                    throw error
                })
			},
			
			selectNode(node, phrases_base) {
				if (node != null && node.messages != undefined) while (node.messages.length == 0) node = node.nodes[Object.keys(node.nodes)[0]];
				this.currentNode = node;
				this.base = phrases_base;
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('manager/locales/payments/set', {phrases: this.phrases, language: this.current, payments: this.payments}, this).then((data) => {
					this.isUpdating = false;
				});
			},
			
			hits(o) {
				var n = 0;

				if (o.messages == undefined) {
					for (i in o.phrases) {
						n += (o.phrases[i].v == '')?1:0;
					}
				} else {
					for (i in o.messages) {
						n += (this.phrases[i].v == '')?1:0;
					}
				}
				
				return n;
			},
			
			getInputType(row) {
				return (row.v == '')?'is-danger':'';
			},
			
			changeLanguage() {
// 				this.$router.replace({name: 'manager.locales', params: {'current': this.current}});
				this.currentNode = null;
				this.fetchData();
			}
		}, template: `
	<div>
		<vue-component-submenu menu="manager.locales" :page_id="page_id"></vue-component-submenu>
		<div class="has-p-2 has-mb-2 has-mt-1">
	
		<div class="row row-small">
			<div class="col-sm-3">
				<div class="media">
					<div class="media-content">
						<b-select v-model="current" expanded @input="changeLanguage">
			                <option :value="k" v-for="(v, k) in languages">{{v}}</option>
						</b-select>
					</div>
					<mx-toggle v-model="baseLanguage" trueValue="EN" falseValue="RU" class="is-pulled-right has-ml-2" :disabled="current == 'en'"></mx-toggle>
				</div>
			</div>
			<div class="col-xs has-text-right">
				<button class="button is-primary" @click="updateData" :class="{'is-loading': isUpdating}" :disabled="isFetching">{{'Сохранить изменения'|gettext}}</button>
			</div>
		</div>		
    
		<hr class="is-hidden-mobile">
			
        <div class="row">
	        <div class="col-sm-3">
		        <aside class="menu-locales" style="padding-bottom: 2rem">
					<ul class="menu-list" v-if="payments">
			        	<li v-for="p in payments">
			        	<a class="is-block" @click="selectNode(p, p.phrases_base)" :class="{'is-active': currentNode == p}">{{p.title}} <span class="tag is-rounded is-danger" v-if="hits(p)">{{hits(p)}}</span></a></li>
		        	</ul>
		        </aside>
	        </div>
	        
	        <div class="col-sm-9">
		        <div>
			        <div class="field" v-if="currentNode">
				        <label class="label">Title</label>
				        <input type="text" class="input" v-model="currentNode.payment_title" placeholder="Not necessary">
			        </div>
			        <hr class="is-hidden-mobile">
		        </div>		        
				<b-table :data="currentNodePhrases" :loading="isFetching" bordered v-if="currentNode">
					<b-table-column field="k" width="200" label="Phrase" v-slot="props">
						<div class="control is-fullwidth"><input :value="(baseLanguage && current != 'en' && (base[props.row.k] != undefined))?base[props.row.k]:props.row.k" class="input" disabled></div>
					</b-table-column>
					<b-table-column field="v" width="200" label="Translate" v-slot="props">
						<b-field :type="getInputType(props.row)"><b-input v-model="props.row.v" class="is-fullwidth"></b-input></b-field>
					</b-table-column>
				</b-table>
	        </div>
		
        </div>	
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
		</div>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-locales-phrases", {data: function() {
			return {
				search: '',
				locales: null,
				phrases: null,
				phrases_base: null,
				base: [],
				languages: [],
				currentNode: null,
				addons: null,
				payments: null,
				amount_need: 0, 
				isFetching: false,
				isUpdating: false,
				filter: '',
				filters: null,
				baseLanguage: false
			}
		},
		
		mixins: [FormModel],
		props: ['current', 'page_id'],
		
		created: function () {
			this.fetchData();
/*
			if (this.current) {
				this.fetchData();
			} else {
				this.$api.get('manager/locales/current').then((data) => {
					this.$router.replace({name: 'manager.locales.phrases', params: {'current': data.response.current}});
				});
			}
*/
		},
		
		computed: {
			currentNodePhrases() {
				if (this.search) {
					return _.filter(this.phrases, (o) => {
						if (this.baseLanguage && this.current != 'en' && this.base[o.k] != undefined) {
							return (this.base[o.k].toLowerCase().indexOf(this.search.toLowerCase()) != -1);
						} else {
							return (o.k.toLowerCase().indexOf(this.search.toLowerCase()) != -1);
						}
					})
/*
					return this.phrases_.filter(this.phrases, (o) => {
						return ((this.currentNode.messages[o.k] != undefined) && (o.k.toLowerCase().indexOf(this.search.toLowerCase()) != -1));
					})
*/
				} else {
					if (this.currentNode == null) return null;
					
					if (this.currentNode.messages == undefined) {
						return this.currentNode.phrases;
					} else {
						return _.filter(this.phrases, (o) => {
							return (this.currentNode.messages[o.k] != undefined);
						})
					}
				}
			},
			
			filteredNodes() {
				return this.locales;
			}
		},

		methods: {
			filterNodes(n) {
				return n;
			},
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
				this.isFetching = true;
				this.$api.get('manager/locales/get', {language: this.current}).then((data) => {
					
					if (data.result == 'success') {
						let r = data.response.locales;
						this.baseLanguage = r.language_base;
						this.phrases = r.phrases;
						this.phrases_base = r.phrases_base;
						this.locales = r.locales;
						this.languages = r.languages;
						
						this.addons = r.addons;
						this.payments = r.payments;
						
						if (!this.current) this.current = r.current;
						
						this.selectNode(this.locales.nodes[Object.keys(this.locales.nodes)[0]], this.phrases_base);
					}
					
					this.isFetching = false;
				}).catch((error) => {
                    this.locales = [];
                    throw error
                })
			},
			
			selectNode(node, phrases_base) {
				if (node != null && node.messages != undefined) while (node.messages.length == 0) node = node.nodes[Object.keys(node.nodes)[0]];
				this.currentNode = node;
				this.base = phrases_base;
			},
			
			updateData() {
				this.isUpdating = true;
				
/*
				var phrases = []; 
				var ru = [];
				var __ = [];
				
				_.each(this.locales, (v) => {
					ru.push(v.ru);
					__.push(v.__);
				});
				
				phrases = {ru: ru, __: __};
*/

				this.$api.post('manager/locales/set', {phrases: this.phrases, language: this.current, addons: this.addons, payments: this.payments}, this).then((data) => {
					

/*
					var i = 0;
					_.each(this.locales, (v, k) => {
						this.locales[k].type = (v.__.length?'':'is-danger');
						i += v.__.length?0:1;
					});
					
					this.amount_need = i;
*/

					this.isUpdating = false;
				});
			},
			
			hits(o) {
				var n = 0;

				if (o.messages == undefined) {
					for (i in o.phrases) {
						n += (o.phrases[i].v == '')?1:0;
					}
				} else {
					for (i in o.messages) {
						n += (this.phrases[i].v == '')?1:0;
					}
				}
				
				return n;
			},
			
			getInputType(row) {
				return (row.v == '')?'is-danger':'';
			},
			
			changeLanguage() {
// 				this.$router.replace({name: 'manager.locales', params: {'current': this.current}});
				this.currentNode = null;
				this.fetchData();
			},
			
			changeFilter() {
				
			},
			
			openExportForm() {
				// {filter: _.clone(this.filter)}
				this.$modal('vue-manager-locales-export-form', {current: this.current}, this);
			},
			
			openImportForm() {
				this.$modal('vue-manager-locales-import-form', {phrases: this.phrases, languages: this.languages}, this);
			}
		}, template: `
	<div>
		<vue-component-submenu menu="manager.locales" :page_id="page_id"></vue-component-submenu>
		<div class="has-p-2 has-mb-2 has-mt-1">
		
		<div class="container is-mb-4" v-if="amount_need">
			<b-notification type="is-danger has-mb-2" :closable="false">
				Messages without translate: {{ amount_need }}
			</b-notification>
		</div>
		
		
			<div class="row row-small">
				<div class="col-sm-3">
					<div class="media">
						<div class="media-content">
							<b-select v-model="current" expanded @input="changeLanguage">
				                <option :value="k" v-for="(v, k) in languages">{{v}}</option>
							</b-select>
						</div>
						<mx-toggle v-model="baseLanguage" trueValue="EN" falseValue="RU" class="is-pulled-right has-ml-2" :disabled="current == 'en'"></mx-toggle>
					</div>
				</div>
				<div class="col-xs">
					<input type="text" v-model="search" class="input is-fullwidth" :placeholder="'Поиск'|gettext">
<!--
					<b-select v-model="filter" expanded @input="changeFilter">
		                <option value="">Показывать все</option>
		                <option :value="k" v-for="(v, k) in filters">Исключить "{{k}}"</option>
					</b-select>
-->
				</div>	
				
<!--
				<div class="col-xs col-shrink" style="width:60px">
					<a @click="openImportForm" class="button is-light is-fullwidth" v-tippy :content="'Загрузить из Excel'|gettext"><i class="fa fas fa-upload"></i></a>
				</div>
-->
				<div class="col-xs col-shrink" style="width:60px">
					<a @click="openExportForm" class="button is-light is-fullwidth" v-tippy :content="'Скачать в формате CSV'|gettext"><i class="fa fas fa-download"></i></a>
				</div>
				<div class="col-sm-2">
					<button class="button is-primary is-fullwidth" @click="updateData" :class="{'is-loading': isUpdating}" :disabled="isFetching">{{'Сохранить изменения'|gettext}}</button>
				</div>
			</div>		
        
			<hr class="is-hidden-mobile">
			
        <div class="row">
	        <div class="col-sm-3">
		        <aside class="menu-locales" style="padding-bottom: 2rem" v-if="locales" :class="{disabled: search}" :style="{opacity: search?'.1 !important':1}">
<!-- 			        <p class="menu-label" style="padding:1rem 1rem 0 1rem">Сайт</p> -->
			        <ul class="menu-list">
				        <li v-for="(v, i) in this.filteredNodes.nodes">
				        	<a class="is-block" @click="selectNode(v, phrases_base)" :class="{'is-active': currentNode == v}">{{i}} <span class="tag is-rounded is-danger" v-if="hits(v)">{{hits(v)}}</span></a>
				        	<ul v-if="v.nodes">
					        	<li v-for="(w, j) in v.nodes"><a class="is-block" @click="selectNode(w, phrases_base)" :class="{'is-active': currentNode == w}">{{j}} <span class="tag is-rounded is-danger" v-if="hits(w)">{{hits(w)}}</span></a>

						        	<ul v-if="w.nodes">
							        	<li v-for="(ww, jj) in w.nodes"><a class="is-block" @click="selectNode(ww, phrases_base)" :class="{'is-active': currentNode == ww}">{{jj}} <span class="tag is-rounded is-danger" v-if="hits(ww)">{{hits(ww)}}</span></a>
							        	
							        	</li>
						        	</ul>
						        	
					        	</li>
				        	</ul>
				        </li>

<!--
				        <li><a class="is-block" @click="selectNode(payments[0], payments[0].phrases_base)">Payments</a>
							<ul>
					        	<li v-for="p in payments">
					        	<a class="is-block" @click="selectNode(p, p.phrases_base)" :class="{'is-active': currentNode == p}">{{p.title}} <span class="tag is-rounded is-danger" v-if="hits(p)">{{hits(p)}}</span></a></li>
				        	</ul>
				        </li>
-->
				        
<!--
				        <li><a class="is-block" @click="selectNode(addons[0], addons[0].phrases_base)">Addons</a>
							<ul>
					        	<li v-for="p in addons"><a class="is-block" @click="selectNode(p, p.phrases_base)" :class="{'is-active': currentNode == p}">{{p.title}} <span class="tag is-rounded is-danger" v-if="hits(p)">{{hits(p)}}</span></a></li>
				        	</ul>
				        </li>
-->
				        
			        </ul>
			        
<!--
			        <p class="menu-label" style="padding:1rem 1rem 0 1rem">Приложение</p>
			        <ul class="menu-list">
				        <li v-for="(v, i) in filteredNodes.application.nodes">
				        	<a class="is-block" @click="currentNode = v" :class="{'is-active': currentNode == v}">{{i}} <span class="tag is-rounded is-danger" v-if="hits(v)">{{hits(v)}}</span></a>
				        	<ul v-if="v.nodes">
					        	<li v-for="(w, j) in v.nodes"><a class="is-block" @click="currentNode = w" :class="{'is-active': currentNode == w}">{{j}} <span class="tag is-rounded is-danger" v-if="hits(w)">{{hits(w)}}</span></a></li>
				        	</ul>
				        </li>
			        </ul>
-->
		        </aside>
	        </div>
	        
	        <div class="col-sm-9">
<!--
		        <div v-if="currentNode && currentNode.type == 'addon'">
			        <div class="field">
				        <label class="label">Title</label>
				        <input type="text" class="input" v-model="currentNode.addon_title">
			        </div>
			        <div class="field">
				        <label class="label">Snippet</label>
				        <textarea type="text" class="input" v-model="currentNode.addon_snippet"></textarea>
			        </div>
			        
			        <hr class="is-hidden-mobile">
		        </div>
-->
<!-- 		         v-if="currentNode" -->
				<b-table :data="currentNodePhrases" :loading="isFetching" bordered v-if="currentNode">
						<b-table-column field="k" width="200" label="Phrase" v-slot="props">
							<div class="control is-fullwidth"><input :value="(baseLanguage && current != 'en' && (base[props.row.k] != undefined))?base[props.row.k]:props.row.k" class="input" disabled></div>
						</b-table-column>
						<b-table-column field="v" width="200" label="Translate" v-slot="props">
							<b-field :type="getInputType(props.row)"><b-input v-model="props.row.v" class="is-fullwidth"></b-input></b-field>
						</b-table-column>
				</b-table>
	        </div>
		
        </div>	
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
		</div>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-logs-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				values: {}
			}
		},

		created() {
			this.fetchData(true);
		},

		props: ['message_id'],
		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('manager/logs/get', {message_id: this.message_id}).then((data) => {
					this.isFetching = false;
					this.values = data.response.logs.message;
					
					this.values.message = JSON.stringify(this.values.message, null, "\t");
				});

			}
		}, template: `
	<div class="modal-card modal-card-large">
		<header class="modal-card-head">
			<p class="modal-card-title">Событие</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<vue-component-codemirror v-model="values.message" mode="application/json" readonly="true"></vue-component-codemirror>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("manager", "vue-manager-logs-list", {data() {
			return {
				isFetching: false,
				filter: {query: '', tags: []},
				perPage: 100,
				filterTags: ['owner_id', 'service_name'],
			}
		},

		mixins: [ListModel],

		created() {
			this.fetchData(true);
		},

		methods: {
			onFilter() {
				this.clearPages();
				this.fetchData(true);
			},
			
			refresh() {
				this.fetchData(false, true);
			},
			
			fetchData(withLoading, force) {
				if (force || !this.checkCache()) {
					this.isFetching = withLoading;
					this.$api.get('manager/logs/list', {next: this.next, count: this.perPage, filter: this.filter}).then((data) => {
						this.cachePage(data.response.logs);
						this.isFetching = false;
					}).catch((error) => {
	                    this.fields = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
                }

			},
			
			tagsFetch(name, query, cb) {
				if (['owner_id'].indexOf(name) >= 0) {
		            cb([]);
	            } else {
	                this.$api.get('manager/logs/filters', {query: query, name: name}).then((data) => {
		                cb((data.result == 'success')?data.response.variants:[]);
					});
				}
			},
			
			onPageChange(page) {
                this.page = page
                this.fetchData()
            },
            
            clickRow(row) {
	            this.$modal('vue-manager-logs-form', {message_id: row.message_id}, this);
            },
		}, template: `
	<div>
		<vue-component-filterbox @filter="onFilter" :tags-fetch="tagsFetch" :allow-tags="filterTags" v-model="filter" :disabled="isFetching"></vue-component-filterbox>
				
		<div class="container">
		<div class="has-mb-2">
		<b-table paginated backend-pagination pagination-simple :data="fields" :loading="isFetching" :per-page="perPage" :total="total" @page-change="onPageChange" @click="clickRow" hoverable bordered>
			
			<b-table-column field="post_id" label="" class="has-width-5 has-text-grey" v-slot="props">{{ props.row.message_id }}</b-table-column>
			<b-table-column field="service_name" label="Сервис" v-slot="props">
				{{ props.row.service_name }}
			</b-table-column>
			
			<b-table-column field="code" label="HTTP Code" class="has-width-5" v-slot="props">
				<span :class="{'has-text-success': props.row.code >= 200 && props.row.code < 300, 'has-text-danger': props.row.code >= 400}">{{ props.row.code }}</span>
			</b-table-column>
			
			<b-table-column field="owner" label="Профиль" v-slot="props">
				<span v-if="props.row.owner">{{ props.row.owner }}</span>
			</b-table-column>
			
			<b-table-column field="tms_created" label="Дата" numeric v-slot="props">
			{{ props.row.tms|datetime }}
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
		
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-mails-campaings-form", {data() {
			return {
				values: null,
				variant_idx: 0,
				variants: {sender_id: null},
				view: 'view',
				errors: {},
				isFetching: false,
				isUpdating: false,
				domain: 'taplink.cc',
				activeTab: 'common',
				isFetchingTags: false,
				autocompleteTags: [],
				styles: ''
			}
		},
		
		
		mixins: [FormModel],
		
		props: ['campaing_id'],
		
		components: {
			vRuntimeTemplate
		},
		
		watch: {
			view(v) {
				if (v == 'html') {
					this.autoFormat();
				}
			},
			variant_idx() {
				if (this.view == 'html') {
					this.autoFormat();
				}
			}
		},

		mounted() {
			this.fetchData(true);
		},
		
		computed: {
			template() {
				let f = this.send;
				if (!f) return '';
				
				let template = ((f.template_id?this.variants.template_id[f.template_id].template:'<div>{{body}}</div>'));
				let re = new RegExp('<'+'style>.*?<\/style>', 'igsm');
				let m = re.exec(template);
				this.styles = m?m[0]:'';
				return template.replace(re, '').replace('{{body}}', '<vue-component-editor class="editor" v-model="send.body" block-tag="DIV"></vue-component-editor>');
			},

			defaultSendername() {
				return (this.values && this.values.sender_id && this.variants && this.variants.sender_id)?this.variants.sender_id[this.values.sender_id].name:'';
			},
			
			send() {
				return (this.variant_idx < this.values.sends.length)?this.values.sends[this.variant_idx]:null;
			}
		},
		
		methods: {
			onAction(v) {
				switch (v) {
					case 'test':
						this.save(() => { 
							this.$prompt('На какую почту отправить письмо?', {value: this.$account.user.email}).then(s => {
								this.$api.post('manager/mails/campaings/test', {campaing_id: this.campaing_id, email: s}, this).then((data) => {
									if (data.result == 'success') {
										this.$toast('Письмо успешно отправленно', 'is-success');
									}
								});
							})
						})
						break;
					case 'archive':
						this.onArchive();
						break;
				}
			},
			
			onAddingTag(v) {
				return !_.find(this.values.tags, ['tag_id', v.tag_id]);
			},
			
			onAddedTag(v) {
				if (typeof v == 'string') {
					this.values.tags.pop();
					this.values.tags.push({tag_id: null, tag: v});
				}
			},
			
			asyncAutocompleteTag: _.debounce(function(query) {
                if (query.trim() == '') {
	                this.autocompleteCollections = [];
	                return;
                }
                
                this.isFetchingCollections = true;
                this.$api.get('manager/mails/campaings/tags', {query: query}).then((data) => {
	                this.autocompleteTags = _.differenceWith(data.response.tags, this.value, (a, b) => a.tag_id == b.tag_id);
	                this.isFetchingTags = false;
				});
			}, 300),
			
			onArchive() {
				this.$confirm('Вы уверены что хотите отправить эту компанию в архив?', 'is-warning').then(() => {
                    this.$api.post('manager/mails/campaings/archive', {campaing_id: this.campaing_id}, this).then((data) => {
						if (data.result == 'success') {
							this.$parent.close()
						}
					});
				});
			},
			
			autoFormat() {
				this.$nextTick(() => {
					if (this.$refs.code != undefined) {
						this.$refs.code.autoFormat();
					}
				});
			},
			
			prepareHTML(f) {
				return ((f.template_id && (this.variants.template_id != undefined) && (this.variants.template_id[f.template_id] != undefined))?this.variants.template_id[f.template_id].template:'<div>{{body}}</div>').replace('{{body}}', f.body);
			},
      
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get(this.campaing_id?['manager/mails/campaings/get', 'manager/mails/campaings/variants']:'manager/mails/campaings/variants', {campaing_id: this.campaing_id}).then((data) => {

					this.variants = data.response.campaings.variants;

					if (this.campaing_id) {
						let v = data.response.campaings.values;
						this.values = v;
// 						this.compiled = Vue.compile(this.template);
					} else {
						this.values = {campaing_id: null, campaing_title: '', sender_id: null, sends: [], tags: []}
						this.addVariant();
					}
					
					this.isFetching = false;
				});
			},
			
			updateData() {
				this.save(() => { this.$parent.close(); })
			},
			
			save(cb) {
				this.isUpdating = true;
				
				let values = Object.assign({campaing_id: this.campaing_id}, this.values);
				values.tags = _.map(values.tags, 'tag');
				
				this.$api.post('manager/mails/campaings/set', values, this).then((data) => {
					this.isUpdating = false;
					if (data.result == 'success') cb();
				}).catch(() => {
					this.isUpdating = false;
				});
			},
			
			addVariant() {
				let template_id = 1;
				let template = '';
				let sample = '<div></div>';

				if (this.values.sends.length && this.values.sends[0].template_id) {
					template_id = this.values.sends[0].template_id;
					template = this.variants.template_id[template_id].template;
					sample = this.variants.template_id[template_id].sample;
				}
				
				let s = {send_id: null, subject: '', sender_name: '', variants: '', template_id: template_id, template: template, body: sample, text: ''};
				s.html = this.prepareHTML(s);
				
				this.values.sends.push(s);
				this.variant_idx = this.values.sends.length - 1;
			},
			
			deleteVariant(i) {
				this.$confirm(this.$gettext('Вы уверены что хотите удалить этот вариант?'), 'is-danger').then(() => {
					if (i == this.variant_idx) this.variant_idx = 0;
					this.values.sends.splice(i, 1);

					if (this.variant_idx > i) this.variant_idx--;
				});
			},
			
			updateBody() {
				let s = this.values.sends[this.variant_idx]
				let h = this.prepareHTML(s);
				if (s.html != h) s.html = h;
			},
			
			chooseTemplate() {
				let s = this.values.sends[this.variant_idx];
				s.template = this.variants.template_id[s.template_id].template;
				this.updateBody();
			}
		}, template: `
	<form class="modal-card modal-card-large" @submit.prevent="updateData">
		<header class="modal-card-head">
			<p class="modal-card-title">Рассылка</p>
			<button class="modal-close is-large" type="button" @click="$parent.close()"></button>
		</header>
		
		<ul class="nav nav-tabs has-text-left">
			<li :class="{active: activeTab == 'common'}"><a @click="activeTab = 'common'">{{'Общие'|gettext}}</a></li>
			<li :class="{active: activeTab == 'options'}"><a @click="activeTab = 'options'">{{'Дополнительно'|gettext}}</a></li>
		</ul>
		
		<section class="modal-card-body modal-card-body-blocks" v-if="values">
			<section v-if="activeTab == 'common'">
				<div class="row row-small">
					<div class="col-xs-12 col-sm-6">
						<label class="label">Название рассылки</label>
						<b-input type="text" v-model="values.campaing_title"></b-input>
					</div>
					
					<div class="col-xs-12 col-sm-6">
						<label class="label">Отправитель</label>
						<b-select placeholder="-- Не выбран --" v-model="values.sender_id" expanded>
							<option v-for="f in variants.sender_id" :value="f.sender_id" :key="f.sender_id">{{f.fullname}}</option>
						</b-select>
					</div>
				</div>
			</section>
			
			<section v-if="activeTab == 'common'">
				<div class="level has-mb-1">
				<div class="level-left">
					<label class="label">Варианты</label>
				</div>
				<div class="level-right">
					<a @click="addVariant">Добавить</a>
				</div>
				</div>
										
				<div v-for="(v, i) in values.sends">
					<div class="field has-addons" :class="{'has-mb-2': values.sends.length > 1 && i < values.sends.length - 1}">
						<p class="control">
							<a class="button is-static1">
								<input type="radio" v-model="variant_idx" :value="i">
							</a>
						</p>
						<p class="control is-expanded">
							<b-taginput v-model="v.variants" attached></b-taginput>
						</p>
						<p class="control">
							<p class="button" :class="{'is-static': values.sends.length == 1}">
								<a @click="deleteVariant(i)" :class="{'has-text-danger': values.sends.length > 1, 'has-text-grey-light': values.sends.length == 1}"><i class="fa fa-trash-alt"></i></a>
							</p>
						</p>
					</div>
				</div>
			</section>
		
			<section v-if="activeTab == 'common' && send">
				<div class="row row-small">
					<div class="col-xs-12 col-sm-6">
						<label class="label">Заголовок письма</label>
						<b-input type="text" v-model="send.subject"></b-input>
					</div>
					
					<div class="col-xs-12 col-sm-6">
						<label class="label">Имя отправителя</label>
						<b-input type="text" v-model="send.sender_name" :placeholder="defaultSendername"></b-input>
					</div>
					
				</div>
			</section>
			
			<section style="padding-bottom: 0" v-if="(activeTab == 'common') && send">
				<div style="padding: 0;display: flex">
					<ul class="nav nav-tabs nav-tabs-scroll has-text-left" style="background: transparent;padding: 0">
						<li :class="{'active': view == 'view'}"><a @click="view = 'view'">Просмотр</a></li>
						<li :class="{'active': view == 'html'}"><a @click="view = 'html'">HTML</a></li>
						<li :class="{'active': view == 'text'}"><a @click="view = 'text'">Текст</a></li>
					</ul>
					
					<b-dropdown v-if="view == 'view'" v-model="send.template_id" aria-role="list" position="is-top-left" style="font-size:.9rem;align-self:center;flex-shrink:0"><label slot="trigger" aria-role="listitem">Шаблон: {{variants.template_id[send.template_id].template_title}}</label>
						<b-dropdown-item :value="id" v-for="(f, id) in variants.template_id">{{f.template_title}}</b-dropdown-item>
					</b-dropdown>
				</div>
			</section>
			
			
			<section style="padding:0" v-if="(activeTab == 'common') && send">
				<div v-if="!isFetching && view == 'view'" class="email-editor" :data-template="send.template_id">
					<v-runtime-template :template="template"></v-runtime-template>
					<div v-html="styles"></div>
				</div>
				
				<vue-component-codemirror v-if="view == 'html'" v-model="send.body" ref="code" :auto-height="true"></vue-component-codemirror>
			</section>
			
			<section v-if="(view == 'text') && (activeTab == 'common') && send">
				<vue-component-emoji-picker v-model="send.text">
					<textarea class="input autoresize-init" :placeholder="'Текст'|gettext" v-emoji v-model="send.text" style="min-height: 400px"></textarea>
				</vue-component-emoji-picker>
			</section>
						
			<section v-if="activeTab == 'options'">
				<b-field :label="'Метки'|gettext">
				<b-taginput v-model="values.tags" :data="autocompleteTags" :before-adding="onAddingTag" @add="onAddedTag" :allow-new="true" confirm-key-codes='[13]' autocomplete field="tag" @typing="asyncAutocompleteTag" placeholder="Укажите метки" :loading="isFetchingTags" attached>
			        <template slot-scope="props">
						<strong>{{props.option.tag}}</strong>
			        </template>
			        <template slot="empty">
			        	<div v-if="isFetchingTags">{{'Идет загрузка'|gettext}}</div>
			        	<div v-else>{{'Ничего не найдено'|gettext}}</div>
			        </template>
			    </b-taginput>
				</b-field>
			</section>
			
		</section>
		<footer class="modal-card-foot level">
			<div class="level-left">
			<vue-component-action-button @action="onAction" :title="'Действие'|gettext">
			<template slot="actions">
				<b-dropdown-item value="test"><i class="fa fa-paper-plane"></i> {{'Отправить тестовое письмо'|gettext}}</b-dropdown-item>
				<b-dropdown-item value="archive"><i class="fa fa-archive"></i> {{'В архив'|gettext}}</b-dropdown-item>
			</template>
			</vue-component-action-button>
			</div>
			<div class="level-right">
				<button class="button is-primary level-item" type="submit" :class="{'is-loading': isUpdating}">{{'Сохранить'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>		
	</form>
`});

window.$app.defineComponent("manager", "vue-manager-mails-campaings-list", {data() {
			return {
				isFetching: false,
				filter: {query: '', tags: []},
				columns: null,
				filterTags: ['archive'],
			}
		},
		
		props: ['page_id'],

// 		mixins: [ListModel],

		created() {
			this.$io.on('events:manager.mails.campaings.list:refresh', this.refresh);
		},
		
		mounted() {
			this.fetchData(true);
		},
		
		beforeDestroy() {
			this.$io.off('events:manager.mails.campaings.list:refresh', this.refresh);
		},
		
		methods: {
			tagsFetch(name, query, cb) {
				if (['archive'].indexOf(name) >= 0) {
		            cb([]);
	            } else {
/*
	                this.$api.get('manager/logs/filters', {query: query, name: name}).then((data) => {
		                cb((data.result == 'success')?data.response.variants:[]);
					});
*/
				}
			},
			
			newForm(row) {
				this.$modal('vue-manager-mails-campaings-form', {campaing_id: null}, this);
			},	
			
			onFilter() {
				this.clearPages();
				this.fetchData(true);
			},
			
			refresh() {
				this.fetchData(false, true);
			},
			
			fetchData(withLoading, force) {
				if (force || !this.$refs.list.checkCache()) {
					this.isFetching = withLoading;
					this.$api.get(this.columns?'manager/mails/campaings/list':['manager/mails/campaings/list', 'manager/mails/campaings/info'], {next: this.$refs.list.next, count: this.$refs.list.perPage, filter: this.filter}).then((data) => {
						let r = data.response.campaings;
						this.$refs.list.cachePage(r.list);
						if (r.info != undefined && r.info.columns != undefined) this.columns = r.info.columns;
						this.isFetching = false;
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
	<vue-component-submenu menu="manager.mails" :page_id="page_id"></vue-component-submenu>
			
	<vue-component-filterbox ref="filterbox" @filter="onFilter" v-model="filter" :tags-fetch="tagsFetch" :allow-tags="filterTags" :with-buttons="true">
		<template slot="buttons">
			<a @click="newForm" class="button is-primary is-fullwidth"><i class='fas fa-plus'></i><span class='is-hidden-touch has-ml-1'>{{'Новая рассылка'|gettext}} </span></a>
		</template>
	</vue-component-filterbox>
	
	<div class="container">
	<div class="has-mb-2">
		<vue-manager-mails-campaings-table ref='list' :columns="columns" :isFetching.sync="isFetching" @fetch-data="fetchData"></vue-manager-mails-campaings-table>
	</div>
	</div>
</div>
`});

window.$app.defineComponent("manager", "vue-manager-mails-campaings-table", {data() {
			return {
				perPage: 50,
			}
		},
		
		props: ['columns', 'isFetching'],
		
		mixins: [ListModel],
		
		computed: {
			columns_props() {
				if (!this.columns) return [];
				
				let columns = {
// 					lead_number: {label: 'Заявка',classname: 'has-text-nowrap', sortable: true, width:100},
					campaing_title: {label: 'Название', classname: 'has-text-nowrap', sortable: true},
					amount_sent: {label: 'Доставленно', classname: 'has-text-nowrap', sortable: true, classname: 'has-width-15', numeric: true},
					amount_bounced: {label: 'Ошибки', classname: 'has-text-nowrap', sortable: true, classname: 'has-width-15', numeric: true},
					amount_opened: {label: 'Открыли', classname: 'has-text-nowrap', sortable: true, classname: 'has-width-15', numeric: true},
					amount_clicked: {label: 'Кликнули', classname: 'has-text-nowrap', sortable: true, classname: 'has-width-15', numeric: true},
				};
				
				let result = _.map(this.columns, (v) => {
					let r = columns[v];
					r.visible = true;
					r.field = v;
					return r;
				});
				
				for (var i = 0; i < 11 - this.columns.length; i++) result.push({visible: false});
				result[0].classname += ' has-text-nowrap';
				return result;
			}
		},
		
		methods: {
/*
			onPageChange(e) {
				this.$emit('page-change', e);
			},
			
*/
			fetchData(withLoading, force) {
				this.$emit('fetch-data', [withLoading, force]);
			},
			
			clickRow(row) {
				this.$modal('vue-manager-mails-campaings-form', {campaing_id: row.campaing_id}, this);
			},	
			
			sentrate(row) {
				return Math.min((row.amount_sent + row.amount_bounced) ? Math.round((row.amount_sent / (row.amount_sent + row.amount_bounced) * 10000)) / 100 : 0, 100);
			},

			bouncedrate(row) {
				return Math.min((row.amount_sent + row.amount_bounced)? Math.round((row.amount_bounced / (row.amount_sent + row.amount_bounced) * 10000)) / 100 : 0, 100);
			},
			
			openrate(row) {
				return Math.min(row.amount_sent ? Math.round((row.amount_opened / row.amount_sent * 10000)) / 100 : 0, 100);
			},

			clickrate(row) {
				return Math.min(row.amount_opened ? Math.round((row.amount_clicked / row.amount_opened * 10000)) / 100 : 0, 100);
			}
		}, template: `
	<div>
		<b-table paginated backend-pagination pagination-simple :data="fields" :loading="isFetching" :current-page="page" :per-page="perPage" :total="total" @page-change="onPageChange" hoverable bordered @click="clickRow">
		
		<b-table-column v-for="(column, index) in columns_props" :field="column.field" :label="column.label|gettext" :cell-class="['td-progress', column.classname]" :numeric="column.numeric" :key="index" :visible="column.visible" :sortable="column.sortable" :width="column.width" v-slot="props">
			<span v-if="column.field == 'campaing_title'"> 
				{{ props.row.campaing_title }} 
				<div class="tags" class="tags is-pulled-right" v-if="_.size(props.row.tags)"><span class="tag is-light" v-for="c in props.row.tags">{{c}}</span></div>
			</span>
			<span v-if="column.field == 'amount_sent'">
				<div class="td-progress-value has-background-info" :style="{'width': sentrate(props.row)+'%'}"></div>
				<div class="td-progress-body">
					<div class="is-pulled-right">{{props.row.amount_sent|number}}</div>
					<span class="has-text-grey">{{sentrate(props.row)|number(2)}}%</span>
				</div>
			</span>
			<span v-if="column.field == 'amount_bounced'">
				<div class="td-progress-value has-background-danger" :style="{'width': bouncedrate(props.row)+'%'}"></div>
				<div class="td-progress-body">
					<div class="is-pulled-right">{{props.row.amount_bounced|number}}</div>
					<span class="has-text-grey">{{bouncedrate(props.row)|number(2)}}%</span>
				</div>
			</span>
			<span v-if="column.field == 'amount_opened'">
				<div class="td-progress-value has-background-warning" :style="{'width': openrate(props.row)+'%'}"></div>
				<div class="td-progress-body">
					<div class="is-pulled-right">{{props.row.amount_opened|number}}</div>
					<span class="has-text-grey">{{openrate(props.row)|number(2)}}%</span>
				</div>
			</span>
			<span v-if="column.field == 'amount_clicked'"> 
				<div class="td-progress-value has-background-success" :style="{'width': clickrate(props.row)+'%'}"></div>
				<div class="td-progress-body">
					<div class="is-pulled-right">{{props.row.amount_clicked|number}}</div>
					<span class="has-text-grey">{{clickrate(props.row)|number(2)}}%</span>
				</div>
			</span>
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
`});

window.$app.defineComponent("manager", "vue-manager-mails-messages-list", {data() {
			return {
				isFetching: false,
				filter: {query: '', tags: []},
				statistics: null,
				perPage: 100,
				filterTags: ['campaing'],
			}
		},
		
		props: ['page_id'],

		mixins: [ListModel],

		created() {
			this.fetchData(true);
			this.fetchStatistics();
		},

		methods: {
			onFilter() {
				this.clearPages();
				this.fetchData(true);
			},
/*
			
			refresh() {
				this.fetchData(false, true);
			},
*/
			
			fetchStatistics() {
				this.statistics = null;
                this.$api.get('manager/mails/messages/statistics').then((data) => {
	                if (data.result == 'success') {
		                this.statistics = data.response.statistics;
	                }
                });
			},
			
			fetchData(withLoading, force) {
				if (force || !this.checkCache()) {
					this.isFetching = withLoading;
					this.$api.get('manager/mails/messages/list', {next: this.next, count: this.perPage, filter: this.filter}).then((data) => {
						this.cachePage(data.response.messages);
						this.isFetching = false;
					}).catch((error) => {
	                    this.fields = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
                }

			},
			
			tagsFetch(name, query, cb) {
				if (['campaing'].indexOf(name) >= 0) {
		            cb([]);
	            } else {
	                this.$api.get('manager/mails/messages/filters', {query: query, name: name}).then((data) => {
		                cb((data.result == 'success')?data.response.variants:[]);
					});
				}
			}
		}, template: `
<div>
	<vue-component-submenu menu="manager.mails" :page_id="page_id"></vue-component-submenu>

	<div class="container has-mb-2 has-mt-2">
	<div v-for="stat in statistics">
		<div style="display: flex;flex-direction: row">
			<div class="has-background-grey-light profiles-conversion-bar" style="flex-grow: 1">
				<div :data-stage="s.stage" v-tippy :style="{width: s.percent}" :content="s.message_status" v-for="s in stat"><span>{{s.title}}</span></div>
			</div>
		</div>
	</div>
	</div>

	<vue-component-filterbox @filter="onFilter" :tags-fetch="tagsFetch" :allow-tags="filterTags" v-model="filter" :disabled="isFetching"></vue-component-filterbox>
			
	<div class="container">
	<div class="has-mb-2">
					
	<b-table paginated backend-pagination pagination-simple :data="fields" :loading="isFetching" :per-page="perPage" :total="total" @page-change="onPageChange" hoverable bordered>
		
		<b-table-column field="post_id" label="ID" class="has-width-5 has-text-grey" v-slot="props">{{ props.row.message_id }}</b-table-column>
		<b-table-column field="service_name" label="Адрес" v-slot="props">{{ props.row.address }}</b-table-column>
		<b-table-column :label="'Дата'|gettext" v-slot="props">{{ props.row.tms_created|datetime }}</b-table-column>
		<b-table-column :label="'Заголовок'|gettext" v-slot="props">{{ props.row.subject }}</b-table-column>
		<b-table-column :label="'Статус'|gettext" v-slot="props">
			<div :class="'has-text-'+props.row.message_status_classname">
			<span v-if="props.row.message_status_id == 4" class="has-text-danger is-pulled-right" v-tippy :content="props.row.reason"><i class="fal fa-exclamation-triangle"></i></span>
			{{ props.row.message_status|gettext }}
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

	</b-table>
				
	</div>
	</div>
</div>
`});

window.$app.defineComponent("manager", "vue-manager-mails-sequences-list", {data() {
			return {
				isFetching: false,
				sequence: null,
				perPage: 100,
				filter: {query: '', tags: []},
				columns: null,
				columnsItems: null,
				filterTags: ['archive'],
			}
		},
		
		props: ['page_id'],

		mixins: [ListModel],

		created() {
			this.$io.on('events:manager.mails.sequences.list:refresh', this.refresh);

			this.fetchData(true);
		},
		
		beforeDestroy() {
			this.$io.off('events:manager.mails.sequences.list:refresh', this.refresh);
		},
		
		computed: {
			columns_props() {
				if (!this.columns) return [];
				
				let columns = {
// 					lead_number: {label: 'Заявка',classname: 'has-text-nowrap', sortable: true, width:100},
					sequence_title: {label: 'Название', classname: 'has-text-nowrap', sortable: true},
				};
				
				let result = _.map(this.columns, (v) => {
					let r = columns[v];
					r.visible = true;
					r.field = v;
					return r;
				});
				
				for (var i = 0; i < 11 - this.columns.length; i++) result.push({visible: false});
				result[0].classname += ' has-text-nowrap';
				return result;
			}
		},

		methods: {
			tagsFetch(name, query, cb) {
				cb([]);
			},
			
			onFilter() {
				this.clearPages();
				this.fetchData(true);
			},
			
			refresh() {
				this.fetchData(false, true);
			},
			
			clickRow(row) {
				this.sequence = row;
				this.$refs.list.clearPages();
				this.$refs.list.fields = [];
				this.fetchDataItems(true, true);
			},	
			
			fetchData(withLoading, force) {
				if (force || !this.checkCache()) {
					this.isFetching = withLoading;
					this.$api.get(this.columns?'manager/mails/sequences/list':['manager/mails/sequences/list', 'manager/mails/sequences/info'], {next: this.next, count: this.perPage, filter: this.filter}).then((data) => {
						let r = data.response.sequences;
						this.cachePage(r.list);
						if (r.info != undefined && r.info.columns != undefined) this.columns = r.info.columns;
						this.isFetching = false;
					}).catch((error) => {
	                    this.fields = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
                }

			},
			
			fetchDataItems(withLoading, force) {
				if (force || !this.$refs.list.checkCache()) {
					this.isFetching = withLoading;
					this.$api.get(this.columnsItems?'manager/mails/campaings/list':['manager/mails/campaings/list', 'manager/mails/campaings/info'], {next: this.$refs.list.next, count: this.$refs.list.perPage, sequence_id:this.sequence.sequence_id }).then((data) => {
						let r = data.response.campaings;
						this.$refs.list.cachePage(r.list);
						if (r.info != undefined && r.info.columns != undefined) this.columnsItems = r.info.columns;
						this.isFetching = false;
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
	<vue-component-submenu menu="manager.mails" :page_id="page_id"></vue-component-submenu>
			
	<vue-component-filterbox ref="filterbox" @filter="onFilter" v-model="filter" :tags-fetch="tagsFetch" :allow-tags="filterTags" :with-buttons="true" v-if="!sequence">
		<template slot="buttons">
<!-- 			<a @click="clickRow({sequence_id: null})" class="button is-primary is-fullwidth"><i class='fas fa-plus'></i><span class='is-hidden-touch has-ml-1'>{{'Новая цепочка'|gettext}} </span></a> -->
		</template>
	</vue-component-filterbox>
	
	<div class="container">
	<div class="has-mb-2">

	<div v-if="sequence" class="panel panel-default has-mt-3 has-mb-3">
		<div class="has-p-2 level">
			<div class="level-left">{{sequence.sequence_title}}</div>
			<div class="level-right"><button class="button is-light" @click="sequence = null">К списку</button></div>
		</div>
	</div>
	<b-table paginated backend-pagination pagination-simple :data="fields" :loading="isFetching" :per-page="perPage" :total="total" @page-change="onPageChange" hoverable bordered @click="clickRow" v-else>
		
		<b-table-column v-for="(column, index) in columns_props" :field="column.field" :label="column.label|gettext" :numeric="column.numeric" :key="index" :visible="column.visible" :sortable="column.sortable" :width="column.width" v-slot="props">
			<span v-if="column.field == 'sequence_title'"> 
				{{ props.row.sequence_title }} 
			</span>
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
	
	<vue-manager-mails-campaings-table ref='list' :columns="columnsItems" :isFetching.sync="isFetching" @fetch-data="fetchDataItems" v-show="sequence"></vue-manager-mails-campaings-table>
				
	</div>
	</div>
</div>
`});

window.$app.defineComponent("manager", "vue-manager-metrics-add-chart-form", {data() {
			return {
				isFetching: true,
				charts: [],
				defaultCharts: [],
				checkedRows: [],
				query: ''
			}
		},
		
		created() {
			this.$api.get('manager/metrics/dashboard/chartsearch', {query: ''}).then((data) => {
				this.charts = this.defaultCharts = data.response.charts.search;
                this.isFetching = false;
			});
		},
		
		watch: {
			query: _.debounce(function() {
                if (this.query.trim() == '') {
	                this.charts = this.defaultCharts;
	                return;
                }
                
                this.isFetching = true;
                this.$api.get('manager/metrics/dashboard/chartsearch', {query: this.query}).then((data) => {
	                this.charts = data.response.charts.search;
	                this.isFetching = false;
				});
			}, 500)
		},
		
		methods: {
			save() {
				this.$parent.$parent.addChartCallback(this.checkedRows);
				this.$parent.close();
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">Добавить чарт</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
		<section>
			<div>
				<b-input type="search" v-model="query" icon="search" /> 
			</div>
		</section>
		<section>
			<b-table :data="charts" :loading="isFetching" hoverable>
		
			<b-table-column :label="'Название'|gettext" v-slot="props">
				<b-checkbox @click.native.stop :native-value="props.row.chart_id" v-model="checkedRows">
				<span v-if="props.row.title">{{props.row.title}}</span><span v-else>{{'Без названия'|gettext}}</span>
				</b-checkbox>
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
			
		</section>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark level-item" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" @click="save">{{'Сохранить'|gettext}}</button>
		</footer>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-metrics-chart-form-options", {data() {
			return {
				value_funcs: {
					last: 'Последнее значение',
					sum: 'Сумма за период'
				}
			}
		},
		
		props: ['value', 'errors'], template: `
	<div class="panel panel-default has-p-2">
		<b-field :label="'Заголовок'|gettext" :message="errors.title" :class="{'has-error': errors.title}">
        	<b-input v-model="value.title" maxlength="255" :has-counter="false" ref="title" class="has-rtl"></b-input>
		</b-field>

		<b-field :label="'Значение'|gettext">
			<b-select v-model="value.value_func" expanded>
				<option v-for="(v, k) in value_funcs" :value="k">{{v}}</option>
			</b-select>
		</b-field>


		<vue-component-colorpicker v-model="value.color.text" :label="'Цвет текста'|gettext" class="field"></vue-component-colorpicker>
		<vue-component-colorpicker v-model="value.color.background" :label="'Цвет фона'|gettext" class="field"></vue-component-colorpicker>
		<vue-component-colorpicker v-model="value.color.chart" :label="'Цвет графика'|gettext" class="field"></vue-component-colorpicker>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-metrics-chart-form", {data() {
			return {
				currentTab: 'chart',
				isFetching: true,
				isChartFetching: false,
				isUpdating: false,
				isEmpty: true,
				values: {users: [], options: {color: {text: '#000000', background: '#ffffff', chart: '#3b5bdb'}, group: "day", period: "month", title: "", type: "bar"}},
				data: {chart: {"function": "sum", field: null, field_type: null, unit: "", filters: [], value_func: 'count'}},
				dataset_id: null,
				functions: {sum: 'Сумма', count: 'Количество'},
				ops: {'=': 'Равно', '<>': 'Не равно', '>': 'Больше', '<': 'Меньше'},
				datasets: [],
				uuid: null,
				
				periods: {
					week: 'Неделя',
					month: 'Месяц',
					quarter: 'Квартал',
					year: 'Год',
					all: 'Всё'
				},
				
				groups: {
					day: 'По дням',
					week: 'По неделям',
					month: 'По месяцам',
				},
				
				types : {
					line: {title: 'Линейная диаграмма', type: 'line'},
					area: {title: 'Диаграмма с областями', type: 'line'},
					bar: {title: 'Столбчатая диаграмма', type: 'line'},
					pie: {title: 'Круговая диаграмма', type: 'group'},
					donut: {title: 'Пончик', type: 'group'},
					radialBar: {title: 'Круговые столбики', type: 'group'},
					number: {title: 'Число', type: 'line'}
				},
				
				seriesData: [],
	      		
	      		labels: [],
	      		lastWithDateGroup: null
			}
		},
		
		props: ['chart_id', 'dashboard_id', 'id'],
		mixins: [FormModel],
		
		watch: {
			data: {
				handler: _.debounce(function() {
					this.refresh();
				}, 1500),
				deep: true
			},
			
			values: {
				handler(n, o) {
					this.updateTitle();
				},
				deep: true
			},
			
			isUpdating(v) {
				this.$form.top.buttons.save.classname = 'is-primary'+(v?' is-loading':'');
			},
		},
		
		computed: {
			withDateGroup() {
				let r = (['line', 'area', 'bar'].indexOf(this.values.options.type) != -1);
				if (this.lastWithDateGroup != null && this.lastWithDateGroup != r) this.refresh();
				return this.lastWithDateGroup = r;
			},

			noChoosen() {
				return '-- '+this.$gettext('Не выбрано')+' --';
			}
		},
		
		created() {
			this.$form.top.buttons = {save: {title: this.$gettext('Сохранить'), classname: 'is-primary', click: this.updateData}};
			this.isChartFetching = this.chart_id?true:false;
			
			this.$api.get((this.chart_id || this.id)?[this.dashboard_id?'manager/metrics/dashboard/chart_get':'manager/metrics/charts/get', 'manager/metrics/charts/info']:'manager/metrics/charts/info', {dashboard_id: this.dashboard_id, id: this.id, chart_id: this.chart_id}).then((r) => {
				if (r.result == 'success') {
					r = r.response;
					this.uuid = r.uuid;
					if (this.chart_id || this.id) {
						this.values = {users: r.users, options: r.options};
						this.data = r.data;
						this.dataset_id = r.dataset_id;
					}
					
					this.chart_id = r.chart_id;
					this.updateTitle();
					this.datasets = r.datasets;
					
					
// 					this.chartOptions.colors = [this.values.options.color.chart];
// 					this.chartOptions.chart.type = this.data.chart.type;
					
// 					this.refresh();
				}
				this.isFetching = false;
			});
			
			this.$io.on('events:metrics:refresh', this.refreshed);
		},
		
		destroyed() {
			this.$io.off('events:metrics:refresh', this.refreshed);
		},
		
		methods: {
			updateTitle() {
				this.$form.top.title = this.$gettext('Чарт') + (this.values.options.title?(': '+this.values.options.title):'');
			},

			addFilter() {
				this.data.chart.filters.push({filed: null, op: '=', value: ''});
			},
			
			refreshed(v) {
				if (v.uuid == this.uuid) {
					this.seriesData = [];
					this.labels = [];
					
					_.each(v.series, w => {
						this.seriesData.push(_.map(w, q => parseFloat(q.y)));
					});
					
					this.isEmpty = !this.seriesData.length || !this.seriesData[0].length;

					this.labels = _.map(v.series[0], v => v.x);
						
					this.isChartFetching = false;
					this.recreate();
				}
			},
			
			changePeriod(k) {
				this.values.options.period = k;
				
				if (this.withDateGroup) {
					switch (k) {
						case 'year':
							if (this.values.options.group == 'day') this.values.options.group = 'week';
							break;
						case 'all':
							this.values.options.group = 'month';
							break;
					}
				}
				
				this.refresh();
			},
			
			changeGroup(k) {
				this.values.options.group = k;
				this.refresh();
			},
			
			refresh() {
				this.isChartFetching = true;
				this.$api.post(this.dashboard_id?'manager/metrics/dashboard/chart_refresh':'manager/metrics/charts/refresh', {uuid: this.uuid, chart_id: this.chart_id, dataset_id: this.dataset_id, options: this.values.options, data: this.data});
			},
			
			setTab(v) {
				this.currentTab = v;
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post(this.dashboard_id?'manager/metrics/dashboard/chart_set':'manager/metrics/charts/set', {dashboard_id: this.dashboard_id, id: this.id, chart_id: this.chart_id, dataset_id: this.dataset_id, users: this.values.users, options: this.values.options, data: this.data}).then((r) => {
					if (r.result == 'success') {
						this.$form.close()
					}
					this.isUpdating = false;
				});
			},
			
			recreate(cb) {
				this.isChartFetching = true;
				this.$nextTick(() => {
					this.isChartFetching = false;
				})
			},
			
			deleteFilterRow(index) {
				this.$confirm(this.$gettext('Удалить этот фильтр?'), 'is-danger').then(() => {
					this.data.chart.filters.splice(index, 1)
				});
			}			
		}, template: `
	<div class="has-mb-3">
		<div class="top-panel" v-if="!dashboard_id">
			<div class="container">
			<div class="scrolling-container is-submenu">
				<div style="overflow-x: scroll">
					<a class="button" :class="{active: 'chart' == currentTab}" @click="setTab('chart')">{{'График'|gettext}}</a>
					<a class="button" :class="{active: 'options' == currentTab}" @click="setTab('options')">{{'Настройки'|gettext}}</a>
				</div>
			</div>
			</div>
		</div>		
		<div class="container has-mt-3">
		<section>
			<div class="panel panel-default has-mb-3 metrics-panel-chart" :class="{'is-empty': !isChartFetching && isEmpty && (values.options.type != 'number')}" :style="{background: values.options.color.background}" style="height:300px">
				<div class="metrics-edit-chart-header" :data-type="values.options.type">
					<div>
						<div>
							<b-dropdown position="is-bottom-right" class="is-period-menu is-context-menu">
								<a slot="trigger" :style="{color: values.options.color.text}">{{types[values.options.type].title}}<i class="fal fa-angle-down has-ml-1"></i></a>
								<b-dropdown-item v-for="(v, k) in types" aria-role="listitem" @click="values.options.type = k"><i class="fa fa-check has-mr-1" :class="{'is-invisible': k != values.options.type}"></i>{{v.title}}</b-dropdown-item>
							</b-dropdown>
						</div>
		
						<div>
							<b-dropdown position="is-bottom-left" class="is-period-menu is-context-menu">
								<a slot="trigger" :style="{color: values.options.color.text}">{{periods[values.options.period]}}<i class="fal fa-angle-down has-ml-1"></i></a>
								<b-dropdown-item v-for="(v, k) in periods" aria-role="listitem" @click="changePeriod(k)"><i class="fa fa-check has-mr-1" :class="{'is-invisible': k != values.options.period}"></i>{{v}}</b-dropdown-item>
	<!-- 							v-if="!withDateGroup || (withDateGroup && k != 'all')" -->
							</b-dropdown>
	
							<b-dropdown position="is-bottom-left" class="is-period-menu is-context-menu has-ml-3" v-if="withDateGroup">
								<a slot="trigger" :style="{color: values.options.color.text}">{{groups[values.options.group]}}<i class="fal fa-angle-down has-ml-1"></i></a>
								<b-dropdown-item v-for="(v, k) in groups" aria-role="listitem" @click="changeGroup(k)" v-if="(['week', 'month', 'quarter'].indexOf(values.options.period) != -1) || (values.options.period == 'year' && k != 'day') || (values.options.period == 'all' && k == 'month')"><i class="fa fa-check has-mr-1" :class="{'is-invisible': k != values.options.group}"></i>{{v}}</b-dropdown-item>
							</b-dropdown>
						</div>
					</div>
					<vue-manager-metrics-value class="is-size-3" v-if="!isChartFetching && (withDateGroup || values.options.type == 'number')" :chart="data.chart" :options="values.options" :series="seriesData" />
				</div>

				
				<b-loading :is-full-page="false" :active.sync="isChartFetching"></b-loading>
				<vue-manager-metrics-chart v-if="!isChartFetching && (values.options.type != 'number')" :series="seriesData" :labels="labels" :chart="data.chart" :options="values.options" />
			</div>
			
			<section v-show="currentTab == 'chart'">
				<div class="panel panel-default has-mb-3" v-if="!dashboard_id">
				<div class="row row-noborder metrics-charts-panels">
					<div class="col-sm-3 has-p-2">
						<b-field label="Датасет">
						<b-select v-model="dataset_id" expanded @input="data.chart.filters = []" :placeholder="noChoosen">
							<option :value="null">{{noChoosen}}</option>
							<option v-for="(v, k) in datasets" :value="k">{{v.title}}</option>
						</b-select>
						</b-field>
					</div>
					<div class="col-sm-3 has-p-2">
						<b-field label="Поле">
						<b-select v-model="data.chart.field" expanded v-if="dataset_id && datasets[dataset_id] != undefined" :placeholder="noChoosen">
							<option :value="null">{{noChoosen}}</option>
							<option v-for="(v, k) in datasets[dataset_id].fields" :value="v.field">{{v.title?v.title:v.field}}</option>
						</b-select>
						</b-field>
					</div>
					<div class="col-sm-3 has-p-2">
						<b-field label="Функция">
						<b-select v-model="data.chart.function" expanded v-if="dataset_id && datasets[dataset_id] != undefined" >
							<option v-for="(v, k) in functions" :value="k">{{v}}</option>
						</b-select>
						</b-field>
					</div>
					<div class="col-sm-3 has-p-2">
						<b-field label="Группировка">
						<b-select v-model="data.chart.group" expanded v-if="dataset_id && datasets[dataset_id] != undefined" :placeholder="noChoosen" :disabled="values.options.type == 'number'">
							<option :value="null">{{noChoosen}}</option>
							<option v-for="(v, k) in datasets[dataset_id].fields" :value="v.field">{{v.title?v.title:v.field}}</option>
						</b-select>
						</b-field>
					</div>
				</div>
				</div>
				
				<div class="panel panel-default has-p-2" v-if="!dashboard_id && dataset_id && datasets[dataset_id] != undefined">
					<label class="label">Фильтр</label>
					
					<div>
						<div class="has-mb-2 row row-small" v-for="(f, index) in data.chart.filters">
							<div class="col-sm-3">
								<b-select v-model="f.field" expanded :placeholder="noChoosen">
									<option :value="null">{{noChoosen}}</option>
									<option v-for="(v, k) in datasets[dataset_id].fields" :value="v.field">{{v.title?v.title:v.field}}</option>
								</b-select>
							</div>
							
							<div class="col-sm-2">
								<b-select v-model="f.op" expanded>
									<option v-for="(v, k) in ops" :value="k">{{v}}</option>
								</b-select>
							</div>
							
							<div class="col-sm">
								<input input="text" class="input" v-model="f.value">
							</div>
							
							<div class="col-sm col-shrink">
								<button class="button has-text-danger" @click="deleteFilterRow(index)"><i class="fa fa-trash-alt"></i></button>
							</div>
						</div>
					</div>
					
					<button class="button is-light" @click="addFilter"><i class="fa fa-plus"></i>{{'Добавить'|gettext}}</button>
				</div>	
				
				<vue-manager-metrics-chart-form-options v-model="values.options" :errors="errors" v-if="dashboard_id"/>
			</section>
			
			<section v-if="currentTab == 'options'">
				<div class="row">
					<div class="col-sm-6">
						<vue-manager-metrics-chart-form-options v-model="values.options" :errors="errors" />
						
						<div class="panel panel-default has-p-2 has-mt-2">
							<b-field label='Единицы измерения'>
								<input input="text" class="input" v-model="data.chart.unit">
							</b-field>
						</div>
					</div>
					<div class="col-sm-6">
						<div class="panel panel-default has-p-2">
							<b-field :label="'Совместный доступ'|gettext">
								<vue-manager-metrics-share-user v-model="values.users" />
							</b-field>
						</div>
					</div>
				</div>
			</section>
		</div>
		
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-metrics-chart", {data() {
			return {
				isCreating: false
			}
		},
		
		props: ['options', 'series', 'labels', 'chart'],
		
		created() {
			if (window.VueApexCharts == undefined) {
				$mx.lazy('//cdn.jsdelivr.net/combine/npm/apexcharts@3.25.0,npm/vue-apexcharts@1.6.0', () => {
					Vue.use(VueApexCharts)
					Vue.component('apexchart', VueApexCharts);
				});
			}
		},
		
		watch: {
			options: {
				handler() {
					this.recreate();
				}, deep: true
			}
		},
		
		computed: {
			withDateGroup() {
				return (['line', 'area', 'bar'].indexOf(this.options.type) != -1);
			},
			
			chartOptions() {
				let colors = [this.options.color.chart];
				
				return {
		      		chart: {
		      			type: this.options.type,
		      			stacked: (['bar', 'area'].indexOf(this.options.type) != -1),
// 		      			fontFamily: 'inherit',
// 		      			height: 192,
		      			sparkline: { enabled: true },
		      			animations: { enabled: false },
		      		},
		      		dataLabels: { enabled: false },
		      		fill: {
		      			opacity: (this.options.type == 'area')?.16:1,
		      			type: 'solid'
		      		},
		      		stroke: {
		      			width: (this.options.type == 'bar')?0:2,//2,
		      			lineCap: "round",
		      			curve: "smooth",
		      		},
		      		grid: {
			      		padding: this.withDateGroup?{ top: 80 }:{ top: 40, right: 25, bottom: 25, left: 25 },
		      			strokeDashArray: 4,
		      		},
		      		xaxis: this.withDateGroup?{
		      			labels: {
		      				padding: 0,
		      			},
		      			tooltip: {
		      				enabled: false
		      			},
		      			axisBorder: {
		      				show: false,
		      			},
		      			type: 'datetime',
		      		}:null,
		      		yaxis: { labels: { padding: 4 }, },
		      		labels: this.labels,
					colors: _.map(["#008FFB","#00E396","#FEB019","#FF4560","#775DD0"], (v, k) => { return (colors[k] == undefined)?v:colors[k]; }),
		      		legend: { show: false },
		      		point: { show: false },
		      	};
		      },
		      
		      chartSeries() {
				switch (this.options.type) {
					case 'pie':
					case 'donut':
						return this.series[0];
						break;
					case 'radialBar':
						let amount = _.sum(this.series[0]);
						return _.map(this.series[0], (v) => Math.round(v / amount * 10000, 10) / 100);
						break;
					default:
						return _.map(this.series, s => { return {name: '', data: s} });
						break;
				}
			}
		},
		
		methods: {
			recreate(cb) {
				this.isCreating = true;
				this.$nextTick(() => {
					this.isCreating = false;
				})
			},
		}, template: `
	<apexchart v-if="series.length && !isCreating" height="100%" width="100%" :options="chartOptions" :series="chartSeries"></apexchart>
`});

window.$app.defineComponent("manager", "vue-manager-metrics-charts", {data() {
			return {
				isFetching: false,
				charts: [],
				columns: ['title'],
				filter: {query: ''}
			}
		},
		
		props: ['page_id'],
		
		mixins: [ListModel],
		
		computed: {
			columns_props() {
				if (!this.columns) return [];
				
				let columns = {
					title: {label: 'Название', classname: 'has-text-nowrap', sortable: false}
				};
				
				let result = _.map(this.columns, (v) => {
					let r = columns[v];
					r.visible = true;
					r.field = v;
					return r;
				});
				
// 				for (var i = 0; i < 11 - this.columns.length; i++) result.push({visible: false});
				result[0].classname += ' has-text-nowrap';
				return result;
			}
		},
		
		created() {
			this.$io.on('events:metrics.charts.list:refresh', this.refresh);

			this.fetchData();
		},
		
		destroyed() {
			this.$io.off('events:metrics.charts.list:refresh', this.refresh);
		},
		
		methods: {
			fetchData(withLoading, force) {
				let resolve = (data) => {
					this.charts = data.fields
				}

				if (force || !this.checkCache(resolve)) {
					this.isFetching = withLoading;
					
					this.$api.get('manager/metrics/charts/list', {filter: this.filter}).then((r) => {
						if (r.result == 'success') {
							this.cachePage(r.response, resolve);
	
							this.isFetching = false;
						}
					});
				}
			},
			
			onFilter() {
                this.clearPages();
	            this.fetchData(true);
            },
						
			clickRow(row) {
				this.$form.open('vue-manager-metrics-chart-form', {chart_id: row.chart_id});
			}
		}, template: `
	<div>
		<vue-component-submenu menu="manager.metrics" :page_id="page_id"></vue-component-submenu>
		
		<div class="has-mt-3 has-mb-3">
		<vue-component-filterbox v-model="filter" :with-filters="true" :with-buttons="true" @filter="onFilter">
			<template slot="buttons">
				<a @click="clickRow({chart_id: null})" class="button is-primary is-fullwidth"><i class='fas fa-plus'></i><span class='is-hidden-touch has-ml-1'>{{'Новый чарт'|gettext}} </span></a>
			</template>
		</vue-component-filterbox>

		<div class="container">
		<b-table paginated backend-pagination pagination-simple :data="charts" :loading="isFetching" :current-page="page" :per-page="perPage" :total="total" @page-change="onPageChange" hoverable bordered @click="clickRow">
		
		<b-table-column v-for="(column, index) in columns_props" :field="column.field" :label="column.label|gettext" :cell-class="['td-progress', column.classname]" :numeric="column.numeric" :key="index" :visible="column.visible" :sortable="column.sortable" :width="column.width" v-slot="props">
			<span v-if="column.field == 'title'"> 
				<span v-if="props.row.title">{{props.row.title}}</span><span v-else>{{'Без названия'|gettext}}</span>
			</span>
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
		
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-metrics-dashboard-form", {data() {
			return {
				isFetching: false,
				isUpdating: false,
				currentTab: 'common',
				values: {title: '', users: []}
			}
		},
		
		props: ['dashboard_id'],
			
		created() {
			if (this.dashboard_id) this.fetchData();
		},
		
		methods: {
			fetchData() {
				this.isFetching = true;
				this.$api.get('manager/metrics/dashboard/get', {dashboard_id: this.dashboard_id}).then((r) => {
					if (r.result == 'success') {
						r = r.response;
						this.values = r.values;
						this.isFetching = false;
					}
				});
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('manager/metrics/dashboard/set', this.values, this).then((r) => {
					this.isUpdating = false;
					if (r.result == 'success') {
						if (!this.dashboard_id) this.$parent.$parent.changeDashboard(r.response.dashboard_id);
						this.$parent.close();
					}
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">Дашборд</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>

		<ul class="nav nav-tabs has-text-left">
			<li :class="{active: currentTab == 'common'}"><a @click="currentTab = 'common'">{{'Общие'|gettext}}</a></li>
			<li :class="{active: currentTab == 'share'}"><a @click="currentTab = 'share'">{{'Совместный доступ'|gettext}}</a></li>
		</ul>

		<section class="modal-card-body" v-if="currentTab == 'common'">
			<b-field :label="'Название'|gettext">
				<input type="text" class="input" v-model="values.title" v-focus>
			</b-field>
		</section>

		<section class="modal-card-body" v-if="currentTab == 'share'">
			<vue-manager-metrics-share-user v-model="values.users" />
		</section>

		<footer class="modal-card-foot">
			<button class="button is-dark level-item" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>		
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-metrics-dashboard", {data() {
			return {
				isFetching: true,
				layout: [],
				index: 0,
				dashboard_id: null,
				interval: 0,
				refreshInterval: 1.5 * 60 * 1000,
				refreshPass: 0,
				windowFocused: true,
				dashboards: {null: {title: 'Без имени', is_primary: 1}},
				isLocked: false
			}
		},
		
		props: ['page_id'],
		
		created() {
			$mx.lazy('//cdn.jsdelivr.net/npm/vue-grid-layout@2.3.12/dist/vue-grid-layout.umd.min.js', () => {
				this.$api.get('manager/metrics/dashboard/list', {with_dashboard: true}).then((r) => {
					if (r.result == 'success') {
						r = r.response;
						if (r.dashboards != undefined) {
							this.dashboards = r.dashboards;
							this.dashboard_id = r.dashboard_id;
						}
						this.layout = r.layout;
						this.index = r.layout.length;
						this.isFetching = false;
					}
					
					this.refresh();
					this.interval = setInterval(this.refresh, this.refreshInterval);
				});
			});
			
			$mx(window).on('focus', this.windowFocus);
			$mx(window).on('blur', this.windowBlur);

			this.$io.on('events:metrics:refresh', this.refreshed);
			this.$io.on('events:metrics.charts:options', this.optionsChanged);
			this.$io.on('events:metrics.dashboards:refresh', this.dashboardsRefresh);
		},
		
		destroyed() {
			this.$io.off('events:metrics:refresh', this.refreshed);
			this.$io.off('events:metrics.charts:options', this.optionsChanged);
			this.$io.off('events:metrics.dashboards:refresh', this.dashboardsRefresh);

			$mx(window).off('focus', this.windowFocus);
			$mx(window).off('blur', this.windowBlur);

			if (this.interval) clearInterval(this.interval);
		},
		
		computed: {
			allowEditLayout() {
				return !this.isLocked && this.allowEdit;
			},
			
			allowEdit() {
				return this.dashboard.is_primary && this.$auth.isAllowEndpoint('manager/metrics/dashboard/get');
			},
			
			dashboard() {
				for(i = 0; i < this.dashboards.length; i++) if (this.dashboards[i].dashboard_id == this.dashboard_id) return this.dashboards[i];
				return {title: ''};
			}
		},
		
		methods: {
			dashboardsRefresh(v) {
				this.$api.get('manager/metrics/dashboard/list').then((r) => {
					if (r.result == 'success') {
						this.dashboards = r.response.dashboards;
					}
				});				
			},
			
			addChart() {
				this.$modal('vue-manager-metrics-add-chart-form', {}, this);
			},
			
			addChartCallback(chart_ids) {	
				this.$api.get('manager/metrics/dashboard/charts_add', {dashboard_id: this.dashboard_id, chart_ids: chart_ids}).then((r) => {
					if (r.result == 'success') {
						let ids = [];
						
						_.each(r.response.charts, v => {
							this.layout.push({
								id: v.id, 
								chart_id: v.chart_id,
								x: 0,//(this.layout.length * 2) % 24,
				                y: 0,//this.layout.length + 24,
								w: 4, 
								h: 3, 
								i: this.index++,
								series: null,
								options: v.options,
								chart: v.chart
							});
							
							ids.push(v.id);
						});
						
						this.$api.get('manager/metrics/dashboard/refresh', {dashboard_id: this.dashboard_id, ids: ids});
					}
				});
			},
			
			changeDashboard(k) {
				if (this.dashboard_id == k) return;
				
				this.dashboard_id = k;
				this.isFetching = true;
				
				this.$api.get('manager/metrics/dashboard/layout', {dashboard_id: this.dashboard_id}).then((r) => {
					if (r.result == 'success') {
						r = r.response;
						this.layout = r.layout;
						this.index = r.layout.length;
						this.isFetching = false;
					}
					this.refresh();
				});
			},
			
			optionsChanged(v) {
				for (i = 0; i < this.layout.length; i++) {
					if ((this.layout[i].id == v.id) || (this.layout[i].chart_id == v.chart_id)) {
						if (v.options != undefined) this.layout[i].options = v.options;
						if (v.chart != undefined) this.layout[i].chart = v.chart;
					}
				}
			},
			
			windowFocus() {
				this.windowFocused = true;
				if (this.refreshPass) this.refresh();
			},

			windowBlur() {
				this.windowFocused = false;
			},
			
			refresh() {
				if (!this.windowFocused || this.$form.isOpened) return this.refreshPass++;
				this.refreshPass = 0;
				if (this.dashboard_id && _.size(this.layout)) this.$api.get('manager/metrics/dashboard/refresh', {dashboard_id: this.dashboard_id});
			},
			
			refreshed(d) {
				if (d.uuid) return;
				
				for (i = 0; i < this.layout.length; i++) {
					if (this.layout[i].id == d.id) {
						this.layout[i].series = d.series;
						break;
					}
				}
			},
			
			changed(layout) {
 				if (this.dashboard_id && this.allowEditLayout) this.$api.post('manager/metrics/dashboard/resort', {dashboard_id: this.dashboard_id, layout: _.map(layout, function(n) { return {x: n.x, y: n.y, w: n.w, h: n.h, id: n.id} })});
	        },
	        
	        deleteChart(i) {
		        this.$confirm(this.$gettext('Удалить выбранный чарт?'), 'is-danger').then(() => {
			        this.layout.splice(i, 1)
		        });
	        },
	        
	        newDashboardForm() {
		        this.$modal('vue-manager-metrics-dashboard-form', {}, this);
	        }
		}, template: `
<div>
	<vue-component-submenu menu="manager.metrics" :page_id="page_id"></vue-component-submenu>

	<div class="has-mt-2 has-mb-2">
	<div class="container has-pt-1 has-pb-1">
		<div class="row has-mb-2">
		<div class="col-sm display: flex;align-items: center">
			<b-dropdown position="is-bottom-right" append-to-body>
				<h3 slot="trigger" style="cursor: pointer">{{dashboard.title}}<i class="fal fa-angle-down has-ml-2"></i></h3>
				<b-dropdown-item aria-role="listitem" v-for="v in dashboards" @click="changeDashboard(v.dashboard_id)"><i class="fa fa-check has-mr-1" :class="{'is-invisible': v.dashboard_id != dashboard_id}"></i>{{v.title}}</b-dropdown-item>
				<hr aria-role="menuitem" class="dropdown-divider" v-if="allowEdit">
				<b-dropdown-item aria-role="listitem" @click="newDashboardForm" v-if="allowEdit"><i class="fa fa-plus has-mr-1"></i>Добавить дашборд</b-dropdown-item>
			</b-dropdown>
		</div>
		<div class="col-sm col-shrink" v-if="allowEdit">
			<button class="button is-light" @click="$modal('vue-manager-metrics-dashboard-form', {dashboard_id: dashboard_id})" v-if="allowEdit"><i class="fa fa-sliders-h has-mr-1"></i>{{'Настройки'|gettext}}</button>
<!-- 			<button class="button is-light" @click="isLocked = !isLocked"><i class="fas" :class="isLocked?'fa-lock':'fa-unlock'"></i></button> -->
			
			<button class="button is-black" @click="addChart"><i class="fa fa-plus has-mr-1"></i>Добавить чарт</button>
		</div>
		</div>
	</div>

	<hr class="is-marginless has-mb-1">
	
	<div class="container is-paddingless" :class="{'is-locked': !allowEditLayout}">
	<grid-layout
            :layout="layout"
            :col-num="24"
            :row-height="60"
            :is-draggable="allowEditLayout"
            :is-resizable="allowEditLayout"
            :vertical-compact="true"
            :margin="[14, 14]"
            :responsive="false"
            :use-css-transforms="true"
            @layout-updated="changed"
    >

        <grid-item v-for="(item, i) in layout" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i" :data-type="item.options.type" :data-width="item.w" drag-allow-from=".draggable-handle" :style="{ background: item.options.color.background, '--metrics-chart-bg': item.options.color.background, '--metrics-chart-text': item.options.color.text }">
			<div class="draggable-handle"></div>
			<div class="dashboard-panel">
				<vue-manager-metrics-layout-item :id="item.id" :chart_id="item.chart_id" :options="item.options" :series="item.series" :chart="item.chart" :dashboard_id="dashboard_id" :allow-edit="allowEditLayout" @delete="deleteChart(i)"/>
				<b-loading v-else :is-full-page="false" :active="true" />
			</div>
        </grid-item>
    </grid-layout>
	</div>
	<b-loading :is-full-page="false" :active.sync="isFetching" />
	</div>
</div>
`});

window.$app.defineComponent("manager", "vue-manager-metrics-datasets-form", {data() {
			return {
				isFetching: false,
				isUpdating: false,
				isOpenForm: false,
				values: {dataset_id: null, source_id: null, title: '', options: {sql: '', table: ''}, fields: [], users: []},
				field: {},
				field_default: {field: '', title: '', alias: '', type: 'string'},
				selected_field: null,
				sources: [],
				currentTab: 'common',
				type: 'sql',
				types: {
					sql: 'SQL запрос',
					table: 'Таблица'
				},
				fieldTypes: {
					string: 'Строка',
					number: 'Целое число',
					decimal: 'Дробное число',
					date: 'Дата'
				}
			}
		},
		
		props: ['dataset_id'],
		mixins: [FormModel],
		
		created() {
			this.$form.top.buttons = {save: {title: this.$gettext('Сохранить'), classname: 'is-primary', click: this.updateData}};
			this.fetchData();
		},
		
		watch: {
			isUpdating(v) {
				this.$form.top.buttons.save.classname = 'is-primary'+(v?' is-loading':'');
			},
			
			values: {
				handler(n, o) {
					this.updateTitle();
				},
				deep: true
			},
		},
		
		computed: {
			noChoosen() {
				return '-- '+this.$gettext('Не выбрано')+' --';
			}
		},
		
		methods: {
			updateTitle() {
				this.$form.top.title = this.$gettext('Датасет') + (this.values.title?(': '+this.values.title):'');
			},
			
			setTab(v) {
				this.currentTab = v;
			},
			
			openFormField(row) {
				this.selected_field = row;
				this.field = _.clone(row);
				this.isOpenForm = true;
			},
			
			newFormField() {
				this.field = _.clone(this.field_default);
				this.selected_field = null;
				this.isOpenForm = true;
			},
			
			saveFormField() {
				if (this.selected_field) {
					Object.assign(this.selected_field, this.field);
					this.selected_field = null;
				} else {
					this.values.fields.push(this.field);
				}
				
				this.isOpenForm = false;
			},
			
			deleteFormField() {
				this.$confirm(this.$gettext('Удалить это поле?'), 'is-danger').then(() => {
					Object.assign(this.selected_field, {deleted: true});
					this.selected_field = null;
					
					this.values.fields = _.filter(this.values.fields, v => v.deleted == undefined);
					this.isOpenForm = false;
				});
			},
			
			fetchData() {
				this.isFetching = true;
				this.$api.get(this.dataset_id?['manager/metrics/datasets/get', 'manager/metrics/datasets/info']:'manager/metrics/datasets/info', {dataset_id: this.dataset_id}).then((r) => {
					if (r.result == 'success') {
						if (this.dataset_id) this.values = r.response.dataset;
						this.variants = r.response.variants;
						this.type = (this.values.options.sql != undefined && this.values.options.sql)?'sql':'table';
					}
					this.isFetching = false;
				});
			},
			
			updateData() {
				this.isUpdating = true;
				if (this.type == 'sql') this.values.options.table = '';
				if (this.type == 'table') this.values.options.sql = '';

				this.$api.post('manager/metrics/datasets/set', this.values, this).then((r) => {
					if (r.result == 'success') {
						this.$form.close()
					}
					this.isUpdating = false;
				});
			}
		}, template: `
	<div>
		<div class="top-panel">
			<div class="container">
			<div class="scrolling-container is-submenu">
				<div style="overflow-x: scroll">
					<a class="button" :class="{active: 'common' == currentTab}" @click="setTab('common')">{{'Настройки'|gettext}}</a>
					<a class="button" :class="{active: 'options' == currentTab}" @click="setTab('options')">{{'Права доступа'|gettext}}</a>
				</div>
			</div>
			</div>
		</div>
				
		<div class="container has-mt-3 has-mb-3" v-if="currentTab == 'common'">
		<div class="panel panel-default has-p-2">
		
		<div class="row row-small has-mb-2">
			<div class="col-xs-12 col-sm-4">
				<b-field :label="'Название'|gettext" :message="errors.title" :class="{'has-error': errors.title}">
		        	<b-input v-model="values.title" maxlength="255" :has-counter="false" ref="title" class="has-rtl"></b-input>
				</b-field>
			</div>
			<div class="col-xs-12 col-sm-4">
				<b-field label="Подключение" :message="errors.source_id" :class="{'has-error': errors.source_id}">
				<b-select v-model="values.source_id" expanded :placeholder="noChoosen">
					<option :value="null">{{noChoosen}}</option>
					<option v-for="(v, k) in variants.sources" :value="k">{{v}}</option>
				</b-select>
				</b-field>
			</div>
			<div class="col-xs-12 col-sm-4">
				<b-field label="Тип">
				<b-select v-model="type" expanded>
					<option v-for="(v, k) in types" :value="k">{{v}}</option>
				</b-select>
				</b-field>
			</div>
		</div>
		
		<b-field label="Таблица" v-if="type == 'table'">
			<input type="text" v-model="values.options.table" class="input is-fullwidth">
		</b-field>
		<b-field label="SQL запрос" v-else>
			<textarea v-model="values.options.sql" class="input"></textarea>
		</b-field>
		
		<b-table :data="values.fields" v-if="_.size(values.fields)" class="has-mt-2 has-mb-2" @click="openFormField" hoverable bordered>
			<b-table-column field="title" label="Название" v-slot="props">
				<div v-if="props.row.title">{{props.row.title}}</div>
				<div v-else class="has-text-grey">Без названия</div>
			</b-table-column>
			<b-table-column field="field" label="Поле" v-slot="props">
				<div>{{props.row.field}}</div>
			</b-table-column>
			<b-table-column field="type" label="Формат" v-slot="props">
				<div>{{fieldTypes[props.row.type]}}</div>
			</b-table-column>
		</b-table>
		
		<div>
			<button class="button is-dark" type="button" @click="newFormField">{{'Добавить поле'|gettext}}</button>
		</div>

		</div>
		</div>
		
		<div class="container has-mt-3" v-if="currentTab == 'options'">
			<div class="row">
				<div class="col-sm-6">
					<div class="panel panel-default has-p-2">
						<vue-manager-metrics-share-user v-model="values.users" />
					</div>
				</div>
			</div>
		</div>
				
		<b-modal :active.sync="isOpenForm" has-modal-card trap-focus :can-cancel="[]">
            <template #default="props">
			<div class="modal-card modal-card-little">
	            <header class="modal-card-head"><p class="modal-card-title">{{'Поле'|gettext}}</p><button type="button" class="modal-close is-large" @click="isOpenForm = false"></button></header>
	            <section class="modal-card-body">
		            <b-field label="Название">
						<input type="text" v-model="field.title" class="input is-fullwidth" placeholder="Без названия" v-focus>
					</b-field>
		            <b-field label="Поле">
						<input type="text" v-model="field.field" class="input is-fullwidth">
					</b-field>
		            <b-field label="Формат">
						<b-select v-model="field.type" expanded>
							<option v-for="(v, k) in fieldTypes" :value="k">{{v}}</option>
						</b-select>
					</b-field>
					
		            <b-field label="Alias">
						<input type="text" v-model="field.alias" class="input is-fullwidth">
					</b-field>
	            </section>
				<div class="modal-card-foot level">
					<div class="level-left">
						<button class="button has-text-danger" type="button" @click="deleteFormField" v-if="selected_field"><i class="fa fa-trash-alt"></i></button>
					</div>
					<div class="level-right">
						<button class="button is-dark" type="button" @click="isOpenForm = false">{{'Закрыть'|gettext}}</button>
						<button class="button is-primary" type="button" @click="saveFormField">{{'Сохранить'|gettext}}</button>
					</div>
				</div>	
            </div>
            </template>
        </b-modal>
        
        <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-metrics-datasets-list", {data() {
			return {
				isFetching: true,
				datasets: [],
				columns: ['title'],
				filter: {query: ''}
			}
		},
		
		props: ['page_id'],
		mixins: [ListModel],
		
		created() {
			this.$io.on('events:metrics.datasets.list:refresh', this.refresh);

			this.fetchData();
		},
		
		destroyed() {
			this.$io.off('events:metrics.datasets.list:refresh', this.refresh);
		},
		
		computed: {
			columns_props() {
				if (!this.columns) return [];
				
				let columns = {
					title: {label: 'Название', classname: 'has-text-nowrap', sortable: false}
				};
				
				let result = _.map(this.columns, (v) => {
					let r = columns[v];
					r.visible = true;
					r.field = v;
					return r;
				});
				
				result[0].classname += ' has-text-nowrap';
				return result;
			}
		},
		
		methods: {
			fetchData(withLoading, force) {
				let resolve = (data) => {
					this.datasets = data.fields
				}

				if (force || !this.checkCache(resolve)) {
					this.isFetching = withLoading;
					
					this.$api.get('manager/metrics/datasets/list', {filter: this.filter}).then((r) => {
						if (r.result == 'success') {
							this.cachePage(r.response, resolve);
	
							this.isFetching = false;
						}
					});
				}
			},
			
			onFilter() {
                this.clearPages();
	            this.fetchData(true);
            },
			
			clickRow(row) {
				this.$form.open('vue-manager-metrics-datasets-form', {dataset_id: row.dataset_id});
			}
		}, template: `
	<div>
		<vue-component-submenu menu="manager.metrics" :page_id="page_id"></vue-component-submenu>
		
		<div class="has-mt-3 has-mb-3">
		<vue-component-filterbox v-model="filter" :with-filters="true" :with-buttons="true" @filter="onFilter">
			<template slot="buttons">
				<a @click="clickRow({dataset_id: null})" class="button is-primary is-fullwidth"><i class='fas fa-plus'></i><span class='is-hidden-touch has-ml-1'>{{'Новый датасет'|gettext}} </span></a>
			</template>
		</vue-component-filterbox>

		<div class="container">
		<b-table paginated backend-pagination pagination-simple :data="datasets" :loading="isFetching" :current-page="page" :per-page="perPage" :total="total" @page-change="onPageChange" hoverable bordered @click="clickRow">
		
		<b-table-column v-for="(column, index) in columns_props" :field="column.field" :label="column.label|gettext" :cell-class="['td-progress', column.classname]" :numeric="column.numeric" :key="index" :visible="column.visible" :sortable="column.sortable" :width="column.width" v-slot="props">
			<span v-if="column.field == 'title'"> 
				<span v-if="props.row.title">{{props.row.title}}</span><span v-else>{{'Без названия'|gettext}}</span>
			</span>
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
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-metrics-layout-item", {data: function() {
			return {
				layout: [],
				isLoading: true,
// 				chartValue: 0,
				
				periods: {
					week: 'Неделя',
					month: 'Месяц',
					quarter: 'Квартал',
					year: 'Год',
					all: 'Всё'
				},
				
				groups: {
					day: 'По дням',
					week: 'По неделям',
					month: 'По месяцам',
				},
				
				labels: [],
				seriesData: []
			}
		},
		props: {
			chart: Object,
			chart_id: Number,
			id: Number,
			dashboard_id: Number,
			options: Object,
			series: {
				type: Array,
				default: null
			},
			allowEdit: {
				type: Boolean,
				default: true
			}
		},
		computed: {
			withDateGroup() {
				return (['line', 'area', 'bar'].indexOf(this.options.type) != -1);
			}
		},
		watch: {
/*
			options(o) {
				this.recreate(() => { this.chartOptions.colors[0] = o.color.chart; });
			},
			
*/
			series(v) {
				if (!v) return;
				this.labels = [];
				this.seriesData = [];
				
				_.each(v, w => {
					this.seriesData.push(_.map(w, q => parseFloat(q.y)));
				});

				this.labels = _.map(v[0], w => w.x);
				
				this.isLoading = false;

/*
				let d = this.seriesData;
				let value_from = this.chartValue;
				let value_to = 0;
				
				switch (this.options.value_func) {
					case 'last':
// 						value_to = _.sum(d[d.length - 1]);
						value_to = _.sum(_.map(d, v => v[v.length - 1]));
						break;
					case 'sum':
						value_to = _.sum(_.map(d, v => _.sum(v)));
						break;
				}
				
				
				if (value_from != value_to) {
					if (['decimal', 'number'].indexOf(this.chart.field_type) != -1) {
							let delta = (value_to - value_from) / 20;
							let i = 0;
							let j = setInterval(() => {
								let v = value_from + (delta * i);
								this.chartValue = (this.chart.field_type == 'number')?Math.ceil(v):v;
								if (++i == 10) {
									this.chartValue = value_to;
									clearInterval(j);
								}
								this.$forceUpdate();
							}, 10);
					} else {
						this.chartValue = value_to;
					}
				}
*/
				
				this.recreate();
			}
		},
		methods: {
			editForm(is_global) {
				if (this.allowEdit) this.$form.open('vue-manager-metrics-chart-form', is_global?{chart_id: this.chart_id}:{id: this.id, dashboard_id: this.dashboard_id});
			},
			
			deleteChart() {
				this.$emit('delete');
			},
			
			recreate(cb) {
				this.isLoading = true;
				this.$nextTick(() => {
					if (cb != undefined) cb();
					this.isLoading = false;
				})
			},
			
			changePeriod(k) {
				this.options.period = k;
				
				if (this.withDateGroup) {
					switch (k) {
						case 'year':
							if (this.options.group == 'day') this.options.group = 'week';
							break;
						case 'all':
							this.options.group = 'month';
							break;
					}
				}
								
				this.$api.get('manager/metrics/dashboard/chart_period', {id: this.id, dashboard_id: this.dashboard_id, period: this.options.period, group: this.options.group});
			},
			
			changeGroup(k) {
				this.options.group = k;
				this.$api.get('manager/metrics/dashboard/chart_period', {dashboard_id: this.dashboard_id, id: this.id, period: this.options.period, group: this.options.group});
			},
			
			refresh() {
				this.$api.get('manager/metrics/dashboard/refresh', {id: this.id, dashboard_id: this.dashboard_id});
			}
		}, template: `
<div class="mx-chart-panel" @dblclick="editForm(false)">
	<div class="metrics-chart-header">
		<h3 class="is-size-6" style="margin-top: 10px">
			<span>{{ options.title }}</span>
			<span>
<!--
				<b-dropdown position="is-bottom-left" class="is-period-menu is-context-menu" :style="{color: options.color.text}">
					<a href="#" slot="trigger" :style="{color: options.color.text}">{{periods[options.period]}}<i class="fal fa-angle-down has-ml-1"></i></a>
					<b-dropdown-item v-for="(v, k) in periods" aria-role="listitem" @click="changePeriod(k)" :class="{'is-active': k == options.period}">{{v}}</b-dropdown-item>
				</b-dropdown>
-->
				
				<label class="has-text-black has-ml-1" v-if="allowEdit">
				<b-dropdown position="is-bottom-left" class="is-context-menu" append-to-body>
					<i class="fa fa-ellipsis-v" slot="trigger"></i>
					<b-dropdown-item aria-role="listitem" @click="refresh"><i class="fa fa-redo has-mr-1"></i>Обновить</b-dropdown-item>
					<hr aria-role="menuitem" class="dropdown-divider">
					<b-dropdown-item aria-role="listitem" v-for="(v, k) in periods" @click="changePeriod(k)"><i class="fa fa-check has-mr-1" :class="{'is-invisible': k != options.period}"></i>{{v}}</b-dropdown-item>

					<hr aria-role="menuitem" class="dropdown-divider" v-if="withDateGroup">
					<b-dropdown-item aria-role="listitem" v-for="(v, k) in groups" @click="changeGroup(k)" v-if="withDateGroup && ((['week', 'month', 'quarter'].indexOf(options.period) != -1) || (options.period == 'year' && k != 'day') || (options.period == 'all' && k == 'month'))"><i class="fa fa-check has-mr-1" :class="{'is-invisible': k != options.group}"></i>{{v}}</b-dropdown-item>

					<hr aria-role="menuitem" class="dropdown-divider">
					<b-dropdown-item aria-role="listitem" @click="editForm(false)"><i class="fa fa-tint has-mr-1"></i>Внешний вид</b-dropdown-item>

					<hr aria-role="menuitem" class="dropdown-divider" v-if="allowEdit">
					<b-dropdown-item aria-role="listitem" @click="editForm(true)"  v-if="allowEdit"><i class="fa fa-cog has-mr-1"></i>Редактировать чарт</b-dropdown-item>
					<hr aria-role="menuitem" class="dropdown-divider">
					<b-dropdown-item aria-role="listitem" class="has-text-danger" @click="deleteChart"><i class="fa fa-trash-alt has-mr-1"></i>Удалить</b-dropdown-item>
				</b-dropdown>
				</label>
			</span>
		</h3>
		<vue-manager-metrics-value class="is-size-3" v-if="!isLoading && (withDateGroup || options.type == 'number')" :chart="chart" :options="options" :series="seriesData" />
	</div>

	<vue-manager-metrics-chart v-if="!isLoading && (options.type != 'number')" :series="seriesData" :labels="labels" :chart="chart" :options="options" />
			
	<b-loading :is-full-page="false" :active.sync="isLoading"></b-loading>
</div>
`});

window.$app.defineComponent("manager", "vue-manager-metrics-menu", {data() {
			return {
				menu: {common: this.$gettext('Общие'), settings: this.$gettext('Настройки')},				
			}
		}, template: `
	<div>
		<div class="top-panel">
			<div class="container">
			<div class="scrolling-container is-submenu">
				<div style="overflow-x: scroll">
					<a v-for="(t, k) in menu" class="button" :class="{active: k == currentTab}" @click="currentTab = k">{{t|gettext}}</a>
				</div>
			</div>
			</div>
		</div>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-metrics-share-user", {data() {
			return {
				isFetchingUsers: false,
				autocompleteUsers: [],
				queryUser: ''
			}
		},
		
		props: ['value'],

		computed: {
			usersIds() {
				return _.map(this.value, 'account_id');
			}
		},
		
		methods: {
			deleteUser(index) {
				this.$confirm(this.$gettext('Отозвать права для этого пользователя?'), 'is-danger').then(() => {
					this.value.splice(index, 1)
				});
			},
			
			asyncAutocompleteUsers: _.debounce(function() {
                if (this.queryUser.trim() == '') {
	                this.autocompleteUsers = [];
	                return;
                }
                
                this.isFetchingUsers = true;
                this.$api.get('manager/metrics/dashboard/usersearch', {query: this.queryUser}).then((data) => {
	                this.autocompleteUsers = _.filter(data.response.users.search, (v) => this.usersIds.indexOf(v.account_id) == -1);
	                this.isFetchingUsers = false;
				});
			}, 500),
			
			onSelect(u) {
				if (u) this.value.push(u);
			}			
		}, template: `
	<div>
		<b-autocomplete v-model="queryUser" :data="autocompleteUsers" :placeholder="'Добавить пользователя'|gettext" field="title" :loading="isFetchingUsers" @input="asyncAutocompleteUsers" @select="onSelect" :clear-on-select="true"></b-autocomplete>

		<b-table :data="value" v-if="_.size(value)" class="has-mt-2" :show-header="false">
			<b-table-column field="title" label="Пользователь" v-slot="props">
				<div class="row row-noborder is-marginless">
					<div class="col-xs">
						<div>{{props.row.email}}</div>
						<div class="has-text-grey">{{props.row.fullname}}</div>
					</div>
					<div class="col-xs col-shrink" style="display:flex;align-self:center">
						<button class="button has-text-danger" @click="deleteUser(props.index)"><i class="fa fa-trash-alt"></i></button>
					</div>
				</div>
			</b-table-column>
		</b-table>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-metrics-sources-list", {data() {
			return {
			}
		},
		
		props: ['page_id'], template: `
	<div>
		<vue-component-submenu menu="manager.metrics" :page_id="page_id"></vue-component-submenu>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-metrics-value", {data() {
			return {
				chartValue: 0
			}
		},
		
		props: ['options', 'chart', 'series'],
		
		watch: {
			series: {
				handler() {
					this.refresh();
				},
				deep: true
			},
			
			options: {
				handler() {
					this.refresh();
				},
				deep: true
			},
			
			chart: {
				handler() {
					this.refresh();
				},
				deep: true
			}
		},
		
		created() {
			this.refresh();
		},
		
		methods: {
			refresh() {
				let d = this.series;
				let value_from = this.chartValue;
				let value_to = 0;
				
				switch (this.options.value_func) {
					case 'last':
// 						value_to = _.sum(d[d.length - 1]);
						value_to = _.sum(_.map(d, v => v[v.length - 1]));
						break;
					case 'sum':
						value_to = _.sum(_.map(d, v => _.sum(v)));
						break;
				}
				
				if (value_from != value_to) {
					if (['decimal', 'number'].indexOf(this.chart.field_type) != -1) {
							let delta = (value_to - value_from) / 20;
							let i = 0;
							let j = setInterval(() => {
								let v = value_from + (delta * i);
								this.chartValue = (this.chart.field_type == 'number')?Math.ceil(v):v;
								if (++i == 10) {
									this.chartValue = value_to;
									clearInterval(j);
								}
								this.$forceUpdate();
							}, 10);
					} else {
						this.chartValue = value_to;
					}
				}
			}
		}, template: `
	<span :style="{color: options.color.text}">{{chartValue|number}} {{chart.unit}}</span>
`});

window.$app.defineComponent("manager", "vue-manager-partners-agreements-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				legalTypes: {entrepreneur: 'ИП', company: 'Компания'},
			}
		},

		created() {
			this.fetchData(true);
		},

		props: ['partner_id'],
		mixins: [FormModel],
		
		computed: {
			title() {
				return this.isFetching?'':(this.legalTypes[this.values.details.legaltype]+' '+((this.values.details.legaltype == 'company')?('ООО "'+this.values.details.name+'"'):(this.values.details.f+' '+this.values.details.i+' '+this.values.details.o)));
			}
		},

		methods: {
			agree() {
				this.isUpdating = true;
				this.$api.get('manager/partners/agreements/agree', {partner_id: this.partner_id}).then((data) => {
					if (data.result == 'success') {
						this.values.agreement_status = 'signed';
					}

					this.isUpdating = false;
				});
			},
			
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('manager/partners/agreements/get', {partner_id: this.partner_id}).then((data) => {
					this.isFetching = false;
					this.values = data.response.values;
				});
			},
			
			generate() {
				this.isUpdating = true;
				this.$api.get('manager/partners/agreements/generate', {partner_id: this.partner_id, number: this.values.agreement_number}).then((data) => {
					this.isUpdating = false;
					this.values = data.response.values;
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">Договор</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		
		<section class="modal-card-body">
			<div class="has-mb-2">{{title}}</div>
			<div class="has-mb-2" v-if="values.details">Почта: {{values.details.email}} <vue-component-clipboard :text="values.details.email" /></div>
			<div class="has-mb-2" v-if="values.details">ИНН: {{values.details.inn}} <vue-component-clipboard :text="values.details.inn" /></div>
			
			<div v-if="values.agreement_number">
				<a :href="'https://docs.google.com/gview?url=http://p1.taplink.ru/c/agreements/'+values.agreement_number+'.docx'" target="_blank" class="button is-dark">Открыть документ</a>
				<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="generate">Пересоздать документ</button>
				<button class="button is-success" :class="{'is-loading': isUpdating}" @click="agree" v-if="values.agreement_status != 'signed'">Подтвердить договор</button>
			</div>
			<button v-else class="button is-primary" :class="{'is-loading': isUpdating}" @click="generate">Сгенерировать документ</button>
			
		</section>

		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("manager", "vue-manager-partners-agreements-list", {data: function() {
			return {
				agreements: [],
                page: 1,
                perPage: 100,
                total: 0,
                isUpdating: false,
                percents: [0, 5, 10, 15, 20, 25, 30, 35],
                
				isFeaching: false,
				statuses: {unsigned: 'Не подписан', pending: 'В ожидании', signed: 'Подписан'},
				statuses_colors: {unsigned: 'danger', pending: 'warning', signed: 'success'}
			}
		},
		
		props: ['page_id'],
		
		mixins: [FormModel, ListModel],
		
		created: function () {
			this.$io.on('events:manager.partners.agreements:refresh', this.refresh);
			this.fetchData();
		},
		
		destroyed() {
			this.$io.off('events:manager.partners.agreements:refresh', this.refresh);
		},

		methods: {
			onPageChange(page) {
                this.page = page;
                this.fetchData()
            },
            
            fetchData(force) {
				this.isFeaching = true;

				let resolve = (data) => {
					this.agreements = data.fields;
					this.isFeaching = false;
				}
				
				if (force || !this.checkCache(resolve)) {
					this.$api.post('manager/partners/agreements/list', {next: this.next, sort_field: this.sortField, sort_order: this.sortOrder}).then((data) => {
						this.cachePage(data.response.agreements, resolve);
					}).catch((error) => {
	                    this.isFeaching = false
	                })
                }
			},
			
	        clickRow(row) {
	            this.$modal('vue-manager-partners-agreements-form', {partner_id: row.partner_id}, this);
	        }
		}, template: `
<div>
	<vue-component-submenu menu="manager.partners" :page_id="page_id"></vue-component-submenu>
	<div class="container">
		<b-table paginated backend-pagination pagination-simple :data="agreements" :loading="isFeaching" class="has-mb-2 has-mt-3" :per-page="perPage" :total="total" @click="clickRow" @page-change="onPageChange" hoverable>
			<b-table-column :label="'Аккаунт'|gettext" v-slot="props">{{ props.row.email }}</b-table-column>
			<b-table-column :label="'Договор'|gettext" v-slot="props"><div v-if="props.row.agreement_number">{{ props.row.agreement_number }} от {{ props.row.agreement_date|date }}</div></b-table-column>
			<b-table-column :label="'Статус'|gettext" numeric v-slot="props"><div :class="'has-text-'+statuses_colors[props.row.agreement_status]">{{statuses[props.row.agreement_status]}}</span></div></b-table-column>
		</b-table>
	</div>
</div>
`});

window.$app.defineComponent("manager", "vue-manager-partners-history", {data() {
			return {
				isFetching: false,
				isUpdating: false,
				history: [],
                percents: [0, 5, 10, 15, 20, 25, 30, 35],
                percent: 0,
                max_percent: 5
			}
		},
		
		props: ['profile_id', 'partner_id'],
		
		created() {
			this.isFetching = true;
			this.$api.get('manager/partners/get', {partner_id: this.partner_id}).then((r) => {
				if (r.result == 'success') {
					this.history = r.response.history;
					this.max_percent = r.response.max_percent;
					this.percent = r.response.percent;
				}
				
				this.isFetching = false;
			});			
		},
		
		methods: {
			change() {
				this.isUpdating = true;
				this.$api.get('manager/partners/set', {partner_id: this.partner_id, percent: this.percent}).then((r) => {
					if (r.result == 'success') {
						this.history = r.response.history;
						this.$parent.$parent.fetchData();
					}

					this.isUpdating = false;
				});
			}
		}, template: `
	<div class="modal-card modal-card-large">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Партнерская программа'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
			<section>
				<div class="row row-small">
					<div class="col-sm-3 has-mb-2-mobile">
						<b-select v-model="percent" expanded>
			                <option value="">-- {{'Процент отчислений'|gettext}} --</option>
			                <option :value="p" v-for="p in percents" v-if="p <= max_percent">{{p}}%</option>
						</b-select>
					</div>	
					<div class="col-sm-2">
						<button class='button is-primary is-fullwidth' :class="{'is-loading': isUpdating}" @click="change" expanded>{{'Изменить'|gettext}}</button>
					</div>										
				</div>
			</section>
			<section>
				<b-table :data="history" :paginated="false">
					<template slot-scope="props">
						<b-table-column :label="'Дата'|gettext">{{ props.row.tms|datetime }}</b-table-column>
						<b-table-column :label="'Процент'|gettext">{{ props.row.percent }}%</b-table-column>
						<b-table-column :label="'Кто добавил'|gettext">{{ props.row.email }}</b-table-column>
					</template>
				</b-table>
			</section>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-partners-list", {data: function() {
			return {
				partners: [],
				permissions: {},
                page: 1,
                perPage: 100,
                total: 0,
                isUpdating: false,
                percents: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
                
                form: {nickname: '', percent: '', period: ''},
                max_percent: 5,
				
				isFeaching: false
			}
		},
		
		props: ['page_id'],
		
		mixins: [FormModel, ListModel],
		
		created: function () {
			this.$io.on('events:manager.partners:refresh', this.refresh);
			this.permissions = {
				profile: this.$auth.isAllowEndpoint('manager/profiles/get'),
				add: this.$auth.isAllowEndpoint('manager/partners/add')
			}
			this.fetchData();
		},
		
		destroyed() {
			this.$io.off('events:manager.partners:refresh', this.refresh);
		},

		methods: {
			onPageChange(page) {
                this.page = page;
                this.fetchData()
            },
            
            fetchData(force) {
				this.isFeaching = true;

				let resolve = (data) => {
					this.partners = data.fields;
					this.max_percent = data.max_percent;
					this.isFeaching = false;
				}
				
				if (force || !this.checkCache(resolve)) {
					this.$api.post('manager/partners/list', {next: this.next, sort_field: this.sortField, sort_order: this.sortOrder}).then((data) => {
						this.cachePage(data.response.partners, resolve);
					}).catch((error) => {
	                    this.payments = []
	                    this.total = 0
	                    this.isFeaching = false
	                })
                }
			},
			
			openForm(profile_id) {
				this.$modal('vue-manager-profiles-form', {profile_id: profile_id}, this);
			},
			
			addPartner() {
				this.isUpdating = true;
				this.$api.post('manager/partners/add', this.form, this).then((data) => {
					if (data.result == 'success') {
						_.each(this.form, (v, k) => { this.form[k] = ''; })
					}
					this.isUpdating = false;
				}).catch(() => {
					this.isUpdating = false;
				})
			}
		}, template: `
<div>
	<vue-component-submenu menu="manager.partners" :page_id="page_id"></vue-component-submenu>
	<div class="container">
		
		<div class="has-mt-2 has-mb-2" v-if="permissions.add">
		<div class="row row-small">
			<div class="col-sm has-mb-2-mobile">
				<b-input type="text" :placeholder="'Email или имя профиля партнера'|gettext" v-model="form.nickname" expanded></b-input>
			</div>
			<div class="col-sm-3 has-mb-2-mobile">
				<b-select v-model="form.percent" expanded>
	                <option value="">-- {{'Процент отчислений'|gettext}} --</option>
	                <option :value="p" v-for="p in percents" v-if="p <= max_percent">{{p}}%</option>
				</b-select>
			</div>	
<!--
			<div class="col-sm-3 has-mb-2">
				<b-select v-model="form.period" expanded>
	                <option value="">-- На сколько дать доступ --</option>
	                <option value="1">1 месяц</option>
	                <option value="12">1 год</option>
	                <option value="60">5 лет</option>
	                <option value="120">10 лет</option>
				</b-select>
			</div>	
-->	
			<div class="col-sm-2">
				<button class='button is-primary is-fullwidth' :class="{'is-loading': isUpdating}" @click="addPartner" expanded>{{'Добавить'|gettext}}</button>
			</div>										
		</div>
		</div>
					
<!--
		<div class="has-mb-2 has-mt-1">
			<mx-item class="mx-item-header">
				<div class="item-row row">
					<div class="col-xs-12"> {{'Всего партнеров'|gettext}}: {{ total|number }} </div>
				</div> 
			</mx-item>
		</div>	
-->
			
		<b-table paginated backend-pagination pagination-simple :data="partners" :loading="isFeaching" class="has-mb-4" :per-page="perPage" @sort="onSort" :total="total" @page-change="onPageChange">
			<b-table-column field="nickname" :label="'Аккаунт'|gettext" v-slot="props">
				{{ props.row.email }}<br>
				<a v-for="profile in props.row.profiles" class="is-block" @click="openForm(profile.profile_id)" v-if="permissions.profile">{{ profile.nickname }}</a>
				<div v-else>{{ profile.nickname }}</div>
			</b-table-column>
			<b-table-column field="manager" :label="'Кто добавил'|gettext" class="has-text-grey" v-slot="props">{{ props.row.manager }}</b-table-column>
			<b-table-column field="percent" :label="'Процент'|gettext" v-slot="props">{{ props.row.percent }} %</b-table-column>
			<b-table-column field="profiles" :label="'Промокоды'|gettext" v-slot="props">
				<div class="tags" v-if="props.row.promos"><div v-for="promocode in props.row.promos" class="tag is-success">{{ promocode.code }}</div></div>
				<div v-else class="has-text-danger">{{'Нет'|gettext}}</div>
			</b-table-column>
			<b-table-column field="profiles" :label="'Статистика'|gettext" numeric v-slot="props">
				<div v-if="props.row.invited_amount">{{'Регистрации'|gettext}}: {{ props.row.invited_amount }}</div>
				<div v-if="props.row.invited_amount_installed">{{'Установки'|gettext}}: {{ props.row.invited_amount_installed }}</div>
				<div v-if="props.row.invited_orders">{{'Оплаты'|gettext}}: {{ props.row.invited_orders }}</div>
				<div v-if="props.row.invited_budget">{{'Сумма'|gettext}}: {{ props.row.invited_budget|currency('RUB') }}</div>
			</b-table-column>
		</b-table>
	</div>
</div>
`});

window.$app.defineComponent("manager", "vue-manager-partners-payouts-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				values: {payouts: []},
			}
		},

		created() {
			if (this.withdrawal_id) this.fetchData(true);
		},

		props: ['withdrawal_id'],
		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('manager/partners/payouts/get', {withdrawal_id: this.withdrawal_id}).then((data) => {
					this.isFetching = false;
					this.values = data.response.payouts.values;
				});
			},
			
			send(send) {
				this.isUpdating = true;
				this.$api.get('manager/partners/payouts/send', {withdrawal_id: this.withdrawal_id, send: send}, this).then((data) => {
					this.isUpdating = false;
					
					if (data.result == 'success') {
						this.$parent.close();
					}
				});
			}
			
/*
			doRefund() {
				this.$confirm(this.values.receipt?this.$gettext('Для того, чтобы отменить операцию вам необходимо сделать возврат денежных средств клиенту. После нажатия кнопки "Ок" данные о возврате уйдут в ФНС. Вы уже сделали возврат?'):this.$gettext('Аннулировать оплату?'), 'is-warning').then(() => {
					this.isRefunding = true;
                    this.$api.post('manager/payments/refund', {order_id: this.order_id, receipt: this.values.receipt, budget: this.total_refund}, this).then((data) => {
	                   	if (data.result == 'success') {
					   		this.isRefunding = false;
							this.currentTab = 'common';
							this.fetchData(true);
						}
					});
				});
			}
*/
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">Вывод</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		
		<section class="modal-card-body">
			<label class="label">Сумма:</label>
			<div class="field has-addons">
				<div class="control is-expanded has-feedback">
					<number type="text" class="input" disabled="on" :value="values.total" :precision="$account.currency.precision" ></number>
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="values.total"></vue-component-clipboard></a>
				</div>
				<p class="control"><span class="button is-static">{{values.currency_title}}</span></p>
			</div>
			
			<div class="hr has-mb-3" v-if="!values.is_completed && values.payouts.length > 1"></div>
			
			<div class="field has-addons" v-for="f in values.payouts" v-if="!values.is_completed && values.payouts.length > 1">
				<div class="control is-expanded">
					<number type="text" class="input" disabled="on" :value="f.budget" :precision="$account.currency.precision" ></number>
				</div>
				<p class="control"><span class="button is-static">{{values.currency_title}}</span></p>
			</div>
			
			
			
			<div class="field">
				<label class="label">{{values.method}}</label>
				<div class="has-feedback">
					<input type="text" class="input" disabled="on" :value="values.purpose">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="values.purpose"></vue-component-clipboard></a>
				</div>
			</div>			

			<div class="field" v-if="values.details">
				<label class="label">ИНН</label>
				
				<div class="has-feedback">
					<input type="text" class="input" disabled="on" :value="values.details.inn">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="values.details.inn"></vue-component-clipboard></a>
				</div>
			</div>	
			
			<div class="field" v-if="values.fio">
				<label class="label">ФИО</label>
				
				<div class="has-feedback">
					<input type="text" class="input" disabled="on" :value="values.fio">
					<a class="form-control-feedback has-text-grey-light"><vue-component-clipboard :text="values.fio"></vue-component-clipboard></a>
				</div>
			</div>				
			
			<button class="button is-primary" @click="send(1)" :class="{'is-loading': isUpdating}" :disabled="values.is_completed == 1 || !$auth.isAllowEndpoint('manager/partners/payouts/send')">Отправить</button>
			<button class="button is-dark" @click="send(0)" :class="{'is-loading': isUpdating}" :disabled="values.is_completed == 1 || !$auth.isAllowEndpoint('manager/partners/payouts/send')">Отметить как оплачено</button>
	
			<a :href="'https://docs.google.com/gview?url=http://p1.taplink.ru/c/agreements/'+values.agreement_number+'.docx'" target="_blank" class="button is-dark">Открыть документ</a>
		</section>

		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("manager", "vue-manager-partners-payouts-list", {data: () => {
			return {
				list: [],
				permissions: {},
                total: 0,
                perPage: 100,
				isFetching: false
			}
		},
		
		props: ['page_id'],

		mixins: [ListModel],
		
		created: function () {
			this.$io.on('events:manager.partners.payouts:refresh', this.refresh);
			this.fetchData();
		},
		
		destroyed() {
			this.$io.off('events:manager.partners.payouts:refresh', this.refresh);
		},

		methods: {
			refresh() {
				this.next = null;
				this.fetchData(true);
			},
			
			onPageChange(page) {
                this.page = page
                this.fetchData(true, false);
            },
            
            fetchData(force) {
				this.isFeaching = true;
				
				let resolve = (data) => {
					this.list = data.fields;
				}
				
				if (force || !this.checkCache(resolve)) {
					this.$api.get('manager/partners/payouts/list', {next: this.next}).then((data) => {
						this.cachePage(data.response.payouts, resolve);						
						this.isFeaching = false;
					}).catch((error) => {
	                    this.list = []
	                    this.total = 0
	                    this.isFeaching = false
	                    throw error
	                })
                };
			},
			
            clickRow(row) {
	            this.$modal('vue-manager-partners-payouts-form', {withdrawal_id: row.withdrawal_id}, this);
            }
		}, template: `
<div>
	<vue-component-submenu menu="manager.partners" :page_id="page_id"></vue-component-submenu>
	<div class="container">
		
<!--
		<div class="has-mb-2 has-mt-1">
			<mx-item class="mx-item-header">
				<div class="item-row row">
					<div class="col-xs-12"> Всего оплат: {{ total|number }} </div>
				</div> 
			</mx-item>
		</div>	
-->
		<div class="has-mb-2 has-mt-3">
		<b-table paginated backend-pagination pagination-simple :data="list" :loading="isFetching" class="has-mb-4" :per-page="perPage" :total="total" @page-change="onPageChange" @click="clickRow" hoverable>
			<b-table-column field="email" label="Аккаунт" v-slot="props">{{props.row.email}}</b-table-column>
			<b-table-column field="is_complete" label="Статус" v-slot="props"><div class="tag" v-if="props.row.is_complete" style="color: #ffffff;background: #5cb85c;">Выполнена</div><div class="tag" v-else style="color: #ffffff;background: #337ab7;">Новая</div></b-table-column>
			
			<b-table-column label="Метод" v-slot="props">{{props.row.method}}</b-table-column>
			
			<b-table-column field="budget" label="Бюджет" numeric v-slot="props">{{props.row.budget|currency(props.row.currency_title)}}</b-table-column>
		</b-table>
		</div>
	</div>
</div>
`});

window.$app.defineComponent("manager", "vue-manager-payments-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				values: {},
				currentTab: 'common',
				refund: {marketing: false, time: false, times: [], downgrade: false, custom: false},
				custom: 0,
				isRefunding: false,
				do_refund: false,
				description: ''
			}
		},

		created() {
			if (this.order_id) this.fetchData(true);
		},

		props: ['order_id'],
		mixins: [FormModel],
		
		computed: {
			progress() {
				return 100 - ((this.values.period_days - this.values.period_days_left) / this.values.period_days * 100);
			},
			
			timeRefund() {
				let result = [];
				let timeUsed = this.values.period_days - this.values.period_days_left;
				
				let periods = {3: 1, 6: .7, 12: .5}
				let periodsBack = {3: .5, 6: .7, 12: 1}
				
				let round = (v) => {
					return Math.ceil(v * 100) / 100;
				}
				
				let price = this.values.price * periodsBack[this.values.period];
				
				if (this.refund.time) {
					if (timeUsed > 6*30) {
						timeUsedPrice = round(price * periods[6]);
						result.push({amount: timeUsedPrice, title: '6 месяцев'});
						timeUsed -= 6*30;

						let timeUsedPrice2 = round((price * periods[6]) * timeUsed/(6*30));
						result.push({amount: timeUsedPrice2, title: 'дней: '+ timeUsed});
					} else if (timeUsed > 3*30) {
						timeUsedPrice = round(price * periodsBack[3]);
						result.push({amount: timeUsedPrice, title: '3 месяца'});

						timeUsed -= 3*30;
						let timeUsedPrice2 = round((price * periodsBack[3]) * timeUsed/(3*30));
						result.push({amount: timeUsedPrice2, title: 'дней: '+ timeUsed});

// 						timeUsedPrice += timeUsedPrice2;
// 						result.push({amount: timeUsedPrice2, title: '- 3 месяцев ('+(price * periodsBack[3])+') - '+  timeUsed + ' дня ('+(timeUsedPrice2)+')'});
/*
						timeUsedPrice = round((price * periods[3]) * timeUsed/(3*30));
// 						timeUsed -= 3*30;
						this.description.push('- 3 месяца ('+timeUsedPrice+')');
*/
					} else {
						result.push({amount: round(this.values.price*(timeUsed / this.values.period_days)), title: 'дней: '+timeUsed});
					} 
				}
				
				return result;
			},
			
			marketingPrice() {
				return this.values.price*0.3;
			},
			
			downgradePrice() {
				let periods = {3: 1, 6: .7, 12: .5}
				return this.values.prices.pro * periods[this.values.period] * this.values.period;
			},
			
			total_refund() {
				if (this.refund.custom) return this.custom;
// 				let timeUsed = this.values.period_days - this.values.period_days_left;
// 				let timeUsedPrice = 0;
				
/*
				this.description = [];
				let periods = {3: 1, 6: .7, 12: .5}
				let periodsBack = {3: .5, 6: .7, 12: 1}
				
				let round = (v) => {
					return Math.ceil(v * 100) / 100;
				}
*/
				
				let price = this.values.price;
				
				if (this.refund.time) {
					_.each(this.refund.times, i => {
						price -= this.timeRefund[i].amount;
					})

/*
					if (timeUsed > 6*30) {
						timeUsedPrice = round(price * periods[6]);
						timeUsed -= 6*30;
						let timeUsedPrice2 = round((price * periods[6]) * timeUsed/(6*30));
						timeUsedPrice += timeUsedPrice2;
						this.description.push('- 6 месяцев ('+(price * periods[6])+') - '+  timeUsed + ' дня ('+(timeUsedPrice2)+')');
					} else if (timeUsed > 3*30) {
						timeUsedPrice = round(price * periodsBack[3]);
						timeUsed -= 3*30;
						let timeUsedPrice2 = round((price * periodsBack[3]) * timeUsed/(3*30));
						timeUsedPrice += timeUsedPrice2;
						this.description.push('- 3 месяцев ('+(price * periodsBack[3])+') - '+  timeUsed + ' дня ('+(timeUsedPrice2)+')');
					} else {
						timeUsedPrice = round(this.values.price*(timeUsed / this.values.period_days));
					} 
*/
				}
				
				if (this.refund.marketing) price -= this.marketingPrice;
				
				

// 				let downgradePrice = this.values.prices.pro * periods[this.values.period] * this.values.period;
				if (this.refund.downgrade) price -= this.downgradePrice;
				
//				let periods = {3: 540, 6: 756, 12: 1080}
// 				this.description = this.description.join(', ');
// 				return this.values.price - timeUsedPrice - (this.refund.marketing?(this.values.price*0.3):0) - (this.refund.downgrade?downgradePrice:0)
				
				return price;
			},
			
			isAllowRefund() {
				return this.$auth.isAllowEndpoint('manager/payments/refund');
			},
			
			isAllowPaid() {
				return this.$auth.isAllowEndpoint('manager/payments/paid');
			}
		},

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('manager/payments/get', {order_id: this.order_id}).then((data) => {
					this.isFetching = false;
					this.values = data.response.payments.values;
					this.do_refund = [2, 7].indexOf(this.values.refund_payment_provider_id) != -1;
				});
			},
			
			setTab(n) {
				this.currentTab = n;
			},
			
			doRefund() {
				this.$confirm(this.values.receipt?this.$gettext('Для того, чтобы отменить операцию вам необходимо сделать возврат денежных средств клиенту. После нажатия кнопки "Ок" данные о возврате уйдут в ФНС. Вы уже сделали возврат?'):this.$gettext('Аннулировать оплату?'), 'is-warning').then(() => {
					this.isRefunding = true;
                    this.$api.post('manager/payments/refund', {order_id: this.order_id, receipt: this.values.receipt, budget: this.total_refund, downgrade: this.refund.downgrade, do_refund: this.do_refund}, this).then((data) => {
	                   	if (data.result == 'success') {
					   		this.isRefunding = false;
					   		this.$parent.$parent.fetchData();
							this.currentTab = 'common';
							this.fetchData(true);
						}
					});
				});
			},
			
			doPaid() {
				this.$confirm('Клиент оплатил?', 'is-warning').then(() => {
                    this.$api.post('manager/payments/paid', {order_id: this.order_id}, this).then((data) => {
	                   	if (data.result == 'success') {
							this.currentTab = 'common';
							this.fetchData(true);
						}
					});
				});
			},
			
			updateData() {
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
	<div class="modal-card modal-card-large">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Оплата'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		
		<ul class="nav nav-tabs has-text-left">
			<li :class="{active: currentTab == 'common'}"><a @click="setTab('common')">{{'Общие'|gettext}}</a></li>
			<li :class="{active: currentTab == 'refund'}" v-if="values.period_days_left && isAllowRefund"><a @click="setTab('refund')">{{'Возврат'|gettext}}</a></li>
		</ul>
				
		<section class="modal-card-body" v-if="currentTab == 'common'">
			<div class="has-mb-4">
				<label class="label is-pulled-left">{{'Тариф'|gettext}}: {{values.tariff}}</label>
				<div class="is-pulled-right has-text-grey" v-if="values.period_days_left">{{'Осталось {1} из {2}'|gettext|format(values.period_days_left, values.period_days)}}</div>
				<progress v-if="(values.order_status_id == 2) && values.period_days_left" class="progress is-success is-small" :value="progress" max="100"></progress>
				<progress v-else class="progress is-success is-small" value="0" max="100"></progress>
			</div>
			
			<div class="row">
				<div class="col-xs-12 col-sm-8">
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Цена'|gettext}}:</div>
						<div class="col-xs-9">
							{{values.price|currency(values.currency_title)}}
						</div>
					</div>
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Статус'|gettext}}:</div>
						<div class="col-xs-9">
							{{values.order_status|gettext}}
							<a href="#" v-if="values.order_status != 2 && isAllowPaid" @click="doPaid">{{'Провести оплату'|gettext}}</a>
						</div>
					</div>
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Метод оплаты'|gettext}}:</div>
						<div class="col-xs-9">
							{{values.payment_method_title}}
						</div>
					</div>
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'От'|gettext}}:</div>
						<div class="col-xs-9">
							{{values.tms_modify|datetime}}
						</div>
					</div>
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'До'|gettext}}:</div>
						<div class="col-xs-9">
							<span v-if="values.tariff_tms_until">{{values.tariff_tms_until|datetime}}</span>
							<span v-else class="has-text-grey">—</span>
						</div>
					</div>
					</div>
				</div>
			</div>
			
			
<!-- 			{{values}} -->
<!--
			<b-field label="__LABEL__" :message="errors.__VALUE__" :class="{'has-error': errors.__VALUE__}">
            	<b-input v-model="values.__VALUE__"></b-input>
			</b-field>
-->
		</section>
		
		<section class="modal-card-body" v-if="currentTab == 'refund'">
			<div class="has-mb-2">
				<div class="has-mb-1">Цена: {{values.price|currency(values.currency_title)}}</div>
				<div><b-checkbox v-model="refund.downgrade" :disabled="isRefunding" v-if="values.tariff == 'business'">Понизить до PRO ( - {{downgradePrice|currency(values.currency_title)}} )</b-checkbox></div>
				<div><b-checkbox v-model="refund.time" :disabled="isRefunding || refund.downgrade">Вычесть использованное время (дни: {{values.period_days - values.period_days_left}})</b-checkbox></div>
				<div v-if="timeRefund.length" class="has-ml-3">
					<div v-for="(p, i) in timeRefund"><b-checkbox v-model="refund.times" :native-value="i" :disabled="isRefunding || refund.downgrade">{{p.title}} ( - {{p.amount|currency(values.currency_title)}} )</b-checkbox></div>
				</div>
				<div><b-checkbox v-model="refund.marketing" :disabled="isRefunding || refund.downgrade">Вычесть 30% ( - {{marketingPrice|currency(values.currency_title)}} )</b-checkbox></div>
				<div class="has-mb-1"><b-checkbox v-model="refund.custom" :disabled="isRefunding">Указать сумму вручную</b-checkbox>
					<div v-if="refund.custom"><input type="number" v-model="custom" class="input"></div>
				</div>
				<div class="has-mb-1">Итого: {{total_refund|currency(values.currency_title)}}</div>
				
				
				
				<div v-if="total_refund">
					<button class="button is-danger has-mr-2" @click="doRefund" :disabled="isRefunding">Оформить возврат</button>
					<b-checkbox v-model="do_refund" :disabled="isRefunding || ([2, 7].indexOf(values.refund_payment_provider_id) == -1)">Провести возврат через платежную систему</b-checkbox>
				</div>
			</div>
		</section>
		
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("manager", "vue-manager-payments-list", {data: function() {
			return {
				payments: [],
				statisticsGroup: null,
				statistics: null,
				isFetching: false,
				filter: {query: '',date_from: null, date_until: null, tags: []},		

				filterTags: ['currency', 'provider', 'method', 'country'],		
				statisticsGroups: {payment_provider: this.$gettext('Платежная система'), payment_method: this.$gettext('Метод оплаты'), currency_code: this.$gettext('Валюта'), country: this.$gettext('Страна')},
				perPage: 100,
                balance: 0,
                total: 0,
                sortField: 'tms_modify',
                sortOrder: 'desc',
                
				weekdays: this.$getDaysNames(),
				months: this.$getMonthsNames(),
				first_day_week: this.$getFirstDayWeek(),
			}
		},

		mixins: [ListModel],

		watch: {
			statisticsGroup() {
				this.fetchStatistics();
			}
		},
		
		created: function () {
			this.fetchData();
			this.fetchStatistics();
		},
		
		computed: {
			totalPayments() {
				return _.sumBy(this.balance, (v) => v.amount );
			}
		},

		methods: {
			onFilter() {
// 				this.statisticsGroup = null;
				this.fetchStatistics();
				this.clearPages();
				this.fetchData();
			},
			
			openProfileForm(profile_id) {
				this.$modal('vue-manager-profiles-form', {profile_id: profile_id}, this);
			},

			onPageChange(page) {
                this.page = page
                this.fetchData(true, false);
            },
            
/*
            onSort(field, order) {
                this.sortField = field;
                this.sortOrder = order;
                this.fetchData()
            },
*/
            
            openForm(order_id) {
	            this.$modal('vue-manager-payments-form', {order_id: order_id}, this);
            },
            
            fetchStatistics() {
				this.statistics = null;
				let params = {filter: this.filter};
                this.$api.post('manager/payments/statistics', this.statisticsGroup?Object.assign(params, {group: this.statisticsGroup}):params).then((data) => {
	                this.statistics = data.response.statistics;
					if (data.response.balance.length) this.balance = data.response.balance;
                });
			},
			
            fetchData(withFetching = true, first = false, force = false) {
				this.isFetching = withFetching;
				
				let resolve = (data) => {
					this.payments = _.map(data.fields, (v) => { 
						v.link = '//instagram.com/'+v.username;
						v.instagram_link = '//instagram.com/'+v.username;
						return v;
					});
					this.isFetching = false;
				}
				
				if (force || !this.checkCache(resolve)) {
					this.$api.post('manager/payments/list', {next: this.next, sort_field: this.sortField, sort_order: this.sortOrder, filter: this.filter}).then((data) => {
						let d = data.response.payments;
						this.cachePage(d, resolve);
					}).catch((error) => {
	                    this.payments = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
                }
			},
			
			tagsFetch(name, query, cb) {
                this.$api.get('manager/payments/filters', {query: query, name: name}).then((data) => {
	                cb((data.result == 'success')?data.response.variants:[]);
				});
			},
		}, template: `
	<div>
	<div class="container has-mb-2 has-mt-2">
		<div class="has-mb-2" v-if="statistics">
			<div v-if="statisticsGroup">
				<div style="display: flex;flex-direction: row">
				<div class="has-background-grey-light profiles-conversion-bar" style="flex-grow: 1"></div>
				<b-dropdown v-model="statisticsGroup" class="statistics-group-button" aria-role="list" position="is-bottom-left">
					<div data-stage="0" style="width: 1.5rem;height: 1rem;position: absolute;top: 0;" slot="trigger" aria-role="listitem"></div>
					<b-dropdown-item value="">{{'Без групировки'|gettext}}</b-dropdown-item>
					<hr class="dropdown-divider">
					<b-dropdown-item v-for="(t, k) in statisticsGroups" :value="k">{{t}}</b-dropdown-item>
				</b-dropdown>
				</div>
			</div>
			
			<div v-for="(s, k) in statistics" class="has-mb-2">
				<div v-if="statisticsGroup"><span v-if="k">{{k}}</span><span class="has-text-grey" v-else>{{'Пустой список'|gettext}}</span></div>
				<div style="display: flex;flex-direction: row">
					<div class="has-background-grey-light profiles-conversion-bar" style="flex-grow: 1">
						<div data-stage="2" :style="{width: s.bars.nopaid}" v-tippy :content="'Не оплатили: {1} из {2}'|gettext|format($number(s.values.nopaid), $number(s.values.total))"><span>{{s.bars.nopaid}}</span></div>
						<div data-stage="5" :style="{width: s.bars.paid}" v-tippy :content="'Оплатили: {1} из {2}'|gettext|format($number(s.values.paid), $number(s.values.total))"><span>{{s.bars.paid}}</span></div>
					</div>
					<b-dropdown v-model="statisticsGroup" class="statistics-group-button" aria-role="list" position="is-bottom-left" v-if="!statisticsGroup">
						<div data-stage="0" style="width: 1.5rem;height: 1rem;position: absolute;top: 0;" slot="trigger" aria-role="listitem"></div>
						<b-dropdown-item value="">{{'Без групировки'|gettext}}</b-dropdown-item>
						<hr class="dropdown-divider">
						<b-dropdown-item v-for="(t, k) in statisticsGroups" :value="k">{{t}}</b-dropdown-item>
					</b-dropdown>
				</div>
			</div>
		</div>
		<div class="has-mt-2 has-mb-2 has-background-grey-light profiles-conversion-bar" v-else></div>
	
		<mx-item class="mx-item-header">
			<div class="item-row row">
				<div class="col-xs-12"> <span class="has-mr-2">{{'Всего оплат'|gettext}}: {{ totalPayments|number }}</span> {{'Итого'|gettext}}: <span v-for="(b, i) in balance" class="has-mr-1">{{b.balance | number}}<span style="opacity: .6"> {{b.currency_title}}</span><span v-if="i < balance.length-1">,</span> </span> </div>
			</div> 
		</mx-item>
	</div>

	<vue-component-filterbox @filter="onFilter" v-model="filter" :with-filters="true" :allow-tags="filterTags" :tags-fetch="tagsFetch" :disabled="isFetching">
		<template slot="filters">
			<div class="row row-small">
				<div class="col-xs-6 col-sm-3 has-mb-2">
					<div class="has-feedback">
						<b-datepicker :placeholder="'От'|gettext" v-model="filter.date_from" icon="calendar-alt" :day-names="weekdays" :month-names="months" :first-day-of-week="first_day_week"></b-datepicker>
						<a class="form-control-feedback has-text-grey-light" @click="filter.date_from = null"><i class="fal fa-times"></i></a>	
					</div>
				</div>

				<div class="col-xs-6 col-sm-3 has-mb-2">
					<div class="has-feedback">
						<b-datepicker :placeholder="'До'|gettext" v-model="filter.date_until" icon="calendar-alt" :day-names="weekdays" :month-names="months" :first-day-of-week="first_day_week"></b-datepicker>
						<a class="form-control-feedback has-text-grey-light" @click="filter.date_until = null"><i class="fal fa-times"></i></a>	
					</div>
				</div>
			</div>			
			</template>
	</vue-component-filterbox>
	
	<div class="container">
		<b-table paginated backend-pagination backend-sorting pagination-simple bordered :data="payments" :loading="isFetching" class="has-mb-4" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" @sort="onSort">
			<b-table-column field="order_id" :label="'Счет'|gettext" sortable v-slot="props"><div><span class="has-text-grey-light">№</span> <a href='#' @click="openForm(props.row.order_id)">{{ props.row.order_id }}</a></div></b-table-column>
			<b-table-column field="order_status_id" :label="'Оплата'|gettext" width="10%" sortable v-slot="props"><span :class="{'has-text-success': props.row.order_status_id == 2, 'has-text-danger': props.row.order_status_id != 2}">
				<div>
				<span v-if="props.row.order_status_id == 2">{{'Оплачен'|gettext}}</span><span v-else>{{'Не оплачен'|gettext}}</span>
				<span v-if="props.row.fiscal_attribute">
					<span v-if="props.row.onlinekassa_error" class="has-text-danger" v-tippy :content="props.row.onlinekassa_error"><i class="fal fa-receipt"></i></span>
					<span v-else class="has-text-success" v-tippy :content="props.row.fiscal_attribute"><i class="fal fa-receipt"></i></span>
				</span>
				</div>
			</b-table-column>
			<b-table-column field="payment_provider" :label="'Система'|gettext" sortable v-slot="props"><span v-if="props.row.payment_provider">{{ props.row.payment_provider }}</span><span v-else class="has-text-grey-light">—</span></b-table-column>
			<b-table-column :label="'Вес'|gettext" class="has-width-5" numeric v-slot="props">
				<span :class="{'has-text-grey-light': props.row.weight == 0}">{{ props.row.weight|number }}</span>
			</b-table-column>
			<b-table-column field="username" :label="'Профиль'|gettext" sortable v-slot="props"><a @click="openProfileForm(props.row.profile_id)">{{ props.row.username }}</a></b-table-column>
			<b-table-column field="followers":label="'Подписчиков'|gettext" numeric sortable v-slot="props">
				<div class="tags is-pulled-left is-hidden-mobile">
					<a :href='props.row.instagram_link' target="_blank" v-if="props.row.has_username"><span class="tag is-dark">Instagram</span></a>
				</div>
				{{ props.row.followers|number }}
			</b-table-column>
			<b-table-column field="tms_modify" :label="'Дата'|gettext" class="has-text-nowrap" sortable v-slot="props">{{ props.row.tms_modify|datetime }}</b-table-column>
			<b-table-column field="price" :label="'Бюджет'|gettext" numeric v-slot="props"><div>{{ props.row.price|number }}<span class="has-text-grey-light"> {{props.row.currency_title}}</span></div></b-table-column>
		</b-table>
	</div>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-profiles-domain-form", {data() {
			return {
				isUpdating: false,
				isFetching: true,
				values: {domain_id: null, language_id: null}
			}
		},

		props: ['account_id', 'profileForm'],
		mixins: [FormModel],

		created() {
			this.$api.get('manager/profiles/getdomain', {account_id: this.account_id}, this).then((data) => {
				if (data.result == 'success') {
					let r = data.response;
					this.values = r.values;
					this.variants = r.variants;
					this.isFetching = false;
				}
			});
		},
		

		methods: {
			updateData() {
				this.isUpdating = true;
				this.$api.post('manager/profiles/setdomain', {account_id: this.account_id, values: this.values}, this).then((data) => {
					if (data.result == 'success') {
						this.profileForm.fetchData();
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
			<p class="modal-card-title">{{'Смена домена и языка регистрации'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<b-field :label="'Домен'|gettext">
				<b-select v-model="values.domain_id" expanded>
	                <option v-for="(domain, domain_id) in variants.domains" :value="domain_id">{{domain}}</option>
				</b-select>
			</b-field>

			<b-field :label="'Язык'|gettext">
				<b-select v-model="values.language_id" expanded>
	                <option v-for="(language_title, language_id) in variants.languages" :value="language_id">{{language_title}}</option>
				</b-select>
			</b-field>
			
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("manager", "vue-manager-profiles-export-form", {data() {
			return {
				isUpdating: false,
				isRefreshing: false,
				isFetching: false,
				amount: 0,
				charset: 'utf-8',
				export_products: false,
				variants: {}
			}
		},

		created() {
			this.fetchData(true);
		},
		
		props: ['filters', 'query', 'tags', 'date_from', 'date_until'],
		
		computed: {
			downloadUrl() {
				return '/api/manager/profiles/export/download.csv?filters='+this.filters.join(',')+'&query='+this.query+'&charset='+this.charset+'&tags='+this.tags.join(',')+'&date_from='+(this.date_from?date_format('Y-m-d', this.date_from):'')+'&date_until='+(this.date_until?date_format('Y-m-d', this.date_until):'');
				
//				filter[status_id]='+this.filter.status_id+'&filter[page_id]='+this.filter.page_id+'&export_products='+(this.export_products?1:0)+'&charset='+this.charset;
			}	
		},

		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isRefreshing =  this.isFetching = withLoading;
				
				this.$api.get('manager/profiles/export/info', {filters: this.filters, query: this.query, tags: this.tags, date_from: this.date_from?date_format('Y-m-d', this.date_from):null, date_until: this.date_until?date_format('Y-m-d', this.date_until):null, charset: this.charset}).then((data) => {
					this.isFetching = this.isRefreshing = false;
					this.variants = data.response.export.info.variants;
					this.amount = data.response.export.info.amount;
				});
				
			},
			
			onChanged() {
				this.isRefreshing = true;
				this.$api.get('manager/profiles/export/calc', {filters: this.filters, query: this.query, charset: this.charset}).then((data) => {
					this.isRefreshing = false;
					this.amount = data.response.export.calc;
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Экспорт профилей'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			
			<div class="message is-success">
				<div class="message-body">
				{{'Найдено профилей'|gettext}}: {{ amount|number }}
				<a :href="downloadUrl" target="frame" class="button is-small is-success is-pulled-right no-ajax" :class="{'is-loading': isRefreshing}"><span class="is-hidden-mobile">{{'Скачать CSV-файл'|gettext}}</span><span class="is-hidden-tablet">{{'Скачать'|gettext}}</span></a>
				</div>
			</div>
			
			<b-field :label="'Кодировка'|gettext">
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

window.$app.defineComponent("manager", "vue-manager-profiles-form", {data: function() {
			return {
				profile: {nickname: '', tariff_current: '', avatar_url: '', tags: []},
				is_allow_signin: false,
				profiles: [],
				payments: [],
				transfers: [],
				adverts: false,
				emails: null,
				errors: {},
				variants: null,
// 				lock: {message: '', profiles: []},
				similar_profiles: null,
				history: null,
				isFetchingSimilarsProfiles: false,
				isFetchingHistory: false,
				isFetchingemails: false,
				isFetching: false,
				isUpdating: false
// 				isLockUpdating: false
			}
		},
		created() {
			this.fetchData();
		},
		computed: {
			link() {
				return {page: 'https://taplink.cc/'+this.profile.nickname, instagram: 'https://instagram.com/'+this.profile.nickname};
			}	
		},
		
		props: {profile_id: Number, currentTab: {type: String, default: 'common'}, owner: String},
		
		methods: {
			changeUsernameForm() {
				let username = prompt("Укажите имя пользователя", "");
				
				if (username) {
					this.$api.post('manager/profiles/setusername', {profile_id: this.profile_id, username: username}).then((data) => {
						if (data.result == 'success') {
							this.fetchData();
						} else {
							alert(data.message);
						}
					});
				}
			},
			
			changeEmail() {
				let email = prompt("Укажите email", this.profile.email);
				
				if (email) {
					this.$api.post('manager/profiles/setemail', {account_id: this.profile.account_id, email: email}).then((data) => {
						if (data.result == 'success') {
							this.fetchData();
						} else {
							alert(data.message);
						}
					});
				}
			},
			
			openDomainForm() {
				this.$modal('vue-manager-profiles-domain-form', {account_id: this.profile.account_id, profileForm: this});
			},
			
			changeAccountForm() {
				let email = prompt("Укажите email акканта", "");
				
				if (email) {
					this.$api.post('manager/profiles/setaccount', {profile_id: this.profile_id, email: email}).then((data) => {
						if (data.result == 'success') this.fetchData();
					});
				}

			},
			
			openPlanForm() {
				this.$modal('vue-manager-profiles-plan-form', {profile_id: this.profile_id, profileForm: this});
			},
			
			openTrialForm() {
				this.$modal('vue-manager-profiles-trial-form', {profile_id: this.profile_id, profileForm: this});
			},
			
			setTab(n) {
				this.currentTab = n;
				
/*
				if (n == 'se' && this.similar_profiles == null) {
					this.isFetchingSimilarsProfiles = true;
					this.$api.get('manager/profiles/lock/similar', {profile_id: this.profile_id}).then((data) => {
						this.lock.profiles = [this.profile_id];
						this.similar_profiles = data.response.profiles;
						this.isFetchingSimilarsProfiles = false;
					});
				}
*/
				
				if (n == 'history' && this.history == null) {
					this.isFetchingHistory = true;
					this.$api.get('manager/statistics/history/list', {profile_id: this.profile_id}).then((data) => {
						this.history = data.response.history.fields;
						this.isFetchingHistory = false;
					});
				}
				
				if (n == 'emails' && this.emails == null) {
					this.isFetchingHistory = true;
					this.$api.get('manager/mails/messages/account', {account_id: this.profile.account_id}).then((data) => {
						this.emails = data.response.messages.fields;
						this.isFetchingHistory = false;
					});
				}
			},
			
			fetchData() {
				this.isFetching = true;
				this.$api.get('manager/profiles/get', {profile_id: this.profile_id}).then((data) => {
					this.isFetching = false;
					this.profile = data.response.profile;
					this.profiles = data.response.profiles;
					this.payments = data.response.payments;
					this.transfers = data.response.transfers; 
					this.adverts = data.response.adverts;
					this.variants = data.response.variants;
					this.is_allow_signin = data.response.is_allow_signin;
				});
			},
			
			openPartnerForm() {
	            this.$modal('vue-manager-partners-history', {partner_id: this.profile.partner_id, profile_id: this.profile.profile_id}, this);
			},
			
			openPaymentForm(order_id) {
	            this.$modal('vue-manager-payments-form', {order_id: order_id}, this);
            },
			
/*
			lockProfiles() {
				this.$confirm('Заблокировать эти профили?', 'is-danger').then(() => {
					this.isLockUpdating = true;
					
					this.$api.post('manager/profiles/lock/lock', this.lock).then((data) => {
						this.$parent.close();
					});
				});
			},
*/
/*
			updateData() {
				this.isUpdating = true;
				this.$api.post('manager/profiles/set', this.profile).then((data) => {
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
*/
		}, template: `
	<div class="modal-card modal-card-large">
		<header class="modal-card-head">
			<p class="modal-card-title"><img :src="'//{1}/a/{2}'|format($account.storage_domain, profile.avatar_url)" style="width: 3rem;height:3rem;border-radius:100%;margin: -1rem .5rem -1rem 0"> {{'Профиль'|gettext}} {{profile.nickname}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		
		<ul class="nav nav-tabs has-text-left">
			<li :class="{active: currentTab == 'common'}"><a @click="setTab('common')">{{'Общие'|gettext}}</a></li>
			<li :class="{active: currentTab == 'payments'}"><a @click="setTab('payments')">{{'Оплаты'|gettext}}</a></li>
			<li :class="{active: currentTab == 'profiles'}"><a @click="setTab('profiles')">{{'Профили'|gettext}}</a></li>
			<li :class="{active: currentTab == 'security'}" v-if="$auth.isAllowEndpoint('manager/security/get')"><a @click="setTab('security')">{{'Блокировка'|gettext}}</a></li>
			<li :class="{active: currentTab == 'transfers'}"><a @click="setTab('transfers')">{{'Переносы'|gettext}}</a></li>
			<li :class="{active: currentTab == 'history'}"><a @click="setTab('history')">{{'История установок'|gettext}}</a></li>
			<li :class="{active: currentTab == 'emails'}" v-if="$auth.isAllowEndpoint('manager/mails/messages/account')"><a @click="setTab('emails')">{{'Письма'|gettext}}</a></li>
		</ul>
		
		<section class="modal-card-body" v-if="currentTab == 'common'">
			
			<div class="row">
				<div class="col-xs-12 col-sm-6">
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Страница'|gettext}}:</div>
						<div class="col-xs-9">
							<a target="_blank" :href="link.page">{{profile.nickname}}</a>
						</div>
					</div>
					</div>
			        
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">Account ID:</div>
						<div class="col-xs-9 level">
							<div class="level-left">
							{{profile.account_id}}
							</div>
							<div class="level-right">
								<a @click="changeAccountForm" class="is-pulled-right has-text-success" v-if="!profile.has_nickname ?? $auth.isAllowEndpoint('manager/profiles/setusername')">{{'Сменить'|gettext}}</a>
							</div>
						</div>
					</div>
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">Profile ID:</div>
						<div class="col-xs-9">
							{{profile.profile_id}}
						</div>
					</div>
					</div>
			        
			        <div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Тариф'|gettext}}:</div>
						<div class="col-xs-9 level">
							<div class="level-left">
								<vue-component-tariff-badge v-model="profile.tariff_current" theme="dark"/>
								<span v-if="profile.tariff_current != 'basic'" class="control has-text-grey has-ml-1">до {{profile.tms_tariff_until|date}}</span>
							</div>
							<div class="level-right">
								<a @click="openPlanForm" class="is-pulled-right has-text-success" v-if="$auth.isAllowEndpoint('manager/profiles/plans/transfer')">{{'Перенести'|gettext}}</a>
							</div>
						</div>
					</div>
			        </div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Триал'|gettext}}:</div>
						<div class="col-xs-9 level">
							<div class="level-left">
							<p class="control" v-if="profile.trial_tariff">
								<vue-component-tariff-badge v-model="profile.trial_tariff" theme="dark"/>
								<span class="control has-text-grey has-ml-1">до {{profile.trial_tms_until|date}}</span>
				            </p>
				            <p class="control has-text-grey" v-else>-- {{'Нет'|gettext}} --</p>
							</div>
							<div class="level-right">
								<a @click="openTrialForm" class="is-pulled-right has-text-success" v-if="$auth.isAllowEndpoint('manager/profiles/trial/set')">{{'Активировать'|gettext}}</a>
							</div>
						</div>
					</div>	
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Домен'|gettext}}:</div>
						<div class="col-xs-9 level" v-if="!isFetching">
							<div class="level-left">
								{{variants.domain_id[profile.domain_id]}}
							</div>
							<div class="level-right" v-if="$auth.isAllowEndpoint('manager/profiles/setdomain')">
								<a @click="openDomainForm" class="is-pulled-right has-text-success" v-if="$auth.isAllowEndpoint('manager/profiles/setdomain')">{{'Изменить'|gettext}}</a>
							</div>
<!-- 							<b-select v-model="profile.domain_id" disabled expanded><option v-for="(domain, domain_id) in variants.domain_id" :value="domain_id">{{ domain }}</option></b-select> -->
						</div>
					</div>													        
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">Referer:</div>
						<div class="col-xs-9">
							<a v-if="profile.referer" target="_blank" rel="noreferrer" :href="profile.referer">{{profile.referer_domain}}</a>
							<p class="control has-text-grey" v-else>-- {{'Нет'|gettext}} --</p>
						</div>
					</div>													        
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Метки'|gettext}}:</div>
						<div class="col-xs-9">
							<span class="tags" v-if="profile.tags.length > 0">
								<span v-for="tag in profile.tags" class="tag is-warning">{{ tag }}</span>
							</span>
							<p class="control has-text-grey" v-else>-- {{'Нет'|gettext}} --</p>
						</div>
					</div>													        
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Реклама'|gettext}}:</div>
						<div class="col-xs-9 level">
							<span v-if="adverts">{{adverts}}</span><p class=" has-text-grey" v-else>-- {{'Нет'|gettext}} --</p>
						</div>
					</div>
					</div>
					
				</div>
				
				<div class="col-xs-12 col-sm-6">
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Профиль'|gettext}}:</div>
						<div class="col-xs-9 level">
							<div class="level-left">
								<a target="_blank" :href="link.instagram" v-if="profile.has_nickname">@{{profile.nickname}}</a>
								<p class="control has-text-grey" v-else>-- {{'Нет'|gettext}} --</p>
							</div>

							<div class="level-right">
								<a @click="changeUsernameForm" class="is-pulled-right has-text-success" v-if="!profile.has_nickname ?? $auth.isAllowEndpoint('manager/profiles/setusername')">{{'Сменить'|gettext}}</a>
							</div>
						</div>
					</div>
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Подписчиков'|gettext}}:</div>
						<div class="col-xs-9">
							{{profile.followers|number}}
						</div>
					</div>
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Био'|gettext}}:</div>
						<div class="col-xs-9">
							{{profile.biography}}
						</div>
					</div>
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Ссылка'|gettext}}:</div>
						<div class="col-xs-9">
							<a :href="profile.website_link" target="_blank" v-if="profile.website_domain">{{profile.website_domain}}</a>
							<p class="control has-text-grey" v-else>-- {{'Нет'|gettext}} --</p>
						</div>
					</div>
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">Email:</div>
						<div class="col-xs-9 level">
							<div class="level-left">
								<a :href="'mailto:{1}'|format(profile.email)" target="_blank" v-if="profile.email">{{profile.email}}</a>
								<p class="control has-text-grey" v-else>-- {{'Нет'|gettext}} --</p>
							</div>
							<div class="level-right">
								<a @click="changeEmail" class="is-pulled-right has-text-success" v-if="$auth.isAllowEndpoint('manager/profiles/setemail')">{{'Сменить'|gettext}}</a>
							</div>
						</div>
					</div>
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Кто привел'|gettext}}:</div>
						<div class="col-xs-9">
							<p v-if="profile.invite_partner_id">{{profile.invite_partner_email}}</p>
							<p class="control has-text-grey" v-else>-- {{'Нет'|gettext}} --</p>
						</div>
					</div>
					</div>
					
					<div class="field">
					<div class="row">
						<div class="col-xs-3 has-text-weight-bold">{{'Партнерская программа'|gettext}}:</div>
						<div class="col-xs-9 level">
							<div class="level-left">
								<p v-if="profile.partner_id">ID: {{profile.partner_id}} <span class="has-text-grey">{{profile.partner_percent}}%</span></p>
								<p class="control has-text-grey" v-else>-- {{'Нет'|gettext}} --</p>
							</div>
							<div class="level-right" v-if="profile.partner_id">
								<a @click="openPartnerForm" class="is-pulled-right has-text-success" v-if="$auth.isAllowEndpoint('manager/partners/set')">{{'Изменить'|gettext}}</a>
							</div>
						</div>
					</div>
					</div>
				</div>
			</div>
		</section>
		
		<section class="modal-card-body" v-if="currentTab == 'payments'">
			<b-table :data="payments" :paginated="false">
				<b-table-column field="order_id" :label="'Счет'|gettext" sortable v-slot="props"><span class="has-text-grey-light">№</span> <a href='#' @click="openPaymentForm(props.row.order_id)">{{ props.row.order_id }}</a></b-table-column>
				<b-table-column field="order_status_id" :label="'Оплата'|gettext" width="10%" sortable v-slot="props"><span :class="{'has-text-success': props.row.order_status_id == 2, 'has-text-danger': props.row.order_status_id != 2}"><span v-if="props.row.order_status_id == 2">{{'Оплачен'|gettext}}</span><span v-else>{{'Не оплачен'|gettext}}</span></span></b-table-column>
				<b-table-column field="fiscal_attribute" :label="'Чек'|gettext" sortable v-slot="props"><span v-if="props.row.onlinekassa_error" class="has-text-danger"><i class="fa fa-exclamation-triangle" v-tippy :content="props.row.onlinekassa_error"></i> Ошибка</span><span v-else><span v-if="props.row.fiscal_attribute">ФП: {{ props.row.fiscal_attribute }}</span><span v-else class="has-text-grey-light">—</span></span></b-table-column>
				<b-table-column field="tms_modify" :label="'Дата'|gettext" sortable v-slot="props">{{ props.row.tms_modify|datetime }}</b-table-column>
				<b-table-column field="price" :label="'Бюджет'|gettext" numeric sortable v-slot="props"><span v-if="props.row.budget != props.row.price" class="has-text-success" style="opacity: .5">{{ props.row.budget|number }} {{props.row.currency_title}}</span> {{ props.row.price|number }}<span class="has-text-grey-light"> {{props.row.currency_title}}</span></b-table-column>
				<template slot="empty">
					<div class="has-text-grey-light has-text-centered">{{'Оплат нет'|gettext}}</div>
				</template>
			</b-table>
		</section>
		
		<vue-manager-security-form :profile_id="profile_id" v-if="currentTab == 'security'" :owner="owner"></vue-manager-security-form>
<!--
			<div class="manager-profiles has-mb-2">
			<div class="media">
				<div class="media-left">
					<img :src="'//{1}/a/{2}'|format($account.storage_domain, profile.avatar_url)">
				</div>
				<div class="media-content">
					<b-checkbox v-model="lock.profiles" :native-value="profile_id" disabled>{{profile.nickname}}</b-checkbox><br>
				</div>
			</div>
			<div v-for="p in similar_profiles" class="media">
				<div class="media-left">
					<img :src="p.avatar_url">
				</div>
				<div class="media-content">
					<b-checkbox v-model="lock.profiles" :native-value="p.profile_id" :disabled="isLockUpdating">{{p.nickname}}</b-checkbox><br>
				</div>
				<div class="media-left">
					<a target="_blank" :href="'https://taplink.cc/{1}'|format(p.nickname)">Открыть</a>
				</div>
			</div>
			</div>
			
			<b-field label="Сообщение">
				<b-input type="textarea" v-model="lock.message" :disabled="isLockUpdating"></b-input>
			</b-field>
			
			<button class="button is-danger" @click="lockProfiles" :disabled="isLockUpdating">Заблокировать профиль</button>
			<b-loading :is-full-page="false" :active.sync="isFetchingSimilarsProfiles"></b-loading>
-->
		
		<section class="modal-card-body" v-if="currentTab == 'profiles'">
				<p class="has-text-grey">{{'Список других профилей в данном личном кабинете'|gettext}}</p>
				<b-table :data="profiles" class="has-mt-2" :paginated="false">
					<b-table-column label="Имя пользователя" v-slot="props"><a @click="$modal('vue-manager-profiles-form', {profile_id: props.row.profile_id});">{{ props.row.username }}</a><span v-if="props.row.profile_status_id == 5" class="has-text-danger has-ml-1" v-tippy :content="'Профиль заблокирован'|gettext"><i class="fa fa-exclamation-triangle"></i></span></b-table-column>
					<b-table-column label="Тариф" class="has-width-20" v-slot="props"><vue-component-tariff-badge v-model="props.row.tariff_current" v-if="props.row.has_tariff"/><span class="tag is-default" v-else>basic</span></b-table-column>
					<b-table-column numeric label="Действителен до" class="has-text-right has-width-20" v-slot="props"><span v-if="props.row.has_tariff">{{ props.row.tms_tariff_until|datetime }}</b-table-column>
					<template slot="empty">
						<div class="has-text-grey-light has-text-centered">{{'Других профилей нет'|gettext}}</div>
					</template>
				</b-table>		
				
				
				<!--
<div v-for="p in profiles" class="media">
					<div class="media-left">
						<img :src="p.avatar_url">
					</div>
					<div class="media-content">
						{{p.nickname}}
					</div>
				</div>
-->
		</section>
		
		<section class="modal-card-body" v-if="currentTab == 'transfers'">
			<b-table :data="transfers" :paginated="false">
				<b-table-column :label="'От кого'|gettext" v-slot="props">{{props.row.username_from}}</b-table-column>
				<b-table-column :label="'Кому'|gettext" v-slot="props">{{props.row.username_to}}</b-table-column>
				<b-table-column :label="'Дата'|gettext" width="10%" v-slot="props">{{ props.row.tms_transfer|datetime }}</b-table-column>
				<template slot="empty">
					<div class="has-text-grey-light has-text-centered">{{'Пока ничего нет'|gettext}}</div>
				</template>
			</b-table>
		</section>		
		
		<section class="modal-card-body" v-if="currentTab == 'history'">
			<b-table :data="history" v-if="history">
				<b-table-column :label="'Дата'|gettext" v-slot="props">{{ props.row.tms|date }}</b-table-column>
				<b-table-column :label="'Домен'|gettext" v-slot="props"><span v-if="props.row.website_domain_history">{{ props.row.website_domain_history }}</span><span class="has-text-grey" v-else>{{'Пока ничего нет'|gettext}}</span></b-table-column>
				<template slot="empty">
					<div class="has-text-grey-light has-text-centered">{{'Пока ничего нет'|gettext}}</div>
				</template>
			</b-table>				
			<b-loading :is-full-page="false" :active.sync="isFetchingHistory"></b-loading>
		</section>
		
		<section class="modal-card-body" v-if="currentTab == 'emails'">
			<div class="message is-info">
				<div class="message-body">Email: {{profile.email}}</div>
			</div>
			
			<b-table :data="emails" v-if="emails">
				<b-table-column :label="'Дата'|gettext" v-slot="props">{{ props.row.tms_created|datetime }}</b-table-column>
				<b-table-column :label="'Заголовок'|gettext" v-slot="props">{{ props.row.subject }}</b-table-column>
				<b-table-column :label="'Статус'|gettext" v-slot="props"><span :class="'has-text-'+props.row.message_status_classname">{{ props.row.message_status|gettext }}</span></b-table-column>
				<template slot="empty">
					<div class="has-text-grey-light has-text-centered">{{'Пока ничего нет'|gettext}}</div>
				</template>
			</b-table>				
			<b-loading :is-full-page="false" :active.sync="isFetchingemails"></b-loading>
		</section>
		
		<footer class="modal-card-foot level">
			<div class="level-left">
				<button @click="$auth.changeProfile(profile_id, () => {$parent.close()})" target="_blank" class="button" v-if="is_allow_signin">Войти в аккаунт</button>
			</div>
			<div class="level-right">
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
<!-- 				<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">Сохранить</button> -->
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-profiles-list", {data: function() {
			return {
				isFetching: false,
				profiles: [],
				statistics: null,
				permissions: {},
				filter: {query: '', tags: []},
                perPage: 100,
                sortField: 'tms_created',
                sortOrder: 'desc',
                date_from: null,
                date_until: null,
                statisticsGroup: '',
                
				weekdays: this.$getDaysNames(),
				months: this.$getMonthsNames(),
				first_day_week: this.$getFirstDayWeek(),
				
				filterTags: ['utm_source', 'utm_medium', 'utm_campaign', 'lang', 'country', 'domain', 'uniq'],
				statisticsGroups: {lang: this.$gettext('Язык'), country: this.$gettext('Страна')/* , tag: this.$gettext('Метка') */, utm_source: 'utm_source', utm_medium: 'utm_medium', utm_campaign: 'utm_campaign', utm_term: 'utm_term', utm_content: 'utm_content'},
                
				dropdown_items: [
					{label: this.$gettext('Тарифы'), items: {'tariff:*': this.$gettext('Все тарифы'), 'tariff:pro': 'pro', 'tariff:business': 'business'}},
					{label: this.$gettext('Ссылка'), items: {'is_installed:true': this.$gettext('Cсылка стоит'), 'is_installed:false': this.$gettext('Cсылка не стоит'), 'is_installed_once:true': this.$gettext('Cсылка стояла')}},
					{label: this.$gettext('Блокировка'), items: {'is_locked:true': this.$gettext('Профиль заблокирован'), 'is_locked:false': this.$gettext('Профиль не заблокирован')}},
// 					{label: 'Instagram', items: {'is_deleted:true': 'Профиль удален', 'is_deleted:false': 'Профиль не удален'}},
				],
				filter_values: ['tariff:*', 'is_locked:false'],
			}
		},
		
		mixins: [ListModel],
		
		watch: {
			filter_type: function() {
// 				this.statisticsGroup = null;
				this.clearPages();
				this.fetchData();
			},
			statisticsGroup() {
				let params = this.getFetchParams();				
				this.fetchStatistics(params);
			}
		},
		
		beforeRouteUpdate(to, from, next) {
			let $auth = Vue.prototype.$auth;
			
			if ($auth.isAllowEndpoint('manager/profiles/list')) {
				next();
			} else {
				let submenu = $auth.prepareMenu($auth.getMenu('manager'));
				next(submenu[0]);
			}
		},

		created: function () {
			if (!this.$auth.isAllowEndpoint('manager/profiles/list')) return;
			
			this.fetchData(true, true);
			this.$io.on('events:manager.profiles.list:refresh', this.refresh);
			
			this.permissions = {
				form: this.$auth.isAllowEndpoint('manager/profiles/get'),
				statistics: this.$auth.isAllowEndpoint('manager/profiles/statistics'),
			}
		},
		
		destroyed() {
			this.$io.off('events:manager.profiles.list:refresh', this.refresh);
		},	

		methods: {
			fetchStatistics(params) {
				this.statistics = null;
				if (this.permissions.statistics) {
	                this.$api.get('manager/profiles/statistics', this.statisticsGroup?Object.assign(params, {group: this.statisticsGroup}):params).then((data) => {
		                this.statistics = data.response.profiles.statistics;
	                });
                }
			},
			onFilter() {
				//this.statisticsGroup = null;
                this.clearPages();
				let params = this.fetchData(true, false);
				this.fetchStatistics(params);
			},
			refresh() {
				this.next = this.current;
				this.fetchData(true, false, true);
			},
			stageTitle(stage) {
				let stages = {
					1: 'Авторизовался',
					2: 'Указал Email',
					3: 'Добавил блоки',
					4: 'Поставил ссылку',
					5: 'Оплатил тариф'
				}
				
				return stages[stage];
			},
			
			onPageChange(page) {
                this.page = page;
                this.fetchData(true, false);
            },
            
        	getFetchParams() {
            	return {next: this.next, count: this.perPage, sort_field: this.sortField, sort_order: this.sortOrder, query: this.filter.query, tags: this.filter.tags, filters: this.filter_values, date_from: this.date_from?date_format('Y-m-d', this.date_from):null, date_until: this.date_until?date_format('Y-m-d', this.date_until):null};;
        	},
            
            fetchData(withFetching = true, first = false, force = false) {
				this.isFetching = withFetching;
				
				let params = this.getFetchParams();
				
				let resolve = (data) => {
					//if (!this.next) this.statistics = data.statistics;
					this.profiles = _.map(data.fields, (v) => { 
						v.instagram_link = '//instagram.com/'+v.nickname;
						v.taplink_link = '//taplink.cc/'+v.nickname;
						v.lang = v.lang?v.lang:'&nbsp;&nbsp;';
						v.website_title = decodeURI(v.website_domain).replace(/\?.*/g, '?...').replace(/https?\:\/\//, '').replace(/^www\./, '');//.substr(0, 100);
						if (v.website_domain.indexOf('taplink.') != -1) {
							v.website_class = 'has-text-primary';
						} else if (!v.is_installed && v.is_installed_once) {
							v.website_class = 'has-text-danger';
						} else {
							v.website_class = 'has-text-black';
						}
						return v;
					});
					
					//this.next = data.response.profiles.next;
					
					
					this.isFetching = false;
				}
				
				if (force || !this.checkCache(resolve)) {
					this.$nextTick(() => {
						this.$api.post(first?['manager/profiles/list', 'manager/info']:'manager/profiles/list', params).then((data) => {
							this.cachePage(data.response.profiles, resolve);
							
							if (first) {
								if (!data.response.manager.info.domain_id) {
									let items = {'domain:*': 'Все домены'};
									this.filter_values.push('domain:*');
									
									_.each(data.response.manager.domains, (v, k) => {
										items['domain:'+k] = 'taplink.'+v;
									});
									
									this.dropdown_items.push({label: 'Домены', items: items});
								}
							}
						}).catch((error) => {
		                    this.payments = []
		                    this.total = 0
		                    this.isFetching = false
		                    throw error
		                });
		                
		                
		                if (this.permissions.statistics && !this.statistics) {
			                this.fetchStatistics(params);
		                }
	                });
                }
                
                return params;
			},
			
			openForm(profile_id) {
				this.$modal('vue-manager-profiles-form', {profile_id: profile_id}, this);
			},
			
			rowClass(row, index) {
				return row.is_locked?'tr-lock-account':'';
			},
			
            openExportForm() {
	            this.$modal('vue-manager-profiles-export-form', {query: this.filter.query, tags: this.filter.tags, filters: _.clone(this.filter_values), date_from: this.date_from, date_until: this.date_until}, this);
            },
            
            tagsFetch(name, query, cb) {
	            if (['lang', 'country', 'uniq'].indexOf(name) >= 0) {
		            cb([]);
	            } else {
	                this.$api.get('manager/profiles/filters', {query: query, name: name}).then((data) => {
		                cb((data.result == 'success')?data.response.variants:[]);
					});
				}
            },
            
			onInputDates() {
				//this.statisticsGroup = null;
				this.clearPages();
				let params = this.fetchData(true, false);
				this.fetchStatistics(params);
			}            
		}, template: `
	<div>
		<div class="container" v-if="permissions.statistics">
			<div>
			<div class="has-mt-2 has-mb-2" v-if="statistics">
				<div v-if="statisticsGroup">
					<div style="display: flex;flex-direction: row">
					<div class="has-background-grey-light profiles-conversion-bar" style="flex-grow: 1"></div>
					<b-dropdown v-model="statisticsGroup" class="statistics-group-button" aria-role="list" position="is-bottom-left">
						<div data-stage="0" style="width: 1.5rem;height: 1rem;position: absolute;top: 0;" slot="trigger" aria-role="listitem"></div>
						<b-dropdown-item value="">Без групировки</b-dropdown-item>
						<hr class="dropdown-divider">
						<b-dropdown-item v-for="(t, k) in statisticsGroups" :value="k">{{t}}</b-dropdown-item>
					</b-dropdown>
					</div>
				</div>
				
				<div v-for="(s, k) in statistics">
				<div v-if="statisticsGroup"><span v-if="k">{{k}}</span><span class="has-text-grey" v-else>Пусто</span></div>
				<div style="display: flex;flex-direction: row">
				<div class="has-background-grey-light profiles-conversion-bar" style="flex-grow: 1">
	<!--
					<span :style="{width: statistics.bars.email_skip}" v-tippy :content="'Не завершили регистрацию: {1} из {2}'|format($number(statistics.values.email_skip), $number(statistics.values.total))">{{statistics.conversions.email_skip}}</span>
					<div data-stage="2" :style="{width: statistics.bars.email}" v-tippy :content="'Завершили регистрацию: {1}'|format($number(statistics.values.email))"><span>{{statistics.conversions.email}}</span></div>
					<div data-stage="1" :style="{width: statistics.bars.remove}" v-tippy :content="'Убрали ссылку: {1} из {2}'|format($number(statistics.values.remove), $number(statistics.values.installed_once))"><span>{{statistics.conversions.remove}}</span></div>
					<div data-stage="4" :style="{width: statistics.bars.installed_once}" v-tippy :content="'Поставили ссылку: {1}, стоит сейчас: {2}'|format($number(statistics.values.installed_once), $number(statistics.values.installed))"><span>{{statistics.conversions.installed_once}}</span></div>
					<div data-stage="5" :style="{width: statistics.bars.paid}" v-tippy :content="'Купили: {1}'|format($number(statistics.values.paid))"><span>{{statistics.conversions.paid}}</span></div>
	-->
	
					<div data-stage="2" v-if="s && s.bars" :style="{width: s.bars.signup}" v-tippy :content="'Регистраций: {1}'|format($number(s.values.total))"><span>{{s.conversions.signup}}</span></div>
					<div data-stage="3" v-if="s && s.bars" :style="{width: s.bars.blocks}" v-tippy :content="'Добавили блоки: {1} из {2}'|format($number(s.values.blocks), $number(s.values.total))"><span>{{s.conversions.blocks}}</span></div>
	
					<div data-stage="1" v-if="s && s.bars" :style="{width: s.bars.installed_remove}" v-tippy :content="'Убрали ссылку: {1} из {2} ({3})'|format($number(s.values.installed_remove), $number(s.values.installed_once), s.conversions.installed_remove_local)"><span>{{s.conversions.installed_remove}}</span></div>
					<div data-stage="4" v-if="s && s.bars" :style="{width: s.bars.installed}" v-tippy :content="'Установлено ссылок: {1} из {2} ({3})'|format($number(s.values.installed), $number(s.values.installed_once), s.conversions.installed_local)"><span>{{s.conversions.installed}}</span></div>
					<div data-stage="5" v-if="s && s.bars" :style="{width: s.bars.paid}" v-tippy :content="'Оплатили: {1} из {2}'|format($number(s.values.paid), $number(s.values.total))"><span>{{s.conversions.paid}}</span></div>
		
				</div>
				<b-dropdown v-model="statisticsGroup" class="statistics-group-button" aria-role="list" position="is-bottom-left" v-if="!statisticsGroup">
					<div data-stage="0" style="width: 1.5rem;height: 1rem;position: absolute;top: 0;" slot="trigger" aria-role="listitem"></div>
					<b-dropdown-item value="">{{'Без групировки'|gettext}}</b-dropdown-item>
					<hr class="dropdown-divider">
					<b-dropdown-item v-for="(t, k) in statisticsGroups" :value="k">{{t}}</b-dropdown-item>
				</b-dropdown>
				</div>
				</div>
			</div>
			<div class="has-mt-2 has-mb-2 has-background-grey-light profiles-conversion-bar" v-else></div>
			</div>
		</div>

		<vue-component-filterbox @filter="onFilter" v-model="filter" :tags-fetch="tagsFetch" :disabled="isFetching" :allow-tags="filterTags" :with-filters="true" :with-buttons="true">
			<template slot="buttons">
				<a @click="openExportForm" class="button is-light is-fullwidth" v-tippy :content="'Скачать CSV-файл'|gettext" v-if="$auth.isAllowEndpoint('manager/profiles/export/info')"><i class="fa fas fa-download"></i></a>
			</template>
			
			<template slot="filters">
			<div class="row row-small">
				<div class="col-sm-3 has-mb-2">
					<vue-component-dropdown-checklist :list="dropdown_items" v-model="filter_values" @input="onFilter"></vue-component-dropdown-checklist>
				</div>
				
				<div class="col-xs-6 col-sm-3 has-mb-2">
					<div class="has-feedback">
						<b-datepicker :placeholder="'От'|gettext" v-model="date_from" icon="calendar-alt" :day-names="weekdays" :month-names="months" :first-day-of-week="first_day_week" @input="onInputDates"></b-datepicker>
						<a class="form-control-feedback has-text-grey-light" @click="date_from = null"><i class="fal fa-times"></i></a>	
					</div>
				</div>

				<div class="col-xs-6 col-sm-3 has-mb-2">
					<div class="has-feedback">
						<b-datepicker :placeholder="'До'|gettext" v-model="date_until" icon="calendar-alt" :day-names="weekdays" :month-names="months" :first-day-of-week="first_day_week" @input="onInputDates"></b-datepicker>
						<a class="form-control-feedback has-text-grey-light" @click="date_until = null"><i class="fal fa-times"></i></a>	
					</div>
				</div>
			</div>			
			</template>
		</vue-component-filterbox>

		<div class="container has-mb-3">
		<b-table paginated backend-pagination backend-sorting pagination-simple :data="profiles" :loading="isFetching" :per-page="perPage" :current-page="page" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" @sort="onSort" :row-class="rowClass" bordered>
			<b-table-column field="nickname" :label="'Профиль'|gettext" sortable v-slot="props">
				<div v-if="props.row.utm_source" class="has-text-warning is-pulled-right"><span class="">UTM: {{props.row.utm_source}}</span><span v-if="props.row.utm_medium || props.row.utm_campaign" class=""> / {{props.row.utm_medium}}</span><span v-if="props.row.utm_campaign" class=""> / {{props.row.utm_campaign}}</span></div>
				
				<span style="display: flex;align-items: center">
					<span class="iti__flag iti__flag-box" :class="'iti__'+props.row.country" style="display: inline-block" :title="props.row.country"></span>
					<span class="tag is-default" v-html="props.row.lang" style="width: 24px;margin: 0 .5rem"></span>
					<a @click="openForm(props.row.profile_id)" v-if="permissions.form" style="flex:1">{{ props.row.nickname }}</a>
					<span v-else>{{ props.row.nickname }}</span>

					
					<span v-if="props.row.profile_status_id == 5" class="has-text-danger" v-tippy :content="'Профиль заблокирован'|gettext"><i class="fa fa-exclamation-triangle"></i></span>
					<span class="tags has-ml-1" v-if="props.row.tags.length"><span v-for="tag in props.row.tags" class="tag">{{tag}}</span></span>
				</span>
				
			</b-table-column>
			<b-table-column field="weight" :label="'Вес'|gettext" cell-class="has-width-5" numeric v-slot="props">
				<span :class="{'has-text-grey-light': props.row.weight == 0}">{{ props.row.weight|number }}</span>
			</b-table-column>
			<b-table-column field="website_link" :label="'Ссылка'|gettext" cell-class="has-width-30" v-slot="props">
				<div>
				<span class="profile-stage" :data-stage="props.row.stage" v-tippy :content="stageTitle(props.row.stage)">{{props.row.stage}}</span>
				<a :href='props.row.website_link' target="_blank" :class="props.row.website_class" v-if="props.row.website_domain">{{ props.row.website_domain }}</a>
				<div class="tags is-pulled-right is-hidden-mobile">
					<span v-if="props.row.is_deleted" class="is-pulled-right tag is-warning" v-tippy :content="'Этот Instagram отключен'|gettext">&nbsp;<i class="fas fa-times"></i>&nbsp;</span>
					<span v-if="props.row.is_locked" class="is-pulled-right tag is-danger" v-tippy :content="'Этот профиль заблокирован'|gettext">&nbsp;<i class="fas fa-lock"></i>&nbsp;</span>
					<span v-if="!props.row.is_installed && props.row.is_installed_once" class="tag is-danger">remove</span>
					<a :href='props.row.taplink_link' target="_blank">
						<span class="tag is-warning" v-if="props.row.trial_tariff">trial</span>
						<vue-component-tariff-badge v-else v-model="props.row.tariff_current"/>
					</a>
				</div>
				</div>
			</b-table-column>
			<b-table-column field="followers" :label="'Подписчиков'|gettext" numeric sortable v-slot="props">
				<div class="tags is-pulled-left is-hidden-mobile">
					<a :href='props.row.instagram_link' target="_blank" v-if="props.row.has_username"><span class="tag is-dark">Instagram</span></a>
				</div>
				{{ props.row.followers|number }}
			</b-table-column>
			<b-table-column field="tms_created" :label="'Дата'|gettext" numeric sortable v-slot="props">
			{{ props.row.tms_created|date }}
			</b-table-column>
		</b-table>
	</div>
		
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-profiles-plan-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				profile_to: '', 
				allowMerge: false
			}
		},

		props: ['profile_id', 'profileForm'],
		mixins: [FormModel],

		methods: {
			updateData() {
				this.isUpdating = true;
				this.$api.post('manager/profiles/plans/transfer', {profile_from: this.profile_id, profile_to: this.profile_to, allow_merge: this.allowMerge}, this).then((data) => {
					if (data.result == 'success') {
						this.profileForm.fetchData();
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
			<p class="modal-card-title">{{'Перенос тарифа'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<b-field :label="'Имя профиля или ID'|gettext" :message="errors.profile_to" :class="{'has-error': errors.profile_to}" v-focus>
				<b-input v-model="profile_to">
			</b-field>
			<label class="checkbox"><input type="checkbox" v-model="allowMerge">Объединить тарифы</label>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Перенести'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("manager", "vue-manager-profiles-trial-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				tariff: '', 
				period: ''
			}
		},

		props: ['profile_id', 'profileForm'],
		mixins: [FormModel],

		mounted() {
		},
		

		methods: {
			updateData() {
				this.isUpdating = true;
				this.$api.post('manager/profiles/trial/set', {profile_id: this.profile_id, tariff: this.tariff, period: this.period}, this).then((data) => {
					if (data.result == 'success') {
						this.profileForm.fetchData();
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
			<p class="modal-card-title">{{'Активация пробного периода'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<b-field :label="'Тариф'|gettext" :message="errors.tariff" :class="{'has-error': errors.tariff}">
				<b-select v-model="tariff" expanded>
	                <option value="">-- {{'Выберите тариф'|gettext}} --</option>
	                <option value="pro">PRO</option>
	                <option value="business">BUSINESS</option>
				</b-select>
			</b-field>
			
			<b-field :label="'Период'|gettext" :message="errors.tariff" :class="{'has-error': errors.tariff}">
				<b-select v-model="period" expanded>
	                <option value="">-- {{'Выберите период'|gettext}} --</option>
	                <option value="3">3 days</option>
	                <option value="7">7 days</option>
	                <option value="14">14 days</option>
	                <option value="30">1 months</option>
	                <option value="90">3 months</option>
	                <option value="180">6 months</option>
	                <option value="365">1 year</option>
	                <option value="1825">5 years</option>
	                <option value="3650">10 years</option>
				</b-select>
			</b-field>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("manager", "vue-manager-questions-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				language_id: null,
				language_add_id: null,
				isAddFormOpened: false,
				variants: {language_id: {}},
				values: {locales: {}, questions_group_id: null},
				options: {
					theme: 'snow'					
				},
				
				currentTab: 'common',
				menu: {common: this.$gettext('Общие'), settings: this.$gettext('Настройки')},

			}
		},

		created() {
			this.$form.top.buttons = {save: {title: this.$gettext('Сохранить'), classname: 'is-primary', click: this.save, disabled: true}};
			this.$form.top.title = this.$gettext('Вопрос');
		},

		mounted() {
			this.fetchData(true);
		},
		
		props: ['question_id'],
		mixins: [FormModel],
		
		computed: {
			question() {
				return this.values.locales[this.language_id];
			},
		},
		
		watch: {
			isUpdating(v) {
				this.$form.top.buttons.save.classname = 'is-primary'+(v?' is-loading':'');
			},
			
			language_id(v) {
				this.$form.top.buttons.save.disabled = v?false:true;
			}
		},
		
		methods: {
			addLanguage() {
				this.values.locales[this.language_add_id] = {language_id: this.language_add_id, is_visible: true, is_visible_app: true, question: '', answer_doc: null};
				this.isAddFormOpened = false;
				this.language_id = this.language_add_id;
				this.language_add_id = null;
			},
			
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get(this.question_id?['manager/questions/get', 'manager/questions/info']:'manager/questions/info', {question_id: this.question_id}).then((data) => {
					this.isFetching = false;
					let r = data.response.questions;
					
					if (r.variants != undefined) this.variants = r.variants;
					
					if (r.values != undefined) {
						this.values = r.values;
						if (_.size(this.values.locales)) {
							this.language_id = _.keys(this.values.locales)[0];
						} else {
							this.isAddFormOpened = true;
						}
					} else {
						this.isAddFormOpened = true;
					}
				});
			},
			
			save() {
				this.isUpdating = true;
				this.$api.post('manager/questions/set', Object.assign(this.values, {question_id: this.question_id}), this).then((data) => {
					if (data.result == 'success') {
						this.$form.close()
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			}
		}, template: `
	<div>
		<div class="top-panel">
			<div class="container">
			<div class="scrolling-container is-submenu">
				<div style="overflow-x: scroll">
					<a v-for="(t, k) in menu" class="button" :class="{active: k == currentTab}" @click="currentTab = k">{{t|gettext}}</a>
				</div>
			</div>
			</div>
		</div>
		
		<div class="container has-mt-2 has-mb-2">
			<div class="level is-mobile">
				<div class="level-left">
					<div class="select has-mr-1" v-if="language_id != null">
						<select class="input" v-model="language_id" :disabled="isFetching">
							<option v-for="v in variants.language_id" :value="v.language_id" :disabled="values.locales[v.language_id] == undefined">{{v.language_title}}</option>
						</select>
					</div>
					<button class="button is-dark" @click="isAddFormOpened = true" :disabled="isFetching || (_.size(values.locales) == _.size(variants.language_id))"><i class="fa fa-plus"></i></button>
				</div>
<!--
				<div class="level-right" v-if="language_id != null">
					<mx-toggle v-model="values.locales[language_id].is_draft" :title="'Черновик'|gettext" :disabled="isFetching"></mx-toggle>
				</div>
-->
			</div>
			
			<hr class="is-hidden-mobile">
		</div>		

		
		<div class="container has-mb-2" v-show="currentTab == 'common'" :style="{height:isFetching?'250px':'unset'}">
			<div v-if="language_id != null">
				<b-field label="Вопрос">
	            	<b-input v-model="question.question"></b-input>
				</b-field>
				<b-field :label="'Ответ'|gettext" :message="errors.body" :class="{'has-error': errors.body}">
				<vue-component-htmleditor v-model="question.answer_doc"></vue-component-htmleditor>
				</b-field>
			</div>
		</div>
		
		<section class="container has-mb-2" v-if="currentTab == 'settings'">
			<b-field :label="'Группа'|gettext">
			<b-select v-model="values.questions_group_id">
				<optgroup :label="p.questions_part_title" v-for="p in variants.groups">
					<option :value="g.questions_group_id" v-for="g in p.groups">{{g.questions_group_title}}</option>
				</optgroup>
			</b-select>
			</b-field>
			<mx-toggle v-model="question.is_visible" :title="'Показывать'|gettext"></mx-toggle>
			<mx-toggle v-model="question.is_visible_app" :title="'Показывать в справочном центре'|gettext"></mx-toggle>
		</section>
		
		<b-modal v-model="isAddFormOpened" :has-modal-card="true">
	    	<div class="modal-card has-text-black" style="font-size: 1rem">
	        	<header class="modal-card-head"><p class="modal-card-title">{{'Добавление языка'|gettext}}</p> <button type="button" class="modal-close is-large" @click="isAddFormOpened = false"></button></header>
	            <section class="modal-card-body">
		            <b-select :placeholder="'Язык'|gettext" v-model="language_add_id" :disabled="isFetching">
						<option v-for="v in variants.language_id" :value="v.language_id" v-if="values.locales[v.language_id] == undefined">{{v.language_title}}</option>
		            </b-select>
	            </section>
				<div class="modal-card-foot">
					<button type="button" class="button is-dark" @click="isAddFormOpened = false">{{'Закрыть'|gettext}}</button>
					<button type="button" class="button is-primary" @click="addLanguage" :disabled="language_add_id == null">{{'Доабвить'|gettext}}</button>
				</div>	
	        </div>
	    </b-modal>

		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("manager", "vue-manager-questions-groups-form", {data() {
			return {
				currentLanguage: 'ru',
				languages: {},
				parts: {},
				currentTab: null,
				isUpdating: false,
				isFetching: false,
			}
		},

		created() {
			this.fetchData(true);
		},

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('manager/questions/groups/get').then((data) => {
					this.isFetching = false;
					this.parts = data.response.questions.parts;
					this.languages = data.response.questions.languages;
				});
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('manager/questions/groups/set', {parts: this.parts}).then((data) => {
					this.isUpdating = false;
					this.$parent.close();
				});
			},
			
			doAddGroup(p) {
				let titles = {};
				_.each(this.languages, (l) => { titles[l.language_code] = ''; });
				
				p.groups.push({questions_group_title: titles});
			},
			
			doAddPart() {
				let titles = {};
				_.each(this.languages, (l) => { titles[l.language_code] = ''; });

				this.parts.push({questions_part_name: '', questions_part_title: titles, groups: []});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">Группы</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>

		<ul class="nav nav-tabs has-text-left">
			<li :class="{active: currentLanguage == l.language_code}" v-for="l in languages"><a @click="currentLanguage = l.language_code">{{l.language_title}}</a></li>
		</ul>
						
		<section class="modal-card-body">
			
			<sortable-list class="form-fields-item-list" lockAxis="y" v-model="parts" use-drag-handle>
			<sortable-item v-for="(p, i) in parts" class="form-fields-item is-narrow" :index="i" :key="i" :item="p">
				<div class="form-fields-item-title has-background-white">
					<div v-sortable-handle class="form-fields-item-handle"></div>
					<span class="row">
						<div class="col-xs">
							<input type="text" class="input" v-model="p.questions_part_title[currentLanguage]">
						</div>
						<div class="col-xs col-sm-5">
							<input type="text" class="input" v-model="p.questions_part_name" placeholder="Имя папки" :disabled="currentLanguage != 'ru'">
						</div>
<!-- 						<div class="col-xs col-shrink"><button class="button has-text-danger is-text" :class="{disabled: isReadonly}"><i class="fa fa-trash-alt"></i></button></div> -->
					</span>
					
					<div style="margin-left: 3rem">
					<sortable-list class="form-fields-item-list" lockAxis="y" v-model="p.groups" use-drag-handle>
					<sortable-item v-for="(g, j) in p.groups" class="form-fields-item is-narrow" :index="j" :key="j" :item="g">
					<div class="form-fields-item-title has-background-white">
					<div v-sortable-handle class="form-fields-item-handle"></div>
					<span class="row">
						<div class="col-xs">
							<input type="text" class="input" v-model="g.questions_group_title[currentLanguage]">
						</div>
						<div class="col-xs col-sm-5">
							<input type="text" class="input" v-model="g.questions_group_name" placeholder="Имя подпапки" :disabled="currentLanguage != 'ru'">
						</div>
					</span>
					</div>
					</sortable-item>
					</sortable-list>
					<a @click="doAddGroup(p)" class="button is-default is-small has-mb-1 has-mt-1">Добавить группу</a>
					</div>
				</div>
			</sortable-item>
			</sortable-list>
			<a @click="doAddPart" class="button is-default is-small has-mb-1 has-mt-1">Добавить раздел</a>
			
			
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("manager", "vue-manager-questions-list", {data() {
			return {
				isFetching: false,
				isSortable: false,
				variants: {groups: [], language_id: {}},
				filter: {query: ''},
				filter_questions_group_id: '',
				perPage: 100,
				action: null
			}
		},
		
		props: ['page_id'],
		
		mixins: [ListModel, SortableTable],
		
		created() {
			this.$io.on('events:manager.questions.list:refresh', this.refresh);
			
			this.fetchData(true, true);
		},
		
		destroyed() {
			this.$io.off('events:manager.questions.list:refresh', this.refresh);
		},
		
		methods: {
			onDropdown(v) {
				switch (v) {
					case 'newgroup': 
						this.$modal('vue-manager-questions-groups-form');
						break;
					case 'resort':
						this.isSortable = true;
						break;
				}
			},
			
/*
			refresh() {
				this.clearPages();
				this.fetchData(false, false, true);
			},
*/
			
			openForm(row) {
				this.$form.open('vue-manager-questions-form', {question_id: row.question_id});
// 	            this.$modal('vue-manager-questions-form', {question_id: row.question_id}, this);
            },
            
			fetchData(withLoading, firstLoading, force) {
				if (force || !this.checkCache()) {
					this.isFetching = withLoading;
					this.$api.get(firstLoading?['manager/questions/list', 'manager/questions/info']:'manager/questions/list', {next: this.next, count: this.perPage, filter: {questions_group_id: this.filter_questions_group_id, query: this.filter.query}}).then((data) => {
						this.cachePage(data.response.questions);
						if (firstLoading) this.variants = data.response.questions.variants;
						this.isFetching = false;
					}).catch((error) => {
	                    this.fields = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
                }
			},
			
			onReSort(oldIndex, newIndex, oldItem, newItem) {
	            this.isFetching = true;
				this.$api.get('manager/questions/sort', {question_id: oldItem.question_id, index_question_id: newItem.question_id, questions_group_id: this.filter_questions_group_id}, this).then((data) => {
		            this.isFetching = false;
				});
			},
			
			onPageChange(page) {
                this.page = page
                this.fetchData()
            }
		}, template: `
	<div>
		<vue-component-submenu menu="manager.cms" :page_id="page_id"></vue-component-submenu>
		
		<vue-component-filterbox :showToolbar="isSortable" @dropdown="onDropdown" v-model="filter" @filter="refresh" :disabled="isFetching" :with-dropdown="true" :with-buttons="true">
			<template slot="toolbar">
				<a @click="isSortable = false" class="button is-dark"><i class="fal fa-check has-mr-2"></i> Завершить сортировку</a> 
			</template>
			
			<template slot="dropdown">
				<b-dropdown-item value="newgroup"><i class="fal fa-layer-group has-text-centered has-mr-1"></i> Настроить группы</b-dropdown-item>
				<b-dropdown-item value="resort" :disabled="filter.query != '' || filter_questions_group_id == ''"><i class="fal fa-arrows has-text-centered has-mr-1"></i> Сортировать</b-dropdown-item>
			</template>
			
			<template slot="buttons">
			<div class="row row-small">
				<div class="col-xs">
				<span class="select is-fullwidth">
				<select v-model="filter_questions_group_id" @change="refresh">
					<option value="">-- Все группы --</option>
					<optgroup :label="p.questions_part_title" v-for="p in variants.groups">
						<option :value="g.questions_group_id" v-for="g in p.groups">{{g.questions_group_title}}</option>
					</optgroup>
				</select>
				</span>
				</div>
				<div class="col-xs">
					<a @click="$form.open('vue-manager-questions-form')" class="button is-primary is-fullwidth"><i class="fa fa-plus-circle"></i> {{'Добавить вопрос'|gettext}}</a>
				</div>
			</div>
			</template>
		</vue-component-filterbox>

		<div class="container">
		<div class="has-mb-2">
			
<!-- 		custom-row-key1="question_id" -->
		<b-table paginated backend-pagination pagination-simple :data="fields" :loading="isFetching" :per-page="perPage" :total="total" @page-change="onPageChange" :class="{'is-sortable': isSortable}" hoverable bordered :draggable="isSortable" @dragstart="rowDragStart" @drop="rowDrop" @dragover="rowDragOver" @dragleave="rowDragLeave" @click="openForm">
			
			<b-table-column field="question" label="Вопрос" v-slot="props">
				<span class="is-pulled-right tags is-hidden-mobile"><span v-for="l in variants.language_id" class="tag" :class="{'is-dark': props.row.languages[l.language_id] != undefined}">{{l.language_code}}</span></span>
<!-- 				<span class="is-pulled-right tags"><span class="tag is-default" v-for="lg in props.row.languages">{{variants.languages[lg].language_code}}</span></span> -->
					<div>
						<div>{{props.row.question}}</div>
						<div class="has-text-grey">{{props.row.groupname}}</div>
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

		</b-table>
		
		</div>
		</div>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-security-form", {data() {
			return {
				action: false,
				isFetching: false,
				isUpdating: false,
				values: {html: []},
				rules: [],
				pages: [],
				profiles: [],
				profilesSelected: [],
				rulesSelected: [],
				page_id: null,
				allow: {
					suspend: this.$auth.isAllowEndpoint('manager/security/suspend')
				}
			}
		},
		
		props: {profile_id: Number, owner: String},
				
		created() {
			this.fetchData();
		},
		
		watch: {
			page_id(v, w) {
				if (w) this.fetchData();
			},
			
			profile_id() {
				this.page_id = null;
				this.profilesSelected = [];
				this.rulesSelected = [];
			}
		},
		
		methods: {
			update() {
				this.isUpdating = true;
				this.$api.get('manager/security/update', {profile_id: this.profile_id, message: this.values.message, comments: this.values.comments}).then((d) => {
					this.isUpdating = false;
					this.fetchDataResponse(d);
				});
			},
			
			selectAllProfiles() {
				this.profilesSelected = _.map(this.profiles, 'profile_id');
			},
			
			fetchData() {
				this.isFetching = true;
				this.$api.get('manager/security/get', {profile_id: this.profile_id, page_id: this.page_id}).then((d) => {
					this.fetchDataResponse(d);
				});
			},
			
			fetchDataResponse(d) {
				let r = d.response;
				if (d.result == 'success') {
					this.values = r.values;
					this.rules = r.rules;
					this.profiles = r.profiles;
					this.pages = r.pages;
					this.page_id = r.values.page_id;
					this.isFetching = false;
					this.profilesSelected = [r.values.profile_id];
				}
			},
			
			checkNext(d) {
				if (this.owner == 'security') {
					if (d.response.next) {
						this.$parent.profile_id = d.response.next;
						this.$parent.page_id = null;
						this.$parent.fetchData();
					} else {
						this.$parent.$parent.close();
					}
				} else {
					this.fetchData();
				}
			},
						
			suspend() {
				this.$confirm('Вы уверены что хотите заблокировать эту ссылку?', 'is-danger').then(() => {
					this.action = 'suspend';
					this.isFetching = true;
					this.$api.post('manager/security/suspend', {profile_id: this.profile_id, profiles: this.profilesSelected, rules: _.map(this.rulesSelected, (i) => this.rules[i])}).then((d) => {
						this.checkNext(d);
						this.action = false;
					});
				});
			},
			
			skip() {
				this.action = 'skip';
				this.isFetching = true;
				this.$api.get('manager/security/skip', {profile_id: this.profile_id}).then((d) => {
					this.checkNext(d);
					this.action = false;
				});
			},
			
			good() {
				this.action = 'good';
				this.isFetching = true;
				this.$api.get('manager/security/good', {profile_id: this.profile_id}).then((d) => {
					this.checkNext(d);
					this.action = false;
				});
			},
			
			nope() {
				this.action = 'nope';
				this.isFetching = true;
				this.$api.get('manager/security/nope', {profile_id: this.profile_id}).then((d) => {
					this.checkNext(d);
					this.action = false;
				});
			}
		}, template: `
	<section class="modal-card-body modal-card-body-blocks">
		<section>
			<div class="row row-small">
				<div :class="{'col-xs-3': owner == 'security', 'col-xs-4': owner != 'security'}"><button class="button is-danger level-item is-fullwidth" :class="{'is-loading': action == 'suspend'}" type="button" @click="suspend" :disabled="!allow.suspend || action || (values.profile_status_id == 5)">Заблокировать</button></div>
				<div :class="{'col-xs-3': owner == 'security', 'col-xs-4': owner != 'security'}"><button class="button is-warning level-item is-fullwidth" :class="{'is-loading': action == 'skip'}" type="button" @click="skip" :disabled="!allow.suspend || action">Нейтрально</button></div>
				<div :class="{'col-xs-3': owner == 'security', 'col-xs-4': owner != 'security'}"><button class="button is-success level-item is-fullwidth" :class="{'is-loading': action == 'good'}" type="button" @click="good" :disabled="!allow.suspend || action">Хороший</button></div>
				<div class="col-xs-3" v-if="owner == 'security'"><button class="button is-dark level-item is-fullwidth" type="button" @click="nope" :disabled="!allow.suspend || (values.profile_status_id == 5)">Не знаю</button></div>
			</div>
		</section>
		
		<section>
			<div v-if="values.profile_status_id == 5">
				<div class="message is-danger">
					<div class="message-body">
						<h4 class="has-mb-1" style="font-weight: bold">{{'Данная страница заблокирована'|gettext}}</h4>
						<b>{{'Причины'|gettext}}:</b><br>
						<ul style="list-style:decimal-leading-zero;margin-left: 3rem">
							<li v-for="r in values.reasons"><span :style="r.block_id?'':'text-decoration: line-through'">{{r.reason}}</span><span v-if="!r.block_id" class="has-ml-2 has-text-danger">({{'Убрали'|gettext}})</span></li>
						</ul>
					</div>
				</div>
				
				<b-field label="Сообщение на странице">
					<textarea v-model="values.message" class="input" :disabled="!allow.suspend"></textarea>
				</b-field>

				<b-field label="Комментарий">
					<textarea v-model="values.comments" class="input" :disabled="!allow.suspend"></textarea>
				</b-field>
				
				<button v-if="allow.suspend" class="button is-success" :class="{'is-loading': isUpdating}" v-if="allow.suspend" @click="update">{{'Сохранить'|gettext}}</button>
			</div>
			<div v-else>
				<div class="message is-danger" v-if="_.size(values.html)">
					<div class="message-body"><a @click="$modal('vue-manager-security-html-form', {html: values.html})">{{'HTML-код на странице'|gettext}} ({{_.size(values.html)}})</a></div>
				</div>
			
				<div class="row">
					<div class="col-sm-6">
						<label class="label">{{'На странице'|gettext}}</label>
						<b-table :data="rules" :paginated="false" class="has-mb-2">
							<b-table-column field="type" label="type" v-slot="props"><b-checkbox v-model="rulesSelected" :native-value="props.index" :disabled="!allow.suspend">{{props.row.type}}</b-checkbox></b-table-column>
							<b-table-column field="method" label="method" v-slot="props">{{props.row.method}}</b-table-column>
							<b-table-column field="rule" label="rule" v-slot="props">
								<a :href="'http://'+props.row.rule" target="_blank">{{props.row.rule}}</a> <a :href="'https://developers.facebook.com/tools/debug/?q='+encodeURI(props.row.rule)" target="_blank"><i class="far fa-external-link-square-alt"></i></a>
							</b-table-column>
							
	<!-- 						<b-table-column label="Действие"><button class="button is-small is-danger" @click="sendRule(props.row)">Заблокировать</button></b-table-column> -->
							
							<template slot="empty">
								<div class="has-text-grey-light has-text-centered">Ссылок нет</div>
							</template>
						</b-table>
						
						<label class="label">{{'Другие профили с данного IP'|gettext}}</label>
						<b-table :data="profiles" :paginated="false" class="has-mb-2">
							<b-table-column :label="'Имя'|gettext" v-slot="props">
								<b-checkbox v-model="profilesSelected" :native-value="props.row.profile_id" :disabled="!allow.suspend">{{props.row.username}}</b-checkbox><span v-if="props.row.profile_status_id == 5" class="has-text-danger has-ml-1" v-tippy :content="'Профиль заблокирован'|gettext"><i class="fa fa-exclamation-triangle"></i>
							</b-table-column>
							<b-table-column field="link" label="link" v-slot="props">
								<a :href="props.row.link" target="_blank" class="{disabled: props.row.profile_id == profile_id}">Открыть</a>
							</b-table-column>
							<template slot="empty">
								<div class="has-text-grey-light has-text-centered">{{'Других профилей нет'|gettext}}</div>
							</template>
						</b-table>
						
						<button class="button is-light" @click="selectAllProfiles" :disabled="profiles.length == 0 || !allow.suspend">Выбрать все</button>
					</div>
					<div class="col-sm-6">
						<label class="label">{{'Страницы'|gettext}}</label>
						<div class="field has-addons">
						<b-select v-model="values.page_id" class="has-mb-2" v-model="page_id" expanded :disabled="_.size(pages) == 1 || isFetching">
							<option v-for="(v, k) in pages" :value="k">{{v}}</option>
						</b-select>
						<p class="control">
							<a :href='values.link' class="button is-light" target="_blank" :disabled="isFetching"><i class="fa fa-external-link"></i></a>
						</p>
						</div>
						<div class="has-text-centered">
						<div class="device is-black"> 
							<div class="screen is-clipped" style="width: 262px;height: 466px">
								<iframe class="counter-page" scrolling="no" :src="values.link+'?static=1'" v-if="!isFetching" style="transform: scale(.5);transform-origin: 0 0;min-width: 524px;min-height: 932px"></iframe> 
							</div>
						</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	</section>
`});

window.$app.defineComponent("manager", "vue-manager-security-history", {data() {
			return {
				isFetching: false,
				filter: {query: '', tags: []},
				statuses: {
					2: {title: 'Нейтрально', classname: 'warning'}, 
					3: {title: 'Хорошо', classname: 'success'}, 
					5: {title: 'Заблокировано', classname: 'danger'}
				},
                sortField: 'tms',
                sortOrder: 'desc',
				perPage: 100
			}
		},
		
		props: ['page_id'],

		mixins: [ListModel],
		
		created() {
			this.fetchData(true);
		},

		methods: {
			fetchData(withLoading, force) {
				if (force || !this.checkCache()) {
					this.isFetching = withLoading;
					
					this.$api.get('manager/security/history', {next: this.next, count: this.perPage, filter: this.filter, sort_field: this.sortField, sort_order: this.sortOrder}).then((data) => {
						this.cachePage(data.response.history);
						this.isFetching = false;
					}).catch((error) => {
	                    this.fields = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
                }

			},
            
            clickRow(row) {
	            this.$modal('vue-manager-profiles-form', {profile_id: row.profile_id, currentTab: 'security', owner: 'security'}, this);
            }
		}, template: `
	<div>
		<vue-component-submenu menu="manager.security" :page_id="page_id"></vue-component-submenu>
<!-- 		<vue-component-filterbox @filter="onFilter" :tags-fetch="tagsFetch" :allow-tags="filterTags" v-model="filter" :disabled="isFetching"></vue-component-filterbox> -->
				
		<div class="container has-mt-3">
		<div class="has-mb-2">
		<b-table paginated backend-pagination backend-sorting pagination-simple :data="fields" :loading="isFetching" :per-page="perPage" :current-page="page" :total="total" @sort="onSort" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" hoverable bordered @click="clickRow">
			
			<b-table-column field="username" label="Профиль" v-slot="props">
				<span class="iti__flag iti__flag-box" :class="'iti__'+props.row.country" style="display: inline-block" :title="props.row.country"></span>
				<span class="tag is-default" v-html="props.row.lang" style="width: 24px;margin: 0 .5rem"></span>
				{{ props.row.username }}
			</b-table-column>
			
			<b-table-column label="Статус" v-slot="props">
				<span :class="'has-text-'+statuses[props.row.data.status_id].classname">{{statuses[props.row.data.status_id].title}}</span>
			</b-table-column>
			
			<b-table-column label="Кто" v-slot="props">
				{{props.row.owner_email}}
			</b-table-column>
			
			<b-table-column field="tms" :label="'Дата'|gettext" numeric sortable v-slot="props">
			{{ props.row.tms|datetime}}
			</b-table-column>
			
			

<!--
			<b-table-column field="hits" label="Посетители" numeric>{{ props.row.hits|number }}</b-table-column>
			<b-table-column field="Followers" label="Followers" numeric>{{ props.row.followers|number }}</b-table-column>

			<b-table-column field="hf" label="Hits / Followers" numeric>
				{{ props.row.hf|number }}
			</b-table-column>
-->
			
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
		
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-security-html-form", {props: ['html'],
		
		created() {
			console.log(this.html);
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">HTML</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
			
		</header>
		<section class="modal-card-body modal-card-body-blocks">
			<section v-for="h in html">
				<vue-component-codemirror v-model="h" mode="text/html" readonly="true"></vue-component-codemirror>
			</section>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark level-item" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-security-list", {data() {
			return {
				isFetching: false,
				filter: {query: '', tags: []},
				perPage: 100
			}
		},
		
		props: ['page_id'],

		mixins: [ListModel],

		created() {
			this.$io.on('events:manager.security.list:refresh', this.refresh);

			this.fetchData(true);
		},

		destroyed() {
			this.$io.off('events:manager.security.list:refresh', this.refresh);
		},	

		methods: {
			refresh() {
				this.clearPages();
				this.fetchData(false, true);
			},
			
			fetchData(withLoading, force) {
				if (force || !this.checkCache()) {
					this.isFetching = withLoading;
					
					this.$api.get('manager/security/list', {next: this.next, count: this.perPage, filter: this.filter}).then((data) => {
						this.cachePage(data.response.locking);
						this.isFetching = false;
					}).catch((error) => {
	                    this.fields = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
                }

			},

			onPageChange(page) {
                this.page = page
                this.fetchData()
            },
            
            clickRow(row) {
	            this.$modal('vue-manager-profiles-form', {profile_id: row.profile_id, currentTab: 'security', owner: 'security'}, this);
            }
		}, template: `
	<div>
		<vue-component-submenu menu="manager.security" :page_id="page_id"></vue-component-submenu>
<!-- 		<vue-component-filterbox @filter="onFilter" :tags-fetch="tagsFetch" :allow-tags="filterTags" v-model="filter" :disabled="isFetching"></vue-component-filterbox> -->
				
		<div class="container has-mt-3">
		<div class="has-mb-2">
		<b-table paginated backend-pagination pagination-simple :data="fields" :loading="isFetching" :per-page="perPage" :current-page="page" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" hoverable bordered @click="clickRow">
			
			<b-table-column field="username" label="Профиль" v-slot="props">
				<span class="iti__flag iti__flag-box" :class="'iti__'+props.row.country" style="display: inline-block" :title="props.row.country"></span>
				<span class="tag is-default" v-html="props.row.lang" style="width: 24px;margin: 0 .5rem"></span>
				{{ props.row.username }}
			</b-table-column>

<!--
			<b-table-column field="hits" label="Посетители" numeric>{{ props.row.hits|number }}</b-table-column>
			<b-table-column field="Followers" label="Followers" numeric>{{ props.row.followers|number }}</b-table-column>

			<b-table-column field="hf" label="Hits / Followers" numeric>
				{{ props.row.hf|number }}
			</b-table-column>
-->
			
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
		
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-statistics-history", {data() {
			return {
				isUpdating: false,
				perPage: 100,
				statistics: null,
				currentTab: 'list'
			}
		},

		mixins: [ListModel],

		created() {
			this.fetchData(true);
		},

		props: ['date', 'target'],
		mixins: [ListModel],

		methods: {
			setTab(n) {
				this.currentTab = n;
			},
			
			onPageChange(page) {
                this.page = page;
                this.fetchData(false);
            },
            
			fetchData(withLoading, force) {
				this.isFetching = withLoading;
				
				let resolve = (data) => {
					if (data.statistics != undefined) {
						this.statistics = data.statistics;
					}
					
					this.fields = data.fields;
					this.isFetching = false;
				}
				
				if (force || !this.checkCache(resolve)) {
					this.$api.get('manager/statistics/history/list', {date: this.date, target: this.target, next: this.next}).then((data) => {
						this.isFetching = false;
						this.cachePage(data.response.history, resolve);
					});
				}

			}
		}, template: `
	<div class="modal-card modal-card-large">
		<header class="modal-card-head">
			<p class="modal-card-title" v-if="target == 'install'">{{'История установок'|gettext}} {{date}}</p>
			<p class="modal-card-title" v-else>{{'История удалений'|gettext}} {{date}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		
		<ul class="nav nav-tabs has-text-left">
			<li :class="{active: currentTab == 'list'}"><a @click="setTab('list')">{{'Список'|gettext}}</a></li>
			<li :class="{active: currentTab == 'statistics'}"><a @click="setTab('statistics')">{{'Статистика'|gettext}}</a></li>
		</ul>
				
		<section class="modal-card-body" v-if="currentTab == 'list'">
			<b-table :data="fields" paginated backend-pagination pagination-simple :per-page="perPage" :current-page="page" :total="total" @page-change="onPageChange">
				<b-table-column :label="'Имя пользователя'|gettext" v-slot="props"><a @click="$modal('vue-manager-profiles-form', {profile_id: props.row.profile_id});">{{ props.row.username }}</a></b-table-column>
				<b-table-column :label="'Домен'|gettext" v-slot="props"><span v-if="props.row.website_domain_history">{{ props.row.website_domain_history }}</span><span class="has-text-grey" v-else>{{'Пусто'|gettext}}</span></b-table-column>
				<b-table-column :label="'Домен сейчас'|gettext" v-slot="props"><span v-if="props.row.website_domain" class="has-text-grey-light">{{ props.row.website_domain }}</span><span class="has-text-grey-light" v-else>{{'Пусто'|gettext}}</span></b-table-column>
				<b-table-column :label="'Подписчиков'|gettext" numeric v-slot="props">{{ props.row.followers|number }}</b-table-column>
				<template slot="empty">
					<div class="has-text-grey-light has-text-centered">{{'Список пуст'|gettext}}</div>
				</template>
			</b-table>	
		</section>
		
		<section class="modal-card-body" v-if="currentTab == 'statistics'">
			<b-table :data="statistics">
				<b-table-column :label="'Изменение'|gettext" v-slot="props"><span v-if="props.row.website_domain">{{ props.row.website_domain }}</span><span class="has-text-grey" v-else>{{'Пусто'|gettext}}</span></b-table-column>
				<b-table-column :label="'Количество'|gettext" numeric v-slot="props">{{ props.row.amount|number }}</b-table-column>
				<template slot="empty">
					<div class="has-text-grey-light has-text-centered">{{'Список пуст'|gettext}}</div>
				</template>
			</b-table>	
		</section>
				
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("manager", "vue-manager-statistics-list", {data() {
			return {
				isFetching: false,
				perPage: 50,
				period: 'month',
				segment: 'day',
				is_allow_payments: false
			}
		},
		
		mixins: [ListModel],

		created() {
			this.fetchData(true);
		},
		
		watch: {
			period() {
				this.clearPages();
				this.fetchData(true, true);
			},
			
			segment() {
				this.clearPages();
				this.fetchData(true, true);
			}
		},

		methods: {
			showInstalled(date) {
				this.$modal('vue-manager-statistics-history', {date: date, target: 'install'}, this);
			},
			
			showUninstalled(date) {
				this.$modal('vue-manager-statistics-history', {date: date, target: 'uninstall'}, this);
			},
			
			fetchData(withLoading, force) {
				let resolve = (data) => {
					this.fields = data.fields
					this.is_allow_payments = data.is_allow_payments;
					this.isFetching = false;
				}

				if (force || !this.checkCache(resolve)) {				
					this.isFetching = withLoading;
					
					this.$api.post('manager/statistics/list', {next: this.next, count: this.perPage, period: this.period, segment: this.segment}).then((data) => {
						this.cachePage(data.response.statistics, resolve);
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
		<div class="container has-mb-2 has-mt-2">
			<div class="row">
			<div class="col-sm-5 col-md-4 col-xs-12 has-xs-mb-2">
				<b-field class="has-tabs-style">
		            <b-radio-button v-model="period" type="active" class="is-expanded" native-value="month">{{'Месяц'|gettext}}</b-radio-button>
		            <b-radio-button v-model="period" type="active" class="is-expanded" native-value="quarter">{{'Квартал'|gettext}}</b-radio-button>
		            <b-radio-button v-model="period" type="active" class="is-expanded" native-value="year">{{'Год'|gettext}}</b-radio-button>
		            <b-radio-button v-model="period" type="active" class="is-expanded" native-value="all">{{'Все'|gettext}}</b-radio-button>
				</b-field>
			</div>
			
			<div class="col-sm-5 col-sm-offset-2 col-md-offset-3 col-lg-3 col-lg-offset-5 has-mb-2 col-xs-12">
				<b-field class="has-tabs-style">
		            <b-radio-button v-model="segment" type="active" class="is-expanded" native-value="day">{{'По дням'|gettext}}</b-radio-button>
		            <b-radio-button v-model="segment" type="active" class="is-expanded" native-value="month">{{'По месяцам'|gettext}}</b-radio-button>
		            <b-radio-button v-model="segment" type="active" class="is-expanded" native-value="year">{{'По годам'|gettext}}</b-radio-button>
				</b-field>
			</div>			
			</div>
			
			
		<b-table paginated backend-pagination pagination-simple bordered :data="fields" :loading="isFetching" :per-page="perPage" :total="total" @page-change="onPageChange">
			<b-table-column :label="'Дата'|gettext" cell-class="has-width-10" v-slot="props">{{ props.row.tms }}</b-table-column>
			<b-table-column :label="'Регистрации'|gettext" cell-class="has-width-5" numeric v-slot="props">{{ props.row.amount|number }}</b-table-column>
			<b-table-column :label="'Установили'|gettext" cell-class="has-width-10" numeric v-slot="props"><div><span class="is-pulled-left has-text-grey-light has-mr-1">{{ props.row.amount_install_once/props.row.amount*100|decimal }}%</span> {{ props.row.amount_install_once|number }}</div></b-table-column>
			<b-table-column :label="'Убрали'|gettext" cell-class="has-width-10" numeric v-slot="props"><div><span class="is-pulled-left has-text-grey-light has-mr-1">{{ (props.row.amount_install_once - props.row.amount_install)/props.row.amount_install_once*100|decimal }}%</span>{{ props.row.amount_install_once - props.row.amount_install|number }}</div></b-table-column>
			<b-table-column :label="'Установки всего'|gettext" cell-class="has-width-15" numeric v-slot="props"><div><span class="is-pulled-left has-text-grey has-mr-2-mobile">{{ props.row.is_installed_followers|number }}</span><a @click="showInstalled(props.row.tms)" v-if="segment == 'day'">{{ props.row.is_installed|number }}</a><span v-else>{{ props.row.is_installed|number }}</span></div></b-table-column>
			<b-table-column :label="'Удаления всего'|gettext" cell-class="has-width-15" numeric v-slot="props"><div><span class="is-pulled-left has-text-grey has-mr-2-mobile">{{ props.row.is_uninstalled_followers|number }}</span><a @click="showUninstalled(props.row.tms)" v-if="segment == 'day'">{{ props.row.is_uninstalled|number }}</a><span v-else>{{ props.row.is_uninstalled|number }}</span></div></b-table-column>
			<b-table-column :label="'Рост'|gettext" numeric cell-class="has-width-15" v-slot="props"><div :class="{'has-text-success': props.row.is_installed - props.row.is_uninstalled > 0, 'has-text-danger': props.row.is_installed - props.row.is_uninstalled < 0}"><span class="is-pulled-left has-mr-2-mobile" :class="{'has-text-danger': props.row.is_installed_followers < props.row.is_uninstalled_followers, 'has-text-grey': props.row.is_installed_followers >= props.row.is_uninstalled_followers}">{{ props.row.is_installed_followers - props.row.is_uninstalled_followers|number }}</span>{{ props.row.is_installed - props.row.is_uninstalled|number }}</div></b-table-column>
			<b-table-column :label="'Оплаты'|gettext" numeric v-if="is_allow_payments" v-slot="props">
				<span>
				<span v-for="v in props.row.budget" class='table-price'>
					{{ v.budget|number }}<span class="has-text-grey-light"> {{v.currency_title}}</span> 
				</span>
				</span>
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

window.$app.defineComponent("manager", "vue-manager-users-form", {data() {
			return {
				currentTab: 'privileges',
				isFetching: false,
				isUpdating: false,
				info: [],
				privileges: [],
				sets: [],
				allows: []
			}
		},
		
		props: ['account_id'],
		mixins: [FormModel],
		
		created() {
			this.fetchData(true);
		},
		
		methods: {
			setTab(n) {
				this.currentTab = n;
			},
			
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('manager/users/get', {account_id: this.account_id}).then((data) => {
					this.isFetching = false;
					if (data.result == 'success') {
						let u = data.response.users;
						this.privileges = u.privileges;
						this.allows = u.allows;
						this.sets = u.sets;
						this.info = u.info;
					}
				});
			},
			
			save() {
				this.isUpdating = true;
				this.$api.post('manager/users/set', {account_id: this.account_id, sets: this.sets, info: this.info}).then((data) => {
					this.isUpdating = false;
					this.$parent.close();
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">Пользователь</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		
		<ul class="nav nav-tabs has-text-left">
			<li :class="{active: currentTab == 'privileges'}"><a @click="setTab('privileges')">{{'Права'|gettext}}</a></li>
			<li :class="{active: currentTab == 'info'}"><a @click="setTab('info')">{{'Информация'|gettext}}</a></li>
		</ul>
		
		<section class="modal-card-body modal-card-body-blocks" v-if="currentTab == 'privileges'">
			<section class="message is-warning" v-if="!isFetching">
				<div class="message-body">{{info.email}}</div>
			</section>
			<section>
			<div class="row">
				<div class="col-xs-12 col-sm-6" v-for="g in privileges">
					<div class="has-mb-2 checkbox-list">
						<label class="is-block label has-text-grey">{{g.title}}</label>
						<label class="is-block checkbox" v-for="p in g.list" :class="{disabled: allows.indexOf(p.privilege_id) == -1}"><input type='checkbox' v-model="sets" :disabled="allows.indexOf(p.privilege_id) == -1" :value="p.privilege_id"> {{p.title}}</label>
					</div>
				</div>
			</div>
			</section>
		</section>
		
		<section class="modal-card-body modal-card-body-blocks" v-if="currentTab == 'info'">
			<section>
			<b-field :label="'Имя:'|gettext" :message="errors.fullname" :class="{'has-error': errors.fullname}">
				<b-input type="text" v-model="info.fullname"></b-input>
			</b-field>
			
			<mx-toggle v-model="info.is_active" :title="'Пользователь активен'|gettext"></mx-toggle>
			</section>
		</section>
				
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-success" type="button" @click="save" :class="{'is-loading': isUpdating}" :disabled="isFetching || !allows.length">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>		
	</div>
`});

window.$app.defineComponent("manager", "vue-manager-users-list", {data() {
			return {
				manager_id: null,
				isFetching: false,
				sequence: null,
				perPage: 100,
// 				filter: {query: '', tags: []},
				columns: null,
				managers: [],
				columnsItems: null,
// 				filterTags: [],
			}
		},
		
		props: ['page_id'],

		mixins: [ListModel],

		created() {
			this.$io.on('events:manager.users.list:refresh', this.refresh);

			this.fetchData(true);
		},
		
		beforeDestroy() {
			this.$io.off('events:manager.users.list:refresh', this.refresh);
		},
		
		watch: {
			manager_id(v) {
				this.refresh();
			}
		},
		
		computed: {
			columns_props() {
				if (!this.columns) return [];
				
				let columns = {
					fullname: {label: 'Название', classname: 'has-text-nowrap', sortable: true},
					email: {label: 'Email', classname: 'has-text-nowrap', sortable: true},
					manager: {label: 'Группа', classname: 'has-text-nowrap', sortable: true},
				};
				
				let result = _.map(this.columns, (v) => {
					let r = columns[v];
					r.visible = true;
					r.field = v;
					return r;
				});
				
				for (var i = 0; i < 11 - this.columns.length; i++) result.push({visible: false});
				result[0].classname += ' has-text-nowrap';
				return result;
			}
		},

		methods: {
/*
			tagsFetch(name, query, cb) {
				cb([]);
			},
			
			onFilter() {
				this.clearPages();
				this.fetchData(true);
			},
*/
			
			refresh() {
				this.clearPages();
				this.fetchData(false, true);
			},
			
			clickRow(row) {
				this.$modal('vue-manager-users-form', {account_id: row.account_id}, this);
			},	
			
			fetchData(withLoading, force) {
				if (force || !this.checkCache()) {
					this.isFetching = withLoading;
					this.$api.get(this.columns?'manager/users/list':['manager/users/list', 'manager/users/info'], {next: this.next, count: this.perPage, manager_id: this.manager_id/* , filter: this.filter */}).then((data) => {
						let r = data.response.users;
						this.cachePage(r.list);
						if (r.info != undefined && r.info.columns != undefined) {
							this.columns = r.info.columns;
							this.managers = r.info.managers;
						}
						this.isFetching = false;
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
			
<!--
	<vue-component-filterbox ref="filterbox" @filter="onFilter" v-model="filter" :tags-fetch="tagsFetch" :allow-tags="filterTags" :with-buttons="true" v-if="!manager">
		<template slot="buttons">
		</template>
	</vue-component-filterbox>
-->
	
	<div class="container">
		
	<div class="panel panel-default has-mt-3 has-mb-3 has-p-2">
		<div class="select">
		<b-select v-model="manager_id" placeholder="-- Все --">
			<option :value="null">-- Все --</option>
			<option v-for="m in managers" :value="m.manager_id">{{m.title}}</option>
		</b-select>
		</div>
	</div>

	<div class="has-mb-2 has-mt-2">
		

<!--
	<div v-if="manager" class="panel panel-default has-mt-3 has-mb-3">
		<div class="has-p-2 level">
			<div class="level-left">{{manager.title}}</div>
			<div class="level-right"><button class="button is-light" @click="manager = null">К списку</button></div>
		</div>
	</div>
-->

	<b-table paginated backend-pagination pagination-simple :data="fields" :loading="isFetching" :per-page="perPage" :total="total" @page-change="onPageChange" hoverable bordered @click="clickRow">
		
		<b-table-column v-for="(column, index) in columns_props" :field="column.field" :label="column.label|gettext" :numeric="column.numeric" :key="index" :visible="column.visible" :sortable="column.sortable" :width="column.width" v-slot="props">
			<span :class="{'has-text-grey-light': !props.row.is_active}">
			<span v-if="column.field == 'fullname'"> 
				<span v-if="props.row.fullname">{{ props.row.fullname }}</span><span class="has-text-grey" v-else>{{'Без имени'|gettext}}</span>
			</span>
			<span v-if="column.field == 'email'"> 
				{{ props.row.email }} 
			</span>
			<span v-if="column.field == 'manager'"> 
				{{ props.row.manager }} 
			</span>
			</span>
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
</div>
`});
window.$app.defineModule("manager", [{ path: 'metrics/', name: 'manager.metrics', meta: {title: 'Аналитика'}, children: [
	{ path: 'dashboard/', name: 'manager.metrics.dashboard', component: 'vue-manager-metrics-dashboard', meta: {title: 'Дашборд', endpoint: 'manager/metrics/dashboard/layout'}, props: true},
	{ path: 'charts/', name: 'manager.metrics.charts', component: 'vue-manager-metrics-charts', meta: {title: 'Чарты', endpoint: 'manager/metrics/charts/list'}, props: true},
	{ path: 'datasets/', name: 'manager.metrics.datasets', component: 'vue-manager-metrics-datasets-list', meta: {title: 'Датасеты', endpoint: 'manager/metrics/datasets/list'}, props: true},
	{ path: 'sources/', name: 'manager.metrics.sources', component: 'vue-manager-metrics-sources-list', meta: {title: 'Подключения', endpoint: 'manager/metrics/sources/list'}, props: true}
]},
{ path: 'profiles/', component: 'vue-manager-profiles-list', meta: {title: 'Профили', endpoint: 'manager/profiles/list'}, props: true, name: 'manager.profiles'},
{ path: 'statistics/', component: 'vue-manager-statistics-list', meta: {title: 'Статистика', endpoint: 'manager/statistics/list'}, props: true, name: 'manager.statistics'},
{ path: 'payments/', component: 'vue-manager-payments-list', meta: {title: 'Оплаты', endpoint: 'manager/payments/list'}, props: true, name: 'manager.payments'},
{ path: 'partners/', name: 'manager.partners', meta: {title: 'Партнеры', endpoint: 'manager/partners/list'}, children: [
	{ path: 'list/', component: 'vue-manager-partners-list', meta: {title: 'Список', endpoint: 'manager/partners/list'}, props: true, name: 'manager.partners.list'},
	{ path: 'payouts/', component: 'vue-manager-partners-payouts-list', meta: {title: 'Выплаты', endpoint: 'manager/partners/payouts/list'}, props: true, name: 'manager.payouts.list'},
	{ path: 'agreements/', component: 'vue-manager-partners-agreements-list', meta: {title: 'Договора', endpoint: 'manager/partners/agreements/list'}, props: true, name: 'manager.agreements.list'}
]},

{ path: 'locales/', meta: {title: 'Языки'}, props: true, name: 'manager.locales', children: [
	{ path: 'phrases/', component: 'vue-manager-locales-phrases', name: 'manager.locales.phrases.index', meta: {title: 'Интерфейс', endpoint: 'manager/locales/get'}, props: true},
	{ path: 'addons/', component: 'vue-manager-locales-addons', name: 'manager.locales.addons.index', meta: {title: 'Модули', endpoint: 'manager/locales/addons/get'}, props: true },
	{ path: 'payments/', component: 'vue-manager-locales-payments', name: 'manager.locales.payments.index', meta: {title: 'Платежные системы', endpoint: 'manager/locales/payments/get'}, props: true }
]},
{ path: 'mails/', name: 'manager.mails', meta: {title: 'Почта', endpoint: 'manager/mails/messages/list'}, children: [
	{ path: 'messages/', component: 'vue-manager-mails-messages-list', meta: {title: 'Письма', endpoint: 'manager/mails/messages/list'}, props: true, name: 'manager.mails.messages.list'},
	{ path: 'campaings/', component: 'vue-manager-mails-campaings-list', meta: {title: 'Рассылки', endpoint: 'manager/mails/campaings/list'}, props: true, name: 'manager.mails.campaings.list'},
	{ path: 'sequences/', component: 'vue-manager-mails-sequences-list', meta: {title: 'Цепочки', endpoint: 'manager/mails/sequences/list'}, props: true, name: 'manager.mails.sequences.list'}
]},
{ path: 'currency/', component: 'vue-manager-currency', meta: {title: 'Валюта', endpoint: 'manager/currency/get'}, props: true, name: 'manager.currency'},
{ path: 'security/', meta: {title: 'Проверка', endpoint: 'manager/security/list'}, props: true, name: 'manager.security', children: [
	{ path: 'watch/', component: 'vue-manager-security-list', meta: {title: 'На проверку', endpoint: 'manager/security/list'}, props: true, name: 'manager.security.list'},
	{ path: 'history/', component: 'vue-manager-security-history', meta: {title: 'История', endpoint: 'manager/security/history'}, props: true, name: 'manager.security.history'},
]},

{ path: 'cms/', name: 'manager.cms', meta: {title: 'Контент'}, children: [
	{ path: 'questions/', component: 'vue-manager-questions-list', meta: {title: 'Вопросы', endpoint: 'manager/questions/list'}, props: true, name: 'manager.questions'},
	{ path: 'blog/', component: 'vue-manager-blog-list', meta: {title: 'Блог', endpoint: 'manager/blog/list'}, props: true, name: 'manager.blog'},
	{ path: 'guides/', component: 'vue-manager-guides-list', meta: {title: 'Инструкции', endpoint: 'manager/guides/list'}, props: true, name: 'manager.guides'},
	{ path: 'docs/', component: 'vue-manager-docs-index', meta: {title: 'Документация', endpoint: 'manager/docs/index'}, props: true, name: 'manager.docs'}
]},

{ path: 'logs/', component: 'vue-manager-logs-list', meta: {title: 'Логи', endpoint: 'manager/logs/list'}, props: true, name: 'manager.logs'},
{ path: 'users/', component: 'vue-manager-users-list', meta: {title: 'Пользователи', endpoint: 'manager/users/list'}, props: true, name: 'manager.users'}
]);