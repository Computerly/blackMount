import * as cookie from 'cookie';
import { supabase } from "$lib/supabase";


export async function handle({ event, resolve }) {
	const cookies = cookie.parse(event.request.headers.get("cookie") || '');
	event.locals.user = cookies;

	event.locals.user.authenticated = false;
	if(cookies.session_id){
		const userSession = await supabase
		.from("users")
		.select("password, uuid, admin")
		.match({session_id: cookies.session_id});
		/*console.log("userSession");
		console.log(userSession);*/
		if(userSession.data[0]){
			event.locals.user.authenticated = true;
			event.locals.user.uuid = userSession.data[0].uuid;
			event.locals.user.isAdmin = userSession.data[0].admin;
		}
	}

	const response = await resolve(event);

	return response;
}


export const getSession = async (request) => {
    // Pass cookie with authenticated & email properties to session
/*    console.log("request");
    console.log(request);*/
    return request.locals.user
        ? {
                user: {
					authenticated: request.locals.user.authenticated,
					uuid: request.locals.user.uuid,
					isAdmin: request.locals.user.isAdmin
                }
          }
        : {};
};