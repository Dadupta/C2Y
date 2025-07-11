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
  if (typeof raw === 'string') raw = parseFloat(raw);
  if (isNaN(raw)) return 0;
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

  const allSections = {};
  let filesProcessed = 0;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target.result;
        let data = null;

        if (file.name.endsWith('.json')) {
          data = JSON.parse(content);
        } else if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
          try {
            data = JSON.parse(content);
          } catch {
            data = content
              .split('\n')
              .map(line => {
                if (!line.trim()) return null;
                const parts = line.split(',');
                if (parts.length >= 2) {
                  return {
                    time: parseFloat(parts[0].trim()),
                    title: parts.slice(1).join(',').trim()
                  };
                }
                return null;
              })
              .filter(Boolean);
          }
        } else {
          throw new Error('Unsupported file type: only .json, .txt, .csv allowed');
        }

        const sections = extractAllChapters(data);
        Object.assign(allSections, sections);

      } catch (err) {
        showError(`❌ Error in "${file.name}": ${err.message}`);
      }

      filesProcessed++;
      if (filesProcessed === files.length) {
        updateOutput(allSections);
      }
    };

    reader.readAsText(file);
  });
}

function extractAllChapters(data) {
  const sections = {};

  if (typeof data !== 'object') {
    throw new Error('Unsupported data format.');
  }

  // Time Marks
  if (data.time_marks?.mark_items?.length) {
    sections['Time Marks'] = data.time_marks.mark_items.map(item => ({
      time: parseTime(item.time_range?.start),
      title: item.title || 'Untitled'
    }));
  }

  // Texts
  if (data.materials?.texts?.length) {
    sections['Texts'] = data.materials.texts.map(item => ({
      time: 0,
      title: item.content || 'Untitled'
    }));
  }

  // Subtitles
  if (data.subtitle_taskinfo?.length) {
    sections['Subtitles'] = data.subtitle_taskinfo.map(item => ({
      time: parseTime(item.time_range?.start),
      title: item.text || 'Untitled'
    }));
  }

  // Flat array fallback
  if (Array.isArray(data)) {
    sections['Lines'] = data
      .map(entry => {
        const time = entry.time || entry.start || entry.time_mark || entry.timecode;
        const title = entry.title || entry.label || entry.name || '';
        if (!title) return null;
        return { time: parseTime(time), title };
      })
      .filter(Boolean);
  }

  // Catch-all fallback
  if (Object.keys(sections).length === 0) {
    throw new Error('No recognizable chapter or marker structure found.');
  }

  return sections;
}

// UI
function updateOutput(sections) {
  const format = document.getElementById('time-format').value;
  const caseStyle = document.getElementById('case-format').value;
  const numbered = document.getElementById('numbering').checked;

  let output = '';

  for (const [sectionName, entries] of Object.entries(sections)) {
    output += `### ${sectionName} ###\n`;
    output += entries
      .sort((a, b) => a.time - b.time)
      .map((ch, i) => {
        const timeStr = toTimestamp(ch.time, format);
        let title = formatTitle(ch.title, caseStyle);
        if (numbered) title = `${i + 1}. ${title}`;
        return `${timeStr} ${title}`;
      }).join('\n');
    output += '\n\n';
  }

  document.getElementById('output-box').value = output.trim();
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
