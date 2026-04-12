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

    const play = () => {
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
    };

    // Browsers suspend AudioContext until a user gesture occurs
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(play);
    } else {
        play();
    }
}

// ── Moon Phase ──────────────────────────────────────────────────────────────
// Epoch: known new moon on 6 Jan 2000 at 18:14 UTC
const LUNAR_EPOCH_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const LUNAR_CYCLE_MS = 29.53059 * 24 * 60 * 60 * 1000;

function getMoonPhase(date) {
    const elapsed = ((date.getTime() - LUNAR_EPOCH_MS) % LUNAR_CYCLE_MS + LUNAR_CYCLE_MS) % LUNAR_CYCLE_MS;
    return elapsed / LUNAR_CYCLE_MS; // 0 = new moon, 0.5 = full moon
}

// Returns an SVG string showing the lit/dark portions of the moon
function moonPhaseSVG(phase) {
    const cx = 16, cy = 16, r = 13;
    const rx = Math.abs(r * Math.cos(phase * 2 * Math.PI));

    let litPath;
    if (phase < 0.02 || phase > 0.98) {
        // New moon — all dark
        litPath = '';
    } else if (phase > 0.48 && phase < 0.52) {
        // Full moon — full circle
        litPath = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#e8e4c0"/>`;
    } else if (phase < 0.5) {
        // Waxing: right side lit; terminator ellipse shrinks then flips
        const eSweep = phase < 0.25 ? 0 : 1;
        litPath = `<path d="M${cx},${cy - r} A${r},${r} 0 0 1 ${cx},${cy + r} A${rx},${r} 0 0 ${eSweep} ${cx},${cy - r}Z" fill="#e8e4c0"/>`;
    } else {
        // Waning: left side lit
        const eSweep = phase < 0.75 ? 1 : 0;
        litPath = `<path d="M${cx},${cy - r} A${r},${r} 0 0 0 ${cx},${cy + r} A${rx},${r} 0 0 ${eSweep} ${cx},${cy - r}Z" fill="#e8e4c0"/>`;
    }

    return `<svg width="32" height="32" viewBox="0 0 32 32">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#111"/>
        ${litPath}
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.2"/>
    </svg>`;
}

// ── Leap Year ────────────────────────────────────────────────────────────────
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Returns years since last leap year: 0 = leap year, 1/2/3 = years after
function leapCyclePosition(year) {
    let y = year;
    while (!isLeapYear(y)) y--;
    return year - y; // 0, 1, 2, or 3
}

// SVG scale: four ticks labelled L · 1 · 2 · 3, current position highlighted
function leapCycleSVG(position) {
    const labels = ['L', '1', '2', '3'];
    const xs = [10, 28, 46, 64];
    const cy = 10;

    const line = `<line x1="${xs[0]}" y1="${cy}" x2="${xs[3]}" y2="${cy}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`;

    const marks = labels.map((label, i) => {
        const isCurrent = i === position;
        const fill = isCurrent ? (i === 0 ? '#f0d060' : '#fff') : 'rgba(255,255,255,0.18)';
        const textFill = isCurrent ? (i === 0 ? '#f0d060' : 'rgba(255,255,255,0.8)') : 'rgba(255,255,255,0.25)';
        return `
            <circle cx="${xs[i]}" cy="${cy}" r="${isCurrent ? 5 : 2.5}" fill="${fill}"/>
            <text x="${xs[i]}" y="${cy + 15}" text-anchor="middle"
                fill="${textFill}" font-size="8"
                font-family="-apple-system,BlinkMacSystemFont,sans-serif"
                font-weight="${isCurrent ? 600 : 400}"
                letter-spacing="0">${label}</text>`;
    }).join('');

    return `<svg width="74" height="28" viewBox="0 0 74 28">${line}${marks}</svg>`;
}

// Cache to avoid repainting complications every animation frame
let lastComplicationDay = -1;

function updateComplications(date) {
    const day = date.getDate() + date.getMonth() * 31 + date.getFullYear() * 12 * 31;
    if (day === lastComplicationDay) return;
    lastComplicationDay = day;

    // Moon
    const phase = getMoonPhase(date);
    document.getElementById('moonDisplay').innerHTML = moonPhaseSVG(phase);

    // Leap year
    const year = date.getFullYear();
    const leap = isLeapYear(year);
    const leapVal = document.getElementById('leapYearValue');
    const leapLbl = document.getElementById('leapYearLabel');
    leapVal.textContent = year;
    leapLbl.textContent = leap ? 'LEAP' : 'ANNUAL';
    leapVal.classList.toggle('is-leap', leap);
    leapLbl.classList.toggle('is-leap', leap);

    // Cycle scale
    document.getElementById('leapCycleDisplay').innerHTML = leapCycleSVG(leapCyclePosition(year));
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
    // Cloudflare first as it's fastest and most reliable
    const timeAPIs = [
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
            isText: true,
            timeout: 5000
        },
        {
            name: 'TimeAPI',
            url: `https://timeapi.io/api/time/current/zone?timeZone=${encodeURIComponent(userTimezone)}`,
            parse: (data) => new Date(data.dateTime).getTime(),
            isText: false,
            timeout: 5000
        }
    ];
    
    for (const api of timeAPIs) {
        try {
            const before = performance.now();
            
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), api.timeout);
            
            const response = await fetch(api.url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
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
            console.warn(`${api.name} sync failed:`, error.name === 'AbortError' ? 'timeout' : error);
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

    // Update complications (moon phase + leap year) — throttled to once per day
    updateComplications(now);

    requestAnimationFrame(update);
}

// Initialize
initializeAnalogWatch();
requestAnimationFrame(update);