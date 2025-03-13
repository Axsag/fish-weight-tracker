import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://eoqyfcwotcptlddyztqr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvcXlmY3dvdGNwdGxkZHl6dHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjcwNDEsImV4cCI6MjA1NjI0MzA0MX0.k6mgCB7lKUssbfbZXbUzaH2PM2jgdvzJFuB-M0bmQJg';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.querySelector('#input-form form');
const fishCountInput = document.getElementById('fish-count');
const weightInput = document.getElementById('total-weight');
const openFormButton = document.getElementById('open-form');
const closeFormButton = document.getElementById('close-form');

const backgroundZonePlugin = {
    id: 'backgroundZonePlugin',
    beforeDraw(chart) {
        const { ctx, chartArea: { left, right }, scales: { y } } = chart;
        ctx.save();

        const zones = [
            { min: 0, max: 75, color: 'rgba(253, 246, 213, 0.2)' },
            { min: 75, max: 230, color: 'rgba(135, 206, 235, 0.2)' },
            { min: 230, max: 500, color: 'rgba(0, 105, 148, 0.2)' },
            { min: 500, max: y.max, color: 'rgba(0, 51, 102, 0.2)' }
        ];

        zones.forEach(zone => {
            const yMinPixel = y.getPixelForValue(zone.max);
            const yMaxPixel = y.getPixelForValue(zone.min);

            ctx.fillStyle = zone.color;
            ctx.fillRect(left, yMinPixel, right - left, yMaxPixel - yMinPixel);
        });

        ctx.restore();
    }
};

const ctx = document.getElementById('weight-chart').getContext('2d');

let weightChart = new Chart(ctx, {
    type: 'boxplot',
    data: {
        labels: [],
        datasets: [{
            label: 'Total Weight per Fish Count',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            itemRadius: 0,
            medianColor: 'rgb(232,178,8)',
            data: []
        }]
    },
    options: {
        responsive: true,
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
        },
        plugins: {
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                    modifierKey: 'shift',
                },
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'x',
                }
            }
        }
    },
    plugins: [backgroundZonePlugin]
});

function calculateStatistics(numbers) {
    numbers.sort((a, b) => a - b);

    const min = numbers[0];
    const max = numbers[numbers.length - 1];
    const q1 = numbers[Math.floor(numbers.length * 0.25)];
    const median = numbers[Math.floor(numbers.length * 0.5)];
    const q3 = numbers[Math.floor(numbers.length * 0.75)];

    return [min, q1, median, q3, max];
}

async function fetchData() {
    const { data, error } = await supabase
        .from('fish_data')
        .select('*')
        .order('fish_count', { ascending: true });

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    const groupedData = {};
    data.forEach(row => {
        if (!groupedData[row.fish_count]) {
            groupedData[row.fish_count] = [];
        }
        groupedData[row.fish_count].push(row.total_weight);
    });

    const labels = [];
    const boxplotData = [];
    for (const fishCount in groupedData) {
        const weights = groupedData[fishCount];
        labels.push(fishCount);
        boxplotData.push(calculateStatistics(weights));
    }

    weightChart.data.labels = labels;
    weightChart.data.datasets[0].data = boxplotData;
    weightChart.update();
    const medians = [];
    for (const fishCount in groupedData) {
        const weights = groupedData[fishCount];
        const median = calculateMedian(weights);
        medians.push({ fishCount, median });
    }

    updateMedianTable(medians);
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fishCount = Number(fishCountInput.value);
    const totalWeight = Number(weightInput.value);

    const isLegendary = fishCount === 1 && totalWeight > 100;

    if (isLegendary) {
        const legendarySubmitted = localStorage.getItem('legendarySubmitted');
        if (legendarySubmitted) {
            alert("You have already submitted a count for a legendary fish!");
            return;
        }
    }

    if (!Number.isInteger(fishCount) || fishCount < 1 || fishCount > 100) {
        alert("Please enter a valid number of legendary fish (1-100)!");
        return;
    }

    if (isNaN(totalWeight) || totalWeight <= 0 || totalWeight > 50000) {
        alert("Please enter a valid total weight (0.1 - 500000 kg)!");
        return;
    }

    const { error } = await supabase
        .from('fish_data')
        .insert([{ fish_count: fishCount, total_weight: totalWeight }]);

    if (error) {
        console.error('Error inserting data:', error);
        alert("An error occurred while saving the data. Please try again.");
        return;
    }

    if (isLegendary) {
        localStorage.setItem('legendarySubmitted', 'true');
    }

    fetchData();
    form.reset();
    toggleForm(false);
});
// Calculate median for an array
function calculateMedian(arr) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 !== 0) {
        return sorted[mid];
    } else {
        return ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1);
    }
}

// Update the table with median data
function updateMedianTable(medians) {
    const tbody = document.querySelector('#median-table tbody');
    tbody.innerHTML = '';

    // Sort by fish count
    const sortedMedians = medians.sort((a, b) => a.fishCount - b.fishCount);

    sortedMedians.forEach(item => {
        const row = document.createElement('tr');
        row.classList.add('border-b', 'border-gray-700', 'hover:bg-gray-700'); // Row hover effect

        const countCell = document.createElement('td');
        const medianCell = document.createElement('td');

        countCell.classList.add('py-2', 'px-4');
        medianCell.classList.add('py-2', 'px-4');

        countCell.textContent = item.fishCount;
        medianCell.textContent = item.median;

        row.appendChild(countCell);
        row.appendChild(medianCell);
        tbody.appendChild(row);
    });
}


function toggleForm(show) {
    const formContainer = document.getElementById('input-form');
    if (show) {
        formContainer.classList.remove('hidden');
        formContainer.style.display = 'flex'; // Ensure flex display for centering
    } else {
        formContainer.classList.add('hidden');
        formContainer.style.display = 'none'; // Hide when not in use
    }
}

openFormButton.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent click events from bubbling
    toggleForm(true);
});

closeFormButton.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleForm(false);
});

// Initial data load
fetchData();
