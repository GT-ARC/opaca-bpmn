var token = {}

async function getToken(url){
    const username = document.getElementById(`username-${url}`)?.value || 'admin';
    const password = document.getElementById(`password-${url}`)?.value|| '12345';
    const response = await fetch(`${url}/login`, {
        method: "POST",
        headers: headers(url),
        body: JSON.stringify({username: username, password: password})
    });
    if (!response.ok) {
        const body = await response.json();

        // In case authentication is falsely enabled OR credentials are unknown
        if(body.status === 403 && body.error === 'Forbidden'){
            // Show alert, but don't throw error
            alert(`Login failed: ${JSON.stringify(body)}. Continuing without login...`);
            return;
        }else{
            // Other errors
            throw new Error(`Error during login: ${JSON.stringify(body)}`);
        }
    }
    token[url] = await response.text();
}

function useAuth(url){
    const useAuthBox = document.getElementById(`use-auth-${url}`);
    // Default for loading services (because it has no login field) // TODO create custom dialog?
    if(!useAuthBox){
        return url === 'http://10.42.6.107:8000';
    }
    return useAuthBox.checked;
}

// OPACA Login
async function login(url) {
    // Replace (remove) path name
    const loginPath = new URL(url).origin.toString();
    if (useAuth(loginPath) && !token[loginPath]){
        try{
            return await getToken(loginPath);
        }catch (error){
            throw error;
        }
    }
}

function headers(url) {
    // Replace (remove) path name
    const loginPath = new URL(url).origin.toString();
    if (useAuth(loginPath) && token[loginPath]) {
        return {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token[loginPath]
        }
    } else {
        return {
            "Content-Type": "application/json"
        }
    }
}

export async function call(uri, serviceMethod, params){

    // In case of GET request, add query parameters
    if (serviceMethod === 'GET' && params) {
        uri += `?${new URLSearchParams(params)}`;
    }

    // call login and await response
    try{
        await login(uri);
    }catch (loginError){
        throw loginError;
    }

    try{
        // Make a request using fetch API
        const response = await fetch(uri, {
            method: serviceMethod,
            // In case of POST/ PUT/ DELETE add body with parameters
            body: serviceMethod !== 'GET' ? JSON.stringify(params) : undefined,
            headers: headers(uri)
        })
        if (!response.ok) {
            const body = await response.json();
            if(body.status === 403 && body.error === 'Forbidden'){
                throw new Error('Failed to call service: Login required.');
            }
            throw new Error(`${body.message}\n Cause: ${JSON.stringify(body.cause)}`);
        }
        return await response.text();
    }catch (networkError){
        // Network error, e.g. service not reachable
        if(networkError.name === 'TypeError'){
            throw new Error(`Failed to reach the service at ${uri}. ${networkError.message}`);
        }
        // Rethrow other errors
        throw networkError;
    }
}

// Load all OPACA Actions from Runtime Platform
export async function fetchOpacaServices(location) {
    try{
        await login(location);
    }catch (loginError){
        throw loginError;
    }
    const response = await fetch(`${location}/agents`, {
        headers: headers(location)
    });
    if (!response.ok) {
        const body = await response.json();

        if(body.status === 403 && body.error === 'Forbidden'){
            throw new Error('Failed to load services: Login required.');
        }
        throw new Error(`Failed to load services: ${body.message}\n Cause: ${JSON.stringify(body.cause)}`);
    }
    return await response.json();
}