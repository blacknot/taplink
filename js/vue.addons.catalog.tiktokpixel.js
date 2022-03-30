window.$app.defineComponent("addons.catalog.tiktokpixel","vue-addons-catalog-tiktokpixel-entry",{props:["values","addons","addon","options","variants","variants_block"],mixins:[FormModel],template:'<div> <div class="field" v-for="(v, k) in variants_block.slots"> <label class="label" v-if="v">{{v}}</label> <label class="label" v-else>{{\'Название события\'|gettext}}</label> <input type=\'text\' class="input" v-model=\'options.slots[k]\'> </div> </div>'}),window.$app.defineComponent("addons.catalog.tiktokpixel","vue-addons-catalog-tiktokpixel-options",{props:["values","variants","addon_id","isInstalling","currentTab"],mixins:[FormModel],template:'<section class="modal-card-body modal-card-body-blocks"> <section class="content" v-if="currentTab == \'description\'"> <slot name="allow"></slot> <div class="field">{{\'TikTok Pixel — это код, который создается в рекламном кабинете TikTok Ads и устанавливается на Таплинк. Он позволяет создавать аудитории для таргетинга в рекламе ТикТок, использовать цель рекламы «Конверсии» и оценивать эффективность продвижения.\'|gettext}}</div> </section> <section class="content" v-if="currentTab == \'options\'"> <p>{{\'На этапе выбора способа установки пикселя укажите вариант "Вручную" (Manually install the code). Полностью скопируйте код и вставьте его в поле ниже.\'|gettext}}</p> <b-field :label="\'Укажите код пикселя\'|gettext" :message="errors.code" :class="{\'has-error\': errors.code}"> <vue-component-codemirror :placeholder="\'Разместите тут код\'|gettext" v-model="values.options.code"/> </b-field> </section> </section>'}),window.$app.defineModule("addons.catalog.tiktokpixel",[]);
