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
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Total Weight per Fish Count',
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

    // Prepare data for chart
    const labels = data.map(row => row.fish_count);
    const weights = data.map(row => row.total_weight);

    weightChart.data.labels = labels;
    weightChart.data.datasets[0].data = weights;
    weightChart.update();
}

// Store input data in Supabase
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fishCount = Number(fishCountInput.value);
    const totalWeight = Number(weightInput.value);

    if (fishCount > 0 && totalWeight > 0) {
        // Store in Supabase
        const { error } = await supabase
            .from('fish_data')
            .insert([{ fish_count: fishCount, total_weight: totalWeight }]);

        if (error) {
            console.error('Error inserting data:', error);
            return;
        }

        // Fetch the latest data and update chart
        fetchData();
        form.reset();
        toggleForm(false);
    } else {
        alert("Please enter positive numbers!");
    }
});

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
