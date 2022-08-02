'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerworkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let map;
let mapEvent;
const resetInput = () => {
  inputType.value = 'running';
  inputDistance.value = '';
  inputDuration.value = '';
  inputCadence.value = '';
  inputElevation.value = '';
};
class workout {
  constructor(type, coords, distance, duration) {
    const date = new Date();
    this.date = date;
    this.id = this.date.getTime().toString();
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.type = type;
  }
}
class Running extends workout {
  constructor(coords, distance, duration, cadence) {
    super('running', coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
  }
}
class Cycling extends workout {
  constructor(coords, distance, duration, elevationGain) {
    super('cycling', coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}
class App {
  constructor() {
    this._workouts = this._getLocalStorage() || [];
    this._getPosition();
    if (this._workouts.length) {
      this._workouts.forEach(workout => {
        this._renderWorkout({ ...workout, date: new Date(workout.date) });
      });
    }

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('click', this._toggleElevationField);
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        () => {
          alert('a');
        },
        { timeout: 10000 }
      );
    }
  }
  _showForm(mapE) {
    form.classList.remove('hidden');
    inputDistance.focus();
    this._mapEvent = mapE;
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coordinate = [latitude, longitude];
    this._map = L.map('map').setView(coordinate, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);

    L.marker(coordinate)
      .addTo(this._map)
      .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
      .openPopup();

    this._map.on('click', this._showForm.bind(this));
    this._workouts.forEach(workout => {
      this._renderMarker({ ...workout, date: new Date(workout.date) });
    });
  }

  _toggleElevationField(e) {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    const validForm = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allPositiveNumbers = (...inputs) => inputs.every(input => input > 0);
    e.preventDefault();
    const { lat, lng } = this._mapEvent.latlng;
    const coords = [lat, lng];
    //Get Data From Form

    //Check if data field

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validForm(distance, duration, cadence) ||
        !allPositiveNumbers(distance, duration, cadence)
      )
        return alert('input positive number');

      workout = new Running(coords, distance, duration, cadence);
    }
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validForm(distance, duration, elevation) ||
        !allPositiveNumbers(distance, duration, elevation)
      )
        return alert('input positive number');

      workout = new Cycling(coords, distance, duration, elevation);
    }
    this._workouts.push(workout);

    //Display Marker
    this._renderMarker.call(this, workout);
    this._renderWorkout(workout);
    resetInput();
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);

    this._setLocalStorage();
  }
  _renderMarker(workout) {
    L.marker(workout.coords)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          maxSize: 250,
          minSize: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
          workout.type[0].toUpperCase() + workout.type.slice(1)
        } on ${months[workout.date.getMonth()]} ${workout.date.getDate()}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    const month = months[workout.date.getMonth()];
    const template = `
    <li class="workout workout--${workout.type}" data-id=${workout.id}>
    <h2 class="workout__title">${
      workout.type[0].toUpperCase() + workout.type.slice(1)
    } on ${month} ${workout.date.getDate()}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    ${
      workout.type === 'running'
        ? `<div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.pace.toFixed(1)}</span>
    <span class="workout__unit">min/km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">🦶🏼</span>
    <span class="workout__value">${workout.cadence}</span>
    <span class="workout__unit">spm</span>
  </div>`
        : ` <div class="workout__details">
  <span class="workout__icon">⚡️</span>
  <span class="workout__value">${workout.speed}</span>
  <span class="workout__unit">km/h</span>
</div>
<div class="workout__details">
  <span class="workout__icon">⛰</span>
  <span class="workout__value">${workout.elevationGain.toFixed(1)}</span>
  <span class="workout__unit">m</span>
</div>  `
    }
  </li>
  `;

    form.insertAdjacentHTML('afterend', template);
  }
  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this._workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));

    return data;
  }
}

new App();
