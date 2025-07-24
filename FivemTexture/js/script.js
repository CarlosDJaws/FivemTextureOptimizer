const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const fileListPlaceholder = document.getElementById('file-list-placeholder');
const downloadBtn = document.getElementById('download-btn');
const downloadLog = document.getElementById('download-log');

let filesToProcess = [];

// --- Drag and Drop Logic ---
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const newFiles = Array.from(e.dataTransfer.files);
    handleFiles(newFiles);
});
fileInput.addEventListener('change', (e) => {
    const newFiles = Array.from(e.target.files);
    handleFiles(newFiles);
});

function isPowerOfTwo(n) {
    return (n > 0) && (n & (n - 1)) === 0;
}

function hasTransparency(img) {
    return new Promise(resolve => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < imageData.length; i += 4) {
            if (imageData[i] < 255) {
                resolve(true); // Found partial transparency
                return;
            }
        }
        resolve(false); // No transparency
    });
}

async function handleFiles(files) {
    fileListPlaceholder.style.display = 'none';
    downloadBtn.disabled = true;
    downloadLog.textContent = 'Analyzing files...';

    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;

        const fileObject = {
            file,
            name: file.name,
            status: 'analyzing',
            message: 'Analyzing...',
            recommendedFormat: 'BC1 (DXT1)',
            originalFile: file
        };
        filesToProcess.push(fileObject);
        renderFileItem(fileObject);

        const img = await createImageBitmap(file);
        
        // Check dimensions
        const isPOT = isPowerOfTwo(img.width) && isPowerOfTwo(img.height);
        if (!isPOT) {
            fileObject.status = 'error';
            fileObject.message = `Error: Dimensions (${img.width}x${img.height}) are not a power of two.`;
            updateFileItem(fileObject);
            continue;
        }

        // Check for transparency to recommend format
        const hasAlpha = await hasTransparency(img);
        if (hasAlpha) {
            fileObject.recommendedFormat = 'BC3 (DXT5)';
        }
        
        fileObject.status = 'success';
        fileObject.message = `Ready. Recommended format: ${fileObject.recommendedFormat}.`;
        updateFileItem(fileObject);
    }
    
    downloadBtn.disabled = filesToProcess.every(f => f.status === 'error');
    downloadLog.textContent = 'Analysis complete. Ready to download.';
}

function renderFileItem(fileObject) {
    const item = document.createElement('div');
    item.id = `file-${fileObject.name.replace(/[^a-zA-Z0-9]/g, '')}`;
    item.className = 'file-item';
    item.innerHTML = `
        <div class="flex items-center overflow-hidden">
            <div class="status-icon status-warning mr-3">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span class="truncate text-sm font-medium">${fileObject.name}</span>
        </div>
        <div class="flex items-center">
            <span class="message-span text-xs text-gray-400 truncate mr-4">${fileObject.message}</span>
            <button class="delete-btn text-gray-500 hover:text-white transition-colors p-1 rounded-full -mr-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    `;
    fileList.appendChild(item);

    // Add event listener for the new delete button
    item.querySelector('.delete-btn').addEventListener('click', () => {
        deleteFile(fileObject.name);
    });
}

function deleteFile(fileName) {
    // Remove the file from the processing array
    filesToProcess = filesToProcess.filter(f => f.name !== fileName);

    // Remove the file's HTML element from the list
    const itemToRemove = document.getElementById(`file-${fileName.replace(/[^a-zA-Z0-9]/g, '')}`);
    if (itemToRemove) {
        itemToRemove.remove();
    }

    // Update the UI state
    if (filesToProcess.length === 0) {
        fileListPlaceholder.style.display = 'block';
        downloadLog.textContent = '';
    } else {
        downloadLog.textContent = 'Ready to download.';
    }
    
    // Re-evaluate if the download button should be enabled
    downloadBtn.disabled = filesToProcess.length === 0 || filesToProcess.every(f => f.status === 'error');
}


function updateFileItem(fileObject) {
    const item = document.getElementById(`file-${fileObject.name.replace(/[^a-zA-Z0-9]/g, '')}`);
    if (!item) return;
    
    const iconContainer = item.querySelector('.status-icon');
    const messageEl = item.querySelector('.message-span');
    
    iconContainer.classList.remove('status-warning', 'status-success', 'status-error');
    
    if (fileObject.status === 'success') {
        iconContainer.classList.add('status-success');
        iconContainer.innerHTML = `<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    } else if (fileObject.status === 'error') {
        iconContainer.classList.add('status-error');
        iconContainer.innerHTML = `<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
    }
    messageEl.textContent = fileObject.message;
}

// --- Download Logic ---
downloadBtn.addEventListener('click', async () => {
    const validFiles = filesToProcess.filter(f => f.status === 'success');
    if (validFiles.length === 0) {
        downloadLog.textContent = 'No valid files to process.';
        return;
    }

    downloadBtn.disabled = true;
    downloadLog.textContent = 'Zipping files... please wait.';

    const zip = new JSZip();
    const readmeContent = `
FiveM Texture Optimizer Assistant - Report
Generated on: ${new Date().toUTCString()}

This package contains textures ready for use in a .ytd file.
This tool does NOT perform the actual DDS compression. It checks for common errors and renames the files. You still need to use a tool like OpenIV to import these into a .ytd, which will handle the final compression.

--- File Report ---
${validFiles.map(f => `
File: ${f.name}
- Status: OK
- Recommended Format: ${f.recommendedFormat}
`).join('')}

${filesToProcess.filter(f => f.status !== 'success').map(f => `
File: ${f.name}
- Status: SKIPPED
- Reason: ${f.message}
`).join('')}
    `;
    
    zip.file('__readme.txt', readmeContent);

    for (const fileObject of validFiles) {
        // In a real app, you'd convert to DDS here.
        // For this tool, we just package the original and rename it.
        const newName = fileObject.name.split('.').slice(0, -1).join('.') + '.dds';
        zip.file(newName, fileObject.originalFile);
    }

    zip.generateAsync({ type: 'blob' })
        .then(function(content) {
            saveAs(content, 'optimized_textures.zip');
            downloadLog.textContent = 'Download complete!';
            downloadBtn.disabled = false;
        });
});