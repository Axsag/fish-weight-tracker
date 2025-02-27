const form = document.getElementById('input-form');
const fishCountInput = document.getElementById('fish-count');
const weightInput = document.getElementById('total-weight');

let dataPoints = [];  // Store the input data

// Handle form submission
form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fishCount = Number(fishCountInput.value);
    const totalWeight = Number(weightInput.value);

    if (fishCount > 0 && totalWeight > 0) {
        dataPoints.push({ fishCount, totalWeight });
        updateChart();
        form.reset();
    } else {
        alert("Please enter positive numbers!");
    }
});

// Initialize Chart.js
const ctx = document.getElementById('weight-chart').getContext('2d');
const weightChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Total Weight (kg)',
            data: [],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2
        }]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Number of Fish'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Total Weight (kg)'
                }
            }
        }
    }
});

// Update the chart with new data
function updateChart() {
    weightChart.data.labels = dataPoints.map(point => point.fishCount);
    weightChart.data.datasets[0].data = dataPoints.map(point => point.totalWeight);
    weightChart.update();
}
