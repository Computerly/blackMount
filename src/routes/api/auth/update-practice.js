/*
	Change password
	Reset data
	delete practice
*/

import bcrypt from "bcrypt";
import crypto from "crypto";
import * as cookie from 'cookie';
import { supabase } from "$lib/supabase";
import { validatePassword } from "$lib/utils";
import BLANK_PRACTICE from "$lib/blank_practice.json";


export async function put({locals, request}){
	/* Update*/
	if(locals.user.authenticated == false){
		return{
			status: 401,
			body:{
				message: "Unauthorized!"
			}
		};
	}
	let params = await request.json();
	
	if(!params.hasOwnProperty("uuid")){
		return{
			status: 400,
			body:{
				message: "Invalid arguments passed to update"
			}
		};
	}

	if(params.hasOwnProperty("new_password")){
		// Validate Password
		if(!validatePassword(params.new_password)){
			return{
				status: 400,
				body:{
					message: "Invalid Password!"
				}
			};
		}
		
		// Hash Password
		const hashedPassword = await bcrypt.hash(params.new_password, 10);

		const {data, err} = await supabase
		.from("users")
		.update({password: hashedPassword, password_reset: locals.user.isAdmin})
		.match({uuid: params.uuid});

		if(!err && data[0]){
			return{
				status: 200,
				body:{
					message:"Success"
				}
			};
		}
		return{
			status: 500,
			body:{
				message:"Something went wrong updating password"
			}
		};
	}else if(params.hasOwnProperty("data") && params.hasOwnProperty("start_date") && params.hasOwnProperty("end_date")){
		const data = await supabase
		.from("practices_data")
		.update({data: params.data, start_date: params.start_date, end_date: params.end_date})
		.match({uuid: params.uuid});

		if(data.data[0]){
			return{
				status: 200,
				body:{
					message:"Success"
				}
			};
		}
		return{
			status: 500,
			body:{
				message:"Something went wrong updating practice"
			}
		};
	}

	return{
		status: 400,
		body:{
			message:"Invalid request"
		}
	};

}

export async function del({locals, request}){
	/* Delete practice */
	if(locals.user.authenticated == false || locals.user.isAdmin == false){
		return{
			status: 401,
			body:{
				message: "Unauthorized!"
			}
		}
	}

	/* TODO */

}

export async function post({locals, request}) {

	if(locals.user.authenticated == false){
		return{
			status: 401,
			body:{
				message: "Unauthorized!"
			}
		}
	}

	let errors = [];
	let params = await request.json();

	/* Reset Practice to blank practice */
	if(params.hasOwnProperty("reset")){
	
		if(!params.hasOwnProperty("uuid")){
			return{
				status: 400,
				body:{
					message: "Invalid arguments passed to update"
				}
			};
		}

		const {data, error} = await supabase
			.from("practices_data")
			.update({data: BLANK_PRACTICE})
			.match({uuid: params.uuid});

		if(!err && data[0]){
			return{
				status: 200,
				body:{
					message: "Success"
				}
			};
		}else{
			return{
				status: 400,
				body:{
					message:"Something went wrong resetting practice"
				}
			};
		}

	}
}