
window.$app.defineComponent("templates", "vue-templates-form", {data() {
			return {
				isFetching: false,
				values: {title: ''}
			}
		},
		
		props: ['page_id'],
		
		methods: {
			save() {
				this.$api.post('templates/set', Object.assign({page_id: this.page_id}, this.values)).then(r => {
					if (r.result == 'success') {
						this.$parent.close();
					}
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">Добавление шаблона</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<input type="text" v-model="values.title" class="input">
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark level-item" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary level-item" type="button" @click="save">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>		
	</div>
`});

window.$app.defineComponent("templates", "vue-templates-index", {data() {
			return {
				profiles: []
			}
		},
		
		created() {
			this.fetchData();
		},
		
		methods: {
			fetchData() {
				this.$api.get('templates/list').then(r => {
					this.profiles = _.map(r.response.profiles, p => { 
						p.data = this.$page.prepareData(p.data);
						return p;
					});
					
					this.$nextTick(() => {
						_.each(this.profiles, (p, i) => {
							
							p.theme = StylesFactory.checkStyles(p.theme);
							console.log(p.theme);
							
							let prefix = '.templates-index .theme'+p.theme_id;
							let styles = buildStyles(p.theme, 'design', prefix);
							StylesFactory.updateCSSBlock(styles, this.$refs.styles_view[i]);
							
							let styles_sections = {};
							this.$page.prepareSections(p.data, styles_sections, p.theme, prefix, 'view');
							StylesFactory.updateCSSBlock(styles_sections, this.$refs.styles_view_sections[i]);
						});
					})
					
					console.log(this.profiles);
				});
			}
		}, template: `
	<div>
		<div style="background: #fff" class="has-pt-5 has-pb-5">
			<div class="container">
				<h2>Худшие таплинки за всю историю</h2>
			</div>
		</div>
	<div class="templates-index templates-grid container has-mt-3 has-mb-3">
		<div class="row">
		<div v-for="p in profiles" class="col-sm-3">
			<div class="device is-large" :class="'theme'+p.theme_id">
				<div ref='styles_view'></div>
				<div ref='styles_view_sections'></div>
				<section class="modal-card-body is-paddingless screen page page-blocks">
		<!-- 			<div v-for="a in p.theme.options.extended.items" v-html="a.html"></div> -->
					
					<vue-pages-page-blocks :page_id="p.page_id" :page-data="p.data" :readonly="true" :show-hidden="false"></vue-pages-page-blocks>
		<!-- 		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>		 -->
				</section>
			</div>
		</div>		
		</div>
	</div>
	</div>
`});
window.$app.defineModule("templates", []);