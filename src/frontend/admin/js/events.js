const API = window.CollegeBuddyAPI.baseUrl;


const form =
    document.getElementById("eventForm");

const eventId =
    document.getElementById("eventId");

const eventsList =
    document.getElementById("eventsList");

const eventCount =
    document.getElementById("eventCount");

const submitBtn =
    document.getElementById("submitBtn");

const cancelBtn =
    document.getElementById("cancelBtn");

const formTitle =
    document.getElementById("formTitle");

const message =
    document.getElementById("eventMessage");


let events = [];


// ============================
// GET EVENTS
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
                "Failed to load events"
            );

        }


        events =
            data.events || [];


        displayEvents();

    } catch (err) {

        console.error(err);

        eventsList.innerHTML = `
            <div class="error">
                ${err.message}
            </div>
        `;

    }

}


// ============================
// DISPLAY
// ============================

function displayEvents() {

    eventCount.textContent =
        events.length;


    if (events.length === 0) {

        eventsList.innerHTML = `
            <div class="empty">
                No events created yet.
            </div>
        `;

        return;
    }


    eventsList.innerHTML = "";


    events.forEach(event => {

        const card =
            document.createElement("div");

        card.className =
            "admin-event-card";


        card.innerHTML = `

            ${
                event.imageUrl

                ? `
                    <img
                        src="${event.imageUrl}"
                        alt="${event.title}"
                    >
                `

                : ""
            }


            <div class="admin-event-content">

                <div class="event-card-top">

                    <span class="event-type">
                        ${event.type}
                    </span>

                </div>


                <h3>
                    ${event.title}
                </h3>


                <p>
                    ${
                        event.description ||
                        "No description"
                    }
                </p>


                <div class="event-meta">

                    📅
                    ${
                        event.eventDate
                            ? formatDate(event.eventDate)
                            : "No date"
                    }

                </div>


                <div class="event-meta">

                    📍
                    ${
                        event.location ||
                        "Location not specified"
                    }

                </div>


                <div class="event-actions">

                    <button
                        class="edit-btn"
                        onclick="editEvent('${event._id}')"
                    >
                        Edit
                    </button>


                    <button
                        class="delete-btn"
                        onclick="deleteEvent('${event._id}')"
                    >
                        Delete
                    </button>

                </div>

            </div>

        `;


        eventsList.appendChild(card);

    });

}


// ============================
// CREATE / UPDATE
// ============================

form.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();


        const id =
            eventId.value;


        const eventData = {

            title:
                document.getElementById(
                    "title"
                ).value.trim(),

            description:
                document.getElementById(
                    "description"
                ).value.trim(),

            organizer:
                document.getElementById(
                    "organizer"
                ).value.trim(),

            type:
                document.getElementById(
                    "type"
                ).value,

            eventDate:
                document.getElementById(
                    "eventDate"
                ).value,

            registrationDeadline:
                document.getElementById(
                    "registrationDeadline"
                ).value || null,

            location:
                document.getElementById(
                    "location"
                ).value.trim(),

            registrationUrl:
                document.getElementById(
                    "registrationUrl"
                ).value.trim(),

            imageUrl:
                document.getElementById(
                    "imageUrl"
                ).value.trim()

        };


        try {

            submitBtn.disabled = true;


            let response;


            // UPDATE
            if (id) {

                response = await fetch(
                    `${API}/events/${id}`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials: "include",

                        body:
                            JSON.stringify(eventData)
                    }
                );

            }

            // CREATE
            else {

                response = await fetch(
                    `${API}/events`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials: "include",

                        body:
                            JSON.stringify(eventData)
                    }
                );

            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Operation failed"
                );

            }


            message.textContent =
                id
                    ? "Event updated successfully!"
                    : "Event created successfully!";


            resetForm();

            await loadEvents();


        } catch (err) {

            console.error(err);

            message.textContent =
                err.message;

        } finally {

            submitBtn.disabled = false;

        }

    }
);


// ============================
// EDIT
// ============================

function editEvent(id) {

    const event =
        events.find(
            item => item._id === id
        );


    if (!event) {
        return;
    }


    eventId.value =
        event._id;


    document.getElementById("title").value =
        event.title || "";


    document.getElementById("description").value =
        event.description || "";


    document.getElementById("organizer").value =
        event.organizer || "";


    document.getElementById("type").value =
        event.type || "other";


    document.getElementById("eventDate").value =
        toDateTimeLocal(event.eventDate);


    document.getElementById(
        "registrationDeadline"
    ).value =
        event.registrationDeadline
            ? toDateTimeLocal(
                event.registrationDeadline
            )
            : "";


    document.getElementById("location").value =
        event.location || "";


    document.getElementById(
        "registrationUrl"
    ).value =
        event.registrationUrl || "";


    document.getElementById("imageUrl").value =
        event.imageUrl || "";


    formTitle.textContent =
        "Edit Event";


    submitBtn.textContent =
        "Update Event";


    cancelBtn.classList.remove(
        "hidden"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ============================
// DELETE
// ============================

async function deleteEvent(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this event?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const response = await fetch(
            `${API}/events/${id}`,
            {
                method: "DELETE",

                credentials: "include"
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to delete event"
            );

        }


        await loadEvents();


    } catch (err) {

        alert(err.message);

    }

}


// ============================
// CANCEL EDIT
// ============================

cancelBtn.addEventListener(
    "click",
    resetForm
);


function resetForm() {

    form.reset();

    eventId.value = "";

    formTitle.textContent =
        "Add Event";

    submitBtn.textContent =
        "Add Event";

    cancelBtn.classList.add(
        "hidden"
    );

    message.textContent = "";

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


function toDateTimeLocal(date) {

    const d =
        new Date(date);


    const pad =
        number =>
            String(number).padStart(
                2,
                "0"
            );


    return `${d.getFullYear()}-${pad(
        d.getMonth() + 1
    )}-${pad(
        d.getDate()
    )}T${pad(
        d.getHours()
    )}:${pad(
        d.getMinutes()
    )}`;

}


// ============================
// START
// ============================

loadEvents();
