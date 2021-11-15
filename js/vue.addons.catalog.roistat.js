window.$app.defineComponent("addons.catalog.roistat","vue-addons-catalog-roistat-options",{props:["values","variants","addon_id","isInstalling","currentTab"],mixins:[FormModel],template:'<section class="modal-card-body modal-card-body-blocks"> <section class="content" v-if="currentTab == \'description\'"> <slot name="allow"></slot> <div class="field">Roistat — Сервис сквозной аналитики. При создании заказа создаёт заявку в Roistat.</div> <p>Нет аккаунта? <a href=\'http://roistat.com/r/xofkrznj\' target="_blank">Зарегистрировать</a></p> </section> <section class="content" v-if="currentTab == \'options\'"> <b-field label="Скопируйте код счетчика Roistat и вставьте в поле ниже" :message="errors.code" :class="{\'has-error\': errors.code}"> <textarea class=\'input autoresize-init\' :placeholder="\'Разместите тут код\'|gettext" style="min-height: 100px" v-model="values.options.code"></textarea> </b-field> <b-field label="Укажите ваш Webhook" :message="errors.webhook" :class="{\'has-error\': errors.webhook}"> <input type="text" class="input" v-model="values.options.webhook"> </b-field> </section> </section>'}),window.$app.defineModule("addons.catalog.roistat",[]);
