// ****************************************************************************
// *              Creates a new user with an associated practice              *
// ****************************************************************************

import bcrypt from "bcrypt";
import crypto from "crypto";
import BLANK_PRACTICE from "$lib/blank_practice.json";
import { supabase } from "$lib/supabase";
import { validatePassword, validateEmail } from "$lib/utils";

export async function post({locals, request}){
	if(locals.user.authenticated == false){
		return{
			status: 401,
			body:{
				message: "Unauthorized!"
			}
		}
	}
	let params = await request.json();
	

	//let params = await event.params;
	let errors = [];
	
	let paramsLength = Object.keys(params).length;

	// Expecting 4 params
	if(paramsLength != 4){ errors.push(`Expected number of params does not match number of params!`); }

	
	if(errors.length != 0){
		return{
			status: 400,
			body: {
				message: "Failed",
				error: errors
			}
		};
	}

	// Validate Password
	if(!validatePassword(params.password)){
		errors.push("Invalid Password");
		return{
			status: 400,
			body:{
				message: "Invalid Password!",
				error: errors
			}
		};
	}

	// Validate Email
	else if(!validateEmail(params.email)){
		errors.push("Invalid Email");
		return{
			status: 400,
			body:{
				message: "Invalid Email!",
				error: errors
			}
		};
	}

	// ensure email is unique
	const emails = await supabase
		.from("users")
		.select("email")
		.match({email: params.email});

	if(emails.data[0]){
		errors.push("Email already exists");
		return{
			status: 400,
			body:{
				message: "Email already exists",
				error: errors
			}
		};
	}

	// Number of params are correct and valid password
	let uuid = crypto.randomUUID();
	
	const hashedPassword = await bcrypt.hash(params.password, 10);

	const {userData, userError} = await supabase
	.from("users")
	.insert([{
		email: params.email,
		admin: (params.isAdmin == "false" || params.isAdmin == false) ? false : true,
		created_at: new Date(), // time now
		updated_at: new Date(), // time now
		password: hashedPassword,
		password_reset: true,
		uuid: uuid
	}]);
	
	if(userError){ errors.push(userError); console.error("error in creating user!"); }
	
	if(errors.length != 0){
		return{
			status: 400,
			body: {
				message: "Failed",
				error: errors
			}
		};
	}
	// if not an admin,
	// Create a practice associated with the new user

	if(params.isAdmin == "false" || params.isAdmin == false ){
		const {practiceData, practiceError} = await supabase
			.from("practices_data")
			.insert([{
				practice_name: params.practice_name,
				data: BLANK_PRACTICE,
				start_date: new Date(new Date().getFullYear(), 1, 1), // start of the year
				end_date: new Date(new Date().getFullYear(), 12, 31), // end of the year
				updated_at: new Date(), // time now
				uuid: uuid
			}]);
		if(practiceError){ console.error(practiceError); errors.push(practiceError); }
	}

	if(errors.length == 0){
		return{
			status: 200,
			body: {
				message: "Success",
				error: errors
			}
		};
	}else{
		return{
			status: 400,
			body: {
				message: "Failed",
				error: errors
			}
		};
	}

}