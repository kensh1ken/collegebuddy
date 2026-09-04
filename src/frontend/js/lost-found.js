const API = window.CollegeBuddyAPI.baseUrl;

const container =
    document.getElementById("reportsContainer");


// ============================
// GET ALL REPORTS
// ============================

async function loadReports() {

    try {

        container.innerHTML = `
            <div class="loading">
                Loading reports...
            </div>
        `;


        const response = await fetch(
            `${API}/lost-found`,
            {
                credentials: "include"
            }
        );


        const data = await response.json();

        console.log("Reports:", data);


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to fetch reports"
            );

        }


        displayReports(data.reports);

    } catch (err) {

        console.error(err);

        container.innerHTML = `
            <div class="error">
                ${err.message}
            </div>
        `;

    }

}


// ============================
// DISPLAY REPORTS
// ============================

function displayReports(reports) {

    container.innerHTML = "";


    if (!reports || reports.length === 0) {

        container.innerHTML = `
            <div class="empty">
                <h3>No reports found</h3>

                <p>
                    There are currently no lost or found reports.
                </p>
            </div>
        `;

        return;
    }


    reports.forEach(report => {

        const card =
            document.createElement("div");

        card.className = "report-card";


        // Convert type to lowercase
        const type =
            report.type.toLowerCase();


        const isLost =
            type === "lost";


        // Red for lost
        // Green for found
        const statusClass =
            isLost
                ? "lost"
                : "found";


        const statusText =
            isLost
                ? "LOST"
                : "FOUND";


        // Image
        let imageHTML = "";

        if (report.imageUrl) {

            imageHTML = `
                <img
                    src="${report.imageUrl}"
                    alt="${report.title}"
                    class="report-image"
                >
            `;

        } else {

            imageHTML = `
                <div class="no-image">
                    📦
                </div>
            `;

        }


        card.innerHTML = `

            ${imageHTML}


            <div class="report-content">

                <div class="report-top">

                    <span
                        class="status ${statusClass}"
                    >
                        ${statusText}
                    </span>

                    <span class="category">
                        ${report.category}
                    </span>

                </div>


                <h2>
                    ${report.title}
                </h2>


                <p class="description">
                    ${report.description}
                </p>


                <div class="location">
                    📍 ${report.location}
                </div>


                <div class="report-footer">

                    <div class="posted-by">

                        ${
                            report.postedBy?.name
                                ? `Posted by ${report.postedBy.name}`
                                : "Posted by User"
                        }

                    </div>


                    <a
                        href="lost-found-details.html?id=${report._id}"
                        class="view-btn"
                    >
                        View
                    </a>

                </div>

            </div>

        `;


        container.appendChild(card);

    });

}


// ============================
// SEARCH / FILTER
// ============================

const searchInput =
    document.getElementById("searchInput");

const typeFilter =
    document.getElementById("typeFilter");


function filterReports() {

    const search =
        searchInput.value.toLowerCase().trim();

    const type =
        typeFilter.value.toLowerCase();


    const cards =
        document.querySelectorAll(
            ".report-card"
        );


    cards.forEach(card => {

        const title =
            card.querySelector("h2")
                ?.textContent
                .toLowerCase() || "";


        const description =
            card.querySelector(".description")
                ?.textContent
                .toLowerCase() || "";


        const status =
            card.querySelector(".status")
                ?.textContent
                .toLowerCase() || "";


        const matchesSearch =
            title.includes(search) ||
            description.includes(search);


        const matchesType =
            !type ||
            status.includes(type);


        if (
            matchesSearch &&
            matchesType
        ) {

            card.style.display = "";

        } else {

            card.style.display = "none";

        }

    });

}


if (searchInput) {

    searchInput.addEventListener(
        "input",
        filterReports
    );

}


if (typeFilter) {

    typeFilter.addEventListener(
        "change",
        filterReports
    );

}


// ============================
// LOAD
// ============================

loadReports();
