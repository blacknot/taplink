window.$app.defineComponent("addons.catalog.klaviyo","vue-addons-catalog-klaviyo-options",{props:["values","variants","addon_id","isInstalling","currentTab"],mixins:[FormModel],template:'<section class="modal-card-body modal-card-body-blocks"> <section class="content" v-if="currentTab == \'description\'"> <slot name="allow"></slot> <div class="field">{{\'Klaviyo — платформа автоматизации email маркетинга. Собирайте новых подписчиков электронной почты на своей странице. Свяжите формы с списками в Klaviyo и увеличивайте свою подписную базу.\'|gettext}}</div> <a href=\'https://convertkit.com/\' target="_blank">{{\'Открыть сайт\'|gettext}}</a> </section> <section class="content" v-if="currentTab == \'options\'"> <b-field label="API Key" :message="errors.key" :class="{\'has-error\': errors.key}"> <input type="text" class="input" v-model="values.options.key"> </b-field> </section> </section>'}),window.$app.defineModule("addons.catalog.klaviyo",[]);
