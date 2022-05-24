import { dev } from '$app/env';
import { supabase } from "$lib/supabase";

export async function post(event){
	const secure = dev ? '' : ' Secure;';
	
	// remove session from the server
	const {insert_data, insert_error} = await supabase
	.from("users")
	.update({session_id: ""})
	.match({uuid: event.locals.user.uuid});

	if(insert_error){
		return{
			status: 401,
			body:{
				message: "failed to removed session"
			}
		};
	}

	return{
		status: 200,
		headers: {
			'set-cookie': `session_id=0; Max-Age=0; Path=/; HttpOnly`
		}
	}
}