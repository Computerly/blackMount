<script context="module">
	export async function load({ session }) {
        if (!session.user.authenticated || !session.user.isAdmin) {
            return {
                status: 302,
                redirect: '/sign-in'
            };
        }

        return {
            props: {
                uuid: session.user.uuid
            }
        };
    }
</script>
<script>
	import { goto } from '$app/navigation';
	import { onMount } from "svelte";
	import { get } from 'svelte/store';
	import { supabase } from "$lib/supabase";/*edqaba1g*/
	import { fade, fly } from 'svelte/transition';

	let practice_name = "";
	let email = "";
	let isAdmin = false;
	let temp_password = "";
	let errors = [];

	let form = 0;
	function randomSequence(seq){
		let idx = Math.random() * (seq.length - 1) + 1;
		if(idx + 4 > seq.length){
			idx -= ((idx + 4) - seq.length);
		}
		return seq.substring(idx, idx + 4);
	}
	onMount(() => {
		let symbols = "!@#$%^&*";
		let numbers = "0123456789";
		let lowercase = "abcdefghijklmnopqrstuvwxyz";
		let uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

		temp_password += randomSequence(symbols) + randomSequence(numbers) + randomSequence(lowercase) + randomSequence(uppercase);

		// Shuffle
		let passArray = temp_password.split("");

		for(let i = 0; i < 50; i++){
			let idx = Math.floor(Math.random() * (passArray.length - 1));

			let tmp = passArray[idx];
			passArray[idx] = passArray[i];
			passArray[i] = tmp;
		}

		temp_password = passArray.join("");
	});

	async function addUser(e){
		try{
			const res = await fetch("api/auth/add-practice", {
				method: "POST",
				credentials: "same-origin",
				body: JSON.stringify({
					practice_name: practice_name,
					email: email,
					isAdmin: isAdmin,
					password: temp_password /* TO HASH */
				}),
				headers:{'Content-Type': 'application/json'}
			});
			if(res.ok){
				let json = await res.json();
				console.log(json);
				errors = json.error;
				console.log(errors);
				window.location.href = '/admin';
			}else{
				let json = await res.json();
				console.log(json);
				errors = json.error;
			}
		}catch(err){
			console.log(err);
		}

	}
	let copied = false;

	function copyToClipboard(e){
		let h3 = e.target;
		navigator.clipboard.writeText(h3.textContent);
		copied = true;
		const timeout = setTimeout(() => {copied = false;}, 2000);
	}
</script>
<div class="wrapper">
	<div class="container">
		<h2>Add Practice</h2>

		<form id="user-creation" on:submit|preventDefault={addUser}>
			<div class="form-container">
				<div class="rows">
					<div class="row">
						<label for="practice_name">Practice Name</label>
						<input type="text" name="practice_name" bind:value={practice_name}>
					</div>
					
					<div class="row">
						<label for="email">Email</label>
						<input type="email" name="email" bind:value={email}>
					</div>

					<div class="row temp-password">
						<label for="isAdmin">Administrator</label>
						<input type="checkbox" name="isAdmin" bind:checked={isAdmin}>
					</div>
					<div class="row temp-password">
						<p>Temporary Password</p>
						<h3 on:click={copyToClipboard} title="Copy Password">
							{temp_password}
							{#if copied}
								<img class="icon copied-icon" src="icons/check.svg" in:fade="{{ duration: 400 }}" out:fade="{{duration:100}}" alt="check">
								<p class="copied-msg" in:fly="{{ y: 10, duration: 400 }}" out:fade>Copied!</p>
							{:else}
								<img class:copied={copied} class="icon copy-icon" src="icons/content_copy.svg" in:fade="{{delay:50, duration:200}}" alt="copy">
							{/if}
						</h3>

					</div>
				</div>
				<div class="row">
					<button type="button" on:click|preventDefault={() => {goto("/admin"); }} class="signup-btn cancel">Cancel</button>
					<button type="submit" class="signup-btn">Add Practice</button>
				</div>
			</div>
		</form>
		<div class="errors">
			<ul>
				{#each errors as error}
					<li class="error">{error}</li>
				{/each}
			</ul>
		</div>
	</div><!-- END OF CONTAINER -->
</div>

<style>
	.wrapper{
		min-height: 100vh;
		width: 100%;
		display: grid;
		place-items: center;
		background-color: #ddd;
	}
	.container{
		background: white;
		border-radius: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow: hidden;
		/*box-shadow: 5px 20px 25px 5px rgba(0, 0, 0, 0.1), 5px 10px 10px 5px rgba(0, 0, 0, 0.04);*/
		padding: 2rem 4rem;
		aspect-ratio:  3 / 2;
		max-height: 90vh;
	}	
	form{
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		gap: 1rem;
		width: 100%;
		height: 100%;		
	}
	form label{
		min-width: 13ch;
	}
	p,h3{ margin: 0; }
	.form-container{
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
		align-items: center;
	}
	.row{
		display: flex;
		justify-content: space-between;
		width: 100%;
		gap: 1rem;
		align-items: center;
	}
	.row.temp-password{
		justify-content: flex-start;
	}
	.row.temp-password h3{
		cursor: pointer;
		position: relative;
	}
	.icon{
		width: 1em;
		/*margin-inline: 1ch;*/
		position: absolute;
		right: -1.5rem;
		top: 50%;
		transform: translate(0, -50%);
		transition: opacity ease 0.1s;
	}
/*	@keyframes fadeOutText{
		from{
			opacity: 1;
		}
		to{
			opacity: 0;
		}
	}*/
	.copied-msg{
		font-weight: 200;
		font-size: 0.9rem;
		color: black;
		position: absolute;
		left: 50%;
		transform: translate(-50%,0);
		/*animation: fadeOutText 2s ease forwards;*/
	}
	.rows{
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	#user-creation input[type=text],
	#user-creation input[type=email]{
		min-width: 50ch;
		border-radius: 0.25rem;
		border:  solid 1px lightgray;
		padding: 0.5rem 1rem;
	}	
	.signup-btn{
		border: none;
		border-radius: 2rem;
		background-color: #303841;
		padding: 0.5rem 2rem;
		color: white;
		width: fit-content;
		cursor: pointer;
	}
	.signup-btn:hover,
	.signup-btn:active{
		filter: brightness(0.9);
	}
	.errors ul{
		list-style-type: none;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0;
	}
	.error{
		background-color: red;
		width: 100%;
		padding: 1rem;
		font-weight: 600;
	}
</style>