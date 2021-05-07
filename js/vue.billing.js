
window.$app.defineComponent("billing", "vue-billing-index", {data() {
			return {
				
			}
		},

		created() {
			this.fetchData();
			alert(1);
		},

		methods: {
			fetchData() {
			}
		}, template: `
	<div>
		billing
	</div>
`});
window.$app.defineModule("billing", []);