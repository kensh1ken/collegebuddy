const API = window.CollegeBuddyAPI.baseUrl;

const container =
    document.getElementById("reportContainer");


// ============================
// GET ID FROM URL
// ============================

const params =
    new URLSearchParams(window.location.search);

const reportId =
    params.get("id");


if (!reportId) {

    container.innerHTML = `
        <div class="error">
            Report ID not found.
        </div>
    `;

} else {

    loadReport();

}


// ============================
// LOAD REPORT
// ============================

async function loadReport() {

    try {

        const response = await fetch(
            `${API}/lost-found/${reportId}`,
            {
                credentials: "include"
            }
        );


        const data =
            await response.json();


        console.log("Report:", data);


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to fetch report"
            );

        }


        displayReport(data.report);


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
// DISPLAY REPORT
// ============================

function displayReport(report) {

    const isLost =
        report.type.toLowerCase() === "lost";


    const statusClass =
        isLost ? "lost" : "found";


    const statusText =
        isLost ? "LOST ITEM" : "FOUND ITEM";


    let imageHTML;


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


    container.innerHTML = `

        ${imageHTML}


        <div class="report-content">

            <span
                class="status ${statusClass}"
            >
                ${statusText}
            </span>


            <h1>
                ${report.title}
            </h1>


            <p class="description">
                ${
                    report.description ||
                    "No description provided."
                }
            </p>


            <div class="details">

                <div class="detail">

                    <div class="detail-label">
                        Category
                    </div>

                    <div class="detail-value">
                        ${report.category}
                    </div>

                </div>


                <div class="detail">

                    <div class="detail-label">
                        Location
                    </div>

                    <div class="detail-value">
                        📍 ${report.location}
                    </div>

                </div>


                <div class="detail">

                    <div class="detail-label">
                        Report Type
                    </div>

                    <div class="detail-value">
                        ${report.type}
                    </div>

                </div>


                <div class="detail">

                    <div class="detail-label">
                        Reported On
                    </div>

                    <div class="detail-value">
                        ${formatDate(report.createdAt)}
                    </div>

                </div>

            </div>


            <div class="posted-by">

                <h3>
                    Posted By
                </h3>

                <p>

                    ${
                        report.postedBy?.name ||
                        "Unknown user"
                    }

                    ${
                        report.postedBy?.email
                            ? ` • ${report.postedBy.email}`
                            : ""
                    }

                </p>

            </div>


            <div class="contact-box">

                <h3>
                    Contact
                </h3>

                <p>
                    If you have information about
                    this item, contact the person
                    who reported it.
                </p>


                <a
                    href="tel:${report.contactNumber}"
                    class="contact-btn"
                >
                    📞 Contact: ${report.contactNumber}
                </a>
                <p></p>

            </div>

        </div>

    `;

}


// ============================
// FORMAT DATE
// ============================

function formatDate(date) {

    if (!date) {
        return "Unknown";
    }

    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}
