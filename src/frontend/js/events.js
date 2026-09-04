const API = window.CollegeBuddyAPI.baseUrl;

const container =
    document.getElementById("eventsContainer");

const searchInput =
    document.getElementById("searchInput");

const typeFilter =
    document.getElementById("typeFilter");


let events = [];


// ============================
// LOAD EVENTS
// ============================

async function loadEvents() {

    try {

        const response = await fetch(
            `${API}/events`
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to fetch events"
            );

        }


        events =
            data.events || [];


        displayEvents(events);


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
// DISPLAY EVENTS
// ============================

function displayEvents(list) {

    if (list.length === 0) {

        container.innerHTML = `
            <div class="empty">
                No events found.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    list.forEach(event => {

        const card =
            document.createElement("article");


        card.className =
            "event-card";


        let imageHTML;


        if (event.imageUrl) {

            imageHTML = `
                <img
                    src="${event.imageUrl}"
                    alt="${escapeHTML(event.title)}"
                    class="event-image"
                >
            `;

        } else {

            imageHTML = `
                <div class="no-image">
                    📅
                </div>
            `;

        }


        card.innerHTML = `

            ${imageHTML}


            <div class="event-content">


                <span class="event-type">
                    ${escapeHTML(event.type || "event")}
                </span>


                <h2>
                    ${escapeHTML(event.title)}
                </h2>


                <p class="event-description">

                    ${
                        escapeHTML(
                            event.description ||
                            "No description available."
                        )
                    }

                </p>


                <div class="event-meta">

                    <span>
                        📅
                        ${
                            event.eventDate
                                ? formatDate(event.eventDate)
                                : "Date not specified"
                        }
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


                    ${
                        event.organizer

                        ? `
                            <span>
                                👤
                                ${escapeHTML(
                                    event.organizer
                                )}
                            </span>
                        `

                        : ""
                    }


                    ${
                        event.registrationDeadline

                        ? `
                            <span>
                                ⏳ Registration closes:
                                ${formatDate(
                                    event.registrationDeadline
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
                            class="event-btn"
                        >
                            Register / View Event →
                        </a>
                    `

                    : `
                        <span class="event-btn">
                            Registration details unavailable
                        </span>
                    `
                }


            </div>

        `;


        container.appendChild(card);

    });

}


// ============================
// SEARCH + FILTER
// ============================

function filterEvents() {

    const search =
        searchInput.value
            .toLowerCase()
            .trim();


    const type =
        typeFilter.value;


    const filtered =
        events.filter(event => {

            const matchesSearch =

                (event.title || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (event.description || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (event.organizer || "")
                    .toLowerCase()
                    .includes(search);


            const matchesType =
                type === "all" ||
                event.type === type;


            return (
                matchesSearch &&
                matchesType
            );

        });


    displayEvents(filtered);

}


searchInput.addEventListener(
    "input",
    filterEvents
);


typeFilter.addEventListener(
    "change",
    filterEvents
);


// ============================
// DATE FORMAT
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
// BASIC HTML ESCAPING
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

loadEvents();
