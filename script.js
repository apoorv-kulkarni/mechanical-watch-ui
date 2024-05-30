function createIndices() {
    const indicesContainer = document.querySelector('.indices');
    const numeralsContainer = document.querySelector('.numerals');
    const numeralPositions = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    for (let i = 0; i < 60; i++) {
        const indice = document.createElement('div');
        indice.classList.add(i % 5 === 0 ? 'indice' : 'beat');
        indice.style.transform = `rotate(${i * 6}deg) translateY(-145px)`;
        indicesContainer.appendChild(indice);
    }

    numeralPositions.forEach((num, index) => {
        const numeral = document.createElement('div');
        numeral.classList.add('numeral');
        numeral.textContent = num;
        const angle = (index) * 30;
        const radius = 120; // Adjust this value to position numerals correctly
        const x = radius * Math.cos((angle - 90) * (Math.PI / 180));
        const y = radius * Math.sin((angle - 90) * (Math.PI / 180));
        numeral.style.transform = `translate(${x}px, ${y}px)`;
        numeralsContainer.appendChild(numeral);
    });
}

function updateClock() {
    const now = new Date();

    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();
    const totalSeconds = seconds + (milliseconds / 1000);

    const minutes = now.getMinutes();
    const totalMinutes = minutes + (totalSeconds / 60);

    const hours = now.getHours();
    const totalHours = hours + (totalMinutes / 60);

    // Calculate the degrees for each hand considering the desired positions of the numerals
    const secondDegrees = (totalSeconds / 60) * 360;
    const minuteDegrees = (totalMinutes / 60) * 360;
    const hourDegrees = (totalHours % 12) * (360 / 12);

    document.getElementById('second-hand').style.transform = `rotate(${secondDegrees}deg)`;
    document.getElementById('minute-hand').style.transform = `rotate(${minuteDegrees}deg)`;
    document.getElementById('hour-hand').style.transform = `rotate(${hourDegrees}deg)`;

    updateDateTime(now);
}

function setInitialClock() {
    const now = new Date();
    const secondsDegrees = ((now.getSeconds() / 60) * 360) + 90;
    const minutesDegrees = ((now.getMinutes() / 60) * 360) + 90;
    const hoursDegrees = ((now.getHours() / 12) * 360) + 90;

    document.getElementById('second-hand').style.transform = `rotate(${secondsDegrees}deg)`;
    document.getElementById('minute-hand').style.transform = `rotate(${minutesDegrees}deg)`;
    document.getElementById('hour-hand').style.transform = `rotate(${hoursDegrees}deg)`;
}

function updateDateTime(now) {
    const dateTimeElement = document.getElementById('datetime');
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    
    const dateString = now.toLocaleDateString(undefined, dateOptions);
    const timeString = now.toLocaleTimeString(undefined, timeOptions);
    
    dateTimeElement.innerHTML = `${dateString} ${timeString}`;
}

setInterval(updateClock, 125); // 125 ms interval to simulate 8 ticks per second
updateClock();
createIndices();
setInitialClock();
