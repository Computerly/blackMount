<script context="module">
	/*export async function load({ session }) {
		if (session.user) {
			console.log("session");
			console.log(session);
			return {
				props: {
					uuid: session.user.uuid,
					isAdmin: session.user.isAdmin
				}
			};
		}
		return {
			status: 200,
			props: {
				uuid: "",
				isAdmin: false
			}
		};
	}*/
</script>
<script>
	import { goto } from '$app/navigation';

/*pnvqcj3o */
	let email;
	let password;
	let errors = [];
	async function login() {
		errors = [];

	//try {
  		const res = await fetch('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify({
			  email: email,
			  password: password
			}),
			headers: {
			  'Content-Type': 'application/json'
			}
  		})
		if(res.ok) {
			let dt = await res.json();
			if(dt.isAdmin){
				window.setTimeout(function() { location.href='/admin'; }, 50);
			}else{
				window.setTimeout(function() { location.href='/' + dt.uuid; }, 50);
			}			
  		}else{
			const json = await res.json();
			console.log(json);
			errors = json.errors;
	  	}
	//} catch(err) {
	//  console.log(`Error: ${err}`)
	//}
  }
</script>
<div class="wrapper">
	<div class="container">
		<div class="text">
			<div>
				<img src="icons/tooth.svg">
				<h1>MIS Portal</h1>
				<p>Sign in to continue</p>
			</div>
		</div>
		<div class="form-container">
			<h2>Sign In</h2>
			<form on:submit|preventDefault={login}>
				<div class="rows">
					<div class="row">
						<label for="username">Email</label>
						<input type="email" id="username" name="username" bind:value={email} autocomplete="email">
					</div>
					<div class="row">
						<label for="password">Password</label>
						<input type="password" id="password" name="password" bind:value={password} autocomplete="current-password">
					</div>
				<div class="errors">
					<ul>
						{#each errors as error}
							<li class="error">{error}</li>
						{/each}
					</ul>
				</div>
				</div>
				<button type="submit">Sign In</button>
			</form>
			
		</div>
	</div>
</div>

<style>
	.wrapper{
		min-height: 100vh;
		height: 100%;
		width: 100%;
		display: grid;
		place-items: center;
		background-color: #ddd;
	}
	.container{
		background: white;		
		border-radius: 2rem;
		display: flex;
		overflow: hidden;
		align-items: flex-start;
		background-color: white;
		max-height: 70vh;
		aspect-ratio:  3 / 2;
	}
	.container > *{		
		padding: 5rem;
	}
	.rows{
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.row{
		display: flex;
		justify-content: space-between;
		width: 100%;
		gap: 1rem;
		align-items: center;
	}
	input[type=password],
	input[type=email]{
		min-width: 30ch;
		border-radius: 0.25rem;
		border:  solid 1px lightgray;
		padding: 0.5rem 1rem;
	}
	.text{
		width: min-content;
		background-color: #303841;
		color: white;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		height: 100%;
	}
	.form-container{
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
	}
	form{
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background-color: white;

		flex-direction: column;
		justify-content: space-between;
		height: 100%;
	}
	button{
		border: none;
		border-radius: 2rem;
		background-color: #303841;
		padding: 0.5rem 2rem;
		color: white;
		width: fit-content;
		cursor: pointer;
	}
	button:hover,
	button:active{
		filter: brightness(0.9);
	}
	.errors ul{
		list-style-type:none ;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.error{
		width: 100%;
		font-weight: 300;
		color: red;
	}
</style>
<!-- thetoothfairy@magic.com -->
<!-- jz4dyhcv -->

<!-- admin -->
<!-- king@royals.com -->
<!-- cm93pvk7 -->