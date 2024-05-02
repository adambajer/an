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
const status = document.getElementById('status');
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    var currentDateSpan = document.getElementById('currentDate');
    var today = new Date();
    var dateString = today.toLocaleDateString('cs-CZ', {
        year: 'numeric', month: 'numeric', day: 'numeric'
    });
    currentDateSpan.textContent = dateString;
    
});


function initializeApp() {
    if (!window.notesLoaded) {
        loadNotes();
        startRecognition(); // Start speech recognition automatically
        window.notesLoaded = true;
    }
}

 

function addManualNote() {
    var noteInput = document.getElementById('manualNoteInput');
    if (noteInput.value.trim() !== '') {
        addNote('noteArea', noteInput.value, 'manual-note');
        noteInput.value = ''; // Clear input after adding
    }
}

function makeNoteEditable(noteElement) {
    noteElement.contentEditable = "true";
    noteElement.focus();
    noteElement.onblur = function () {
        noteElement.contentEditable = "false";
        saveNotes();
    };
}
 

function startRecognition() {
    if (annyang) {
        const dingSound = document.getElementById('dingSound');
         
        statusIndicator.style.color = 'blue'; // default color
        annyang.debug([newState=true]);
        // Callback when sound is detected
        annyang.addCallback('soundstart', function () {
            dingSound.play();
            status.textContent = 'Listening...';
            listeningStatus.style.color = 'orange';
        });

        // Callback for successful command recognition
        annyang.addCallback('resultMatch', function () {
            dingSound.play();
            status.textContent = 'Command recognized'; 
            statusIndicator.textContent = 'green';
            // Reset color after 3 seconds
            setTimeout(function () {
                
                status.textContent = 'Ready';
                statusIndicator.style.color =  'blue';
            }, 3000);
        });

        // Callback for no command recognized
        annyang.addCallback('resultNoMatch', function (phrases) {
            console.log('No command recognized', phrases);
            dingSound.play();
            status.textContent = 'No command recognized';
            listeningStatus.style.color = 'red';
            // Reset color after 3 seconds
            setTimeout(function () {
                statusIndicator.style.color = 'Ready'; 
                listeningStatus.style.color = 'red';

            }, 3000);
        });

        var commands = {
            'měl bych *note': function (note) { addNote('noteArea', note, 'note-mel'); },
            'musím *note': function (note) { addNote('noteArea', note, 'note-musi'); },
            'měla bych *note': function (note) { addNote('noteArea', note, 'note-mela'); },
            'musíme *note': function (note) { addNote('noteArea', note, 'note-musime'); },
            'měli bysme *note': function (note) { addNote('noteArea', note, 'note-melibysme'); },
            'měli bychom *note': function (note) { addNote('noteArea', note, 'note-melibychom'); }
        };
        annyang.addCommands(commands);
        annyang.setLanguage('cs-CZ');
        annyang.start({ autoRestart: true, continuous: false });
        isRecognizing = true;
 
    } else {
        alert('Annyang is not loaded!');
    }
}


function stopRecognition() {
    if (annyang) {
        annyang.abort();
        isRecognizing = false;
    }
}


function addNote(noteArea, note, noteClass) {
    var noteArea = document.getElementById(noteArea);
    var time = new Date().toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    var triggerPhrase = triggerPhraseMap[noteClass] || '';
    var noteElement = document.createElement('div');
    noteElement.className = 'single ' + noteClass;
    noteElement.setAttribute('data-time', time);
    noteElement.setAttribute('data-trigger', triggerPhrase);
    noteElement.textContent = note;
    var deleteButton = document.createElement('button');
    deleteButton.classList.add("delete");
    deleteButton.style.display = 'none';
    deleteButton.onclick = function () {
        deleteNote(noteElement);
    };
    noteElement.appendChild(deleteButton);
    noteElement.onmouseover = function () {
        deleteButton.style.display = 'block';
    };
    noteElement.onmouseout = function () {
        deleteButton.style.display = 'none';
    };
    noteArea.appendChild(noteElement);
    noteElement.onclick = function () { makeNoteEditable(noteElement); };
    saveNotes();
}

function deleteNote(noteElement) {
    var noteArea = noteElement.parentNode;
    noteArea.removeChild(noteElement);
    saveNotes();
}

function addNewTrigger() {
    var newTriggerPhrase = prompt("Please enter your new voice trigger:");
    if (newTriggerPhrase && annyang) {
        var command = {};
        command[newTriggerPhrase + ' *note'] = function (note) {
            addNote('noteArea', note, 'custom-' + newTriggerPhrase);
        };
        annyang.addCommands(command);
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
        // Update the triggerPhraseMap within this function
        triggerPhraseMap['note-' + triggerPhrase] = triggerPhrase;
    } else {
        console.error('Failed to find the inner container within voiceTriggers.');
    }
}




function downloadNotes() {
    var notes = document.getElementById('noteArea').getElementsByClassName('single');
    var content = '';
    var currentDateSpan = document.getElementById('currentDate');
    var today = new Date();
    var dateString = today.toLocaleDateString('cs-CZ', {
        year: 'numeric', month: 'numeric', day: 'numeric'
    });
    content = content + dateString + '\n\n';
    for (var i = 0; i < notes.length; i++) {
        var noteTime = notes[i].getAttribute('data-time');
        var noteTrigger = notes[i].getAttribute('data-trigger');
        content += noteTime + ' - ' + noteTrigger + ' ' + notes[i].textContent + '\n';
    }
    var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.download = 'notes_' + dateString + '.txt';
    a.href = window.URL.createObjectURL(blob);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function saveNotes() {
    var notesArray = [];
    var notes = document.querySelectorAll('.single');
    notes.forEach(function (note) {
        var data = {
            time: note.getAttribute('data-time'),
            trigger: note.getAttribute('data-trigger'),
            text: note.childNodes[0].nodeValue,
            noteClass: note.className.split(' ')[1]
        };
        notesArray.push(data);
    });
    localStorage.setItem('notes', JSON.stringify(notesArray));
}

function loadNotes() {
    var notesArea = document.getElementById('noteArea');
    notesArea.innerHTML = '';
    var storedNotes = localStorage.getItem('notes');
    if (storedNotes) {
        var notes = JSON.parse(storedNotes);
        notes.forEach(function (note) {
            addNote('noteArea', note.text, note.noteClass, note.time, note.trigger);
        });
    }
} 
