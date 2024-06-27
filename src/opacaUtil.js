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
        document.getElementById('login-label').style.display = 'block';
    }else{
        document.getElementById('login-label').style.display = 'none';
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
async function login(location) {
    if (use_auth && token === null) {
        console.log("LOGGING IN...");
        const url = document.getElementById('loginLocation').value;
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        console.log('username: ' + username + ', password: ' + password + ', url: ' + url);
        const response = await fetch(url, {
                    method: "POST",
                    headers: headers(),
                    body: JSON.stringify({username: username, password: password})
                });
        if (response.status === 200) {
            token = await response.text();
            console.log("TOKEN " + token);
        } else {
            console.error("ERROR " + (await response.text()));
        }
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

// TODO: Error Handling -> Message, Symbol or something?
export async function call(uri, serviceMethod, params){

    // In case of GET request, add query parameters
    if (serviceMethod === 'GET' && params) {
        uri += `?${new URLSearchParams(params)}`;
    }

    // call login and await response
    await login();

    // Make a request using fetch API
    const response = await fetch(uri, {
        method: serviceMethod,
        // In case of POST/ PUT/ DELETE add body with parameters
        body: serviceMethod !== 'GET' ? JSON.stringify(params) : undefined,
        headers: headers()
    })

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return await response.text();
}

// Load all OPACA Actions from Runtime Platform
export async function fetchOpacaServices(location) {
    await login(location);
    const response = await fetch(location, {
        headers: headers()
    });
    if (!response.ok) {
        throw new Error(`Failed to load Services: ${response.statusText}`);
    }
    return await response.json();
}