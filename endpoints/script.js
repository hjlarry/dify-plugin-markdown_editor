const { Editor } = toastui;
const { codeSyntaxHighlight } = Editor.plugin;

// DOM Elements
const editorElement = document.querySelector('#editor');
const floatingMenu = document.querySelector('#floating-menu');

// LLM Modal Elements
const llmModalBackdrop = document.querySelector('#llm-modal-backdrop');
const llmOutput = document.querySelector('#llm-output');
const llmLoading = document.querySelector('#llm-loading');
const llmActions = document.querySelector('#llm-actions');
const llmReplaceBtn = document.querySelector('#llm-replace');
const llmRegenerateBtn = document.querySelector('#llm-regenerate');
const llmCancelBtn = document.querySelector('#llm-cancel');

// Editor state
let currentSelectionRange = null;

// Function to handle the export
function exportAsMarkdown() {
    const markdownContent = editor.getMarkdown();
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'article.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to handle PDF export
async function exportAsPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const preview = document.querySelector('.toastui-editor-contents');
    const printableArea = document.createElement('div');
    const note = document.createElement('p');
    note.style.fontSize = '10px';
    note.style.color = '#777';
    note.style.borderBottom = '1px solid #ccc';
    note.style.paddingBottom = '10px';
    note.style.marginBottom = '10px';
    
    printableArea.appendChild(note);
    printableArea.innerHTML += preview.innerHTML;
    doc.html(printableArea, {
        callback: function(doc) {
            doc.save('document.pdf');
        },
        x: 15,
        y: 15,
        width: 170,
        windowWidth: 650
    });
}

function createMarkdownExportButton() {
    const button = document.createElement('button');
    button.className = 'toastui-editor-toolbar-icons';
    button.style.backgroundImage = 'none';
    button.style.margin = '0 2px';
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#555"><path d="M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM4 5V19H20V5H4ZM7 15.5H5V8.5H7L9 10.5L11 8.5H13V15.5H11V11.5L9 13.5L7 11.5V15.5ZM18 12.5H20L17 15.5L14 12.5H16V8.5H18V12.5Z"></path></svg>`;
    button.addEventListener('click', () => {
        exportAsMarkdown();
    });
    return button;
}

function createPdfExportButton() {
    const button = document.createElement('button');
    button.className = 'toastui-editor-toolbar-icons';
    button.style.backgroundImage = 'none';
    button.style.margin = '0 2px';
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#555"><path d="M5 4H15V8H19V20H5V4ZM3.9985 2C3.44749 2 3 2.44405 3 2.9918V21.0082C3 21.5447 3.44476 22 3.9934 22H20.0066C20.5551 22 21 21.5489 21 20.9925L20.9997 7L16 2H3.9985ZM10.4999 7.5C10.4999 9.07749 10.0442 10.9373 9.27493 12.6534C8.50287 14.3757 7.46143 15.8502 6.37524 16.7191L7.55464 18.3321C10.4821 16.3804 13.7233 15.0421 16.8585 15.49L17.3162 13.5513C14.6435 12.6604 12.4999 9.98994 12.4999 7.5H10.4999ZM11.0999 13.4716C11.3673 12.8752 11.6042 12.2563 11.8037 11.6285C12.2753 12.3531 12.8553 13.0182 13.5101 13.5953C12.5283 13.7711 11.5665 14.0596 10.6352 14.4276C10.7999 14.1143 10.9551 13.7948 11.0999 13.4716Z"></path></svg>`;
    button.addEventListener('click', () => {
        exportAsPdf();
    });
    return button;
}

const editor = new Editor({
    el: editorElement,
    height: '100%',
    initialEditType: 'markdown',
    previewStyle: 'vertical',
    plugins: [[codeSyntaxHighlight, { highlighter: Prism }]],
    hideModeSwitch: true,
    toolbarItems: [
        ['heading', 'bold', 'italic', 'strike'],
        ['hr', 'quote'],
        ['ul', 'ol', 'task'],
        ['table', 'link'],
        ['code', 'codeblock'],
        [{
            name: 'ExportMD',
            tooltip: 'Export as Markdown',
            el: createMarkdownExportButton()
        },
        {
            name: 'ExportPDF',
            tooltip: 'Export as PDF',
            el: createPdfExportButton()
        }]
    ]
});

// Load initial content from the hidden div
const initialContent = document.querySelector('#initial-markdown').textContent;
editor.setMarkdown(initialContent);

// Handle text selection and floating menu
const editorContent = editor.getEditorElements().mdEditor;
editorContent.addEventListener('mouseup', () => {
    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        if (selectedText.length > 0) {
            currentSelectionRange = editor.getSelection();
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            floatingMenu.style.display = 'block';
            let topPosition = rect.top + window.scrollY - floatingMenu.offsetHeight - 5;
            if (topPosition < 0) {
                topPosition = rect.bottom + window.scrollY + 5;
            }
            floatingMenu.style.left = `${rect.left + window.scrollX}px`;
            floatingMenu.style.top = `${topPosition}px`;
        } else {
            floatingMenu.style.display = 'none';
        }
    }, 10);
});

document.addEventListener('mousedown', (event) => {
    if (!floatingMenu.contains(event.target) && floatingMenu.style.display === 'block') {
        const selection = window.getSelection();
        if (selection.isCollapsed) {
             floatingMenu.style.display = 'none';
        }
    }
});

// Handle LLM interaction and Modal - REWRITTEN FOR STREAMING
async function processWithLLM(prompt) {
    if (!currentSelectionRange) return;

    const selectedText = editor.getMarkdown(currentSelectionRange);
    
    // Reset modal for new generation
    llmOutput.innerText = '';
    llmRegenerateBtn.dataset.lastPrompt = prompt; // Keep track of the last prompt
    llmRegenerateBtn.dataset.lastSelectedText = selectedText; // And the text
    showModal(true); // Show loading state
    llmOutput.style.display = 'none';
    llmActions.style.display = 'none';
    llmLoading.style.display = 'block';
    llmLoading.innerText = 'AI is thinking...';


    try {
        // Use Dify's streaming model invocation endpoint
        const response = await fetch(window.location.pathname + 'model/invoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                selectedText: selectedText
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Generation started, switch from loading to output view
        llmLoading.style.display = 'none';
        llmOutput.style.display = 'block';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Process Server-Sent Events from the buffer
            const parts = buffer.split('\n\n');
            buffer = parts.pop(); // The last part might be incomplete, save it for the next chunk

            for (const part of parts) {
                llmOutput.innerText += part;
            }
        }
    } catch (error) {
        llmLoading.style.display = 'none';
        llmOutput.style.display = 'block';
        llmOutput.innerText = `An error occurred while generating content:\n${error.message}`;
        console.error('Error calling LLM:', error);
    } finally {
        // Show actions once the stream is complete or an error occurs
        llmActions.style.display = 'block';
    }
}

function showModal(isLoading) {
    llmModalBackdrop.style.display = 'flex';
    if (isLoading) {
        llmLoading.style.display = 'block';
        llmOutput.style.display = 'none';
        llmActions.style.display = 'none';
    } else {
        llmLoading.style.display = 'none';
        llmOutput.style.display = 'block';
        llmActions.style.display = 'block';
    }
}

function hideModal() {
    llmModalBackdrop.style.display = 'none';
}

floatingMenu.addEventListener('click', async (event) => {
    if (event.target.tagName === 'BUTTON') {
        const prompt = event.target.dataset.prompt;
        floatingMenu.style.display = 'none';
        processWithLLM(prompt);
    }
});

llmReplaceBtn.addEventListener('click', () => {
    if (currentSelectionRange) {
        const newText = llmOutput.innerText;
        editor.replaceSelection(newText, currentSelectionRange);
    }
    hideModal();
});

llmRegenerateBtn.addEventListener('click', () => {
    const lastPrompt = llmRegenerateBtn.dataset.lastPrompt;
    if (lastPrompt) {
        // When regenerating, we must clear the selection range
        // as the user might have clicked elsewhere.
        // The original selection is re-established logically by the `replaceSelection` call.
        const originalRange = currentSelectionRange; 
        processWithLLM(lastPrompt).then(() => {
            currentSelectionRange = originalRange; // Restore selection context for 'Replace'
        });
    }
});

llmCancelBtn.addEventListener('click', () => {
    hideModal();
});
