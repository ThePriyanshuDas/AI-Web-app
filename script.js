document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results');
    const suggestionsContainer = document.getElementById('suggestions');
    const resultsWrapper = document.getElementById('results-container');
    
    // Debounce function to limit API calls
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    // Fetch search suggestions
    const fetchSuggestions = debounce(async function(query) {
        if (!query.trim()) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        try {
            const response = await fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`);
            const data = await response.json();
            
            suggestionsContainer.innerHTML = '';
            if (data[1] && data[1].length > 0) {
                data[1].forEach(suggestion => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'suggestion-item';
                    suggestionItem.textContent = suggestion;
                    suggestionItem.addEventListener('click', () => {
                        searchInput.value = suggestion;
                        suggestionsContainer.style.display = 'none';
                        performSearch(suggestion);
                    });
                    suggestionsContainer.appendChild(suggestionItem);
                });
                suggestionsContainer.style.display = 'block';
            } else {
                suggestionsContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            suggestionsContainer.style.display = 'none';
        }
    }, 300);
    
    // Perform search
    async function performSearch(query) {
        if (!query.trim()) return;
        
        // Show loading state
        resultsWrapper.innerHTML = '<div class="loading"><div class="spinner"></div><p>Searching...</p></div>';
        
        try {
            // Using DuckDuckGo's API - note that this is a simplified approach
            // In a production app, you might want to use a more robust search API
            const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
            const data = await response.json();
            
            displayResults(data.RelatedTopics.concat(data.Results));
        } catch (error) {
            console.error('Error fetching search results:', error);
            resultsWrapper.innerHTML = '<div class="error">Failed to load search results. Please try again.</div>';
        }
    }
    
    // Display results
    function displayResults(results) {
        if (!results || results.length === 0) {
            resultsWrapper.innerHTML = '<div class="no-results">No results found. Try a different search term.</div>';
            return;
        }
        
        let html = '';
        
        results.forEach(result => {
            // Handle both RelatedTopics and Results format from DuckDuckGo
            const item = result.Topics ? result.Topics[0] : result;
            if (!item) return;
            
            const title = item.Text || item.FirstURL?.split('/').pop().replace(/_/g, ' ');
            const url = item.FirstURL || '';
            const description = item.Result || item.Text || '';
            
            if (title && url) {
                html += `
                    <div class="result-item">
                        <a href="${url}" class="result-title" target="_blank" rel="noopener noreferrer">${title}</a>
                        <span class="result-url">${new URL(url).hostname}</span>
                        <p class="result-snippet">${description}</p>
                    </div>
                `;
            }
        });
        
        resultsWrapper.innerHTML = `<div class="results" id="results">${html}</div>`;
    }
    
    // Event listeners
    searchInput.addEventListener('input', () => {
        fetchSuggestions(searchInput.value);
    });
    
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        suggestionsContainer.style.display = 'none';
        performSearch(searchInput.value);
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Load some default content or recent searches if you want
    // performSearch('latest technology news');
});