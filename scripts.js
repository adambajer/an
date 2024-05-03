var triggerPhraseMap = {
    'note-mel': 'Měl bych',
    'note-musi': 'Musím',
    'note-mela': 'Měla bych',
    'note-musime': 'Musíme',
    'note-melibysme': 'Měli bysme',
    'note-melibychom': 'Měli bychom',
    'custom-trigger': 'Custom' // Default phrase for custom triggers
};
function getListeningClass(triggerPhrase) {
  const className = triggerPhraseMap[triggerPhrase] || 'default';
  return className.replace(/\s/g, '_'); // Replace spaces with underscores
}

let listeningStatus = document.getElementById('listeningStatus');
let status = document.getElementById('status'); 
function updateStatus(message, color, commandText) {
  status.textContent = message;
  console.log(commandText); // This will now log the text without "*note"
  listeningStatus.style.color = color;

  // Ensure a default class is set initially (if not already defined)
  if (!listeningStatus.className) {
    listeningStatus.className = 'default'; // Or any preferred default class
  }

  // Get the class based on the trigger phrase or use the default
  const triggerPhrase = commandText.replace(/\s\*\note$/, ''); // Remove "*note" from the end using regular expression
  const listeningClass = getCommandClass(triggerPhrase);
  listeningStatus.className = listeningClass;

  console.log(triggerPhraseMap); // This will show the trigger phrases without "*note"
  console.log(triggerPhraseMap[triggerPhrase]); // This might be undefined if the trigger phrase without "*note" doesn't exist
}




function getCommandClass(commandText) {
    // Clean or modify commandText as necessary
    for (let key in triggerPhraseMap) {
        if (triggerPhraseMap[key] === commandText) {
            return key;  // Return the matching class
        }
    }
    return 'custom-trigger';  // Default class if no match is found
}

document.addEventListener('DOMContentLoaded', function () {
    if (!window.notesLoaded) {
        loadNotes();
        setupVoiceRecognition();
 
        window.notesLoaded = true;
        var currentDateSpan = document.getElementById('currentDate');
        var today = new Date();
        var dateString = today.toLocaleDateString('cs-CZ', {
            year: 'numeric', month: 'numeric', day: 'numeric'
        });
        currentDateSpan.textContent = dateString;
    }
});
function setupVoiceRecognition() {
    if (annyang) {
        annyang.setLanguage('cs-CZ');
        annyang.addCommands(setupCommands());

        // Always ensure Annyang starts fresh
        startAnnyang();

        // When sound starts, indicate listening
        annyang.addCallback('soundstart', () => {
            console.log('Listening...');
            updateStatus('Listening...', 'blue','start');
        });

        // Handle no command match
    annyang.addCallback('resultMatch', (userSaid, commandText, phrases) => {
  let commandClass = getCommandClass(phrases); // Use phrases for class lookup
  updateStatus(commandText, 'green', phrases); // Pass phrases to updateStatus
  setTimeout(() => startAnnyang(), 1000); // Restart after processing the command
});

    } }
annyang.addCallback('resultMatch', (userSaid, commandText, phrases) => {
  let commandClass = triggerPhraseMap[phrases];
    
    updateStatus(commandText, 'green', phrases); // Update status with the command class
    setTimeout(() => startAnnyang(), 1000); // Restart after processing the command
});

 

function startAnnyang() {
    annyang.start({ autoRestart: false, continuous: true });              
    updateStatus('Listening...', 'blue','ready');


}
  

function executeCommand(commandText, userSaid) {
    console.log("Executing command:", commandText, "Said:", userSaid);
    // Here you can add code to handle the command appropriately
    // For example, using the commandText to call different functions
}
function setupCommands() {
    var commands = {};
    Object.keys(triggerPhraseMap).forEach(key => {
        commands[`${triggerPhraseMap[key]} *note`] = (note) => addNote(note, key);
    });
    return commands;
}
function setupNoteInput() {
    const inputElement = document.getElementById('noteInput'); // Assume 'noteInput' is the ID of your text input
    inputElement.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent the default action to avoid submitting the form
            addNote(); // Assume 'addNote' is a function that handles adding the new note
        }
    });
}

function addNote(note, noteClass) {
    const noteArea = document.getElementById('noteArea');
    const fullDatetime = new Date(); // Get the current datetime
    const displayTime = fullDatetime.toLocaleTimeString('cs-CZ', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }); // This will only display the time


    let noteElement = document.createElement('div');
    noteElement.className = 'single ' + noteClass;
    noteElement.setAttribute('data-datetime', fullDatetime.toLocaleString('cs-CZ')); // Store full datetime

    let textSpan = document.createElement('span'); // Use a span to hold the text content
    textSpan.textContent = triggerPhraseMap[noteClass] ? `${triggerPhraseMap[noteClass]} ${note}` : note;
    noteElement.appendChild(textSpan);

    noteElement.appendChild(createDeleteButton(noteElement));
    noteElement.onclick = () => makeNoteEditable(noteElement);
    noteArea.prepend(noteElement);
    saveNotes();
}



function createDeleteButton(noteElement) {
    if (!noteElement) {
        console.error("createDeleteButton was called without a noteElement");
        return null; // Early exit if no element is provided
    }

    let deleteButton = noteElement.querySelector('.delete');
    if (!deleteButton) {
        deleteButton = document.createElement('button');
        deleteButton.textContent = '';
        deleteButton.className = 'delete';
        deleteButton.style.display = 'none';
        deleteButton.onclick = function (event) {
            event.stopPropagation();
            noteElement.remove();
            saveNotes();
        };
    }
    return deleteButton;
}


function makeNoteEditable(noteElement) {
    noteElement.contentEditable = true;
    noteElement.focus();
    noteElement.onblur = function () {
        noteElement.contentEditable = false;
        saveNotes();
    };
}

 
function getCommandClass(commandText) {
    // Iterate over the triggerPhraseMap to find the class associated with the command text
    for (let key in triggerPhraseMap) {
        if (triggerPhraseMap[key] === commandText) {
            return key; // Return the key which is the class name related to the command
        }
    }
    return ''; // Return an empty string if no class is associated with the command
}
function saveNotes() {
    const notes = Array.from(document.querySelectorAll('.single')).map(note => {
        let textSpan = note.querySelector('span'); // Ensure only text content is saved
        return {
            datetime: note.getAttribute('data-datetime'),
            text: textSpan.textContent, // Save only the text content
            noteClass: note.className.split(' ')[1]
        };
    });
    localStorage.setItem('notes', JSON.stringify(notes));
}

function loadNotes() {
    const notesArea = document.getElementById('noteArea');
    const savedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
    // Iterate through the saved notes in reverse order
    savedNotes.slice().reverse().forEach(({ text, noteClass, datetime }) => {
        let noteElement = document.createElement('div');
        noteElement.className = 'single ' + noteClass;
        noteElement.setAttribute('data-datetime', datetime);

        let textSpan = document.createElement('span');
        textSpan.textContent = text;
        noteElement.appendChild(textSpan);

        noteElement.appendChild(createDeleteButton(noteElement));
        noteElement.onclick = () => makeNoteEditable(noteElement);
        notesArea.prepend(noteElement);
    });
}

function downloadNotes() {
    var notes = document.querySelectorAll('.single');
    var content = 'Your Notes:\n';
    notes.forEach(function (note) {
        var datetime = note.getAttribute('data-datetime');
        var text = note.querySelector('span').textContent; // Assuming text is within a <span>
        content += `${datetime} - ${text}\n`;
    });
    var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'notes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function addNewTrigger() {
    var newTriggerPhrase = prompt("Please enter your new voice trigger:");
    if (newTriggerPhrase && annyang) {
        // Define the action for the new trigger
        var command = {};
        command[newTriggerPhrase + ' *note'] = function (note) {
            // Ensure we're passing the correct trigger class to addNote
            addNote(note, 'note-' + newTriggerPhrase);
        };

        // Add the new command to annyang
        annyang.addCommands(command);

        // Update the triggerPhraseMap with the new trigger
        triggerPhraseMap['note-' + newTriggerPhrase] = newTriggerPhrase;

        // Update UI list of triggers if necessary
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
        addNote(noteInput.value, 'manual-note'); // Corrected to pass note text and note class correctly
        noteInput.value = ''; // Clear input after adding
    }
}
