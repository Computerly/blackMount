<script context="module">
	export async function load({ session }) {
		if (!session.user.authenticated) {
			return {
				status: 302,
				redirect: '/sign-in'
			};
		}

		return {
			props: {
				uuid: session.user.uuid,
				isAdmin: session.user.isAdmin
			}
		};
	}
</script>
<script>
	import { onMount, onDestroy, afterUpdate, beforeUpdate } from 'svelte';
	import { page } from '$app/stores';
	import { data as locationData } from "$lib/store.js";
	import * as Relationships from '$lib/relationships.js';
	import { goto } from '$app/navigation';
	import { supabase } from "$lib/supabase";
	import { validatePassword } from "$lib/utils";
	import { fade, fly } from 'svelte/transition';

	export let uuid;
	export let isAdmin;

	let confirmSave = false;

	async function logout(){
		await fetch('/api/auth/logout', {
			method: "POST"
		});
		window.location = "/sign-in";
	}

	async function getData() {
		const {data, error} = await supabase
							.from("practices_data")
							.select("data, start_date, end_date, practice_name, updated_at")
							.match({"uuid": $page.params.practice});
		//console.log(data);
		locationData.set(data[0]);
	}
	
	onMount(async () => { await getData(); Relationships.update(); });
	
	function numberWithCommas(x) { return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ","); }
	
	function format(value, type){
		if(value == null) { return ""; }
		switch(type){
			case "percent":
				return (value * 100.0).toFixed(1) + "%";
			break;

			case "currency":
				if(value < 0.0){ return "-$" + numberWithCommas(Math.round(value*-1.0));	}
				return "$" + numberWithCommas(Math.round(value));
			break;

			case "text":
				return value;
			break;
			default:
				console.error(`Type: ${type} unknown!\nValue: ${value}`);
				return value;
			break;
		}
	}
	
	// ****************************************************************************
	// *                       Update store data with input                       *
	// *                     update data-value and textContent                    *
	// ****************************************************************************
	function updateValue(table, row, sub, idx, target){
		$locationData.data.tables[table].rows[row][sub][idx].value = parseFloat(target.textContent);
		// console.log($locationData);
		Relationships.update();

		target.dataset.value = target.textContent;
		target.textContent = format( target.textContent, target.dataset.type );
	}

	// ****************************************************************************
	// *                    Swap text content with data-value.                    *
	// *                                Select text                               *
	// ****************************************************************************
	function select(elm){
		/* On Focus */
		// Swamp data-value and text content
		let temp = elm.dataset.value;
		elm.dataset.value = elm.textContent;
		elm.textContent = temp;

		// Select Text
		let range = document.createRange();
		range.selectNodeContents(elm);
		let selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}

	function validate(e){
		let char = (typeof event !== 'undefined') ? event.keyCode : event.which

		if(char == 13) { e.target.blur(); }
		else if(char == 46) { return; }
		else if(char > 47 && char < 58){ return; }
		
		e.preventDefault();
	}

	let newPassword, confirmPassword, password_errors = [];
	async function updatePassword(){
		password_errors = [];
		if(newPassword != confirmPassword){
			password_errors = [...password_errors, "Passwords do not match!"];
			console.error("password mismatch");
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
				console.log("updated passwords successfully");
				newPassword = confirmPassword = "";
			}else{
				let jsonData = res.json();
				console.log(jsonData);
			}
		}
	}

	async function resetPractice(){
		const res = await fetch('/api/auth/update-practice', {
			method: "POST",
			body: JSON.stringify({
				reset: true
			}),
			headers: {
			  'Content-Type': 'application/json'
			}
		});
	}
	function closeDetails(e){
		e.target.closest("details").removeAttribute("open");
	}

	async function save(){
		const res = await fetch('/api/auth/update-practice', {
				method: "PUT",
				body: JSON.stringify({
					data: $locationData.data,
					start_date: $locationData.start_date,
					end_date: $locationData.end_date,
					uuid
				}),
				headers: {
				  'Content-Type': 'application/json'
				}
			});

			if(res.ok){
				confirmSave = true;
				const savedTimeout = window.setTimeout(() => {confirmSave = false;},2000)
			}else{
				let jsonData = await res.json();
				console.error(jsonData);
			}
	}
	function updateStartTime(e){
		$locationData.start_date = e.target.value + "T00:00:00";
	}
	function updateEndTime(e){
		$locationData.end_date = e.target.value + "T00:00:00";
	}
</script>
{#if !$locationData}
	<div class="loading">
		<div class="loader box-rotation"></div>
		<p>Loading</p>
	</div>
{:else}
<div class="wrapper">
	<div class="side-bar">
		{#if confirmSave}
			<p class="saved" in:fly="{{ y: 100, duration: 600 }}" out:fade>Saved!</p>
		{/if}
		<div class="top">
			<div class="location">
				<h1>{$locationData.practice_name}</h1>
				<div class="time-range">
					<div class="start-date">
						<label for="startDate">Start</label>
						<input type="date" id="startDate" name="startDate"
						   value={$locationData.start_date.split('T')[0]} on:change={updateStartTime}>
					</div>
					<div class="end-date">
						<label for="endDate">End</label>
						<input type="date" id="endDate" name="endDate"
						   value={$locationData.end_date.split('T')[0]} on:change={updateEndTime}>
					</div>
				</div>
			</div>
			<div class="stats">
				<div class="stat">
					<div class="title">
						<p>Operating Efficiency </p><span>{format($locationData.data.misc.operating_efficiency.net_adjusted, "currency")}</span>
					</div>
					<div class="progress-container">

						<progress value={Math.round($locationData.data.misc.operating_efficiency.percent*100)} max="100"></progress>
						<p>{format($locationData.data.misc.operating_efficiency.percent, "percent")}</p>
					</div>
				</div>
				<div class="stat">
					<div class="title">
						<p>Potential Increase </p>
						<span>{format($locationData.data.misc.potential_increase.net_adjusted, "currency")}</span>
					</div>
					<div class="progress-container">
						<progress value={Math.round($locationData.data.misc.potential_increase.percent*100)} max="100"></progress>
						<p>{format($locationData.data.misc.potential_increase.percent, "percent")}</p>
					</div>
				</div>
				<div class="stat">
					<p>Operating Efficiency Potential </p>
					<div class="progress-container">
						<progress value={Math.round($locationData.data.misc.operating_efficiency_potential * 100)} max="100"></progress>
						<p>{format($locationData.data.misc.operating_efficiency_potential, "percent")} </p>
					</div>
				</div>
			</div>
		</div>
		<div class="options">
			<input type="checkbox" id="settings">
			{#if isAdmin}
				<button class="dash" on:click={() => {goto("/admin");} }><img src="icons/home.svg" class="icon settings-icon" alt="Admin Dashboard" title="Admin Dashboard"></button>
			{:else}
				<button class="logout" on:click={logout}><img src="icons/logout.svg" class="icon settings-icon" alt="logout" title="Logout"></button>
				<label for="settings"><img src="icons/cogwheel.svg" class="icon settings-icon gear" alt="settings" title="Settings"></label>
				<div class="settings-container">
					<div class="settings-buttons">
						<h2>{$locationData.practice_name}</h2>
						<details>
							<summary>
								<img src="icons/undo.svg" class="icon" alt="reset"> Reset
							</summary>
							<p class="danger">Are you sure you wish to reset this practice? This cannot be undone.</p>
							<div class="reset-buttons">
								<button class="reset" on:click={resetPractice}>Reset</button>
								<button on:click={closeDetails}>Cancel</button>
							</div>
						</details>
						<details>
							<summary>
								<img src="icons/pen.svg" class="icon" alt="change"> Change Password
							</summary>
							<div class="details-container">
								<form on:submit|preventDefault={updatePassword}>
									<div class="row">
										<label for="new-password">Password</label>
										<input type="password" name="new-password" bind:value={newPassword} autocomplete="new-password">
									</div>
									<div class="row">
										<label for="confirm-password">Confirm Password</label>
										<input type="password" name="confirm-password" bind:value={confirmPassword} autocomplete="new-password">
									</div>
									<button type="submit">Update</button>
								</form>
								{#each password_errors as error}
									<p>{error}</p>
								{/each}
							</div>
						</details>
					</div>
					<div>
						<p>Updated at: {$locationData.updated_at.split('T')[0]}</p>
					</div>
				</div>
			{/if}
			<button class="print" onclick="window.print()"><img src="icons/print.svg" class="icon settings-icon" alt="print" title="Print"></button>
			<button class="save" on:click={save}><img src="icons/floppy-disk.svg" class="icon settings-icon" alt="save" title="Save"></button>
		</div>

	</div><!-- END OF SIDE BAR -->
	<div class="data">
		{#each Object.entries($locationData.data.tables) as [table_name, table]}
			<div class="{`table ${table_name}`}">
				<details open>
				<summary tabindex="-1">
					<div class="header">
						<h2>{table_name.replaceAll('_', ' ')}</h2>
						{#each Object.keys(table.columns) as col}
							<p>{col.split('_').join(' ')}</p>
						{/each}
					</div>
					</summary>
					<div class="body">
						{#each Object.entries(table.rows) as [row_name, row]}
							{#if row.details}
								<details class="internal">
									{#each row.details as detail, idx}
										<div class="row details">
											<p>{detail.name}</p>
											{#if detail.editable == false}
												<p>{format(detail.value, "currency")}</p>
											{:else}
											<!-- On select change text content to data-value -->
											<!-- On blur change to formatCurrency -->
												<p 	contenteditable="true"
													data-value={detail.value}
													data-type={"currency"}
													tabindex="0" 
													on:keypress={validate}
													on:blur={(e) => updateValue(table_name,row_name, "details", idx, e.target)}
													on:focus={(e) => select(e.target)}>{format(detail.value, "currency")}</p>
											{/if}
										</div>
									{/each}
									<summary tabindex="-1">
										<div class="row">
											{#each row.cells as cell, idx}
												{#if cell.editable}
													<p 	contenteditable="true"
														tabindex="0" 
														data-value={cell.value}
														data-type={cell.type}
														on:keypress={validate}
														on:blur={(e) => updateValue(table_name, row_name, "cells", idx, e.target)}
														on:focus={(e) => select(e.target)}>{format(cell.value, cell.type)}</p>
												{:else}
													<p>{format(cell.value, cell.type)}</p>
												{/if}
											{/each}
										</div>
									</summary>
								</details>
							{:else}
								<div class="row">
									{#each row.cells as cell, idx}
										{#if cell.editable}
											<p 	contenteditable="true"
												data-value={cell.value}
												data-type={cell.type}
												tabindex="0" 
												on:keypress={validate}
												on:blur={(e) => updateValue(table_name, row_name, "cells", idx, e.target)}
												on:focus={(e) => select(e.target)}>{format(cell.value, cell.type)}</p>
										{:else}
											<p>{format(cell.value, cell.type)}</p>
											
										{/if}
									{/each}
								</div>
							{/if}
						{/each}
					</div>
				</details>
			</div>
		{/each}
	</div>
</div>

{/if}
<style>
	.loading{
		width: 100%;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 1rem;
		background-color: #1a1a1c;
		color: white;
	}
	.loader,.loader:before,.loader:after{
		box-sizing: border-box;
		flex-grow: 0;
		flex-shrink: 0;
	}
	@keyframes rect-rotate {
		0% { transform: rotate(0); }
		50%, 100% { transform: rotate(360deg); } 
	}
	@keyframes fill-rect {
		0%, 50% { height: 0px; }
		100% { height: inherit; } 
	}
	.loader.box-rotation {
	  transform-origin: center center;
	  color: #1957f9;
	  width: 70px;
	  height: 70px;
	  position: relative;
	  border: 3px solid;
	  display: inline-block;
	  animation: rect-rotate 2s linear infinite; 
	}
	.loader.box-rotation::after {
	  content: "";
	  height: 0px;
	  width: 100%;
	  height:100%;
	  display: block;
	  background: #1957f9;
	  opacity: 0.5;
	  animation: fill-rect 2s linear infinite; 
	}
	.admin-dash{
		position: fixed;
		right: 1rem;
		bottom: 1rem;
		height: 2rem;
		background-color: red;
	}
	.wrapper{
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 4fr);
		height: 100%;
		gap: 1rem;
		background-color: #EAEAEA;
	}
	.side-bar{
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		position: relative;
		background-color: white;
		/*overflow-y: auto;*/
		height: 100vh;
		overflow-x: hidden;
	}
	.side-bar .location{
		/*display: flex;
		align-items: center;
		justify-content: center;*/
	}
	.location{
		position: relative;
		margin-bottom: 2rem;
	}
	.location:after{
		content: "";
		position: absolute;
		bottom: -1rem;
		left: 0;
		width: 100%;
		height: 2px;
		background-color: rgba(0,0,0,0.4);
	}
	.location h1{
		margin: 0;
	}
	.icon{
		height: 1rem;
		display: inline-block;
	}
	.options{
		display:flex;
		flex-flow: row wrap;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		z-index: 100;
		min-height: 5vh;
		/*position: relative;*/
	}
	.saved{
		color: green;
		position: absolute;
		bottom: calc(5vh + 1rem);
		left: 50%;
		transform: translate(-50%,0);
		margin: 0;
	}
	.options button{
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.5em;
		background-color: #aaa;
		cursor: pointer;
	}
	.options button:hover,
	.options label:hover{
		filter: brightness(0.9);
	}
	.stat .title{
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.data{
		width: 100%;
		padding: 1rem;
		height: 100vh;
		padding-right: clamp(1rem, 100vw/12, 10rem);
		overflow-y: auto;
	}
	.options button{
		background: none;
		padding: 0;
	}
		
	.options input[type=checkbox]{
		display: none;
	}
	.options label{
		background: none;
		padding: 0;
		cursor: pointer;
	}
	.settings-icon{
		height: 1rem;
		transition: all ease 0.25s;
	}
	.settings-icon:hover{
		transform: scale(1.2);
	}
	.settings-icon.gear:hover{
		transform: rotateZ(45deg);
	}
	.time-range{
		display: grid;
		grid-template-columns: repeat(2, minmax(0,1fr));
		gap: 0.5rem;
	}
	.time-range input{
		width: 100%;
	}
	::-webkit-calendar-picker-indicator { margin:0; }
	.settings-container{
		position: absolute;
		inset: 0;
		width: 100%;
		transform: translateX(-100%);
		overflow: hidden;
		background-color: #aaa;
		z-index: -1;
		transition: all 0.25s ease;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		padding-bottom: calc(6vh + 1rem);
		color: black;
	}
/*	.settings-container input[type=text]{
		width: 100%;
		padding: 0.5rem 1rem;
	}*/
	.settings-container > div{
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
		justify-content: center;
	}
	.settings-container > div p{
		margin: 0;
		color: black;
		opacity: 0.5;
	}
	.settings-buttons .danger{
		margin-top: 1rem;
		text-align: center;
	}
	.reset-buttons{
		display: flex;
		flex-flow: row wrap;
		gap: 1rem;
		width: 100%;
		align-items: center;
		justify-content: center;
		padding: 1rem 0;

	}
	.reset-buttons button{
		background-color: #ddd;
		padding: 0.5rem 2rem;
		border-radius: 2rem;
	}
	button.reset{
		background-color: red;
	}
/*	input#settings + label{
		background: none;
	}*/
	.settings-buttons{
		width: 100%;
	}
	.settings-buttons details{
		width: 100%;

	}
	.settings-buttons .details-container{
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
	.settings-buttons summary{
		width: 100%;
		padding: 1rem 2rem;
		border-radius: 1rem;
	}
	.settings-buttons .row{
		width: 100%;
		display: flex;
		flex-flow: row wrap;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}
	.settings-buttons .row label{
		min-width: 16ch;
	}
	.options input[type=checkbox]:checked ~ .settings-container{
		transform: translateX(0);
	}
	.table .header{
		display: grid;
		grid-template-columns: var(--grid-columns);
		align-items: center;
		justify-items: start;
	}
	.table .header *:not(:first-child){
		color: gray;
	}
	.table .row,
	.table .header{
		display: grid;
		grid-template-columns: var(--grid-columns);
		grid-template-areas: "tableName grossYield be netReciepts name gross netAdjusted";
		align-items: center;
		justify-items: start;
		min-width: 0;
		gap:  0.5rem;
	}
	*[contenteditable=true]{ font-weight: bold; }
	.row p{ margin: 0.1rem 0; }
	.row p:last-child:empty:before,
	.services .row p:nth-child(5):empty:before{
		content: "$0";
		color: gray;
		font-style: italic;
	}
	.header p{ text-transform: capitalize; }
	.row.details 					p:first-child,
	.variable_expenses 		.header p:nth-child(5),
	.fixed_expenses 		.header p:nth-child(5),
	.non-operating_expenses .header p:nth-child(5),
	.variable_expenses 		.row 	p:nth-child(4),
	.fixed_expenses 		.row 	p:nth-child(4),
	.non-operating_expenses .row 	p:nth-child(4){
		grid-column: name / gross;
	}
	.table.statistics .header p:nth-child(4),
	.table.statistics .row p:nth-child(3){
		grid-area: name;
		grid-column: name/netAdjusted;
	}
	.table.statistics .header p:nth-child(3),
	.table.statistics .row p:nth-child(2){
		grid-area: netReciepts;
	}
	.row p:first-child{ grid-column-start: grossYield; }
	.table h2{
		font-size: 18px;
		text-transform: capitalize;
	}
	.table p:not([contenteditable]), h2{ cursor: default; }
	.tableName{	grid-area: tableName; }
	.grossYield{ grid-area: grossYield;	}
	.be{ grid-area: be;	}
	.netReciepts{ grid-area: netReciepts; }
	.name{ grid-area: name; }
	.netAdjusted{ grid-area: netAdjusted; }
	.gross{	grid-area: gross; }

	details summary{ 
		position: relative;
		cursor: pointer;
		padding: 0;
		user-select: none;
	}
	details summary:hover{
		background-color: lightgray;
	}
	.row.details p{	margin:  0; }
	.table details.internal{ background-color: #C4C4C4; }
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
	.progress-container{
		position: relative;
		height: 2em;
	}
	progress {
	  border-radius: 7px; 
	  width: 100%;
	  height: 2em;
	 color: white;
	  box-shadow: 1px 1px 4px rgba( 0, 0, 0, 0.2 );
	}
	progress::-webkit-progress-bar {  background-color: #C4C4C4; }
	progress::-webkit-progress-value { background-color: #4A56BF; }
	
	.progress-container p{
		position: absolute;
		left: 0.25rem;
		top: 0;
		transform: translate(0,-50%);
		font-weight: 500;
		color: white;
	}
	.statistics .row p:last-child:after,
	.statistics .row p:last-child:before{
		content: none;
	}
	.row.details p:after{ content: none !important; }
	.row p:hover:after,
	.row p:hover:before{
		cursor: text;
	}
	.row p[contenteditable]:hover,
	.row p[contenteditable]:focus{
		outline: solid black 1px;
		cursor: pointer;
	}
	.row p{
		padding: 0.25rem 0.5rem;
		overflow: hidden;
		text-overflow: clip;
	}
	@media print{
		*{
			background: white !important;
			color: black !important;
			box-shadow: none !important;
		}
		.side-bar{
			flex-direction: row;
			padding-bottom: 0;
		}
		.data{ padding: 50px;/*padding-bottom: 0;*/ }
		
		.location { font-size: 0.8em; }
		progress{ display: none; }
		input{ border:none; }
		.wrapper{
			grid-template-columns: minmax(0, 1fr);
			gap: 0;
		}
		.options{
			display: none;
		}
		.data{
			overflow-y: visible !important;
		}
		.side-bar .location{
			display: unset;
		}
		.stats{
			display: flex;
			gap: 1rem;
		}
		.stat{
			display: flex;
			align-items: center;
			gap: 1rem;
			border: solid black 1px;
			padding: 0.5rem 1rem;
		}
		.stat p{ margin:  0; }

		.progress-container p{
			position: relative;
			top: unset;
			left:  unset;
			font-weight: 500;
			transform: none;
		}
		.progress-container{
			height: unset;
		}
		.start-date,
		.end-date{
			display: flex;
			gap: 1rem;
			width: min-content;
		}
		.title{	gap: 0.5em;	}
		*[contenteditable=true]{ font-weight: unset; }
		details > summary:after{
			content: "";
		}
		@page{
			size: portrait;
		}
	}
</style>