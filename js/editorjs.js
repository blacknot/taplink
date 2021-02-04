var _createClass=function(){function n(e,t){for(var i=0;i<t.length;i++){var n=t[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(e,t,i){return t&&n(e.prototype,t),i&&n(e,i),e}}();function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}DEFAULT_THEMES=["light","dark"],COMMON_LANGUAGES={none:"Auto-detect",apache:"Apache",bash:"Bash",cs:"C#",cpp:"C++",css:"CSS",coffeescript:"CoffeeScript",diff:"Diff",go:"Go",html:"HTML, XML",http:"HTTP",json:"JSON",java:"Java",javascript:"JavaScript",kotlin:"Kotlin",less:"Less",lua:"Lua",makefile:"Makefile",markdown:"Markdown",nginx:"Nginx",objectivec:"Objective-C",php:"PHP",perl:"Perl",properties:"Properties",python:"Python",ruby:"Ruby",rust:"Rust",scss:"SCSS",sql:"SQL",shell:"Shell Session",swift:"Swift",toml:"TOML, also INI",typescript:"TypeScript",yaml:"YAML",plaintext:"Plaintext"};var CodeBox=function(){function a(e){var t=e.data,i=e.api,n=e.config;_classCallCheck(this,a),this.api=i,this.config={themeName:n.themeName&&"string"==typeof n.themeName?n.themeName:"",themeURL:n.themeURL&&"string"==typeof n.themeURL?n.themeURL:"",useDefaultTheme:n.useDefaultTheme&&"string"==typeof n.useDefaultTheme&&DEFAULT_THEMES.includes(n.useDefaultTheme.toLowerCase())?n.useDefaultTheme:"light"},this.data={code:t.code&&"string"==typeof t.code?t.code:"",language:t.language&&"string"==typeof t.language?t.language:"Auto-detect",theme:t.theme&&"string"==typeof t.theme?t.theme:this._getThemeURLFromConfig()},this.highlightScriptID="highlightJSScriptElement",this.highlightCSSID="highlightJSCSSElement",this.codeArea=document.createElement("div"),this.selectInput=document.createElement("input"),this.selectDropIcon=document.createElement("i"),this._injectHighlightJSScriptElement(),this._injectHighlightJSCSSElement(),this.api.listeners.on(window,"click",this._closeAllLanguageSelects,!0)}return _createClass(a,[{key:"render",value:function(){var t=this,e=document.createElement("pre"),i=this._createLanguageSelectElement();return e.setAttribute("class","codeBoxHolder"),this.codeArea.setAttribute("class","codeBoxTextArea "+this.config.useDefaultTheme+" "+this.data.language),this.codeArea.setAttribute("contenteditable",!0),this.codeArea.innerText=this.data.code,this.api.listeners.on(this.codeArea,"blur",function(e){return t._highlightCodeArea(e)},!1),this.api.listeners.on(this.codeArea,"paste",function(e){return t._handleCodeAreaPaste(e)},!1),e.appendChild(this.codeArea),e.appendChild(i),hljs.highlightBlock(this.codeArea),e}},{key:"save",value:function(){return{language:this.data.language,code:this.codeArea.innerText}}},{key:"validate",value:function(e){return!!e.code.trim()}},{key:"destroy",value:function(){var t=this;this.api.listeners.off(window,"click",this._closeAllLanguageSelects,!0),this.api.listeners.off(this.codeArea,"blur",function(e){return t._highlightCodeArea(e)},!1),this.api.listeners.off(this.codeArea,"paste",function(e){return t._handleCodeAreaPaste(e)},!1),this.api.listeners.off(this.selectInput,"click",function(e){return t._handleSelectInputClick(e)},!1)}},{key:"_createLanguageSelectElement",value:function(){var i=this,e=document.createElement("div"),n=document.createElement("div"),t=Object.entries(COMMON_LANGUAGES);return e.setAttribute("class","codeBoxSelectDiv"),this.selectDropIcon.setAttribute("class","codeBoxSelectDropIcon "+this.config.useDefaultTheme),this.selectDropIcon.innerHTML="&#8595;",this.selectInput.setAttribute("class","codeBoxSelectInput "+this.config.useDefaultTheme),this.selectInput.setAttribute("type","text"),this.selectInput.setAttribute("readonly",!0),this.selectInput.value=this.data.language,this.api.listeners.on(this.selectInput,"click",function(e){return i._handleSelectInputClick(e)},!1),n.setAttribute("class","codeBoxSelectPreview"),t.forEach(function(t){var e=document.createElement("p");e.setAttribute("class","codeBoxSelectItem "+i.config.useDefaultTheme),e.setAttribute("data-key",t[0]),e.textContent=t[1],i.api.listeners.on(e,"click",function(e){return i._handleSelectItemClick(e,t)},!1),n.appendChild(e)}),e.appendChild(this.selectDropIcon),e.appendChild(this.selectInput),e.appendChild(n),e}},{key:"_highlightCodeArea",value:function(){hljs.highlightBlock(this.codeArea)}},{key:"_handleCodeAreaPaste",value:function(e){e.stopPropagation()}},{key:"_handleSelectInputClick",value:function(e){e.target.nextSibling.classList.toggle("codeBoxShow")}},{key:"_handleSelectItemClick",value:function(e,t){e.target.parentNode.parentNode.querySelector(".codeBoxSelectInput").value=t[1],e.target.parentNode.classList.remove("codeBoxShow"),this.codeArea.removeAttribute("class"),this.data.language=t[0],this.codeArea.setAttribute("class","codeBoxTextArea "+this.config.useDefaultTheme+" "+this.data.language),hljs.highlightBlock(this.codeArea)}},{key:"_closeAllLanguageSelects",value:function(){for(var e=document.querySelectorAll(".codeBoxSelectPreview"),t=0,i=e.length;t<i;t++)e[t].classList.remove("codeBoxShow")}},{key:"_injectHighlightJSScriptElement",value:function(){$mx.lazy("https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/highlight.min.js")}},{key:"_injectHighlightJSCSSElement",value:function(){var e,t,i=document.querySelector("#"+this.highlightCSSID),n=this._getThemeURLFromConfig();i?i.setAttribute("href",n):(e=document.createElement("link"),t=document.querySelector("head"),e.setAttribute("rel","stylesheet"),e.setAttribute("href",n),e.setAttribute("id",this.highlightCSSID),t&&t.appendChild(e))}},{key:"_getThemeURLFromConfig",value:function(){var e="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/styles/atom-one-"+this.config.useDefaultTheme+".min.css";return this.config.themeName&&(e="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/styles/"+this.config.themeName+".min.css"),this.config.themeURL&&(e=this.config.themeURL),e}}],[{key:"sanitize",get:function(){return{code:!0,language:!1,theme:!1}}},{key:"toolbox",get:function(){return{title:"Code",icon:'<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9.71,6.29a1,1,0,0,0-1.42,0l-5,5a1,1,0,0,0,0,1.42l5,5a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42L5.41,12l4.3-4.29A1,1,0,0,0,9.71,6.29Zm11,5-5-5a1,1,0,0,0-1.42,1.42L18.59,12l-4.3,4.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0l5-5A1,1,0,0,0,20.71,11.29Z"/></svg>'}}},{key:"displayInToolbox",get:function(){return!0}},{key:"enableLineBreaks",get:function(){return!0}}]),a}(),Marker=function(){function i(e){var t=e.api;_classCallCheck(this,i),this.api=t,this.button=null,this.tag="MARK",this.iconClasses={base:this.api.styles.inlineToolButton,active:this.api.styles.inlineToolButtonActive}}return _createClass(i,[{key:"render",value:function(){return this.button=document.createElement("button"),this.button.type="button",this.button.classList.add(this.iconClasses.base),this.button.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="1 2 13 12" width="13" height="12"><path d="M8.367 9.633L10.7 10.98l-.624 1.135-.787-.025-.78 1.35H6.94l1.193-2.066-.407-.62.642-1.121zm.436-.763l2.899-5.061a1.278 1.278 0 011.746-.472c.617.355.835 1.138.492 1.76l-2.815 5.114-2.322-1.34zM2.62 11.644H5.39a.899.899 0 110 1.798H2.619a.899.899 0 010-1.798z"/></svg>',this.button}},{key:"surround",value:function(e){var t;e&&((t=this.api.selection.findParentTag(this.tag,i.CSS))?this.unwrap(t):this.wrap(e))}},{key:"wrap",value:function(e){var t=document.createElement(this.tag);t.appendChild(e.extractContents()),e.insertNode(t),this.api.selection.expandToTag(t)}},{key:"unwrap",value:function(e){this.api.selection.expandToTag(e);var t=window.getSelection(),i=t.getRangeAt(0),n=i.extractContents();e.parentNode.removeChild(e),i.insertNode(n),t.removeAllRanges(),t.addRange(i)}},{key:"checkState",value:function(){}}],[{key:"isInline",get:function(){return!0}},{key:"sanitize",get:function(){return{mark:{class:i.CSS}}}}]),i}();module.exports=Marker;
