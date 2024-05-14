import jwt from 'jsonwebtoken'

/**
 * Handle possible date filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `date` parameter.
 *  The returned object must handle all possible combination of date filtering parameters, including the case where none are present.
 *  Example: {date: {$gte: "2023-04-30T00:00:00.000Z"}} returns all transactions whose `date` parameter indicates a date from 30/04/2023 (included) onwards
 * @throws an error if the query parameters include `date` together with at least one of `from` or `upTo`
 */
export const handleDateFilterParams = (req) => {
    let {from, upTo, date} = req.query;
    let filter = {};

    if(!from && !upTo && !date){
        return {};
    }

    if(date && (from || upTo)){
        throw new Error("Invalid Date");
    }

    if(from && upTo){
        
        from = new Date(from);
        upTo = new Date(upTo);
        upTo = new Date(upTo.setDate(upTo.getDate())+86400000-1);
        if(isNaN(from) || isNaN(upTo)){
            throw new Error("Invalid Date");
        }
        if(from>upTo){
            throw new Error("Invalid Date");
        }

        filter.date = {$gte : from, $lte : upTo}; 
    }else{
        if(from){ //creo ogetto con quei campi che hanno il $... come campo e valore passato da uguale e poi nel chiamante passo tutto l'oggetto insieme
            from = new Date(from);
    
            if(isNaN(from)){
                throw new Error("Invalid Date");
            }else{
                filter.date = {$gte : from}; 
            }
        }
        if(upTo){
            upTo = new Date(upTo);
            upTo = new Date(upTo.setDate(upTo.getDate())+86400000-1);
    
            if(isNaN(upTo)){
                throw new Error("Invalid Date");
            }else{
                filter.date = {$lte : upTo};
            }
        }
        if(date){
            date = new Date(date);
    
            if(isNaN(date)){
                throw new Error("Invalid Date");
            }else{
                filter.date = {$gte : date, $lte : new Date(date.setDate(date.getDate())+86400000-1)}; //eq fai confronto tra gg a mezzanotte e gg dopo a mezzanotte
            }
        }
    }
    
    return filter;
}

/**
 * Handle possible authentication modes depending on `authType`
 * @param req the request object that contains cookie information
 * @param res the result object of the request
 * @param info an object that specifies the `authType` and that contains additional information, depending on the value of `authType`
 *      Example: {authType: "Simple"}
 *      Additional criteria:
 *          - authType === "User":
 *              - either the accessToken or the refreshToken have a `username` different from the requested one => error 401
 *              - the accessToken is expired and the refreshToken has a `username` different from the requested one => error 401
 *              - both the accessToken and the refreshToken have a `username` equal to the requested one => success
 *              - the accessToken is expired and the refreshToken has a `username` equal to the requested one => success
 *          - authType === "Admin":
 *              - either the accessToken or the refreshToken have a `role` which is not Admin => error 401
 *              - the accessToken is expired and the refreshToken has a `role` which is not Admin => error 401
 *              - both the accessToken and the refreshToken have a `role` which is equal to Admin => success
 *              - the accessToken is expired and the refreshToken has a `role` which is equal to Admin => success
 *          - authType === "Group":
 *              - either the accessToken or the refreshToken have a `email` which is not in the requested group => error 401
 *              - the accessToken is expired and the refreshToken has a `email` which is not in the requested group => error 401
 *              - both the accessToken and the refreshToken have a `email` which is in the requested group => success
 *              - the accessToken is expired and the refreshToken has a `email` which is in the requested group => success
 * @returns true if the user satisfies all the conditions of the specified `authType` and false if at least one condition is not satisfied
 *  Refreshes the accessToken if it has expired and the refreshToken is still valid
 */
export const verifyAuth = (req, res, info) => {
    const cookie = req.cookies
    if (!cookie.accessToken || !cookie.refreshToken) {
        return { authorized: false, message: "Unauthorized" };
    }
    try {
        const decodedAccessToken = jwt.verify(cookie.accessToken, process.env.ACCESS_KEY);
        const decodedRefreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY);
        
        if (!decodedAccessToken.username || !decodedAccessToken.email || !decodedAccessToken.role) {
            return { authorized: false, message: "Token is missing information" }
        }
        if (!decodedRefreshToken.username || !decodedRefreshToken.email || !decodedRefreshToken.role) {
            return { authorized: false, message: "Token is missing information" }
        }
        if (decodedAccessToken.username !== decodedRefreshToken.username || decodedAccessToken.email !== decodedRefreshToken.email || decodedAccessToken.role !== decodedRefreshToken.role) {
            return { authorized: false, message: "Mismatched users" };
        }
        
        if(info.authType === 'Simple' || (info.authType === 'User' && decodedAccessToken.username === info.username)){
            return { authorized: true, message: "Authorized" }
        }

        if(decodedRefreshToken.role !== info.authType && info.authType !== 'Group'){
            return { authorized: false, message: "Wrong role" };
        }
        if(info.email){
            if(decodedRefreshToken.email !== info.email){
                return { authorized: false, message: "Mismatched users, accessed one requires for another"}
            }
        }
        
        if(info.username){
            if(decodedRefreshToken.username !== info.username){
                return { authorized: false, message: "Mismatched users, accessed one requires for another"}
            }
        }
        
        if(info.emailInGroup){
            let sameGroup = false;
            for(let email of info.emailInGroup){
                if(decodedRefreshToken.email === email){
                    sameGroup = true
                }
            }

            if(!sameGroup){//valuta ruolo group, vedi users.addtogroup
                return { authorized: false, message: "User can add-remove-get only in his group"}
            }
        }

        if(info.authType === 'Group'){
            if(info.memberEmails && !info.memberEmails.includes(decodedRefreshToken.email)){
                return { authorized: false, message: "Tokens don't belong to a member of the group"}
            }
            return {authorized: true, email: decodedRefreshToken.email, id: decodedRefreshToken.id}
        }

        return { authorized: true, message: "Authorized" }
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            try {
                const refreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY)
                const newAccessToken = jwt.sign({
                    username: refreshToken.username,
                    email: refreshToken.email,
                    id: refreshToken.id,
                    role: refreshToken.role
                }, process.env.ACCESS_KEY, { expiresIn: '1h' })
                res.cookie('accessToken', newAccessToken, { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true })
                res.locals.message = 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'
                return { authorized: true, message: "Authorized" }
            } catch (err) {
                if (err.name === "TokenExpiredError") {
                    return { authorized: false, message: "Perform login again" }
                } else {
                    return { authorized: false, message: err.name }
                }
            }
        } else {
            return { authorized: false, message: err.name };
        }
    }
}

/**
 * Handle possible amount filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `amount` parameter.
 *  The returned object must handle all possible combination of amount filtering parameters, including the case where none are present.
 *  Example: {amount: {$gte: 100}} returns all transactions whose `amount` parameter is greater or equal than 100
 */
export const handleAmountFilterParams = (req) => { //con ?key=value puoi fare as per vedere cosìè e poi prendi il valore
    let min = req.query.min;
    let max = req.query.max;
    let filter = {};

    if(!min && !max){
        return {};
    }

    if(min && max){
        min = parseInt(min);
        max = parseInt(max);

        if(isNaN(min) || isNaN(max) || min>max){
            throw new Error("Invalid Parameters");
        }
            
        filter.amount = {$gte : min, $lte : max}; 
    }else{
        if(min){ //creo ogetto con quei campi che hanno il $... come campo e valore passato da uguale e poi nel chiamante passo tutto l'oggetto insieme
            min = parseInt(min);
    
            if(isNaN(min)){
                throw new Error("Invalid Parameters");
            }else{
                filter.amount = {$gte : min}; 
            }
        }
        if(max){
            max = parseInt(max);
    
            if(isNaN(max)){
                throw new Error("Invalid Parameters");
            }else{
                filter.amount = {$lte : max};
            }
        }
    }    
    return filter;
}