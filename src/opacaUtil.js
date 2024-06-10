
const use_auth = true;
const username = "admin";
const password = "12345";
var token = null;

// TODO get login URL from given location
async function login(location) {
    if (use_auth && token === null) {
        console.log("LOGGING IN...")
        const url = "http://localhost:8000/login";
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
    console.log("TOKEN!!! " + token);
    if (use_auth && token !== null) {
        console.log("USING TOKEN " + token);
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
export function call(uri, serviceMethod, params){
    return new Promise((resolve, reject) => {
        var url = uri;
        // In case of GET request, add query parameters
        if (serviceMethod === 'GET' && params) {
            url += `?${new URLSearchParams(params)}`;
        }
        console.log('url ', url);
        console.log('body ', params);

        // TODO is this the proper way? what's the difference to the way with async/await above?
        login(url)
            .then(response => {
                // Make a request using fetch API
                fetch(url, {
                    method: serviceMethod,
                    // In case of POST/ PUT/ DELETE add body with parameters
                    body: serviceMethod !== 'GET' ? JSON.stringify(params) : undefined,
                    headers: headers()
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.text();
                    })
                    .then(data => {
                        resolve(data);
                    })
                    .catch(error => {
                        reject(error);
                    });
            });
    });
}

// Load all OPACA Actions from Runtime Platform
export async function fetchOpacaServices(location) {
    await login(location);
    console.log("HEADERS " + JSON.stringify(headers()));
    const response = await fetch(location, {
        headers: headers()
    });
    if (!response.ok) {
        throw new Error(`Failed to load Services: ${response.statusText}`);
    }
    return await response.json();
}