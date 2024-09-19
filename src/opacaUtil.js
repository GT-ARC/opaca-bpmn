var token = {}

async function getToken(url, loadServices = false){
    let username;
    let password;
    if(loadServices){
        username = document.getElementById('load-services-user').value;
        password = document.getElementById('load-services-password').value;
    }else{
        username = document.getElementById(`username-${url}`)?.value || 'admin';
        password = document.getElementById(`password-${url}`)?.value || '12345';
    }

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

function useAuth(url, loadServices = false){
    if(loadServices){
        return document.getElementById('load-services-use-auth').checked;
    }
    const useAuthBox = document.getElementById(`use-auth-${url}`);
    if(!useAuthBox){
        return false;
    }
    return useAuthBox.checked;
}

// OPACA Login
async function login(url, loadServices = false) {
    // Replace (remove) path name
    const loginPath = new URL(url).origin.toString();
    if (useAuth(loginPath, loadServices) && !token[loginPath]){
        try{
            return await getToken(loginPath, loadServices);
        }catch (error){
            throw error;
        }
    }
}

function headers(url, loadServices = false) {
    // Replace (remove) path name
    const loginPath = new URL(url).origin.toString();
    if (useAuth(loginPath, loadServices) && token[loginPath]) {
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
        await login(location, true);
    }catch (loginError){
        throw loginError;
    }
    const response = await fetch(`${location}/agents`, {
        headers: headers(location, true)
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