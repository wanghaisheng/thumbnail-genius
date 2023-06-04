// Function to handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('processButton').disabled = false;
    } else {
        document.getElementById('processButton').disabled = true;
    }
}

// Function to handle processing
function handleProcess() {
    const file = document.getElementById('fileInput').files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        fetch('/process', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            displayResultTable(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}

// Function to display the result table
function displayResultTable(data) {
    const table = document.getElementById('resultTable');
    table.innerHTML = '';

    // Create table headers
    const headers = ['Input File', 'Result Image 1', 'Result Image 2'];
    const headerRow = document.createElement('tr');
    headers.forEach(headerText => {
        const header = document.createElement('th');
        header.textContent = headerText;
        headerRow.appendChild(header);
    });
    table.appendChild(headerRow);

    // Create table rows
    data.forEach(rowData => {
        const row = document.createElement('tr');
        Object.values(rowData).forEach(value => {
            const cell = document.createElement('td');

            if (value.endsWith('.jpg')) {
                const image = document.createElement('img');
                image.src = value;
                image.style.width = '100px';
                image.addEventListener('click', () => {
                    window.open(value);
                });

                cell.appendChild(image);
            } else {
                cell.textContent = value;
            }

            row.appendChild(cell);
        });
        table.appendChild(row);
    });
}

// Attach event listeners
document.getElementById('fileInput').addEventListener('change', handleFileSelect);
document.getElementById('processButton').addEventListener('click', handleProcess);
