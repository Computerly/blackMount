<script context="module">
	import { supabase } from "$lib/supabase";
   
	export async function load({ session }) {
        if (!session.user.authenticated || !session.user.isAdmin) {
            return {
                status: 302,
                redirect: '/sign-in'
            };
        }

        // get all practices
        const {data, error} = await supabase
		.from("practices_data")
		.select("practice_name, updated_at, uuid");

        return {
            props: {
                uuid: session.user.uuid,
                practices: data
            }
        };
    }


</script>
<script>
 	import { fade, fly } from 'svelte/transition';
 	import { goto } from '$app/navigation';
	import { validatePassword } from "$lib/utils";

	export let uuid;
	export let practices;

	let searchTerm = "";
	let filteredPractices;
	$: filteredPractices = practices.filter(practice => practice.practice_name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1 );

 	let modal_isVisable = false;
	let modal_index = 0;

	function hideModal(){ modal_isVisable = false; }
	 
	function showModal(idx){ modal_index = idx; modal_isVisable = true; }

	function formatTime(time /* string */){
		return time.slice(0,time.indexOf("T"));
	}

	async function logout(){
		await fetch('/api/auth/logout', {
			method: "POST"
		});
		window.location = "/sign-in";
	}
	let modifyingPassword = false;
	
	let newPassword, confirmPassword, password_errors = [];
	async function updatePassword(){
		password_errors = [];
		if(newPassword != confirmPassword){
			password_errors = [...password_errors, "Passwords do not match!"];
		}else if(!validatePassword(newPassword)){
			password_errors = [...password_errors, "Invalid Password! Password must contain upper and lower case letters, numbers, symbols, and be at least 10 characters long"];
		}else{
			const res = await fetch('/api/auth/update-practice', {
				method: "PUT",
				body: JSON.stringify({
					new_password: newPassword,
					uuid
				}),
				headers: {
				  'Content-Type': 'application/json'
				}
			});

			if(res.ok){
				newPassword = confirmPassword = "";
				modifyingPassword = false;
			}else{
				let jsonData = res.json();
				console.log(jsonData);
			}
		}
	}
	function closeDetails(e){
		e.target.closest("details").removeAttribute("open");
	}
	
	let targetPractice;
	let newPracticePassword, confirmPracticePassword, practice_password_errors = [];
	
	async function updatePracticePassword(){
		targetPractice = filteredPractices[modal_index].uuid;

		practice_password_errors = [];
		if(newPracticePassword != confirmPracticePassword){
			practice_password_errors = [...practice_password_errors, "Passwords do not match!"];
		}else if(!validatePassword(newPracticePassword)){
			practice_password_errors = [...practice_password_errors, "Invalid Password! Password must contain upper and lower case letters, numbers, symbols, and be at least 10 characters long"];
		}else{
			const res = await fetch('/api/auth/update-practice', {
				method: "PUT",
				body: JSON.stringify({
					new_password: newPracticePassword,
					uuid: targetPractice
				}),
				headers: {
				  'Content-Type': 'application/json'
				}
			});

			if(res.ok){
				newPracticePassword = confirmPracticePassword = "";
				modal_isVisable = false;
			}else{
				let jsonData = res.json();
				console.log(jsonData);
			}
		}
	}
	async function resetPractice(){
		targetPractice = filteredPractices[modal_index].uuid;

		const res = await fetch('/api/auth/update-practice', {
			method: "POST",
			body: JSON.stringify({
				reset: true,
				uuid: targetPractice
			}),
			headers: {
			  'Content-Type': 'application/json'
			}
		});

		if(res.ok){
			modal_isVisable = false;
			window.location.reload();
		}else{
			let jsonData = await res.json();
			console.log(jsonData);
		}
	}
	async function deletePractice(){
		targetPractice = filteredPractices[modal_index].uuid;

		const res = await fetch('/api/auth/update-practice', {
			method: "DELETE",
			body: JSON.stringify({
				uuid: targetPractice
			}),
			headers: {
			  'Content-Type': 'application/json'
			}
		});
		if(res.ok){
			modal_isVisable = false;
			window.location.reload();
		}else{
			let jsonData = await res.json();
			console.log(jsonData);
		}
	}

</script>
<div class="wrapper">
	<div class="side-bar">
		<button on:click={() => {modifyingPassword = true; }}><img src="icons/access-key.svg" class="icon" alt="Change Password" title="Change Password"></button>

		<button on:click={logout}><img src="icons/logout.svg" class="icon" alt="Logout" title="Logout"></button>
	</div>
	<div class="dash">
		<div class="search">
			<input type="text" name="practice-search" placeholder="Practice" bind:value={searchTerm}>
		</div>
		
		<div class="practice-container">
			{#each filteredPractices as practice, idx}
				<div class="practice" on:click|self={goto(practice.uuid)}>
					<h1>{practice.practice_name}</h1>
					<button class="settings" on:click={() => {showModal(idx);}}><img src="icons/cogwheel.svg" class="settings-icon" alt="settings"></button>
					<p class="light-info">Last updated: {formatTime(practice.updated_at)}</p>
				</div>
			{/each}
			<div class="add-practice" on:click={() => {goto("add-practice")}}>
				<div class="plus">+</div>
				<p class="light-info">Add Practice</p>
			</div>
		</div>
	</div>
</div>
{#if modal_isVisable}
	<div class="settings-modal" on:click|self={hideModal} out:fade="{{duration: 300}}">
		<div class="content" in:fly="{{ y: 100, duration: 600 }}">
			<div>
				<h1>{filteredPractices[modal_index].practice_name}</h1>
				<p class="light-info">Last updated: {formatTime(filteredPractices[modal_index].updated_at)}</p>
			</div>
			<div class="settings-list">
				<details>
					<summary>
						<img src="icons/access-key.svg" class="icon" alt="key"><span>Change Password</span>
					</summary>
					<div class="details-container">
						<form on:submit|preventDefault={updatePracticePassword}>
							<div class="rows">
								<div class="row">
									<label for="new-password">Password</label>
									<input type="password" name="new-password" bind:value={newPracticePassword} autocomplete="new-password">
								</div>
								<div class="row">
									<label for="confirm-password">Confirm Password</label>
									<input type="password" name="confirm-password" bind:value={confirmPracticePassword} autocomplete="new-password">
								</div>
								
								{#each practice_password_errors as error}
									<p style="color:Red">{error}</p>
								{/each}
							</div>
							<div class="reset-buttons">
								<button type="submit" style="background-color:blue">Update</button>
							</div>
						</form>
					</div>
				</details>

				<details>
					<summary>
						<img src="icons/undo.svg" class="icon" alt="reset"> Reset
					</summary>
					<div class="details-container">
						<p class="danger">Are you sure you wish to reset this practice? This cannot be undone.</p>
						<div class="reset-buttons">
							<button class="reset" on:click={resetPractice} style="background-color: red;">Reset</button>
							<button on:click={closeDetails}>Cancel</button>
						</div>
					</div>
				</details>
				<details>
					<summary>
						<img src="icons/trash-can.svg" class="icon" alt="delete"><span>Delete Practice</span>
					</summary>
					<div class="details-container">
						<p>Are you sure you wish to delete this practice? This cannot be undone.</p>
						<div class="row reset-buttons">
							<button style="background-color: red;" on:click={deletePractice}>Delete</button>
							<button on:click={closeDetails}>Cancel</button>
						</div>
					</div>
				</details>
			</div>

		</div>
	</div>
{/if}

{#if modifyingPassword}
	<div class="settings-modal password-update" on:click|self={() => {modifyingPassword = false;}} out:fade="{{duration: 300}}">
		<div class="content" in:fly="{{ y: 100, duration: 600 }}">
			<h3>Change Password</h3>
			<form on:submit|preventDefault={updatePassword}>
				<div class="rows">
					<div class="row">
						<label for="new-password">Password</label>
						<input type="password" name="new-password" bind:value={newPassword} autocomplete="new-password">
					</div>
					<div class="row">
						<label for="confirm-password">Confirm Password</label>
						<input type="password" name="confirm-password" bind:value={confirmPassword} autocomplete="new-password">
					</div>
					{#each password_errors as error}
						<p style="color:Red">{error}</p>
					{/each}
				</div>
				<button type="submit">Update</button>
			</form>

		</div>
	</div>
{/if}
<style>
	h1{ margin: 0; font-size : clamp(1rem, 1.5vw, 5rem); }
	.wrapper{
		margin-inline: auto;
		width: 100%;
		min-height: 100vh;
		background-color: #ddd;
		display: grid;
		grid-template-columns: min-content auto;
	}
	.practice-container{
		margin-inline: auto;
		display: flex;
		flex-flow: row wrap;
		gap: 2rem;
		align-items: center;
		justify-content: center;
		/*display: grid;
		grid-template-columns: repeat(auto-fill, max(20vw, 400px));
		grid-auto-rows: minmax(min-content, max-content);
		gap: 3rem;
		justify-items: center;
		justify-content: center;*/
	}
	.dash{
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 5vh 10vw 15vh;
		row-gap: 3rem;
	}
	.search{
		width:80%;
		max-width: 70ch;
		background-color: white;
		grid-area: search;
		height: 3rem;
		border-radius: 99999px;
		overflow: hidden;
		padding: 0rem 2rem;
		display: flex;
		align-items: center;
	}
	.row{
		width: 100%;
		display: flex;
		flex-flow: row wrap;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}
	.row label{
		min-width: 16ch;
	}
	.password-update form{
		display: flex;
		flex-direction: column;
		gap: 1rem;
		justify-content: space-between;
		align-items: center;
		height: 100%;
	}
	.password-update .rows{
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.password-update input[type=password]{
		border-radius: 2rem;
		border: solid black 1px;
		padding: 0.5rem 1rem;
	}
	.password-update form button{
		border: none;
		background-color: blue;
		border-radius: 2rem;
		color: white;
		padding: 0.5rem 2rem;
		width: min-content;
	}
	.password-update .content{
		justify-content: flex-start;
	}
	.search input[type=text]{
		width: 100%;
		height: 100%;
		border: none;
		padding: 0;
	}
	.search input[type=text]:focus{
		outline:  0;
	}
	.practice{
		background-color: #303841;
		color: white;
		border-radius: 2rem;
		text-decoration: none;
	}

	.practice,
	.add-practice{
		width:  20vw;
		min-width: 200px;
		aspect-ratio:  2 / 0.8;
		padding: 1rem 2rem;
		position: relative;
		cursor: pointer;
	}
	.light-info{
		font-style: italic;
		color: #aaa;
		font-weight: 300;
	}
	.add-practice .light-info,
	.practice .light-info{
		opacity: 0;
		width: 100%;
		position: absolute;
		bottom: -3rem;
		left: 50%;
		text-align: center;
		transform: translate(-50%,0);
		transition: opacity ease 0.25s;
	}
	.practice .settings:hover{
		transform: rotateZ(45deg);
	}
	.plus:hover ~ .light-info,
	.practice:hover .light-info,
	.practice:hover .settings	{
		opacity: 1;
	}

	.settings{
		position: absolute;
		right: 1rem;
		bottom: 1rem;
		background: none;
		display: grid;
		place-items: center;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: all ease 0.25s;
		opacity: 0;
	}

	.settings-icon{
		width: 1em;
		aspect-ratio: 1/1;
		filter: brightness(0) saturate(100%) invert(100%) sepia(4%) saturate(0%) hue-rotate(288deg) brightness(107%) contrast(104%);
	}

	.add-practice{
		display: grid;
		place-items: center;
	}

	.plus:hover{
		background-color: #303841;
		color: white;
	}

	.plus{
		border-radius: 2rem;
		background-color: white;
		width: 5rem;
		font-size: 3rem;
		text-align: center;
		line-height: 5rem;
		font-weight: 200;
		aspect-ratio: 1/1;
	}
	.settings-modal{
		position: fixed;
		inset: 0;
		background-color: #0000008f;
		backdrop-filter: blur(3px);
		z-index: 999;
	}
	.content{
		transform: translate(-50%,-50%);
		position: absolute;
		top: 50%;
		left: 50%;
		/*aspect-ratio: 1 / 1.2;
		max-width: ;*/
		min-width: 35vw;
		aspect-ratio: 1 / 0.8;
		background-color: white;
		border-radius: 2rem;
		box-shadow: 4px 4px 15px 2px rgba(0,0,0,0.25);
		padding: 1rem 2rem;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
	}
	.content p{
		text-align: center;
		max-width: 70ch;
	}
	.settings-list{
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-start;
		width: 100%;
	}
	.settings-list button{
		font-size: 1rem;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		padding: 0.5rem 1rem;
	}
	.settings-list button:hover{
		opacity: 0.7;
	}
	.icon{
		width: 1rem;
		aspect-ratio: 1/1;
		margin-right: 1ch;

	}
/*	.settings-list button:last-child .icon{
		filter: brightness(0) saturate(100%) invert(44%) sepia(90%) saturate(7467%) hue-rotate(352deg) brightness(115%) contrast(137%);
	}*/

	.side-bar{
		/*position: fixed;
		left: 0;
		top: 0;
		bottom: 0;*/
		height: 100vh;
		width: 5rem;
		background-color: #aaa;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		padding: 1rem;
		gap: 1rem;
	}

	.side-bar button{
		background:  none;
		padding: 0;
		border: 0;
		cursor: pointer;
	}
	.side-bar .icon{
		margin: 0;
	}


	details summary{ 
		position: relative;
		cursor: pointer;
		padding: 0.5rem 2rem;
		user-select: none;
	}
	details summary:hover{
		background-color: lightgray;
	}
	details summary {
		list-style: none;
		background-color: #EAEAEA;
		cursor: pointer;
		transform-origin: center center;
	}
	details[open].internal summary{ filter: brightness(0.8); }
	details summary:focus { outline: none; }
	details > summary:hover:after{
		content: url("icons/chevron_right.svg");
	/*	height: 1rem;
		width: 1rem;*/
		position: absolute;
		right: 1em;
		top: 50%;
		transition: all ease 0.25s;
		transform: translate(0, -50%);
	}
	details[open] > summary:after{
		transform: translate(50%, -50%) rotate(90deg);
	}

	.reset,
	.delete{
		width: 100%;
	}

	.details-container{
		padding: 1rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: flex-start;
	}
	.details-container button{
		align-self: center;
		background-color: blue;
		padding: 0.5rem 2rem;
		color: white;
		border-radius: 2rem;
	}
	.details-container input[type=password]{
		border: none;
		border-radius: 2rem;
		height: 2rem;
		padding: 0 1rem;
	}
	details{
		width: 100%;
		background-color: #ddd;
		
	}

	summary{
		width: 100%;
		padding: 1rem 2rem;
		
	}
	form{
		width: 100%;
	}
	.row{
		width: 100%;
		display: flex;
		flex-flow: row wrap;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}
	.row label{
		min-width: 16ch;
	}
	.rows{
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}
	.reset-buttons{
		display: flex;
		flex-flow: row nowrap;
		gap: 1rem;
		width: 100%;
		align-items: center;
		justify-content: center;
		padding: 1rem 0;

	}
	.reset-buttons button{
		background-color: #aaa;
		padding: 0.5rem 2rem;
		border-radius: 2rem;
		width: min-content;
	}
</style>