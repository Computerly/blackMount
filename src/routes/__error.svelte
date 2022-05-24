<script context="module">
	/** @type {import('@sveltejs/kit').Load} */
	export function load({ error, status }) {
		return {
			props: {
				message: error.message,
				status: status
			}
		};
	}
</script>

<script>
	import { goto } from '$app/navigation';
	export let status;
	export let message;
</script>

<div class="wrapper">
	<div class="container">
		<div>
			<h1>{status} error</h1>
			<p>{message}</p>
		</div>

		<a href="/">Take me home</a>
	</div>
</div>


<style>
	.wrapper{
		width: 100%;
		height: 100vh;
		display: grid;
		place-items: center;
	}
	.container{
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}
	a{
		background-color: blue;
		border: none;
		border-radius: 2rem;
		padding: 0.5rem 2rem;
		color: white;
		cursor: pointer;
		text-decoration: none;
	}
</style>