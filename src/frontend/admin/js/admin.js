const API = window.CollegeBuddyAPI.baseUrl;


// ============================
// LOAD USERS
// ============================

async function loadUsers() {

    try {

        const response = await fetch(
            `${API}/admin/users`,
            {
                credentials: "include"
            }
        );


        const data = await response.json();


        if (!response.ok) {
            throw new Error(
                data.message || "Failed to fetch users"
            );
        }


        const users = data.users || [];


        document.getElementById(
            "totalUsers"
        ).textContent = users.length;


        const blocked =
            users.filter(
                user => user.isBlocked
            ).length;


        document.getElementById(
            "blockedUsers"
        ).textContent = blocked;


    } catch (err) {

        console.error("Users:", err);

        document.getElementById(
            "totalUsers"
        ).textContent = "-";

        document.getElementById(
            "blockedUsers"
        ).textContent = "-";

    }

}


// ============================
// LOAD EVENTS
// ============================

async function loadEvents() {

    const container =
        document.getElementById(
            "eventsContainer"
        );


    try {

        const response = await fetch(
            `${API}/events`,
            {
                credentials: "include"
            }
        );


        const data = await response.json();


        if (!response.ok) {
            throw new Error(
                data.message || "Failed to fetch events"
            );
        }


        const events =
            data.events || [];


        document.getElementById(
            "totalEvents"
        ).textContent = events.length;


        displayRecentEvents(events);


    } catch (err) {

        console.error("Events:", err);

        document.getElementById(
            "totalEvents"
        ).textContent = "-";


        container.innerHTML = `
            <div class="error">
                Failed to load events.
            </div>
        `;

    }

}


// ============================
// DISPLAY RECENT EVENTS
// ============================

function displayRecentEvents(events) {

    const container =
        document.getElementById(
            "eventsContainer"
        );


    if (events.length === 0) {

        container.innerHTML = `
            <div class="empty">
                No events have been created yet.
            </div>
        `;

        return;
    }


    // Show latest 5
    const recentEvents =
        events.slice(0, 5);


    container.innerHTML = "";


    recentEvents.forEach(event => {

        const row =
            document.createElement("div");

        row.className = "event-row";


        row.innerHTML = `

            <div class="event-info">

                <h3>
                    ${event.title}
                </h3>

                <p>
                    ${
                        event.organizer ||
                        "No organizer"
                    }
                    •
                    ${
                        event.eventDate
                            ? formatDate(event.eventDate)
                            : "Date not set"
                    }
                </p>

            </div>


            <span class="event-type">

                ${
                    event.type ||
                    "event"
                }

            </span>

        `;


        container.appendChild(row);

    });

}


// ============================
// FORMAT DATE
// ============================

function formatDate(date) {

    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


// ============================
// INITIAL LOAD
// ============================

loadUsers();
loadEvents();
