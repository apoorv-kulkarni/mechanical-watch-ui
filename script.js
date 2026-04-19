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
let audioContext = null;
try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
    console.warn('Web Audio API not supported:', e);
}
let beepMuted = false;

function beep() {
    if (beepMuted || !audioContext) return;

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
let lastComplicationDay = null;

function updateComplications(date) {
    const day = date.toDateString();
    if (day === lastComplicationDay) return;
    lastComplicationDay = day;

    // Moon
    const phase = getMoonPhase(date);
    els.moonDisplay.innerHTML = moonPhaseSVG(phase);

    // Leap year
    const year = date.getFullYear();
    const leap = isLeapYear(year);
    els.leapYearValue.textContent = year;
    els.leapYearLabel.textContent = leap ? 'LEAP' : 'ANNUAL';
    els.leapYearValue.classList.toggle('is-leap', leap);
    els.leapYearLabel.classList.toggle('is-leap', leap);

    // Cycle scale
    els.leapCycleDisplay.innerHTML = leapCycleSVG(leapCyclePosition(year));
}

// Track last second to detect when it resets
let lastSecond = -1;

// Time offset from sync
let timeOffset = 0;

// Sync time with multiple reliable time sources
async function syncTime() {
    els.syncStatus.textContent = 'Syncing...';
    
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

            els.syncStatus.textContent = `Offset: ${timeOffset > 0 ? '+' : ''}${timeOffset.toFixed(0)}ms (${api.name})`;

            setTimeout(() => {
                els.syncStatus.textContent = '';
            }, 5000);
            
            return; // Success - exit function
        } catch (error) {
            console.warn(`${api.name} sync failed:`, error.name === 'AbortError' ? 'timeout' : error);
            // Continue to next API
        }
    }
    
    // All APIs failed
    els.syncStatus.textContent = 'Sync failed - all sources unavailable';
    console.error('All time sync sources failed');
    setTimeout(() => {
        els.syncStatus.textContent = '';
    }, 3000);
}

// Cached DOM element lookups so the update loop doesn't query every frame
const els = {
    clock: document.getElementById('clock'),
    secs: document.getElementById('secs'),
    centis: document.getElementById('centis'),
    ampm: document.getElementById('ampm'),
    analogTime: document.getElementById('analogTime'),
    analogDate: document.getElementById('analogDate'),
    analogTimezone: document.getElementById('analogTimezone'),
    digitalDate: document.getElementById('digitalDate'),
    digitalTimezone: document.getElementById('digitalTimezone'),
    secondHand: document.getElementById('secondHand'),
    minuteHand: document.getElementById('minuteHand'),
    hourHand: document.getElementById('hourHand'),
    progress: document.getElementById('progress'),
    moonDisplay: document.getElementById('moonDisplay'),
    leapYearValue: document.getElementById('leapYearValue'),
    leapYearLabel: document.getElementById('leapYearLabel'),
    leapCycleDisplay: document.getElementById('leapCycleDisplay'),
    syncStatus: document.getElementById('syncStatus'),
    viewToggle: document.getElementById('viewToggle'),
    digitalView: document.getElementById('digitalView'),
    analogView: document.getElementById('analogView'),
    nightModeToggle: document.getElementById('nightModeToggle'),
    beepMuteToggle: document.getElementById('beepMuteToggle'),
    syncButton: document.getElementById('syncButton'),
    gmtSelect: document.getElementById('gmtSelect'),
    gmtHand: document.getElementById('gmtHand'),
    gmtLabel: document.getElementById('gmtLabel'),
    gmtRing: document.getElementById('gmtRing'),
};

// Build a 24-hour ring inside the 12-hour numerals: tick every hour,
// labelled numeral every 3 hours. 0 sits at 12 o'clock, 12 at 6 o'clock.
function initializeGmtRing() {
    for (let h = 0; h < 24; h++) {
        const angle = h * 15; // 15° per hour on a 24h dial
        const isMajor = h % 3 === 0;

        const tick = document.createElement('div');
        tick.classList.add('gmt-tick');
        if (isMajor) tick.classList.add('major');
        const tickR = 24;
        const tr = (angle - 90) * (Math.PI / 180);
        tick.style.left = `calc(50% + ${tickR * Math.cos(tr)}%)`;
        tick.style.top = `calc(50% + ${tickR * Math.sin(tr)}%)`;
        tick.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        els.gmtRing.appendChild(tick);

        if (isMajor) {
            const numR = 19;
            const num = document.createElement('div');
            num.classList.add('gmt-numeral');
            num.textContent = String(h).padStart(2, '0');
            num.style.left = `calc(50% + ${numR * Math.cos(tr)}%)`;
            num.style.top = `calc(50% + ${numR * Math.sin(tr)}%)`;
            els.gmtRing.appendChild(num);
        }
    }
}

// ── GMT (second timezone) ──────────────────────────────────────────────────
let gmtZone = '';

function populateGmtZones() {
    const zones = typeof Intl.supportedValuesOf === 'function'
        ? Intl.supportedValuesOf('timeZone')
        : [];
    for (const zone of zones) {
        const opt = document.createElement('option');
        opt.value = zone;
        opt.textContent = zone.replace(/_/g, ' ');
        els.gmtSelect.appendChild(opt);
    }
}

// Returns hours as a float (e.g. 14.5 for 14:30) in the given IANA zone
function getZoneHours(zone, date) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);
    const get = (t) => +parts.find(p => p.type === t).value;
    return get('hour') + get('minute') / 60 + get('second') / 3600;
}

function applyGmtZone(zone) {
    gmtZone = zone || '';
    const active = !!gmtZone;
    els.gmtHand.classList.toggle('active', active);
    els.gmtLabel.classList.toggle('active', active);
    els.gmtRing.classList.toggle('active', active);
}

// Restore persisted UI state before wiring toggles
function applyStoredState() {
    if (localStorage.getItem('nightMode') === 'true') {
        els.nightModeToggle.classList.add('active');
        document.body.classList.add('night-mode');
    }
    if (localStorage.getItem('beepMuted') === 'true') {
        beepMuted = true;
        els.beepMuteToggle.classList.add('active');
    }
    if (localStorage.getItem('digitalView') === 'true') {
        els.viewToggle.classList.add('active');
        els.digitalView.classList.add('active');
        els.analogView.classList.remove('active');
    }
    const storedZone = localStorage.getItem('gmtZone') || '';
    if (storedZone) {
        els.gmtSelect.value = storedZone;
        applyGmtZone(storedZone);
    }
}

// Toggle between views
els.viewToggle.addEventListener('click', () => {
    els.viewToggle.classList.toggle('active');
    els.digitalView.classList.toggle('active');
    els.analogView.classList.toggle('active');
    localStorage.setItem('digitalView', els.digitalView.classList.contains('active'));
});

// Night mode toggle
els.nightModeToggle.addEventListener('click', () => {
    els.nightModeToggle.classList.toggle('active');
    document.body.classList.toggle('night-mode');
    localStorage.setItem('nightMode', document.body.classList.contains('night-mode'));
});

// Beep mute toggle
els.beepMuteToggle.addEventListener('click', () => {
    els.beepMuteToggle.classList.toggle('active');
    beepMuted = !beepMuted;
    localStorage.setItem('beepMuted', beepMuted);
});

// Sync button
els.syncButton.addEventListener('click', syncTime);

// GMT zone picker
els.gmtSelect.addEventListener('change', (e) => {
    const zone = e.target.value;
    applyGmtZone(zone);
    localStorage.setItem('gmtZone', zone);
});

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

    const period = now.getHours() >= 12 ? 'PM' : 'AM';

    // Update digital clock
    els.clock.textContent = h + ":" + m;
    els.secs.textContent = s;
    const cs = String(Math.floor(ms / 10)).padStart(2, '0');
    els.centis.textContent = "." + cs;
    els.ampm.textContent = period;

    // Update analog info display
    const displayHours = now.getHours() % 12 || 12; // Convert to 12-hour format
    els.analogTime.textContent = `${displayHours}:${m}:${s}.${cs} ${period}`;
    const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
    });
    els.analogDate.textContent = dateStr;
    els.digitalDate.textContent = dateStr;

    // Get timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = -now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const offsetSign = offset >= 0 ? '+' : '-';
    const offsetString = `UTC${offsetSign}${offsetHours}${offsetMinutes > 0 ? ':' + String(offsetMinutes).padStart(2, '0') : ''}`;
    const timezoneDisplay = `${timezone} (${offsetString})`;
    els.analogTimezone.textContent = timezoneDisplay;
    els.digitalTimezone.textContent = timezoneDisplay;

    // Update analog clock hands
    const seconds = now.getSeconds() + ms / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = now.getHours() % 12 + minutes / 60;

    els.secondHand.style.transform = `translateX(-50%) rotate(${seconds * 6}deg)`;
    els.minuteHand.style.transform = `translateX(-50%) rotate(${minutes * 6}deg)`;
    els.hourHand.style.transform = `translateX(-50%) rotate(${hours * 30}deg)`;

    // GMT hand on 24-hour scale (15° per hour)
    if (gmtZone) {
        const gmtHours = getZoneHours(gmtZone, now);
        els.gmtHand.style.transform = `translateX(-50%) rotate(${gmtHours * 15}deg)`;
        const gH = Math.floor(gmtHours);
        const gM = Math.floor((gmtHours - gH) * 60);
        const label = gmtZone.split('/').pop().replace(/_/g, ' ');
        els.gmtLabel.textContent = `${label} · ${String(gH).padStart(2, '0')}:${String(gM).padStart(2, '0')}`;
    }

    // Update progress bar
    const progress = ((now.getSeconds() + ms / 1000) / 60) * 100;
    els.progress.style.width = progress + "%";

    // Update complications (moon phase + leap year) — throttled to once per day
    updateComplications(now);

    requestAnimationFrame(update);
}

// Initialize
populateGmtZones();
applyStoredState();
initializeAnalogWatch();
initializeGmtRing();
requestAnimationFrame(update);