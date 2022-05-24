export function validatePassword(pass){
	/**
	 * Returns true or false if the password is valid
	 * 
	 * Must be alphanumberic with upper and lowercase and symbols
	 * Min Length 10
	 * Max Length 64
	 * 
	 * */

	let regexExpr = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{10,64}$/;
	
	return regexExpr.test(pass);
}

export function validateEmail(email){
	/**
	 * Returns true or false if the email is valid
	 * 
	 * 
	 * */
	let re = /\S+@\S+\.\S+/;
	return re.test(email);
}
