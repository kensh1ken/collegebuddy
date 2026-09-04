const API = window.CollegeBuddyAPI.baseUrl;


// =============================
// GET CURRENT USER
// =============================

async function loadUser() {

    try {

        const response = await fetch(
            `${API}/users/me`,
            {
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            window.location.href = "login.html";
            return;
        }

        document.getElementById("userName").textContent =
            data.user.name;

        // If profile somehow isn't complete
        if (!data.profileCompleted) {
            window.location.href = "complete-profile.html";
        }

    } catch (err) {

        console.log(err);

    }
}


// =============================
// GET RECENT RESOURCES
// =============================

async function loadResources() {

    try {

        const response = await fetch(
            `${API}/resources`,
            {
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        const container =
            document.getElementById("resourcesContainer");

        container.innerHTML = "";

        const resources =
            data.resources.slice(0, 5);

        if (resources.length === 0) {

            container.innerHTML =
                `<div class="loading">
                    No resources available.
                </div>`;

            return;
        }

        resources.forEach(resource => {

            const card =
                document.createElement("div");

            card.className = "resource-card";

            const typeClass =
                resource.resourceType === "file"
                    ? "file-type"
                    : "link-type";

            card.innerHTML = `
                <div>
                    <div class="resource-title">
                        ${resource.title}
                    </div>

                    <div class="resource-meta">
                        ${resource.courseId}
                        • Semester ${resource.semester}
                    </div>
                </div>

                <span class="resource-type ${typeClass}">
                    ${resource.resourceType}
                </span>
            `;

            container.appendChild(card);

        });

    } catch (err) {

        console.log(err);

    }
}

// async function loadEvents() {
//     try {
//         const response = await fetch(
//             `${API}/events`,
//             {
//                 credentials: "include"
//             }
//         );
//         const data = await response.json();
//         if (!response.ok) {
//             throw new Error(data.message);
//         }
//         const container = document.getElementById("eventsContainer");
//     }catch(err) {
//         return res.status(500).json({
//             message: err.message
//         });
//     }
// }



const homeEventsContainer =
    document.getElementById(
        "homeEventsContainer"
    );


// ============================
// LOAD UPCOMING EVENTS
// ============================

async function loadUpcomingEvents() {

    try {

        const response = await fetch(
            `${API}/events`
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load events"
            );

        }


        let events =
            data.events || [];


        // Only future events
        const now = new Date();


        events = events.filter(event => {

            if (!event.eventDate) {
                return false;
            }

            return new Date(event.eventDate) >= now;

        });


        // Sort nearest event first
        events.sort((a, b) => {

            return (
                new Date(a.eventDate) -
                new Date(b.eventDate)
            );

        });


        // Only show first 3
        events =
            events.slice(0, 3);


        displayUpcomingEvents(events);


    } catch (err) {

        console.error(err);

        homeEventsContainer.innerHTML = `
            <div class="home-error">
                Failed to load upcoming events.
            </div>
        `;

    }

}


// ============================
// DISPLAY
// ============================

function displayUpcomingEvents(events) {

    if (events.length === 0) {

        homeEventsContainer.innerHTML = `
            <div class="home-empty">
                No upcoming events at the moment.
            </div>
        `;

        return;
    }


    homeEventsContainer.innerHTML = "";


    events.forEach(event => {

        const card =
            document.createElement("article");


        card.className =
            "home-event-card";


        let imageHTML;


        if (event.imageUrl) {

            imageHTML = `
                <img
                    src="${escapeHTML(
                        event.imageUrl
                    )}"
                    alt="${escapeHTML(
                        event.title
                    )}"
                    class="home-event-image"
                >
            `;

        } else {

            imageHTML = `
                <div class="home-event-no-image">
                    📅
                </div>
            `;

        }


        card.innerHTML = `

            ${imageHTML}


            <div class="home-event-content">


                <span class="home-event-type">
                    ${escapeHTML(
                        event.type || "event"
                    )}
                </span>


                <h3>
                    ${escapeHTML(
                        event.title
                    )}
                </h3>


                <p class="home-event-description">

                    ${escapeHTML(
                        event.description ||
                        "No description available."
                    )}

                </p>


                <div class="home-event-meta">

                    <span>
                        📅
                        ${formatDate(
                            event.eventDate
                        )}
                    </span>


                    ${
                        event.location

                        ? `
                            <span>
                                📍
                                ${escapeHTML(
                                    event.location
                                )}
                            </span>
                        `

                        : ""
                    }

                </div>


                ${
                    event.registrationUrl

                    ? `
                        <a
                            href="${escapeAttribute(
                                event.registrationUrl
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="home-event-btn"
                        >
                            View / Register →
                        </a>
                    `

                    : `
                        <a
                            href="events.html"
                            class="home-event-btn"
                        >
                            View Event →
                        </a>
                    `
                }

            </div>

        `;


        homeEventsContainer.appendChild(card);

    });

}


// ============================
// DATE
// ============================

function formatDate(date) {

    return new Date(date).toLocaleString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


// ============================
// BASIC ESCAPING
// ============================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

    return String(value)
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================
// START
// ============================


// =============================
// GET RECENT LOST & FOUND
// =============================

async function loadLostFound() {

    try {

        const response = await fetch(
            `${API}/lost-found`,
            {
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        const container =
            document.getElementById("lostFoundContainer");

        container.innerHTML = "";

        const reports =
            data.reports.slice(0, 3);

        if (reports.length === 0) {

            container.innerHTML =
                `<div class="loading">
                    No recent reports.
                </div>`;

            return;
        }

        reports.forEach(report => {

            const card =
                document.createElement("div");

            card.className = "lost-card";

            const type =
                report.type.toLowerCase();

            card.innerHTML = `
                <div class="lost-label ${type}">
                    ${report.type.toUpperCase()}
                </div>

                <h3>
                    ${report.title}
                </h3>

                <p>
                    📍 ${report.location}
                </p>
            `;

            container.appendChild(card);

        });

    } catch (err) {

        console.log(err);

    }
}


// =============================
// LOGOUT
// =============================

document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        try {

            await fetch(
                `${API}/api/auth/logout`,
                {
                    method: "POST",
                    credentials: "include"
                }
            );

        } catch (err) {

            console.log(err);

        }

        window.location.href = "login.html";

    });


// =============================
// SEARCH
// =============================

document
    .getElementById("searchBtn")
    .addEventListener("click", () => {

        const search =
            document.getElementById("searchInput").value.trim();

        if (!search) {
            return;
        }

        window.location.href =
            `resources.html?search=${encodeURIComponent(search)}`;

    });


// =============================
// INITIAL LOAD
// =============================

loadUser();
loadResources();
loadLostFound();
loadUpcomingEvents();
