<script context="module">
	export async function load({ session }) {

		if (!session.user.authenticated) {
			return {
				status: 302,
				redirect: '/sign-in'
			};
		}
		if (session.user.isAdmin) {
			return {
				status: 302,
				redirect: '/admin'
			};
		}
		return {
			status: 302,
			redirect: '/' + session.user.uuid
		};
}
</script>