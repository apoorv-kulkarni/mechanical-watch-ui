// Create watch indices and numerals
function initializeAnalogWatch() {
    const indicesContainer = document.getElementById('indices');
    const numeralsContainer = document.getElementById('numerals');
    
    // Create 60 markers (12 main indices + 48 beat markers)
    for (let i = 0; i < 60; i++) {
        const marker = document.createElement('div');
        const isMainIndice = i % 5 === 0;
        marker.classList.add(isMainIndice ? 'indice' : 'beat');
        
        const angle = i * 6; // 6 degrees per marker
        const angleRad = (angle - 90) * (Math.PI / 180); // -90 to start at 12 o'clock
        
        // Calculate position near the edge (at ~90% radius for indices, ~92% for beats)
        const radius = isMainIndice ? 44 : 46; // percentage from center
        const x = radius * Math.cos(angleRad);
        const y = radius * Math.sin(angleRad);
        
        marker.style.left = `calc(50% + ${x}%)`;
        marker.style.top = `calc(50% + ${y}%)`;
        marker.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        
        indicesContainer.appendChild(marker);
    }

    // Create numerals
    const numerals = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    numerals.forEach((num, index) => {
        const numeral = document.createElement('div');
        numeral.classList.add('numeral');
        numeral.textContent = num;
        const angle = index * 30;
        const radius = 33; // Moved further inward to clear the indices
        const x = radius * Math.cos((angle - 90) * (Math.PI / 180));
        const y = radius * Math.sin((angle - 90) * (Math.PI / 180));
        numeral.style.left = `calc(50% + ${x}%)`;
        numeral.style.top = `calc(50% + ${y}%)`;
        numeral.style.transform = 'translate(-50%, -50%)';
        numeralsContainer.appendChild(numeral);
    });
}

// Create beep sound using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let beepMuted = false;

function beep() {
    if (beepMuted) return; // Don't beep if muted
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // 800 Hz beep
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Track last second to detect when it resets
let lastSecond = -1;

// Time offset from sync
let timeOffset = 0;

// Sync time with multiple reliable time sources
async function syncTime() {
    const syncStatus = document.getElementById('syncStatus');
    syncStatus.textContent = 'Syncing...';
    
    // Detect browser's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // List of time APIs to try in order (all support CORS)
    const timeAPIs = [
        {
            name: 'TimeAPI',
            url: `https://timeapi.io/api/time/current/zone?timeZone=${encodeURIComponent(userTimezone)}`,
            parse: (data) => new Date(data.dateTime).getTime()
        },
        {
            name: 'Cloudflare',
            url: 'https://cloudflare.com/cdn-cgi/trace',
            parse: (text) => {
                // Cloudflare returns text format, extract timestamp
                const match = text.match(/ts=([\d.]+)/);
                if (match) {
                    return parseFloat(match[1]) * 1000; // Convert to milliseconds
                }
                throw new Error('No timestamp in response');
            },
            isText: true
        }
    ];
    
    for (const api of timeAPIs) {
        try {
            const before = performance.now();
            const response = await fetch(api.url);
            const after = performance.now();
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = api.isText ? await response.text() : await response.json();
            const latency = (after - before) / 2;
            const serverTime = api.parse(data);
            const localTime = Date.now();
            
            timeOffset = serverTime - localTime + latency;
            
            syncStatus.textContent = `Offset: ${timeOffset > 0 ? '+' : ''}${timeOffset.toFixed(0)}ms (${api.name})`;
            
            setTimeout(() => {
                syncStatus.textContent = '';
            }, 5000);
            
            return; // Success - exit function
        } catch (error) {
            console.warn(`${api.name} sync failed:`, error);
            // Continue to next API
        }
    }
    
    // All APIs failed
    syncStatus.textContent = 'Sync failed - all sources unavailable';
    console.error('All time sync sources failed');
    setTimeout(() => {
        syncStatus.textContent = '';
    }, 3000);
}

// Toggle between views
const viewToggle = document.getElementById('viewToggle');
const digitalView = document.getElementById('digitalView');
const analogView = document.getElementById('analogView');

viewToggle.addEventListener('click', () => {
    viewToggle.classList.toggle('active');
    digitalView.classList.toggle('active');
    analogView.classList.toggle('active');
});

// Night mode toggle
const nightModeToggle = document.getElementById('nightModeToggle');
nightModeToggle.addEventListener('click', () => {
    nightModeToggle.classList.toggle('active');
    document.body.classList.toggle('night-mode');
});

// Beep mute toggle
const beepMuteToggle = document.getElementById('beepMuteToggle');
beepMuteToggle.addEventListener('click', () => {
    beepMuteToggle.classList.toggle('active');
    beepMuted = !beepMuted;
});

// Sync button
const syncButton = document.getElementById('syncButton');
syncButton.addEventListener('click', syncTime);

// Update clock
function update() {
    const now = new Date(Date.now() + timeOffset);
    
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const ms = now.getMilliseconds();

    // Beep when second resets to 0
    const currentSecond = now.getSeconds();
    if (lastSecond === 59 && currentSecond === 0) {
        beep();
    }
    lastSecond = currentSecond;

    // Update digital clock
    document.getElementById('clock').textContent = h + ":" + m;
    document.getElementById('secs').textContent = s;
    
    // Update date
    document.getElementById('date').textContent = now.toLocaleDateString('en-GB', { 
        day: '2-digit', month: 'short', year: 'numeric' 
    });

    // Update analog info display
    const displayHours = now.getHours() % 12 || 12; // Convert to 12-hour format
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    document.getElementById('analogTime').textContent = `${displayHours}:${m}:${s} ${ampm}`;
    document.getElementById('analogDate').textContent = now.toLocaleDateString('en-US', { 
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
    });
    
    // Update digital view info display (same format as analog)
    document.getElementById('digitalDate').textContent = now.toLocaleDateString('en-US', { 
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
    });
    
    // Get timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = -now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const offsetSign = offset >= 0 ? '+' : '-';
    const offsetString = `UTC${offsetSign}${offsetHours}${offsetMinutes > 0 ? ':' + String(offsetMinutes).padStart(2, '0') : ''}`;
    const timezoneDisplay = `${timezone} (${offsetString})`;
    document.getElementById('analogTimezone').textContent = timezoneDisplay;
    document.getElementById('digitalTimezone').textContent = timezoneDisplay;

    // Update analog clock hands
    const seconds = now.getSeconds() + ms / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = now.getHours() % 12 + minutes / 60;

    document.getElementById('secondHand').style.transform = `translateX(-50%) rotate(${seconds * 6}deg)`;
    document.getElementById('minuteHand').style.transform = `translateX(-50%) rotate(${minutes * 6}deg)`;
    document.getElementById('hourHand').style.transform = `translateX(-50%) rotate(${hours * 30}deg)`;

    // Update progress bar
    const progress = ((now.getSeconds() + ms / 1000) / 60) * 100;
    document.getElementById('progress').style.width = progress + "%";

    requestAnimationFrame(update);
}

// Initialize
initializeAnalogWatch();
requestAnimationFrame(update);