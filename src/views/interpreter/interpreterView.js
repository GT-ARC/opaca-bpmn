// interpreterView.js
export default function interpreterView() {
    const inputCount = 2;
    var container = document.getElementById('interpreter-view');

    // Create the label
    const label = document.createElement('div');
    label.className = 'view-label';

    //const img = document.createElement('img');
    //img.src = 'path/to/your/image.png'; // Adjust the path
    //img.alt = 'Selected Element Image';

    const span = document.createElement('span');
    span.innerText = 'INTERPRETER';

    //label.appendChild(img);
    label.appendChild(span);

    // Append the label to the container
    container.appendChild(label);

    // Create the content
    const content = document.createElement('div');
    content.className = 'collapsible-content';

    for (var i = 1; i <= inputCount; i++) {
        var input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Interpreter Value ' + i;
        content.appendChild(input);
    }

    // Append the content to the container
    container.appendChild(content);

    // Set up the click event for the label
    label.addEventListener('click', toggleInterpreterView);

    function toggleInterpreterView() {
        if (content.style.display === 'none' || !content.style.display) {
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
        }
    }
}

