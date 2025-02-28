// Supabase Setup
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://eoqyfcwotcptlddyztqr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvcXlmY3dvdGNwdGxkZHl6dHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjcwNDEsImV4cCI6MjA1NjI0MzA0MX0.k6mgCB7lKUssbfbZXbUzaH2PM2jgdvzJFuB-M0bmQJg';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get Form Elements
const form = document.querySelector('#input-form form');
const fishCountInput = document.getElementById('fish-count');
const weightInput = document.getElementById('total-weight');
const openFormButton = document.getElementById('open-form');
const closeFormButton = document.getElementById('close-form');

// Basic Chart Setup
const ctx = document.getElementById('weight-chart').getContext('2d');
let weightChart = new Chart(ctx, {
    type: 'boxplot',
    data: {
        labels: [],
        datasets: [{
            label: 'Total Weight per Legendary Fish Count',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            data: []
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Number of Legendary Fish'
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


// Fetch data from Supabase and update chart
function calculateStatistics(numbers) {
    numbers.sort((a, b) => a - b);

    const min = numbers[0];
    const max = numbers[numbers.length - 1];
    const q1 = numbers[Math.floor(numbers.length * 0.25)];
    const median = numbers[Math.floor(numbers.length * 0.5)];
    const q3 = numbers[Math.floor(numbers.length * 0.75)];

    return [min, q1, median, q3, max];
}

// Fetch data from Supabase and update chart
async function fetchData() {
    const { data, error } = await supabase
        .from('fish_data')
        .select('*')
        .order('fish_count', { ascending: true });

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    // Group data by fish_count
    const groupedData = {};
    data.forEach(row => {
        if (!groupedData[row.fish_count]) {
            groupedData[row.fish_count] = [];
        }
        groupedData[row.fish_count].push(row.total_weight);
    });

    // Calculate statistics for each group
    const labels = [];
    const boxplotData = [];
    for (const fishCount in groupedData) {
        const weights = groupedData[fishCount];
        labels.push(fishCount);
        boxplotData.push(calculateStatistics(weights));
    }

    console.log(boxplotData);

    // Update chart data
    weightChart.data.labels = labels;
    weightChart.data.datasets[0].data = boxplotData;
    weightChart.update();
}

// Store input data in Supabase
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fishCount = Number(fishCountInput.value);
    const totalWeight = Number(weightInput.value);

    // Check if it's a legendary fish submission
    const isLegendary = fishCount === 1 && totalWeight > 100;

    // Check Local Storage if a legendary fish has already been submitted
    if (isLegendary) {
        const legendarySubmitted = localStorage.getItem('legendarySubmitted');
        if (legendarySubmitted) {
            alert("You have already submitted a count for a legendary fish!");
            return;
        }
    }

    // Input validation
    if (!Number.isInteger(fishCount) || fishCount < 1 || fishCount > 100) {
        alert("Please enter a valid number of legendary fish (1-100)!");
        return;
    }

    if (isNaN(totalWeight) || totalWeight <= 0 || totalWeight > 50000) {
        alert("Please enter a valid total weight (0.1 - 500000 kg)!");
        return;
    }

    // Store in Supabase
    const { error } = await supabase
        .from('fish_data')
        .insert([{ fish_count: fishCount, total_weight: totalWeight }]);

    if (error) {
        console.error('Error inserting data:', error);
        alert("An error occurred while saving the data. Please try again.");
        return;
    }

    // If the submission was for a legendary fish, set the flag in local storage
    if (isLegendary) {
        localStorage.setItem('legendarySubmitted', 'true');
    }

    // Fetch the latest data and update chart
    fetchData();
    form.reset();
    toggleForm(false);
});
function calculateNextLegendaryWeights(data) {
    const nextTargets = {};
    const increment = 0.1;

    // Group by fish count and find max weight for each count
    data.forEach(row => {
        const count = row.fish_count;
        const weight = row.total_weight;

        if (!nextTargets[count] || weight > nextTargets[count]) {
            nextTargets[count] = weight;
        }
    });

    // Increment each max weight for the next target
    for (let count in nextTargets) {
        nextTargets[count] = (nextTargets[count] + increment).toFixed(1);
    }

    // Display the table
    updateLegendaryTable(nextTargets);
}

function updateLegendaryTable(nextTargets) {
    const tbody = document.querySelector('#legendary-table tbody');
    tbody.innerHTML = '';

    // Sort by fish count
    const sortedCounts = Object.keys(nextTargets).sort((a, b) => a - b);

    sortedCounts.forEach(count => {
        const row = document.createElement('tr');
        const countCell = document.createElement('td');
        const weightCell = document.createElement('td');

        countCell.textContent = count;
        weightCell.textContent = nextTargets[count];

        row.appendChild(countCell);
        row.appendChild(weightCell);
        tbody.appendChild(row);
    });
}

// Toggle Form Visibility
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

// Event Listeners for Form Toggle
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
