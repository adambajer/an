var triggerPhraseMap = {
    'note-mel': 'Měl bych',
    'note-musi': 'Musím',
    'note-mela': 'Měla bych',
    'note-musime': 'Musíme',
    'note-melibysme': 'Měli bysme',
    'note-melibychom': 'Měli bychom',
    'custom-trigger': 'Custom' // Default phrase for custom triggers
};

const listeningStatus = document.getElementById('listeningStatus');
const status = document.getElementById('status');document.addEventListener('DOMContentLoaded', function() {
    if (!window.notesLoaded) {
        loadNotes();
        setupVoiceRecognition();
        window.notesLoaded = true;
    }
});

function setupVoiceRecognition() {
    if (annyang) {
        annyang.setLanguage('cs-CZ');
        annyang.addCommands(setupCommands());
        annyang.addCallback('soundstart', () => updateStatus('Listening...', 'orange'));
        annyang.addCallback('resultMatch', (userSaid, commandText) => updateStatus(`Command recognized: ${commandText}`, 'green'));
        annyang.addCallback('resultNoMatch', (phrases) => updateStatus('No command recognized', 'red'));
        annyang.start({ autoRestart: true, continuous: true });
    } else {
        alert('Annyang is not loaded!');
    }
}

function setupCommands() {
    var commands = {};
    Object.keys(triggerPhraseMap).forEach(key => {
        commands[`${triggerPhraseMap[key]} *note`] = (note) => addNote(note, key);
    });
    return commands;
}

function addNote(note, noteClass) {
    const noteArea = document.getElementById('noteArea');
    const datetime = new Date().toLocaleString('cs-CZ', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    const noteElement = document.createElement('div');
    noteElement.className = 'single ' + noteClass;
    noteElement.textContent = `${triggerPhraseMap[noteClass]} ${note}`;
    noteElement.setAttribute('data-datetime', datetime);
    noteElement.appendChild(createDeleteButton(noteElement));  // Attach delete button
    noteElement.onclick = () => makeNoteEditable(noteElement);
    noteArea.prepend(noteElement); // Adds new notes to the top
    saveNotes();
}


function createDeleteButton(noteElement) {
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete';
    deleteButton.style.display = 'none';  // Button hidden initially, shown on hover
    deleteButton.onclick = function(event) {
        event.stopPropagation();  // Prevents the click from affecting parent elements
        noteElement.remove();     // Removes the note element from the DOM
        saveNotes();              // Update local storage after deleting the note
    };
    return deleteButton;
}

function makeNoteEditable(noteElement) {
    noteElement.contentEditable = true;
    noteElement.focus();
    noteElement.onblur = function() {
        noteElement.contentEditable = false;
        saveNotes();
    };
}

function updateStatus(message, color) {
    const status = document.getElementById('status');
    const listeningStatus = document.getElementById('listeningStatus');
    status.textContent = message;
    listeningStatus.style.color = color;
    setTimeout(() => {
        status.textContent = 'Ready';
        listeningStatus.style.color = 'blue';
    }, 3000);
}

function saveNotes() {
    const notes = Array.from(document.querySelectorAll('.single')).map(note => ({
        datetime: note.getAttribute('data-datetime'),
        text: note.textContent,
        noteClass: note.className.split(' ')[1]
    }));
    localStorage.setItem('notes', JSON.stringify(notes));
}

function loadNotes() {
    const notesArea = document.getElementById('noteArea');
    const savedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
    savedNotes.forEach(({ text, noteClass, datetime }) => {
        const noteElement = document.createElement('div');
        noteElement.className = 'single ' + noteClass;
        noteElement.textContent = text;
        noteElement.setAttribute('data-datetime', datetime);
        noteElement.appendChild(createDeleteButton());
        noteElement.onclick = () => makeNoteEditable(noteElement);
        notesArea.prepend(noteElement);
    });
}
function addNewTrigger() {
    var newTriggerPhrase = prompt("Please enter your new voice trigger:");
    if (newTriggerPhrase && annyang) {
        var command = {};
        command[newTriggerPhrase + ' *note'] = function (note) {
            addNote(note, 'custom-' + newTriggerPhrase);
        };
        annyang.addCommands(command);
        triggerPhraseMap['note-' + newTriggerPhrase] = newTriggerPhrase;
        updateTriggerList(newTriggerPhrase);
    }
}

function updateTriggerList(triggerPhrase) {
    var triggerContainer = document.getElementById('voiceTriggers');
    var innerContainer = triggerContainer.querySelector('.inline-flex');
    if (innerContainer) {
        var newTriggerDiv = document.createElement('div');
        newTriggerDiv.textContent = triggerPhrase;
        newTriggerDiv.className = 'note-' + triggerPhrase;
        innerContainer.appendChild(newTriggerDiv);
    }
}
function addManualNote() {
    var noteInput = document.getElementById('manualNoteInput');
    if (noteInput.value.trim() !== '') {
        addNote('noteArea', noteInput.value, 'manual-note');
        noteInput.value = ''; // Clear input after adding
    }
}

