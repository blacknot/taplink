var _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},_createClass=function(){function n(e,t){for(var i=0;i<t.length;i++){var n=t[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(e,t,i){return t&&n(e.prototype,t),i&&n(e,i),e}}();function _toConsumableArray(e){if(Array.isArray(e)){for(var t=0,i=Array(e.length);t<e.length;t++)i[t]=e[t];return i}return Array.from(e)}function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}DEFAULT_THEMES=["light","dark"],COMMON_LANGUAGES={none:"Auto-detect",apache:"Apache",bash:"Bash",cs:"C#",cpp:"C++",css:"CSS",coffeescript:"CoffeeScript",diff:"Diff",go:"Go",html:"HTML, XML",http:"HTTP",json:"JSON",java:"Java",javascript:"JavaScript",kotlin:"Kotlin",less:"Less",lua:"Lua",makefile:"Makefile",markdown:"Markdown",nginx:"Nginx",objectivec:"Objective-C",php:"PHP",perl:"Perl",properties:"Properties",python:"Python",ruby:"Ruby",rust:"Rust",scss:"SCSS",sql:"SQL",shell:"Shell Session",swift:"Swift",toml:"TOML, also INI",typescript:"TypeScript",yaml:"YAML",plaintext:"Plaintext"};var CodeBox=function(){function a(e){var t=e.data,i=e.api,n=e.config;_classCallCheck(this,a),this.api=i,this.config={themeName:n.themeName&&"string"==typeof n.themeName?n.themeName:"",themeURL:n.themeURL&&"string"==typeof n.themeURL?n.themeURL:"",useDefaultTheme:n.useDefaultTheme&&"string"==typeof n.useDefaultTheme&&DEFAULT_THEMES.includes(n.useDefaultTheme.toLowerCase())?n.useDefaultTheme:"light"},this.data={code:t.code&&"string"==typeof t.code?t.code:"",language:t.language&&"string"==typeof t.language?t.language:"Auto-detect",theme:t.theme&&"string"==typeof t.theme?t.theme:this._getThemeURLFromConfig()},this.highlightScriptID="highlightJSScriptElement",this.highlightCSSID="highlightJSCSSElement",this.codeArea=document.createElement("div"),this.selectInput=document.createElement("input"),this.selectDropIcon=document.createElement("i"),this._injectHighlightJSScriptElement(),this._injectHighlightJSCSSElement(),this.api.listeners.on(window,"click",this._closeAllLanguageSelects,!0)}return _createClass(a,[{key:"render",value:function(){var t=this,e=document.createElement("pre"),i=this._createLanguageSelectElement();return e.setAttribute("class","codeBoxHolder"),this.codeArea.setAttribute("class","codeBoxTextArea "+this.config.useDefaultTheme+" "+this.data.language),this.codeArea.setAttribute("contenteditable",!0),this.codeArea.innerText=this.data.code,this.api.listeners.on(this.codeArea,"blur",function(e){return t._highlightCodeArea(e)},!1),this.api.listeners.on(this.codeArea,"paste",function(e){return t._handleCodeAreaPaste(e)},!1),e.appendChild(this.codeArea),e.appendChild(i),hljs.highlightBlock(this.codeArea),e}},{key:"save",value:function(){return{language:this.data.language,code:this.codeArea.innerText}}},{key:"validate",value:function(e){return!!e.code.trim()}},{key:"destroy",value:function(){var t=this;this.api.listeners.off(window,"click",this._closeAllLanguageSelects,!0),this.api.listeners.off(this.codeArea,"blur",function(e){return t._highlightCodeArea(e)},!1),this.api.listeners.off(this.codeArea,"paste",function(e){return t._handleCodeAreaPaste(e)},!1),this.api.listeners.off(this.selectInput,"click",function(e){return t._handleSelectInputClick(e)},!1)}},{key:"_createLanguageSelectElement",value:function(){var i=this,e=document.createElement("div"),n=document.createElement("div"),t=Object.entries(COMMON_LANGUAGES);return e.setAttribute("class","codeBoxSelectDiv"),this.selectDropIcon.setAttribute("class","codeBoxSelectDropIcon "+this.config.useDefaultTheme),this.selectDropIcon.innerHTML="&#8595;",this.selectInput.setAttribute("class","codeBoxSelectInput "+this.config.useDefaultTheme),this.selectInput.setAttribute("type","text"),this.selectInput.setAttribute("readonly",!0),this.selectInput.value=this.data.language,this.api.listeners.on(this.selectInput,"click",function(e){return i._handleSelectInputClick(e)},!1),n.setAttribute("class","codeBoxSelectPreview"),t.forEach(function(t){var e=document.createElement("p");e.setAttribute("class","codeBoxSelectItem "+i.config.useDefaultTheme),e.setAttribute("data-key",t[0]),e.textContent=t[1],i.api.listeners.on(e,"click",function(e){return i._handleSelectItemClick(e,t)},!1),n.appendChild(e)}),e.appendChild(this.selectDropIcon),e.appendChild(this.selectInput),e.appendChild(n),e}},{key:"_highlightCodeArea",value:function(){hljs.highlightBlock(this.codeArea)}},{key:"_handleCodeAreaPaste",value:function(e){e.stopPropagation()}},{key:"_handleSelectInputClick",value:function(e){e.target.nextSibling.classList.toggle("codeBoxShow")}},{key:"_handleSelectItemClick",value:function(e,t){e.target.parentNode.parentNode.querySelector(".codeBoxSelectInput").value=t[1],e.target.parentNode.classList.remove("codeBoxShow"),this.codeArea.removeAttribute("class"),this.data.language=t[0],this.codeArea.setAttribute("class","codeBoxTextArea "+this.config.useDefaultTheme+" "+this.data.language),hljs.highlightBlock(this.codeArea)}},{key:"_closeAllLanguageSelects",value:function(){for(var e=document.querySelectorAll(".codeBoxSelectPreview"),t=0,i=e.length;t<i;t++)e[t].classList.remove("codeBoxShow")}},{key:"_injectHighlightJSScriptElement",value:function(){$mx.lazy("https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/highlight.min.js")}},{key:"_injectHighlightJSCSSElement",value:function(){var e,t,i=document.querySelector("#"+this.highlightCSSID),n=this._getThemeURLFromConfig();i?i.setAttribute("href",n):(e=document.createElement("link"),t=document.querySelector("head"),e.setAttribute("rel","stylesheet"),e.setAttribute("href",n),e.setAttribute("id",this.highlightCSSID),t&&t.appendChild(e))}},{key:"_getThemeURLFromConfig",value:function(){var e="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/styles/atom-one-"+this.config.useDefaultTheme+".min.css";return this.config.themeName&&(e="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/styles/"+this.config.themeName+".min.css"),this.config.themeURL&&(e=this.config.themeURL),e}}],[{key:"sanitize",get:function(){return{code:!0,language:!1,theme:!1}}},{key:"toolbox",get:function(){return{title:"Code",icon:'<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9.71,6.29a1,1,0,0,0-1.42,0l-5,5a1,1,0,0,0,0,1.42l5,5a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42L5.41,12l4.3-4.29A1,1,0,0,0,9.71,6.29Zm11,5-5-5a1,1,0,0,0-1.42,1.42L18.59,12l-4.3,4.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0l5-5A1,1,0,0,0,20.71,11.29Z"/></svg>'}}},{key:"displayInToolbox",get:function(){return!0}},{key:"enableLineBreaks",get:function(){return!0}}]),a}(),ImagesUi=function(){function o(e){var t=e.api,i=e.config,n=e.onSelectFile,a=e.readOnly;_classCallCheck(this,o),this.api=t,this.config=i,this.onSelectFile=n,this.readOnly=a,this.nodes={wrapper:ImagesMake("div",[this.CSS.baseClass,this.CSS.wrapper]),imageContainer:ImagesMake("div",[this.CSS.imageContainer]),fileButton:this.createFileButton(),imageEl:[],imagePreloader:ImagesMake("div",this.CSS.imagePreloader),caption:ImagesMake("div",[this.CSS.input,this.CSS.caption],{contentEditable:!this.readOnly})},this.nodes.caption.dataset.placeholder=this.config.captionPlaceholder,this.nodes.imageContainer.appendChild(this.nodes.imagePreloader),this.nodes.wrapper.appendChild(this.nodes.imageContainer),this.nodes.wrapper.appendChild(this.nodes.caption),this.nodes.wrapper.appendChild(this.nodes.fileButton)}return _createClass(o,[{key:"render",value:function(e){return e.file&&0!==Object.keys(e.file).length?this.toggleStatus(o.status.UPLOADING):this.toggleStatus(o.status.EMPTY),this.nodes.wrapper}},{key:"createFileButton",value:function(){var e=this,t=ImagesMake("div",[this.CSS.button]);return t.innerHTML=this.config.buttonContent||buttonIcon+" "+this.api.i18n.t("Select an Image"),t.addEventListener("click",function(){e.onSelectFile()}),t}},{key:"showPreloader",value:function(e){this.nodes.imagePreloader.style.backgroundImage="url("+e+")",this.toggleStatus(o.status.UPLOADING)}},{key:"hidePreloader",value:function(){this.nodes.imagePreloader.style.backgroundImage="",this.toggleStatus(o.status.EMPTY)}},{key:"fillImage",value:function(e){var n=this,a=$mx('<div class="doc-image" data-size="'+e.length+'"></div>')[0];_.each(e,function(e){var t={src:e.url},i=ImagesMake("IMG",n.CSS.imageEl,t);i.addEventListener("load",function(){n.toggleStatus(o.status.FILLED),n.nodes.imagePreloader&&(n.nodes.imagePreloader.style.backgroundImage="")}),a.appendChild(i),n.nodes.imageEl.push(i)}),this.nodes.imageContainer.innerHTML="",this.nodes.imageContainer.appendChild(a)}},{key:"fillCaption",value:function(e){this.nodes.caption&&(this.nodes.caption.innerHTML=e)}},{key:"toggleStatus",value:function(e){for(var t in o.status)Object.prototype.hasOwnProperty.call(o.status,t)&&this.nodes.wrapper.classList.toggle(this.CSS.wrapper+"--"+o.status[t],e===o.status[t])}},{key:"applyTune",value:function(e,t){this.nodes.wrapper.classList.toggle(this.CSS.wrapper+"--"+e,t)}},{key:"CSS",get:function(){return{baseClass:this.api.styles.block,loading:this.api.styles.loader,input:this.api.styles.input,button:this.api.styles.button,wrapper:"image-tool",imageContainer:"image-tool__image",imagePreloader:"image-tool__image-preloader",imageEl:"image-tool__image-picture",caption:"image-tool__caption"}}}],[{key:"status",get:function(){return{EMPTY:"empty",UPLOADING:"loading",FILLED:"filled"}}}]),o}(),ImagesMake=function(e,t,i){var n,a=1<arguments.length&&void 0!==t?t:null,o=2<arguments.length&&void 0!==i?i:{},s=document.createElement(e);for(var l in Array.isArray(a)?(n=s.classList).add.apply(n,_toConsumableArray(a)):a&&s.classList.add(a),o)s[l]=o[l];return s},bgIcon='<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.043 8.265l3.183-3.183h-2.924L4.75 10.636v2.923l4.15-4.15v2.351l-2.158 2.159H8.9v2.137H4.7c-1.215 0-2.2-.936-2.2-2.09v-8.93c0-1.154.985-2.09 2.2-2.09h10.663l.033-.033.034.034c1.178.04 2.12.96 2.12 2.089v3.23H15.3V5.359l-2.906 2.906h-2.35zM7.951 5.082H4.75v3.201l3.201-3.2zm5.099 7.078v3.04h4.15v-3.04h-4.15zm-1.1-2.137h6.35c.635 0 1.15.489 1.15 1.092v5.13c0 .603-.515 1.092-1.15 1.092h-6.35c-.635 0-1.15-.489-1.15-1.092v-5.13c0-.603.515-1.092 1.15-1.092z"/></svg>',borderIcon='<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M15.8 10.592v2.043h2.35v2.138H15.8v2.232h-2.25v-2.232h-2.4v-2.138h2.4v-2.28h2.25v.237h1.15-1.15zM1.9 8.455v-3.42c0-1.154.985-2.09 2.2-2.09h4.2v2.137H4.15v3.373H1.9zm0 2.137h2.25v3.325H8.3v2.138H4.1c-1.215 0-2.2-.936-2.2-2.09v-3.373zm15.05-2.137H14.7V5.082h-4.15V2.945h4.2c1.215 0 2.2.936 2.2 2.09v3.42z"/></svg>',stretchedIcon='<svg width="17" height="10" viewBox="0 0 17 10" xmlns="http://www.w3.org/2000/svg"><path d="M13.568 5.925H4.056l1.703 1.703a1.125 1.125 0 0 1-1.59 1.591L.962 6.014A1.069 1.069 0 0 1 .588 4.26L4.38.469a1.069 1.069 0 0 1 1.512 1.511L4.084 3.787h9.606l-1.85-1.85a1.069 1.069 0 1 1 1.512-1.51l3.792 3.791a1.069 1.069 0 0 1-.475 1.788L13.514 9.16a1.125 1.125 0 0 1-1.59-1.591l1.644-1.644z"/></svg>',uploadIcon='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 640 512"><path d="M543.7 200.1C539.7 142.1 491.4 96 432 96c-7.6 0-15.1.8-22.4 2.3C377.7 58.3 328.1 32 272 32c-84.6 0-155.5 59.7-172.3 139.8C39.9 196.1 0 254.4 0 320c0 88.4 71.6 160 160 160h336c79.5 0 144-64.5 144-144 0-61.8-39.2-115.8-96.3-135.9zM496 432H160c-61.9 0-112-50.1-112-112 0-56.4 41.7-103.1 96-110.9V208c0-70.7 57.3-128 128-128 53.5 0 99.3 32.8 118.4 79.4 11.2-9.6 25.7-15.4 41.6-15.4 35.3 0 64 28.7 64 64 0 11.8-3.2 22.9-8.8 32.4 2.9-.3 5.9-.4 8.8-.4 53 0 96 43 96 96s-43 96-96 96zM296.5 150.5c-4.7-4.7-12.3-4.7-17 0l-104 104c-4.7 4.7-4.7 12.3 0 17l16.9 16.9c4.7 4.7 12.4 4.7 17.1-.1l54.5-55.8V372c0 6.6 5.4 12 12 12h24c6.6 0 12-5.4 12-12V232.5l54.5 55.8c4.7 4.8 12.3 4.8 17.1.1l16.9-16.9c4.7-4.7 4.7-12.3 0-17l-104-104z"/></svg>',phoneIcon='<svg width="20" height="20"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M272 0H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h224c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48zm-6 464H54c-3.3 0-6-2.7-6-6V54c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v404c0 3.3-2.7 6-6 6zm-70-32h-72c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h72c6.6 0 12 5.4 12 12v8c0 6.6-5.4 12-12 12z"></path></svg>',ImagesTunes=function(){function s(e){var t=e.ui,i=e.api,n=e.actions,a=e.onChange;_classCallCheck(this,s),this.ui=t,this.api=i,this.actions=n,this.onChange=a,this.buttons=[]}return _createClass(s,[{key:"render",value:function(n){var a=this,o=ImagesMake("div",this.CSS.wrapper);this.buttons=[],s.tunes.concat(this.actions).forEach(function(e){var t=a.api.i18n.t(e.title),i=ImagesMake("div",[a.CSS.buttonBase,a.CSS.button],{innerHTML:e.icon,title:t});i.addEventListener("click",function(){a.tuneClicked(e.name,e.action)}),i.dataset.tune=e.name,i.classList.toggle(a.CSS.buttonActive,n[e.name]),a.buttons.push(i),a.api.tooltip.onHover(i,t,{placement:"top"}),o.appendChild(i)});var e="Upload new picture",t=ImagesMake("div",[this.CSS.buttonBase,this.CSS.button],{innerHTML:uploadIcon,title:e});return t.addEventListener("click",function(){console.log(a.api),a.ui.nodes.fileButton.click()}),this.api.tooltip.onHover(t,e,{placement:"top"}),o.appendChild(t),o}},{key:"tuneClicked",value:function(t,e){if("function"==typeof e&&!e(t))return!1;var i=this.buttons.find(function(e){return e.dataset.tune===t});i.classList.toggle(this.CSS.buttonActive,!i.classList.contains(this.CSS.buttonActive)),this.onChange(t)}},{key:"CSS",get:function(){return{wrapper:"",buttonBase:this.api.styles.settingsButton,button:"image-tool__tune",buttonActive:this.api.styles.settingsButtonActive}}}],[{key:"tunes",get:function(){return[{name:"withBorder",icon:borderIcon,title:"With border"},{name:"stretched",icon:stretchedIcon,title:"Stretch image"},{name:"withBackground",icon:bgIcon,title:"With background"},{name:"isPhone",icon:phoneIcon,title:"Is phone screenshot"}]}}]),s}(),ImagesUploader=function(){function a(e){var t=e.config,i=e.onUpload,n=e.onError;_classCallCheck(this,a),this.config=t,this.onUpload=i,this.onError=n}return _createClass(a,[{key:"selectFiles",value:function(e){var t=0<arguments.length&&void 0!==e?e:{};return new Promise(function(i,e){var n=document.createElement("INPUT");n.type="file",t.multiple&&n.setAttribute("multiple","multiple"),t.accept&&n.setAttribute("accept",t.accept),n.style.display="none",document.body.appendChild(n),n.addEventListener("change",function(e){var t=e.target.files;i(t),document.body.removeChild(n)},!1),n.click()})}},{key:"uploadSelectedFile",value:function(e){var a=this,o=e.onPreview,t=void 0;this.config.uploader&&"function"==typeof this.config.uploader.uploadByFile&&(t=this.selectFiles({accept:this.config.types}).then(function(e){var t,i;t=e[0],(i=new FileReader).readAsDataURL(t),i.onload=function(e){o(e.target.result)};var n=a.config.uploader.uploadByFile(e[0]);return isPromise(n)||console.warn("Custom uploader method uploadByFile should return a Promise"),n})),t.then(function(e){a.onUpload(e)}).catch(function(e){a.onError(e)})}},{key:"uploadByUrl",value:function(e){var t=this,i=void 0;this.config.uploader&&"function"==typeof this.config.uploader.uploadByUrl&&(isPromise(i=this.config.uploader.uploadByUrl(e))||console.warn("Custom uploader method uploadByUrl should return a Promise")),i.then(function(e){t.onUpload(e)}).catch(function(e){t.onError(e)})}},{key:"uploadByFile",value:function(e,t){var i=this,n=t.onPreview,a=new FileReader;a.readAsDataURL(e),a.onload=function(e){n(e.target.result)};var o=void 0;this.config.uploader&&"function"==typeof this.config.uploader.uploadByFile&&(isPromise(o=this.config.uploader.uploadByFile(e))||console.warn("Custom uploader method uploadByFile should return a Promise")),o.then(function(e){i.onUpload(e)}).catch(function(e){i.onError(e)})}}]),a}();function isPromise(e){return Promise.resolve(e)===e}var ToolboxIcon='<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150.242V79c0-18.778-15.222-34-34-34H79c-18.778 0-34 15.222-34 34v42.264l67.179-44.192 80.398 71.614 56.686-29.14L291 150.242zm-.345 51.622l-42.3-30.246-56.3 29.884-80.773-66.925L45 174.187V197c0 18.778 15.222 34 34 34h178c17.126 0 31.295-12.663 33.655-29.136zM79 0h178c43.63 0 79 35.37 79 79v118c0 43.63-35.37 79-79 79H79c-43.63 0-79-35.37-79-79V79C0 35.37 35.37 0 79 0z"/></svg>',ImageTool=function(){function s(e){var t=this,i=e.data,n=e.config,a=e.api,o=e.readOnly;_classCallCheck(this,s),this.api=a,this.readOnly=o,this.config={endpoints:n.endpoints||"",additionalRequestData:n.additionalRequestData||{},additionalRequestHeaders:n.additionalRequestHeaders||{},field:n.field||"image",types:n.types||"image/*",captionPlaceholder:this.api.i18n.t(n.captionPlaceholder||"Caption"),buttonContent:n.buttonContent||"",uploader:n.uploader||void 0,actions:n.actions||[]},this.uploader=new ImagesUploader({config:this.config,onUpload:function(e){return t.onUpload(e)},onError:function(e){return t.uploadingFailed(e)}}),this.ui=new ImagesUi({api:a,config:this.config,onSelectFile:function(){t.uploader.uploadSelectedFile({onPreview:function(e){t.ui.showPreloader(e)}})},readOnly:o}),this.tunes=new ImagesTunes({ui:this.ui,api:a,actions:this.config.actions,onChange:function(e){return t.tuneToggled(e)}}),this._data={},this.data=i}return _createClass(s,null,[{key:"isReadOnlySupported",get:function(){return!0}},{key:"toolbox",get:function(){return{icon:ToolboxIcon,title:"Image"}}}]),_createClass(s,[{key:"render",value:function(){return this.ui.render(this.data)}},{key:"save",value:function(){var e=this.ui.nodes.caption;return this._data.caption=e.innerHTML,this.data}},{key:"renderSettings",value:function(){return this.tunes.render(this.data)}},{key:"appendCallback",value:function(){this.ui.nodes.fileButton.click()}},{key:"onPaste",value:function(e){switch(e.type){case"pattern":var t=e.detail.data;this.uploadUrl(t);break;case"file":var i=e.detail.file;this.uploadFile(i)}}},{key:"updateImages",value:function(){this._data.files.length&&this.ui.fillImage(this._data.files)}},{key:"onUpload",value:function(e){console.log(e),e.success&&e.file?(null==this._data.files&&(this._data.files=[]),this._data.files.push(e.file||{}),this.updateImages()):this.uploadingFailed("incorrect response: "+JSON.stringify(e))}},{key:"uploadingFailed",value:function(e){console.log("Image Tool: uploading failed because of",e),this.api.notifier.show({message:this.api.i18n.t("Couldn’t upload image. Please try another."),style:"error"}),this.ui.hidePreloader()}},{key:"tuneToggled",value:function(e){this.setTune(e,!this._data[e])}},{key:"setTune",value:function(e,t){var i=this;this._data[e]=t,this.ui.applyTune(e,t),"stretched"===e&&Promise.resolve().then(function(){var e=i.api.blocks.getCurrentBlockIndex();i.api.blocks.stretchBlock(e,t)}).catch(function(e){console.error(e)})}},{key:"uploadFile",value:function(e){var t=this;this.uploader.uploadByFile(e,{onPreview:function(e){t.ui.showPreloader(e)}})}},{key:"uploadUrl",value:function(e){this.ui.showPreloader(e),this.uploader.uploadByUrl(e)}},{key:"data",set:function(n){var a=this;null!=n.file&&null==n.files&&(n.files=[n.file],delete n.file),this._data.files=n.files||[],this.updateImages(),this._data.caption=n.caption||"",this.ui.fillCaption(this._data.caption),ImagesTunes.tunes.forEach(function(e){var t=e.name,i=void 0!==n[t]&&(!0===n[t]||"true"===n[t]);a.setTune(t,i)})},get:function(){return this._data}}],[{key:"pasteConfig",get:function(){return{tags:["img"],patterns:{image:/https?:\/\/\S+\.(gif|jpe?g|tiff|png)$/i},files:{mimeTypes:["image/*"]}}}}]),s}(),Marker=function(){function i(e){var t=e.api;_classCallCheck(this,i),this.api=t,this.button=null,this.tag="MARK",this.iconClasses={base:this.api.styles.inlineToolButton,active:this.api.styles.inlineToolButtonActive}}return _createClass(i,[{key:"render",value:function(){return this.button=document.createElement("button"),this.button.type="button",this.button.classList.add(this.iconClasses.base),this.button.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="1 2 13 12" width="13" height="12"><path d="M8.367 9.633L10.7 10.98l-.624 1.135-.787-.025-.78 1.35H6.94l1.193-2.066-.407-.62.642-1.121zm.436-.763l2.899-5.061a1.278 1.278 0 011.746-.472c.617.355.835 1.138.492 1.76l-2.815 5.114-2.322-1.34zM2.62 11.644H5.39a.899.899 0 110 1.798H2.619a.899.899 0 010-1.798z"/></svg>',this.button}},{key:"surround",value:function(e){var t;e&&((t=this.api.selection.findParentTag(this.tag,i.CSS))?this.unwrap(t):this.wrap(e))}},{key:"wrap",value:function(e){var t=document.createElement(this.tag);t.appendChild(e.extractContents()),e.insertNode(t),this.api.selection.expandToTag(t)}},{key:"unwrap",value:function(e){this.api.selection.expandToTag(e);var t=window.getSelection(),i=t.getRangeAt(0),n=i.extractContents();e.parentNode.removeChild(e),i.insertNode(n),t.removeAllRanges(),t.addRange(i)}},{key:"checkState",value:function(){}}],[{key:"isInline",get:function(){return!0}},{key:"sanitize",get:function(){return{mark:{class:i.CSS}}}}]),i}(),Blockquote=function(){function o(e){var t=e.data,i=e.config,n=e.api,a=e.readOnly;_classCallCheck(this,o),this.api=n,this.readOnly=a,this._settings=i,this._data=this.normalizeData(t),this.settingsButtons=[],this._element=this.getTag()}return _createClass(o,[{key:"normalizeData",value:function(e){var t={};return"object"!==(void 0===e?"undefined":_typeof(e))&&(e={}),t.text=e.text||"",t}},{key:"render",value:function(){return this._element}},{key:"renderSettings",value:function(){return document.createElement("DIV")}},{key:"merge",value:function(e){var t={text:this.data.text+e.text};this.data=t}},{key:"validate",value:function(e){return""!==e.text.trim()}},{key:"save",value:function(e){return{text:e.innerHTML}}},{key:"getTag",value:function(){var e=document.createElement("BLOCKQUOTE");return e.innerHTML=this._data.text||"",e.contentEditable=this.readOnly?"false":"true",e.dataset.placeholder=this.api.i18n.t(this._settings.placeholder||""),e}},{key:"onPaste",value:function(e){var t=e.detail.data;this.data={text:t.innerHTML}}},{key:"data",get:function(){return this._data.text=this._element.innerHTML,this._data},set:function(e){this._data=this.normalizeData(e),void 0!==e.text&&(this._element.innerHTML=this._data.text||"")}}],[{key:"conversionConfig",get:function(){return{export:"text",import:"text"}}},{key:"sanitize",get:function(){return{text:{}}}},{key:"isReadOnlySupported",get:function(){return!0}},{key:"pasteConfig",get:function(){return{tags:["BLOCKQUOTE"]}}},{key:"toolbox",get:function(){return{icon:'<svg aria-hidden="true" focusable="false" data-prefix="fas" width="16px" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M464 32H336c-26.5 0-48 21.5-48 48v128c0 26.5 21.5 48 48 48h80v64c0 35.3-28.7 64-64 64h-8c-13.3 0-24 10.7-24 24v48c0 13.3 10.7 24 24 24h8c88.4 0 160-71.6 160-160V80c0-26.5-21.5-48-48-48zm-288 0H48C21.5 32 0 53.5 0 80v128c0 26.5 21.5 48 48 48h80v64c0 35.3-28.7 64-64 64h-8c-13.3 0-24 10.7-24 24v48c0 13.3 10.7 24 24 24h8c88.4 0 160-71.6 160-160V80c0-26.5-21.5-48-48-48z"></path></svg>',title:"Quote"}}}]),o}();
