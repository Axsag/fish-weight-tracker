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

// Supabase Setup
const SUPABASE_URL = 'https://eoqyfcwotcptlddyztqr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvcXlmY3dvdGNwdGxkZHl6dHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjcwNDEsImV4cCI6MjA1NjI0MzA0MX0.k6mgCB7lKUssbfbZXbUzaH2PM2jgdvzJFuB-M0bmQJg';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch data from Supabase and update chart
async function fetchData() {
    const { data, error } = await supabase
        .from('fish_data')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    dataPoints = data.map(row => ({
        fishCount: row.fish_count,
        totalWeight: row.total_weight
    }));
    updateChart();
}

// Store input data in Supabase
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fishCount = Number(fishCountInput.value);
    const totalWeight = Number(weightInput.value);

    if (fishCount > 0 && totalWeight > 0) {
        const { error } = await supabase
            .from('fish_data')
            .insert([{ fish_count: fishCount, total_weight: totalWeight }]);

        if (error) {
            console.error('Error inserting data:', error);
            return;
        }

        fetchData();
        form.reset();
    } else {
        alert("Please enter positive numbers!");
    }
});

// Initial data load
fetchData();
