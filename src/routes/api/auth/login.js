import bcrypt from "bcrypt";
import crypto from "crypto";
import * as cookie from 'cookie';
import { supabase } from "$lib/supabase";
/**
 * home@street.com
 * Cvo761721! || old f%^ecX3*Y2&Wd14Z
 * admin
 * 
 * apart@road.com
 * Cvo761721! || old %UTSxR45z#2@w$3y
 * $2b$10$dPhbfTRP3lJymq1OTyqdYuo8L5X2D/B.SKcPxghudcl05vaW7FmvO
 * */

export async function post({request}) {
	let errors = [];
	let params = await request.json();

	if(!params.hasOwnProperty("email")){ errors.push("Missing email or password!"); }

	else if(!params.hasOwnProperty("password")){ errors.push("Missing email or password!"); }

	const {data, error} = await supabase
		.from("users")
		.select("password, uuid, admin")
		.match({email: params.email});

	if(!data[0]){ errors.push("Incorrect email or password!"); }

	else if(!bcrypt.compareSync(params.password, data[0].password)){
		errors.push("Incorrect email or password");
	}

    if(errors.length != 0){
    	return{
    		status: 403,
    		body:{
    			message: "Failed",
    			errors: errors
    		}
    	}
    }
    let session_id = crypto.randomUUID();

    const {insert_data, insert_error} = await supabase
		.from("users")
		.update({session_id: session_id})
		.match({email: params.email});

	const headers = {
        'Set-Cookie': cookie.serialize('session_id', session_id, {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 5, // valid for 5 days
            sameSite: 'strict',
            path: '/'
        })
    };
    
	return {
        status: 200,
        headers,
        body: {
            message: 'Success',
            isAdmin: data[0].admin,
            uuid: data[0].uuid
        }
    };
    

}