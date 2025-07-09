// Utility Functions
function toTimestamp(seconds, format = 'hhmmss') {
  seconds = Math.floor(seconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (format === 'hhmmss') return [h, m, s].map(pad).join(':');
  if (format === 'mmss') return [h * 60 + m, s].map(pad).join(':');
  if (format === 'mss') return `${h * 60 + m}:${s}`;
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

function formatTitle(title, caseStyle = 'original') {
  if (caseStyle === 'upper') return title.toUpperCase();
  if (caseStyle === 'title') return title.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
  return title;
}

function parseTime(raw) {
  return raw > 360000 ? raw / 1_000_000 : raw / 1_000;
}

function showError(msg) {
  const fb = document.getElementById('file-feedback');
  fb.textContent = msg;
  fb.style.color = 'red';
}

function clearError() {
  const fb = document.getElementById('file-feedback');
  fb.textContent = '';
}

// File Processing
document.getElementById('file-input').addEventListener('change', handleFiles);

function handleFiles(event) {
  const files = event.target.files;
  clearError();

  const allChapters = [];
  let filesProcessed = 0;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target.result;
        let data;

        if (file.name.endsWith('.json')) {
          data = JSON.parse(content);
        } else if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
          data = content.split('\n').map(line => {
            const [time, ...rest] = line.split(',');
            return { time: parseFloat(time.trim()), title: rest.join(',').trim() };
          });
        } else {
          throw new Error('Unsupported file type');
        }

        const chapters = extractChapters(data);
        allChapters.push(...chapters);

      } catch (err) {
        showError(`❌ Error in "${file.name}": ${err.message}`);
      }

      filesProcessed++;
      if (filesProcessed === files.length) {
        updateOutput(allChapters);
      }
    };

    reader.readAsText(file);
  });
}

function extractChapters(data) {
  if (!Array.isArray(data)) {
    if (data.markers) data = data.markers;
    else throw new Error('Unsupported JSON structure');
  }

  return data
    .map(entry => {
      const rawTime = entry.time || entry.timecode || entry.start || entry.time_mark;
      const label = entry.title || entry.name || entry.label;
      if (!rawTime || !label) return null;

      return {
        time: parseTime(Number(rawTime)),
        title: label
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.time - b.time);
}

// UI
function updateOutput(chapters) {
  const format = document.getElementById('time-format').value;
  const caseStyle = document.getElementById('case-format').value;
  const numbered = document.getElementById('numbering').checked;

  const output = chapters.map((ch, i) => {
    const timeStr = toTimestamp(ch.time, format);
    let title = formatTitle(ch.title, caseStyle);
    if (numbered) title = `${i + 1}. ${title}`;
    return `${timeStr} ${title}`;
  }).join('\n');

  document.getElementById('output-box').value = output;
  document.getElementById('save-project-btn').hidden = !firebase.auth().currentUser;
}

// Clipboard
document.getElementById('copy-btn').addEventListener('click', () => {
  const box = document.getElementById('output-box');
  navigator.clipboard.writeText(box.value).then(() => alert('Copied to clipboard!'));
});

// Download
document.getElementById('download-btn').addEventListener('click', () => {
  const blob = new Blob([document.getElementById('output-box').value], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chapters.txt';
  a.click();
  URL.revokeObjectURL(url);
});

// Theme Toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// Firebase Save
document.getElementById('save-project-btn').addEventListener('click', () => {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const title = prompt('Enter a name for this project:', `Draft ${Date.now()}`);
  if (!title) return;

  const data = {
    title,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    chapters: document.getElementById('output-box').value.split('\n').map(line => {
      const [time, ...titleParts] = line.trim().split(' ');
      return {
        time,
        title: titleParts.join(' ')
      };
    })
  };

  firebase.firestore().collection('users').doc(user.uid)
    .collection('projects').add(data)
    .then(() => alert('Project saved!'))
    .catch(err => alert('Error saving project: ' + err.message));
});
