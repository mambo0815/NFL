

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news';
    const newsContainer = document.getElementById('news-container');

    async function fetchNews() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Error fetching news: ${response.statusText}`);
            }

            const data = await response.json();
            displayNews(data.articles);
        } catch (error) {
            console.error(error);
            newsContainer.innerHTML = `<p>Error loading news: ${error.message}</p>`;
        }
    }

    function displayNews(articles) {
        newsContainer.innerHTML = '';
        articles.forEach(article => {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';

            newsItem.innerHTML = `
                <h2>${article.headline}</h2>
                <p>${article.description || 'No description available.'}</p>
                <a href="${article.links.web.href}" target="_blank">Read more</a>
            `;

            newsContainer.appendChild(newsItem);
        });
    }

    fetchNews();
});



