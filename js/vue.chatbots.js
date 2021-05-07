
window.$app.defineComponent("chatbots", "vue-chatbots-blocks-action-form", {data() {
			return {
				isFetching: false,
				isFetchingPages: false,
				isFetchingPageInfo: false,
				isUpdating: false,
				forms: [],
				variants: {},
				property_types: {tag: {title: 'Метка', conds: ['contain', 'nocontain']}},
				conds: {contain: 'Содержит', nocontain: 'Не содержит'},
				eventTypes: [
					{type: 'goto', title: 'Переход на цепочку'}, 
					{type: 'chain', title: 'Подписать на цепочку'}, 
					{type: 'chain:delete', title: 'Завершить цепочку'},
					{type: 'chain:suspend', title: 'Приостановить цепочку'},
					{type: 'chain:resume', title: 'Восстановить цепочку'},
					{type: 'tags:add', title: 'Установить метку'},
					{type: 'tags:delete', title: 'Удалить метку'}
				]
			}
		},
		
		props: ['value', 'index', 'chatbot'],
		
		created() {
			this.value = Vue.observable(this.$clone(this.value));
		},
		
		methods: {
			save() {
				this.$parent.$parent.updateConditions(this.value);
				this.$parent.close();
			},
			
			removeItem(i) {
				this.value.content.conditions.splice(i, 1);
			},
			
			addItem() {
				this.value.content.conditions.push({property: '', cond: 'contain', value: ''});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">Действие</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
			<section>
				<label class="label">Действие</label>
				<div class="row row-small">
					<div class="col-xs-6">
						<b-field>
						<b-select v-model="value.content.event.type" placeholder="-- Выберите событие --" expanded>
							<option :value="null">-- Выберите событие --</option>
							<option v-for="t in eventTypes" :value="t.type">{{t.title}}</option>
						</b-select>
						</b-field>
						</div>
						<div class="col-xs-6">
						<b-field v-if="['goto', 'chain', 'chain:delete', 'chain:suspend', 'chain:resume'].indexOf(value.content.event.type) != -1">
							<b-select v-model="value.content.event.value" placeholder="-- Выберите цепочку --" expanded>
								<option :value="null">-- Выберите цепочку --</option>
								<option v-for="c in chatbot.chains" :value="c.chain_id"><span v-if="c.title">{{c.title}}</span><span v-else>Без имени</span></option>
							</b-select>
						</b-field>
						<input type="text" v-model="value.content.event.value" class="input" v-if="['tags:add', 'tags:delete'].indexOf(value.content.event.type) != -1">
						</div>
				</div>
			</section>
			
			<section>
				<div class="has-mb-2" v-if="value.content.conditions.length">
					<label class="label">Условия</label>
					<mx-item v-for="(c, i) in value.content.conditions">
<!--
						<div class="item-row row">
							<div class="col-xs">
-->
								<div class="item-row row">
									<div class="col-xs">
									<b-select v-model="c.property" placeholder="-- Выберите свойство --" expanded @input="c.value = null">
										<option :value="null">-- Выберите событие --</option>
										<option v-for="(p, pi) in property_types" :value="pi">{{p.title}}</option>
									</b-select>
									</div>
									
									<div class="col-xs">
									<b-select v-model="c.cond" expanded v-if="c.property">
										<option v-for="cond in property_types[c.property].conds" :value="cond">{{conds[cond]}}</option>
									</b-select>
									<b-select v-model="c.cond" expanded v-else disabled="on"></b-select>
									</div>
									
									<div class="col-xs"><b-input type="text" v-model="c.value"></b-input></div>
									
									<div class="col-xs col-shrink"><button type="button" class="button has-text-danger is-text" @click="removeItem(i)"><i class="fa fa-trash-alt"></i></button></div>
								</div>
								
<!--
							</div>
						</div>
-->
					</mx-item>
				</div>
				
				<button @click="addItem" class="button is-dark"><i class="fas fa-plus has-mr-1"></i> Добавить условие</button>				
			</section>
		</section>
		<footer class="modal-card-foot level">
			<div class="level-left"></div>
			<div class="level-right">
				<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="save">{{'Сохранить'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});

window.$app.defineComponent("chatbots", "vue-chatbots-blocks-action", {data() {
			return {
				state: null,
				eventTypes: {
					'goto': 'Переход на цепочку', 
					'chain': 'Подписать на цепочку', 
					'chain:suspend': 'Приостановить цепочку',
					'chain:resume': 'Восстановить цепочку',
					'chain:delete': 'Завершить цепочку',
					'tags:add': 'Установить метку',
					'tags:delete': 'Удалить метку'
				}
			}
		},
		
		props: ['value', 'chain_id', 'id', 'chatbot', 'viewDetails'],
		
		computed: {
			conditions() {
				let list = this.value.content.conditions;
				if (list.length) {
					let property_types = {tag: 'Метка'};
					let conds = {contain: 'содержит', nocontain: 'не содержит'};

					return "Если "+_.map(list, c => '"'+property_types[c.property]+'" '+conds[c.cond]+' "'+c.value+'"').join('<br>и ');
				}
			}
		},
		
		methods: {
			save() {
				this.$emit('input', this.value);
//				this.$parent.$parent.$parent.update(this.chain_id, this.id, this.value.content)
			},
			
			updateConditions(v) {
				this.value = v;
				this.$emit('input', this.value);
			},
			
			
			edit() {
				this.$modal('vue-chatbots-blocks-action-form', {value: this.value, chatbot: this.chatbot}, this)
			}
		}, template: `
	<div>
		<div class="has-p-1">
			<label class="label has-text-centered">Действие</label>
			<center v-html="conditions" class="has-text-grey"></center>
		</div>
		<div class="chatbots-buttons-row">
		<div class="chatbots-buttons">
			<div class="chatbots-button">
				<a class="chatbot-button has-text-primary" @click="edit" :class="{'is-warning': !value.content.event.value || !value.content.event.type}">
					<span v-if="value.content.event.type">{{eventTypes[value.content.event.type]}}</span>
					<span v-else>Действие не выбрано</span>
					<div class="chatbots-buttons-snippet" v-if="viewDetails">
						<vue-chatbots-event-details v-model="value.content.event" :chatbot="chatbot"></vue-chatbots-event-details>
					</div>
					<div @click.prevent.stop="$emit('goto', value.content.event.value)" class="chatbots-button-goto" :class="{disabled: value.content.event.value == null}" v-if="['goto', 'chain'].indexOf(value.content.event.type) != -1"></div>
				</a>
			</div>
		</div>
		</div>
	</div>
`});

window.$app.defineComponent("chatbots", "vue-chatbots-blocks-picture", {data() {
			return {
				state: null
			}
		},
		
		props: ['value', 'chain_id', 'id', 'chatbot', 'viewDetails', 'viewStatistics', 'statistics'],

		computed: {
			pictureSizeStyle() {
				return 'padding-top: '+(this.value.content.picture?(this.value.content.picture.height / this.value.content.picture.width * 100):50)+'%';
			}
		},
		
		methods: {
			goto(value) {
				this.$emit('goto', value);
			},

			save() {
				this.$emit('input', this.value);
// 				this.$parent.$parent.$parent.update(this.chain_id, this.id, this.value.content)
			},
			
			focusMessage() {
				this.state = this.$clone(this.value.content);
			},
			
			blurMessage() {
				if (!_.isEqual(this.state, this.value.content)) {
					this.save();
				}
				
				this.state = null;
			}	
		}, template: `
	<div>
		<vue-component-pictures v-model="value.content.picture" :button-title="'Загрузить картинку'|gettext" button-icon="fa fal fa-cloud-upload" updatable class="chatbot-picture" class-container="picture-container picture-container-upload" :style-container="pictureSizeStyle" @upload="save" @delete="save"></vue-component-pictures>
		<textarea v-model="value.content.text" class="autoresize-init" @focus="focusMessage" @blur="blurMessage" placeholder="Заголовок"></textarea>
		<vue-chatbots-buttons v-model="value.content.buttons" :chatbot="chatbot" :viewDetails="viewDetails" :viewStatistics="viewStatistics" :chain_id="chain_id" :statistics="statistics" :id="id" @input="save" @goto="goto"></vue-chatbots-buttons>
	</div>
`});

window.$app.defineComponent("chatbots", "vue-chatbots-blocks-text", {data() {
			return {
				state: null
			}
		},
		
		props: ['value', 'chain_id', 'id', 'chatbot', 'viewDetails', 'viewStatistics', 'statistics'],
		
		methods: {
			goto(value) {
				this.$emit('goto', value);
			},
			
			focusMessage() {
				this.state = this.$clone(this.value.content);
			},
			
			blurMessage() {
				if (!_.isEqual(this.state, this.value.content)) {
					this.save();
				}
				
				this.state = null;
			},
			
			save() {
				this.$emit('input', this.value);
//				this.$parent.$parent.$parent.update(this.chain_id, this.id, this.value.content)
			}			
		}, template: `
	<div>
		<textarea v-model="value.content.text" class="autoresize-init" @focus="focusMessage" @blur="blurMessage" placeholder="Текст" style="padding-top: 0"></textarea>
		<vue-chatbots-buttons v-model="value.content.buttons" :viewDetails="viewDetails" :viewStatistics="viewStatistics" :chatbot="chatbot" :chain_id="chain_id" :statistics="statistics" :id="id" @input="save" @goto="goto"></vue-chatbots-buttons>
	</div>
`});

window.$app.defineComponent("chatbots", "vue-chatbots-blocks-video", {data() {
			return {
				state: null
			}
		},
		
		props: ['value', 'chain_id', 'id', 'chatbot', 'viewDetails', 'viewStatistics', 'statistics'],

		computed: {
			type() {
				let path = this.value.content.video.link.split('.');
				return (path.length > 1)?('video/'+path[path.length-1]):null;
			}
		},
		
		methods: {
			goto(value) {
				this.$emit('goto', value);
			},

			save() {
				this.$emit('input', this.value);
			},
			
			focusMessage() {
				this.state = this.$clone(this.value.content);
			},
			
			blurMessage() {
				if (!_.isEqual(this.state, this.value.content)) {
					this.save();
				}
				
				this.state = null;
			}	
		}, template: `
	<div>
		<transition name="fade">
			<div class="video-container" v-if="type">
				<video><source :src="value.content.video.link" :type="type"></video>
			</div>
		</transition>
		<input type="text" class="input" v-model="value.content.video.link" @focus="focusMessage" @blur="blurMessage" placeholder="URL">
		<textarea v-model="value.content.text" class="autoresize-init" @focus="focusMessage" @blur="blurMessage" placeholder="Заголовок" maxlength="1024"></textarea>
		<vue-chatbots-buttons v-model="value.content.buttons" :viewDetails="viewDetails" :viewStatistics="viewStatistics" :chatbot="chatbot" :chain_id="chain_id" :statistics="statistics" :id="id" @input="save" @goto="goto"></vue-chatbots-buttons>
	</div>
`});

window.$app.defineComponent("chatbots", "vue-chatbots-button-events", {data() {
			return {
				eventTypes: [
					{type: 'chain', title: 'Подписать на цепочку', targets: ['lead', 'paid', 'click']}, 
					{type: 'chain:delete', title: 'Завершить цепочку', targets: ['lead', 'paid', 'click']}, 
					{type: 'chain:suspend', title: 'Приостановить цепочку', targets: ['lead', 'paid', 'click']}, 
					{type: 'chain:resume', title: 'Восстановить цепочку', targets: ['lead', 'paid', 'click']}, 
					{type: 'tags:add', title: 'Установить метку', targets: ['lead', 'paid', 'click']}, 
					{type: 'tags:delete', title: 'Удалить метку', targets: ['lead', 'paid', 'click']}
				]
			}
		},
		
		props: ['value', 'chatbot', 'target', 'disabled'],
		
		methods: {
			addEvent() {
				this.value.push({type: null, value: null})
			},
			
			removeEvent(i) {
				this.value.splice(i, 1);
			}
		}, template: `
<div>
	<div class="has-mb-2" v-if="value.length">
		<mx-item v-for="(f, i) in value">
			<div class="item-row row">
				<div class="col-xs">
					<b-select v-model="f.type" placeholder="-- Выберите событие --" expanded @input="f.value = null" :disabled="disabled">
						<option :value="null">-- Выберите событие --</option>
						<option v-for="t in eventTypes" :value="t.type" v-if="t.targets.indexOf(target) != -1">{{t.title}}</option>
					</b-select>
				</div>
				<div class="col-xs">
					<b-select v-model="f.value" placeholder="-- Выберите цепочку --" expanded v-if="['goto', 'chain', 'chain:delete', 'chain:suspend', 'chain:resume'].indexOf(f.type) != -1" :disabled="disabled">
						<option :value="null">-- Выберите цепочку --</option>
						<option v-for="c in chatbot.chains" :value="c.chain_id"><span v-if="c.title">{{c.title}}</span><span v-else>Без имени</span></option>
					</b-select>		
				
					<input class="input" v-model="f.value" v-if="f.type == 'tags:add' || f.type == 'tags:delete'" :disabled="disabled"></input>
				</div>
            		
				<div class="col-xs col-shrink"><button type="button" class="button has-text-danger is-text" @click="removeEvent(i)" :disabled="disabled"><i class="fa fa-trash-alt"></i></button></div>
			</div>
		</mx-item>
	</div>
	<button @click="addEvent" class="button is-dark" :disabled="disabled"><i class="fas fa-plus has-mr-1"></i> Добавить событие</button>
</div>
`});

window.$app.defineComponent("chatbots", "vue-chatbots-button-form", {data() {
			return {
				isFetching: false,
				isFetchingPages: false,
				isFetchingPageInfo: false,
				isUpdating: false,
				forms: [],
				pagesLazy: null,
				variants: {}
			}
		},
		
		props: ['value', 'index', 'chatbot'],
		
		computed: {
			pages() {
				if (this.pagesLazy == null) {
					this.isFetchingPages = true;
					this.$api.get('pages/list').then((data) => {
						this.pagesLazy = data.response.pages;
						this.isFetchingPages = false;
					});
				}

				return this.pagesLazy;
			}
		},
		
		created() {
			// hack:
			if (this.value.restrict == undefined) {
				this.value.restrict = false;
				this.value.restrict_tags = '';
			}

			if (this.value.events == undefined) this.$set(this.value, 'events', {click: [], lead: [], paid: []});
			if (this.value.type == 'page') {
				this.isFetching = true;
				this.fetchPageInfo();
			}
			
			this.value = Vue.observable(this.$clone(this.value));
		},
		
		methods: {
			deleteButton() {
				this.$confirm('Вы уверены что хотите удалить эту кнопку? Вы не сможете её вернуть!', 'is-danger').then(() => {
					this.$parent.$parent.deleteButton(this.index);
					this.$parent.close();
				});
			},

			fetchPageInfo() {
				if (this.value.value) {
					this.isFetchingPageInfo = true;
					this.$api.get('chatbots/messages/pageinfo', {page_id: this.value.value}).then((data) => {
						if (data.result == 'success') {
							let r = data.response;
							this.forms = r.forms;
							this.value.restrict = r.restrict;
							this.value.restrict_tags = r.restrict_tags;
							this.value.restrict_fallback = r.fallback_page_id;
							this.value.restrict_session = r.restrict_session;
							this.isFetching = false;
							
							_.each(r.events, (v, k) => {this.value.events[k] = v;})
						}
						this.isFetchingPageInfo = false;
					});
				} else {
					this.forms = [];
					this.value.restrict = false;
					this.value.restrict_tags = '';
				}
			},
			
			save() {
				this.isUpdating = true;
				this.$parent.$parent.updateButton(this.index, this.value);
				this.$parent.close();
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Кнопка'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
			<section>
				<b-field label="Заголовок">
					<input type="text" class="input" v-model="value.text">
				</b-field>
				
				<div class="row row-small">
					<div class="col-xs-12 col-sm-4 has-xs-mb-3">
				
					<b-field label="Действие">
						<b-select v-model="value.type" expanded @input="value.value = null">
							<option value="url">Открыть ссылку</option>
							<option value="goto">Переход на цепочку</option>
							<option value="chain">Подписать на цепочку</option>
							<option value="chain:suspend">Приостановить цепочку</option>
							<option value="chain:resume">Восстановить цепочку</option>
							<option value="page">Открыть страницу</option>
							<option value="message">Отправить сообщение</option>
						</b-select>
					</b-field>

					</div>
					<div class="col-xs-12 col-sm">
						<b-field label="URL" v-if="value.type == 'url'">
							<input type="text" class="input" v-model="value.value">
						</b-field>
						
						<b-field label="Переход" v-if="['goto', 'chain', 'chain:resume', 'chain:suspend'].indexOf(value.type) != -1" class="has-mb-1">
							<b-select v-model="value.value" placeholder="-- Выберите цепочку --" expanded>
								<option :value="null">-- Выберите цепочку --</option>
								<option v-for="c in chatbot.chains" :value="c.chain_id"><span v-if="c.title">{{c.title}}</span><span v-else>Без имени</span></option>
							</b-select>
						</b-field>
						
						<b-field label="Страница" v-if="value.type == 'page'" class="has-mb-1">
							<b-select v-model="value.value" placeholder="Страница не выбрана" expanded :disabled="isFetchingPages" @input="fetchPageInfo">
								<option :value="null">Страница не выбрана</option>
								<option v-for="p in pages" :value="p.page_id" v-if="p.page_id != $account.page_id"><span v-if="p.title">{{p.title}}</span><span v-else>Без имени</span></option>
							</b-select>
						</b-field>
						
						<div v-if="value.type == 'message'">
							<label class="label">Текст сообщения</label>
							<textarea v-model="value.value" class="input autoresize-init"></textarea>
						</div>
						
						<div v-if="value.type == 'page'">
							<b-checkbox v-model="value.restrict" :disabled="isFetchingPages || isFetchingPageInfo">Ограничить доступ по метке</b-checkbox>
							<div class="has-mb-2" v-if="value.restrict" >
								<input type="text" class="input" v-model="value.restrict_tags" placeholder="Метки" :disabled="isFetchingPages || isFetchingPageInfo">
							</div>
							<div class="has-mb-2" v-if="value.restrict">
								<label class="has-text-grey has-pb-1 is-block">Какую страницу открыть если нет доступа</label>
								<b-select v-model="value.restrict_fallback" expanded :disabled="isFetchingPages">
									<option :value="null">Главная страница</option>
									<option v-for="p in pages" :value="p.page_id" v-if="p.page_id != $account.page_id"><span v-if="p.title">{{p.title}}</span><span v-else>Без имени</span></option>
								</b-select>
							</div>
							<div>
								<b-checkbox v-model="value.restrict_session" :disabled="isFetchingPages || isFetchingPageInfo">Ограничить доступ только из мессенджера</b-checkbox>
								<div class="has-mb-2" v-if="value.restrict_session">
									<label class="has-text-grey has-pb-1 is-block">Какую страницу открыть если нет доступа</label>
									<b-select v-model="value.restrict_session_fallback" expanded :disabled="isFetchingPages">
										<option :value="null">Главная страница</option>
										<option v-for="p in pages" :value="p.page_id" v-if="p.page_id != $account.page_id"><span v-if="p.title">{{p.title}}</span><span v-else>Без имени</span></option>
									</b-select>
								</div>
							</div>
						</div>
						<div v-else>
							<b-checkbox v-model="value.remove_buttons">Скрыть все кнопки после нажатия</b-checkbox>
						</div>						
					</div>
				</div>
			</section>
			<section v-if="value.type == 'page' && forms.length > 0">
				<label class="label">Событие при оформлении заявки</label>
				<vue-chatbots-button-events v-model="value.events.lead" :chatbot="chatbot" target="lead" :disabled="isFetchingPageInfo"></vue-chatbots-button-events>
			</section>
			<section v-if="value.type == 'page' && forms.length > 0">
				<label class="label">Событие при оплате заявки</label>
				<vue-chatbots-button-events v-model="value.events.paid" :chatbot="chatbot" target="paid" :disabled="isFetchingPageInfo"></vue-chatbots-button-events>
			</section>
			<section v-if="value.type == 'page'">
				<label class="label">Событие при открытии страницы</label>
				<vue-chatbots-button-events v-model="value.events.click" :chatbot="chatbot" target="click"></vue-chatbots-button-events>
			</section>
		</section>
		<footer class="modal-card-foot level">
			<div class="level-left">
				<a class="button has-text-danger" @click="deleteButton"><i class="fa fa-trash-alt"></i>Удалить</a>
			</div>
			<div class="level-right">
				<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="save" :disabled="isFetchingPageInfo">{{'Сохранить'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});

window.$app.defineComponent("chatbots", "vue-chatbots-buttons", {props: {value: Object, chain_id: Number, id: Number, chatbot: Object, viewDetails: Boolean, viewStatistics: Boolean, statistics: Object},
		
		methods: {
			detailsText(b) {
				let title = 'Без имени';
				
				switch (b.type) {
					case 'goto':
					case 'chain':
						let chains = this.chatbot.chains;
						let keys = Object.keys(chains);
						for (let i = 0; i < keys.length; i++) {
							let chain = chains[keys[i]];
							if (chain.chain_id == b.value) {
								if (chain.title) title = chain.title;
								break;
							}
						}
						break;
					case 'message':
						title = 'Текст';
						break;
					case 'page':
						title = 'Страница';
						break;
					case 'url':
						title = b.value;
						break;
				}
				
				let icons = {
					page: 'file',
					chain: 'plus',
					goto: 'forward',
					url: 'external-link',
					message: 'font'
				}
				
				return '<i class="fas fa-'+icons[b.type]+' has-mr-1"></i>'+title;
			},
			
			getHits(id) {
				let key = this.chain_id+':'+this.id;
				return (this.viewStatistics && this.statistics && (this.statistics.buttons != undefined) && (this.statistics.buttons[key+':'+id] != undefined) && (this.statistics.messages[key] != undefined))?(Math.round(this.statistics.buttons[key+':'+id] * 100 / this.statistics.messages[key])+'% / '+this.statistics.buttons[key+':'+id]):null;
			},

			addButton(y) {
				let id = parseInt(this.value._).toString(16);
				this.$set(this.value, id, {text: '', type: 'url', value: null, remove_buttons: false, restrict: false, restrict_tags: '', restrict_fallback: null, events: {click: [], lead: [], paid: []}});
				
				if (y != null) {
					this.value.$[y].push(id);
				} else {
					this.value.$.push([id]);
				}
				this.value._++;
				
				this.$emit('input', this.value);
			},
			
			editButton(id) {
				this.$modal('vue-chatbots-button-form', {index: id, value: this.value[id], chatbot: this.chatbot}, this)
			},
			
			warningButton(b) {
/*
				switch (b.type) {
					case 'url':
						if (!b.value) return true;
						break;
					case 'goto':
					case 'chain':
						if (!b.value) return true;
						break;
				}
				
*/
				return b.text.trim() == '';
			},
			
			updateButton(id, v) {
				this.$set(this.value, id, v);
				this.$emit('input', this.value);
			},
			
			deleteButton(id) {
				for (y = this.value.$.length-1; y >= 0; y--) {
					let row = this.value.$[y];
					let i = row.indexOf(id);
					if (i != -1) row.splice(i, 1);
					if (row.length == 0) this.value.$.splice(y, 1);
				}

				this.$delete(this.value, id);
				this.$emit('input', this.value);
			},
			
			updated: _.debounce(function() {
				this.$emit('input', this.value)
			}, 5000)
		}, template: `
	<div>
		<sortable-list v-model="value.$" lockAxis="y" use-drag-handle class="chatbots-buttons" helper-class="is-sorting" @input="updated">
			<sortable-item v-for="(x, y) in value.$" :index="y" :key="y" :item="i" class="chatbots-buttons-row">
				<sortable-list lockAxis="x" axis="x" v-model="value.$[y]" use-drag-handle helper-class="is-sorting" class="chatbots-buttons-row-container" :class="{'has-many-buttons': x.length > 1}" @input="updated">
				<sortable-item class="chatbots-button" v-for="(id, ii) in x" :index="ii" :key="ii" :item="id" :data-hits="getHits(id)">
				<a class="has-text-primary" @click="editButton(id)" :class="{'is-warning': !value[id].value || !value[id].text}">
					<div class="chatbots-button-handle" v-sortable-handle></div>
					<span v-if="value[id].text" class="chatbots-buttons-title">{{value[id].text}}</span><span v-else class="chatbots-buttons-title">Без имени</span>
					
					<div class="chatbots-buttons-snippet" v-if="viewDetails">
						<vue-chatbots-event-details v-model="value[id]" :chatbot="chatbot"></vue-chatbots-event-details>
					</div>
					
					<div @click.prevent.stop="$emit('goto', value[id].value)" class="chatbots-button-goto" :class="{disabled: value[id].value == null}" v-if="['goto', 'chain'].indexOf(value[id].type) != -1"></div>
				</a>
				</sortable-item>
				</sortable-list>
				<div class="chatbots-button-plus" @click.prevent.stop="addButton(y)"></div>
				<div class="chatbots-button-row-handle" v-sortable-handle></div>
			</sortable-item>
		</sortable-list>
		<div class="chatbots-buttons-row">
			<div role="button" class="chatbots-buttons-new" @click="addButton(null)" v-if="viewDetails"><i class='fas fa-plus has-mr-1'></i> Добавить ряд кнопок</div>
		</div>
	</div>
`});

window.$app.defineComponent("chatbots", "vue-chatbots-debug-form", {props: ['chatbot_id'],
		
		computed: {
			code() {
				return '/debug start '+this.$account.user.session_account_id;
			}
		},
			
		created() {
			this.$io.on('events:chatbot.debug:status', this.debugStatus);
		},
		
		beforeDestroy() {
			this.$io.off('events:chatbot.debug:status', this.debugStatus);
		},		
		
		methods: {
			debugStatus(e) {
				if (e.status && e.chatbot_id == this.chatbot_id) this.$parent.close();
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">Тестирование бота</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<div class="field has-addons">
				<div class="control is-expanded">
					<input type="input" class="input" v-model="code" disabled="on"></input>
				</div>
				<div class="control">
					<vue-component-clipboard :text="code" class="button is-default" :show-icon="false"><i class="fal fa-copy has-mr-1"></i>{{'Скопировать'|gettext}}</vue-component-clipboard>
				</div>
			</div>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
	</div>
`});

window.$app.defineComponent("chatbots", "vue-chatbots-delay-form", {props: ['value'], template: `
	<div>
		Отправлять через
		<vue-component-delay-input v-model="value" />
<!--
		<div style="display:flex;margin:.5rem 0">
			<input type="number" class="input has-text-right" v-model="v" v-if="t" style="width:70px;margin-right:1rem">
			<b-select v-model="t" placeholder="Немедленно" expanded style="flex-grow: 1">
				<option :value="null">Немедленно</option>
				<option v-for="(v, k) in types" :value="k">{{v}}</option>
			</b-select>
		</div>
-->
		
		После предыдущего сообщения
	</div>
`});

window.$app.defineComponent("chatbots", "vue-chatbots-event-details", {props: {value: Object, chatbot: Object},
		
		methods: {
			detailsText(b) {
				let title = 'Без имени';
				
				switch (b.type) {
					case 'goto':
					case 'chain':
					case 'chain:delete':
					case 'chain:resume':
					case 'chain:suspend':
						let chains = this.chatbot.chains;
						let keys = Object.keys(chains);
						for (let i = 0; i < keys.length; i++) {
							let chain = chains[keys[i]];
							if (chain.chain_id == b.value) {
								if (chain.title) title = chain.title;
								break;
							}
						}
						break;
					case 'message':
						title = 'Текст';
						break;
					case 'page':
						title = 'Страница';
						break;
					case 'url':
						title = b.value;
						break;
					case 'tags:add':
					case 'tags:delete':
						title = b.value;
						break;
				}
				
				let icons = {
					page: 'file',
					chain: 'plus',
					'chain:delete': 'minus',
					goto: 'forward',
					'chain:resume': 'undo',
					'chain:suspend': 'pause',
					url: 'external-link',
					message: 'font',
					'tags:add': 'tag',
					'tags:delete': 'tag'
				}
				
				return '<i class="fas fa-'+icons[b.type]+'"></i><dd class="has-ml-1">'+title+'</dd>';
			}
		}, template: `
	<span v-html="detailsText(value)" v-if="value.type && value.value"></span>
`});

window.$app.defineComponent("chatbots", "vue-chatbots-index", {data() {
			return {
				debug: {active: false, stared: false, state: {}, scroll: null},
				isFetching: false,
				isAppending: [],
				isResorting: false,
				isUpdatingChain: [],
				isUpdating: [],
				chatbot: null,
				focus: null,
				chainTitleEditing: null,
				messageTypes: {text: {title: 'Текст'}, picture: {title: 'Картинка'}, video: {title: 'Видео'}, action: {title: 'Действие'}},
				tags: [],
				tagsTitles: {},
				viewChainTag: null,
				viewDetails: true,
				viewStatistics: false,
				isAnimatedChain: null,
				statistics: null
			}
		},
		
		watch: {
			viewStatistics(v) {
				if (v && this.statistics == null) {
					this.statistics = {};
					this.$api.get('chatbots/statistics/get').then(s => {
						this.statistics = s.response.statistics;
					})
				}
			}
		},
		
		computed: {
			scrollContainer() {
				return window.matchMedia("(max-width: 767px)").matches?$mx('.main-block')[0]:(document.scrollingElement || document.documentElement);
			},
		},
		
		created() {
			this.$io.on('events:chatbot:refresh', this.refreshChatbot);
			this.$io.on('events:chatbot.debug:status', this.debugStatus);
			this.$io.on('events:chatbot.debug:event', this.debugEvent);

			//window.chatbot = this;
			this.fetchData();
		},
		
		beforeDestroy() {
			this.$io.off('events:chatbot:refresh', this.refreshChatbot);
			this.$io.off('events:chatbot.debug:status', this.debugStatus);
			this.$io.off('events:chatbot.debug:event', this.debugEvent);
		},
		
		methods: {
			getMessageHits(cid, id) {
				return (this.viewStatistics && this.statistics && (this.statistics.messages != undefined) && (this.statistics.messages[cid+':'+id] != undefined))?this.statistics.messages[cid+':'+id]:null;
			},
			
			debugEvent(e) {
				switch (e.event) {
					case 'chain.stopped':
						if (this.chatbot.chains[e.chain_id] != undefined) {
							_.each(this.chatbot.chains[e.chain_id].messages_index, (key) => {
								this.$delete(this.debug.state, e.chain_id+'_'+key);
							});
						}
						break;
					case 'add':
						if (e.key) this.$set(this.debug.state, e.key, 'wait');
						break;
					case 'remove':
						if (e.key && this.debug.state[e.key] != undefined) this.$delete(this.debug.state, e.key);
						if (e.key == '*') this.debug.state = [];
						break;
				}
			},
			
			debugStatus(e) {
				if (e.chatbot_id == this.chatbot.chatbot_id) {
					this.debug.active = this.debug.started = e.status;
					if (!e.status) this.debug.state = {}
				}
			},
			
			debugToggle() {
				if (this.debug.started) {
					this.debug.active = !this.debug.active;
				} else {
					this.$modal('vue-chatbots-debug-form', {chatbot_id: this.chatbot.chatbot_id});
				}
			},
			
			debugScroll() {
				let keys = Object.keys(this.debug.state);
				let idx = this.debug.scroll?keys.indexOf(this.debug.scroll):-1;
				if (idx != -1) {
					if (idx < keys.length-1) {
						idx++;
					} else {
						idx = 0;
					}
				} else {
					idx = 0;
				}
				
				let key = Object.keys(this.debug.state)[idx];
				
				scrollIt('#key'+key, 'x', this.$refs.chains.$el, 300, 'linear', () => {
					scrollIt('#key'+key, 'y');
				});
				
				this.debug.scroll = key;
			},
			
			debugForward(cid, mid) {
				if (this.debug.state[cid+'_'+mid] != 'forwarding') {
					this.debug.state[cid+'_'+mid] = 'forwarding';
					this.$api.get('chatbots/debug/forward', {chatbot_id: this.chatbot.chatbot_id, chain_id: cid, message_id: mid});
				}	
			},
	
			refreshChatbot(o) {
				this.tagsTitles = o.tags;
				this.tags = _.keys(o.tags);
			},
			
			optionsForm() {
				this.$modal('vue-chatbots-options-form', {chatbot: this.chatbot}, this)	
			},
			
			goto(chain_id) {
				let tag = this.chatbot.chains[chain_id].tag;
				
				if ((tag != null) && (this.viewChainTag != null) && (this.viewChainTag != tag)) {
					this.viewChainTag = null;
				}
				
				this.$nextTick(() => {
					scrollIt('#cid'+chain_id, 'x', this.$refs.chains.$el, 300, 'linear', () => {
						scrollIt(0, 'y', null, 300);
						
						this.isAnimatedChain = chain_id;
						setTimeout(() => {
							this.isAnimatedChain = null;
						}, 1000);
					});
				});
			},
			
			chainBackground(cid) {
				let tag = this.chatbot.chains[cid].tag;
				return (tag != null)?('background:'+this.tags[tag]+'1a'):null;
			},
			
			chainTitleEdit(j) {
				this.chainTitleEditing = j;	
				this.$nextTick(() => {
					this.$refs.chainTitleInput[0].focus();
				});
			},
			
			chainRepeatableChange(cid) {
				let c = this.chatbot.chains[cid];
				c.is_repeatable = !c.is_repeatable;
				this.updateChain(cid);
			},
			
			updateChain(cid) {
				let c = this.chatbot.chains[cid];
				this.$api.post('chatbots/chains/update', {chain_id: cid, title: c.title, tag: c.tag, is_repeatable: c.is_repeatable});
				this.chainTitleEditing = null;
			},
			
			setUpdating(chain_id, id, status) {
				let key = chain_id+'.'+id;
				if (status) {
					this.isUpdating.push(key);
				} else {
					this.isUpdating.splice(this.isUpdating.indexOf(key), 1);
				}
			},
			
			update(chain_id, id, content) {
				this.setUpdating(chain_id, id, true);
				this.$api.post('chatbots/messages/update', {chain_id: chain_id, id: id, content: content}).then((data) => {
					this.setUpdating(chain_id, id, false);
				}).catch((e) => {
					this.setUpdating(chain_id, id, false);
				})
			},
			
			updateDelay(s, chain_id, id) {
				if (s) return;
				this.setUpdating(chain_id, id, true);
				this.$api.post('chatbots/messages/delay', {chain_id: chain_id, id: id, delay: this.chatbot.chains[chain_id].messages[id].delay}).then((data) => {
					this.setUpdating(chain_id, id, false);
				}).catch((e) => {
					this.setUpdating(chain_id, id, false);
				})
			},
			
			deleteMessage(c, i) {
				this.$confirm('Вы уверены что хотите удалить это сообщение? Вы не сможете её вернуть!', 'is-danger').then(() => {
					this.isUpdatingChain.push(c.chain_id);
					let id = c.messages_index[i];

					this.$api.get('chatbots/messages/delete', {chain_id: c.chain_id, id: id}).then((data) => {
						if (data.result == 'success') {
							delete c.messages[id];
							c.messages_index.splice(i, 1);
						}
						this.isUpdatingChain.splice(this.isAppending.indexOf(c.chain_id), 1);
					});
				});
			},
			
			deleteChain(i) {
				this.$confirm('Вы уверены что хотите удалить эту цепочку? Вы не сможете её вернуть!', 'is-danger').then(() => {
					let chain_id = this.chatbot.chains_index[i];
					this.isUpdatingChain.push(chain_id);
					this.$api.get('chatbots/chains/delete', {chatbot_id: this.chatbot.chatbot_id, chain_id: chain_id}).then((data) => {
						if (data.result == 'success') {
							this.$delete(this.chatbot.chains, chain_id);
							this.chatbot.chains_index.splice(i, 1);
						}
						this.isUpdatingChain.splice(this.isAppending.indexOf(chain_id), 1);					
					}).catch((e) => {
						this.isUpdatingChain.splice(this.isAppending.indexOf(chain_id), 1);					
					});
				});
			},
			
			cloneChain(i) {
				let chain_id = this.chatbot.chains_index[i];
				this.isUpdatingChain.push(chain_id);
				this.$api.get('chatbots/chains/clone', {chatbot_id: this.chatbot.chatbot_id, chain_id: chain_id}).then((data) => {
					if (data.result == 'success') {
						let chain = data.response.chain;
						this.chatbot.chains[chain.chain_id] = chain;
						this.chatbot.chains_index.push(chain.chain_id);
// 						this.$delete(this.chatbot.chains, chain_id);
// 						this.chatbot.chains_index.splice(i, 1);
					}
					this.isUpdatingChain.splice(this.isAppending.indexOf(chain_id), 1);					
				}).catch((e) => {
					this.isUpdatingChain.splice(this.isAppending.indexOf(chain_id), 1);					
				});
			},
			
			fetchData() {
				this.debug.active = false;
				this.state = {};
				this.isFetching = true;
				this.$api.get('chatbots/get').then((data) => {
					if (data.result == 'success') {
						this.chatbot = data.response.chatbot;
						
						this.debug.started = this.chatbot.debug_started;
						this.debug.state = this.chatbot.debug_state;
						this.tagsTitles = this.chatbot.tags;
						this.tags = _.keys(this.chatbot.tags);
					}
					this.isFetching = false;
				}).catch((e) => {
					this.isFetching = false;
				});
			},
			
			startTouch() {
				$mx('html').addClass('is-dragging');
			},
			
			stopTouch() {
				$mx('html').removeClass('is-dragging');
			},
			
			resortedChains() {
				this.isResorting = true;
				this.$api.get('chatbots/resort', {chatbot_id: this.chatbot_id, idx: this.chatbot.chains_index}).then((data) => {
					this.isResorting = false;
				});
			},
			
			resorted(c) {
				this.isUpdatingChain.push(c.chain_id);
				this.$api.get('chatbots/chains/resort', {chain_id: c.chain_id, idx: c.messages_index}).then((data) => {
					this.isUpdatingChain.splice(this.isAppending.indexOf(c.chain_id), 1);
				});
			},
			
			addChains() {
				this.$api.get('chatbots/chains/append', {chatbot_id: this.chatbot_id, tag: this.viewChainTag}).then((data) => {
					if (data.result == 'success') {
						let c = data.response.chain;
						this.chatbot.chains[c.chain_id] = Vue.observable(c);
						this.chatbot.chains_index.push(c.chain_id);
					}
				});				
			},
			
			addMessage(type, chain_id) {
				let c = this.chatbot.chains[chain_id];
				this.$refs['tippy'+chain_id][0].$el.childNodes[0]._tippy.hide();
				
				this.isAppending.push(chain_id);
				this.$api.get('chatbots/messages/append', {chain_id: chain_id, type: type}).then((data) => {
					if (data.result == 'success') {
						c.messages[data.response.id] = Vue.observable(data.response.message);
						c.messages_index.push(data.response.id);
						
						this.isAppending.splice(this.isAppending.indexOf(chain_id), 1);
					}
				});
			}
		}, template: `
<div style="display: flex;flex-direction: column" @touchstart="startTouch" @touchend="stopTouch">
	<div class="top-panel">
		<div class="container">
			<div class="is-submenu-toolbar">
				<div>
					<div style="display: flex;align-items: center">
						<b-dropdown position="is-bottom-right" v-model="viewChainTag" class="chatbots-dropdown-tags" v-if="chatbot">
							<span slot="trigger" style="cursor:pointer"><i class="fa-circle has-ml-1 has-mr-1" :class="{fas: viewChainTag != null, fal: viewChainTag == null}" :style="{color: tags[viewChainTag]}"></i><span class="has-text-grey is-hidden-mobile" v-if="viewChainTag == null">Показывать все</span><span v-else>{{tagsTitles[tags[viewChainTag]]}}</span></span>
							<b-dropdown-item aria-role="listitem" :value="null" class="has-text-black">Показывать все</b-dropdown-item>
							<b-dropdown-item aria-role="listitem" :value="t" v-for="(w, t) in tags" :style="{background: w}" v-html="tagsTitles[w]?tagsTitles[w]:'&nbsp;'"></b-dropdown-item>
						</b-dropdown>
					</div>
					
					<div style="display:flex">
						<button @click="debugScroll" class="button is-debug-scroll is-hidden-mobile" v-if="debug.active && _.size(debug.state)">{{_.size(debug.state)}}</button>
						<button @click="debugToggle" class="button is-hidden-mobile" :class="{'is-black': debug.active, 'is-light': !debug.active}" :disabled="!chatbot"><i class="fas fa-triangle fa-rotate-90" :class="{'has-text-grey-light': !debug.active}"></i></button>
						
						<button @click="viewStatistics = !viewStatistics" :disabled="!chatbot" class="button" :class="{'is-black': viewStatistics, 'is-light': !viewStatistics}"><i class="fa fa-chart-bar"></i></button>
						<button @click="viewDetails = !viewDetails" :disabled="!chatbot" class="button is-light"><i class="fa" :class="{'fa-eye': viewDetails, 'fa-eye-slash': !viewDetails}"></i></button>
						<button @click="optionsForm" class="button is-light" :disabled="!chatbot"><i class="fa fa-sliders-h"></i><span class="has-ml-1 is-hidden-mobile">Настройки</span></button>
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<sortable-list class="chatbots-chains" axis="x" v-model="chatbot.chains_index" use-drag-handle @input="resortedChains" ref="chains" v-if="chatbot && !isFetching" :class="{disabled: isResorting}">
		<sortable-item v-for="(cid, j) in chatbot.chains_index" :index="j" :key="j" :item="cid" :id="'cid'+cid" :style="chainBackground(cid)" class="col-sm-4 col-md-3 col-lg-2 col-xs-12 chatbots-chain" :class="{'is-compacted': !viewDetails, 'has-statistics': viewStatistics, 'shake animated': isAnimatedChain == cid}" v-show="viewChainTag == null || viewChainTag == chatbot.chains[cid].tag">
			<div class="chatbots-chains-header" @dblclick="chainTitleEdit(j)">
				<div v-if="chainTitleEditing != j">
					<i class="fas fa-bars fa-rotate-90 is-hidden-mobile" v-sortable-handle></i>
					<span v-if="chatbot.chains[cid].title">{{chatbot.chains[cid].title}}</span><span v-else>Без имени</span>
					<b-dropdown position="is-top" class="is-context-menu">
						<i class="fa fa-ellipsis-v has-text-grey" slot="trigger"></i>
						<b-dropdown-item aria-role="listitem" @click="chainRepeatableChange(cid)"><i class="has-mr-1" :class="chatbot.chains[cid].is_repeatable?'fa fas fa-check-square':'fa fa-square'"></i>Разрешить проходить повторно</b-dropdown-item>
						<b-dropdown-item aria-role="listitem" @click="cloneChain(j)"><i class="fa fa-clone has-mr-1"></i>Дублировать</b-dropdown-item>
						<hr aria-role="menuitem" class="dropdown-divider">
						<b-dropdown-item aria-role="listitem" class="has-text-danger" @click="deleteChain(j)"><i class="fa fa-trash-alt has-mr-1"></i>Удалить</b-dropdown-item>
					</b-dropdown>
					<b-dropdown position="is-bottom-right" v-model="chatbot.chains[cid].tag" @input="updateChain(cid)" class="chatbots-dropdown-tags">
						<i class="fa-circle" slot="trigger" :class="{fas: tags[chatbot.chains[cid].tag] != null, fal: !tags[chatbot.chains[cid].tag == null]}" :style="{color: tags[chatbot.chains[cid].tag]}"></i>
						<b-dropdown-item aria-role="listitem" :value="null" class="has-text-black">Нет метки</b-dropdown-item>
						<b-dropdown-item aria-role="listitem" :value="t" v-for="(w, t) in tags" :style="{background: w}" v-html="tagsTitles[w]?tagsTitles[w]:'&nbsp;'"></b-dropdown-item>
					</b-dropdown>
				</div>
				<input type="text" class="input" v-model="chatbot.chains[cid].title" v-else ref="chainTitleInput" @blur="updateChain(cid)" @keypress="if ($event.keyCode == 13) updateChain(cid)">
			</div>
			<sortable-list class="chatbots-messages" :class="{disabled: isUpdatingChain.indexOf(chatbot.chains[cid].chain_id) != -1}" style="flex-grow:1" lockAxis="y" v-model="chatbot.chains[cid].messages_index" use-drag-handle @input="resorted(chatbot.chains[cid])" :useWindowAsScrollContainer="true" :scrollContainer="scrollContainer" :contentWindow="scrollContainer">
				<sortable-item v-for="(id, i) in chatbot.chains[cid].messages_index" :id="'key'+cid+'_'+id" :index="i" :key="i" :item="id" class="chatbots-message" :class="{'is-debug-active': debug.active && debug.state[cid+'_'+id]}" :data-type="chatbot.chains[cid].messages[id].type">
					<div class="chatbots-message-loader" v-if="isUpdating.indexOf(cid+'.'+id) != -1"><div></div></div>
					<div class="chatbots-message-header" :data-hits="getMessageHits(cid, id)">
						<div><span v-if="chatbot.chains[cid].messages[id].delay" class="has-text-grey"><i class="fa fas fa-clock has-text-grey-light"></i>{{chatbot.chains[cid].messages[id].delay}}</span></div>
						<div v-sortable-handle class="resort-handler"></div>
						<div>
							<b-dropdown position="is-top" :close-on-click="false">
								<i class="fa fa-ellipsis-v has-text-grey" slot="trigger"></i>
								<b-dropdown-item aria-role="listitem">
								<b-dropdown position="is-top" @active-change="(s) => { updateDelay(s, cid, id) }">
									<div slot="trigger"><i class="fa fa-clock has-mr-1"></i>Таймер</div>
									<b-dropdown-item aria-role="listitem" custom><vue-chatbots-delay-form v-model="chatbot.chains[cid].messages[id].delay"></vue-chatbots-delay-form></b-dropdown-item>
								</b-dropdown>
								</b-dropdown-item>
								<hr aria-role="menuitem" class="dropdown-divider">
								<b-dropdown-item aria-role="listitem" class="has-text-danger" @click="deleteMessage(chatbot.chains[cid], i)"><i class="fa fa-trash-alt has-mr-1"></i>Удалить</b-dropdown-item>
							</b-dropdown>
						</div>
					</div>

					<component v-bind:is="'vue-chatbots-blocks-'+chatbot.chains[cid].messages[id].type" v-model="chatbot.chains[cid].messages[id]" :statistics="statistics" :viewDetails="viewDetails" :viewStatistics="viewStatistics" :chain_id="cid" :id="id" :chatbot="chatbot" @input="(v) => { update(cid, id, v.content) }" @goto="goto"></component>
					<div class="chatbots-debug-forward" v-if="debug.active && debug.state[cid+'_'+id]" :class="{'is-forwarding': debug.state[cid+'_'+id] == 'forwarding'}" @click="debugForward(cid, id)"></div>
				</sortable-item>
			</sortable-list>

			
			<center class="has-mt-2 has-mb-2" v-if="!isResorting">
				<tippy placement="top" trigger="click" theme='light' arrow interactive :ref="'tippy'+cid">
				<template v-slot:trigger>
					<a class="chatbots-chains-plus button" :class="{'is-loading': isAppending.indexOf(cid) != -1}"></a>
				</template>
				<a class="tooltip-menu" v-for="(v, i) in messageTypes" @click="addMessage(i, cid)">{{v.title}}</a>
				</tippy>
			
			
<!--
				<div :id='"chatbotsPlus"+cid' class="is-hidden">
					<a class="tooltip-menu" v-for="(v, i) in messageTypes" onclick="chatbot.addMessage(this)" :data-type="i" :data-cid="cid">{{v.title}}</a>
				</div>
				<a class="chatbots-chains-plus button" :class="{'is-loading': isAppending.indexOf(cid) != -1}" data-toggle="tooltip" data-placement="top" data-trigger='click' :data-html='"#chatbotsPlus"+cid' data-theme='light'></a>
-->
			</center>
		</sortable-item>
		
		<div class="col-sm-4 col-md-3 col-lg-2 col-xs-12 chatbots-chain is-chain-panel">
			<div class="chatbots-chains-header" style="border-bottom-style: dashed"><a @click="addChains" class="has-text-black"><i class="fal fa-plus has-mr-1"></i>Добавить новую цепочку</a></div>
		</div>
	</sortable-list>
<!--
	<div class="container has-mt-3" v-else>
	<div class="panel panel-default" v-if="!_.size(chatbots)">
		<div class="has-mb-4 has-mt-4 content has-text-grey has-text-centered">
		<div class="row">
			<div class="col-xs-12 col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
				<h3 class="has-p-2 has-text-grey-light has-text-centered has-mb-2"><i class="fal fa-robot has-text-grey-light" style="font-size: 5rem"></i></h3>
				<div class="has-mb-2">Чатботы</div>
					
				<button class="button" @click="newChatbot" class="button is-primary"><i class='fa fa-plus'></i>{{'Новый чатбот'|gettext}}</button>
			</div>
		</div>	 	
		</div>
	</div>
	</div>
-->
	<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
</div>
`});

window.$app.defineComponent("chatbots", "vue-chatbots-options-form", {data: () => ({
			isUpdating: false,
			isFetching: false,
			currentTab: 'common',
			values: {chatbot_id: null, title: '', menu: [], channels: []},
			variants: {},
			action: null,
			tmpFacebookProfiles: null,
			channelsOpened: [],
			currentDriver: null
		}),
		
		props: ['chatbot'],
		mixins: [FormModel],
		
		created() {
			this.$io.on('events:chatbot.channel:started', this.started);
			this.$io.on('events:chatbot.channel:stopped', this.stopped);

			this.fetchData(true);
		},
		
		beforeDestroy() {
			this.$io.off('events:chatbot.channel:started', this.started);
			this.$io.off('events:chatbot.channel:stopped', this.stopped);
		},
		
		computed: {
			facebookProfiles() {
				if (this.tmpFacebookProfiles == null) {
					this.$api.get('chatbots/options/accounts', {platform_id: 2}).then((data) => {
						if (data.result == 'success') {
							return this.tmpFacebookProfiles = data.response.accounts;
						}
					});
				} else {
					return this.tmpFacebookProfiles;
				}
			}
		},
		
		methods: {
			channelOpenLink(item) {
				switch (parseInt(item.platform_id)) {
					case 1:
						// Telegram
						return 'tg://resolve?domain='+item.channel_username;
						break;
					case 2:
						// Messenger
						return 'https://m.me/'+item.channel_uniq_id;
						break;
				}
			},
			
			channelOpenLinkTarget(item) {
				switch (item.platform_id) {
					case 2:
						// Messenger
						return '_blank';
						break;
				}
				
				return null;
			},
			
			toggleShowChannel(index) {
				if (this.channelsOpened.indexOf(index) == -1) {
					this.channelsOpened.push(index);
				} else {
					this.channelsOpened.splice(this.channelsOpened.indexOf(index), 1);
				}
			},
			addChannel(platform_id) {
				this.currentDriver = null;
				this.values.channels.push({channel_id: null, platform_id: platform_id, channel_token: '', channel_uniq_id: null, channel_username: '', is_active: false, chain_id: this.chatbot.chains_index[0]});
				this.channelsOpened.push(this.values.channels.length-1);
			},
			
			start(index) {
				this.update({name: 'start', index: index});
			},
			
			stop(index) {
				this.update({name: 'stop', index: index});
			},
			
			currentFacebookProfile(item) {
				let title = 'Профиль не выбран';
				if (this.tmpFacebookProfiles != null) {
					for (i = 0; i < this.tmpFacebookProfiles.length; i++) {
						if (this.tmpFacebookProfiles[i].id == item.channel_uniq_id) {
							title = this.facebookProfiles[i].name;
							break;
						}
					}
				}
				
				return title;
			},
			changedStartStop(o, v) {
				_.each(this.values.channels, (c) => {
					if (c.channel_id == o.channel_id) { 
						c.is_active = v; 
						c.channel_username = (o.info == undefined)?'':o.info.username
					}
					if (c.channel_token == o.token) { c.is_active = v; }
				})
			},
			
			started(o) {
				this.changedStartStop(o, true);
			},
			
			stopped(o) {
				this.changedStartStop(o, false);
			},
			
			deleteChannel(i) {
				this.$confirm('Вы уверены что хотите удалить этот канал?', 'is-danger').then(() => {
					this.values.channels.splice(i, 1);
				});
			},
			
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('chatbots/options/get', {}, this).then((data) => {
					this.isFetching = false;
					this.variants = data.response.chatbot.variants;
					this.values = data.response.chatbot.values;
				});
			},
			
			addMenuItem() {
				this.values.menu.push({command: '', title: '', chain: null})
			},
			
			removeMenuItem(i) {
				this.values.menu.splice(i, 1);
			},
			
			update(action = null) {
				this.isUpdating = true;
				this.$api.post('chatbots/options/set', Object.assign(this.values, {action: action}), this).then((data) => {
					this.isUpdating = false;
					if (data.result == 'success') {
						if (action) {
							this.values = data.response.values;
						} else {
							this.$parent.close();
						}
					}
				}).catch((error) => {
					this.isUpdating = false;
				})				
			}
		}, template: `
	<div class="modal-card modal-card-large">
		<header class="modal-card-head">
			<p class="modal-card-title">Настройки чатбота</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>

		<ul class="nav nav-tabs has-text-left">
			<li :class="{active: currentTab == 'common'}"><a @click="currentTab = 'common'">{{'Общие настройки'|gettext}}</a></li>
			<li :class="{active: currentTab == 'channels'}"><a @click="currentTab = 'channels'">{{'Каналы'|gettext}}</a></li>
			<li :class="{active: currentTab == 'menu'}"><a @click="currentTab = 'menu'">{{'Меню'|gettext}}</a></li>
			<li :class="{active: currentTab == 'tags'}"><a @click="currentTab = 'tags'">{{'Метки'|gettext}}</a></li>
		</ul>

		<section class="modal-card-body modal-card-body-blocks">
			<section v-if="currentTab == 'common'">
				<div class="row">
					<div class="col-xs-12 col-sm-3">
						<label class="label">Минимальная задержка</label>
						<div class="field has-addons">
							<div class="control is-expanded"><input type="number" class="input" v-model="values.min_delay"></div>
							<div class="control"><span class="button is-static">Секунд</span></div>
						</div>
					</div>
				</div>
			</section>
			
			<section v-if="currentTab == 'channels'">
				<div class="form-fields-item-list has-mb-2" v-for="(item, index) in values.channels" v-if="values.channels.length">
					<div class="form-fields-item" :class="{in: channelsOpened.indexOf(index) != -1}">
						<div class="form-fields-item-title" @click="toggleShowChannel(index)">
							<div class="form-fields-item-handle block-handle-link-caret"></div>
							<a class="has-text-danger is-pulled-right" @click.stop="deleteChannel(index)" :class="{disabled: item.is_active}"><i class="fa fa-trash-alt"></i></a>
							<span>{{variants.platforms[item.platform_id]}} <span v-if="item.channel_username" class="has-text-grey">— {{item.channel_username}} <a :href="channelOpenLink(item)" :target="channelOpenLinkTarget(item)" @click.stop="" class="has-ml-1 has-text-grey"><i class="fa fa-external-link"></i></a></span></span>
						</div>
						<div class="form-fields-item-options" v-if="channelsOpened.indexOf(index) != -1">
							<div class="has-mb-2">
							<div v-if="item.platform_id == 2"> <!-- facebook -->
								<b-field label="Профиль">
									<div class="field has-addons">
									<div class="control is-expanded">
									<b-dropdown v-model="item.channel_uniq_id" class="is-fullwidth" aria-role="list" expanded :disabled="item.is_active">
										<button class="button is-fullwidth" type="button" style="justify-content: space-between" slot="trigger">{{currentFacebookProfile(item)}}<i class="fal fa-chevron-down has-ml-1"></i></button>
										<b-dropdown-item :value="p.id" aria-role="listitem" v-for="p in facebookProfiles">
										<div class="media">
										    <img class="media-left avatar image is-24x24" :src="p.picture"></b-icon>
											<div class="media-content">{{p.name}}</div>
										</div>
										</b-dropdown-item>
	<!-- 									<option v-for="p in facebookProfiles" :value="p.id">{{p.name}}</option> -->
									</b-dropdown>
									</div>
									<div class="control">
										<button class="button has-text-danger" @click="stop(index)" v-if="item.is_active"><i class="fa fa-trash-alt has-mr-1"></i> Отключить</button>
										<button class="button" @click="start(index)" v-else><i class="fas fa-plug has-mr-1"></i> Подключить</button>
									</div>
									</div>
								</b-field>
							</div>
							<div v-if="item.platform_id == 1"> <!-- telegram -->
								<b-field label="Токен">
								<div class="field has-addons">
								<div class="control is-expanded">
									<input type="text" v-model="item.channel_token" class="input" :disabled="item.is_active">
								</div>
								<div class="control">
									<button class="button has-text-danger" @click="stop(index)" v-if="item.is_active"><i class="fa fa-trash-alt has-mr-1"></i> Отключить</button>
									<button class="button" @click="start(index)" v-else><i class="fas fa-plug has-mr-1"></i> Подключить</button>
								</div>
								</div>
								</b-field>
							</div>
							</div>
							
							<div class="row">
								<div class="col-xs-12 col-sm-4">
								<b-field label="Начинать с цепочки">
									<b-select v-model="item.chain_id" expanded :disabled="item.is_active">
										<option v-for="c in chatbot.chains" :value="c.chain_id"><span v-if="c.title">{{c.title}}</span><span v-else>Без имени</span></option>
									</b-select>		
								</b-field>
								</div>
							</div>
						</div>
					</div>
				</div>

				<b-dropdown @input="addChannel" v-modal="currentDriver" class="is-fullwidth" aria-role="list" expanded position="is-top-right">
					<button class="button is-dark" slot="trigger"><i class="fas fa-plus has-mr-1"></i> Добавить канал</button>
					<b-dropdown-item aria-role="listitem" value="1">Telegram</b-dropdown-item>
					<b-dropdown-item aria-role="listitem" value="2">Facebook</b-dropdown-item>
				</b-dropdown>
			</section>
			
			<section v-if="currentTab == 'menu'">
				<div class="has-mb-2" v-if="values.menu.length">
					<mx-item class="is-hidden-mobile mx-item-header">
					<div class="item-row row">
						<div class="col-xs-6 col-sm-4">Команда</div>
						<div class="col-xs-6 col-sm-4">Заголовок</div>
						<div class="col-xs col-shrink has-text-centered"><a class="button has-text-danger is-text" style="visibility: hidden; height: 1px;"><i class="fa fa-trash-alt"></i></a></div>
					</div>
					</mx-item>
					
					<mx-item v-for="(f, i) in values.menu">
					<div class="item-row row">
						<div class="col-xs-12 col-sm-4 has-mb-1-mobile">
							<input class="input" v-model="f.command" placeholder="Команда"></input>
						</div>
						<div class="col-xs-12 col-sm-4 has-mb-1-mobile">
							<input class="input" v-model="f.title" placeholder="Заголовок"></input>
						</div>
						<div class="col-xs-10 col-sm">
							<b-select v-model="f.chain" placeholder="-- Выберите цепочку --" expanded >
								<option :value="null">-- Выберите цепочку --</option>
								<option v-for="c in chatbot.chains" :value="c.chain_id"><span v-if="c.title">{{c.title}}</span><span v-else>Без имени</span></option>
							</b-select>		
						</div>
		            		
						<div class="col-xs-2 col-sm col-sm-shrink has-text-centered"><button type="button" class="button has-text-danger is-fullwidth" @click="removeMenuItem(i)"><i class="fa fa-trash-alt"></i></button></div>
					</div>
					</mx-item>
				</div>
								
				<button @click="addMenuItem" class="button is-dark"><i class="fas fa-plus has-mr-1"></i> Добавить пункт меню</button>
			</section>

			<section v-if="currentTab == 'tags'">
				<mx-item v-for="(tag, color) in values.tags">
					<div class="item-row row">
						<div class="col-xs col-shrink">
							<input class="input" style="pointer-events: none;width:3rem" :style="{background:color}" disabled="on"></input>
						</div>
						<div class="col-xs">
							<input class="input" v-model="values.tags[color]" placeholder="Название"></input>
						</div>
					</div>
				</mx-item>				
			</section>
		</section>
		<footer class="modal-card-foot level">
			<div class="level-left">
<!-- 				<a class="button has-text-danger" @click="deleteButton"><i class="fa fa-trash-alt"></i>Удалить</a> -->
			</div>
			<div class="level-right">
				<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="update(null)">{{'Сохранить'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});
window.$app.defineModule("chatbots", []);