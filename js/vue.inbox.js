
window.$app.defineComponent("inbox", "vue-inbox-details-chains", {data() {
			return {
				isFetching: false,
				isSending: false,
				chatbot: null,
				chain_id: null,
				messageIndex: 0
			}
		},
		
		props: ['dialog_id'],

		computed: {
			message() {
				return this.chatbot.chains[this.chain_id].messages[this.chatbot.chains[this.chain_id].messages_index[this.messageIndex]];
			}
		},
				
		methods: {
			loadEntry(name) {
				name = 'vue-chatbots-blocks-'+name;
				window.$app.loadComponent(name);
				return name;
			},
						
			prepare() {
				this.isFetching = true;
				this.$api.get('chatbots/get').then((data) => {
					if (data.result == 'success') {
						this.chatbot = data.response.chatbot;
					}
					this.isFetching = false;
				}).catch((e) => {
					this.isFetching = false;
				});
			},
			
			cancel() {
				this.chatbot = null;
				this.chain_id = null;
				this.messageIndex = 0;
			},
			
			send() {
				this.isSending = true;
				
				this.$api.get('chatbots/chains/start', {dialog_id: this.dialog_id, chain_id: this.chain_id, message_id: this.messageIndex?(this.chatbot.chains[this.chain_id].messages_index[this.messageIndex]):null}).then((data) => {
					this.isSending = false;
					this.cancel();
				});
				
			}
		}, template: `
	<div>
		<button type="button" class="button is-light is-fullwidth" :class="{'is-loading': isFetching}" v-if="!chatbot" @click="prepare">Отправить цепочку</button>
		<div v-else>
			<b-select v-model="chain_id" placeholder="-- Выберите цепочку --">
				<option :value="null">-- Выберите цепочку --</option>
				<option v-for="id in chatbot.chains_index" :value="id" v-if="_.size(chatbot.chains[id].messages)"><span v-if="chatbot.chains[id].title">{{chatbot.chains[id].title}}</span><span v-else class="has-text-grey">Без имени</span></option>
			</b-select>
			
			<div class="has-mt-2 has-mb-2" v-if="chain_id" style="display: flex;align-items: center">
				<button class="button is-light" type="button" @click="messageIndex--" :disabled="messageIndex == 0"><i class="far fa-chevron-left"></i></button>
				<button class="button is-light has-ml-1" type="button" @click="messageIndex++" :disabled="messageIndex == _.size(chatbot.chains[chain_id].messages_index)-1"><i class="far fa-chevron-right"></i></button>
				
				<p class="has-ml-1">{{messageIndex+1}} из {{_.size(chatbot.chains[chain_id].messages_index)}}</p>
			</div>
			
			<div v-if="chain_id" class="has-p-1 has-background-light" style="pointer-events: none">
				<div class="chatbots-message" :data-type="message.type">
					<component v-bind:is="loadEntry(message.type)" v-model="message" :viewDetails="false" class="has-pt-1"></component>
				</div>
			</div>
			
			<div class="row row-small">
				<div class="col-xs-6">
					<button type="button" class="has-mt-2 button is-dark is-fullwidth" @click="cancel">Отменить</button>
				</div>
				<div class="col-xs-6">
					<button type="button" class="has-mt-2 button is-primary is-fullwidth" :class="{'is-loading': isSending}" @click="send" :disabled="!chain_id">Отправить {{messageIndex}}</button>
				</div>
			</div>
		</div>
	</div>
`});

window.$app.defineComponent("inbox", "vue-inbox-index", {data() {
			return {
				isFetchingDialogs: true,
				isFetchingMessages: false,
				isSending: false,
				dialogs: [],
				details: [],
				dialogTarget: 'all',
				dialog_id: null,
				dialog: null,
				messages: [],
				limit: 20,
				text: '',
				audio: null,
				dialog_search: '',
				dialogLoading: []
			}
		},
		
		created() {
			this.audio = new Audio('/s/sounds/message.mp3');

			this.$io.on('events:inbox:message', this.receivedMessage);
			this.fetchDialogs();
		},
		
		destroyed: function() {
			this.$io.off('events:inbox:message', this.receivedMessage);
		},
		
		watch: {
			dialog_id(newVal, oldVal) {
				this.messages = [];
// 				this.fetchMessages();

				if (this.$refs.infiniteLoading) this.$refs.infiniteLoading.$emit('$InfiniteLoading:reset');
			}
		},
		
		beforeRouteEnter (to, from, next) {
			$mx('body').addClass('has-hidden-footer');
			next();
		},
		
		beforeRouteLeave (to, from, next) {
			$mx('body').removeClass('has-hidden-footer');
			next();
		},
		
		methods: {
			showPhoto(photo) {
				this.$buefy.modal.open({content: '<p class="image"><img src="'+photo+'"></p>', canCancel: ['escape', 'outside']});
			},
			
			textKeydown(e) {
				if (e.metaKey && (e.keyCode == 13)) {
					this.sendMessage();
				}
	
				if (this.dialog.is_unreaded) {
					this.readed(this.dialog.dialog_id, true);
				}				
			},
			
			receivedMessage(data) {
				if (this.dialog_id && data.channel_id == this.dialog.channel_id && !this.dialog_search.length) {
					try {
						data.data.message = JSON.parse(data.data.message);

						if (data.id == this.dialog.id) {
							this.messages.push(data.data);
							this.messages.sort((a, b) => {
								return a.tms - b.tms;
							});
							
							if (data.data.is_unreaded) this.dialog.is_unreaded = 1;
							
							this.scrollEnd();
						}
						
						if (data.data.is_unreaded && (data.id != this.dialogs[i].id)) {
							this.audio.play();
						}
						
						let sort = () => {
							this.dialogs.sort((a, b) => {
								if (b.is_unreaded == a.is_unreaded && b.tms_updated == a.tms_updated) return 0;
								if (b.is_unreaded && !a.is_unreaded) return 1;
								return ((b.is_unreaded && a.is_unreaded && b.tms_updated > a.tms_updated) || (b.tms_updated > a.tms_updated))?1:-1;
							})
						}
						
						let found = false;
						for(i = 0; i < this.dialogs.length; i++) {
							if (data.channel_id == this.dialogs[i].channel_id && data.id == this.dialogs[i].id) {
								this.dialogs[i].message = data.data.message;
								this.dialogs[i].tms_updated = data.data.tms;
								if (data.data.is_unreaded) this.dialogs[i].is_unreaded = 1;
								sort();
								found = true;
								break;
							}
						}
						
						if (!found && this.dialogLoading.indexOf(data.data.dialog_id) == -1) {
							this.dialogLoading.push(data.data.dialog_id);
							this.$api.get('inbox/dialogs/list', {dialog_id: data.data.dialog_id}).then((d) => {
								if (d.result == 'success' && d.response.dialogs.length) {
									this.dialogs.push(d.response.dialogs[0]);
									this.dialogLoading.splice(this.dialogLoading.indexOf(data.data.dialog_id), 1);
									sort();
								}
							});
						}
						
						
					} catch(e) { }
				}
			},
			
			infinite(state) {
				let container = this.$el.querySelector(".inbox-messages-scroll");
				let h = container.scrollHeight;
				this.fetchMessages().then((messages) => {
					messages.length?state.loaded():state.complete();
					container.scrollTop += (container.scrollHeight - h);
				});
			},
			
			scrollEnd() {
				this.$nextTick(() => {
					var container = this.$el.querySelector(".inbox-messages-scroll");
					container.scrollTop = container.scrollHeight - container.clientHeight;
				});
			},		
				
			sendMessage() {
				if (this.text.trim() != '') {
					this.isSending = true;
					let dialog_id = this.dialog_id;
					this.$api.post('inbox/dialogs/send', {dialog_id: dialog_id, message: {text: this.text}}).then((response) => {
						this.text = '';
						this.isSending = false;
						this.readed(dialog_id, false);
					});
				}
			},
			
			readed(dialog_id, send_status) {
				let index = _.findIndex(this.dialogs, (o) => o.dialog_id == dialog_id);
				if (index != -1) this.dialogs[index].is_unreaded = 0;
				this.dialog.is_unreaded = 0;

				if (send_status) {
					this.$api.get('inbox/dialogs/readed', {dialog_id: dialog_id});
				}
			},
			
			fetchMessages() {
				return new Promise((resolve, reject) => {
					if (this.messages.length) {
						
						this.$api.get('inbox/dialogs/messages', {dialog_id: this.dialog_id, limit: 20, offset: this.messages[0].message_id}).then(data => {
							let first = this.messages.length;
							let m = data.response.messages;
							this.messages = m.reverse().concat(this.messages);
							if (!first) this.scrollEnd();
							resolve(m);
						});

					} else {
						
						this.$api.get('inbox/dialogs/get', {dialog_id: this.dialog_id}).then(data => {
							this.dialog = data.response.dialog;
							
							//if (this.dialog.is_unreaded) this.readed(this.dialog.dialog_id, true);
							
							this.details = data.response.details;
							this.messages = m = data.response.messages.reverse();
							this.scrollEnd();
							resolve(m);
						});
						
					}
				});
			},
			
			infiniteDialogs(e) {
				if ((e.target.scrollHeight - e.target.scrollTop -20 < e.target.offsetHeight) && (this.dialogs.length > this.limit) && !this.isFetchingDialogs) {
					this.limit += 20;
					this.fetchDialogs();
				}
			},
			
			searchDialog: _.debounce(function(q) {
				this.limit = 20;
				this.fetchDialogs()
			}, 500),
			
			fetchDialogs() {
				this.isFetchingDialogs = true;
				this.$api.get('inbox/dialogs/list', {limit: this.limit, query: this.dialog_search}).then((data) => {
					this.dialogs = data.response.dialogs;
					this.isFetchingDialogs = false;
					
					this.dialog_id = this.dialogs[0].dialog_id;
					
// 					if (this.lessons.length) this.$router.push('/courses/'+this.course_id+'/lessons/'+this.lessons[0].lesson_id+'/');
				});	
			}
		}, template: `
	<div class="inbox-main">
		<div class="inbox-dialogs">
			<div class="inbox-header">
<!-- 				<input type="search" class="input" placeholder="Поиск"> -->
<!-- 				<i class="far fa-align-left has-mr-2"></i> Все -->
<!--
				<b-field class="has-tabs-style" style="width:100%">
		            <b-radio-button v-model="dialogTarget" type="active" class="is-expanded" native-value="all">Все</b-radio-button>
		            <b-radio-button v-model="dialogTarget" type="active" class="is-expanded" native-value="my">Мои</b-radio-button>
				</b-field>
-->
				
				<input type="search" class="input" v-model="dialog_search" placeholder="Поиск" @input="searchDialog">

			</div>
			<div class="inbox-dialogs-scroll" @scroll="infiniteDialogs">
			<div v-for="f in dialogs" :class="{in: f.dialog_id == dialog_id, unreaded: f.is_unreaded}" @click="dialog_id = f.dialog_id">
				<img :src="f.avatar?('//'+$account.storage_domain+f.avatar):'/s/i/empty-avatar.jpg'" class="profile-avatar image is-48x48">
				<div class="is-title">
					<div>{{f.full_name}}</div>
					<div class="has-text-grey" v-if="f.message && f.message.text" v-html="f.message.text"></div>
				</div>
			</div>
			</div>
			<b-loading :is-full-page="false" :active.sync="isFetchingDialogs"></b-loading>
		</div>
		<div class="inbox-messages" :class="{'is-empty': !dialog_id && !isFetchingMessages}">
			<div class="inbox-header" v-if="dialog && dialog_id">
				<img class="profile-avatar image is-32x32 has-mr-2" :src="'//'+$account.storage_domain+dialog.avatar"> 
				<div>{{dialog.full_name}}</div>
			</div>
			
			<div style="flex-grow: 1" v-if="isFetchingMessages || !dialog_id"></div>
			<div class="inbox-messages-scroll" v-else>
				<infinite-loading @infinite="infinite" direction="top" spinner="spiral" ref="infiniteLoading">
		 			<span slot="no-results">Нет сообщений</span>
		 			<span slot="no-more"></span>
		 		</infinite-loading>
				
				<div v-for="m in messages" class="inbox-message inbox-message">
					
					<div class="inbox-message-content" :class="{received: m.who == 'u', sent: m.who == 'b'}">
					<div class="inbox-message-avatar" :style="{backgroundImage: 'url('+((m.who == 'u')?('//'+$account.storage_domain+dialog.avatar):(m.avatar?m.avatar:'/s/i/taplink-logo.jpg'))+')'}"></div> 
						<div class="inbox-message-body" :data-tms="m.tms|datetime">
							<div>
							<a href='#' class="inbox-photo" v-if="m.message.pictures" @click.prevent="showPhoto(photo)" v-for="photo in m.message.pictures"><img :src='photo'></a>
							<div v-if="m.message.document">
								<b>{{m.message.document.file_name}}</b><br>{{m.message.document.file_size}}
							</div>
							<div v-if="m.message && m.message.text" v-html="m.message.text" class="inbox-message-text"></div>
							</div>
						</div>
					</div>
				</div>
				
			</div>
			<div class="inbox-messages-footer">
				<textarea v-model="text" class="input" placeholder="Написать сообщение ..." @keydown="textKeydown"></textarea>
				<div class="level">
					<div class="level-left"></div>
					<div class="level-right"><button class="button is-primary" :class="{'is-loading': isSending}" @click="sendMessage">Отправить</button></div>
 				</div>
			</div>
			<b-loading :is-full-page="false" :active.sync="isFetchingMessages"></b-loading>
		</div>
		<div class="inbox-sidebar">
			<div class="inbox-header">Детали</div>
			
			<div v-for="d in details" class="inbox-details-block">
				<div class="row has-mb-1" v-for="r in d.rows"><div class="col-xs-5 has-text-grey">{{r.title}}:</div> <div class="col-xs-7">{{r.value}}</div></div>				
			</div>
			
			<vue-inbox-details-chains class="inbox-details-block" :dialog_id="dialog_id"></vue-inbox-details-chains>
		</div>
	</div>
`});
window.$app.defineModule("inbox", []);