var use_auth = false;
var token = null;

// Get 'useAuthCheckbox' element
const useAuthBox = document.getElementById('useAuthCheckbox');
useAuthBox.addEventListener('change', () => {toggleUseAuth()});

// Get 'login-label' element
const loginLabel = document.getElementById('login-label');

// Switch to use authorization or not (and show/hide user input fields)
function toggleUseAuth(){
    use_auth = !use_auth;
    if(use_auth){
        document.getElementById('login-header').style.display = 'block';
    }else{
        document.getElementById('login-header').style.display = 'none';
    }
}
// Show/hide user info
function toggleUserInfo(){
    const userInfo = document.getElementById('userInfo');
    const computedStyle = window.getComputedStyle(userInfo);
    if(computedStyle.display === 'block'){
        userInfo.style.display = 'none';
    }else{
        userInfo.style.display = 'block';
    }
}

// OPACA Login
// Takes username and password from the service view
// (Only supports 1 runtime platform for now)
async function login() {
    if (use_auth && token === null) {
        const url = document.getElementById('loginLocation').value + '/login';
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        const response = await fetch(url, {
                    method: "POST",
                    headers: headers(),
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
        token = await response.text();
    }
}

function headers() {
    if (use_auth && token !== null) {
        return {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
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
        await login();
    }catch (loginError){
        throw loginError;
    }

    try{
        // Make a request using fetch API
        const response = await fetch(uri, {
            method: serviceMethod,
            // In case of POST/ PUT/ DELETE add body with parameters
            body: serviceMethod !== 'GET' ? JSON.stringify(params) : undefined,
            headers: headers()
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
        await login();
    }catch (loginError){
        throw loginError;
    }
    const response = await fetch(location, {
        headers: headers()
    });
    if (!response.ok) {
        const body = await response.json();
        console.log('body', body);
        if(body.status === 403 && body.error === 'Forbidden'){
            throw new Error('Failed to load services: Login required.');
        }
        throw new Error(`Failed to load services: ${body.message}\n Cause: ${JSON.stringify(body.cause)}`);
    }
    return await response.json();
}